#!/usr/bin/env python3
"""1986 source/before/after review, with uniform shape registration and logo trials.

Requires Pillow/numpy/scipy and Inkscape; all source crops are already credited and
hash-recorded in the repository. Pixel masks are diagnostics, not production
outlines. No new photos, fonts, or network access are needed.
"""
from pathlib import Path
from xml.sax.saxutils import quoteattr
import argparse, hashlib, json, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/bc-decal-corrections/expo86'
DOC = ROOT / 'docs/research/bc-decal-corrections/expo86'
parser = argparse.ArgumentParser()
parser.add_argument('--candidate', action='store_true', help='Apply the documented pending typography proposal in memory only.')
args = parser.parse_args()
OUT.mkdir(parents=True, exist_ok=True)
DOC.mkdir(parents=True, exist_ok=True)
data_file = OUT / 'render-data.json'
subprocess.run(['node', 'scripts/render-decal-expo86.mjs', str(data_file)] + (['--candidate'] if args.candidate else []), cwd=ROOT, check=True)
data = json.loads(data_file.read_text())
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)

def rasterize(files, height=None):
    # One process handles the independent fixtures; output uses each SVG's size.
    subprocess.run(['inkscape', '--batch-process', '--export-type=png', '--export-area-page',
        *(['--export-height='+str(height)] if height else []), *map(str, files)], check=True, capture_output=True)

def paint(im, role='month', threshold=25):
    a = np.asarray(im.convert('RGB')).astype(float)
    if role == 'month':
        mask = (a[:, :, 0]-a[:, :, 1] > threshold) & (a[:, :, 0]-a[:, :, 2] > threshold) & (a[:, :, 0] > 80)
    else:
        mask = (a[:, :, 2]-a[:, :, 0] > threshold) & (a[:, :, 2]-a[:, :, 1] > threshold*.5)
    return Image.fromarray(np.uint8(mask)*255)

def tight(mask):
    box = mask.getbbox()
    if not box:
        raise ValueError('Empty diagnostic paint region')
    return mask.crop(box)

def month_mask(im):
    mask=np.asarray(paint(im))>127
    # Reject detached province fragments above the month crop. Do not alter
    # surviving contours, fill holes, or separate touching month characters.
    labels,count=ndimage.label(mask)
    for label in range(1,count+1):
        yy,xx=np.where(labels==label)
        if len(xx)<8 or yy.max()-yy.min()+1 < im.height*.40:mask[labels==label]=False
    return Image.fromarray(np.uint8(mask)*255)

