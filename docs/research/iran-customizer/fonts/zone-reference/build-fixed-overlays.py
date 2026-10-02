#!/usr/bin/env python3
"""After rendering *-ink.svg to 1000×500 PNG with Inkscape, audit fixed source-plane ink."""
from PIL import Image,ImageDraw
import numpy as np,json
from pathlib import Path
D=Path(__file__).resolve().parent;records=[]
for z in ['chabahar','qeshm']:
 src=Image.open(D/(z+'-source.png')).convert('RGB').resize((1000,500));ink=Image.open(D/(z+'-ink.png')).convert('RGBA');a=np.array(src);b=np.array(ink)[:,:,3]/255;roi=np.zeros((500,1000),bool);roi[296 if z=='chabahar' else 280:452,20:244]=True
 if z=='chabahar': ref=(a[:,:,0]>130)&(a[:,:,1]>130)&(a[:,:,2]>170)&roi
 else: ref=(a[:,:,:3].mean(2)<130)&roi
 mask=b>.5;overlay=np.ones((500,1000,3),np.uint8)*255;overlay[ref]=[240,100,90];overlay[mask]=[0,150,210];overlay[ref&mask]=[30,30,30]
 composite=Image.fromarray(overlay);board=Image.new('RGB',(900,630),'white');d=ImageDraw.Draw(board)
 for i,im in enumerate([src,Image.composite(Image.new('RGB',(1000,500),'black'),Image.new('RGB',(1000,500),'white'),ink.getchannel('A')),composite]):
  crop=im.crop((20,280,244,452)).resize((280,215));board.paste(crop,(10+i*300,35));d.text((10+i*300,10),['Source crop','Smooth native outline','Fixed overlay red/source cyan/path'][i],fill='black')
 board=board.crop((0,0,900,265));board.save(D/(z+'-fixed-overlay.png'))
 inter=(ref&mask).sum();union=(ref|mask).sum();records.append(dict(zone=z,sourcePixels=int(ref.sum()),reconstructionPixels=int(mask.sum()),intersectionOverUnion=round(float(inter/union),4),sourceRecall=round(float(inter/ref.sum()),4),pathPrecision=round(float(inter/mask.sum()),4),registration='Identity, source 250×125 pixel plane, rendered at uniform 4×; no fitted rotation, stretch or local warp',threshold='Source RGB bright/white on blue for Chabahar; grayscale <130 for Qeshm; reconstruction alpha >.5',cropPixelsAtSource=[5,74 if z=='chabahar' else 70,61,113]))
(D/'fixed-overlay-metrics.json').write_text(json.dumps(records,indent=2)+'\n')
print(records)
