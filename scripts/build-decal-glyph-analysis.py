#!/usr/bin/env python3
"""Occurrence-level photographic inspection, native candidate scoring and honest overlays.

Paint masks are threshold diagnostics, never production traces. Photo perspective,
scan blur and cap sizes are retained as limitations; no width-only fitting is used.
"""
from pathlib import Path
from io import BytesIO
import base64,json,math,subprocess,sys,html,hashlib,os,difflib
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright
from decal_audit_segmentation import mask_for,segment_source,MIN_CAP_PIXELS,THRESHOLD_OFFSETS
from decal_audit_photos import read_cached_crop,read_original_crop,load_crop_manifest
ROOT=Path(__file__).resolve().parents[1]
WORK=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/plateforge-decal-glyph-analysis');WORK.mkdir(parents=True,exist_ok=True)
OUT=ROOT/os.environ.get('DECAL_ANALYSIS_OUT','public/bc-decal-glyph-review');OUT.mkdir(parents=True,exist_ok=True)
DOC=ROOT/os.environ.get('DECAL_ANALYSIS_DOC','docs/research/decal-glyph-analysis');REGIONS=json.loads((DOC/'inspection-regions.json').read_text())
REPORT_DOC=ROOT/os.environ.get('DECAL_ANALYSIS_REPORT_DOC',str(DOC));REPORT_DOC.mkdir(parents=True,exist_ok=True)
PHOTO_MODE=os.environ.get('DECAL_ANALYSIS_PHOTO_MODE','original')
if PHOTO_MODE not in ['original','cached-crops']:raise ValueError('DECAL_ANALYSIS_PHOTO_MODE must be original or cached-crops')
CROP_MANIFEST=load_crop_manifest(ROOT) if PHOTO_MODE=='cached-crops' else None
subprocess.run(['node',os.environ.get('DECAL_ANALYSIS_RENDERER','scripts/render-decal-glyph-analysis.mjs'),str(WORK/'render-data.json')],cwd=ROOT,check=True)
DATA=json.loads((WORK/'render-data.json').read_text());PROFILES={**json.loads((DOC/'candidate-outlines.json').read_text()),**DATA['profiles']}
if any(decal.get('beforeSvg') for decal in DATA['decals']) and (not DATA.get('provenance',{}).get('baseline') or not DATA.get('baselineProfiles')):
 raise ValueError('Before/current analysis requires a complete baseline checkout and its own exported profiles; mixed historical renderer captures are not accepted')
CANDIDATES=list(PROFILES)
PROFILES.update({'baseline--'+name:glyphs for name,glyphs in DATA.get('baselineProfiles',{}).items()})
# The older catalogue exporter has no profile paint metadata. Preserve explicit
# renderer stroke evidence rather than rasterizing a thinner candidate by name.
for decal in DATA['decals']:
 for mode,prefix in [('svg',''),('beforeSvg','baseline--')]:
  if mode not in decal:continue
  for element in ET.fromstring(decal[mode]).iter():
   if element.get('data-die') and element.get('data-filled-stroke'):
    profile=prefix+element.get('data-die').replace('bc-decal-print-','')
    for glyph in PROFILES.get(profile,{}).values():
     if glyph.get('fill'):glyph['filledStroke']=float(element.get('data-filled-stroke'))
CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.'
MASKS={};CACHE=WORK/'glyphs';CACHE.mkdir(exist_ok=True)
def cached_glyph(name,char):
 digest=hashlib.sha256(json.dumps(PROFILES[name][char],sort_keys=True).encode()).hexdigest()[:12]
 return CACHE/f'{name}-{ord(char)}-{digest}.png'
