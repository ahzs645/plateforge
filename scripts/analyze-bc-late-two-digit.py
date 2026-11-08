#!/usr/bin/env python3
"""Source-checked shape diagnostics and proposed placements; no shared edits."""
from pathlib import Path
import json, subprocess, hashlib
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/research/bc-late-two-digit-printing';R=OUT/'rendered'
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20);S=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
cases=json.loads((R/'manifest.json').read_text());rows=[];patches=[]
board=Image.new('RGB',(1320,len(cases)*305+80),'#f4f6f9');draw=ImageDraw.Draw(board)
draw.text((20,12),'2008 / 2011 / 2013 — same painted height; width is preserved',font=F,fill='#16243b');draw.text((20,46),'Magenta = source only   Blue = renderer only   Dark = overlap',font=S,fill='#334155')

def source_mask(crop,polarity):
 a=ndimage.gaussian_filter(np.array(crop.convert('L'),dtype=float),.35);lo,hi=np.percentile(a,[15,85])
 for _ in range(20):
  t=(lo+hi)/2;lo=float(a[a<t].mean());hi=float(a[a>=t].mean())
 t=(lo+hi)/2;m=a>t if polarity=='light' else a<t;labels,_=ndimage.label(m);sizes=np.bincount(labels.ravel());keep=sizes>=max(2,round(m.size*.0005));keep[0]=False
 return Image.fromarray((keep[labels]*255).astype('uint8')),t

def overlay(source,current):
 h=170;s=source.resize((round(source.width*h/source.height),h),Image.Resampling.LANCZOS);c=current.resize((round(current.width*h/current.height),h),Image.Resampling.LANCZOS);w=max(s.width,c.width)+24
 sa=Image.new('L',(w,h+24));ca=Image.new('L',(w,h+24));sa.paste(s,((w-s.width)//2,12));ca.paste(c,((w-c.width)//2,12));sa=np.asarray(sa)>100;ca=np.asarray(ca)>100
 a=np.full((h+24,w,3),255,dtype=np.uint8);a[sa]=[202,35,121];a[ca]=[0,133,182];a[sa&ca]=[37,40,48];return Image.fromarray(a)

for row,entry in enumerate(cases):
 folder=OUT/'evidence'/entry['id'];folder.mkdir(parents=True,exist_ok=True);sourcefile=ROOT/'public/bc-decal-online-review'/entry['catalogueId']/'photo.png';photo=Image.open(sourcefile).convert('RGB');roi=entry['roi'];crop=photo.crop(roi);mask,t=source_mask(crop,entry['polarity']);box=mask.getbbox();source=mask.crop(box)
 absolute=[box[0]+roi[0],box[1]+roi[1],box[2]+roi[0],box[3]+roi[1]];crop.save(folder/'source-crop.png');mask.save(folder/'source-mask.png')
 occurrences=[];labels,_=ndimage.label(np.asarray(mask)>128)
 for sl in ndimage.find_objects(labels):
  if sl and sl[0].stop-sl[0].start>mask.height*.5:
   y,x=sl;occurrences.append([x.start,y.start,x.stop,y.stop])
 occurrences.sort()
 if len(occurrences)!=len(entry['text']):raise RuntimeError(f"Adjacent ink or missing glyph in {entry['id']}: {occurrences}")
 result={**entry,'sourceFile':str(sourcefile.relative_to(ROOT)),'sourceFileSha256':hashlib.sha256(sourcefile.read_bytes()).hexdigest(),'sourcePixels':list(photo.size),'sourcePaintBox':absolute,'sourceThreshold':t,'sourceOccurrences':[{'character':c,'boxInCrop':b} for c,b in zip(entry['text'],occurrences)]}
 for col,stage in enumerate(['before','after']):
  svg=R/entry['renders'][stage]['file'];png=svg.with_suffix('.png')
  proc=subprocess.run(['inkscape',str(svg),'--query-all','--export-area-drawing','--export-height=220','--export-filename='+str(png),'--export-background-opacity=0'],capture_output=True,text=True,check=True)
  fields=next(line.split(',') for line in proc.stdout.splitlines() if line.startswith('diagnostic-run,'));x,y,w,h=map(float,fields[1:]);native=[x-10,y-10,x+w-10,y+h-10]
  im=Image.open(png).getchannel('A');im=im.crop(im.getbbox());ratio=(im.width/im.height)/(source.width/source.height);result[stage+'WidthRatio']=ratio;result[stage+'NativePaintBox']=native
  ov=overlay(source,im);ov.save(folder/(stage+'-shape.png'));bx=20+col*660;by=80+row*305;draw.text((bx,by+4),entry['id']+' '+entry['text']+' · '+stage,font=F,fill='#16243b');board.paste(ov,(bx+(620-ov.width)//2,by+43));draw.text((bx,by+256),f'Width / source: {ratio:.3f}',font=S,fill='#334155')
 # Placement proposal matches painted height and the chosen anchor after the
 # same uniform photo-height/centering transform used in the overall review.
 model_width=230;photo_scale=100/photo.height;offset=(photo.width*photo_scale-model_width)/2
 target=[absolute[0]*photo_scale-offset,absolute[1]*photo_scale,absolute[2]*photo_scale-offset,absolute[3]*photo_scale]
 b=result['afterNativePaintBox'];scale=(target[3]-target[1])/(b[3]-b[1]);advance=entry['renders']['after']['nativeAdvance'];anchor=entry['anchor']
 if anchor=='start':x=target[0]-b[0]*scale
 else:x=target[2]+(advance-b[2])*scale
 baseline=target[3]+(100-b[3])*scale
 patch={'x':round(x/model_width,4),'baseline':round(baseline/100,4),'cap':round(scale,4),'width':round(advance*scale/model_width+.008,4),'profile':entry['after'],'tracking':0,'anchor':anchor}
 if entry.get('kerning'):patch['kerning']=entry['kerning']
 proposal={'id':entry['catalogueId'],'role':entry['role'],'index':0,'patch':patch,'sourcePaintBox':absolute,'uniformHeightCenteredTargetBox':target,'remainingShapeWidthRatio':result['afterWidthRatio']}
 if entry.get('month'):proposal.update({'variantFromMonth':entry['month'],'variantThroughMonth':entry['month']})
 patches.append(proposal);rows.append(result);print(entry['id'],'shape',round(result['beforeWidthRatio'],3),'→',round(result['afterWidthRatio'],3),'patch',patch,flush=True)
board.save(OUT/'shape-comparison.png');(OUT/'metrics.json').write_text(json.dumps(rows,indent=2)+'\n');(OUT/'role-proposal.json').write_text(json.dumps({'status':'Source-derived proposal; shared typography owner must inspect whole-decal collisions and other selections.','registration':'Uniform photo height and horizontal centre, no perspective correction or independent x scaling.','patches':patches},indent=2)+'\n')
