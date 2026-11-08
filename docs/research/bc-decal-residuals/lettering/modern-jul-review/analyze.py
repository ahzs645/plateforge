#!/usr/bin/env python3
"""Existing local photographs and existing native contours; equal painted height only."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import importlib.util
import json
import hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
spec = importlib.util.spec_from_file_location('lettering_audit', HERE.parent / 'analyze.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
S = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
CASES = [
    {'id': '2021-pinned', 'file': 'public/bc-decal-corrections/evidence/2021/source.png', 'roi': [12, 10, 92, 62], 'primary': True},
    {'id': '2018-56309500', 'file': 'docs/research/bc-decal-residuals/modern/sources/2018-56309500.jpg', 'roi': [17, 9, 99, 60]},
    {'id': '2019-16740833', 'file': 'docs/research/bc-decal-residuals/modern/sources/2019-16740833.jpg', 'roi': [11, 13, 88, 62]},
]

def model(key, text='JUL'):
    return audit.trim(Image.open(HERE / 'rendered' / f'{key}--{text}.png').getchannel('A'))

def component_metrics(mask):
    a = np.asarray(mask) > 128
    lab, _ = ndimage.label(a)
    components = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None: continue
        y, x = sl
        if y.stop - y.start < .6 * mask.height: continue
        components.append({'box': [x.start, y.start, x.stop, y.stop], 'widthPerRunHeight': (x.stop - x.start) / mask.height})
    components.sort(key=lambda c: c['box'][0])
    return {'components': components, 'gapPerRunHeight': [(b['box'][0] - a['box'][2]) / mask.height for a,b in zip(components,components[1:])]}

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(audit.rasterize, (HERE / 'rendered').glob('*.svg')))
    manifest = json.loads((HERE / 'rendered/manifest.json').read_text())
    keys = [r['key'] for r in manifest if r['text'] == 'JUL']
    metrics = []
    source_masks = {}
    for case in CASES:
        p = ROOT / case['file']
        photo = Image.open(p).convert('RGB')
        crop = photo.crop(case['roi'])
        mask, boxes, labels, threshold, sensitivity, central = audit.source_mask(crop, False)
        source = audit.trim(mask)
        folder = HERE / 'evidence' / case['id']
        folder.mkdir(parents=True, exist_ok=True)
        crop.save(folder / 'source-crop.png')
        mask.save(folder / 'source-mask.png')
        source_masks[case['id']] = source
        valid = [s for s in sensitivity if s['accepted']]
        stable = all(s['accepted'] and s['components'] == 3 for s in sensitivity)
        row = {**case, 'sourceSha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'pixels': list(photo.size), 'sourcePaintedPixels': list(source.size), 'sourceWidthPerHeight': audit.ratio(source), 'threshold': threshold, 'thresholdValidation': central, 'sensitivity': sensitivity, 'glyphSegmentationAccepted': stable, 'sourceComponents': component_metrics(source) if stable else None, 'candidates': []}
        for key in keys:
            m = model(key)
            c = {'key': key, 'widthPerHeight': audit.ratio(m), 'widthRatio': audit.ratio(m)/audit.ratio(source), 'widthRatioSensitivityRange': [min(audit.ratio(m)/s['widthPerHeight'] for s in valid),max(audit.ratio(m)/s['widthPerHeight'] for s in valid)], 'modelComponents': component_metrics(m)}
            if stable:
                c['glyphWidthRatios'] = []
                for char, b in zip('JUL', boxes):
                    g = audit.trim(mask.crop(b))
                    gm = model(key, char)
                    c['glyphWidthRatios'].append({'character': char, 'sourceWidthPerHeight': audit.ratio(g), 'modelWidthPerHeight': audit.ratio(gm), 'ratio': audit.ratio(gm)/audit.ratio(g)})
            row['candidates'].append(c)
        metrics.append(row)
    (HERE / 'metrics.json').write_text(json.dumps({'registration': 'Uniform equal painted height and horizontal centre. Original width retained. No x scaling, perspective correction, new glyph paths or score-driven contour fitting.', 'sources': metrics, 'renderedRuns': len(manifest), 'allRunsNatural': all(r['fit'] == 'natural' for r in manifest)}, indent=2) + '\n')
    primary = metrics[0]
    source = source_masks[primary['id']]
    board = Image.new('RGB', (1320, 120 + 8 * 250), '#f1f4f8')
    d = ImageDraw.Draw(board)
    d.text((20, 16), '2021 JUL — existing native outline candidates', font=F, fill='#17243a')
    d.text((20, 51), 'Magenta: source only · Blue: model only · Dark: overlap · Equal painted height; original width retained', font=S, fill='#334155')
    for i, c in enumerate([c for c in primary['candidates'] if c['key'] != 'anton-jul-spaced']):
        x = 20 + (i % 2)*650; y = 115 + (i // 2)*250
        d.text((x,y), f"{c['key']} — width/source {c['widthRatio']:.3f}", font=F, fill='#17243a')
        overlay = audit.compare(source, model(c['key']), 160)
        board.paste(overlay, (x + (600-overlay.width)//2, y+36))
    board.save(HERE / 'native-candidates.png')
    focus = Image.new('RGB', (1320, 115 + 3 * 310), '#f1f4f8')
    d = ImageDraw.Draw(focus)
    d.text((20, 15), 'JUL — retained construction versus native Anton with observed pair spacing', font=F, fill='#17243a')
    d.text((20, 49), 'Equal painted height; width preserved. Magenta: source only · Blue: model only · Dark: overlap', font=S, fill='#334155')
    for i, row in enumerate(metrics):
        y = 115 + i*310
        d.text((20, y), row['id'], font=F, fill='#17243a')
        crop = Image.open(HERE / 'evidence' / row['id'] / 'source-crop.png')
        crop = crop.resize((crop.width*3, crop.height*3), Image.Resampling.NEAREST)
        focus.paste(crop, (20, y+40))
        d.text((20,y+215), 'Existing source crop', font=S, fill='#334155')
        for j,key in enumerate(['retained','anton-jul-spaced']):
            x = 400+j*450
            result = next(c for c in row['candidates'] if c['key'] == key)
            overlay = audit.compare(source_masks[row['id']], model(key), 170)
            focus.paste(overlay, (x+(420-overlay.width)//2, y+35))
            d.text((x, y), 'Retained' if j == 0 else 'Native Anton + JU/UL spacing', font=F, fill='#17243a')
            d.text((x,y+245), f"Width/source {result['widthRatio']:.3f}; threshold range " + '–'.join(f'{v:.3f}' for v in result['widthRatioSensitivityRange']), font=S, fill='#334155')
    focus.save(HERE / 'before-after.png')
    print(json.dumps([{'id': r['id'], 'sourceRatio': r['sourceWidthPerHeight'], 'validThresholds': sum(s['accepted'] for s in r['sensitivity']), 'segmentation': r['glyphSegmentationAccepted'], 'candidates': [{'key': c['key'], 'ratio': round(c['widthRatio'], 4)} for c in r['candidates']]} for r in metrics], indent=2))
