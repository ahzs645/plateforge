"""Check actual raster topology, so vector counters and joins cannot silently vanish."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
inputs = HERE / 'profile-check-inputs.json'
rows = json.loads(inputs.read_text())
results = []
with tempfile.TemporaryDirectory(prefix='plateforge-profile-topology-') as folder:
    folder = Path(folder)
    for index, row in enumerate(rows):
        svg = folder / f'{index}.svg'
        png = folder / f'{index}.png'
        svg.write_text(row['svg'])
        subprocess.run(['inkscape', str(svg), '--export-area-drawing', '--export-height=400',
                        '--export-background-opacity=0', '--export-filename=' + str(png)],
                       check=True, capture_output=True)
        alpha = np.asarray(Image.open(png).convert('RGBA').getchannel('A'))
        samples = []
        for threshold in (64, 128, 192):
            mask = alpha > threshold
            _, components = ndimage.label(mask)
            holes = ndimage.binary_fill_holes(mask) & ~mask
            _, counters = ndimage.label(holes)
            samples.append({'threshold': threshold, 'paintedComponents': components,
                            'counters': counters,
                            'passed': components == 1 and counters == row['expectedCounters']})
        results.append({'profile': row['profile'], 'character': row['character'],
                        'expectedCounters': row['expectedCounters'], 'fit': row['fit'],
                        'svgSha256': hashlib.sha256(row['svg'].encode()).hexdigest(),
                        'samples': samples,
                        'passed': row['fit'] == 'natural' and all(s['passed'] for s in samples)})
report = {'method': 'Production engine paths rasterized by Inkscape at 400 painted pixels; '
                   'connected ink and open counters checked at three alpha thresholds. '
                   'This validates topology, not historical contour accuracy.',
          'inputsSha256': hashlib.sha256(inputs.read_bytes()).hexdigest(),
          'glyphs': len(results), 'failures': [r for r in results if not r['passed']], 'rows': results}
(HERE / 'profile-topology-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'glyphs': len(results), 'failures': report['failures']}))
raise SystemExit(bool(report['failures']))
