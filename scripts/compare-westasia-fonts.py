#!/usr/bin/env python3
"""Reproducible raster-only typography study. Never publishes font binaries.
Run from repo root after npm ci and pip install fonttools pillow numpy opencv-python-headless cairosvg.
Outputs: public/typography-review (HTML, PNG, JSON); source images/fonts live only in memory.
"""
from __future__ import annotations
import hashlib, html, io, json, os, subprocess, time, urllib.request
from pathlib import Path
import cv2
import numpy as np
import cairosvg
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen

OUT = Path('public/typography-review'); OUT.mkdir(parents=True, exist_ok=True)
FONTS = {
 'euro': ('Existing EuroPlate', 'https://raw.githubusercontent.com/ahzs645/plateforge/e8ea4e2afd7381fb7e771cb2c8401142bb3243a6/src/assets/fonts/EuroPlate.ttf', '0d2441929ce8f67ff8abdf43a46370822ca48f5c'),
 'irplate': ('IR Plate', 'https://raw.githubusercontent.com/mojtaba-khallash/PlateFont/2ddd46a1eecee27f12562bc01ae1c1fb4f046cfb/fonts/IR%20Plate.ttf', '2e2dc1f86692d5d7475076b0060bea8b345f0278'),
 'roya': ('B Roya Bold', 'https://raw.githubusercontent.com/mahdi-ataollahi/PlateModel.Wpf/65a4dc3ed2d4424d401ddc2a1a70db77f51f8cf5/Source/IRPlateModel.Wpf/Fonts/BRoyaBd.ttf', '44292a704b90c4d571f9cafd8cd7b53fdcd44097'),
}
# Corner coordinates are manually marked on a width=1000 preview, not manufacturer dimensions.
REFS = [
 dict(id='iraq-964', title='Iraq / KRG — 22 C 79770', kind='News photograph; perspective correction is approximate',
      image='https://cdn.964media.com/c61a9e26-7255-46c6-27b5-8de6a9078c00/large', source='https://en.964media.com/2800/',
      credit='964media, 30 September 2023. Plate crop for typography criticism; photograph rights retained by source.',
      corners=[[12,132],[992,176],[1006,388],[-3,349]], chars='22C79770', candidates=['original','euro'], threshold=115),
 dict(id='iran-flat', title='Iran / public — ۲۴ ع ۴۱۷ | ۹۱', kind='Photographed flat specimen; NOT an official die specification',
      image='https://upload.wikimedia.org/wikipedia/commons/6/6b/Iran_licenceplate_02.JPG', source='https://commons.wikimedia.org/wiki/File:Iran_licenceplate_02.JPG',
      credit='Dickelbers, 24 March 2015, CC BY-SA 4.0. Cropped, rectified and resized. https://creativecommons.org/licenses/by-sa/4.0/',
      corners=[[19,9],[983,18],[992,284],[7,277]], chars='۲۴ع۴۱۷۹۱', candidates=['original','irplate','roya'], threshold=110),
 dict(id='iran-embossed', title='Iran / public — embossed specimen', kind='Photograph; same serial/collection as the flat specimen, not an independent random sample',
      image='https://upload.wikimedia.org/wikipedia/commons/8/88/Iran_licenceplate_03.JPG', source='https://commons.wikimedia.org/wiki/File:Iran_licenceplate_03.JPG',
      credit='Dickelbers, 24 March 2015, CC BY-SA 4.0. Top plate cropped, rectified and resized. https://creativecommons.org/licenses/by-sa/4.0/',
      corners=[[10,30],[985,35],[985,232],[10,228]], chars='۲۴ع۴۱۷۹۱', candidates=['original','irplate','roya'], threshold=90),
]
LABELS={'original':'First-pass geometric glyphs',**{k:v[0] for k,v in FONTS.items()}}
IR_MAP={'ع':'u','ب':'f','س':'s','ه':'i','هـ':'i','الف':'h'}


def fetch(url: str) -> bytes:
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'PlateForgeTypographyStudy/1.0 (research comparison)'})
            with urllib.request.urlopen(req,timeout=45) as r:
                data=r.read(8_000_001)
                if len(data)>8_000_000: raise ValueError('Asset exceeds 8 MB limit')
                return data
        except Exception:
            if attempt==2: raise
            time.sleep(2+attempt*3)
    raise RuntimeError('Unreachable')


def svg_png(svg: str, w: int, h: int) -> Image.Image:
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(),output_width=w,output_height=h))).convert('RGBA')


def trimmed(im: Image.Image) -> Image.Image:
    b=im.getbbox()
    if not b: raise ValueError('Empty glyph')
    return im.crop(b)


