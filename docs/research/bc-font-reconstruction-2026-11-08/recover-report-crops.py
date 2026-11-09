"""Verify/recover exact modern source crops from the archived report's SVGs.
The pixels must match the downloaded originals exactly; no contour tracing.
Run from the repository root with Python 3, Pillow and numpy.
"""
import base64
import io
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image

STUDY = Path('docs/research/bc-font-reconstruction-2026-11-08')
ARCHIVE = Path('public/bc-font-reconstruction-archive')
manifest = json.loads((ARCHIVE / 'manifest.json').read_text())
records = []
for i in range(2, 20):
    asset = next(a for a in manifest['assets'] if a['occurrence'] == i + 1)
    root = ET.fromstring((ARCHIVE / asset['path']).read_text())
    attrs = next(e.attrib for e in root.iter() if e.tag.rsplit('}', 1)[-1] == 'image')
    href = attrs.get('href') or attrs.get('{http://www.w3.org/1999/xlink}href')
    crop = np.asarray(Image.open(io.BytesIO(base64.b64decode(href.split(',', 1)[1]))).convert('RGB'))
    source = ['modern-u', 'modern-y', 'modern-z'][(i - 2) // 6]
    original = np.asarray(Image.open(STUDY / 'sources' / (source + '.jpg')).convert('RGB'))
    height, width = crop.shape[:2]
    matches = []
    for y, x in np.argwhere(np.all(original == crop[0, 0], axis=2)):
        if y + height <= original.shape[0] and x + width <= original.shape[1] and np.array_equal(original[y:y + height, x:x + width], crop):
            matches.append([int(x), int(y), int(x + width), int(y + height)])
    assert len(matches) == 1, f'{source} occurrence {i}: crop must match one original rectangle'
    scale = float(attrs['width']) / width
    records.append(dict(source=source, occurrence=(i - 2) % 6 + 1, svgIndex=i,
        character=root.attrib['aria-label'].split(': ')[1][0], crop=matches,
        alignmentInCrop=dict(xCenter=(74-float(attrs['x']))/scale, yTop=(20-float(attrs['y']))/scale, height=100/scale)))
(STUDY / 'recovered-modern-crops.json').write_text(json.dumps(records, indent=2)+'\n')
print(json.dumps({'verifiedExactSourceCrops': len(records)}))
