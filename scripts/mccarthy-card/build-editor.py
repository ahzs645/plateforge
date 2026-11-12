#!/usr/bin/env python3
"""Assemble the offline calling-card editor from reviewed local inputs."""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public/stationery/grace-mccarthy'
EVIDENCE = ROOT / 'docs/research/grace-mccarthy-card'


def data_url(path):
    suffix = path.suffix.lower()
    mime = 'image/png' if suffix == '.png' else 'image/jpeg'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def safe_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')


model = json.loads((PUBLIC / 'model.json').read_text())
assets = {'referenceDataUrl': data_url(PUBLIC / 'reference.png'),
          'referenceOutline': (PUBLIC / 'card-outlined.svg').read_text(),
          'comparisons': []}
for name, alt in [('font-study-comparison.png', 'Source-informed study cuts compared with the photographed lettering'),
                  ('font-study-overlays.png', 'Source and study ink overlays with overlap measurements'),
                  ('font-candidates-name.png', 'Name compared in seven open script typefaces at equal ink height')]:
    path = EVIDENCE / name
    if path.exists():
        assets['comparisons'].append({'dataUrl': data_url(path), 'alt': alt})
html = (HERE / 'editor.template.html').read_text()
for key, value in {
    '/*__EDITOR_CSS__*/': (HERE / 'editor.css').read_text(),
    '/*__CARD_MODEL__*/': safe_json(model),
    '/*__CARD_ASSETS__*/': safe_json(assets),
    '/*__EDITOR_JS__*/': (HERE / 'editor.js').read_text(),
}.items():
    if html.count(key) != 1:
        raise ValueError('Missing or duplicate template token: ' + key)
    html = html.replace(key, value)
(PUBLIC / 'index.html').write_text(html)
print(json.dumps({'file': str(PUBLIC / 'index.html'), 'bytes': len(html.encode()),
                  'fonts': len(model['fonts']), 'comparisons': len(assets['comparisons'])}))
