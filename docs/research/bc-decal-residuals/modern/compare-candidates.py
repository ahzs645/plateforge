#!/usr/bin/env python3
"""Compare authored late-printing candidates against each usable occurrence."""
from pathlib import Path
import json,subprocess,hashlib
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent
FNT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
DATA=json.load(open(HERE/'year-occurrence-metrics.json'))
OUT=HERE/'candidate-comparisons';OUT.mkdir(exist_ok=True)

def model(name,text):
 svg=HERE/'candidate'/f'{name}-{text}.svg';png=svg.with_suffix('.png')
 if not png.exists() or png.stat().st_mtime<svg.stat().st_mtime:
  subprocess.run(['inkscape',str(svg),'--export-area-drawing','--export-height=220','--export-filename='+str(png),'--export-background-opacity=0'],capture_output=True,check=True)
 a=Image.open(png).getchannel('A');return a.crop(a.getbbox())

def overlay(a,b,h=170):
 a=a.resize((round(a.width*h/a.height),h),Image.Resampling.LANCZOS);b=b.resize((round(b.width*h/b.height),h),Image.Resampling.LANCZOS)
 w=max(a.width,b.width)+20;x=Image.new('L',(w,h+20));y=x.copy()
 x.paste(a,((w-a.width)//2,10));y.paste(b,((w-b.width)//2,10))
 aa=np.asarray(x)>128;bb=np.asarray(y)>128;rgb=np.full((h+20,w,3),255,dtype=np.uint8)
 rgb[aa]=[202,35,121];rgb[bb]=[0,133,182];rgb[aa&bb]=[37,40,48]
 return Image.fromarray(rgb)

def counter_boxes(im):
 a=np.asarray(im)>128;holes=ndimage.binary_fill_holes(a)&~a;lab,n=ndimage.label(holes);out=[]
 for sl in ndimage.find_objects(lab):
  if sl and np.count_nonzero(holes[sl])>=2:
   y,x=sl;out.append([round(z/im.height,5)for z in[x.start,y.start,x.stop,y.stop]])
 return out

results=[]
for r in DATA['records']:
 if int(r['observedYear'])<2019:continue
 folder=OUT/r['id'];folder.mkdir(exist_ok=True)
 mm=Image.open(HERE/'occurrences'/r['id']/'year-mask.png')
 occ=[]
 for o in r['occurrences']:
  c=o['character'];src=mm.crop(o['boxInCrop']);before=model('before',c);new=model('candidate',c)
  b=overlay(src,before);a=overlay(src,new)
  sheet=Image.new('RGB',(max(b.width,a.width)*2+20,230),'white');d=ImageDraw.Draw(sheet)
  d.text((8,5),f'{c} before',font=SMALL,fill='#16243b');d.text((sheet.width//2+8,5),f'{c} later profile',font=SMALL,fill='#16243b')
  sheet.paste(b,(4,30));sheet.paste(a,(sheet.width//2+4,30));sheet.save(folder/f"{o['index']}-{c}.png")
  occ.append({'index':o['index'],'character':c,'sourcePixels':[src.width,src.height],'sourceBox':o['boxInCrop'],'beforeWidthRatio':(before.width/before.height)/(src.width/src.height),'candidateWidthRatio':(new.width/new.height)/(src.width/src.height),'sourceCounters':counter_boxes(src),'candidateCounters':counter_boxes(new)})
 boxes=[o['boxInCrop']for o in r['occurrences']];box=[min(b[0]for b in boxes),min(b[1]for b in boxes),max(b[2]for b in boxes),max(b[3]for b in boxes)]
 src=mm.crop(box);b=model('before',r['observedYear']);a=model('candidate',r['observedYear'])
 overlay(src,b).save(folder/'before-run.png');overlay(src,a).save(folder/'candidate-run.png')
 results.append({'id':r['id'],'observedYear':r['observedYear'],'sourceSha256':r['sourceSha256'],'sourceYearBoxInROI':box,'sourceYearPixels':[src.width,src.height],'beforeRunWidthRatio':(b.width/b.height)/(src.width/src.height),'candidateRunWidthRatio':(a.width/a.height)/(src.width/src.height),'occurrences':occ,'candidateTypography':False})
(HERE/'candidate-metrics.json').write_text(json.dumps({'comparison':'Uniform painted height and horizontal centre, no x-only resizing. Whole-run height includes local photographed slope. Ratios are geometric diagnostics, not quality scores.','candidateTypography':False,'candidateSha256':hashlib.sha256((HERE/'late-year-candidate.json').read_bytes()).hexdigest(),'records':results},indent=2)+'\n')
selected=['2019-10727925','2020-20726786','2021-36946964','2022-72919128','2023-52843353']
board=Image.new('RGB',(1580,5*285+90),'#f4f6f9');d=ImageDraw.Draw(board)
d.text((20,12),'Later year printing: contours and advances remain separate',font=FNT,fill='#16243b');d.text((20,45),'Equal painted height, width preserved. Magenta=source, blue=renderer, dark=overlap. Actual registered later-year profile; source geometry remains approximate.',font=SMALL,fill='#334155')
for i,id in enumerate(selected):
 r=next(x for x in results if x['id']==id);y=i*285+90
 for j,(name,key) in enumerate([('before-run','beforeRunWidthRatio'),('candidate-run','candidateRunWidthRatio')]):
  im=Image.open(OUT/id/(name+'.png'));d.text((20+j*790,y),f'{id} | {name} | width/source={r[key]:.3f}',font=FNT,fill='#16243b')
  board.paste(im,(20+j*790,y+40))
board.save(HERE/'late-year-candidate-summary.png')
for r in results:print(r['id'],round(r['beforeRunWidthRatio'],3),round(r['candidateRunWidthRatio'],3))
