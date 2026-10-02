#!/usr/bin/env python3
"""Validate canonical TTF cmap, dimensions, aliases and actual glyph-mask equivalence."""
from pathlib import Path
import json,subprocess,tempfile
import numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
R=Path(__file__).resolve().parent
profiles=json.loads((R/'canonical-font-data.json').read_text())
manifests=json.loads((R/'ttf/font-mapping.json').read_text())
candidate_words=profiles['naskh-candidate']['wordmarks']
assert len(candidate_words)==33
special_words={'inspection-temporary':('فحص مؤقت','U+E01F'),'counter-terrorism':('جهاز مكافحة الارهاب','U+E020')}
candidate_mapping=next(record for record in manifests if record['id']=='naskh-candidate')['mapping']
for word_id,(text,codepoint) in special_words.items():
 word=candidate_words[word_id]
 assert word['text']==text and word['provenance']=='candidate'
 mapped=next(m for m in candidate_mapping if m['wordmark_id']==word_id)
 assert mapped['codepoints']==[codepoint] and mapped['provenance']=='candidate'
 assert all(word_id not in p['wordmarks'] for p in profiles.values() if p['provenance']=='observed')
results=[]
for record in manifests:
 p=profiles[record['id']];font=TTFont(R/'ttf'/record['file']);gs=font.getGlyphSet();cmap=font.getBestCmap()
 assert font['OS/2'].sCapHeight==1000
 assert font['head'].unitsPerEm==1000
 assert 'GSUB' not in font and 'GPOS' not in font
 for m in record['mapping']:
  g=p['wordmarks'][m['wordmark_id']] if m['wordmark_id'] else p['glyphs'][m['character']]
  assert all(cmap[int(cp[2:],16)]==m['glyph'] for cp in m['codepoints'])
  assert font['hmtx'][m['glyph']][0]==round(g['advance']*10)
  if m['wordmark_id']:assert all(int(cp[2:],16)>=0xE000 for cp in m['codepoints'])
 # Compare rasterized canonical SVG and real TTF glyph outlines in one fixed cell.
 # Even-odd source contours have been converted to TrueType nonzero winding.
 selected=[m for m in record['mapping'] if m['wordmark_id'] or m['character'] in '٠٥٩0AB8']
 for m in selected:
  original=p['wordmarks'][m['wordmark_id']] if m['wordmark_id'] else p['glyphs'][m['character']]
  pen=SVGPathPen(gs);gs[m['glyph']].draw(TransformPen(pen,(.1,0,0,-.1,0,0)))
  size=(int(original['bounds']['width']+20)*3,int(original['bounds']['height']+20)*3)
  x=10-original['bounds']['x'];y=10-original['bounds']['y']
  def svg(path,rule):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size[0]}" height="{size[1]}" viewBox="0 0 {size[0]/3} {size[1]/3}"><g transform="translate({x} {y})"><path d="{path}" fill-rule="{rule}"/></g></svg>'
  masks=[]
  with tempfile.TemporaryDirectory() as td:
   for i,(path,rule) in enumerate([(original['path'],original['fillRule']),(pen.getCommands(),'nonzero')]):
    source=Path(td)/f'{i}.svg';out=source.with_suffix('.png');source.write_text(svg(path,rule))
    subprocess.run(['inkscape',str(source),'--export-type=png',f'--export-filename={out}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    masks.append(np.array(Image.open(out).convert('RGBA'))[:,:,3]>127)
  union=(masks[0]|masks[1]).sum();intersection=(masks[0]&masks[1]).sum();iou=float(intersection/union)
  assert iou>.985,(record['id'],m['glyph'],iou)
  results.append(dict(profile=record['id'],glyph=m['glyph'],canonical_svg_to_ttf_mask_iou=round(iou,6)))
(R/'ttf/validation.json').write_text(json.dumps(dict(validated_fonts=len(manifests),raster_cases=len(results),minimum_mask_iou=min(x['canonical_svg_to_ttf_mask_iou'] for x in results),cases=results),indent=2)+'\n')
print('PASS',len(manifests),'fonts;',len(results),'raster checks; min IoU',min(x['canonical_svg_to_ttf_mask_iou'] for x in results))
