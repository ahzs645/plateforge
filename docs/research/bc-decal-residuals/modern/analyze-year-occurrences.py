#!/usr/bin/env python3
"""Inspect every usable year occurrence at equal height, never fit x separately.

Each threshold mask remains a derivative; source crops remain available. The
photo image plane is retained. No quality/authenticity score is calculated.
"""
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3]
FNT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
OUT=HERE/'occurrences';OUT.mkdir(exist_ok=True)
MODEL=ROOT/'docs/research/bc-modern-numerals/rendered'

def model(c):
 p=HERE/'model'/f'modern-year-reconstruction-{c}.png'
 p.parent.mkdir(exist_ok=True)
 if not p.exists():
  svg=MODEL/f'modern-year-reconstruction-{c}.svg'
  subprocess.run(['inkscape',str(svg),'--export-area-drawing','--export-height=220','--export-filename='+str(p),'--export-background-opacity=0'],capture_output=True,check=True)
 im=Image.open(p).getchannel('A');return im.crop(im.getbbox())

def threshold(a):
 lo,hi=np.percentile(a,[15,85])
 for _ in range(20):
  t=(lo+hi)/2;lower=a[a<t];upper=a[a>=t]
  if not lower.size or not upper.size:raise ValueError('No two intensity clusters')
  lo=float(lower.mean());hi=float(upper.mean())
 if hi-lo<25:raise ValueError('Insufficient contrast')
 return (lo+hi)/2

def segments(a,t):
 mask=a<t;lab,n=ndimage.label(mask)
 comps=[]
 for i,sl in enumerate(ndimage.find_objects(lab),1):
  if not sl:continue
  sy,sx=sl;h=sy.stop-sy.start;w=sx.stop-sx.start;area=int((lab[sl]==i).sum())
  if h>=a.shape[0]*.43 and area>=a.size*.015:
   comps.append([sx.start,sy.start,sx.stop,sy.stop])
 comps.sort()
 if len(comps)!=4:raise ValueError(f'Expected four year components, found{len(comps)}')
 if any(b[0]==0 or b[1]==0 or b[2]==a.shape[1] or b[3]==a.shape[0] for b in comps):raise ValueError('Segment touches extraction boundary')
 if min(b[3]-b[1] for b in comps)<12:raise ValueError('Glyph below12pixel threshold')
 return mask,comps