# Browser SVG rasterization uses the actual native outlined curves.
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('DECAL_ANALYSIS_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox']);page=browser.new_page()
 DATA.setdefault('provenance',{})['rasterizer']={'engine':'Chromium','version':browser.version,'glyphInkBounds':'Actual isolated glyph alpha > 127 at 4x, including stroke; geometric bounds are separate'}
 jobs=[]
 for name,glyphs in PROFILES.items():
  for char in CHARS:
   if char not in glyphs:continue
   path=cached_glyph(name,char)
   if path.exists():continue
   g=glyphs[char];width=max(140,g['advance']+30)
   style=('fill="black" stroke="black" stroke-width="'+str(g.get('filledStroke',0))+'"' if g.get('fill',True) else 'fill="none" stroke="black" stroke-width="'+str(g.get('stroke',0))+'"')+' stroke-linecap="'+g.get('cap','square')+'" stroke-linejoin="round"'
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
    a=Image.open(p).convert('RGBA').getchannel('A')
    if a.getbbox():MASKS[name,char]=a.crop(a.getbbox())
 # Export actual renderer coordinates and independent text-only run rasters.
 for d in DATA['decals']:
  for mode in ['beforeSvg','svg']:
   if mode not in d:continue
   page.set_content(d[mode])
   extractor=(ROOT/'scripts/decal-audit-browser.mjs').read_text().replace('export default ','',1)
   d['beforeRuns' if mode=='beforeSvg' else 'runs']=page.evaluate('('+extractor+')')
 browser.close()

def light(id,role):
 year=int(id[:4]);return (year in [1970,1971,1975,1976,1977] and role!='decal-serial') or (((year in [1981,1982] and role=='decal-legend') or (year in [1981,1982,1983,1984,1987,1988] and role in ['decal-month','decal-year']))) or year==2008

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

def photo_box(box,view_width,width,scale):
 if box is None:return None
 return [round(box[0]*scale+(width-view_width*scale)/2,3),round(box[1]*scale,3),round(box[2]*scale+(width-view_width*scale)/2,3),round(box[3]*scale,3)]

def ink_gap(char,next_char,angle,scale):
 if not next_char or char.get('inkClipped') or next_char.get('inkClipped'):return None
 a,b=char.get('inkBox'),next_char.get('inkBox')
 if a is None or b is None:return None
 return round((a[1]-b[3] if angle==-90 else b[1]-a[3] if angle==90 else b[0]-a[2])*scale,3)