def fitted(im: Image.Image, h: int, maxw=300) -> Image.Image:
    w=max(1,round(im.width*h/im.height)); scale=min(1,maxw/w)
    return im.resize((max(1,round(w*scale)),max(1,round(h*scale))),Image.Resampling.LANCZOS)


def glyph_image(font: TTFont, ch: str, key: str) -> Image.Image:
    if key=='irplate':
        ch=str(ord(ch)-0x6f0) if '۰'<=ch<='۹' else IR_MAP.get(ch,ch)
    cmap=font.getBestCmap(); glyphset=font.getGlyphSet()
    name=cmap.get(ord(ch)) if len(ch)==1 else None
    if not name: raise ValueError(f'Missing glyph: {key} {ch!r}')
    g=glyphset[name]; b=BoundsPen(glyphset); g.draw(b)
    if b.bounds is None: raise ValueError(f'Blank glyph: {key} {ch!r}')
    x0,y0,x1,y1=b.bounds; pen=SVGPathPen(glyphset); g.draw(pen)
    w,h=x1-x0,y1-y0
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><g transform="translate({-x0} {y1}) scale(1 -1)"><path d="{pen.getCommands()}"/></g></svg>'
    return trimmed(svg_png(svg,max(1,round(w/h*240)),240))


def old_glyphs() -> dict[str,str]:
    js=r'''import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import ts from 'typescript';import {createRequire} from 'node:module';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pf-original-'));try{
fs.writeFileSync(path.join(dir,'package.json'),' {"type":"commonjs"}');
for(const id of ['regions/asia/plate-script','templates/westasia-euro','templates/westasia-arabic','templates/westasia-glyphs']){const to=path.join(dir,id+'.js');fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,ts.transpileModule(fs.readFileSync('src/'+id+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)}
const {glyph}=createRequire(import.meta.url)(path.join(dir,'templates/westasia-glyphs.js'));
console.log(JSON.stringify(Object.fromEntries([...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ۰۱۲۳۴۵۶۷۸۹عسبه'].map(c=>[c,glyph(c)]))));
}finally{fs.rmSync(dir,{recursive:true,force:true})}'''
    return json.loads(subprocess.check_output(['node','--input-type=module','-e',js],text=True))


def rectangle(im: Image.Image, corners: list) -> Image.Image:
    source=np.asarray(im.convert('RGB')); pts=np.float32(corners)*(im.width/1000)
    matrix=cv2.getPerspectiveTransform(pts,np.float32([[0,0],[1039,0],[1039,219],[0,219]]))
    return Image.fromarray(cv2.warpPerspective(source,matrix,(1040,220),borderValue=(240,240,240)))


def components(im: Image.Image, ref: dict) -> list[dict]:
    grey=cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2GRAY)
    mask=(grey<ref['threshold']).astype('uint8')
    mask[:16,:]=0; mask[207:,:]=0; mask[:,:93]=0; mask[:,1024:]=0
    if ref['id'].startswith('iran'): mask[:64,785:]=0
    n,labels,stats,_=cv2.connectedComponentsWithStats(mask)
    boxes=[]
    for x,y,w,h,area in stats[1:]:
        if h>=85 and w>=15 and w<170 and h<205 and area>=750:
            boxes.append({'box':[int(x),int(y),int(w),int(h)]})
    boxes.sort(key=lambda r:r['box'][0])
    if len(boxes)!=len(ref['chars']):
        raise ValueError(f"{ref['id']}: expected {len(ref['chars'])} components, got {len(boxes)}: {boxes}")
    for b,ch in zip(boxes,ref['chars']):
        b['char']=ch
        x,y,w,h=b['box']; b['mask']=(mask[y:y+h,x:x+w]*255).astype('uint8')
    return boxes


