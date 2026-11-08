#!/usr/bin/env python3
"""Reproducible unrectified-source comparisons; normalize height uniformly only.

Masks are derived evidence, never replacements for the supplied photographs.
The 2004 core digits join at some thresholds, so only the whole run is scored.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import subprocess
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFont

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
RENDERED=HERE/'rendered'
EVIDENCE=HERE/'evidence'
EVIDENCE.mkdir(exist_ok=True)
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21)
S=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
XS=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
BLUE=(0,130,182); MAGENTA=(205,35,120); OVERLAP=(37,40,48)

CASES=[
    dict(id='1983-jun',case='1983-jun',text='JUN',file='public/bc-decal-corrections/evidence/1983/source.png',roi=[5,7,96,65],light=True,primary=True),
    dict(id='1999-may',case='1999-may',text='MAY',file='public/bc-decal-corrections/evidence/1999/source.png',roi=[8,9,101,63],light=False,primary=True),
    dict(id='2004-mar',case='2004-year',text='04',file='public/bc-decal-corrections/evidence/2004/source.png',roi=[165,8,215,56],light=False,primary=True),
    dict(id='1983-jan',case='1983-jun',text='JAN',checkCharacters='JN',file='docs/research/bc-decal-residuals/lettering/sources/1983-JANX.jpg',roi=[3,9,87,65],light=True),
    dict(id='1983-jul-bcpl8s',case='1983-jun',text='JUL',checkCharacters='JU',file='docs/research/bc-decal-residuals/lettering/sources/1983-86105841.jpg',roi=[8,9,90,65],light=True),
    dict(id='1983-jul-commons',case='1983-jun',text='JUL',checkCharacters='JU',file='docs/research/bc-decal-residuals/lettering/sources/commons-1983-jul.jpg',roi=[15,35,285,230],light=True,licence='CC BY-SA 2.0',author='Jerry Woody'),
    dict(id='1999-mar',case='1999-may',text='MAR',checkCharacters='MA',file='docs/research/bc-decal-residuals/lettering/sources/1999-52069021.jpg',roi=[10,10,105,65],light=False),
    dict(id='1999-jan-commons',case='1999-may',text='JAN',checkCharacters='A',file='docs/research/bc-decal-residuals/lettering/sources/commons-1999-jan.jpg',roi=[36,28,323,211],light=False,licence='CC BY-SA 2.0',author='Jerry Woody'),
    dict(id='1999-may-alternate-crop',case='1999-may',text='MAY',file='docs/research/bc-decal-residuals/lettering/sources/1999-54174570.jpg',roi=[11,11,99,63],light=False,duplicateOf='1999-may'),
    *[dict(id='2004-'+month,case='2004-year',text='04',file='docs/research/bc-decal-residuals/lettering/sources/'+file,roi=[155,8,215,56],light=False) for month,file in [
        ('jan','2004-40724602.jpg'),('feb','2004-41568474.jpg'),('jul','2004-48794381.jpg'),('nov','2004-64276099.jpg'),('dec','2004-65242308.jpg')]],
]

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def bbox(mask):
    b=mask.getbbox()
    if not b: raise ValueError('Empty mask')
    return b
def trim(mask): return mask.crop(bbox(mask))
def ratio(mask): return mask.width/mask.height
def normalized(mask,h=180):
    return mask.resize((round(mask.width*h/mask.height),h),Image.Resampling.LANCZOS)
def compare(source,model,h=180):
    a=normalized(source,h);b=normalized(model,h);w=max(a.width,b.width)+24
    ca=Image.new('L',(w,h+24));cb=Image.new('L',(w,h+24))
    ca.paste(a,((w-a.width)//2,12));cb.paste(b,((w-b.width)//2,12))
    ma=np.asarray(ca)>100;mb=np.asarray(cb)>100
    rgb=np.full((h+24,w,3),255,np.uint8);rgb[ma]=MAGENTA;rgb[mb]=BLUE;rgb[ma&mb]=OVERLAP
    return Image.fromarray(rgb)
def rasterize(p):
    out=p.with_suffix('.png')
    if not out.exists() or out.stat().st_mtime<p.stat().st_mtime:
        subprocess.run(['inkscape',str(p),'--export-area-drawing','--export-height=300','--export-background-opacity=0','--export-filename='+str(out)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    return out
def model(case,key,text):
    p=RENDERED/f'{case}--{key}--{text}.png'
    return trim(Image.open(p).getchannel('A'))
def source_components(a,threshold,light):
    mask=a>threshold if light else a<threshold
    lab,_=ndimage.label(mask)
    boxes=[];keep=np.zeros_like(mask)
    for label,sl in enumerate(ndimage.find_objects(lab),1):
        if not sl: continue
        y,x=sl
        if y.stop-y.start < a.shape[0]*.60: continue
        keep |= lab==label
        boxes.append([x.start,y.start,x.stop,y.stop])
    boxes.sort()
    return Image.fromarray((keep*255).astype('uint8')),boxes,lab
def evaluate_threshold_sample(a,threshold,light):
    """Keep invalid thresholds visible, but never assign them a usable ratio."""
    mask,boxes,labels=source_components(a,threshold,light)
    sample={'threshold':round(threshold,3),'components':len(boxes),'accepted':False,'rejectionReasons':[],
        'paintedBoxInCrop':None,'widthPerHeight':None,'classMeanDifference':None}
    low=a[a<threshold];high=a[a>=threshold]
    if not low.size or not high.size:
        sample['rejectionReasons'].append('Threshold does not separate two populated intensity classes')
    else:
        sample['classMeanDifference']=float(high.mean()-low.mean())
        if sample['classMeanDifference']<25:
            sample['rejectionReasons'].append('Insufficient intensity-class contrast: below 25 luminance levels')
    b=mask.getbbox()
    if b:
        sample['paintedBoxInCrop']=list(b)
        sample['cropClearancePixels']=[b[0],b[1],mask.width-b[2],mask.height-b[3]]
        if min(sample['cropClearancePixels'])<=0:
            sample['rejectionReasons'].append('Painted component touches the crop boundary')
        if b[3]-b[1]<12:
            sample['rejectionReasons'].append('Painted height is below 12 pixels')
    else:
        sample['rejectionReasons'].append('No sufficiently tall painted component')
    if not sample['rejectionReasons']:
        sample['accepted']=True
        sample['widthPerHeight']=ratio(mask.crop(b))
    return sample,mask,boxes,labels
def source_mask(crop,light):
    a=np.asarray(crop.convert('L'),dtype=float)
    lo,hi=np.percentile(a,[15,85])
    for _ in range(24):
        t=(lo+hi)/2
        if not np.any(a<t) or not np.any(a>=t):raise ValueError('Insufficient contrast')
        lo=float(a[a<t].mean());hi=float(a[a>=t].mean())
    t=(lo+hi)/2
    central,mask,boxes,labels=evaluate_threshold_sample(a,t,light)
    if not central['accepted']:
        raise ValueError('Invalid central source threshold: '+str(central))
    sensitivity=[]
    for dt in [-12,-6,0,6,12]:
        sample,_,_,_=evaluate_threshold_sample(a,t+dt,light)
        sensitivity.append(sample)
    return mask,boxes,labels,t,sensitivity,central

if __name__=='__main__':
    paths=list(RENDERED.glob('*.svg'))
    with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(rasterize,paths))
    metrics=[];primary=[];occurrence_cards=[]
    for c in CASES:
        folder=EVIDENCE/c['id'];folder.mkdir(exist_ok=True)
        sourcefile=ROOT/c['file'];photo=Image.open(sourcefile).convert('RGB');crop=photo.crop(c['roi'])
        mask,boxes,labels,t,sensitivity,central=source_mask(crop,c['light'])
        source=trim(mask);crop.save(folder/'source-crop.png');mask.save(folder/'source-mask.png')
        valid_sensitivity=[s for s in sensitivity if s['accepted']]
        assert valid_sensitivity, 'No accepted threshold measurements'
        record={**c,'sourceSha256':digest(sourcefile),'pixels':list(photo.size),'threshold':t,'sourcePaintedBoxInCrop':list(bbox(mask)),
            'sourcePaintedPixels':list(source.size),'sourceWidthPerHeight':ratio(source),'thresholdValidation':central,'sensitivity':sensitivity,
            'sourceWidthPerHeightSensitivityRange':[min(s['widthPerHeight'] for s in valid_sensitivity),max(s['widthPerHeight'] for s in valid_sensitivity)],
            'sensitivitySummary':{'accepted':len(valid_sensitivity),'rejected':len(sensitivity)-len(valid_sensitivity),'rangePolicy':'Only accepted samples contribute to ranges; rejected samples remain in this ledger with null widthPerHeight.'},
            'alignment':'Equal painted height and horizontal centre, scaled uniformly. No x stretch, perspective correction, or score-based contour fitting.',
            'occurrences':[]}
        if c.get('primary') or c['text'] in ['04','MAY']:
            before=model(c['case'],'before',c['text']);after=model(c['case'],'after',c['text'])
            record.update(beforeWidthPerHeight=ratio(before),afterWidthPerHeight=ratio(after),beforeRunWidthRatio=ratio(before)/ratio(source),afterRunWidthRatio=ratio(after)/ratio(source))
            for key,m in [('before',before),('after',after)]:
                values=[ratio(m)/s['widthPerHeight'] for s in valid_sensitivity]
                record[key+'RunWidthRatioSensitivityRange']=[min(values),max(values)]
            a=compare(source,before);b=compare(source,after);a.save(folder/'before-shape.png');b.save(folder/'after-shape.png')
            if c.get('primary'): primary.append((c,source,before,after,record))
        # Keep unstable 2004 joined glyphs out of per-character scoring.
        stable=len(boxes)==len(c['text']) and all(s['accepted'] and s['components']==len(c['text']) for s in sensitivity)
        reason='Every sensitivity sample valid; stable component count over threshold±12' if stable else 'Joined or unstable source components; whole-run extent retained, per-glyph scores withheld.'
        if len(valid_sensitivity)!=len(sensitivity):reason='At least one sensitivity threshold rejected; per-glyph scores withheld.'
        record['glyphSegmentation']={'accepted':stable,'reason':reason}
        if stable:
            for i,(char,box) in enumerate(zip(c['text'],boxes)):
                if c.get('checkCharacters') and char not in c['checkCharacters']:continue
                # Extract only this connected component, avoiding neighbours in overlapping boxes.
                x0,y0,x1,y1=box
                region=np.asarray(mask)[y0:y1,x0:x1].copy()
                labsub=labels[y0:y1,x0:x1];ids,counts=np.unique(labsub,return_counts=True)
                candidates=[(count,label) for count,label in zip(counts,ids) if label]
                own=max(candidates)[1];region[labsub!=own]=0
                glyph=trim(Image.fromarray(region));glyph.save(folder/f'{i}-{char}-mask.png')
                before=model(c['case'],'before',char);after=model(c['case'],'after',char)
                o={'index':i,'character':char,'boxInCrop':box,'sourcePaintedPixels':list(glyph.size),'sourceWidthPerHeight':ratio(glyph),
                    'startPerRunHeight':(x0-bbox(mask)[0])/source.height,'beforeWidthPerHeight':ratio(before),'afterWidthPerHeight':ratio(after)}
                record['occurrences'].append(o)
                occurrence_cards.append((c['id'],char,i,glyph,before,after,o,crop.crop(box)))
        metrics.append(record)
        print(c['id'],'ratio',round(record.get('beforeRunWidthRatio',0),4),round(record.get('afterRunWidthRatio',0),4),'glyphs',record['glyphSegmentation']['accepted'])
    (HERE/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
    board=Image.new('RGB',(1560,len(primary)*420+100),'#f1f4f8');d=ImageDraw.Draw(board)
    d.text((24,16),'Residual lettering — first-pass implementation versus revised observed forms',font=F,fill='#17243a')
    d.text((24,50),'Magenta = source only · Blue = model only · Dark = overlap · Equal height, original width preserved',font=S,fill='#334155')
    for n,(c,source,before,after,rec) in enumerate(primary):
        y=100+n*420;d.text((24,y),c['id']+' · '+c['text'],font=F,fill='#17243a')
        crop=Image.open(EVIDENCE/c['id']/'source-crop.png');crop.thumbnail((400,110));
        scale=min(400/crop.width,110/crop.height);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.NEAREST)
        board.paste(crop,(24,y+40))
        d.text((24,y+165),'Original photographic crop',font=S,fill='#334155')
        d.text((24,y+194),str(rec['sourcePaintedPixels'])+' painted pixels',font=S,fill='#334155')
        for j,(label,m,ratio_key) in enumerate([('First pass',before,'beforeRunWidthRatio'),('Revised',after,'afterRunWidthRatio')]):
            x=460+j*540;im=compare(source,m,235);board.paste(im,(x+(500-im.width)//2,y+40))
            d.text((x,y),label,font=F,fill='#17243a')
            d.text((x,y+325),f'Width/source at equal height: {rec[ratio_key]:.3f}',font=S,fill='#334155')
            lo,hi=rec[ratio_key+'SensitivityRange']
            d.text((x,y+351),f'Accepted threshold range: {lo:.3f}–{hi:.3f}',font=XS,fill='#475569')
        d.text((24,y+375),'Photographs remain unrectified. Width ratios diagnose proportions; they are not accuracy scores.',font=XS,fill='#475569')
    board.save(HERE/'shape-comparison.png')
    cols=4;cw=370;ch=470;rows=(len(occurrence_cards)+cols-1)//cols
    board=Image.new('RGB',(cw*cols,80+rows*ch),'#f1f4f8');d=ImageDraw.Draw(board)
    d.text((20,16),'Each observed occurrence — repeated letters remain separate',font=F,fill='#17243a')
    d.text((20,48),'Original crop / first pass overlay / revised overlay. Height normalized per occurrence; width retained.',font=S,fill='#334155')
    for n,(cid,char,i,src,before,after,o,photo) in enumerate(occurrence_cards):
        x=(n%cols)*cw;y=80+(n//cols)*ch
        d.text((x+12,y+5),f'{cid} #{i+1}: {char}',font=S,fill='#17243a')
        p=photo.resize((round(photo.width*80/photo.height),80),Image.Resampling.NEAREST);board.paste(p,(x+12,y+34))
        d.text((x+130,y+40),f'Source w/h {ratio(src):.3f}',font=XS,fill='#334155')
        for row,(name,m) in enumerate([('First',before),('Revised',after)]):
            yy=y+126+row*160;im=compare(src,m,130);board.paste(im,(x+70,yy))
            d.text((x+12,yy+5),name,font=XS,fill='#334155')
            d.text((x+250,yy+8),f'w/h {ratio(m):.3f}',font=XS,fill='#334155')
    board.save(HERE/'occurrence-comparison.png')
    manifest=json.loads((RENDERED/'manifest.json').read_text());nativekeys=sorted({m['key'] for m in manifest if m['key'] not in ['before','after']})
    trial=[];cw=420;ch=260;rows=(len(nativekeys)+3)//4
    board=Image.new('RGB',(cw*4,80+rows*ch*3),'white');d=ImageDraw.Draw(board)
    d.text((20,14),'Unmodified native candidate comparisons — no automatic winner or historical identity claim',font=F,fill='#17243a')
    for case_idx,(c,src,_,_,rec) in enumerate(primary):
        for j,key in enumerate(nativekeys):
            x=j%4*cw;y=80+case_idx*rows*ch+j//4*ch;candidate=model(c['case'],key,c['text'])
            im=compare(src,candidate,160);im.thumbnail((390,195),Image.Resampling.LANCZOS);board.paste(im,(x+(cw-im.width)//2,y+36))
            d.text((x+8,y+6),c['id']+' · '+key,font=S,fill='#17243a')
            d.text((x+8,y+228),f'Width/source {ratio(candidate)/ratio(src):.3f}',font=XS,fill='#475569')
            trial.append({'id':c['id'],'profile':key,'widthAtEqualHeightRatio':ratio(candidate)/ratio(src)})
    board.save(HERE/'native-candidates.png');(HERE/'native-candidate-metrics.json').write_text(json.dumps(trial,indent=2)+'\n')
    # Paint topology catches accidental even-odd overlaps and lost counters.
    checks=[]
    for record in manifest:
        if record['key']!='after':continue
        painted=np.asarray(Image.open(RENDERED/record['file'].replace('.svg','.png')).getchannel('A'))>128
        components=ndimage.label(painted)[1]
        holes=ndimage.label(ndimage.binary_fill_holes(painted)&~painted)[1]
        wanted_components=len(record['text']);wanted_holes=sum(ch in 'A04' for ch in record['text'])
        assert components==wanted_components,(record['file'],'unexpected touching or detached ink',components)
        assert holes==wanted_holes,(record['file'],'lost or extra counter',holes)
        assert record['fit']=='natural'
        checks.append({'file':record['file'],'text':record['text'],'fit':record['fit'],'paintedComponents':components,'openCounters':holes,'passed':True})
    (HERE/'render-verification.json').write_text(json.dumps({'scope':'Isolated actual-engine SVGs rasterized by Inkscape at 300 painted pixels high; not a browser/export parity claim.','comparisonRuns':len(manifest),'naturalRuns':sum(r['fit']=='natural' for r in manifest),'checks':checks,'passed':all(r['passed'] for r in checks),'glyphSegmentationExcluded':[r['id'] for r in metrics if not r['glyphSegmentation']['accepted']],'sourceSensitivity':{'accepted':sum(r['sensitivitySummary']['accepted'] for r in metrics),'rejected':sum(r['sensitivitySummary']['rejected'] for r in metrics),'rangePolicy':'Invalid samples are retained with reasons and excluded from ratios and glyph acceptance.'}},indent=2)+'\n')
    may=next(r for r in metrics if r['id']=='1999-may')
    old_crop=Image.open(ROOT/may['file']).convert('L').crop([10,9,101,63])
    old_sample,_,_,_=evaluate_threshold_sample(np.asarray(old_crop,dtype=float),142.523,False)
    (HERE/'audit-correction.json').write_text(json.dumps({'issue':'The initial MAY crop reached its left boundary at the high sensitivity threshold; that sample had incorrectly contributed to the reported range.','originalRoi':[10,9,101,63],'originalHighThresholdReevaluated':old_sample,'correctedRoi':may['roi'],'correctedSensitivity':may['sensitivity'],'correctedAfterWidthRatio':may['afterRunWidthRatio'],'correctedAfterRatioSensitivityRange':may['afterRunWidthRatioSensitivityRange'],'finding':'The wider crop provides at least two pixels of clearance at all five tested thresholds. The corrected valid range is numerically unchanged; invalid measurements are nevertheless excluded by policy.','productionGlyphsChangedByThisAuditCorrection':False,'regressionTests':'docs/research/bc-decal-residuals/lettering/test_analysis.py'},indent=2)+'\n')