rows=[];occurrence_count=0;eligible=0;uncertain=[]
for d in DATA['decals']:
 id=d['id'];(OUT/id).mkdir(exist_ok=True);s={**d['specimen'],'id':id,'source':d['source']}
 photo,photo_provenance=read_cached_crop(s,ROOT,CROP_MANIFEST) if PHOTO_MODE=='cached-crops' else read_original_crop(s,ROOT,WORK)
 photo_target=OUT/id/'photo.png'
 # Do not recompress a pinned input when the gallery is also its cache location.
 same_pixels=False
 if photo_target.exists():
  with Image.open(photo_target) as existing:same_pixels=existing.size==photo.size and np.array_equal(np.asarray(existing.convert('RGB')),np.asarray(photo))
 if not same_pixels:savepng(photo,Path(id)/'photo.png')
 w,h=photo.size
 (OUT/id/'current.svg').write_text(d['svg'])
 if d.get('beforeSvg'):(OUT/id/'before.svg').write_text(d['beforeSvg'])
 else:(OUT/id/'before.svg').unlink(missing_ok=True)
 result={'id':id,'source':d['source'],'sourceStatus':s.get('sourceStatus','Photographic reference; issuance status not established by this audit'),'sourceSha256':s['sourceSha256'],'photoProvenance':photo_provenance,'sourcePixels':list(photo.size),'auditInputs':d.get('auditInputs'),'bindingCorrection':s.get('bindingCorrection'),'hasBaseline':bool(d.get('beforeSvg')),'registration':'Selected source crop; no perspective rectification. Model uniformly centered at crop height; shape normalization uses height and center only. Crop aspect differences are image-space diagnostics, not established physical dimension errors.','runs':[]}
 for run in d['runs']:
  role,index=run['role'],run['index'];before_run=next((b for b in d.get('beforeRuns',[]) if b['role']==role and b['index']==index),None)
  alignment={}
  if before_run:
   for block in difflib.SequenceMatcher(None,before_run['text'],run['text'],autojunk=False).get_matching_blocks():
    for k in range(block.size):alignment[block.b+k]=block.a+k
  region=s.get('inspectionRegions',REGIONS[id])[role][index];angle=region[4] if len(region)>4 else 0
  if angle not in [0,-90,90]:raise ValueError('Unsupported inspection rotation for '+id)
  roi=[round(region[0]*w),round(region[1]*h),round(region[2]*w),round(region[3]*h)];roi[2]=min(w,roi[2]);roi[3]=min(h,roi[3]);raw=photo.crop(tuple(roi));horizontal=raw.rotate(angle,expand=True) if angle else raw
  mask,contrast=mask_for(horizontal,light(id,role));letters=[c for c in run['chars'] if not c['char'].isspace()]
  threshold_masks=[mask_for(horizontal,light(id,role),offset)[0] for offset in THRESHOLD_OFFSETS]
  segmentation=segment_source(mask,[char['char'] for char in letters],contrast,threshold_masks)
  boxes,method,isolated=segmentation['boxes'],segmentation['method'],segmentation['masks'];key=f'{role}-{index}';source_crop=Path(id)/(key+'-source.png');savepng(horizontal,source_crop)
  runmask=Image.open(BytesIO(base64.b64decode(run['png']))).convert('RGBA').getchannel('A')
  # Uniform source-plane registration, never fit x independently.
  full=Image.new('L',(w,h));scale=h/100;rw=round(run['viewWidth']*scale);full.paste(runmask.resize((rw,h),Image.Resampling.LANCZOS),(round((w-rw)/2),0));modelcrop=full.crop(tuple(roi));modelcrop=modelcrop.rotate(angle,expand=True) if angle else modelcrop
  place=overlay(mask,np.asarray(modelcrop)>127);savepng(place,Path(id)/(key+'-placement.png'))
  r={'role':role,'index':index,'text':run['text'],'currentProfile':run['profile'],'beforeProfile':before_run['profile'] if before_run else None,'region':roi,'rotation':angle,'sourceCrop':str(source_crop),'placementOverlay':f'{id}/{key}-placement.png','segmentation':method,'segmentationAccepted':segmentation['accepted'],'segmentationRejectionReasons':segmentation['reasons'],'thresholdOffsets':THRESHOLD_OFFSETS,'thresholdChecks':segmentation['thresholdChecks'],'minimumScoredCapPixels':MIN_CAP_PIXELS,'contrast':contrast,'inkBoundsMethod':run['inkBoundsMethod'],'inkBoundsResolutionSvgUnits':run['inkBoundsResolution'],'occurrences':[]}
  if id=='1983' and role=='decal-serial':
   r['excluded']='The control caption supplies a transcription, but photographed paint is too faint for reliable individual glyph scoring; excluded from shape matching.';result['runs'].append(r);continue
  font_scores={name:[] for name in CANDIDATES if letters and all((name,c['char']) in MASKS for c in letters)}
  for j,(char,box) in enumerate(zip(letters,boxes)):
   x0,y0,x1,y1=box;crop=isolated[j];cap=y1-y0;quality='rejected segmentation' if not segmentation['accepted'] else 'low resolution (unscored)' if cap<MIN_CAP_PIXELS else 'relative comparison only'
   scores={}
   can_score=segmentation['eligible'][j] and not (id=='1970' and role=='decal-year')
   if can_score:
    for name in font_scores:
     _,_,score=shape_pair(crop,MASKS[name,char['char']]);scores[name]=score;font_scores[name].append(score)
   next_char=letters[j+1] if j+1<len(letters) else None
   item={'runOccurrence':j,'textIndex':char['index'],'character':char['char'],'sourceBoxInHorizontalCrop':box,'sourceBoxMeaning':'Candidate paint bounds' if segmentation['accepted'] else 'Provisional inspection window; not an isolated-glyph measurement','sourceCapPixels':cap,'quality':quality,'relativeShapeEligible':segmentation['eligible'][j],'fontScoreEligible':can_score,'modelGeometryBoxOnPhoto':photo_box(char['geometryBox'],run['viewWidth'],w,scale),'modelInkBoxOnPhoto':photo_box(char['inkBox'],run['viewWidth'],w,scale),'modelInkClipped':char['inkClipped'],'sourceInkGapAfter':segmentation['gaps'][j],'modelInkGapAfter':ink_gap(char,next_char,angle,scale),'scores':{k:round(v,4) for k,v in scores.items()}}
   if not angle:
    item['sourceBoxOnPhoto']=[roi[0]+x0,roi[1]+y0,roi[0]+x1,roi[1]+y1]
   old_index=alignment.get(char['index']);old_char=next((c for c in before_run['chars'] if c['index']==old_index),None) if before_run else None
   if old_char:
    item['beforeGeometryBoxOnPhoto']=photo_box(old_char['geometryBox'],before_run['viewWidth'],w,scale)
    item['beforeInkBoxOnPhoto']=photo_box(old_char['inkBox'],before_run['viewWidth'],w,scale)
    old_next=next((c for c in before_run['chars'] if j+1<len(letters) and c['index']==alignment.get(letters[j+1]['index'])),None)
    item['beforeInkGapAfter']=ink_gap(old_char,old_next,angle,scale)
   item['gapComparisonEligible']=item['sourceInkGapAfter'] is not None and item['modelInkGapAfter'] is not None
   r['occurrences'].append(item);occurrence_count+=1
  ranking=sorted([{'profile':name,'medianShapeIoU':round(float(np.median(scores)),4),'meanShapeIoU':round(float(np.mean(scores)),4),'minShapeIoU':round(float(np.min(scores)),4),'scoredOccurrences':len(scores)} for name,scores in font_scores.items() if scores],key=lambda r:r['meanShapeIoU'],reverse=True)
  r['ranking']=ranking;r['rankingMeaning']='Threshold-dependent paint overlap after height-and-center normalization. Not historical font attribution or certainty; scan blur, perspective and segmentation may alter rankings.'
  if ranking:eligible+=1
  else:uncertain.append({'id':id,'role':role,'index':index,'method':method,'reasons':segmentation['reasons'] or ['No eligible candidate comparison at the minimum source resolution']})
  # Retain every occurrence window, but never normalize an invalid fragment as a glyph.
  montage=Image.new('RGB',(570,max(1,len(letters))*175),'white');draw=ImageDraw.Draw(montage)
  for j,item in enumerate(r['occurrences']):
   x0,y0,x1,y1=item['sourceBoxInHorizontalCrop'];crop=isolated[j];tiles=[horizontal.crop((x0,y0,x1,y1)),place.crop((x0,y0,x1,y1))];names=['Source window','Actual placement']
   comparisons=[('baseline--'+before_run['profile'],'Baseline: '+before_run['profile']), (run['profile'],'Current: '+run['profile'])] if before_run else [(run['profile'],run['profile']),(ranking[0]['profile'] if ranking else run['profile'],'Top relative candidate' if ranking else 'Unscored')]
   for column,(name,label) in enumerate(comparisons):
    if item['relativeShapeEligible'] and (name,item['character']) in MASKS and crop.any() and (column!=0 or not before_run or item['textIndex'] in alignment):sm,cm,score=shape_pair(crop,MASKS[name,item['character']]);tiles.append(overlay(sm,cm));names.append(label)
    else:tiles.append(Image.new('RGB',(140,130),'#eee'));names.append('Not printed / unresolved')
   draw.text((6,j*175+3),f'{j+1}: {item["character"]} · {item["sourceCapPixels"]}px · {item["quality"]}',fill='black')
   for k,tile in enumerate(tiles):montage.paste(thumb(tile),(k*142,j*175+23));draw.text((k*142+2,j*175+155),names[k][:24],fill='black')
  savepng(montage,Path(id)/(key+'-glyphs.png'));r['glyphMontage']=f'{id}/{key}-glyphs.png';result['runs'].append(r)
 rows.append(result)