def shape_pair(source, model, height=190):
    source, model = tight(source), tight(model)
    sw, mw = round(source.width*height/source.height), round(model.width*height/model.height)
    source = source.resize((sw, height), Image.Resampling.NEAREST)
    model = model.resize((mw, height), Image.Resampling.LANCZOS)
    width = max(sw, mw)+24
    sm, mm = Image.new('L', (width, height+24)), Image.new('L', (width, height+24))
    sm.paste(source, ((width-sw)//2, 12)); mm.paste(model, ((width-mw)//2, 12))
    a, b = np.asarray(sm)>127, np.asarray(mm)>127
    union = np.logical_or(a,b).sum()
    iou = float(np.logical_and(a,b).sum()/union) if union else 0
    return overlay(sm, mm), iou

def overlay(source, model):
    a, b = np.asarray(source)>127, np.asarray(model)>127
    image = np.full((*a.shape,3), 249, dtype=np.uint8)
    image[a] = [207, 35, 119]; image[b] = [0, 140, 180]; image[a & b] = [31, 45, 58]
    return Image.fromarray(image)

def fit_tile(im, width, height, background='#f8f9fb'):
    im = im.convert('RGB'); im.thumbnail((width,height), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB',(width,height),background)
    canvas.paste(im,((width-im.width)//2,(height-im.height)//2))
    return canvas

files = []
for row in data['fixtures']:
    folder = OUT / row['id']
    if hashlib.sha256((folder/'source.png').read_bytes()).hexdigest() != row['displayPhotoSha256']:
        raise ValueError('Changed retained source '+row['id'])
    (folder/'after.svg').write_text(row['svg'])
    files += [folder/'before.svg', folder/'after.svg']
rasterize(files,400)
files=[]
glyph_dir = OUT / 'glyphs'; glyph_dir.mkdir(exist_ok=True)
for mode, glyphs in data['glyphs'].items():
    for char, svg in glyphs.items():
        path = glyph_dir/f'{mode}-{char}.svg'; path.write_text(svg); files.append(path)
rasterize(files)
print('Rendered twelve before/after fixtures and isolated month glyphs.', flush=True)

rows, glyph_scores = [], []
contact = Image.new('RGB',(1610,12*190+80),'#f8f9fb')
draw = ImageDraw.Draw(contact)
for j, label in enumerate(['Reference photograph', 'Before · 17b974f', 'After · current renderer', 'After placement overlay']):
    draw.text((15+j*400,18),label,font=font,fill='#102235')
for i,row in enumerate(data['fixtures']):
    folder = OUT/row['id']; photo = Image.open(folder/'source.png').convert('RGB')
    before, after = [Image.open(folder/(m+'.png')).convert('RGBA') for m in ['before','after']]
    h=400; width=max(round(photo.width*h/photo.height), before.width, after.width)
    aligned=[]
    for im in [photo,before,after]:
        image=Image.new('RGB',(width,h),'white')
        resized=im.resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS)
        image.paste(resized,((width-resized.width)//2,0), resized if resized.mode=='RGBA' else None)
        aligned.append(image)
    comparison=Image.blend(aligned[0],aligned[2],.5)
    comparison.save(folder/'after-overlay.png')
    Image.blend(aligned[0],aligned[1],.5).save(folder/'before-overlay.png')
    for j,image in enumerate([aligned[0],aligned[1],aligned[2],comparison]):
        contact.paste(fit_tile(image,390,140),(10+j*400,70+i*190))
    draw.text((16,213+i*190),f"{row['month']}  {row['control']}  ·  source {photo.width}×{photo.height}px",font=small,fill='#102235')
    sm = month_mask(photo.crop(row['monthRegion']))
    month = {'id':row['id'],'month':row['month'],'control':row['control'],'source':row['source'], 'shapeScores':{}}
    for mode, image in [('before',before),('after',after)]:
        mask=paint(image); a=np.asarray(mask).copy(); a[:round(image.height*.25)] = 0
        mask=Image.fromarray(a)
        shape,score=shape_pair(sm,mask)
        shape.save(folder/(mode+'-month-shape.png'))
        month['shapeScores'][mode]=round(score,4)
    rows.append(month)
    for occurrence in row['glyphs']:
        char=occurrence['char']
        if char not in 'PRTV':continue
        crop=photo.crop(occurrence['box']); source=paint(crop)
        panels=[]; scores={}
        for mode in ['before','after']:
            candidate=Image.open(glyph_dir/f'{mode}-{char}.png').getchannel('A')
            pair, score=shape_pair(source,candidate)
            scores[mode]=round(score,4);panels.append(pair)
        board=Image.new('RGB',(760,260),'#f8f9fb');bd=ImageDraw.Draw(board)
        board.paste(fit_tile(crop,180,210),(10,35))
        for j,panel in enumerate(panels):board.paste(fit_tile(panel,265,210),(205+j*275,35))
        for x,label in [(10,f"{row['month']} · {char} source"),(205,'Before shape'),(480,'After shape')]:bd.text((x,8),label,font=small,fill='#102235')
        board.save(folder/(char+'-shape.png'))
        glyph_scores.append({'id':row['id'],'char':char,'quality':occurrence['quality'],'scores':scores,
            'scored':occurrence['quality']!='tentative'})
contact.save(OUT/'all-months-before-after.png')

# Independently vary print weight in the supplied components. No centreline,
# word/symbol ratio, horizontal scale or source master is changed by this trial.
source_logo = json.loads((ROOT/'src/templates/bc/expo86-logo.json').read_text())
logo_dir=OUT/'logo-trials';logo_dir.mkdir(exist_ok=True)
logo_files=[]; trials=[]
for part in ['wordmark','linked86']:
    for factor in ([.60,.70,.75,.80,.90,1.0,1.05,1.10] if part=='wordmark' else [.80,.90,1.0,1.05,1.10,1.15]):
        name=f'{part}-{factor:.2f}'; primitives=[]
        for primitive in source_logo['primitives']:
            if primitive['part']!=part:continue
            attrs={**primitive['attrs'],'stroke':'#000000'}
            attrs['strokeWidth']=str(float(attrs['strokeWidth'])*factor)
            attrs={k.replace('strokeWidth','stroke-width').replace('strokeLinecap','stroke-linecap'):v for k,v in attrs.items()}
            primitives.append('<'+primitive['tag']+' '+' '.join(k+'='+quoteattr(str(v)) for k,v in attrs.items())+'/>')
        svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 263 347" width="526" height="694">'+''.join(primitives)+'</svg>'
        path=logo_dir/(name+'.svg');path.write_text(svg);logo_files.append(path)
        trials.append({'part':part,'factor':factor,'name':name,'scores':[]})
rasterize(logo_files)
for trial in trials:
    model=Image.open(logo_dir/(trial['name']+'.png')).getchannel('A')
    for row in data['fixtures']:
        im=Image.open(OUT/row['id']/'source.png').crop(row['logoRegions'][trial['part']])
        for threshold in [15,25,35]:
            pair,score=shape_pair(paint(im,'logo',threshold),model)
            trial['scores'].append({'month':row['month'],'threshold':threshold,'iou':round(score,4)})
    trial['meanIou']=round(float(np.mean([s['iou'] for s in trial['scores']])),4)
ranked={part:sorted([t for t in trials if t['part']==part],key=lambda t:t['meanIou'],reverse=True) for part in ['wordmark','linked86']}
ratios=[]
for row in data['fixtures']:
    photo=Image.open(OUT/row['id']/'source.png')
    word=tight(paint(photo.crop(row['logoRegions']['wordmark']),'logo'))
    symbol=tight(paint(photo.crop(row['logoRegions']['linked86']),'logo'))
    ratios.append({'month':row['month'],'wordToSymbolWidth':round(word.width/symbol.width,4),
        'wordToSymbolHeight':round(word.height/symbol.height,4)})
word=tight(Image.open(logo_dir/'wordmark-1.00.png').getchannel('A'))
symbol=tight(Image.open(logo_dir/'linked86-1.00.png').getchannel('A'))
original_ratio={'wordToSymbolWidth':round(word.width/symbol.width,4),'wordToSymbolHeight':round(word.height/symbol.height,4)}
logo_board=Image.new('RGB',(1180,12*150+65),'#f8f9fb');draw=ImageDraw.Draw(logo_board)
for j,label in enumerate(['Original word crop','Before word shape','Best word trial','Linked 86 source / before']):draw.text((12+j*292,12),label,font=small,fill='#102235')
for i,row in enumerate(data['fixtures']):
    photo=Image.open(OUT/row['id']/'source.png');crop=photo.crop(row['logoRegions']['wordmark']);y=55+i*150
    logo_board.paste(fit_tile(crop,270,100),(10,y));draw.text((14,y+106),row['month'],font=small,fill='#102235')
    for j,trial in enumerate(['wordmark-1.00',ranked['wordmark'][0]['name']]):
        pair,_=shape_pair(paint(crop,'logo'),Image.open(logo_dir/(trial+'.png')).getchannel('A'))
        logo_board.paste(fit_tile(pair,270,100),(302+j*292,y))
    sc=photo.crop(row['logoRegions']['linked86']);model=Image.open(logo_dir/'linked86-1.00.png').getchannel('A')
    pair,_=shape_pair(paint(sc,'logo'),model);logo_board.paste(fit_tile(pair,270,120),(886,y))
logo_board.save(OUT/'logo-independent-trials.png')

# Raster regressions sample the real even-odd renderer, including its transform.
# These small regions lie inside the previously cancelled T/V joins and R stem.
regressions={}
for char,box in {'R':(22,50,26,57),'T':(33,4,42,12),'V':(38,94,42,98)}.items():
    # Fixture has a 15-unit origin and 4 px per cap unit.
    pixel_box=(round((box[0]+15)*4),round((box[1]+15)*4),round((box[2]+15)*4),round((box[3]+15)*4))
    coverage={}
    for mode in ['before','after']:
        im=Image.open(glyph_dir/f'{mode}-{char}.png').getchannel('A')
        coverage[mode]=round(float(np.mean(np.asarray(im.crop(pixel_box))>127)),4)
    regressions[char]=coverage
    if coverage['after']<.95 or coverage['before']>.10:raise AssertionError(f'{char} join regression region failed: {coverage}')
for char,center in [('R',(31.5,31.5)),('P',(36,36))]:
    im=Image.open(glyph_dir/f'after-{char}.png').getchannel('A')
    box=tuple(round(v*4) for v in (center[0]+13,center[1]+13,center[0]+17,center[1]+17))
    if np.asarray(im.crop(box)).max()>0:raise AssertionError(char+' counter was filled')

report={'baseline':data['baseline'],'candidateTypography':data['candidate'],
    'rasterizer':subprocess.run(['inkscape','--version'],capture_output=True,text=True,check=True).stdout.strip(),
    'registration':'Uniform height and horizontal centre only. No perspective correction, per-glyph x scaling, or traced bitmap contours.',
    'sourceResolution':'75-pixel-high crops; mask sensitivity and perspective limit exact contour inference.',
    'specimens':rows,'glyphComparisons':glyph_scores,'logoTrials':trials,'logoRanking':{p:[{'factor':t['factor'],'meanIou':t['meanIou']} for t in ts] for p,ts in ranked.items()},
    'logoProportions':{'original':original_ratio,'photographs':ratios,'decision':'Retain supplied geometry and relative word/symbol scale; low-resolution masks do not separate print spread from designed stroke weight.'},
    'joinOpacityChecks':regressions,'openCounterChecks':['R','P']}
(DOC/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'specimens':len(rows),'glyphComparisons':glyph_scores,'logoRanking':report['logoRanking'],'joinOpacityChecks':regressions},indent=2))
