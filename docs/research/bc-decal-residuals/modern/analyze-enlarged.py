#!/usr/bin/env python3
"""Independent enlarged-source checks, with every repeated glyph retained.

Crops/overlays derived from D5e58's CC BY-SA4.0 photographs retain that licence.
No perspective correction, calibrated colour, physical frame-size claim, or
historical font identification is made.
"""
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3]
OUT=HERE/'enlarged';OUT.mkdir(exist_ok=True)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21)
CASES=[
 ('2020-commons','year','2020',[.515,.10,.97,.65]),
 ('2020-commons','control','23747480',[.50,.65,.94,.91]),
 ('2021-commons','year','2021',[.55,.10,.96,.68]),
 ('2021-commons','control','33502027',[.54,.64,.95,.92]),
 ('2022-commons','year','2022',[.52,.09,.96,.62]),
 ('2022-commons','control','71708687',[.52,.65,.94,.90]),
]

def model(role,name,char):
 if role=='year':svg=HERE/'candidate'/f'{name}-{char}.svg'
 else:svg=ROOT/'docs/research/bc-modern-numerals/rendered'/f'modern-control-reconstruction-{char}.svg'
 png=OUT/f'{role}-{name}-{char}.png'
 if not png.exists()or png.stat().st_mtime<svg.stat().st_mtime:
  subprocess.run(['inkscape',str(svg),'--export-area-drawing','--export-height=220','--export-filename='+str(png),'--export-background-opacity=0'],capture_output=True,check=True)
 im=Image.open(png).getchannel('A');return im.crop(im.getbbox())

def segment(crop,text):
 a=ndimage.gaussian_filter(np.asarray(crop.convert('L'),dtype=float),.6)
 lo,hi=np.percentile(a,[10,85])
 for _ in range(20):
  t=(lo+hi)/2;l=a[a<t];u=a[a>=t]
  if not l.size or not u.size:raise ValueError('Missing intensity class')
  lo=float(l.mean());hi=float(u.mean())
 if hi-lo<25:raise ValueError(f'Insufficient class contrast: {hi-lo:.2f}')
 threshold=(lo+hi)/2;sensitivity=[];primary=None
 for delta in [-8,0,8]:
  mask=a<threshold+delta;lab,_=ndimage.label(mask);boxes=[]
  for i,sl in enumerate(ndimage.find_objects(lab),1):
   if not sl:continue
   y,x=sl;h=y.stop-y.start;w=x.stop-x.start;area=(lab[sl]==i).sum()
   if h>crop.height*.45 and area>crop.width*crop.height*.01:boxes.append([x.start,y.start,x.stop,y.stop])
  boxes.sort();reason=None
  if len(boxes)!=len(text):reason=f'Expected {len(text)} glyphs; found {len(boxes)}'
  elif any(b[0]<=0 or b[1]<=0 or b[2]>=crop.width or b[3]>=crop.height for b in boxes):reason='Glyph touches extraction boundary'
  elif min(b[3]-b[1]for b in boxes)<100:reason='Enlarged source glyph below 100-pixel minimum'
  sensitivity.append({'thresholdOffset':delta,'accepted':reason is None,'rejectionReason':reason,'boxes':boxes})
  if delta==0 and reason is None:primary=(mask,boxes)
 if primary is None:raise ValueError('Primary segmentation rejected: '+json.dumps(sensitivity))
 if any(not s['accepted']for s in sensitivity):raise ValueError('Threshold-sensitive segmentation rejected: '+json.dumps(sensitivity))
 mask,boxes=primary
 return Image.fromarray((mask*255).astype('uint8')),boxes,threshold,sensitivity,hi-lo

