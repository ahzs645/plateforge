#!/usr/bin/env python3
"""Compare the exact MAY construction without stretching source or glyph width."""
from pathlib import Path
import json, subprocess, hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/research/bc-modern-numerals';RENDERED=OUT/'rendered'
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)

def model(profile):
    svg=RENDERED/(profile+'-MAY.svg');png=RENDERED/(profile+'-MAY.png')
    subprocess.run(['inkscape',str(svg),'--export-area-drawing','--export-height=220','--export-filename='+str(png),'--export-background-opacity=0'],capture_output=True,check=True)
    a=Image.open(png).getchannel('A');return a.crop(a.getbbox())

def mask(crop):
    a=ndimage.gaussian_filter(np.asarray(crop.convert('L'),dtype=float),.35);lo,hi=np.percentile(a,[15,85])
    for _ in range(20):
        t=(lo+hi)/2;lo=float(a[a<t].mean());hi=float(a[a>=t].mean())
    t=(lo+hi)/2;b=a<t;lab,_=ndimage.label(b);sizes=np.bincount(lab.ravel());keep=sizes>=max(2,round(b.size*.0005));keep[0]=False
    return Image.fromarray((keep[lab]*255).astype('uint8')),float(t)

def overlay(source,candidate):
    h=200;s=source.resize((round(source.width*h/source.height),h),Image.Resampling.LANCZOS);c=candidate.resize((round(candidate.width*h/candidate.height),h),Image.Resampling.LANCZOS)
    w=max(s.width,c.width)+24;sa=Image.new('L',(w,h+24));ca=Image.new('L',(w,h+24));sa.paste(s,((w-s.width)//2,12));ca.paste(c,((w-c.width)//2,12))
    sa=np.asarray(sa)>100;ca=np.asarray(ca)>100;a=np.full((h+24,w,3),255,dtype=np.uint8);a[sa]=[202,35,121];a[ca]=[0,133,182];a[sa&ca]=[37,40,48]
    return Image.fromarray(a)

before=model('heavy-month-wide');after=model('bordered-may-reconstruction');rows=[]
board=Image.new('RGB',(1320,800),'#f4f6f9');draw=ImageDraw.Draw(board)
draw.text((24,15),'Exact MAY construction — same painted height; width preserved',font=FONT,fill='#16243b')
draw.text((24,50),'Magenta = source only   Blue = rendered only   Dark = overlap',font=SMALL,fill='#334155')
for row,(id,file,roi) in enumerate([
    ('1998-type-ii','public/bc-decal-online-review/1998-type-ii/photo.png',[15,15,157,97]),
    ('1999-thick','public/data/decal-review/sources/1999.webp',[10,9,101,62]),
]):
    folder=OUT/'evidence'/id;folder.mkdir(exist_ok=True);sourcefile=ROOT/file;photo=Image.open(sourcefile).convert('RGB');crop=photo.crop(roi);m,t=mask(crop);source=m.crop(m.getbbox())
    crop.save(folder/'source-crop.png');m.save(folder/'source-mask.png')
    boxes=[];lab,_=ndimage.label(np.asarray(m)>128)
    for sl in ndimage.find_objects(lab):
        if sl and sl[0].stop-sl[0].start>m.height*.5:
            y,x=sl;boxes.append([x.start,y.start,x.stop,y.stop])
    boxes.sort()
    if len(boxes)!=3:raise RuntimeError(f'{id}: expected three disconnected MAY glyphs, got {boxes}')
    ratios=[]
    for col,(candidate,label) in enumerate([(before,'Before'),(after,'After')]):
        im=overlay(source,candidate);im.save(folder/(label.lower()+'-shape.png'))
        x=24+col*660;y=95+row*350;draw.text((x,y),id+' · '+label,font=FONT,fill='#16243b');board.paste(im,(x+(610-im.width)//2,y+50))
        ratio=(candidate.width/candidate.height)/(source.width/source.height);ratios.append(ratio)
        draw.text((x,y+292),f'Width at equal height / source: {ratio:.3f}',font=SMALL,fill='#334155')
    rows.append({'id':id,'sourceFile':file,'sourceFileSha256':hashlib.sha256(sourcefile.read_bytes()).hexdigest(),'roiPixels':roi,'sourcePaintedPixels':[source.width,source.height],
        'occurrences':[{'character':c,'boxInCrop':b,'widthPerOwnHeight':(b[2]-b[0])/(b[3]-b[1]),'startPerRunHeight':(b[0]-boxes[0][0])/source.height} for c,b in zip('MAY',boxes)],
        'beforeRunWidthRatio':ratios[0],'afterRunWidthRatio':ratios[1],'sourceThreshold':t,'newNativeAdvances':[82.5,65,62],'runKerning':{'AY':-14},
        'limits':'Small unrectified photographs. M/A/Y are independent clean reconstructions, not an identified font. Pair overlap is a bounding-box relationship; painted strokes remain separate.'})
    print(id,'width ratios',*[round(v,4) for v in ratios],flush=True)
board.save(OUT/'bordered-may-shapes.png');(OUT/'bordered-may-metrics.json').write_text(json.dumps(rows,indent=2)+'\n')
