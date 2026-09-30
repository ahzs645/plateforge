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
python3 emit.py ../../src/templates/dies/traced-1940.ts
echo "wrote src/templates/dies/traced-1940.ts (averaged bitmaps are in out/)"
