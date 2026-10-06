#!/usr/bin/env python3
"""Occurrence-level photographic inspection, native candidate scoring and honest overlays.

Paint masks are threshold diagnostics, never production traces. Photo perspective,
scan blur and cap sizes are retained as limitations; no width-only fitting is used.
"""
from pathlib import Path
from io import BytesIO
import base64,json,math,subprocess,sys,html,hashlib,os,difflib
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
WORK=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/plateforge-decal-glyph-analysis');WORK.mkdir(parents=True,exist_ok=True)
OUT=ROOT/os.environ.get('DECAL_ANALYSIS_OUT','public/bc-decal-glyph-review');OUT.mkdir(exist_ok=True)
DOC=ROOT/os.environ.get('DECAL_ANALYSIS_DOC','docs/research/decal-glyph-analysis');REGIONS=json.loads((DOC/'inspection-regions.json').read_text())
subprocess.run(['node',os.environ.get('DECAL_ANALYSIS_RENDERER','scripts/render-decal-glyph-analysis.mjs'),str(WORK/'render-data.json')],cwd=ROOT,check=True)
DATA=json.loads((WORK/'render-data.json').read_text());PROFILES={**DATA['profiles'],**json.loads((DOC/'candidate-outlines.json').read_text())}
CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.'
MASKS={};CACHE=WORK/'glyphs';CACHE.mkdir(exist_ok=True)
def cached_glyph(name,char):
 digest=hashlib.sha256(json.dumps(PROFILES[name][char],sort_keys=True).encode()).hexdigest()[:12]
 return CACHE/f'{name}-{ord(char)}-{digest}.png'
# Browser SVG rasterization uses the actual native outlined curves.
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page()
 jobs=[]
 for name,glyphs in PROFILES.items():
  for char in CHARS:
   if char not in glyphs:continue
   path=cached_glyph(name,char)
   if path.exists():continue
   g=glyphs[char];width=max(140,g['advance']+30)
   style='fill="black"' if g.get('fill',True) else 'fill="none" stroke="black" stroke-width="'+str(g.get('stroke',0))+'" stroke-linecap="'+g.get('cap','square')+'"'
   svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*2}" height="260" viewBox="-15 -15 {width} 130"><g {style} fill-rule="evenodd">'+''.join('<path d="'+d+'"/>' for d in g['paths'])+'</g></svg>'
   jobs.append({'key':str(path),'svg':svg})
 for offset in range(0,len(jobs),80):
  result=page.evaluate('''async jobs=>Promise.all(jobs.map(async j=>{const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(j.svg);await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);return {key:j.key,data:c.toDataURL().split(',')[1]}}))''',jobs[offset:offset+80])
  for r in result:Path(r['key']).write_bytes(base64.b64decode(r['data']))
 for name,glyphs in PROFILES.items():
  for char in CHARS:
   if char not in glyphs:continue
   p=cached_glyph(name,char)
   if p.exists():
    a=Image.open(p).convert('RGBA').getchannel('A');MASKS[name,char]=a.crop(a.getbbox())
 # Export actual renderer coordinates and independent text-only run rasters.
 for d in DATA['decals']:
  for mode in ['beforeSvg','svg']:
   if mode not in d:continue
   page.set_content(d[mode])
   d['beforeRuns' if mode=='beforeSvg' else 'runs']=page.evaluate('''async ()=>{
   const root=document.querySelector('svg'),inv=root.getCTM().inverse(),counts={};const runs=[];
   for(const el of root.querySelectorAll('[data-die]')){
    const role=el.getAttribute('data-role'),index=counts[role]??0;counts[role]=index+1;
    const chars=[...el.querySelectorAll('[data-character]')].map((g,i)=>{const b=g.getBBox(),m=inv.multiply(g.getCTM()),pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return {index:i,char:g.getAttribute('data-character'),box:[Math.min(...pts.map(p=>p.x)),Math.min(...pts.map(p=>p.y)),Math.max(...pts.map(p=>p.x)),Math.max(...pts.map(p=>p.y))]};});
    const copy=el.cloneNode(true);copy.setAttribute('transform','');copy.querySelectorAll('[fill]').forEach(g=>g.setAttribute('fill',g.getAttribute('fill')==='none'?'none':'black'));copy.querySelectorAll('[stroke]').forEach(g=>g.setAttribute('stroke','black'));const m=inv.multiply(el.getCTM());
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${root.viewBox.baseVal.width*4}" height="400" viewBox="0 0 ${root.viewBox.baseVal.width} 100"><g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})">${copy.outerHTML}</g></svg>`;
    const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(svg);await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);
    runs.push({role,index,text:el.getAttribute('aria-label'),profile:el.getAttribute('data-die').replace('bc-decal-print-',''),chars,png:c.toDataURL().split(',')[1],viewWidth:root.viewBox.baseVal.width});
   }return runs;
  }''')
 browser.close()

