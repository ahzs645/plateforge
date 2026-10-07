#!/usr/bin/env python3
"""Extract native outlines for comparison only; do not trace photographic contours."""
import json,hashlib,sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
root=Path(__file__).resolve().parents[1];cache=Path(sys.argv[1]);out=root/'docs/research/decal-glyph-analysis';out.mkdir(exist_ok=True)
sources=json.loads((cache.parent/'font-sources.json').read_text());profiles={};provenance=[]
for source in sources:
 path=cache/(source['name']+'.ttf');data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==source['sha256']
 weights=[300,400,500,600,700] if source['name']=='Oswald' else [400,600,700,900] if source['name']=='RobotoCondensed' else [400,600,700] if source['name']=='ArchivoNarrow' else [400]
 for weight in weights:
  font=TTFont(path)
  if 'fvar' in font:font=instantiateVariableFont(font,{'wght':weight},inplace=True)
  gs=font.getGlyphSet();cmap=font.getBestCmap();bounds=BoundsPen(gs);gs[cmap[ord('H')]].draw(bounds);s=100/bounds.bounds[3];glyphs={}
  for char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .':
   g=gs[cmap[ord(char)]];pen=SVGPathPen(gs);g.draw(TransformPen(RoundingPen(pen,roundFunc=lambda v:round(v,3)),(s,0,0,-s,0,100)));glyphs[char]={'advance':round(g.width*s,3),'fill':True,'paths':[pen.getCommands()]}
  id=source['name'].lower()+'-'+str(weight);profiles[id]=glyphs
  provenance.append({**source,'profile':id,'weight':weight,'horizontalScale':1,'usage':'comparison candidate, not historical identification','license':'SIL Open Font License 1.1; Google Fonts source','licenseUrl':source['url'].rsplit('/',1)[0]+'/OFL.txt'})
(out/'candidate-outlines.json').write_text(json.dumps(profiles,indent=2)+'\n');(out/'candidate-provenance.json').write_text(json.dumps({'profiles':provenance,'fontSoftwareBundled':False,'nativeOutlines':True},indent=2)+'\n')
