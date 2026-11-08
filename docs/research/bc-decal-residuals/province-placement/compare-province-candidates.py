#!/usr/bin/env python3
"""Native, uncompressed candidate comparisons for observed province words.

All shape strips match painted height uniformly. Relative width is preserved;
these are diagnostic comparisons, not historical typeface identifications.
"""
from concurrent.futures import ThreadPoolExecutor
import html
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
OUT=HERE/'candidate-comparison'
OUT.mkdir(exist_ok=True)
PROFILES={}
for path in ['src/templates/dies/decal-printing.json','src/templates/dies/decal-audit-printing.json','docs/research/decal-online-analysis/candidate-outlines.json']:
    PROFILES.update(json.loads((ROOT/path).read_text()))
PROFILES.update(json.loads((HERE/'province-profile.json').read_text()))
CANDIDATES=['normal','regular','control-bold','condensed-bold','archivo-900-wdth100','archivo-700-wdth100','archivo-900-wdth75','orbitron-900','orbitron-700','russoone-400','michroma-400','robotocondensed-700']
CANDIDATES.append('province-wide-1981-reconstruction')
CANDIDATES.append('province-tall-2010-reconstruction')
CANDIDATES.extend(['control','condensed-medium','oswald-400','oswald-500','oswald-600','archivonarrow-400','archivonarrow-600','archivonarrow-700','heavy-month-wide'])
SOURCES=[
    {'id':'1981-oct-british','source':'1981-oct.jpg','text':'BRITISH','box':[350,20,615,71],'mask':'light'},
    {'id':'1981-oct-columbia','source':'1981-oct.jpg','text':'COLUMBIA','box':[310,70,653,116],'mask':'light'},
    {'id':'1982-jul-british','source':'1982-jul.jpg','text':'BRITISH','box':[388,142,595,178],'mask':'light'},
    {'id':'1985-feb-province','source':'1985-feb.jpg','text':'BRITISH COLUMBIA','box':[283,169,607,214],'mask':'dark'},
    {'id':'1987-feb-british','source':'1987-feb.jpg','text':'BRITISH','box':[380,45,596,95],'mask':'red'},
    {'id':'1987-feb-columbia','source':'1987-feb.jpg','text':'COLUMBIA','box':[347,94,622,145],'mask':'red'},
    {'id':'1988-feb-british','source':'1988-feb.jpg','text':'BRITISH','box':[386,15,531,58],'mask':'dark'},
    {'id':'1988-feb-columbia','source':'1988-feb.jpg','text':'COLUMBIA','box':[362,53,550,100],'mask':'dark'},
    {'id':'2006-apr-british','source':'2006-apr.png','text':'BRITISH','box':[1028,285,1324,360],'mask':'dark'},
    {'id':'2006-apr-columbia','source':'2006-apr.png','text':'COLUMBIA','box':[982,354,1365,431],'mask':'dark'},
    {'id':'2012-aug-british','source':'2012-aug.png','text':'BRITISH','box':[878,155,1254,281],'mask':'dark'},
    {'id':'2012-aug-columbia','source':'2012-aug.png','text':'COLUMBIA','box':[811,284,1306,410],'mask':'dark'},
]

def make_profile_svg(name,text):
    folder=OUT/'native';folder.mkdir(exist_ok=True)
    file=folder/(name+'-'+text.replace(' ','_')+'.svg')
    glyphs=PROFILES[name];cursor=0;parts=[]
    for char in text:
        glyph=glyphs[char]
        parts.append('<g transform="translate(%s 0)">%s</g>'%(cursor,''.join('<path d="'+html.escape(path,quote=True)+'"/>' for path in glyph['paths'])))
        cursor+=glyph['advance']
    file.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="120" viewBox="-5 -10 %s 120"><g fill="black" fill-rule="evenodd">%s</g></svg>'%(cursor+10,cursor+10,''.join(parts)))
    target=file.with_suffix('.png')
    subprocess.run(['inkscape',str(file),'--export-area-drawing','--export-height=100','--export-background-opacity=0','--export-filename='+str(target)],check=True,capture_output=True,timeout=30)
    return name,text,target