def metric(refmask: np.ndarray, cand: Image.Image) -> dict:
    refim=Image.fromarray(refmask).convert('L'); rr=refim.resize((round(refim.width/refim.height*160),160),Image.Resampling.LANCZOS)
    cc=fitted(cand,160); size=(320,220)
    ar=Image.new('L',size); ac=Image.new('L',size)
    ar.paste(rr,((320-rr.width)//2,30)); ac.paste(cc.getchannel('A'),((320-cc.width)//2,30))
    r=np.asarray(ar)>127;c=np.asarray(ac)>127
    # Translation only; no horizontal stretching or shape fitting to the reference.
    best=max(float((r&np.roll(c,(dy,dx),(0,1))).sum())/max(1,int((r|np.roll(c,(dy,dx),(0,1))).sum())) for dx in range(-4,5,2) for dy in range(-4,5,2))
    return {'silhouette_iou':round(best,4),'width_ratio_candidate_to_reference':round((cand.width/cand.height)/(refim.width/refim.height),4)}


def main() -> None:
    original=old_glyphs(); candidates={}; records=[]
    for key,(label,url,expected) in FONTS.items():
        data=fetch(url); gitsha=hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()
        if gitsha!=expected: raise ValueError(f'Upstream file changed: {key} {gitsha}')
        font=TTFont(io.BytesIO(data))
        names={str(i):font['name'].getDebugName(i) for i in [0,1,2,5,8,13,14]}
        records.append({'id':key,'label':label,'url':url,'git_blob_sha':gitsha,'sha256':hashlib.sha256(data).hexdigest(),'names':names})
        chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' if key=='euro' else '۰۱۲۳۴۵۶۷۸۹عسبه'
        candidates[key]={ch:glyph_image(font,ch,key) for ch in chars}; font.close()
    candidates['original']={ch:trimmed(svg_png(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 60 88"><g color="black">{g}</g></svg>',180,264)) for ch,g in original.items()}
    results=[]; ui_font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    def f(size): return ImageFont.truetype(ui_font,size)
    for ref in REFS:
        photo=Image.open(io.BytesIO(fetch(ref['image']))).convert('RGB'); corrected=rectangle(photo,ref['corners']); boxes=components(corrected,ref)
        masked=corrected.copy(); md=ImageDraw.Draw(masked)
        for b in boxes:
            x,y,w,h=b['box'];md.rectangle((x-1,y-1,x+w,y+h),outline='#d44532',width=2)
        renders=[]; scores={}
        for key in ref['candidates']:
            row=Image.new('RGB',(1040,220),'white');rowscores=[]
            for b in boxes:
                ch=b['char'];x,y,w,h=b['box'];g=fitted(candidates[key][ch],h)
                row.paste(g,(round(x+w/2-g.width/2),y),g)
                rowscores.append({'char':ch,**metric(b['mask'],candidates[key][ch])})
            row.save(OUT/f"{ref['id']}-{key}.png");renders.append((LABELS[key],row))
            scores[key]={'mean_silhouette_iou':round(sum(s['silhouette_iou'] for s in rowscores)/len(rowscores),4),'glyphs':rowscores}
        corrected.save(OUT/f"{ref['id']}-reference.png");masked.save(OUT/f"{ref['id']}-regions.png")
        titleheight=116; rowheight=266; board=Image.new('RGB',(1160,titleheight+rowheight*(len(renders)+1)+100),'#f5f3ef');d=ImageDraw.Draw(board)
        title='IRAQ / KRG  |  22 C 79770' if ref['id']=='iraq-964' else ('IRAN / PUBLIC  |  FLAT SPECIMEN' if ref['id']=='iran-flat' else 'IRAN / PUBLIC  |  EMBOSSED SPECIMEN')
        d.text((40,28),title,font=f(28),fill='#163c38');d.text((40,74),'Same sample, same reference positions. Glyph proportions preserved; no width stretching.',font=f(17),fill='#52635f')
        for i,(label,img) in enumerate([('Reference plate crop (manual perspective correction)',corrected)]+renders):
            yy=titleheight+i*rowheight;d.text((48,yy),label,font=f(18),fill='#1a332e');board.paste(img,(60,yy+30))
        d.text((40,board.height-84),'Visual study only: IoU measures these cropped silhouettes, NOT official authenticity.',font=f(17),fill='#70412b')
        d.text((40,board.height-51),'Reference credit: '+('964media, 2023-09-30 (criticism crop).' if ref['id']=='iraq-964' else 'Dickelbers, 2015-03-24, CC BY-SA 4.0 (cropped / rectified).'),font=f(16),fill='#52635f')
        board.save(OUT/f"{ref['id']}-comparison.png")
        cell=128;diag=Image.new('RGB',(1040,80+190*(1+len(ref['candidates']))),'#f5f3ef');dd=ImageDraw.Draw(diag)
        dd.text((15,14),'Equal-height character study | columns follow the plate, left to right',font=f(20),fill='#163c38')
        for rid,key in enumerate(['reference']+ref['candidates']):
            yy=70+rid*190;dd.text((15,yy),('Reference' if key=='reference' else LABELS[key]),font=f(16),fill='#52635f')
            for j,b in enumerate(boxes):
                if key=='reference':
                    mask=Image.fromarray(b['mask']);g=Image.new('RGBA',mask.size,(0,0,0,255));g.putalpha(mask)
                else:g=candidates[key][b['char']]
                g=fitted(g,135,115);diag.paste(g,(j*cell+10+(115-g.width)//2,yy+32),g)
        diag.save(OUT/f"{ref['id']}-glyphs.png")
        results.append({k:v for k,v in ref.items() if k not in ['image'] }|{'image':ref['image'],'boxes':[{k:v for k,v in b.items() if k!='mask'} for b in boxes],'scores':scores})
    result={'version':1,'input_commit':os.getenv('GITHUB_SHA','local'),'font_assets':records,'references':results,
            'method':'Per-glyph connected components from manual perspective correction. Uniform height normalization, native candidate aspect ratio, centered alignment +/-4px translation. Whole rows use reference-derived positions. No held-out accuracy estimate; Iran photographs share one serial/collection.',
            'licensing':'No font binaries or extracted font libraries published. Font names/origins are recorded, not a redistribution clearance. Iranian reference crops: CC BY-SA 4.0, credited. 964 crop for visual criticism, original rights retained.'}
    (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    body=[]
    for r in results:
        opts=''.join(f'<option value="{k}">{html.escape(LABELS[k])}</option>' for k in r['candidates'])
        cells=''.join(f'<tr><td>{html.escape(LABELS[k])}</td><td>{s["mean_silhouette_iou"]:.3f}</td></tr>' for k,s in r['scores'].items())
        body.append(f'''<section data-ref="{r['id']}"><h2>{html.escape(r['title'])}</h2><p>{html.escape(r['kind'])}</p><div class="compare"><img class="reference" src="{r['id']}-reference.png" alt="Rectified reference crop"><img class="candidate" src="{r['id']}-original.png" alt="Candidate glyphs at identical positions"></div><label>Candidate <select>{opts}</select></label><label>Candidate opacity <input type="range" min="0" max="100" value="50"></label><p><a href="{r['id']}-comparison.png">Side-by-side sheet</a> · <a href="{r['id']}-glyphs.png">Character close-ups</a> · <a href="{r['id']}-regions.png">Measured regions</a> · <a href="{r['source']}">Original source</a></p><table><thead><tr><th>Candidate</th><th>Mean silhouette IoU (0–1)</th></tr></thead><tbody>{cells}</tbody></table><p class="credit">{html.escape(r['credit'])}</p></section>''')
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PlateForge — typography reference comparison</title><style>body{margin:0;background:#f5f3ef;color:#203b34;font:16px/1.6 system-ui}main{max-width:1120px;padding:35px 24px;margin:auto}h1{font-size:36px}h2{font-size:23px}section{background:white;padding:24px;border:1px solid #c9d0ca;border-radius:12px;margin:26px 0}.compare{position:relative;aspect-ratio:1040/220;background:white}.compare img{position:absolute;width:100%;height:100%}.candidate{opacity:.5;mix-blend-mode:multiply}label{display:inline-flex;align-items:center;gap:12px;margin:16px 20px 0 0}select,input{font:inherit;padding:8px}a{color:#235e55}table{border-collapse:collapse;min-width:380px}td,th{padding:7px 20px 7px 0;border-bottom:1px solid #dbe0dc;text-align:left}.credit{font-size:12px;color:#59655e}.notice{padding:18px;border-left:4px solid #b78452;background:#ebe4d9}footer{font-size:13px}</style><main><h1>PlateForge / Typography lab</h1><p>Actual candidate renders versus attributed reference crops. No font files are embedded in this report.</p><div class="notice"><b>How to read this:</b> the silhouette metric is a fit to a small, manually rectified sample, not an authenticity probability. Every candidate uses identical reference-derived character positions. Width differences are retained. Whole-plate layout calibration is not established by this test. The two Iranian photographs show the same serial/collection; they are not independent validation data.</div>'''+''.join(body)+'''<h2>Scope and provenance</h2><p>IR Plate is an older encoded icon font; its ASCII digit slots represent Persian digits. The selected ع maps to its u slot. B Roya Bold is tested using Persian Unicode. EuroPlate is the existing PlateForge asset, not asserted to be an official Iraqi die.</p><p>Joined words, unseen letters, security marks, manufacturing tolerances, old Iraqi Arabic dies and other historical issues have not been certified by this study.</p><footer>Font sources and exact hashes, measured boxes and per-character metrics: <a href="results.json">results.json</a>. Reference crops remain under their stated rights; Iranian adapted crops are CC BY-SA 4.0. Research tooling does not establish font redistribution rights.</footer></main><script>document.querySelectorAll('section[data-ref]').forEach(s=>{const img=s.querySelector('.candidate');s.querySelector('select').onchange=e=>img.src=s.dataset.ref+'-'+e.target.value+'.png';s.querySelector('input').oninput=e=>img.style.opacity=e.target.value/100;});</script></html>'''
    (OUT/'index.html').write_text(page)
    print(json.dumps({'font_assets':records,'results':[{ 'id':r['id'],'scores':r['scores'],'boxes':r['boxes']} for r in results]},ensure_ascii=False))
    assert not list(OUT.glob('*.ttf')) and not list(OUT.glob('*.woff*'))

if __name__=='__main__':main()
