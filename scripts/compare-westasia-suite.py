#!/usr/bin/env python3
"""Extended review suite; no font binaries, glyph libraries or raw source photographs are retained.
The low-level engine handles rasterization and registration. This driver defines additional
specimens, records metrics/provenance, excludes occluded evidence and packages the viewer.
"""
from __future__ import annotations
import base64, importlib.util, io, json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.pens.boundsPen import BoundsPen
spec=importlib.util.spec_from_file_location('study',Path(__file__).with_name('compare-westasia-fonts.py'))
study=importlib.util.module_from_spec(spec); spec.loader.exec_module(study)

# A DIFFERENT serial/photographer, held separate from the two views of 24 ع 417 | 91.
# The original is only 346 x 81, so this is a contextual-form cross-check, not high-resolution die metrology.
study.REFS.append(dict(id='iran-heh', title='Iran / private — ۸۸ هـ ۸۶۳ | ۳۶',
 kind='Independent low-resolution photograph (346 x 81); use primarily to compare the contextual heh form',
 image='https://upload.wikimedia.org/wikipedia/commons/c/cc/Iranianplate.jpg',
 source='https://commons.wikimedia.org/wiki/File:Iranianplate.jpg',
 credit='MohsenKalali, 29 March 2018, CC BY-SA 4.0. Cropped, rectified and enlarged. https://creativecommons.org/licenses/by-sa/4.0/',
 corners=[[17.34,17.34],[982.66,20.23],[982.66,213.87],[14.45,213.87]],
 chars='۸۸ه۸۶۳۳۶', candidates=['original','irplate','roya','roya-plate-form'], threshold=105))
label,url,sha=study.FONTS['roya']; study.FONTS['roya-plate-form']=('B Roya Bold / plate heh',url,sha)
study.LABELS['roya-plate-form']='B Roya Bold / contextual heh'
original_glyph=study.glyph_image; metrics={}; cached={}

def plate_glyph(font, ch, key):
    original_ch=ch
    # Plate heh is the initial presentation form, not generic isolated ه.
    if key=='roya-plate-form' and ch=='ه': ch='\ufeeb'
    image=original_glyph(font,ch,key)
    encoded=ch
    if key=='irplate': encoded=str(ord(ch)-0x6f0) if '۰'<=ch<='۹' else study.IR_MAP.get(ch,ch)
    glyphset=font.getGlyphSet(); name=font.getBestCmap()[ord(encoded)]
    pen=BoundsPen(glyphset);glyphset[name].draw(pen)
    x0,y0,x1,y1=pen.bounds
    entry=metrics.setdefault(key,{'unitsPerEm':font['head'].unitsPerEm,'glyphs':{}})
    entry['glyphs'][original_ch]={'encoded':encoded,'bounds':[x0,y0,x1,y1],'advance':glyphset[name].width}
    cached[(key,original_ch)]=image
    return image

study.glyph_image=plate_glyph
study.main()
out=study.OUT
result=json.loads((out/'results.json').read_text())
result['input_commit']=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
page=(out/'index.html').read_text()
# An occluding hand contaminates C in the news photo. Keep the crop visible, but do not score it.
for ref in result['references']:
    if ref['id']=='iraq-964':
        ref['excluded_from_mean']=[{'index':2,'char':'C','reason':'Hand/edge contamination; not reliable glyph-only evidence.'}]
        for candidate,scores in ref['scores'].items():
            before=scores['mean_silhouette_iou']; included=[g for i,g in enumerate(scores['glyphs']) if i!=2]
            scores['glyphs'][2]['excluded_from_mean']=True
            scores['mean_silhouette_iou']=round(sum(g['silhouette_iou'] for g in included)/len(included),4)
            page=page.replace(f'>{before:.3f}</td>',f'>{scores["mean_silhouette_iou"]:.3f}</td>',1)
        page=page.replace('News photograph; perspective correction is approximate','News photograph; perspective correction is approximate. C is excluded from the score because the hand contaminates its crop.')
        # The large board also discloses its occluded evidence; no silent whitening of the photograph.
        im=Image.open(out/'iraq-964-comparison.png').convert('RGB'); d=ImageDraw.Draw(im)
        d.rectangle((35,68,1125,106),fill='#f5f3ef')
        d.text((40,76),'C is occluded and excluded from the score. Remaining glyphs use identical reference positions.',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16),fill='#70412b')
        im.save(out/'iraq-964-comparison.png')
    # Regenerate the heh sheet with its correct title, credit and low-resolution limitation.
    if ref['id']=='iran-heh':
        im=Image.open(out/'iran-heh-comparison.png').convert('RGB'); d=ImageDraw.Draw(im)
        d.rectangle((0,0,1160,112),fill='#f5f3ef')
        d.text((40,28),'IRAN / PRIVATE  |  CONTEXTUAL HEH',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',28),fill='#163c38')
        d.text((40,75),'Independent 346 x 81 photograph; enlarged for form comparison, not precision die measurements.',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16),fill='#52635f')
        d.rectangle((0,im.height-55,1160,im.height),fill='#f5f3ef')
        d.text((40,im.height-45),'Reference: MohsenKalali, 2018-03-29, CC BY-SA 4.0 (cropped / rectified / enlarged).',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16),fill='#52635f')
        im.save(out/'iran-heh-comparison.png')

