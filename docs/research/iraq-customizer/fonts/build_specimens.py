#!/usr/bin/env python3
"""Flat-font proofs; neither photographs nor reconstructed plate layouts are used."""
from pathlib import Path
import json,html,subprocess
R=Path(__file__).resolve().parent
profiles=json.loads((R/'canonical-font-data.json').read_text())
def text(x,y,s,size=20,fill='#526475'):
 return f'<text x="{x}" y="{y}" font-family="DejaVu Sans,sans-serif" font-size="{size}" fill="{fill}">{html.escape(s)}</text>'
def path(g,x,y,scale=1):
 return f'<g transform="translate({x} {y}) scale({scale})"><path d="{g["path"]}" fill="#13283b" fill-rule="{g["fillRule"]}"/></g>'
def document(body,width,height,title):
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><title>{html.escape(title)}</title><rect width="100%" height="100%" fill="#f4f2eb"/>{body}</svg>'
def save(name,body,width,height,title):
 p=R/(name+'.svg');p.write_text(document(body,width,height,title))
 subprocess.run(['inkscape',str(p),'--export-type=png','--export-filename='+str(p.with_suffix('.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

body=text(48,55,'IRAQ · REUSABLE FONT PROFILES',32,'#13283b')
body+=text(48,92,'Flat proofs • shared cap-height / baseline • original proportions • no photographs or source-positioned plates',18)
body+=text(48,123,'Missing characters are crossed boxes. ٠ keeps its native smaller size. Changing the serial reuses the same master outlines.',18)
y=180
for id,p in profiles.items():
 body+=f'<rect x="32" y="{y-16}" width="1516" height="220" rx="12" fill="#fffdf8" stroke="#d6dfdf"/>'
 body+=text(52,y+18,p['label'],25,'#17374d')
 body+=text(52,y+47,'OBSERVED SUBSET' if p['provenance']=='observed' else 'LICENSED CANDIDATE · not a verified Iraqi die',14,'#487663' if p['provenance']=='observed' else '#956920')
 base=y+175
 body+=f'<path d="M50 {base}H1530M50 {base-100}H1530" fill="none" stroke="#dce7e5" stroke-dasharray="5 5"/>'
 chars='0123456789' if id.startswith('modern') else '٠١٢٣٤٥٦٧٨٩'
 x=62
 for char in chars:
  g=p['glyphs'].get(char)
  if g:body+=path(g,x,base)
  else:body+=f'<g fill="none" stroke="#a8aaa4" stroke-width="1.5"><rect x="{x+4}" y="{base-100}" width="58" height="100" stroke-dasharray="4 4"/><path d="M{x+15} {base-72}L{x+51} {base-28}M{x+51} {base-72}L{x+15} {base-28}"/></g>'
  body+=text(x+22,base+21,str(chars.index(char)),13)
  x+=98
 sample='BAGHLQ' if id.startswith('modern') else '٦٣٥' if id=='legacy-erbil' else '٣٢٩' if id=='legacy-sulaymaniyah' else '٥٩١' if id=='anbar-taxi' else '١٣٠' if id=='utility-truck' else 'ب ج ع هـ'
 body+=text(1080,y+64,'Reordered / live run',14)
 x=1080
 for char in sample:
  if char==' ':x+=14;continue
  g=p['glyphs'].get(char)
  if g:body+=path(g,x,base,.69);x+=g['advance']*.69+9
 y+=240
body+=text(48,y+12,'Historical source subsets carry source-specific rights. Truck ٨٩ and all incomplete motorcycle digits are excluded.',16)
save('flat-font-profiles',body,1580,y+52,'Iraqi canonical font profile proof')

body=text(42,52,'IRAQ · COMPLETE JOINED WORDMARKS',30,'#13283b')
body+=text(42,87,'Each joined word is one proportional outline. All fallback words are HarfBuzz-shaped Noto Naskh Arabic Bold (SIL OFL 1.1).',17)
body+=text(42,116,'These candidates are explicitly labelled; they do not turn missing source wordmarks into observed dies.',17)
observed=[(p,w) for p in profiles.values() if p['provenance']=='observed' for w in p['wordmarks'].values()]
y=154
for row in range(0,len(observed),3):
 for col,(p,w) in enumerate(observed[row:row+3]):
  x=30+col*510;body+=f'<rect x="{x}" y="{y}" width="490" height="202" rx="9" fill="#fffdf8" stroke="#d5dfdc"/>'
  body+=text(x+15,y+25,p['id']+' / '+w['wordmarkId'],16,'#335b4a')
  s=min(.9,440/w['bounds']['width']);body+=path(w,x+24,y+157,s)
  body+=text(x+15,y+185,'OBSERVED • complete contextual word',13,'#487663')
 y+=218
y+=25
body+=text(42,y,'LICENSED FALLBACK WORDMARKS · COMPLETE GOVERNORATE / CLASS COVERAGE',22,'#17374d');y+=22
words=profiles['naskh-candidate']['wordmarks']
for row in range(0,len(words),4):
 for col,(id,w) in enumerate(list(words.items())[row:row+4]):
  x=30+col*382;body+=f'<rect x="{x}" y="{y}" width="364" height="165" rx="8" fill="#fffdf8" stroke="#e2dbc9"/>'
  body+=text(x+15,y+24,id,16,'#85622c')
  s=min(.78,325/w['bounds']['width']);body+=path(w,x+19,y+130,s)
  body+=text(x+15,y+151,'CANDIDATE / FALLBACK',11,'#956920')
 y+=180
save('flat-wordmark-profiles',body,1570,y+22,'Complete Iraqi country, governorate and class wordmark proofs')
print('Generated two flat SVG and PNG proofs')
