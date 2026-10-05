#!/usr/bin/env python3
"""Outline the three fixed collector inscriptions from the user-supplied Harrington Regular TTF.

Usage: python scripts/build-collector-harrington.py /path/to/HARNGTON.TTF
All glyphs retain native advances, side bearings and overshoots under one H-cap scale.
Only fixed-word artwork is generated; the font software is not bundled.
"""
import json
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen

font = TTFont(sys.argv[1])
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
bound = BoundsPen(glyphs)
glyphs[cmap[ord('H')]].draw(bound)
scale = 100 / bound.bounds[3]
result = {}
for char in sorted(set('CollectorBritishColumbia')):
    glyph = glyphs[cmap[ord(char)]]
    pen = SVGPathPen(glyphs)
    rounded = RoundingPen(pen, roundFunc=lambda n: round(n, 3))
    glyph.draw(TransformPen(rounded, (scale, 0, 0, -scale, 0, 100)))
    result[char] = {'advance': round(glyph.width * scale, 3), 'fill': True, 'paths': [pen.getCommands()]}
target = Path(__file__).resolve().parent.parent / 'src/templates/dies/collector-harrington.json'
target.write_text(json.dumps(result, indent=2) + '\n')