def overlay(s,m,h=180):
 s=s.resize((round(s.width*h/s.height),h),Image.Resampling.LANCZOS);m=m.resize((round(m.width*h/m.height),h),Image.Resampling.LANCZOS)
 w=max(s.width,m.width)+20;sm=Image.new('L',(w,h+20));mm=sm.copy()
 sm.paste(s,((w-s.width)//2,10));mm.paste(m,((w-m.width)//2,10));sa=np.asarray(sm)>128;ma=np.asarray(mm)>128
 rgb=np.full((h+20,w,3),255,dtype=np.uint8);rgb[sa]=[202,35,121];rgb[ma]=[0,133,182];rgb[sa&ma]=[37,40,48]
 return Image.fromarray(rgb)
inventory={r['id']:r for r in json.loads((HERE/'source-inventory.json').read_text())['sources']}
records=[];rejected=[]
for id,role,text,roi in CASES:
 expected=inventory[id]['observedYear'if role=='year'else'observedControl']
 if text!=expected:raise ValueError(f'Explicit input differs from reviewed source inventory: {id} {role}')
 path=HERE/'sources'/(id+'.jpg');photo=Image.open(path).convert('RGB');box=[round(v*(photo.width if i%2==0 else photo.height))for i,v in enumerate(roi)]
 print(id,role,box,flush=True)
 crop=photo.crop(box)
 try:mask,boxes,t,sensitivity,contrast=segment(crop,text)
 except ValueError as error:
  rejected.append({'id':id,'role':role,'text':text,'roiPixels':box,'accepted':False,'rejectionReason':str(error)});continue
 dest=OUT/(id+'-'+role);dest.mkdir(exist_ok=True);crop.save(dest/'source-crop.png');mask.save(dest/'source-mask.png')
 canvas=Image.new('RGB',(max(4,len(text))*230,600),'#f4f6f9');d=ImageDraw.Draw(canvas)
 d.text((12,12),f'{id} | {role} {text} | individual occurrences',font=FONT,fill='#16243b')
 d.text((12,42),'D5e58, CC BY-SA 4.0. Uniform-height overlays; source width retained; unrectified.',font=SMALL,fill='#334155')
 occurrences=[]
 for i,(char,b)in enumerate(zip(text,boxes)):
  src=mask.crop(b);old=model(role,'before',char);candidate=model(role,'candidate',char)
  raw=crop.crop(b);raw.thumbnail((90,110));canvas.paste(raw,(i*230+12,90));d.text((i*230+112,95),f'#{i+1} {char}',font=FONT,fill='#16243b')
  d.text((i*230+12,208),'Previous' if role=='year'else'Current control',font=SMALL,fill='#16243b');canvas.paste(overlay(src,old,150),(i*230+12,235))
  d.text((i*230+12,414),'Later-year profile' if role=='year'else'Retained candidate',font=SMALL,fill='#16243b');canvas.paste(overlay(src,candidate,150),(i*230+12,440))
  occurrences.append({'index':i,'character':char,'sourceBoxInCrop':b,'sourcePaintedPixels':[src.width,src.height],'beforeWidthRatio':(old.width/old.height)/(src.width/src.height),'candidateWidthRatio':(candidate.width/candidate.height)/(src.width/src.height)})
 canvas.save(dest/'occurrences.png')
 records.append({'id':id,'role':role,'text':text,'accepted':True,'rejectionReason':None,'sourceFile':str(path.relative_to(HERE)),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'originalSourcePixels':list(photo.size),'roiPixels':box,'threshold':t,'classContrast':contrast,'thresholdSensitivity':sensitivity,'occurrences':occurrences,'licence':'CC BY-SA4.0','credit':'D5e58','candidateTypography':False,'limits':'Worn, unrectified photograph. Large pixel count does not remove perspective, print spread, slope or the unknown physical frame aspect. Repeated glyph occurrences are not independent photographs.'})
(HERE/'enlarged-occurrence-metrics.json').write_text(json.dumps(records,indent=2)+'\n')
(HERE/'enlarged-rejections.json').write_text(json.dumps(rejected,indent=2)+'\n')
for r in records:print(r['id'],r['role'],[(o['character'],o['sourcePaintedPixels'],round(o['beforeWidthRatio'],3),round(o['candidateWidthRatio'],3))for o in r['occurrences']])
