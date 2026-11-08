#!/usr/bin/env python3
"""Build reproducible source / clean-baseline / after decal placement evidence.

Consumes captured SVGs, verifies pinned local crops, and uses Inkscape for visual
bounds and rasterization. It does not calculate photographic accuracy scores.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont
from decal_audit_photos import read_cached_crop

ROOT=Path(__file__).resolve().parents[1]
GROUPS={
    'annual':'1970–1978 · individual annual layouts',
    'panels':'1980–1988 · month and panel layouts',
    'expo':'1986 · Expo and twelve months',
    'thick':'1989–1999 · thick-border designs',
    'double':'1999–2003 · double-outline designs',
    'solid':'2004–2008 · unbordered date groups',
    'barcode':'2009–2013 · barcode and two-digit year',
    'full':'2014–June 2017 · four-digit year',
    'revised':'July 2017–2023 · revised format',
}
MONTHS={month:index+1 for index,month in enumerate(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'])}
ALIGNMENT='Uniform height and horizontal center for source, before and after. Original aspect ratios retained; no perspective rectification or independent horizontal fitting.'


def digest(value):
    return hashlib.sha256(value if isinstance(value,bytes) else value.encode('utf8')).hexdigest()


def file_hash(path):
    return digest(path.read_bytes())


def family(reference):
    year=int(reference['id'][:4])
    if year<=1978:return 'annual'
    if year==1986:return 'expo'
    if year<=1988:return 'panels'
    if year<=1999 and reference['catalogueId']!='1999-white':return 'thick'
    if year<=2003:return 'double'
    if year<=2008:return 'solid'
    if year<=2013:return 'barcode'
    if year<2017 or year==2017 and MONTHS[reference['month']]<7:return 'full'
    return 'revised'


def read_export(path):
    data=json.loads(path.read_text())
    records=data.get('decals')
    if not isinstance(records,list) or not records:raise ValueError(f'{path}: expected a nonempty decals array')
    ids=[record['id'] for record in records]
    if len(ids)!=len(set(ids)):raise ValueError(f'{path}: duplicate specimen IDs')
    return data,{record['id']:record for record in records}


def clean_baseline(provenance):
    if not isinstance(provenance,dict) or not provenance.get('commit') or not provenance.get('sourceSha256') or provenance.get('workingChanges') is not False:
        raise ValueError('A baseline needs commit/source hash and workingChanges:false from a complete clean checkout. Do not use the mixed frozen renderer.')
    return provenance


def select_before(record,paired_provenance,before_records,before_data,before_field):
    if record.get('beforeSvg'):
        return record['beforeSvg'],clean_baseline(paired_provenance.get('baseline')),{'field':'beforeSvg','input':'paired render export'}
    if before_records is None:
        raise ValueError(f'{record["id"]}: beforeSvg is missing; supply --before-json explicitly')
    previous=before_records.get(record['id'])
    if previous is None or not previous.get(before_field):raise ValueError(f'{record["id"]}: explicit --before-json has no {before_field}')
    key='baseline' if before_field=='beforeSvg' else 'current'
    provenance=clean_baseline(before_data.get('provenance',{}).get(key))
    return previous[before_field],provenance,{'field':before_field,'input':'explicit --before-json'}


def parse_svg(svg,reference):
    root=ET.fromstring(svg)
    view=[float(value) for value in root.get('viewBox','').replace(',',' ').split()]
    if len(view)!=4 or view[0]!=0 or view[1]!=0 or min(view[2:])<=0:
        raise ValueError(f'{reference["id"]}: expected a positive zero-origin SVG viewBox')
    def pixels(value):
        if not value or not re.fullmatch(r'[0-9.+eE-]+(?:px)?',value):raise ValueError('SVG dimensions must be numeric pixels')
        return float(value.removesuffix('px'))
    if abs(pixels(root.get('width'))-view[2])>1e-6 or abs(pixels(root.get('height'))-view[3])>1e-6:
        raise ValueError('SVG dimensions must equal viewBox units for unambiguous Inkscape query coordinates')
    for field,role in [('month','decal-month'),('control','decal-serial')]:
        runs=[element for element in root.iter() if element.get('data-role')==role and element.get('data-die')]
        expected=[] if reference[field] is None else [reference[field]]
        if [element.get('aria-label') for element in runs]!=expected:raise ValueError(f'{reference["id"]}: SVG {field} does not match the corrected source transcription')
        for run in runs:
            if ''.join(element.get('data-character','') for element in run.iter())!=run.get('aria-label'):
                raise ValueError(f'{reference["id"]}: rendered character occurrences do not match the {field} label')
    for element in root.iter():
        if element.get('data-role')=='decal-barcode' and element.get('data-control')!=reference['control']:
            raise ValueError(f'{reference["id"]}: barcode control differs from source transcription')
    return root,view[2:]


def prepare(data,before_data,before_records,before_field,references,crops,ids=None):
    prepared=[]
    records=data['decals']
    if ids:
        unknown=set(ids)-{record['id'] for record in records}
        if unknown:raise ValueError('Requested IDs missing from render export: '+', '.join(sorted(unknown)))
        records=[record for record in records if record['id'] in ids]
    for record in records:
        key=record['id']
        if not re.fullmatch(r'\d{4}(?:-[a-z0-9]+)*',key) or key not in references:raise ValueError('Unknown or unsafe specimen ID: '+key)
        reference=references[key]
        observed=record.get('specimen',{})
        for field in ['catalogueId','source','sourceSha256','crop','month','control']:
            supplied=record.get(field,observed.get(field))
            if supplied!=reference[field]:raise ValueError(f'{key}: input {field} does not match the corrected reference manifest')
        photo,source_provenance=read_cached_crop(reference,ROOT,crops)
        before,baseline,before_origin=select_before(record,data.get('provenance',{}),before_records,before_data,before_field)
        parse_svg(record['svg'],reference)
        parse_svg(before,reference)
        prepared.append({'record':record,'reference':reference,'photo':photo,'sourceProvenance':source_provenance,
                         'beforeSvg':before,'baselineProvenance':baseline,'beforeOrigin':before_origin})
    return sorted(prepared,key=lambda item:(list(GROUPS).index(family(item['reference'])),int(item['reference']['id'][:4]),MONTHS.get(item['reference']['month'],0),item['reference']['id']))


def render_svg(svg,reference,folder,name,height,inkscape):
    raw=folder/(name+'.svg')
    raw.write_bytes(svg.encode('utf8'))
    root,view=parse_svg(svg,reference)
    counts=Counter();runs=[]
    used_ids={element.get('id') for element in root.iter() if element.get('id')}
    for element in root.iter():
        role=element.get('data-role')
        if not role or role=='renewal-decal':continue
        index=counts[role];counts[role]+=1
        query_id=element.get('id')
        if not query_id:
            query_id=f'correction-audit-run-{len(runs)}'
            while query_id in used_ids:query_id+='x'
            element.set('id',query_id);used_ids.add(query_id)
        runs.append({'queryId':query_id,'role':role,'index':index,'text':element.get('aria-label'),
                     'profile':element.get('data-die'),'fit':element.get('data-fit'),
                     'filledStrokeCapUnits':float(element.get('data-filled-stroke')) if element.get('data-filled-stroke') else None})
    target=folder/(name+'.png')
    with tempfile.TemporaryDirectory(prefix='plateforge-decal-query-') as temporary:
        tagged=Path(temporary)/'tagged.svg'
        ET.ElementTree(root).write(tagged,encoding='utf8',xml_declaration=True)
        process=subprocess.run([inkscape,str(tagged),'--query-all','--export-type=png',f'--export-height={height}',
                                '--export-area-page','--export-background=white','--export-background-opacity=1',
                                '--export-filename='+str(target.resolve())],capture_output=True,text=True,check=True,timeout=60)
    boxes={}
    for line in process.stdout.splitlines():
        fields=line.rsplit(',',4)
        if len(fields)!=5:continue
        try:x,y,width,box_height=map(float,fields[1:])
        except ValueError:continue
        boxes[fields[0]]=[x,y,x+width,y+box_height]
    for run in runs:
        box=boxes.get(run.pop('queryId'))
        if box is None:raise ValueError(f'{reference["id"]}/{name}: Inkscape did not return visual bounds for {run["role"]} {run["index"]}')
        run['box']=box
        run['normalizedBox']=[round(value/view[index%2],6) for index,value in enumerate(box)]
        run['insideCanvas']=box[0]>=-.01 and box[1]>=-.01 and box[2]<=view[0]+.01 and box[3]<=view[1]+.01
    if raw.read_bytes()!=svg.encode('utf8'):raise ValueError('Raw SVG preservation failed')
    with Image.open(target) as image:
        pixels=list(image.size)
        if image.height!=height:raise ValueError('Unexpected Inkscape raster height')
    return {'svg':str(raw.name),'png':str(target.name),'svgSha256':file_hash(raw),'pngSha256':file_hash(target),
            'viewBox':view,'rasterPixels':pixels,'runs':runs,
            'boundsMethod':'Inkscape --query-all visual bounds, including stroke, in SVG units; a temporary copy has only query IDs added. Raw generated SVG bytes are preserved.',
            'fitMeaning':{'natural':'Native run at requested uniform cap scale','reduced':'Whole run uniformly reduced by the renderer to fit maxWidth'}}


def aligned_images(photo,folder,height):
    photo_scaled=photo.resize((round(photo.width*height/photo.height),height),Image.Resampling.LANCZOS)
    with Image.open(folder/'before.png') as image:before=image.convert('RGB')
    with Image.open(folder/'after.png') as image:after=image.convert('RGB')
    width=max(photo_scaled.width,before.width,after.width)
    canvases={}
    offsets={}
    for key,image in [('source',photo_scaled),('before',before),('after',after)]:
        canvas=Image.new('RGB',(width,height),'white')
        offsets[key]=(width-image.width)//2
        canvas.paste(image,(offsets[key],0));canvas.save(folder/(key+'-aligned.png'),optimize=True)
        canvases[key]=canvas
    for key in ['before','after']:Image.blend(canvases['source'],canvases[key],.5).save(folder/(key+'-overlay.png'),optimize=True)
    return {'method':ALIGNMENT,'canvasPixels':[width,height],'horizontalOffsetsPixels':offsets,'blendOpacity':.5,
            'sourceScale':height/photo.height}


def font(size):
    path=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    return ImageFont.truetype(str(path),size) if path.exists() else ImageFont.load_default(size=size)


def contact_sheets(rows,output,baseline_label):
    folder=output/'contact-sheets';folder.mkdir(parents=True,exist_ok=True)
    sheets=[]
    width=1580;column=380;image_height=155;row_height=202
    for key,title in GROUPS.items():
        selected=[row for row in rows if row['family']==key]
        if not selected:continue
        board=Image.new('RGB',(width,104+len(selected)*row_height),'#f4f6f9');draw=ImageDraw.Draw(board)
        draw.text((20,14),title,fill='#142335',font=font(23))
        draw.text((20,47),'Uniform height + horizontal center; source perspective retained. No photographic accuracy score.',fill='#43536a',font=font(15))
        labels=['Source crop','Before '+baseline_label,'After capture','Source + after · 50%']
        for index,label in enumerate(labels):draw.text((20+index*390,77),label,fill='#142335',font=font(17))
        for index,row in enumerate(selected):
            y=104+index*row_height
            for position,name in enumerate(['source-aligned.png','before-aligned.png','after-aligned.png','after-overlay.png']):
                with Image.open(output/'evidence'/row['id']/name) as source:image=source.convert('RGB')
                image.thumbnail((column,image_height),Image.Resampling.LANCZOS)
                board.paste(image,(20+position*390+(column-image.width)//2,y+(image_height-image.height)//2))
            label=f'{row["id"]} · {row["month"] or "annual"} · {row["control"] or "no control"} · source {row["photoPixels"][0]} × {row["photoPixels"][1]} px'
            if row['id']=='2017-jul':label+=' · official illustration'
            draw.text((20,y+image_height+9),label,fill='#142335',font=font(16))
        file=folder/(key+'.png');board.save(file,optimize=True)
        sheets.append({'family':key,'title':title,'specimens':len(selected),'file':str(file.relative_to(output)),'sha256':file_hash(file)})
    return sheets


def write_viewer(metadata,output):
    # JSON is embedded so this viewer works when opened as an ordinary local file.
    payload=json.dumps(metadata,separators=(',',':')).replace('<','\\u003c')
    template=r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BC decal correction overlays</title>
<style>:root{color-scheme:light;--ink:#16253b;--muted:#52637a;--line:#d6dfe8;--accent:#0a647a}*{box-sizing:border-box}body{margin:0;background:#f3f6fa;color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:1320px;margin:auto;padding:28px 24px 64px}h1{font-size:clamp(26px,4vw,38px);line-height:1.15;margin:8px 0 18px}h2{font-size:22px;margin:24px 0 12px}p{max-width:100ch}.eyebrow{color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:700}.muted,small{color:var(--muted)}a{color:var(--accent)}button,select,input{font:inherit}button,select{background:white;color:var(--ink);border:1px solid #b7c6d5;border-radius:6px;padding:9px;min-height:42px}button{cursor:pointer}button:disabled{opacity:.45}a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #5da8be;outline-offset:3px}.panel{background:white;border:1px solid var(--line);border-radius:10px;padding:18px;margin:20px 0}.controls{display:flex;gap:12px;align-items:end;flex-wrap:wrap}label{display:grid;gap:5px;font-size:14px}select{max-width:100%}.slider{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:18px 0}.slider input{width:min(440px,65vw)}.stage{position:relative;background:white;width:100%;overflow:hidden;margin:12px 0}.stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.triptych{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:18px 0}figure{margin:0;min-width:0}figure img{width:100%;height:155px;object-fit:contain;background:white}figcaption{font-size:13px;color:var(--muted)}.note{padding-left:12px;border-left:4px solid #91b9c9}.provenance{font-size:14px;overflow-wrap:anywhere}.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}code{font-size:.9em;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.downloads{display:flex;flex-wrap:wrap;gap:15px;margin:16px 0}.sheets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.sheets img{max-width:100%;height:180px;object-fit:contain;object-position:top;background:white}details{margin:16px 0}summary{cursor:pointer}noscript{display:block;padding:15px;background:#fff2d8}@media(max-width:700px){main{padding:20px 12px 48px}.panel{padding:12px}.controls label{width:100%}select{width:100%}.triptych{grid-template-columns:1fr}figure img{height:135px}.sheets{grid-template-columns:1fr 1fr}td,th{padding:6px;font-size:12px}}@media print{body{background:white}.controls,.slider{display:none}.panel{break-inside:avoid}}</style></head>
<body><main><div class="eyebrow">British Columbia · decal evidence</div><h1>Source, baseline and correction overlays</h1><p id="scope"></p><div id="provenance" class="provenance note"></div><p class="muted">Every view matches height uniformly and centers horizontally, preserving relative width and source perspective. Bounds describe rendered paint, not physical manufacturing dimensions. Colours are uncalibrated; this viewer does not assign photographic accuracy scores.</p>
<section class="panel"><div class="controls"><label>Design family<select id="family"><option value="all">All families</option></select></label><label>Specimen<select id="specimen"></select></label><button id="previous" aria-label="Previous specimen">← Previous</button><button id="next" aria-label="Next specimen">Next →</button></div>
<h2 id="caseTitle"></h2><p id="status"></p><div class="slider"><label>Model capture<select id="capture"><option value="after">After</option><option value="before">Before</option></select></label><label>Model opacity <input id="opacity" type="range" min="0" max="100" value="50"></label><output id="opacityValue">50%</output><button id="blink" aria-pressed="false">Blink source / model</button></div>
<div id="stage" class="stage"><img id="sourceLayer" alt="Aligned source crop"><img id="modelLayer" alt="Aligned model capture"></div><div class="triptych"><figure><img id="source" alt="Source crop"><figcaption>Source crop</figcaption></figure><figure><img id="before" alt="Clean baseline render"><figcaption>Before · complete clean baseline</figcaption></figure><figure><img id="after" alt="After render"><figcaption>After · captured renderer state</figcaption></figure></div>
<p id="disposition" class="note" hidden></p><p id="sourceDetails" class="provenance"></p><div class="downloads"><a id="original" target="_blank" rel="noopener">Credited original source ↗</a><a id="beforeDownload" download>Before SVG</a><a id="afterDownload" download>After SVG</a><a id="overlayDownload" download>After overlay PNG</a><a href="render-metadata.json" download>Full metadata JSON</a></div>
<details><summary>Visual bounds and native / reduced fitting</summary><p class="muted">Inkscape visual bounds include painted stroke and are expressed in SVG units. “Natural” retains the requested cap scale; “reduced” means the entire run was uniformly reduced to fit. These are model measurements, not scores against a photograph.</p><div class="tablewrap"><table><thead><tr><th>Role / occurrence</th><th>Before profile / fit / bounds</th><th>After profile / fit / bounds</th></tr></thead><tbody id="roles"></tbody></table></div></details><details><summary>Source, SVG and capture provenance</summary><pre id="caseMetadata"></pre></details></section>
<h2>Family contact sheets</h2><div id="sheets" class="sheets"></div><p class="muted">Source photographs remain credited to their owners. The July 2017 source is an official design illustration. A photograph alone does not verify ordinary issuance; the zero-control 2020 example remains explicitly qualified. These selected passenger-decal references do not establish identical tooling for other vehicle classes.</p><noscript>Use the family contact sheets and evidence folders to review the images. The comparison controls require JavaScript.</noscript><script id="data" type="application/json">__DATA__</script>
<script>
const data=JSON.parse(document.getElementById('data').textContent),all=data.specimens,$=id=>document.getElementById(id);let rows=all,index=0,timer=null;
function provenanceText(label,p){return p?`${label}: ${p.commit}; source SHA-256 ${p.sourceSha256}; working changes ${p.workingChanges?'present':'absent'}.`:`${label}: source-code provenance was not supplied in this diagnostic export; SVG bytes are hashed.`;}
$('scope').textContent=`${all.length} selected comparisons across ${new Set(all.map(r=>r.catalogueId)).size} catalogue variants. ${data.coverage.photographicComparisons} photographic sources and ${data.coverage.officialIllustrations} official illustration(s). Generated ${data.generatedAt}.`;
$('provenance').textContent=provenanceText('After capture',data.provenance.current)+' '+provenanceText('Before capture',data.provenance.baseline);
for(const [key,title] of Object.entries(data.families)){if(all.some(r=>r.family===key)){const option=document.createElement('option');option.value=key;option.textContent=title;$('family').append(option);}}
function stopBlink(){if(timer)clearInterval(timer);timer=null;$('blink').setAttribute('aria-pressed','false');$('blink').textContent='Blink source / model';setOpacity();}
function setOpacity(){const value=Number($('opacity').value);$('modelLayer').style.opacity=value/100;$('opacityValue').textContent=value+'%';}
function roleText(run){return run?`${run.profile||'artwork'} · ${run.fit||'n/a'} · [${run.box.map(n=>n.toFixed(2)).join(', ')}]`:'Not present in this capture';}
function show(){stopBlink();const r=rows[index],base='evidence/'+r.id+'/';$('caseTitle').textContent=r.id+' · '+(r.month||'annual')+' · '+(r.control||'no control');$('status').textContent=r.sourceStatus;$('specimen').value=r.id;$('previous').disabled=index===0;$('next').disabled=index===rows.length-1;
 $('stage').style.aspectRatio=r.alignment.canvasPixels[0]+'/'+r.alignment.canvasPixels[1];$('sourceLayer').src=base+'source-aligned.png';$('modelLayer').src=base+$('capture').value+'-aligned.png';for(const key of ['source','before','after'])$(key).src=base+key+'.png';
 $('sourceDetails').textContent=`Source crop ${r.photoPixels.join(' × ')} px. Verified local crop SHA-256 ${r.sourceProvenance.verifiedSha256}. Original source bytes were not reverified in this cached-crop build.`;$('original').href=r.source;$('beforeDownload').href=base+'before.svg';$('afterDownload').href=base+'after.svg';$('overlayDownload').href=base+'after-overlay.png';
 $('disposition').hidden=!r.disposition;$('disposition').textContent=r.disposition?Object.entries(r.disposition).map(([k,v])=>k+': '+(typeof v==='string'?v:JSON.stringify(v))).join(' · '):'';
 const old=new Map(r.before.runs.map(run=>[run.role+'/'+run.index,run])),now=new Map(r.after.runs.map(run=>[run.role+'/'+run.index,run]));$('roles').replaceChildren();for(const key of new Set([...old.keys(),...now.keys()])){const tr=document.createElement('tr');for(const value of [key,roleText(old.get(key)),roleText(now.get(key))]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('roles').append(tr);}
 $('caseMetadata').textContent=JSON.stringify({inputs:{month:r.month,control:r.control},source:r.sourceProvenance,beforeSvgSha256:r.before.svgSha256,afterSvgSha256:r.after.svgSha256,baseline:r.baselineProvenance,current:data.provenance.current,alignment:r.alignment},null,2);setOpacity();}
function repopulate(){rows=all.filter(r=>$('family').value==='all'||r.family===$('family').value);index=0;$('specimen').replaceChildren();for(const r of rows){const o=document.createElement('option');o.value=r.id;o.textContent=r.id+' · '+(r.month||'annual');$('specimen').append(o);}show();}
$('family').onchange=repopulate;$('specimen').onchange=()=>{index=rows.findIndex(r=>r.id===$('specimen').value);show();};$('previous').onclick=()=>{if(index>0){index--;show();}};$('next').onclick=()=>{if(index<rows.length-1){index++;show();}};$('capture').onchange=show;$('opacity').oninput=()=>{stopBlink();setOpacity();};$('blink').onclick=()=>{if(timer){stopBlink();return;}let visible=false;$('blink').setAttribute('aria-pressed','true');$('blink').textContent='Stop blinking';timer=setInterval(()=>{visible=!visible;$('modelLayer').style.opacity=visible?1:0;},650);};
for(const sheet of data.contactSheets){const figure=document.createElement('figure'),link=document.createElement('a'),image=document.createElement('img'),caption=document.createElement('figcaption');link.href=sheet.file;image.src=sheet.file;image.alt=sheet.title+' contact sheet';image.loading='lazy';link.append(image);caption.textContent=sheet.title+' · '+sheet.specimens+' comparisons';figure.append(link,caption);$('sheets').append(figure);}repopulate();
</script></main></body></html>'''
    (output/'index.html').write_text(template.replace('__DATA__',payload))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--render-json',type=Path,required=True)
    parser.add_argument('--before-json',type=Path,help='Required if any selected input lacks beforeSvg')
    parser.add_argument('--before-field',choices=['svg','beforeSvg'],default='svg',help='Explicit field to read from --before-json; default svg')
    parser.add_argument('--reference-manifest',type=Path,default=ROOT/'docs/research/decal-online-analysis/reference-manifest.json')
    parser.add_argument('--crop-manifest',type=Path,default=ROOT/'docs/research/decal-online-analysis/cached-crop-manifest.json')
    parser.add_argument('--output',type=Path,default=ROOT/'public/bc-decal-corrections')
    parser.add_argument('--ids',help='Comma-separated diagnostic subset; defaults to all input records')
    parser.add_argument('--height',type=int,default=400)
    parser.add_argument('--inkscape',default=shutil.which('inkscape') or 'inkscape')
    parser.add_argument('--dispositions-json',type=Path,help='Optional object keyed by specimen ID, or array of records with id')
    parser.add_argument('--verify-only',action='store_true',help='Validate inputs and local crop hashes without writing gallery artifacts')
    args=parser.parse_args()
    if args.height<100 or args.height>2000:parser.error('--height must be between 100 and 2000')
    data,_=read_export(args.render_json)
    before_data,before_records=read_export(args.before_json) if args.before_json else ({},None)
    references={reference['id']:reference for reference in json.loads(args.reference_manifest.read_text())}
    crops=json.loads(args.crop_manifest.read_text())
    prepared=prepare(data,before_data,before_records,args.before_field,references,crops,set(args.ids.split(',')) if args.ids else None)
    baselines={json.dumps(item['baselineProvenance'],sort_keys=True) for item in prepared}
    if len(baselines)!=1:raise ValueError('One report must use one complete baseline capture')
    print(json.dumps({'verifiedSpecimens':len(prepared),'originalBytesVerified':False,'baseline':prepared[0]['baselineProvenance']['commit']}),flush=True)
    if args.verify_only:return
    dispositions={}
    if args.dispositions_json:
        dispositions=json.loads(args.dispositions_json.read_text())
        if isinstance(dispositions,list):dispositions={record['id']:{key:value for key,value in record.items() if key!='id'} for record in dispositions}
        if not isinstance(dispositions,dict):raise ValueError('Dispositions must be an ID-keyed object or array of records')
    output=args.output.resolve();output.mkdir(parents=True,exist_ok=True)
    version=subprocess.run([args.inkscape,'--version'],capture_output=True,text=True,check=True,timeout=30).stdout.strip()
    rows=[]
    for index,item in enumerate(prepared):
        reference=item['reference'];key=reference['id'];folder=output/'evidence'/key;folder.mkdir(parents=True,exist_ok=True)
        photo=item['photo'];photo.save(folder/'source.png',optimize=True)
        before=render_svg(item['beforeSvg'],reference,folder,'before',args.height,args.inkscape)
        after=render_svg(item['record']['svg'],reference,folder,'after',args.height,args.inkscape)
        alignment=aligned_images(photo,folder,args.height)
        row={'id':key,'catalogueId':reference['catalogueId'],'family':family(reference),'month':reference['month'],'control':reference['control'],
             'source':reference['source'],'sourceStatus':reference['sourceStatus'],'sourceProvenance':item['sourceProvenance'],
             'photoPixels':list(photo.size),'displaySourceSha256':file_hash(folder/'source.png'),'bindingCorrection':reference.get('bindingCorrection'),
             'baselineProvenance':item['baselineProvenance'],'beforeOrigin':item['beforeOrigin'],'before':before,'after':after,'alignment':alignment,
             'viewBox':after['viewBox'],'runs':after['runs'],'svgSha256':after['svgSha256'],
             'sourceToBeforeAspectRatio':(photo.width/photo.height)/(before['viewBox'][0]/before['viewBox'][1]),
             'sourceToAfterAspectRatio':(photo.width/photo.height)/(after['viewBox'][0]/after['viewBox'][1]),
             'disposition':dispositions.get(key),
             'artifacts':{file.name:file_hash(file) for file in folder.iterdir() if file.is_file() and file.suffix in ['.png','.svg']}}
        rows.append(row)
        print(f'Rendered {index+1}/{len(prepared)}: {key}',flush=True)
    baseline=prepared[0]['baselineProvenance']
    sheets=contact_sheets(rows,output,baseline['commit'][:7])
    metadata={'schema':'plateforge.decal-correction-overlays/v1','generatedAt':datetime.now(timezone.utc).isoformat(),
              'provenance':{'current':data.get('provenance',{}).get('current'),'baseline':baseline,'renderExport':{'file':args.render_json.name,'sha256':file_hash(args.render_json)},
                            'beforeExport':{'file':args.before_json.name,'sha256':file_hash(args.before_json),'field':args.before_field} if args.before_json else None,
                            'referenceManifestSha256':file_hash(args.reference_manifest),'cachedCropManifestSha256':file_hash(args.crop_manifest),
                            'builderSha256':file_hash(Path(__file__)),'rasterizer':version,'browserValidation':'Not run by this Inkscape evidence builder'},
              'coverage':{'specimens':len(rows),'catalogueVariants':len({row['catalogueId'] for row in rows}),'completeReferenceManifest':set(references)=={row['id'] for row in rows},
                          'photographicComparisons':sum(row['id']!='2017-jul' for row in rows),'officialIllustrations':sum(row['id']=='2017-jul' for row in rows)},
              'alignment':ALIGNMENT,'boundsMeaning':'Rendered paint extents only. No exemplar shape score is propagated across photographs; no photographic accuracy score is computed.',
              'families':GROUPS,'contactSheets':sheets,'specimens':rows}
    (output/'render-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
    write_viewer(metadata,output)
    print(json.dumps({'specimens':len(rows),'contactSheets':len(sheets),'output':str(output),'currentSourceProvenanceAvailable':metadata['provenance']['current'] is not None}),flush=True)


if __name__=='__main__':main()
