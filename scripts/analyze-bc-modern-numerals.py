#!/usr/bin/env python3
"""Occurrence and run overlays with equal painted height and preserved width.

This diagnostic does not calculate an authenticity score or rectify photographs.
Run render-bc-modern-numerals.mjs first. Source crops remain separately visible.
"""
from pathlib import Path
import json, hashlib, subprocess
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/research/bc-modern-numerals';RENDERED=OUT/'rendered';EVIDENCE=OUT/'evidence';EVIDENCE.mkdir(parents=True,exist_ok=True)
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
CASES=[
    ('2015','year','2015',[.522,.01,.99,.685],'anton-400','modern-year-reconstruction'),
    ('2015','control','70118033',[.57,.69,.98,.94],'normal','modern-control-reconstruction'),
    ('2017-nov','year','2017',[.517,.08,.94,.65],'anton-400','modern-year-reconstruction'),
    ('2017-nov','control','91115136',[.59,.70,.96,.93],'normal','modern-control-reconstruction'),
]

def trim(mask):
    box=mask.getbbox()
    if not box:raise RuntimeError('Empty painted mask')
    return mask.crop(box)

def photo_mask(crop):
    a=ndimage.gaussian_filter(np.asarray(crop.convert('L'),dtype=float),.35)
    lo,hi=np.percentile(a,[15,85])
    for _ in range(20):
        threshold=(lo+hi)/2
        lo=float(a[a<threshold].mean());hi=float(a[a>=threshold].mean())
    threshold=(lo+hi)/2;mask=a<threshold
    labels,_=ndimage.label(mask);sizes=np.bincount(labels.ravel());keep=sizes>=max(2,round(mask.size*.0005));keep[0]=False
    return Image.fromarray((keep[labels]*255).astype('uint8')),float(threshold)

def model(profile,text):
    stem=profile+'-'+text;png=RENDERED/(stem+'.png');svg=RENDERED/(stem+'.svg')
    if not png.exists() or png.stat().st_mtime<svg.stat().st_mtime:
        subprocess.run(['inkscape',str(svg),'--export-area-drawing','--export-height=220','--export-filename='+str(png),'--export-background-opacity=0'],capture_output=True,check=True)
    return trim(Image.open(png).getchannel('A'))

def normalize(mask,height=180):
    return mask.resize((round(mask.width*height/mask.height),height),Image.Resampling.LANCZOS)

