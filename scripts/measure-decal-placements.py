"""Compare manually isolated source ink with a renderer's visual bounds.

This measures image-space extents, not rectified physical dimensions. Source
regions deliberately exclude adjacent roles and are retained in the output.
"""
from pathlib import Path
import argparse
import hashlib
import json

import numpy as np
from PIL import Image
from scipy import ndimage

REGIONS = [
    ('1983', 'decal-month', 0, [.035, .09, .39, .86], 'light'),
    ('2004', 'decal-month', 0, [.18, .08, .525, .93], 'dark'),
    ('2004', 'decal-year', 0, [.65, .07, .84, .70], 'dark'),
    ('2004', 'decal-legend', 0, [.54, .38, .65, .49], 'dark'),
    ('2004', 'decal-legend', 1, [.52, .49, .66, .60], 'dark'),
    ('2004', 'decal-serial', 0, [.57, .74, .85, .98], 'dark'),
    ('2011', 'decal-month', 0, [.035, .04, .47, .66], 'dark'),
    ('2013', 'decal-month', 0, [.035, .03, .38, .67], 'dark'),
]


def observed_bounds(image, region, polarity):
    scale = np.array([image.width, image.height, image.width, image.height])
    region_pixels = np.round(np.array(region) * scale).astype(int)
    values = ndimage.gaussian_filter(np.asarray(image.crop(tuple(region_pixels)), dtype=float), .35)
    lo, hi = np.percentile(values, [15, 85])
    for _ in range(20):
        threshold = (lo + hi) / 2
        lower, upper = values[values < threshold], values[values >= threshold]
        if lower.size:
            lo = lower.mean()
        if upper.size:
            hi = upper.mean()
    mask = values > threshold if polarity == 'light' else values < threshold
    labels, _ = ndimage.label(mask)
    sizes = np.bincount(labels.ravel())
    keep = sizes >= max(2, round(mask.size * .0005))
    keep[0] = False
    yy, xx = np.where(keep[labels])
    if not xx.size:
        raise ValueError('No source ink in the declared region')
    box = np.array([xx.min(), yy.min(), xx.max() + 1, yy.max() + 1])
    box += np.array([region_pixels[0], region_pixels[1]] * 2)
    return box.tolist(), (box / scale).round(4).tolist(), region_pixels.tolist()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--evidence-dir', type=Path, required=True)
    parser.add_argument('--metadata', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    metadata = json.loads(args.metadata.read_text())
    records = {r['id']: r for r in metadata['specimens']}
    result = []
    for key, role, occurrence, region, polarity in REGIONS:
        path = args.evidence_dir / key / 'source.png'
        image = Image.open(path).convert('L')
        pixels, bounds, roi_pixels = observed_bounds(image, region, polarity)
        record = records[key]
        run = next(r for r in record['runs'] if r['role'] == role and r['index'] == occurrence)
        scale = np.array(record['viewBox'] * 2)
        result.append({
            'id': key, 'role': role, 'occurrence': occurrence,
            'sourceRegion': region, 'sourceRegionPixels': roi_pixels,
            'sourceInkBoundsPixels': pixels, 'sourceBounds': bounds,
            'modelBounds': (np.array(run['box']) / scale).round(4).tolist(),
            'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'modelSvgSha256': record['svgSha256'],
            'polarity': polarity,
            'limitations': 'Unrectified photograph; approximate whole-run ink extent. Inspect the declared region before using these values.',
        })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
