#!/usr/bin/env python3
"""Promote an already archived native candidate without altering its outlines."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'docs/research/decal-glyph-analysis/candidate-outlines.json'
profiles=json.loads(source.read_text())
provenance=json.loads((ROOT/'docs/research/decal-glyph-analysis/candidate-provenance.json').read_text())['profiles']
entry=next(p for p in provenance if p['profile']=='bebasneue-400')
assert entry['horizontalScale']==1
assert entry['sha256']=='08e4623805102d819f58601e46e345648846075e363b2ceb23313c2d1c83ec73'
target=ROOT/'src/templates/dies/decal-late-printing.json'
target.write_text(json.dumps({name:profiles[name] for name in ['bebasneue-400','oswald-400']},indent=2)+'\n')
print(target.relative_to(ROOT))