def light(id,role):
 year=int(id[:4]);return (year in [1970,1971,1975,1976,1977] and role!='decal-serial') or (((year in [1981,1982] and role=='decal-legend') or (year in [1981,1982,1983,1984,1987,1988] and role in ['decal-month','decal-year']))) or year==2008

def mask_for(im,positive,offset=0):
 a=np.asarray(im.convert('L'),dtype=float);a=ndimage.gaussian_filter(a,.35)
 # Two-intensity clusters within this explicitly selected line region.
 lo,hi=np.percentile(a,[12,88])
 for _ in range(12):
  split=(lo+hi)/2;aa=a[a<split];bb=a[a>=split]
  if len(aa):lo=aa.mean()
  if len(bb):hi=bb.mean()
 threshold=(lo+hi)/2+offset*(hi-lo)
 mask=a>threshold if positive else a<threshold
 labels,n=ndimage.label(mask)
 for label in range(1,n+1):
  ys,xs=np.where(labels==label)
  if len(xs)<2 or (len(xs)>0 and xs.max()-xs.min()>im.width*.95 and ys.max()-ys.min()<2):mask[labels==label]=False
 return mask,round(hi-lo,2)

def segments(mask,n):
 projection=mask.sum(axis=0);occupied=projection>0;starts=np.where(np.diff(np.r_[False,occupied,False].astype(int))==1)[0];ends=np.where(np.diff(np.r_[False,occupied,False].astype(int))==-1)[0]
 spans=list(zip(starts,ends));method='independent paint projection';isolated=None
 if len(spans)!=n:
  labels,count=ndimage.label(mask);components=[]
  for label in range(1,count+1):
   ys,xs=np.where(labels==label)
   if len(xs)>=2:components.append((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1),label))
  # Separate connected glyphs can have overlapping x projections, e.g. slanted 75.
  if len(components)==n:
   components.sort(key=lambda b:(b[0]+b[2])/2)
   return [list(c[:4]) for c in components],'independent connected paint components',[labels[c[1]:c[3],c[0]:c[2]]==c[4] for c in components]
  nz=np.where(occupied)[0]
  if not len(nz):return [],'no isolated paint',[]
  edge=np.linspace(nz.min(),nz.max()+1,n+1).round().astype(int);spans=list(zip(edge[:-1],edge[1:]));method=f'uncertain partition: {len(starts)} paint spans for {n} occurrences'
 boxes=[]
 for x0,x1 in spans:
  yy,xx=np.where(mask[:,x0:x1]);boxes.append([int(x0+xx.min()),int(yy.min()),int(x0+xx.max()+1),int(yy.max()+1)] if len(xx) else [int(x0),0,int(x1),mask.shape[0]])
 return boxes,method,[mask[b[1]:b[3],b[0]:b[2]] for b in boxes]

