#!/usr/bin/env python3
"""Validate and render native five-digit role samples without glyph fitting."""
import json
from pathlib import Path
from fontTools.svgLib.path import parse_path
from fontTools.pens.boundsPen import BoundsPen
D=Path(__file__).resolve().parent
profiles=[p for p in json.loads((D.parent/'zone-studies.json').read_text()) if p.get('script')=='latin']
rows=['0123456789','12356','12365','11111','88888','90478','70649','55555','00000','99999'];report=[]
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1350" viewBox="0 0 1000 1350"><rect width="1000" height="1350" fill="white"/>']
for col,p in enumerate(profiles):
 gs={g['character']:g for g in p['glyphs']};assert set(gs)==set('0123456789')
 svg.append(f'<text x="{20+col*500}" y="25" font-size="16">{p["id"]}</text>')
 for row,text in enumerate(rows):
  cursor=0;last=None;gaps=[];y=115+row*120
  svg.append(f'<text x="{20+col*500}" y="{y-70}" font-size="12">{text} — native metrics</text>')
  for c in text:
   g=gs[c];pen=BoundsPen(None);parse_path(g['path'],pen);x0,y0,x1,y1=pen.bounds
   if last is not None:gaps.append(cursor-last)
   left=20+col*500+cursor*1.5;top=y-p['baseline']*1.5
   svg.append(f'<path d="{g["path"]}" transform="translate({left-x0*1.5} {top}) scale(1.5)" fill="black" fill-rule="evenodd"/>');last=cursor+x1-x0;cursor+=g['sourceAdvance']
  assert min(gaps)>0,(p['id'],text,gaps)
  report.append(dict(profile=p['id'],serial=text,minimumSourcePixelGap=min(gaps),inkWidth=last,unscaledCapHeight=p['capHeight'],inferredCharacters=[c for c in text if gs[c]['provenance']=='inferred'],overlap=False))
svg.append('</svg>');(D/'latin-full-repertoire.svg').write_text(''.join(svg));(D/'latin-alternate-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(f'PASS: {len(report)} native runs; ten-digit repertoire and nine five-digit samples per profile, positive inter-glyph gaps, all inferred forms labelled')
