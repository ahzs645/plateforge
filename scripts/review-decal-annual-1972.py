#!/usr/bin/env python3
"""1972 year-only comparison: two originals, native candidates, derived contours.

Requires Pillow/numpy/scipy and Inkscape. Uniform height/centre registration only;
photographic masks are diagnostics and never generate the production vectors.
"""
from pathlib import Path
from copy import deepcopy
import argparse, hashlib, json, subprocess, xml.etree.ElementTree as ET
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/bc-decal-corrections/annual-1972'
DOC=ROOT/'docs/research/bc-decal-corrections/annual-1972'
parser=argparse.ArgumentParser();parser.add_argument('--candidate',action='store_true');args=parser.parse_args()
subprocess.run(['node','scripts/render-decal-annual-1972.mjs',str(OUT/'render-data.json')]+(['--candidate'] if args.candidate else []),cwd=ROOT,check=True)
data=json.loads((OUT/'render-data.json').read_text());references=json.loads((DOC/'references.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)

def raster(files,height=None):
    subprocess.run(['inkscape','--batch-process','--export-type=png','--export-area-page',
        *(['--export-height='+str(height)] if height else []),*map(str,files)],capture_output=True,check=True)

def tight(mask):
    box=mask.getbbox()
    if not box:raise ValueError('Empty mask')
    return mask.crop(box)

def paint(im,threshold=-10):
    a=np.asarray(im.convert('RGB')).astype(float)
    return (a[:,:,1]-a[:,:,0]>threshold)&(a[:,:,1]>a[:,:,2]+10)&(a[:,:,0]<150)

def source_glyphs(im,region,threshold=-10):
    crop=im.crop(region);mask=paint(crop,threshold);labels,count=ndimage.label(mask);components=[]
    for label in range(1,count+1):
        yy,xx=np.where(labels==label)
        if len(xx)>50 and yy.max()-yy.min()>crop.height*.5:
            components.append((int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1),label))
    if len(components)!=2:raise ValueError(f'Expected two independently segmented numerals, got {len(components)}')
    components.sort();result={}
    for char,box in zip('72',components):
        x0,y0,x1,y1,label=box
        result[char]={'mask':Image.fromarray(np.uint8(labels[y0:y1,x0:x1]==label)*255),
            'crop':crop.crop(box[:4]),'box':[region[0]+x0,region[1]+y0,region[0]+x1,region[1]+y1]}
    # Whole word retains the independently observed gap between the components.
    whole=np.isin(labels,[c[4] for c in components]);result['word']=Image.fromarray(np.uint8(whole)*255)
    return result

def shape(source,model,height=200):
    source,model=tight(source),tight(model)
    sw,mw=round(source.width*height/source.height),round(model.width*height/model.height)
    source=source.resize((sw,height),Image.Resampling.NEAREST);model=model.resize((mw,height),Image.Resampling.LANCZOS)
    width=max(sw,mw)+24;a=Image.new('L',(width,height+24));b=a.copy()
    a.paste(source,((width-sw)//2,12));b.paste(model,((width-mw)//2,12));a,b=np.asarray(a)>127,np.asarray(b)>127
    rgb=np.full((*a.shape,3),249,dtype=np.uint8);rgb[a]=[207,35,119];rgb[b]=[0,140,180];rgb[a&b]=[31,45,58]
    iou=float((a&b).sum()/(a|b).sum())
    return Image.fromarray(rgb),iou

def tile(im,width,height):
    im=im.convert('RGB');im.thumbnail((width,height),Image.Resampling.LANCZOS)
    out=Image.new('RGB',(width,height),'#f8f9fb');out.paste(im,((width-im.width)//2,(height-im.height)//2));return out

(OUT/'after.svg').write_text(data['current'])
files=[OUT/'before.svg',OUT/'after.svg']
for mode in ['before','after']:
    root=ET.fromstring((OUT/(mode+'.svg')).read_text());year=next(el for el in root.iter() if el.get('data-role')=='decal-year')
    isolated=ET.Element('svg',{'xmlns':'http://www.w3.org/2000/svg','viewBox':'0 0 190 100','width':'760','height':'400'})
    isolated.append(deepcopy(year));ET.ElementTree(isolated).write(OUT/(mode+'-year.svg'),encoding='unicode')
    files.append(OUT/(mode+'-year.svg'))
raster(files,400)
glyph_dir=OUT/'candidates';glyph_dir.mkdir(exist_ok=True);files=[]
for name,glyphs in data['glyphs'].items():
    for char,svg in glyphs.items():
        path=glyph_dir/f'{name}-{char}.svg';path.write_text(svg);files.append(path)
raster(files)
models={name:{char:tight(Image.open(glyph_dir/f'{name}-{char}.png').getchannel('A')) for char in '72'} for name in data['glyphs']}

scores={name:[] for name in models};sources=[]
for reference in references['specimens']:
    source=OUT/reference['file']
    if hashlib.sha256(source.read_bytes()).hexdigest()!=reference['sha256']:raise ValueError('Changed source '+str(source))
    im=Image.open(source).convert('RGB');segmented=source_glyphs(im,reference['region'])
    sources.append((reference,im,segmented))
    for threshold in [-20,-10,0,10]:
        variants=source_glyphs(im,reference['region'],threshold)
        for name in models:
            for char in '72':
                _,score=shape(variants[char]['mask'],models[name][char])
                scores[name].append({'control':reference['control'],'char':char,'threshold':threshold,'iou':round(score,4)})
ranked=sorted([{'profile':name,'meanIou':round(float(np.mean([s['iou'] for s in values])),4),'occurrences':values} for name,values in scores.items()],key=lambda row:row['meanIou'],reverse=True)

selected=['heavy-year','modern-year-reconstruction']+[r['profile'] for r in ranked if r['profile'] not in ['heavy-year','heavy-month','modern-year-reconstruction','annual-1972-reconstruction']][:4]+['annual-1972-reconstruction']
board=Image.new('RGB',(len(selected)*225+225,4*285+75),'#f8f9fb');draw=ImageDraw.Draw(board)
draw.text((12,12),'Independent source crops',font=small,fill='#102235')
for j,name in enumerate(selected):draw.text((235+j*225,12),name,font=small,fill='#102235')
details=[]
for i,(reference,im,segments) in enumerate(sources):
    for k,char in enumerate('72'):
        y=65+(i*2+k)*285;source=segments[char]
        expanded=source['crop'].resize((source['crop'].width*4,source['crop'].height*4),Image.Resampling.NEAREST)
        board.paste(tile(expanded,210,225),(8,y));draw.text((12,y+232),reference['control']+' · '+char,font=font,fill='#102235')
        comparison={}
        for j,name in enumerate(selected):
            pair,score=shape(source['mask'],models[name][char]);board.paste(tile(pair,215,225),(230+j*225,y))
            draw.text((238+j*225,y+232),f'diagnostic IoU {score:.3f}',font=small,fill='#102235');comparison[name]=round(score,4)
        details.append({'control':reference['control'],'char':char,'sourceBox':source['box'],'scores':comparison})
board.save(OUT/'native-candidates.png')

primary,photo,segments=sources[0];before=Image.open(OUT/'before.png').convert('RGB');after=Image.open(OUT/'after.png').convert('RGB')
photo_large=photo.resize((760,400),Image.Resampling.LANCZOS)
overview=Image.new('RGB',(1560,1000),'#f8f9fb');draw=ImageDraw.Draw(overview)
for j,(label,im) in enumerate([('Source · 926403',photo_large),('Before · 17b974f',before),('After · actual renderer',after),('After placement overlay',Image.blend(photo_large,after,.5))]):
    x=10+(j%2)*780;y=55+(j//2)*480;draw.text((x,y-32),label,font=font,fill='#102235');overview.paste(im,(x,y))
overview.save(OUT/'source-before-after.png');Image.blend(photo_large,before,.5).save(OUT/'before-overlay.png');Image.blend(photo_large,after,.5).save(OUT/'after-overlay.png')
word_scores={}
for mode in ['before','after']:
    mask=tight(Image.open(OUT/(mode+'-year.png')).getchannel('A'))
    pair,score=shape(segments['word'],mask);pair.save(OUT/(mode+'-year-shape.png'))
    word_scores[mode]={'diagnosticIou':round(score,4),'inkWidthToHeight':round(mask.width/mask.height,4)}
source_word=tight(segments['word']);word_scores['source']={'inkWidthToHeight':round(source_word.width/source_word.height,4),'inkPixels':[source_word.width,source_word.height]}

current=ET.fromstring(data['current']);year=next(el for el in current.iter() if el.get('data-role')=='decal-year')
if year.get('data-die')!='bc-decal-print-annual-1972-reconstruction':raise AssertionError('Wrong active year profile')
if year.get('data-fit')!='natural':raise AssertionError('1972 reconstruction must fit at its authored cap height')
if [el.get('data-character') for el in year.iter() if el.get('data-character')] != ['7','2']:raise AssertionError('Wrong year glyph sequence')
if abs(word_scores['after']['inkWidthToHeight']-word_scores['source']['inkWidthToHeight'])>.03:raise AssertionError('Year width departed from the observed proportions')
if '<text' in data['current'] or '<image' in data['current']:raise AssertionError('Year fixture is not portable vector artwork')
for mode in ['before','after']:
    im=Image.open(OUT/(mode+'-year.png')).getchannel('A');box=im.getbbox()
    if not box or box[0]<=0 or box[1]<=0 or box[2]>=760 or box[3]>=400:raise AssertionError('Year ink reaches decal edge')
report={'baseline':references['baseline'],'candidateTypography':data['candidateTypography'],'run':data['run'],
    'rasterizer':subprocess.run(['inkscape','--version'],capture_output=True,text=True,check=True).stdout.strip(),
    'registration':'Uniform ink height and centre; source placement stays in its original crop. No x-only fitting or perspective correction.',
    'segmentation':'Two independent green-paint connected components in both original crops at all four tested colour thresholds.',
    'candidateCount':len(models),'candidateRanking':ranked,'selectedComparisons':details,'primaryWord':word_scores,
    'checks':{'explicitControl':'926403','profile':'bc-decal-print-annual-1972-reconstruction','naturalFit':True,'inkInsideDecal':True,'yearSequence':['7','2'],'relativeWidthWithinTolerance':True,'portableVectors':True},
    'limitations':'Two low-resolution photographs (65–71px numeral ink height), no historical font identification; all candidate scores are mask diagnostics.'}
(DOC/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'candidateCount':len(models),'topCandidates':[{k:r[k] for k in ['profile','meanIou']} for r in ranked[:8]],'selectedComparisons':details,'primaryWord':word_scores,'run':data['run']},indent=2))
