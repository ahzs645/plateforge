#!/usr/bin/env python3
"""Fail if numeral completion has rewritten a pre-existing observed contour."""
import hashlib,json
from pathlib import Path
D=Path(__file__).resolve().parent
original=json.loads((D/'observed-path-baseline.json').read_text());data={}
for r in original:
 if r['file'] not in data:data[r['file']]={s['id']:s for s in json.loads((D/r['file']).read_text())}
for r in original:
 s=data[r['file']][r['profile']];glyphs=s['glyphs'] if r['role']=='main' else s['roles'][r['role']]['glyphs']
 g=next(g for g in glyphs if g['character']==r['character'])
 assert g.get('provenance','observed')=='observed', r
 assert hashlib.sha256(g['path'].encode()).hexdigest()==r['pathSha256'], r
print(f'PASS: all {len(original)} pre-existing observed glyph paths and observed provenance are unchanged.')