# A near-match to each other does not establish how either font was made or who owns the outlines.
pair=[]
for ch in '۰۱۲۳۴۵۶۷۸۹عسب':
    a=cached[('irplate',ch)];b=cached[('roya',ch)]
    pair.append({'char':ch,**study.metric(__import__('numpy').asarray(a.getchannel('A')),b)})
result['candidate_pair_comparison']={'description':'IR Plate vs B Roya Bold, same normalization as specimens; similarity is NOT a provenance determination.','glyphs':pair}
(out/'font-metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,separators=(',',':')))
(out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
page=page.replace('The two Iranian photographs show the same serial/collection;', 'The two public-plate Iranian photographs show the same serial/collection;')
page=page.replace('B Roya Bold is tested using Persian Unicode.', 'B Roya Bold is tested using Persian Unicode. The additional private specimen tests isolated ه versus the plate initial form هـ (U+FEEB), explicitly rather than relying on fallback shaping.')
page=page.replace('Font sources and exact hashes, measured boxes and per-character metrics:', 'Font metrics without outlines: <a href="font-metrics.json">font-metrics.json</a>. Sources, exact hashes, exclusions and per-character comparisons:')
(out/'index.html').write_text(page)

# Small one-bit contact sheets make glyph shapes easy to inspect without noisy photo backgrounds.
# These are raster diagnostic masks, never production font assets.
for ref in result['references']:
    w,h=520,132; keys=['reference']+ref['candidates']
    thumb=Image.new('RGB',(w,h*len(keys)),'white'); draw=ImageDraw.Draw(thumb)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
    for i,key in enumerate(keys):
        image=Image.open(out/f"{ref['id']}-{key}.png").convert('L')
        if key=='reference':
            array=__import__('numpy').asarray(image); mask=Image.new('L',image.size,255)
            for box in ref['boxes']:
                x,y,bw,bh=box['box']; crop=Image.fromarray((array[y:y+bh,x:x+bw]>=ref['threshold']).astype('uint8')*255)
                mask.paste(crop,(x,y))
            image=mask
        image=image.resize((520,110),Image.Resampling.LANCZOS)
        thumb.paste(image,(0,h*i+20));draw.text((8,h*i+2),'Reference mask' if key=='reference' else study.LABELS[key],font=font,fill='black')
    thumb.convert('1',dither=Image.Dither.NONE).save(out/f"{ref['id']}-silhouettes.png",optimize=True)

# A single-file offline viewer containing PNGs and JSON only. Candidate changes still work offline.
assets={p.name:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in out.glob('*.png')}
for name,data in assets.items():
    page=page.replace(f'src="{name}"',f'src="{data}"').replace(f'href="{name}"',f'download="{name}" href="{data}"')
for name in ['results.json','font-metrics.json']:
    data='data:application/json;base64,'+base64.b64encode((out/name).read_bytes()).decode()
    page=page.replace(f'href="{name}"',f'download="{name}" href="{data}"')
page=page.replace('<script>document.querySelectorAll', '<script>const assets='+json.dumps(assets,separators=(',',':'))+';document.querySelectorAll')
page=page.replace("img.src=s.dataset.ref+'-'+e.target.value+'.png'", "img.src=assets[s.dataset.ref+'-'+e.target.value+'.png']")
assert '@font-face' not in page and 'data:font' not in page
(out/'offline.html').write_text(page)
print(json.dumps({'review_commit':result['input_commit'],'scores':{r['id']:{k:v['mean_silhouette_iou'] for k,v in r['scores'].items()} for r in result['references']},'font_pair':pair,'outputs':{p.name:p.stat().st_size for p in out.iterdir() if p.is_file()}},ensure_ascii=False))