def mask_crop(source):
    original=HERE/'sources'/source['source']
    image=Image.open(original).convert('RGB').crop(source['box'])
    a=np.array(image).astype(float)
    if source['mask']=='light': score=a[:,:,1] if source['source'].startswith('1981') else a[:,:,0]
    elif source['mask']=='red':score=a[:,:,0]-a[:,:,1]
    else:score=255-(a[:,:,0]*.299+a[:,:,1]*.587+a[:,:,2]*.114)
    lo,hi=np.percentile(score,[15,90]); threshold=(lo+hi)/2
    trials=[]
    for shift in [-.08,0,.08]:
        trial=score>threshold+(hi-lo)*shift
        labels,count=ndimage.label(trial)
        areas=np.bincount(labels.ravel());keep=areas>=max(4,trial.shape[0]*.3);keep[0]=False;trial=keep[labels]
        ys,xs=np.where(trial);trial_box=None if not len(xs)else[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
        reasons=[]
        if trial_box is None:reasons.append('empty mask')
        elif trial_box[0]==0 or trial_box[1]==0 or trial_box[2]==image.width or trial_box[3]==image.height:reasons.append('paint touches inspection ROI')
        if hi-lo<25:reasons.append('insufficient local contrast')
        if trial_box and trial_box[3]-trial_box[1]<12:reasons.append('source too small for shape comparison')
        trials.append({'contrastShift':shift,'threshold':threshold+(hi-lo)*shift,'paintBoxInRoi':trial_box,'accepted':not reasons,'rejectionReasons':reasons})
        if shift==0:mask=trial;box=trial_box
    if not trials[1]['accepted']:raise ValueError(source['id']+': rejected central shape mask; no width metric accepted')
    paint=image.crop(box)
    mono=Image.fromarray((mask*255).astype('uint8')).crop(box)
    paint.save(OUT/(source['id']+'-crop.png'))
    mono.save(OUT/(source['id']+'-mask.png'))
    return paint,mono,box,threshold,{'sourceSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'thresholdSamples':trials,'acceptedExtentBoxesInRoi':[t['paintBoxInRoi']for t in trials if t['accepted']]}

def font(n):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)

def main():
    jobs=[(name,word) for name in CANDIDATES for word in {item['text']for item in SOURCES} if all(char in PROFILES[name] for char in word)]
    with ThreadPoolExecutor(max_workers=3) as pool:
        rendered={(name,word):path for name,word,path in pool.map(lambda item:make_profile_svg(*item),jobs)}
    metrics=[]
    for source in SOURCES:
        paint,mono,box,threshold,validation=mask_crop(source)
        selected=[name for name in CANDIDATES if (name,source['text']) in rendered]
        board=Image.new('RGB',(1900,100+(len(selected)+1)*116),'#f7f8fb');draw=ImageDraw.Draw(board)
        draw.text((20,15),source['id']+' · source + native candidates at equal painted height',font=font(22),fill='#142238')
        draw.text((20,48),'Black: native candidate. Source crop remains photographic. No independent horizontal scaling.',font=font(16),fill='#42536b')
        def put(image,y):
            w=round(image.width*76/image.height);im=image.resize((w,76),Image.Resampling.LANCZOS)
            if im.mode=='RGBA':board.paste(im,(420,y),im)
            else:board.paste(im,(420,y))
        put(paint,95);draw.text((20,110),'SOURCE '+str(mono.size),font=font(18),fill='#142238')
        row={'id':source['id'],'source':source,'threshold':threshold,'paintBoxInRoi':box,'sourcePaintPixels':list(mono.size),'validation':validation,'candidates':[]}
        for i,name in enumerate(selected):
            im=Image.open(rendered[name,source['text']]).convert('RGBA');ratio=(im.width/im.height)/(mono.width/mono.height)
            put(im,95+(i+1)*116);draw.text((20,105+(i+1)*116),name,font=font(18),fill='#142238');draw.text((20,133+(i+1)*116),'width / source %.3f'%ratio,font=font(16),fill='#42536b')
            row['candidates'].append({'profile':name,'widthAtEqualPaintedHeightRatio':ratio})
        board.save(OUT/(source['id']+'.png'),optimize=True);metrics.append(row)
    (OUT/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')

if __name__=='__main__':main()
