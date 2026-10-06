#!/usr/bin/env python3
"""Reproduce native outlines; variable font axes are authored geometry, not x scaling."""
from pathlib import Path
import json,sys,urllib.request,hashlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
ROOT=Path(__file__).resolve().parents[1];work=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/plateforge-online-fonts');(work/'fonts').mkdir(parents=True,exist_ok=True);out={};prov=[]
sources=list({s['name']:s for s in json.loads((ROOT/'docs/research/decal-online-analysis/new-candidate-provenance.json').read_text())}.values())
for src in sources:
 path=work/'fonts'/(src['name']+'.ttf')
 if not path.exists():path.write_bytes(urllib.request.urlopen(src['url']).read())
 if hashlib.sha256(path.read_bytes()).hexdigest()!=src['sha256']:raise RuntimeError('Changed font '+src['name'])
for src in sources:
 name=src['name'];font=TTFont(work/'fonts'/(name+'.ttf'));axes={a.axisTag:(a.minValue,a.defaultValue,a.maxValue) for a in font['fvar'].axes} if 'fvar' in font else {};print(name,axes)
 weights=[400,600,700,800,900] if name=='Orbitron' else [400,700] if name=='Comfortaa' else [400,500,700,900] if name in ['Archivo','Roboto'] else [400]
 widths=[62,75,100] if name=='Archivo' else [75,100] if name=='Roboto' else [None]
 for weight in weights:
  for width in widths:
   f=TTFont(work/'fonts'/(name+'.ttf'));loc={'wght':weight} if axes else {}
   if width is not None:loc['wdth']=width
   if axes:f=instantiateVariableFont(f,loc,inplace=True)
   gs=f.getGlyphSet();cmap=f.getBestCmap();bp=BoundsPen(gs);gs[cmap[ord('H')]].draw(bp);scale=100/bp.bounds[3];glyphs={}
   for char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .':
    g=gs[cmap[ord(char)]];pen=SVGPathPen(gs);g.draw(TransformPen(RoundingPen(pen,roundFunc=lambda v:round(v,3)),(scale,0,0,-scale,0,100)));glyphs[char]={'advance':round(g.width*scale,3),'fill':True,'paths':[pen.getCommands()]}
   key=name.lower()+'-'+str(weight)+(('-wdth'+str(width)) if width else '');out[key]=glyphs;prov.append({**src,'profile':key,'axes':loc,'horizontalScale':1,'usage':'native comparison candidate; no historical font identity asserted'})
(work/'candidate-outlines.json').write_text(json.dumps(out,indent=2));(work/'candidate-provenance.json').write_text(json.dumps(prov,indent=2))