def overlay(s,c,height=175):
 s=s.resize((round(s.width*height/s.height),height),Image.Resampling.LANCZOS)
 c=c.resize((round(c.width*height/c.height),height),Image.Resampling.LANCZOS)
 w=max(s.width,c.width)+20
 sm=Image.new('L',(w,height+20));cm=sm.copy()
 sm.paste(s,((w-s.width)//2,10));cm.paste(c,((w-c.width)//2,10))
 sa=np.asarray(sm)>128;ca=np.asarray(cm)>128
 a=np.full((height+20,w,3),255,dtype=np.uint8);a[sa]=[202,35,121];a[ca]=[0,133,182];a[sa&ca]=[37,40,48]
 return Image.fromarray(a)

records=[];errors=[]
for p in sorted((HERE/'sources').glob('20*-*.jpg')):
 if 'commons' in p.name:continue
 observedYear='2019' if p.stem=='2020-17918347' else p.name[:4]
 im=Image.open(p).convert('RGB');w,h=im.size
 roi=[round(w*.505),round(h*.015),round(w*.995),round(h*.73)]
 if observedYear=='2014':roi=[round(w*.515),round(h*.015),round(w*.995),round(h*.73)]
 crop=im.crop(roi);a=ndimage.gaussian_filter(np.asarray(crop.convert('L'),dtype=float),.35)
 try:
  t=threshold(a);mask,boxes=segments(a,t)
  sensitivity=[]
  for dt in [-8,0,8]:
   try:
    _,bb=segments(a,t+dt);sensitivity.append({'offset':dt,'accepted':True,'rejectionReason':None,'boxes':bb})
   except ValueError as e:sensitivity.append({'offset':dt,'accepted':False,'rejectionReason':str(e),'rejected':str(e)})
  if any(not sample['accepted']for sample in sensitivity):raise ValueError('Threshold sensitivity rejected: '+json.dumps(sensitivity))
  folder=OUT/p.stem;folder.mkdir(exist_ok=True)
  crop.save(folder/'year-photo.png');Image.fromarray((mask*255).astype('uint8')).save(folder/'year-mask.png')
  occ=[]
  for i,(char,b) in enumerate(zip(observedYear,boxes)):
   bmask=Image.fromarray((mask[b[1]:b[3],b[0]:b[2]]*255).astype('uint8'));mm=model(char)
   overlay(bmask,mm).save(folder/f'{i}-{char}-shape.png')
   occ.append({'index':i,'character':char,'boxInCrop':b,'paintedPixels':[bmask.width,bmask.height],'widthPerHeight':bmask.width/bmask.height,'modelWidthPerHeight':mm.width/mm.height,'modelToSourceWidthRatio':(mm.width/mm.height)/(bmask.width/bmask.height),'segmentationSensitivity':[[o['offset'],((o['boxes'][i][2]-o['boxes'][i][0])/(o['boxes'][i][3]-o['boxes'][i][1]))] for o in sensitivity if 'boxes'in o]})
  records.append({'id':p.stem,'accepted':True,'rejectionReason':None,'observedYear':observedYear,'sourceFile':str(p.relative_to(HERE)),'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sourcePixels':[w,h],'roi':roi,'threshold':t,'sensitivity':sensitivity,'occurrences':occ,'bindingNote':'Filename begins2020, but photographed year is2019. Kept in the2019 evidence group.' if p.stem=='2020-17918347' else None})
 except ValueError as e:errors.append({'id':p.stem,'accepted':False,'observedYear':observedYear,'roi':roi,'rejected':str(e)})

summary=[]
for char in '34689':
 items=[(r,o) for r in records for o in r['occurrences'] if o['character']==char]
 width=1000;ch=285;canvas=Image.new('RGB',(width,70+ch*((len(items)+3)//4)),'#f4f6f9');d=ImageDraw.Draw(canvas)
 d.text((16,10),f'Year {char}: source crops and equal-height overlays, width preserved',font=FNT,fill='#16243b')
 d.text((16,38),'Magenta = source only; blue = model only; dark = overlap. Unrectified photographic geometry.',font=SMALL,fill='#334155')
 for j,(r,o) in enumerate(items):
  x=j%4*250;y=70+j//4*ch
  photo=Image.open(OUT/r['id']/'year-photo.png').crop(o['boxInCrop'])
  ph=80;photo=photo.resize((round(photo.width*ph/photo.height),ph),Image.Resampling.NEAREST)
  # Source and overlay share the original glyph aspect, different display heights.
  d.text((x+8,y),r['id'],font=SMALL,fill='#16243b')
  canvas.paste(photo,(x+8,y+25))
  shape=Image.open(OUT/r['id']/f"{o['index']}-{char}-shape.png")
  canvas.paste(shape,(x+90,y+26))
  d.text((x+8,y+230),f"Source: {o['paintedPixels'][0]}x{o['paintedPixels'][1]} px; ratio {o['modelToSourceWidthRatio']:.3f}",font=SMALL,fill='#334155')
 canvas.save(HERE/f'year-{char}-evidence.png')
 values=[o['modelToSourceWidthRatio'] for _,o in items]
 summary.append({'glyph':char,'observedOccurrenceCount':len(items),'referenceIds':[r['id'] for r,_ in items],'sourcePaintedHeightRange':[min(o['paintedPixels'][1] for _,o in items),max(o['paintedPixels'][1] for _,o in items)],'modelToSourceWidthRatioRange':[min(values),max(values)],'modelToSourceWidthRatioMedian':float(np.median(values))})
(HERE/'year-occurrence-metrics.json').write_text(json.dumps({'method':'Independent source glyphs uniformly normalized to painted height and horizontal centre; original widths retained. Threshold variation+/-8 tested; no physical rectification or authenticity score.','model':'First-pass modern-year-reconstruction','records':records,'rejected':errors,'summary':summary},indent=2)+'\n')
print(json.dumps({'accepted':len(records),'rejected':errors,'summary':summary},indent=2))
