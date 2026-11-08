"""Check actual SVG painted bounds for all selectable catalogue/month combinations.

Inkscape's visual bounding boxes include filled-stroke expansion. This independent
SVG check does not claim browser, editor interaction or PNG-export verification.
The existing verify-decal-typography.py remains the browser check.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET


def inspect_fixture(fixture, directory):
    document = ET.fromstring(fixture['svg'])
    view_box = [float(value) for value in document.attrib['viewBox'].split()]
    width, height = view_box[2:]
    elements = []
    reasons = []
    for element in document.iter():
        role = element.get('data-role')
        if 'data-die' not in element.attrib and role != 'decal-barcode':
            continue
        identifier = f"audit-run-{len(elements)}"
        element.set('id', identifier)
        row = {'id': identifier, 'role': role, 'text': element.get('aria-label'),
               'profile': element.get('data-die'), 'fit': element.get('data-fit')}
        if 'data-die' in element.attrib:
            characters = ''.join(child.get('data-character', '') for child in element.iter())
            if characters != row['text']:
                reasons.append({'type': 'glyph-text-mismatch', 'run': row, 'glyphs': characters})
        elif element.get('data-control') != fixture['control']:
            reasons.append({'type': 'barcode-control-mismatch', 'run': row})
        elements.append(row)
    path = directory / f"{fixture['id']}-{fixture['month']}.svg"
    ET.ElementTree(document).write(path, encoding='utf-8', xml_declaration=True)
    output = subprocess.run(['inkscape', str(path), '--query-all'], check=True,
                            capture_output=True, text=True).stdout
    boxes = {}
    for line in output.splitlines():
        fields = line.split(',')
        if len(fields) == 5 and fields[0].startswith('audit-run-'):
            boxes[fields[0]] = list(map(float, fields[1:]))
    for row in elements:
        if row['id'] not in boxes:
            reasons.append({'type': 'missing-painted-run', 'run': row})
            continue
        x, y, w, h = boxes[row['id']]
        row.update(x=x, y=y, width=w, height=h, right=x+w, bottom=y+h)
        if w <= 0 or h <= 0 or x < -.5 or y < -.5 or x+w > width+.5 or y+h > height+.5:
            reasons.append({'type': 'painted-bounds', 'run': row})
    for index, first in enumerate(elements):
        for second in elements[index+1:]:
            if 'x' not in first or 'x' not in second:
                continue
            dx = min(first['right'], second['right']) - max(first['x'], second['x'])
            dy = min(first['bottom'], second['bottom']) - max(first['y'], second['y'])
            if dx > .6 and dy > .6:
                reasons.append({'type': 'painted-box-overlap', 'first': first['text'],
                                'second': second['text'], 'width': round(dx, 4), 'height': round(dy, 4)})
    for row in elements:
        if row['role'] != 'decal-month':
            continue
        minimum = {('2014', 'NOV'): 54, ('2023', 'MAR'): 44}.get((fixture['id'], fixture['month']))
        if minimum and row.get('height', 0) < minimum:
            reasons.append({'type': 'month-below-source-supported-height', 'minimum': minimum, 'run': row})
        if fixture['id'] in ('1998-type-ii', '1999') and fixture['month'] == 'MAY' and row['fit'] != 'natural':
            reasons.append({'type': 'MAY-maximum-width-reduction', 'run': row})
    return {'id': fixture['id'], 'month': fixture['month'], 'control': fixture['control'],
            'svgSha256': hashlib.sha256(fixture['svg'].encode()).hexdigest(),
            'width': width, 'height': height, 'runs': elements, 'failures': reasons}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixtures', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    fixtures = json.loads(args.fixtures.read_text())
    with tempfile.TemporaryDirectory(prefix='plateforge-decal-ink-') as folder:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            rows = list(pool.map(lambda fixture: inspect_fixture(fixture, Path(folder)), fixtures))
    failures = [{'id': row['id'], 'month': row['month'], 'failures': row['failures']}
                for row in rows if row['failures']]
    result = {
        'schema': 'plateforge.decal-ink-verification/v1',
        'backend': subprocess.run(['inkscape', '--version'], check=True, capture_output=True, text=True).stdout.strip(),
        'method': 'SVG visual bounding boxes, including stroke; no independent x scaling or browser claims.',
        'fixturesSha256': hashlib.sha256(args.fixtures.read_bytes()).hexdigest(),
        'renderings': len(rows), 'catalogueVariants': len({row['id'] for row in rows}),
        'failures': failures, 'rows': rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps({'renderings': len(rows), 'catalogueVariants': result['catalogueVariants'],
                      'failureCount': len(failures), 'failures': failures, 'report': str(args.output)}, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == '__main__':
    main()