summary={'specimens':len(rows),'occurrences':occurrence_count,'runsWithRelativeFontScores':eligible,'unresolvedRuns':uncertain,'minimumScoredCapPixels':MIN_CAP_PIXELS,'thresholdOffsets':THRESHOLD_OFFSETS,'limits':'Occurrence windows retained except explicitly excluded faint controls. Count agreement alone does not verify glyph assignment. Rejected, boundary-touching, low-contrast, threshold-unstable and sub-12-pixel source glyphs receive no scores or measured source gaps. Native shapes retain width. Model ink bounds include actual stroke; geometric getBBox bounds are separate. All rankings remain relative diagnostics, not font attribution.'}
analysis={'schema':'plateforge.decal-glyph-analysis/v2','provenance':DATA.get('provenance',{}),'summary':summary,'specimens':rows}
analysis['provenance'].setdefault('auditorSha256',{}).update({file:hashlib.sha256((ROOT/file).read_bytes()).hexdigest() for file in ['scripts/build-decal-glyph-analysis.py','scripts/decal_audit_segmentation.py','scripts/decal_audit_photos.py','scripts/decal-audit-browser.mjs']})
analysis['provenance']['inspectionInputSha256']={name:hashlib.sha256((DOC/name).read_bytes()).hexdigest() for name in ['candidate-outlines.json','inspection-regions.json','inspection-notes.json']}
if CROP_MANIFEST:analysis['provenance']['cachedCropManifestSha256']=hashlib.sha256((ROOT/'docs/research/decal-online-analysis/cached-crop-manifest.json').read_bytes()).hexdigest()
(REPORT_DOC/'analysis.json').write_text(json.dumps(analysis,indent=2)+'\n');(OUT/'analysis.json').write_text(json.dumps(analysis,indent=2)+'\n')
cards=[]
notes=json.loads((DOC/'inspection-notes.json').read_text())
def value_or_dash(value):return '—' if value is None else str(value)
for d in rows:
 runs=[]
 for r in d['runs']:
  ranks='; '.join(f'{html.escape(t["profile"])}: {t["meanShapeIoU"]:.3f}' for t in r.get('ranking',[])[:5]) or 'No reliable segmented comparison'
  occurrence_table=''.join(f'<tr><td>{c["runOccurrence"]+1}</td><td>{html.escape(c["character"])}</td><td>{c["sourceCapPixels"]}</td><td>{value_or_dash(c.get("sourceInkGapAfter"))}</td><td>{value_or_dash(c.get("beforeInkGapAfter"))}</td><td>{value_or_dash(c.get("modelInkGapAfter"))}</td><td>{c["quality"]}</td></tr>' for c in r.get('occurrences',[]))
  rejection='; '.join(r['segmentationRejectionReasons']) or 'Candidate segmentation passed conservative checks; assignment is not independently verified.'
  runs.append(f'<section><h3>{html.escape(r["role"])} · {html.escape(r["text"])}</h3><p>{html.escape(r["segmentation"])}. Current profile: {html.escape(r["currentProfile"])}.</p><p>{html.escape(rejection)}</p><div class="pair"><figure><img src="{r["sourceCrop"]}"><figcaption>Source crop; vertical words rotated only for inspection</figcaption></figure><figure><img src="{r["placementOverlay"]}"><figcaption>Placement: source paint pink; current model blue; overlap dark</figcaption></figure></div><p>Candidate shape scores: {ranks}. Scores are relative diagnostics, not font identification.</p>'+ (f'<p>{html.escape(r["excluded"])}</p>' if r.get('excluded') else f'<details><summary>Every letter/number occurrence and spacing</summary><img loading="lazy" class="montage" src="{r["glyphMontage"]}"><table><tr><th>Occurrence</th><th>Glyph</th><th>Source height px</th><th>Source ink gap px</th><th>Baseline ink gap px</th><th>Current ink gap px</th><th>Quality</th></tr>{occurrence_table}</table><p>— means absent, unresolved or below the measurement threshold. Model gaps include actual stroke; geometric bounds are separate fields in the JSON.</p></details>')+'</section>')
 comparison=(f'<div class="pair"><figure><img src="{d["id"]}/before.svg"><figcaption>Reproduced complete baseline checkout · corrected source inputs</figcaption></figure><figure><img src="{d["id"]}/current.svg"><figcaption>Current checkout · corrected source inputs</figcaption></figure></div>' if d['hasBaseline'] else f'<figure><img class="photo" src="{d["id"]}/current.svg"><figcaption>Current checkout; no historical baseline asserted</figcaption></figure>')
 correction=f'<p>Binding correction: {html.escape(d["bindingCorrection"]["reason"])}</p>' if d.get('bindingCorrection') else ''
 historical_note=f'<details><summary>Earlier inspection note (may predate this render)</summary><p>{html.escape(notes.get(d["id"],""))}</p></details>'
 cards.append(f'<article id="decal-{d["id"]}"><h2>{d["id"]}</h2><p>{html.escape(d["sourceStatus"])}</p>'+correction+f'<p>{html.escape(d["photoProvenance"]["hashScope"])}</p><a href="{d["source"]}">Original credited source ↗</a><img class="photo" src="{d["id"]}/photo.png">'+comparison+historical_note+''.join(runs)+'</article>')
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Decal glyph and spacing audit</title><style>body{font:16px/1.5 system-ui;margin:0;background:#eee;color:#17202c}main{max-width:1150px;margin:auto;padding:20px}article,section{background:white;padding:18px;border:1px solid #ccc;margin:18px 0}section{background:#fafafa}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.pair img{width:100%;height:160px;object-fit:contain;image-rendering:pixelated}figure{margin:0}.photo{display:block;max-width:100%;width:500px;image-rendering:pixelated;margin-top:15px}.montage{width:570px;max-width:100%;image-rendering:pixelated}table{border-collapse:collapse;font-size:14px}td,th{padding:6px;border:1px solid #ddd}pre{white-space:pre-wrap;overflow-wrap:anywhere}nav{display:flex;gap:10px;flex-wrap:wrap}@media(max-width:650px){main{padding:8px}.pair{grid-template-columns:1fr}table{font-size:11px;table-layout:fixed;width:100%}td,th{padding:3px;overflow-wrap:anywhere}}</style></head><body><main><h1>Decal evidence · letters, numbers and spacing</h1><p>Credited source crops, placement overlays and occurrence-level native-shape diagnostics. Pink = thresholded source paint; blue = model; dark = overlap. Shape comparisons normalize height and center uniformly. Source perspective is retained; crop aspect differences do not establish exact physical dimension errors.</p><p>A matching component count alone does not verify segmentation. Invalid fragments, crop-edge contact, low contrast, threshold instability and glyphs below 12 source pixels receive no font scores or measured source gaps. Their provisional windows remain visible. The faint 1983 control is excluded, and the supplied EXPO artwork is outside ordinary font fitting. Model ink spacing includes stroke; geometric boxes are recorded separately.</p>'''
page+='<p>'+html.escape(DATA.get('provenance',{}).get('comparison','Current renderer; no historical baseline asserted.'))+'</p><details><summary>Renderer and input provenance</summary><pre>'+html.escape(json.dumps(DATA.get('provenance',{}),indent=2))+'</pre></details><nav>'+''.join(f'<a href="#decal-{d["id"]}">{d["id"]}</a>' for d in rows)+'</nav>'+''.join(cards)+'</main></body></html>'
(OUT/'index.html').write_text(page)
import re
standalone=re.sub(r'src="([^"]+\.(?:png|svg))"',lambda m:'src="data:'+('image/svg+xml' if m.group(1).endswith('.svg') else 'image/png')+';base64,'+base64.b64encode((OUT/m.group(1)).read_bytes()).decode()+'"',page)
(OUT/'standalone.html').write_text(standalone)
print(json.dumps(summary,indent=2))
