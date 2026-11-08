#!/usr/bin/env python3
"""Show uncalibrated photograph swatches without turning them into ink standards.

The patch boxes are manually selected blank substrate areas in the pinned
photographs. RGB statistics describe those decoded pixels only. The script does
not white-balance, recolour, rectify, infer a print process, or assign a colour
accuracy score. Its figures are analytical displays of the original evidence.
"""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/research/bc-decal-residuals/material'
GALLERY = ROOT / 'public/bc-decal-corrections'
PATCHES = {
    '2015': [(15, 30, 35, 130), (450, 218, 500, 231), (790, 40, 808, 200)],
    '2017-nov': [(25, 80, 55, 250), (450, 264, 500, 282), (949, 80, 968, 250)],
}


def font(size):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', size)


def hex_colour(rgb):
    return '#' + ''.join(f'{round(float(channel)):02x}' for channel in rgb)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    refs = {r['id']: r for r in json.loads((ROOT / 'docs/research/decal-online-analysis/reference-manifest.json').read_text())}
    rows = []
    board = Image.new('RGB', (1500, 790), '#f3f6fa')
    draw = ImageDraw.Draw(board)
    draw.text((24, 16), 'Colour evidence: sampled photograph pixels are not a manufacturing specification', fill='#16253b', font=font(25))
    draw.text((24, 55), 'Blank substrate patches; original pixels retained. The three source swatches can differ within one photograph.', fill='#52637a', font=font(18))
    for index, (key, boxes) in enumerate(PATCHES.items()):
        image_path = GALLERY / 'evidence' / key / 'source.png'
        photo = Image.open(image_path).convert('RGB')
        photo.load()
        svg = ET.fromstring((GALLERY / 'evidence' / key / 'after.svg').read_text())
        substrate = next(node for node in svg.iter() if node.tag.endswith('}rect'))
        model = substrate.get('fill')
        y = 110 + index * 320
        draw.text((24, y), f'{key}  |  {photo.width} x {photo.height} source pixels', fill='#16253b', font=font(21))
        display = photo.copy()
        display.thumbnail((660, 245), Image.Resampling.LANCZOS)
        board.paste(display, (24, y + 34))
        scale = display.width / photo.width
        patches = []
        for number, box in enumerate(boxes, start=1):
            x0, y0, x1, y1 = box
            assert 0 <= x0 < x1 <= photo.width and 0 <= y0 < y1 <= photo.height
            pixels = np.asarray(photo.crop(box), dtype=float).reshape(-1, 3)
            median = np.median(pixels, axis=0)
            percentiles = np.percentile(pixels, (10, 90), axis=0)
            patch = {'patch': number, 'boxPixelsExclusive': list(box), 'pixels': len(pixels),
                     'medianRGB': np.rint(median).astype(int).tolist(), 'medianHex': hex_colour(median),
                     'channelP10': np.rint(percentiles[0]).astype(int).tolist(),
                     'channelP90': np.rint(percentiles[1]).astype(int).tolist()}
            patches.append(patch)
            shown = (24 + x0 * scale, y + 34 + y0 * scale, 24 + x1 * scale, y + 34 + y1 * scale)
            draw.rectangle(shown, outline='white', width=2)
            draw.text((shown[0] + 2, shown[1] + 2), str(number), fill='#16253b', stroke_width=1, stroke_fill='white', font=font(17))
            x = 720 + (number - 1) * 185
            draw.rectangle((x, y + 46, x + 155, y + 130), fill=patch['medianHex'])
            draw.text((x, y + 139), f'Patch {number}: {patch["medianHex"]}', fill='#16253b', font=font(16))
            draw.text((x, y + 165), 'RGB ' + str(patch['medianRGB']), fill='#52637a', font=font(14))
        draw.rectangle((1285, y + 46, 1455, y + 130), fill=model)
        draw.text((1285, y + 139), 'Model: ' + model, fill='#16253b', font=font(16))
        draw.text((720, y + 210), 'Existing model palette retained; no white-balance target or measured ink sample.', fill='#52637a', font=font(16))
        rows.append({'id': key, 'source': refs[key]['source'], 'sourceStatus': refs[key]['sourceStatus'],
                     'sourcePixels': list(photo.size), 'pinnedCropSha256': hashlib.sha256(image_path.read_bytes()).hexdigest(),
                     'modelBackground': model, 'patches': patches,
                     'decision': 'Retain the approximate palette. Photograph RGB is not calibrated material colour.'})
    draw.text((24, 754), 'Source photographs: BCpl8s. Patch boxes and hashes are recorded in colour-observations.json. No texture or colour correction applied.', fill='#52637a', font=font(16))
    board.save(OUTPUT / 'colour-observations.png', optimize=True)
    record = {'schema': 'plateforge.decal-material-observations/v1', 'reviewedOn': '2026-11-07',
              'measurement': 'Decoded RGB medians and 10th/90th channel percentiles in manually selected blank substrate patches.',
              'interpretation': 'Photographic pixel observations only; not measured reflectance, calibrated sRGB appearance, Pantone, CMYK, or a historical manufacturing specification.',
              'sources': rows}
    (OUTPUT / 'colour-observations.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps({'sources': len(rows), 'patches': sum(len(row['patches']) for row in rows), 'paletteChanged': False}))


if __name__ == '__main__':
    main()
