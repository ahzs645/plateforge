#!/usr/bin/env python3
from PIL import Image,ImageDraw
import numpy as np,json
from pathlib import Path
D=Path(__file__).resolve().parent;records=[]
for name,x,y in [('wide',80,77),('tall',97,67)]:
 src=Image.open(D/(name+'-latin-source.png')).convert('RGB').resize((1000,500));ink=Image.open(D/(name+'-latin-ink.png')).convert('RGBA');a=np.array(src);b=np.array(ink)[:,:,3]/255;roi=np.zeros((500,1000),bool);roi[y*4:114*4,x*4:240*4]=True;ref=(a.mean(2)<130)&roi;mask=(b>.5)&roi
 overlay=np.ones((500,1000,3),np.uint8)*255;overlay[ref]=[240,100,90];overlay[mask]=[0,150,210];overlay[ref&mask]=[30,30,30];board=Image.new('RGB',(970,440),'white');draw=ImageDraw.Draw(board)
 for i,im in enumerate([src,Image.composite(Image.new('RGB',(1000,500),'black'),Image.new('RGB',(1000,500),'white'),ink.getchannel('A')),Image.fromarray(overlay)]):
  cr=im.crop((x*4,y*4,240*4,114*4));cr.thumbnail((950,115));board.paste(cr,(10,20+i*140));draw.text((10,5+i*140),['Source','Native contours','Fixed identity overlay: red source, cyan reconstruction'][i],fill='black')
 board.save(D/(name+'-latin-fixed-overlay.png'));records.append(dict(role=name,intersectionOverUnion=float((ref&mask).sum()/(ref|mask).sum()),precision=float((ref&mask).sum()/mask.sum()),recall=float((ref&mask).sum()/ref.sum()),registration='fixed source pixel plane, uniform 4x; no local registration or nonuniform stretching',sourceObserved='12356' if name=='wide' else '12365'))
(D/'latin-fixed-overlay-metrics.json').write_text(json.dumps(records,indent=2)+'\n');print(records)
