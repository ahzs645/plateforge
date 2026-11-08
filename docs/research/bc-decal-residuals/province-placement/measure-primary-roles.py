#!/usr/bin/env python3
"""Inspect explicitly bounded secondary-printing regions in the pinned sources.

The mask only describes approximate paint extent. No contour score is produced
for tiny, damaged or unstable specimens. Photo dimensions/perspective remain.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
GALLERY=ROOT/'public/bc-decal-corrections/evidence'
OUT=HERE/'primary-measurements';OUT.mkdir(exist_ok=True)
# Pixel inspection rectangles; x2/y2 are exclusive. They are not claimed as
# exact physical ink contours. Each plot shows the ROI and retained mask.
REGIONS={
 '1971': {'serial':([19,61,101,83],'dark'), 'british':([9,5,102,26],'light'), 'columbia':([0,24,119,44],'light')},
 '1974': {'serial':([37,45,119,67],'dark'), 'british':([32,7,110,23],'green'), 'columbia':([23,22,120,39],'green')},
 '1975': {'serial':([32,49,129,75],'dark'), 'british':([9,4,96,25],'light'), 'columbia':([9,24,106,43],'light'), 'year':([103,6,149,42],'light')},
 '1976': {'serial':([32,63,129,90],'dark'), 'british':([11,8,80,26],'light'), 'columbia':([11,26,103,44],'light')},
 '1977': {'serial':([26,68,118,87],'dark')},
 '1978': {'serial':([20,67,135,92],'dark')},
 '1980': {'serial':([119,49,186,62],'dark')},
 '1981': {'british':([108,7,191,23],'light'), 'columbia':([96,21,198,37],'light'), 'serial':([109,41,180,60],'dark')},
 '1982': {'british':([110,40,188,55],'light'), 'columbia':([99,52,201,69],'light'), 'serial':([106,14,186,34],'dark')},
 '1985': {'province':([85,51,189,65],'blue')},
 '1987': {'british':([117,10,188,29],'red'), 'columbia':([111,28,192,42],'red'), 'serial':([116,47,189,68],'dark')},
 '1988': {'british':([123,10,169,25],'blue'), 'columbia':([116,24,174,36],'blue')},
 '1989': {'serial':([110,36,179,54],'dark')},
 '1990': {'serial':([109,51,177,69],'dark')},
 '1991': {'serial':([113,46,180,63],'dark')},
 '1992': {'serial':([103,45,173,63],'dark')},
 '1993': {'serial':([104,44,173,63],'dark')},
 '1994': {'serial':([106,40,176,57],'dark')},
 '1995': {'serial':([105,45,176,63],'dark')},
 '1996': {'serial':([109,41,178,61],'dark')},
 '1996-pink': {'serial':([108,40,174,60],'dark')},
 '1997': {'serial':([109,43,175,62],'dark')},
 '1998': {'serial':([106,40,174,60],'dark')},
 '2004': {'british':([139,30,167,38],'dark'), 'columbia':([136,38,171,45],'dark')},
 '2005': {'british':([125,43,167,52],'dark'), 'columbia':([121,53,169,63],'dark'), 'serial':([136,73,224,96],'dark')},
 '2006': {'british':([128,41,169,51],'black'), 'columbia':([123,50,174,60],'black'), 'serial':([137,73,228,94],'dark')},
 '2007': {'british':([127,42,168,51],'dark'), 'columbia':([122,52,172,61],'dark'), 'serial':([135,73,227,96],'dark')},
 '2009': {'british':([118,28,153,40],'dark'), 'columbia':([112,40,158,53],'dark'), 'serial':([130,72,227,96],'dark')},
 '2010': {'british':([112,15,165,36],'dark'), 'columbia':([105,35,175,53],'dark'), 'serial':([122,65,221,90],'dark'), 'barcode':([4,65,125,91],'dark'), 'month':([7,1,96,65],'dark'), 'year':([174,1,230,65],'dark')},
 '2011': {'british':([112,19,164,38],'dark'), 'columbia':([103,38,173,56],'dark')},
 '2012': {'british':([113,20,165,39],'dark'), 'columbia':([106,39,176,56],'dark'), 'serial':([135,70,230,96],'dark'), 'barcode':([4,67,125,97],'dark'), 'month':([6,3,101,67],'dark'), 'year':([180,4,235,67],'dark')},
 '2013': {'british':([111,20,163,39],'dark'), 'columbia':([103,39,171,56],'dark')},
}

def score(a,kind):
    a=a.astype(float)
    if kind=='light':return np.minimum(a[:,:,0],a[:,:,1])
    if kind=='black':return 255-np.max(a,axis=2)
    if kind=='red':return a[:,:,0]-a[:,:,1]
    if kind=='blue':return (a[:,:,2]-a[:,:,0])*.6+255-(a[:,:,0]*.299+a[:,:,1]*.587+a[:,:,2]*.114)
    if kind=='green':return (a[:,:,1]-a[:,:,0])*.5+255-(a[:,:,0]*.299+a[:,:,1]*.587+a[:,:,2]*.114)
    return 255-(a[:,:,0]*.299+a[:,:,1]*.587+a[:,:,2]*.114)

def masked(score,threshold):
    labels,n=ndimage.label(score>threshold)
    sizes=np.bincount(labels.ravel());keep=sizes>=max(2,score.shape[0]*.12);keep[0]=False
    mask=keep[labels];ys,xs=np.where(mask)
    if not len(xs):return mask,None
    return mask,[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]

def main():
    records=[];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
    for key,regions in REGIONS.items():
        source=GALLERY/key/'source.png';photo=Image.open(source).convert('RGB');pw,ph=photo.size
        image=photo.resize((pw*4,ph*4));draw=ImageDraw.Draw(image)
        for role,(roi,kind) in regions.items():
            arr=np.array(photo.crop(roi));values=score(arr,kind)
            low,high=np.percentile(values,[10,90]);threshold=(low+high)/2
            if key == '1971' and role == 'serial': threshold=180
            mask,box=masked(values,threshold)
            if box is None:raise ValueError(key+'/'+role)
            variants=[]
            for shift in [-.08,0,.08]:
                trial_threshold=threshold+(high-low)*shift
                trial_mask,trial_box=masked(values,trial_threshold)
                reasons=[]
                if trial_box is None:reasons.append('empty mask')
                elif trial_box[0]==0 or trial_box[1]==0 or trial_box[2]==roi[2]-roi[0] or trial_box[3]==roi[3]-roi[1]:reasons.append('paint touches inspection ROI')
                if high-low<25:reasons.append('insufficient local contrast')
                variants.append({'contrastShift':shift,'threshold':float(trial_threshold),'boxInRoi':trial_box,'accepted':not reasons,'rejectionReasons':reasons})
            global_box=[box[i]+roi[i%2] for i in range(4)]
            touches = box[0] == 0 or box[1] == 0 or box[2] == roi[2]-roi[0] or box[3] == roi[3]-roi[1]
            entry={'id':key,'role':role,'sourceFile':str(source.relative_to(ROOT)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourcePixels':[pw,ph],
                   'inspectionRoi':roi,'polarity':kind,'threshold':threshold,'thresholdSamples':variants,'acceptedThresholdPaintBoxesInRoi':[v['boxInRoi']for v in variants if v['accepted']],'paintBox':global_box,
                   'paintPixels':[box[2]-box[0],box[3]-box[1]],'sourceHeightTooSmallForContourClaims':box[3]-box[1]<12,
                   'touchesInspectionRoi':touches,'extentAccepted':variants[1]['accepted'],
                   'rejectionReasons':variants[1]['rejectionReasons'],
                   'method':'Inspection ROI and contrast midpoint; small components removed; +/-8% local contrast threshold sensitivity retained. Extent diagnostic only; source is unrectified.'}
            Image.fromarray((mask*255).astype('uint8')).save(OUT/(key+'-'+role+'-mask.png'))
            photo.crop(roi).save(OUT/(key+'-'+role+'-crop.png'))
            draw.rectangle(tuple(v*4 for v in roi),outline='#ff7b00',width=2)
            draw.rectangle(tuple(v*4 for v in global_box),outline='#00ffbb',width=2)
            records.append(entry)
        image.save(OUT/(key+'-regions.png'))
    (OUT/'metrics.json').write_text(json.dumps(records,indent=2)+'\n')
    print(len(records),'measured role occurrences')
    for row in records:print(row['id'],row['role'],row['paintBox'],row['paintPixels'])

if __name__=='__main__':main()
