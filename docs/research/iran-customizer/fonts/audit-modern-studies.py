from pathlib import Path
import json,subprocess,tempfile
from PIL import Image
import numpy as np
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
D=Path(__file__).resolve().parent;P=json.loads((D/'modern-studies.json').read_text());rows=[]
for p in P:
 for role,r in [('main',p)]+list(p['roles'].items()):
  for g in r['glyphs']:
   if g['provenance']!='observed':continue
   pen=BoundsPen(None);parse_path(g['path'],pen);x0,y0,x1,y1=pen.bounds;roi=(max(0,int(x0)-3),max(0,int(y0)-3),int(x1)+4,int(y1)+4)
   src=np.array(Image.open(D/g['sourceFile']).convert('RGB'))
   svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{src.shape[1]}" height="{src.shape[0]}"><rect width="100%" height="100%" fill="white"/><path d="{g["path"]}" fill="black" fill-rule="evenodd"/></svg>'
   Path('/tmp/modern-metric.svg').write_text(svg);subprocess.run(['inkscape','/tmp/modern-metric.svg','--export-type=png','--export-filename=/tmp/modern-metric.png'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
   pred=np.array(Image.open('/tmp/modern-metric.png').convert('RGB')).max(2)<128
   white=Path(g['sourceFile']).stem in ['wiki-police','wiki-irgc','wiki-defence','wiki-staff']
   truth=(src.min(2)>210) if white else (src.max(2)<90)
   x0,y0,x1,y1=roi;t=truth[y0:y1,x0:x1];q=pred[y0:y1,x0:x1]
   iou=float(np.logical_and(t,q).sum()/max(1,np.logical_or(t,q).sum()))
   rows.append(dict(profile=p['id'],role=role,character=g['character'],sourceFile=g['sourceFile'],iou=round(iou,4),comparison='Native fixed source plane; thresholded illustration. Nearby marks/antialiasing and contour simplification remain residuals. No registration fit.'))
(D/'modern-reference/observed-overlay-audit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print([(r['character'],r['role'],r['iou']) for r in rows]);print('mean',sum(r['iou'] for r in rows)/len(rows))
