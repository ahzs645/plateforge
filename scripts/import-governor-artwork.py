#!/usr/bin/env python3
"""Import supplied inert SVG geometry and build a separate filled arms proxy."""
import json,re,copy,xml.etree.ElementTree as E
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'src/templates/bc'
SVG='http://www.w3.org/2000/svg'
def converted(path,crop=None,gold=False):
 root=E.parse(path).getroot();ids={e.get('id'):e for e in root.iter() if e.get('id')}
 allowed={'g','path','rect','circle','ellipse','polygon','polyline','line','use'}
 attrs={'d','transform','x','y','width','height','cx','cy','r','rx','ry','x1','y1','x2','y2','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity'}
 def convert(e,depth=0):
  assert depth<25
  tag=e.tag.rsplit('}',1)[-1]
  if tag not in allowed:return None
  if tag=='use':
   ref=e.get('{http://www.w3.org/1999/xlink}href') or e.get('href');assert ref and ref.startswith('#')
   target=convert(ids[ref[1:]],depth+1);return {'tag':'g','attrs':{'transform':e.get('transform','')},'children':[target]}
  props={k:v for k,v in e.attrib.items() if k in attrs}
  for bit in e.get('style','').split(';'):
   if ':' in bit:
    k,v=bit.split(':',1)
    if k in attrs:props[k]=v
  if gold:props={k:v.replace('#f7e017','#c5a34a') for k,v in props.items()}
  props={re.sub(r'-([a-z])',lambda m:m.group(1).upper(),k):v for k,v in props.items()}
  kids=[x for child in e if (x:=convert(child,depth+1)) is not None]
  return {'tag':tag,'attrs':props,'children':kids}
 nodes=[]
 for e in root:
  if crop and e.tag.rsplit('}',1)[-1]=='rect' and e.get('width')=='1200':continue
  n=convert(e)
  if n:nodes.append(n)
 vb=crop or [float(v)for v in root.get('viewBox').split()]
 return {'viewBox':vb,'nodes':nodes}
crest=converted(OUT/'assets/lg-crest-source.svg',[350,39,500,523],True)
crown=converted(OUT/'assets/edward-crown-source.svg')
for name,data in [('supplied-lg-crest',crest),('supplied-edward-crown',crown)]:
 (OUT/(name+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n')
print('imported',len(crest['nodes']),len(crown['nodes']))

# The existing line master remains unchanged for historical tin plates.
# Its first closed outer contour provides the filled body of this relief proxy.
from fontTools.svgLib.path import parse_path
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
source=(OUT/'crest.ts').read_text();path=re.search(r"CREST_PATH = '([^']+)'",source).group(1)
p=RecordingPen();parse_path(path,p);outer=SVGPathPen(None)
for command,args in p.value:
 getattr(outer,command)(*args)
 if command=='closePath':break
(OUT/'supplied-lg-arms-solid.json').write_text(json.dumps({'outline':outer.getCommands()},separators=(',',':'))+'\n')
