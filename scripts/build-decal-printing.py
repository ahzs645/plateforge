#!/usr/bin/env python3
"""Portable printing candidates; supplied Helvetica + URW outline subsets, not recovered print masters."""
import json,hashlib
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
root=Path(__file__).resolve().parents[1]
import sys
archive=Path(sys.argv[1])
with ZipFile(archive) as z:
 names=[n for n in z.namelist() if n.lower().endswith('.otf') and not n.startswith('__MACOSX')]
 assert len(names)==1
 helvetica=z.read(names[0])
specs=[('heavy-month',helvetica,.72),('heavy-year',helvetica,.72),('heavy-month-wide',helvetica,1.0),('heavy-year-wide',helvetica,.90),
 ('normal','/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf',1),
 ('regular','/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf',1),
 ('control','/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Regular.otf',1),
 ('control-bold','/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf',1),
 ('vertical-province','/usr/share/fonts/opentype/urw-base35/NimbusRoman-Bold.otf',1)]
result={};sources=[]
for name,src,xscale in specs:
 data=src if isinstance(src,bytes) else Path(src).read_bytes()
 font=TTFont(BytesIO(data));gs=font.getGlyphSet();cmap=font.getBestCmap();bounds=BoundsPen(gs);gs[cmap[ord('H')]].draw(bounds)
 cap=bounds.bounds[3];s=100/cap;glyphs={}
 chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .'
 for char in chars:
  g=gs[cmap[ord(char)]];pen=SVGPathPen(gs)
  g.draw(TransformPen(RoundingPen(pen,roundFunc=lambda v:round(v,3)),(s*xscale,0,0,-s,0,100)))
  glyphs[char]={'advance':round(g.width*s*xscale,3),'fill':True,'paths':[pen.getCommands()]}
 result[name]=glyphs
 sources.append({'profile':name,'postscriptName':font['name'].getDebugName(6),'sha256':hashlib.sha256(data).hexdigest(),'horizontalConstruction':xscale,'capUnits':cap,'notes':'Width reconstruction on supplied curves; no historical font attribution.' if xscale!=1 else 'Native supplied-font curves; candidate printing, not recovered historical font.' if isinstance(src,bytes) else 'Native open-font outlines; candidate printing, not recovered historical font.'})
(root/'src/templates/dies/decal-printing.json').write_text(json.dumps(result,indent=2)+'\n')
out=root/'docs/research/decal-review';out.mkdir(parents=True,exist_ok=True)
(out/'printing-provenance.json').write_text(json.dumps({'date':'2026-10-06','sources':sources,'fontSoftwareBundled':False},indent=2)+'\n')
print(json.dumps({'profiles':len(specs),'glyphsPerProfile':len(chars)}))
