#!/usr/bin/env bash
# Rebuild src/templates/dies/traced-1940.ts from the cached photos.
# Needs Python 3 with: numpy pillow scipy potracer   (pip install numpy pillow scipy potracer)
set -euo pipefail
cd "$(dirname "$0")"
[ -d .cache/plates ] && [ -d .cache/tin ] || ./fetch.sh
python3 extract.py .cache/plates
python3 merge.py
python3 strip.py .cache/ref
python3 tabs.py .cache/ref
python3 vectorize.py '{"serial": ["serial-4051", "0123456789"], "serialLetters": ["serial-all", "ABF"],
  "legend": ["legend-all", "BRITSHCOLUMA"], "year": ["year-all", "0123456789"], "year52": ["year52-all", "52"],
  "strip": ["strip-all", "BRITSHCOLUMA51", 4.0], "tab": ["tab-all", "534", 3.0]}'
python3 tin.py .cache/tin
python3 vectorize.py '{"macdonald": ["serial-macdonald", "0123456789", 3.2], "tacey": ["serial-tacey", "0123456789", 4.0]}' out/traced-tin.json
python3 series.py series/1930.json
python3 vectorize.py '{"serial": ["thompson-1930-serial", "012345679", 3.0], "legend": ["thompson-1930-legend", "BRITSHCOLUMA", 3.0]}' out/traced-1930.json
python3 dates.py .cache/dates
python3 vectorize.py "$(python3 -c "import json; c = json.load(open('out/date-counts.json')); print(json.dumps({f'date{y}': [f'date-{y}', ''.join(sorted(d)), 4.0 if min(d.values()) <= 3 else 2.5] for y, d in c.items()}))")" out/traced-dates.json
python3 emit.py ../../src/templates/dies/traced-1940.ts
echo "wrote src/templates/dies/traced-1940.ts (averaged bitmaps are in out/)"
