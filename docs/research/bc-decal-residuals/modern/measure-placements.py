#!/usr/bin/env python3
"""Approximate whole-role paint positions; uniform frame-height registration.

No frame-width scaling or photographic perspective correction is performed.
Glyph changes/cap changes, if proposed, must remain independently reviewable.
"""
from pathlib import Path
import json,hashlib,os
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3]
BASELINE=Path(os.environ.get('DECAL_PASS1_ROOT',str(ROOT.parent/'plateforge-decal-pass1')))
regions={
 '2018':{'month':[.045,.06,.425,.65],'year':[.52,.045,.985,.655],'legend0':[.43,.08,.475,.65],'legend1':[.475,.06,.52,.65],'serial':[.58,.68,.985,.96],'barcode':[.035,.665,.56,.97]},
 '2019':{'month':[.025,.06,.39,.65],'year':[.52,.055,.985,.65],'legend0':[.40,.10,.447,.65],'legend1':[.45,.07,.495,.65],'serial':[.53,.68,.985,.96],'barcode':[.025,.66,.51,.97]},
 '2020':{'month':[.025,.06,.40,.65],'year':[.52,.055,.985,.65],'legend0':[.41,.10,.452,.65],'legend1':[.45,.07,.495,.65],'serial':[.51,.68,.985,.96],'barcode':[.025,.66,.51,.97]},
 '2021':{'month':[.035,.06,.40,.65],'year':[.54,.055,.985,.65],'legend0':[.43,.10,.475,.65],'legend1':[.47,.07,.515,.65],'serial':[.53,.68,.985,.96],'barcode':[.025,.66,.51,.97]},
 '2022':{'month':[.025,.06,.40,.65],'year':[.52,.045,.985,.65],'legend0':[.41,.10,.46,.65],'legend1':[.46,.06,.505,.65],'serial':[.52,.68,.985,.96],'barcode':[.025,.66,.51,.97]},
}
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
metadata=json.load(open(BASELINE/'public/bc-decal-corrections/render-metadata.json'))
models={r['id']:r for r in metadata['specimens']}

def bounds(im,roi,role):
 crop=im.crop(roi).convert('L');a=ndimage.gaussian_filter(np.asarray(crop,dtype=float),.35)
 lo,hi=np.percentile(a,[15,85])
 for _ in range(20):
  t=(lo+hi)/2;l=a[a<t];u=a[a>=t]
  if l.size:lo=float(l.mean())
  if u.size:hi=float(u.mean())
 t=(lo+hi)/2;boxes=[]
 for delta in [-8,0,8]:
  lab,_=ndimage.label(a<t+delta);counts=np.bincount(lab.ravel());keep=counts>=2;keep[0]=False
  if not role.startswith('legend'):
   for idx,sl in enumerate(ndimage.find_objects(lab),1):
    if sl and sl[0].stop-sl[0].start < a.shape[0]*.35:keep[idx]=False
  yy,xx=np.where(keep[lab])
  if not len(xx):raise ValueError('No ink')
  box=[int(xx.min()+roi[0]),int(yy.min()+roi[1]),int(xx.max()+roi[0]+1),int(yy.max()+roi[1]+1)]
  clipped=box[0]<=roi[0] or box[1]<=roi[1] or box[2]>=roi[2] or box[3]>=roi[3]
  boxes.append({'thresholdOffset':delta,'bounds':box,'clipped':clipped})
 return t,boxes

results=[]
for id,rois in regions.items():
 src=ROOT/'public/bc-decal-corrections/evidence'/id/'source.png';photo=Image.open(src).convert('RGB');w,h=photo.size
 m=models[id];mw,mh=m['viewBox'];runs={(r['role'],r['index']):r for r in m['after']['runs']}
 diag=photo.resize((w*4,h*4),Image.Resampling.NEAREST);draw=ImageDraw.Draw(diag)
 roleRecords={}
 for role,relativeROI in rois.items():
  roi=[round(v*(w if i%2==0 else h)) for i,v in enumerate(relativeROI)]
  overrides={('2018','year'):[115,4,222,63],('2018','legend0'):[95,8,106,62],('2018','legend1'):[105,6,116,62],('2018','barcode'):[8,63,126,90],('2019','legend0'):[93,8,102,62],('2019','legend1'):[102,6,113,62],('2020','legend0'):[90,8,100,62],('2020','legend1'):[99,6,111,62],('2022','legend1'):[108,6,119,64]}
  roi=overrides.get((id,role),roi)
  t,measure=bounds(photo,roi,role);b=measure[1]['bounds']
  name=('decal-legend',int(role[-1])) if role.startswith('legend') else ('decal-'+role,0)
  model=np.array(runs[name]['box']);world=np.array([(b[0]-w/2)/h*mh+mw/2,b[1]/h*mh,(b[2]-w/2)/h*mh+mw/2,b[3]/h*mh])
  delta=(world[:2]+world[2:]-model[:2]-model[2:])/2
  roleRecords[role]={'sourceRegionPixels':roi,'sourceThreshold':t,'thresholdSensitivity':measure,'sourceBoundsPixels':b,'sourceBoundsUniformHeight':world.round(5).tolist(),'modelPaintBounds':model.tolist(),'centreDeltaUnits':delta.round(5).tolist(),'sourcePaintHeight':world[3]-world[1],'modelPaintHeight':model[3]-model[1],'sourcePaintWidth':world[2]-world[0],'modelPaintWidth':model[2]-model[0]}
  draw.rectangle([v*4 for v in roi],outline='#fff',width=1)
  draw.rectangle([v*4 for v in b],outline='#b6006f',width=2)
  draw.text((roi[0]*4,roi[1]*4),role,font=font,fill='#111')
 diag.save(HERE/f'{id}-placement-regions.png')
 results.append({'id':id,'sourceFile':str(src.relative_to(ROOT)),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'modelSha256':m['after']['svgSha256'],'sourcePixels':[w,h],'modelViewBox':[mw,mh],'roles':roleRecords})
(HERE/'placement-measurements.json').write_text(json.dumps({'method':'Uniform decal-frame height and horizontal centre; source aspect and model aspect retained. Isolated ink extents thresholded at base and+/-8 levels. Approximate image geometry, not physical metrology. Barcode values measure bars, excluding quiet zones.','records':results},indent=2)+'\n')
for r in results:
 print(r['id'])
 for role,rr in r['roles'].items():print(role,'delta',rr['centreDeltaUnits'],'heights',round(rr['modelPaintHeight'],2),round(rr['sourcePaintHeight'],2),'widths',round(rr['modelPaintWidth'],2),round(rr['sourcePaintWidth'],2),'clipped',any(x['clipped']for x in rr['thresholdSensitivity']))
