#!/usr/bin/env python3
"""Outline the fixed XV COMMONWEALTH GAMES legend from the supplied Times BoldItalic font.
Usage: python scripts/build-commonwealth-times.py /path/to/Times-BoldItalic.ttf
For the decal: add 'VICTORIA B.C.' commonwealth-helvetica.json after its font path.
Only fixed-word outlines are retained. Original font software is not bundled.
"""
import json,sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
font=TTFont(sys.argv[1]);glyphs=font.getGlyphSet();cmap=font.getBestCmap();bounds=BoundsPen(glyphs);glyphs[cmap[ord('H')]].draw(bounds);scale=100/bounds.bounds[3];result={}
word=sys.argv[2] if len(sys.argv)>2 else 'XV COMMONWEALTH GAMES'
filename=sys.argv[3] if len(sys.argv)>3 else 'commonwealth-times.json'
for char in sorted(set(word)):
 glyph=glyphs[cmap[ord(char)]];pen=SVGPathPen(glyphs);glyph.draw(TransformPen(RoundingPen(pen,roundFunc=lambda x:round(x,3)),(scale,0,0,-scale,0,100)));result[char]={'advance':round(glyph.width*scale,3),'fill':True,'paths':[pen.getCommands()]}
(Path(__file__).resolve().parents[1]/'src/templates/dies'/filename).write_text(json.dumps(result,indent=2)+'\n')
