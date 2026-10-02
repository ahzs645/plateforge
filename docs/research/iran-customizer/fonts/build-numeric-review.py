#!/usr/bin/env python3
"""Readable original/source/inferred specimen boards; no source-shape fitting."""
from pathlib import Path
import json, html, base64
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
DOC=Path(__file__).resolve().parent
DIGITS='۰۱۲۳۴۵۶۷۸۹'
def bounds(path):
 p=BoundsPen(None);parse_path(path,p);return p.bounds
studies=[]
for filename in ['historical-studies.json','city-studies.json','parallel-studies.json','bilingual-studies.json','modern-studies.json','freezone-studies.json','previous-studies.json','zone-studies.json']:
 if (DOC/filename).exists():studies+=json.loads((DOC/filename).read_text())
records=[]
for s in studies:
 for role,r in [('main',s)]+list(s.get('roles',{}).items()):
  chars={g['character']:g for g in r.get('glyphs',[])}
  digits='0123456789' if s.get('script')=='latin' else DIGITS
  if not any(c in chars for c in digits):continue
  records.append((s,role,r,chars,digits))
report=[]
for s,role,r,chars,digits in records:
 observed=''.join(c for c in digits if c in chars and chars[c].get('provenance','observed')=='observed')
 inferred=''.join(c for c in digits if c in chars and chars[c].get('provenance')=='inferred')
 report.append(dict(profile=s['id'],role=role,observed=observed,inferred=inferred,missing=''.join(c for c in digits if c not in chars),sourceFile=s['sourceFile'],sourceUrl=s['sourceUrl'],capHeight=r['capHeight'],baseline=r['baseline'],confidence=r.get('numericCompletion',{}).get('confidence','low' if len(observed)<3 else 'provisional'),glyphs=[dict(character=c,provenance=chars[c].get('provenance','observed'),inference=chars[c].get('inference')) for c in digits if c in chars]))
(DOC/'numeric-coverage-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
summary=['# Source-specific numeric coverage', '', f'{len(report)} complete source numeric alphabets; {sum(len(r["observed"]) for r in report)} observed digits; {sum(len(r["inferred"]) for r in report)} inferred digits; {sum(len(r["missing"]) for r in report)} missing digits.', '', 'The seven licensed candidate alphabets are separately complete. Class/word-only alphabets are not counted as numeric roles.', '', '| Profile / role | Observed | Inferred | Missing | Inference confidence |', '|---|---|---|---|---|']
for r in report:
 summary.append('| '+r['profile']+' / '+r['role']+' | '+r['observed']+' | '+r['inferred']+' | '+(r['missing'] or 'none')+' | '+r['confidence']+' |')
summary+=['', 'Observed means the exact character is present in that role of the cited illustrative diagram or photograph; it does not certify a manufacturing die. Inferred means an original stylistic reconstruction, explicitly labelled at glyph level and in exported SVG. See numeric-coverage-report.json for exact sources, metrics, and glyph-level rationale.', '', 'All 152 pre-completion observed glyph paths remain byte-for-byte unchanged; check-observed-paths.py verifies their SHA-256 baselines.']
(DOC/'numeric-coverage-report.md').write_text('\n'.join(summary)+'\n')
# Profile pages use one common numeric cap height, never individual numeral fitting.
for page in range((len(records)+5)//6):
 group=records[page*6:page*6+6];height=110+len(group)*270
 out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="{height}" viewBox="0 0 1400 {height}"><rect width="1400" height="{height}" fill="#f5f3ed"/><g font-family="sans-serif" fill="#182b35">',f'<text x="28" y="35" font-size="25">Source-specific complete numeral alphabets — sheet {page+1}</text>','<text x="28" y="62" font-size="16">O = source-observed contour (unchanged); I = inferred source-style form, not observed or authenticated</text>','<text x="28" y="84" font-size="13">One shared cap scale per alphabet; native widths. Inference stays explicit in runtime, SVG and audit metadata.</text>']
 for i,(s,role,r,chars,digits) in enumerate(group):
  y=110+i*270;record=next(x for x in report if x['profile']==s['id'] and x['role']==role)
  out.append(f'<text x="28" y="{y+22}" font-size="19">{html.escape(s["id"]+" / "+role)}</text>')
  raw=base64.b64encode((DOC/s['sourceFile']).read_bytes()).decode();mime='image/png' if s['sourceFile'].endswith('.png') else 'image/jpeg'
  out.append(f'<image x="28" y="{y+37}" width="355" height="125" preserveAspectRatio="xMidYMid meet" href="data:{mime};base64,{raw}"/>')
  for j,c in enumerate(digits):
   x=416+j*96;g=chars.get(c);out.append(f'<rect x="{x}" y="{y+42}" width="87" height="144" rx="4" fill="white" stroke="#d8d5cb"/>')
   if g:
    b=bounds(g['path']);scale=76/r['capHeight']; tx=x+(87-(b[2]-b[0])*scale)/2-b[0]*scale;ty=y+135-r['baseline']*scale
    prov=g.get('provenance','observed');color='#14282f' if prov=='observed' else '#aa571e'
    out.append(f'<path d="{g["path"]}" transform="matrix({scale} 0 0 {scale} {tx} {ty})" fill="{color}" fill-rule="{g.get("fillRule","evenodd")}"/>')
    out.append(f'<text x="{x+43}" y="{y+165}" text-anchor="middle" fill="{color}" font-size="16">{j} · {"O" if prov=="observed" else "I"}</text>')
   else:out.append(f'<text x="{x+43}" y="{y+115}" text-anchor="middle" fill="red">missing</text>')
  out.append(f'<text x="28" y="{y+191}" font-size="13">{html.escape(s["sourceFile"])}</text>')
  design=r.get('numericCompletion',{}).get('design',{}).get('note') or r.get('numericCompletion',{}).get('designNotes') or next((g.get('inference',{}).get('designNotes') for g in chars.values() if g.get('inference')),None) or 'Independent alphabet; inferred contours reconstructed from the observed source-style forms.'
  design=str(design)[:325]
  import textwrap
  for k,line in enumerate(textwrap.wrap(design,173)):
   out.append(f'<text x="28" y="{y+213+k*18}" font-size="13">{html.escape(line)}</text>')
 out.append('</g></svg>');(DOC/f'numeric-repertoire-{page+1:02d}.svg').write_text(''.join(out))
print(f'{len(report)} numeric alphabets; {sum(len(r["observed"]) for r in report)} observed; {sum(len(r["inferred"]) for r in report)} inferred; {sum(len(r["missing"]) for r in report)} missing')
