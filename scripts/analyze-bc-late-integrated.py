#!/usr/bin/env python3
"""Integrated source/before/after and placement overlay with original controls."""
from pathlib import Path
import json,subprocess,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/research/bc-late-two-digit-printing/integrated';manifest=json.loads((OUT/'manifest.json').read_text());assert manifest['candidateTypography'] is False
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20);S=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
board=Image.new('RGB',(1840,3*280+95),'#f4f6f9');draw=ImageDraw.Draw(board)
for i,title in enumerate(['Source photograph','Before 17b974f','Integrated after','50/50 source/after overlay']):draw.text((15+i*460,12),title,font=F,fill='#16243b')
draw.text((15,46),'Same source controls; uniform height and horizontal centre; no perspective or width correction; colours uncalibrated',font=S,fill='#334155')
records=[]
for row,record in enumerate(manifest['records']):
 folder=OUT/record['id'];photo=Image.open(ROOT/record['sourceFile']).convert('RGB');images={'source':photo};stages={}
 for stage in ['before','after']:
  root=ET.fromstring((folder/(stage+'.svg')).read_text());runs=[];counts={}
  for el in root.iter():
   role=el.get('data-role')
   if 'data-die' in el.attrib or role=='decal-barcode':
    index=counts.get(role,0);counts[role]=index+1;key='review-'+str(len(runs));el.set('id',key);runs.append({'id':key,'role':role,'index':index,'text':el.get('aria-label'),'profile':el.get('data-die')})
  serial=next(r for r in runs if r['role']=='decal-serial');assert serial['text']==record['control'],(stage,record['id'],serial)
  tagged=folder/(stage+'-tagged.svg');ET.ElementTree(root).write(tagged,encoding='utf-8',xml_declaration=True)
  proc=subprocess.run(['inkscape',str(tagged),'--query-all','--export-area-page','--export-height=400','--export-filename='+str(folder/(stage+'.png')),'--export-background=white','--export-background-opacity=1'],capture_output=True,text=True,check=True)
  boxes={}
  for line in proc.stdout.splitlines():
   fields=line.split(',')
   if len(fields)==5 and fields[0].startswith('review-'):
    x,y,w,h=map(float,fields[1:]);boxes[fields[0]]=[x,y,x+w,y+h]
  for run in runs:
   run['paintBox']=boxes[run.pop('id')]
   if stage=='after':
    x0,y0,x1,y1=run['paintBox'];assert x0>=-.01 and y0>=-.01 and x1<=record['viewBox'][0]+.01 and y1<=100.01,(record['id'],run)
  tagged.unlink();stages[stage]=runs;images[stage]=Image.open(folder/(stage+'.png')).convert('RGB')
 h=400;w=max(round(photo.width*h/photo.height),images['after'].width);aligned={}
 for key,im in images.items():
  scaled=im.resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS);a=Image.new('RGB',(w,h),'white');a.paste(scaled,((w-scaled.width)//2,0));a.save(folder/(key+'-aligned.png'));aligned[key]=a
 aligned['overlay']=Image.blend(aligned['source'],aligned['after'],.5);aligned['overlay'].save(folder/'after-overlay.png')
 for col,key in enumerate(['source','before','after','overlay']):
  im=aligned[key].copy();im.thumbnail((440,210),Image.Resampling.LANCZOS);x=15+col*460;y=95+row*280;board.paste(im,(x+(440-im.width)//2,y))
 draw.text((15,95+row*280+220),record['id']+' '+record['month']+' · control '+record['control']+' · actual integrated typography, no candidate overrides',font=S,fill='#16243b')
 records.append({**record,'sourcePixels':list(photo.size),'stages':stages,'alignment':'Uniform equal height and horizontal centre; no perspective correction or independent x fitting.'})
board.save(OUT/'comparison.png');(OUT/'paint-bounds.json').write_text(json.dumps({'candidateTypography':False,'records':records},indent=2)+'\n');print('Three exact-control integrated comparisons; all after paint bounds inside the decal.')