def shape_pair(source,candidate):
 # Source paint and candidate ink normalized by height and center only.
 src=Image.fromarray(np.uint8(source)*255).resize((source.shape[1]*8,source.shape[0]*8),Image.Resampling.NEAREST)
 target_h=src.height;cw=max(1,round(candidate.width*target_h/candidate.height));cand=candidate.resize((cw,target_h),Image.Resampling.LANCZOS)
 width=max(src.width,cand.width)+32;height=target_h+24
 sm=np.zeros((height,width),bool);cm=sm.copy();sx=(width-src.width)//2;cx=(width-cand.width)//2
 sm[12:12+target_h,sx:sx+src.width]=np.asarray(src)>127;cm[12:12+target_h,cx:cx+cand.width]=np.asarray(cand)>127
 union=np.logical_or(sm,cm).sum();iou=float(np.logical_and(sm,cm).sum()/union) if union else 0
 return sm,cm,iou

def overlay(sm,cm):
 a=np.full((*sm.shape,3),245,np.uint8);a[sm]=[214,66,93];a[cm]=[30,160,209];a[sm&cm]=[72,72,72];return Image.fromarray(a)

def savepng(image,path):image.save(OUT/path,optimize=True)
def thumb(image,w=140,h=130):
 image=image.copy();image.thumbnail((w,h));tile=Image.new('RGB',(w,h),'#f5f5f5');tile.paste(image,((w-image.width)//2,(h-image.height)//2));return tile

rows=[];occurrence_count=0;eligible=0;uncertain=[]
for d in DATA['decals']:
 id=d['id'];(OUT/id).mkdir(exist_ok=True);s=d['specimen'];photo_path=Path(s['photoFile']) if s.get('photoFile') else Path('/tmp/plateforge-decal-review')/(id+'.jpg')
 if not photo_path.is_absolute():photo_path=(ROOT/photo_path) if (ROOT/photo_path).exists() else WORK/'photos'/photo_path
 if not photo_path.exists():raise RuntimeError('Run build-decal-review.mjs first to cache original '+id)
 if hashlib.sha256(photo_path.read_bytes()).hexdigest()!=s['sourceSha256']:raise RuntimeError('Changed source '+id)
 photo=Image.open(photo_path).convert('RGB').crop(tuple(s['crop']));savepng(photo,Path(id)/'photo.png');w,h=photo.size
 if d.get('beforeSvg'):
  (OUT/id/'before.svg').write_text(d['beforeSvg']);(OUT/id/'current.svg').write_text(d['svg'])
 result={'id':id,'source':d['source'],'sourceSha256':s['sourceSha256'],'sourcePixels':list(photo.size),'registration':'Selected photographic crop; no perspective rectification. Model uniformly centered at crop height; shape normalization uses height and center only.','runs':[]}
 for run in d['runs']:
  role,index=run['role'],run['index'];before_run=next((b for b in d.get('beforeRuns',[]) if b['role']==role and b['index']==index),run)
  alignment={}
  for block in difflib.SequenceMatcher(None,before_run['text'],run['text'],autojunk=False).get_matching_blocks():
   for k in range(block.size):alignment[block.b+k]=block.a+k
  region=REGIONS[id][role][index];angle=region[4] if len(region)>4 else 0
  roi=[round(region[0]*w),round(region[1]*h),round(region[2]*w),round(region[3]*h)];roi[2]=min(w,roi[2]);roi[3]=min(h,roi[3]);raw=photo.crop(tuple(roi));horizontal=raw.rotate(angle,expand=True) if angle else raw
  mask,contrast=mask_for(horizontal,light(id,role));letters=[c for c in run['chars'] if not c['char'].isspace()]
  boxes,method,isolated=segments(mask,len(letters));key=f'{role}-{index}';source_crop=Path(id)/(key+'-source.png');savepng(horizontal,source_crop)
  runmask=Image.open(BytesIO(base64.b64decode(run['png']))).convert('RGBA').getchannel('A')
  # Uniform source-plane registration, never fit x independently.
  full=Image.new('L',(w,h));scale=h/100;rw=round(run['viewWidth']*scale);full.paste(runmask.resize((rw,h),Image.Resampling.LANCZOS),(round((w-rw)/2),0));modelcrop=full.crop(tuple(roi));modelcrop=modelcrop.rotate(angle,expand=True) if angle else modelcrop
  place=overlay(mask,np.asarray(modelcrop)>127);savepng(place,Path(id)/(key+'-placement.png'))
  r={'role':role,'index':index,'text':run['text'],'currentProfile':run['profile'],'beforeProfile':before_run['profile'],'region':roi,'rotation':angle,'sourceCrop':str(source_crop),'placementOverlay':f'{id}/{key}-placement.png','segmentation':method,'contrast':contrast,'occurrences':[]}
  if id=='1983' and role=='decal-serial':
   r['excluded']='The control caption supplies a transcription, but photographed paint is too faint for reliable individual glyph scoring; excluded from shape matching.';result['runs'].append(r);continue
  font_scores={name:[] for name in PROFILES if all((name,c['char']) in MASKS for c in letters)}
  for j,(char,box) in enumerate(zip(letters,boxes)):
   x0,y0,x1,y1=box;crop=isolated[j];cap=y1-y0;source=horizontal.crop(tuple(box));quality='tentative' if not method.startswith('independent') else 'low resolution' if cap<12 else 'usable for relative comparison'
   scores={}
   if method.startswith('independent') and cap>=9 and crop.any() and not (id=='1970' and role=='decal-year'):
    for name in font_scores:
     _,_,score=shape_pair(crop,MASKS[name,char['char']]);scores[name]=score;font_scores[name].append(score)
   item={'runOccurrence':j,'textIndex':char['index'],'character':char['char'],'sourceBoxInHorizontalCrop':box,'sourceCapPixels':cap,'quality':quality,'modelBoxOnPhoto':[round(char['box'][0]*scale+(w-run['viewWidth']*scale)/2,3),round(char['box'][1]*scale,3),round(char['box'][2]*scale+(w-run['viewWidth']*scale)/2,3),round(char['box'][3]*scale,3)],'sourceInkGapAfter':boxes[j+1][0]-x1 if j+1<len(boxes) else None,'scores':{k:round(v,4) for k,v in scores.items()}}
   if angle and j+1<len(letters):
    item['modelInkGapAfter']=round(((char['box'][1]-letters[j+1]['box'][3]) if angle==-90 else (letters[j+1]['box'][1]-char['box'][3]))*scale,3)
   if not angle:
    item['sourceBoxOnPhoto']=[roi[0]+x0,roi[1]+y0,roi[0]+x1,roi[1]+y1]
    if j+1<len(letters):item['modelInkGapAfter']=round((letters[j+1]['box'][0]-char['box'][2])*scale,3)
   old_index=alignment.get(char['index']);old_char=next((c for c in before_run['chars'] if c['index']==old_index),None)
   if old_char:
    item['beforeBoxOnPhoto']=[round(old_char['box'][0]*scale+(w-before_run['viewWidth']*scale)/2,3),round(old_char['box'][1]*scale,3),round(old_char['box'][2]*scale+(w-before_run['viewWidth']*scale)/2,3),round(old_char['box'][3]*scale,3)]
    old_next=next((c for c in before_run['chars'] if j+1<len(letters) and c['index']==alignment.get(letters[j+1]['index'])),None)
    if old_next:item['beforeInkGapAfter']=round(((old_char['box'][1]-old_next['box'][3]) if angle==-90 else (old_next['box'][1]-old_char['box'][3]) if angle else (old_next['box'][0]-old_char['box'][2]))*scale,3)
   r['occurrences'].append(item);occurrence_count+=1
  ranking=sorted([{'profile':name,'medianShapeIoU':round(float(np.median(scores)),4),'meanShapeIoU':round(float(np.mean(scores)),4),'minShapeIoU':round(float(np.min(scores)),4),'scoredOccurrences':len(scores)} for name,scores in font_scores.items() if scores],key=lambda r:r['meanShapeIoU'],reverse=True)
  r['ranking']=ranking;r['rankingMeaning']='Threshold-dependent paint overlap after height-and-center normalization. Not historical font attribution or certainty; scan blur, perspective and segmentation may alter rankings.'
  if ranking:eligible+=1
  else:uncertain.append([id,role,index,method])
  # Every occurrence has its actual crop, actual-placement overlay and shape overlays.
  montage=Image.new('RGB',(570,max(1,len(letters))*175),'white');draw=ImageDraw.Draw(montage)
  for j,item in enumerate(r['occurrences']):
   x0,y0,x1,y1=item['sourceBoxInHorizontalCrop'];crop=isolated[j];tiles=[horizontal.crop((x0,y0,x1,y1)),place.crop((x0,y0,x1,y1))];names=['Source window','Actual placement']
   for column,name in enumerate([before_run['profile'],run['profile']] if 'beforeSvg' in d else [run['profile'],ranking[0]['profile'] if ranking else run['profile']]):
    if (name,item['character']) in MASKS and crop.any() and (column!=0 or 'beforeSvg' not in d or item['textIndex'] in alignment):sm,cm,score=shape_pair(crop,MASKS[name,item['character']]);tiles.append(overlay(sm,cm));names.append(('Before: ' if column==0 else 'After: ')+name if 'beforeSvg' in d else name)
    else:tiles.append(Image.new('RGB',(140,130),'#eee'));names.append('Not printed / unresolved')
   draw.text((6,j*175+3),f'{j+1}: {item["character"]} · {item["sourceCapPixels"]}px · {item["quality"]}',fill='black')
   for k,tile in enumerate(tiles):montage.paste(thumb(tile),(k*142,j*175+23));draw.text((k*142+2,j*175+155),names[k][:24],fill='black')
  savepng(montage,Path(id)/(key+'-glyphs.png'));r['glyphMontage']=f'{id}/{key}-glyphs.png';result['runs'].append(r)
 rows.append(result)
summary={'specimens':len(rows),'occurrences':occurrence_count,'runsWithRelativeFontScores':eligible,'unresolvedRuns':uncertain,'limits':'Every occurrence retained. Automatic source segmentation is explicitly tentative when paint spans do not isolate the known string. Native candidate shapes are never stretched in x. Small letters and uncertain segmentation do not support exact font attribution.'}
(DOC/'analysis.json').write_text(json.dumps({'summary':summary,'specimens':rows},indent=2)+'\n');(OUT/'analysis.json').write_text(json.dumps({'summary':summary,'specimens':rows},indent=2)+'\n')
cards=[]
notes=json.loads((DOC/'inspection-notes.json').read_text())
for d in rows:
 runs=[]
 for r in d['runs']:
  ranks='; '.join(f'{html.escape(t["profile"])}: {t["meanShapeIoU"]:.3f}' for t in r.get('ranking',[])[:5]) or 'No reliable segmented comparison'
  occurrence_table=''.join(f'<tr><td>{c["runOccurrence"]+1}</td><td>{html.escape(c["character"])}</td><td>{c["sourceCapPixels"]}</td><td>{c.get("sourceInkGapAfter","")}</td><td>{c.get("beforeInkGapAfter", "")}</td><td>{c.get("modelInkGapAfter", "rotated")}</td><td>{c["quality"]}</td></tr>' for c in r.get('occurrences',[]))
  runs.append(f'<section><h3>{html.escape(r["role"])} · {html.escape(r["text"])}</h3><p>{html.escape(r["segmentation"])}. Current candidate: {html.escape(r["currentProfile"])}.</p><div class="pair"><figure><img src="{r["sourceCrop"]}"><figcaption>Actual source crop; vertical words rotated only for inspection</figcaption></figure><figure><img src="{r["placementOverlay"]}"><figcaption>Actual placement: source paint pink; current model blue; overlap dark</figcaption></figure></div><p>Candidate shape scores: {ranks}. Scores are relative diagnostics, not font identification.</p>'+ (f'<p>{html.escape(r["excluded"])}</p>' if r.get('excluded') else f'<details><summary>Every letter/number occurrence and spacing</summary><img loading="lazy" class="montage" src="{r["glyphMontage"]}"><table><tr><th>Occurrence</th><th>Glyph</th><th>Cap px</th><th>Source gap px</th><th>Before gap px</th><th>After gap px</th><th>Quality</th></tr>{occurrence_table}</table></details>')+'</section>')
 comparison=f'<div class="pair"><figure><img src="{d["id"]}/before.svg"><figcaption>Before this online research · source text matched</figcaption></figure><figure><img src="{d["id"]}/current.svg"><figcaption>After online research · source text matched</figcaption></figure></div>' if (OUT/d['id']/'before.svg').exists() else ''
 cards.append(f'<article id="decal-{d["id"]}"><h2>{d["id"]}</h2><p>{html.escape(notes[d["id"]])}</p><a href="{d["source"]}">Full original photograph ↗</a><img class="photo" src="{d["id"]}/photo.png">'+comparison+''.join(runs)+'</article>')
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Decal glyph and spacing comparisons</title><style>body{font:16px/1.5 system-ui;margin:0;background:#eee;color:#17202c}main{max-width:1150px;margin:auto;padding:20px}article,section{background:white;padding:18px;border:1px solid #ccc;margin:18px 0}section{background:#fafafa}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.pair img{width:100%;height:160px;object-fit:contain;image-rendering:pixelated}figure{margin:0}.photo{display:block;max-width:100%;width:500px;image-rendering:pixelated;margin-top:15px}.montage{width:570px;max-width:100%;image-rendering:pixelated}table{border-collapse:collapse;font-size:14px}td,th{padding:6px;border:1px solid #ddd}nav{display:flex;gap:10px;flex-wrap:wrap}@media(max-width:650px){main{padding:8px}.pair{grid-template-columns:1fr}table{font-size:11px;table-layout:fixed;width:100%}td,th{padding:3px;overflow-wrap:anywhere}}</style></head><body><main><h1>Every decal · letters, numbers and spacing</h1><p>Original photographic crops, actual-placement overlays, and occurrence-by-occurrence native font comparisons. Pink = thresholded source paint; blue = model; dark = overlap. Shape comparisons normalize only height and center, never width. Tiny images, thresholding and perspective limit precision. Uncertain partitions are labeled and receive no font scores.</p><p>All transcribed characters and repeated occurrences are kept separately. Tentative equal partitions are provisional windows, not verified isolated glyphs; do not use their spacing as a measurement. 1983’s faint control is excluded from character identification. The supplied EXPO 86 logo is artwork, not a recovered font, and is excluded from ordinary font fitting.</p><nav>'''+''.join(f'<a href="#decal-{d["id"]}">{d["id"]}</a>' for d in rows)+'</nav>'+''.join(cards)+'</main></body></html>'
if 'beforeSvg' in DATA['decals'][0]:
 page=page.replace('Every decal · letters, numbers and spacing','Online research · before and after').replace('<nav>','<p>55 catalogue variants, all 12 months of 1986, and the July/November 2017 transition: 68 specimens. Before/after lettering overlays retain native proportions. Sources include the BCpl8s passenger gallery, a 1978 Motor Vehicle Branch guide, and ICBC Bulletin 14 (February 2016). The bulletin dates the smaller rounded design to July 2017 expiry. Microgramma, Eurostile, Ronda and Handel Gothic documentation informed family comparisons; none establishes the actual historical decal font. <a href="https://github.com/ahzs645/plateforge/blob/fix/1976-1977-decal-flower/docs/research/decal-online-analysis/README.md">Research and decisions ↗</a></p><nav>',1)
(OUT/'index.html').write_text(page)
import re
standalone=re.sub(r'src="([^"]+\.(?:png|svg))"',lambda m:'src="data:'+('image/svg+xml' if m.group(1).endswith('.svg') else 'image/png')+';base64,'+base64.b64encode((OUT/m.group(1)).read_bytes()).decode()+'"',page)
(OUT/'standalone.html').write_text(standalone)
print(json.dumps(summary,indent=2))