def overlay(source,candidate,height=180):
    source=normalize(source,height);candidate=normalize(candidate,height);w=max(source.width,candidate.width)+24
    s=Image.new('L',(w,height+24));c=Image.new('L',(w,height+24))
    s.paste(source,((w-source.width)//2,12));c.paste(candidate,((w-candidate.width)//2,12))
    sa=np.asarray(s)>100;ca=np.asarray(c)>100;rgb=np.full((height+24,w,3),255,dtype=np.uint8)
    rgb[sa]=[202,35,121];rgb[ca]=[0,133,182];rgb[sa&ca]=[37,40,48]
    return Image.fromarray(rgb)

def widths(mask):
    return mask.width/mask.height

def midline_counter(mask):
    row=np.asarray(mask)[mask.height//2]>128
    cuts=np.flatnonzero(np.diff(np.r_[False,row,False])).tolist()
    return (cuts[2]-cuts[1])/mask.height if len(cuts)==4 else None

def occurrences(mask,text):
    a=np.asarray(mask)>128;lab,_=ndimage.label(a);boxes=[]
    for sl in ndimage.find_objects(lab):
        if sl and sl[0].stop-sl[0].start>mask.height*.4:
            y,x=sl;boxes.append([x.start,y.start,x.stop,y.stop])
    boxes.sort()
    if len(boxes)!=len(text):raise RuntimeError(f'Expected {len(text)} occurrences in {text}, found {len(boxes)}')
    return [(c,b,mask.crop(b)) for c,b in zip(text,boxes)]

results=[];summary=Image.new('RGB',(1600,4*340+85),'#f4f6f9');sd=ImageDraw.Draw(summary)
sd.text((24,15),'Modern numerals — equal painted height; native width and spacing preserved',font=FONT,fill='#16243b')
sd.text((24,50),'Magenta = source only   Blue = rendered only   Dark = overlap   |   Photographs are not rectified',font=SMALL,fill='#334155')
for row,(id,role,text,roi,before_profile,after_profile) in enumerate(CASES):
    key=id+'-'+role;folder=EVIDENCE/key;folder.mkdir(exist_ok=True)
    sourcefile=ROOT/'public/bc-decal-online-review'/id/'photo.png';photo=Image.open(sourcefile).convert('RGB')
    roi_box=[round(v*(photo.width if i%2==0 else photo.height)) for i,v in enumerate(roi)]
    crop=photo.crop(roi_box);mask,threshold=photo_mask(crop);source=trim(mask)
    crop.save(folder/'source-crop.png');mask.save(folder/'source-mask.png')
    old=model(before_profile,text);new=model(after_profile,text)
    before=overlay(source,old);after=overlay(source,new)
    before.save(folder/'before-shape.png');after.save(folder/'after-shape.png')
    occs=occurrences(mask,text);occ_metrics=[]
    board=Image.new('RGB',(230*len(occs),530),'white');d=ImageDraw.Draw(board)
    d.text((12,8),key+' — each occurrence normalized independently; source bounding boxes are retained in metrics.json',font=SMALL,fill='#16243b')
    for i,(char,box,glyph) in enumerate(occs):
        b=model(before_profile,char);a=model(after_profile,char)
        upper=overlay(glyph,b,180);lower=overlay(glyph,a,180)
        d.text((i*230+12,40),f'{i+1}: {char}  before',font=FONT,fill='#16243b');board.paste(upper,(i*230+(230-upper.width)//2,72))
        d.text((i*230+12,285),f'{i+1}: {char}  after',font=FONT,fill='#16243b');board.paste(lower,(i*230+(230-lower.width)//2,317))
        occ_metrics.append({'index':i,'character':char,'sourceBoxInCrop':box,'sourcePaintedPixels':[glyph.width,glyph.height],
            'sourceWidthPerHeight':round(widths(glyph),5),'beforeWidthPerHeight':round(widths(b),5),'afterWidthPerHeight':round(widths(a),5),
            **({'sourceMidlineCounterPerHeight':midline_counter(glyph),'beforeMidlineCounterPerHeight':midline_counter(b),'afterMidlineCounterPerHeight':midline_counter(a)} if char=='0' else {})})
    board.save(folder/'occurrences.png')
    ratios=[widths(old)/widths(source),widths(new)/widths(source)]
    for col,(im,label,ratio) in enumerate([(before,'Before',ratios[0]),(after,'After',ratios[1])]):
        x=col*800+24;y=85+row*340
        sd.text((x,y+4),key+' · '+text+' · '+label,font=FONT,fill='#16243b')
        im.thumbnail((745,240),Image.Resampling.LANCZOS);summary.paste(im,(x+(745-im.width)//2,y+44))
        sd.text((x,y+292),f'Width at equal height / source: {ratio:.3f}',font=SMALL,fill='#334155')
    results.append({'id':id,'role':role,'text':text,'sourceFile':str(sourcefile.relative_to(ROOT)),'sourceFileSha256':hashlib.sha256(sourcefile.read_bytes()).hexdigest(),
        'roiPixels':roi_box,'threshold':threshold,'sourcePaintedPixels':[source.width,source.height],
        'beforeProfile':before_profile,'afterProfile':after_profile,'beforeRunWidthRatio':ratios[0],'afterRunWidthRatio':ratios[1],
        'occurrences':occ_metrics,'limits':'Unrectified photograph. Whole-run height includes the photographed baseline tilt; occurrence crops remove the run slope but retain local photographic distortion. No x stretching or score-based fitting.'})
    print(key,'width ratios',*[round(v,4) for v in ratios],flush=True)
summary.save(OUT/'shape-comparison.png')
(OUT/'metrics.json').write_text(json.dumps(results,indent=2)+'\n')
alphabet=Image.new('RGB',(1300,610),'white');ad=ImageDraw.Draw(alphabet)
for row,(profile,label) in enumerate([('modern-year-reconstruction','Year: independent specimen constructions; 3/4/6/8/9 have lower-resolution support'),('modern-control-reconstruction','Control: native narrow digits; reconstructed 1; unobserved 2/4 retained as candidates')]):
    glyphs=model(profile,'0123456789');glyphs=normalize(glyphs,200);y=row*305
    ad.text((20,y+15),label,font=SMALL,fill='#16243b')
    alphabet.paste('#111',(20,y+65),glyphs)
alphabet.save(OUT/'numeral-alphabets.png')
