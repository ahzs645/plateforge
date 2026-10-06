#!/usr/bin/env python3
"""Native, open-font outline candidates for the individual decal typography review."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
import json, hashlib
root=Path(__file__).resolve().parents[1]
result={}; sources=[]
fonts=[('condensed-medium',root/'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff'),('condensed-bold',root/'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff')]
for name,path in fonts:
    data=path.read_bytes(); font=TTFont(path); gs=font.getGlyphSet(); cmap=font.getBestCmap()
    bounds=BoundsPen(gs); gs[cmap[ord('H')]].draw(bounds); s=100/bounds.bounds[3]; glyphs={}
    for char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .':
        glyph=gs[cmap[ord(char)]]; pen=SVGPathPen(gs)
        glyph.draw(TransformPen(RoundingPen(pen,roundFunc=lambda v:round(v,3)),(s,0,0,-s,0,100)))
        glyphs[char]={'advance':round(glyph.width*s,3),'fill':True,'paths':[pen.getCommands()]}
    result[name]=glyphs
    sources.append({'profile':name,'postscriptName':font['name'].getDebugName(6),'sha256':hashlib.sha256(data).hexdigest(),'horizontalConstruction':1,'notes':'Native open-font outlines; visual candidate, historical font identity unconfirmed.'})
(root/'src/templates/dies/decal-audit-printing.json').write_text(json.dumps(result,indent=2)+'\n')
folder=root/'docs/research/decal-typography'; folder.mkdir(exist_ok=True)
(folder/'printing-provenance.json').write_text(json.dumps({'sources':sources,'fontSoftwareBundled':False},indent=2)+'\n')
