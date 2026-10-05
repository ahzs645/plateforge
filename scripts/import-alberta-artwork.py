#!/usr/bin/env python3
"""Extract supplied wordmark/rose paths. Uploaded archives' executable files are not run."""
import argparse,hashlib,json,zipfile,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1];ns='{http://www.w3.org/2000/svg}'
parser=argparse.ArgumentParser();parser.add_argument('--geometric',type=Path,required=True);parser.add_argument('--script',type=Path,required=True);parser.add_argument('--rose',type=Path,required=True);args=parser.parse_args()
def read(p,name):
 if p.suffix.lower()=='.zip':
  with zipfile.ZipFile(p) as z:
   matches=[n for n in z.namelist() if not n.startswith('__MACOSX/') and n.rsplit('/',1)[-1]==name]
   if len(matches)!=1:raise ValueError(f'Expected one {name} in {p}')
   return z.read(matches[0])
 return p.read_bytes()
geo=E.fromstring(read(args.geometric,'page-1-selection-1.svg'))
script=E.fromstring(read(args.script,'Alberta-government-logo2.svg'))
rose=E.fromstring(read(args.rose,'red-wild-rose.svg'))
# Bounding boxes inspected with Inkscape; preserve native curves and uniform aspect ratio.
selections=[('geometric',[7,12.766,62.272,20.2342],geo.findall(ns+'path')),
 ('script',[1.00081,.968826,249.936,72.9936],list(list(script)[0][0][1])),
 ('rose',[16,152,1248,923],list(rose.iter(ns+'path')))]
result={}
for key,box,nodes in selections:
 paths=[]
 for n in nodes:
  if n.tag!=ns+'path' or 'transform' in n.attrib:raise ValueError(f'Changed source structure for {key}; re-inspect before import.')
  if n.get('fill-rule') not in (None,'nonzero','evenodd'):raise ValueError('Unsupported fill rule; inspect before importing.')
  paths.append({'d':n.attrib['d'],**({'fillRule':n.get('fill-rule')} if n.get('fill-rule') else {})})
 if len(paths)!={'geometric':2,'script':1,'rose':1}[key]:raise ValueError(f'Unexpected path count for {key}')
 result[key]={'viewBox':box,'paths':paths}
(root/'src/templates/art/alberta-vectors.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'paths':{k:len(v['paths']) for k,v in result.items()},'sourceHashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [args.geometric,args.script,args.rose]}}))
