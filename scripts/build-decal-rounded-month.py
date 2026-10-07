#!/usr/bin/env python3
"""1986 M/A constructions supported by repeated MAR/MAY/JAN photographic occurrences.

These two glyphs are explicit reconstructions, not extracted historical font outlines.
Cubic centerlines use observed proportions and rounded shoulders; buffering preserves
that design without any later x-only scaling. Remaining letters use documented native
comparison candidates. Install shapely into a working dependency path, not production.
"""
from pathlib import Path
import sys,json
if len(sys.argv)>1:sys.path.insert(0,sys.argv[1])
from shapely.geometry import LineString
from shapely.ops import unary_union
from svgpathtools import parse_path
ROOT=Path(__file__).resolve().parents[1]

def filled(paths,stroke):
 lines=[]
 for path in paths:
  for sub in parse_path(path).continuous_subpaths():
   pts=[sub.point(i/400) for i in range(401)]
   lines.append(LineString([(p.real,p.imag) for p in pts]).buffer(stroke/2,cap_style=2,join_style=1))
 shape=unary_union(lines);polygons=[shape] if shape.geom_type=='Polygon' else list(shape.geoms);out=[]
 for polygon in polygons:
  rings=[polygon.exterior,*polygon.interiors]
  out.append(' '.join('M'+' L'.join(f'{x:.3f} {y:.3f}' for x,y in ring.coords)+' Z' for ring in rings))
 return out
native=json.loads((ROOT/'docs/research/decal-online-analysis/candidate-outlines.json').read_text())
base=json.loads((ROOT/'src/templates/dies/decal-glyph-printing.json').read_text())['1986-month-reconstruction'].copy()
M=['M7 100 V28 C7 16.402 16.626 7 28.5 7 C40.374 7 50 16.402 50 28 V100 M50 28 C50 16.402 59.626 7 71.5 7 C83.374 7 93 16.402 93 28 V100']
A=['M7 100 V34.5 C7 19.312 19.312 7 34.5 7 C49.688 7 62 19.312 62 34.5 V100','M7 60 H62']
base['M']={'advance':107,'fill':True,'paths':filled(M,14)};base['A']={'advance':77,'fill':True,'paths':filled(A,14)}
# Independent source letter comparisons across multiple observed month strings.
for char,name in {'N':'roboto-500-wdth100','F':'condensed-medium','E':'condensed-medium','B':'archivo-700-wdth62','P':'normal','Y':'archivo-700-wdth75','G':'righteous-400','D':'baumans-400','C':'baumans-400','O':'archivo-500-wdth100','V':'roboto-500-wdth75'}.items():
 if name in native:base[char]=native[name][char]
 else:
  source='src/templates/dies/decal-audit-printing.json' if name.startswith('condensed') else 'src/templates/dies/decal-printing.json'
  base[char]=json.loads((ROOT/source).read_text())[name][char]
profiles=json.loads((ROOT/'src/templates/dies/decal-glyph-printing.json').read_text());profiles['1986-rounded-reconstruction']=base
(ROOT/'src/templates/dies/decal-glyph-printing.json').write_text(json.dumps(profiles,indent=2)+'\n')
(ROOT/'docs/research/decal-online-analysis/rounded-month-provenance.json').write_text(json.dumps({'profile':'1986-rounded-reconstruction','status':'explicit mixed reconstruction, not an identified historical font','constructed':{'M':{'sourceWords':['MAR','MAY'],'centerlines':M,'stroke':14,'advance':107},'A':{'sourceWords':['MAR','MAY','JAN','APR','AUG'],'centerlines':A,'stroke':14,'advance':77}},'nativeOverrides':{'J':'oswald-600','U':'archivonarrow-600','L':'condensed-medium','N':'roboto-500-wdth100','F':'condensed-medium','E':'condensed-medium','B':'archivo-700-wdth62','P':'normal','Y':'archivo-700-wdth75','G':'righteous-400','D':'baumans-400','C':'baumans-400','O':'archivo-500-wdth100','V':'roboto-500-wdth75'},'otherLetters':'Roboto Condensed Semibold candidates; T is observed but merged with adjacent source paint','horizontalScale':1,'limits':'Photographic scan contours and small changes in ink weight remain approximate. No synthetic enlargement creates source evidence.'},indent=2)+'\n')
