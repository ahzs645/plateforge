"""Extract fixed native open-font candidates for the photographed printed roles.
Requires fontTools and URW Base35 OTFs; no font software is copied to the app.
"""
import json,hashlib
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
root=Path(__file__).resolve().parents[1]
specs=[('apec-sticker','URWGothic-Book.otf','CANADA 1997'),('apec-caption','URWGothic-Demi.otf','VancouverBritish ColumbiaCANADACanadaNov. 19 - 25 1997'),('carrier-province','NimbusRoman-Bold.otf','BRITISH COLUMBIA'),('carrier-class','NimbusSans-Bold.otf','PASSENGER CARRIER'),('collector-multi','NimbusRoman-Bold.otf','MULTI-VEHICLE'),('federal-country','NimbusSansNarrow-Bold.otf','CANADA'),('federal-serial','NimbusSansNarrow-Bold.otf','0123456789')]
result={};sources=[]
for name,file,chars in specs:
 p=Path('/usr/share/fonts/opentype/urw-base35')/file;f=TTFont(p);gs=f.getGlyphSet();cmap=f.getBestCmap();b=BoundsPen(gs);gs[cmap[ord('H')]].draw(b);s=100/b.bounds[3];out={}
 for c in sorted(set(chars)):
  g=gs[cmap[ord(c)]];pen=SVGPathPen(gs);g.draw(TransformPen(RoundingPen(pen,roundFunc=lambda v:round(v,3)),(s,0,0,-s,0,100)));out[c]={'advance':round(g.width*s,3),'fill':True,'paths':[pen.getCommands()]}
 result[name]=out;sources.append({'profile':name,'file':file,'font':f['name'].getDebugName(6),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'nativeCapUnits':b.bounds[3],'method':'Native glyph outlines/advances; only uniform cap scaling and explicit run spacing. A visual candidate, not historical typeface attribution.'})
(root/'src/templates/dies/bc-correction-fonts.json').write_text(json.dumps(result,indent=2)+'\n')
(root/'docs/research/bc-visual-corrections/font-provenance.json').write_text(json.dumps({'license':'URW Base35, AGPL-3.0 with font exception; see ../decal-review/URW-NOTICES.txt','fontSoftwareBundled':False,'sources':sources},indent=2)+'\n')
