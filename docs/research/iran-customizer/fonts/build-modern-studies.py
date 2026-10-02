#!/usr/bin/env python3
"""Manual smooth diagram-derived current numeral masters; never raster tracing."""
from pathlib import Path
import json,base64,html,shutil
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from PIL import Image
D=Path(__file__).resolve().parent; R=D/'modern-reference';R.mkdir(exist_ok=True)
E=Path('/workspace/scratch/ec45c0c1359b/iran-evidence')
def bounds(path):
 p=BoundsPen(None);parse_path(path,p);return list(p.bounds)
def transform(path,s=1,dx=0,dy=0):
 p=SVGPathPen(None);parse_path(path,TransformPen(p,(s,0,0,s,dx,dy)));return p.getCommands()
def at(path,baseline=87,cap=68):
 return transform(path,cap/100,0,baseline-cap)
# These contours are authored in the unchanged source image coordinate plane.
old={
 '۱':'M72 19 C82 29 89 56 89 86 H77 C77 60 72 42 65 31 Z',
 '۲':'M101 19 C106 33 109 39 120 39 Q126 39 124 31 L123 27 L133 20 C138 42 136 52 123 52 H117 Q119 67 118 87 H106 C106 63 101 45 93 31 Z',
 '۳':'M226 19 C231 32 234 34 239 34 Q243 34 242 21 H250 V31 Q250 35 254 35 Q259 35 259 30 L258 24 L267 19 C271 38 267 45 257 45 Q252 45 249 42 Q246 47 240 47 Q243 65 243 86 H231 C231 61 227 44 218 31 Z',
 '۵':'M343 18 C366 34 378 55 378 70 C378 82 370 88 354 88 C337 88 330 83 330 70 C330 56 337 42 343 33 L338 29 Z M350 41 C343 53 340 61 341 68 Q341 75 354 75 Q367 75 366 67 C365 59 357 47 350 41 Z',
 '۶':'M310 22 L307 30 C299 27 292 30 289 36 C285 43 290 46 300 43 L319 36 L322 45 C305 53 293 70 285 88 L277 80 C283 69 289 60 295 54 C281 55 274 49 278 38 C283 25 298 14 310 22 Z'}
private={
 '۱':'M63 14 C76 30 80 62 80 93 H69 C69 65 65 48 55 34 Z',
 '۲':'M95 14 C101 27 104 32 111 32 Q118 32 118 19 L128 14 C129 36 125 49 110 51 Q113 69 113 93 H101 C101 66 97 48 87 34 Z',
 '۳':'M229 14 C235 28 239 33 243 32 Q247 32 246 21 L255 16 Q255 33 260 32 Q264 32 263 21 L272 15 C274 39 268 49 257 49 Q252 49 250 47 Q247 51 241 51 Q246 72 246 93 H235 C235 67 231 50 221 34 Z',
 '۴':'M286 15 L294 26 C300 10 312 10 322 20 L319 28 C310 23 305 25 303 30 C301 39 315 39 325 30 L328 38 C324 49 314 53 302 52 Q305 71 305 93 H293 C293 64 289 48 280 33 Z',
 '۵':'M350 15 C369 30 378 53 378 69 C378 86 371 98 355 89 C345 99 331 92 331 75 C330 60 339 45 345 36 L342 33 Z M353 43 C347 51 341 64 342 70 Q342 79 350 73 L355 68 Q360 78 366 73 C370 66 361 50 353 43 Z'}
temp4='M313 20 L316 28 C297 32 297 39 313 44 V51 C302 60 295 67 297 74 Q299 78 319 77 V89 H300 C272 89 284 65 297 52 C277 44 286 27 313 20 Z'
gaf='M212 24 L215 30 L186 39 L183 33 Z M217 33 L220 42 L196 49 Q193 50 195 55 L203 73 C207 83 199 91 190 91 H148 C135 91 132 86 132 67 H142 V74 Q142 79 149 79 H189 Q196 79 194 74 L184 54 C180 45 186 42 192 40 Z'
# Inferred national 0/7/8/9: original manual geometry guided by motorcycle structural forms,
# with national stem mass. These are NOT observed national dies.
inferred={
 '۰':'M24 40 L39 53 L26 68 L11 55 Z',
 '۷':'M13 0 C33 17 42 47 45 61 C49 36 58 11 74 0 L83 17 C61 43 56 68 56 100 H36 C36 66 27 37 4 18 Z',
 '۸':'M34 0 H54 C54 44 65 69 84 84 L75 100 C57 88 48 61 44 46 C40 66 29 88 14 100 L5 83 C25 61 34 36 34 0 Z',
 '۹':'M42 0 C62 0 64 15 64 38 C64 69 69 82 78 90 L67 102 C54 91 47 70 47 53 H33 C10 53 11 34 18 17 C23 6 31 0 42 0 Z M41 15 C34 15 29 26 30 34 Q30 39 46 38 C46 23 45 15 41 15 Z'}
def obs(c,p,source,cap,baseline,role='main'):
 return dict(character=c,path=p,sourceBox=[round(v,3) for v in bounds(p)],sourceAdvance=round(bounds(p)[2]-bounds(p)[0]+cap*.16,3),occurrence=f'{role} numeral in source diagram',sourceId=source,sourceFile='modern-reference/'+source+'.png',provenance='observed',evidenceKind='diagram-derived',note='Manually authored smooth source-guided contour; observed illustration, not photographic evidence or official die.')
def inf(c,p,cap,why):
 return dict(character=c,path=p,sourceAdvance=round(bounds(p)[2]-bounds(p)[0]+cap*.16,3),provenance='inferred',evidenceKind='inferred',inference=dict(method='source-style-reconstruction',basisCharacters=list(old),designNotes=why),note='Inferred national-role numeral; '+why)
def region(gs,cap,base,one,source,oldcap,oldbase):
 out=[]
 for g in gs:
  c=g['character']
  if c=='۱':out.append(obs(c,one,source,cap,base,'region'))
  else:
   p=transform(g['path'],cap/oldcap,0,base-oldbase*cap/oldcap)
   out.append(inf(c,p,cap,'Unseen region-code glyph reconstructed from this family main numeral with one uniform cap-height scale; the region ۱ is independently observed.'))
 return dict(capHeight=cap,baseline=base,glyphs=out,evidenceKind='diagram-derived-and-inferred',note='Region header is excluded. Shared role scale, no glyph-by-glyph fitting.')
def profile(id,label,source,cap,base,paths):
 gs=[obs(c,p,source,cap,base) for c,p in paths.items()]
 for c in '۰۱۲۳۴۵۶۷۸۹':
  if c in paths:continue
  if c=='۴':p=transform(temp4,cap/69,0,base-89*cap/69);why='Epsilon-style۴ drawn from temporary diagram, transferred uniformly into this national family; unseen in D/S main row.'
  elif c=='۶':p=transform(old[c],cap/68,0,base-87*cap/68);why='۶ is present in the older national diagram family; transferred uniformly to the newer private family, whose sample omits it.'
  else:p=at(inferred[c],base,cap);why='۰ is an unobserved diamond-form completion.' if c=='۰' else 'Motorcycle diagram supplies numeral structure; national stroke mass reconstructed. Not directly observed in this national main role.'
  gs.append(inf(c,p,cap,why))
 gs.sort(key=lambda x:ord(x['character']))
 return dict(id=id,label=label,script='persian',sourceId=id+':manual-smooth-2026-10-02',sourceUrl='https://commons.wikimedia.org/wiki/File:'+('Pelak_melie_siasi.png' if source=='wiki-diplomatic' else 'Iran_private_vehicle_number_plate.svg'),sourceFile='modern-reference/'+source+'.png',credit='Haghal Jagul / Wikimedia Commons diagram' if source=='wiki-diplomatic' else 'Isochrone / Wikimedia Commons diagram, 2023',license='CC BY-SA 3.0' if source=='wiki-diplomatic' else 'Commons PD-Iran declaration; expiration basis unverified',rights='Diagram-derived manual reconstruction. Older national diagram attributed CC BY-SA 3.0; share adaptations under that license. Private 2023 SVG declares PD-Iran but expiration basis remains unverified; no reusable font license or official die certification is asserted.',provenance='observed',evidenceKind='diagram-derived',capHeight=cap,baseline=base,note='Original low-anchor smooth contours in native source pixels. Complete Persian U+06F0–U+06F9 only; Arabic-indic codepoints are deliberately not aliases. Observed and inferred per-glyph provenance retained. Shared cap/baseline and native advances; no per-glyph warping. This is an illustration-led reconstruction, not an authenticated physical die.',glyphs=gs,wordmarks=[],roles={})
a=profile('source-national-numerals','Older national diagram numerals · open teardrop۵','wiki-diplomatic',68,87,old)
a['roles']['region']=region(a['glyphs'],63,96,'M404 33 C417 44 422 68 422 96 H410 C410 76 405 60 396 47 Z','wiki-diplomatic',68,87)
b=profile('source-national-private-numerals','Newer private-family diagram numerals · heart۵','wiki-private',79,93,private)
b['roles']['region']=region(b['glyphs'],69,99,'M418 29 C430 43 434 70 434 99 H423 C423 73 418 56 409 46 Z','wiki-private',79,93)
t=profile('source-national-temporary-numerals','Temporary main numeric variant · epsilon۴','wiki-diplomatic',69,90,{c:transform(p,69/68,0,90-87*69/68) for c,p in old.items()})
t['sourceFile']='modern-reference/wiki-temporary.png';t['sourceUrl']='https://commons.wikimedia.org/wiki/File:Pelak_melie_gozar_movaqat.png'
# Main 4 is directly recoverable in the temporary illustration, unlike the D/S sample.
t['glyphs']=[obs('۴',temp4,'wiki-temporary',69,90) if g['character']=='۴' else g for g in t['glyphs']]
t['roles']['series']=dict(capHeight=69,baseline=91,glyphs=[obs('گ',gaf,'wiki-temporary',69,91,'series')])
t['roles']['region']=region(t['glyphs'],28,59,'M424 31 C429 37 430 47 430 59 H425 Q425 45 421 35 Z','wiki-temporary',69,90)
# Temporary digits are authored in that source plane, not silently relabelled D/S paths.
temporary_paths={
 '۱':'M60 22 C70 36 76 62 76 91 H64 C64 65 59 47 51 35 Z',
 '۲':'M94 22 C99 34 103 42 114 41 Q119 41 117 34 L116 29 L125 22 C132 45 126 55 113 55 H107 Q110 72 109 91 H97 C97 66 93 49 85 35 Z',
 '۳':'M234 20 C241 34 245 38 249 33 V21 H258 V33 Q259 38 264 36 Q268 35 267 27 L266 25 L274 20 C280 43 271 50 258 44 Q255 50 247 50 Q251 67 251 89 H238 C238 61 232 46 225 32 Z',
 '۴':temp4,
 '۵':'M340 20 C362 36 376 57 376 73 C376 85 368 91 352 91 C335 91 327 83 327 70 C327 56 334 43 340 34 L335 30 Z M346 42 C338 55 335 63 337 71 Q338 78 352 77 Q366 77 363 67 C360 57 352 47 346 42 Z'}
t['glyphs']=[obs(c,temporary_paths[c],'wiki-temporary',69,90) if c in temporary_paths else dict(g,provenance='inferred',evidenceKind='inferred',inference=dict(method='source-style-reconstruction',basisCharacters=list(temporary_paths),designNotes='Transferred national-family completion; absent from this temporary main sample.')) for c,g in [(g['character'],g) for g in t['glyphs']]]
# Expiry is a distinct tiny role, and its directly visible ۴۶۹ and slash remain independently authored.
expiry_paths={
 '۴':'M466 66 L469 70 Q473 63 480 68 L478 71 Q474 69 472 72 Q474 75 481 72 L482 75 Q477 79 472 78 L473 94 H468 Q469 79 463 71 Z',
 '۶':'M439 68 L438 71 Q432 69 430 72 Q427 76 434 75 L441 73 L441 77 Q431 83 427 95 L423 92 Q426 85 430 81 Q418 82 425 72 Q432 64 439 68 Z',
 '۹':'M407 66 Q415 66 413 78 Q413 87 416 91 L412 95 Q407 88 407 81 Q398 82 400 73 Q402 66 407 66 Z M406 71 Q403 72 404 76 H408 Q409 70 406 71 Z',
 '/':'M454 67 H458 L450 96 H446 Z'}
t['roles']['expiry']=region(t['glyphs'],28,95,'M401 68 C406 74 407 84 407 95 H402 Q402 81 398 72 Z','wiki-temporary',69,90)
t['roles']['expiry']['glyphs']=[obs(g['character'],expiry_paths[g['character']],'wiki-temporary',28,95,'expiry') if g['character'] in expiry_paths else inf(g['character'],g['path'],28,'Unobserved expiry numeral inferred from national family with uniform role scaling.') for g in t['roles']['expiry']['glyphs']]
t['roles']['expiry']['glyphs'].append(obs('/',expiry_paths['/'],'wiki-temporary',28,95,'expiry'))
classes={
 'ب':('wiki-private','M139 25 L149 28 C144 40 147 44 170 46 C189 47 204 43 206 39 L201 31 L206 17 C221 31 218 48 205 54 C189 65 148 64 139 56 C132 50 132 39 139 25 Z M170 69 L181 76 L174 89 L162 81 Z'),
 'پ':('wiki-police','M153 34 L161 37 C154 49 160 53 175 53 C194 53 210 50 215 46 L209 38 L216 27 C226 39 224 53 215 58 C202 66 160 67 153 57 C147 53 147 43 153 34 Z M177 72 L183 76 L178 83 L172 79 Z M188 71 L195 76 L190 83 L183 79 Z M185 82 L192 87 L186 93 L180 88 Z'),
 'ث':('wiki-irgc','M150 54 L158 57 C151 69 157 73 174 73 C190 73 207 69 213 65 L207 57 L214 48 C224 62 220 74 212 78 C197 87 157 86 150 78 C144 74 144 64 150 54 Z M180 30 L187 35 L182 41 L175 36 Z M176 40 L183 45 L178 51 L171 47 Z M184 43 L191 48 L186 54 L179 49 Z'),
 'ش':('wiki-army','M146 58 L153 60 C147 77 153 85 166 85 C178 85 184 76 178 60 L173 48 L181 42 C188 56 187 63 194 63 Q199 62 197 45 H204 V57 Q205 63 211 62 Q217 59 211 46 L219 41 C229 58 223 68 215 69 Q207 69 203 64 Q199 72 188 66 C191 87 177 96 160 94 C143 92 139 77 146 58 Z M197 13 L204 19 L197 26 L190 20 Z M191 25 L197 30 L191 36 L185 30 Z M203 27 L209 32 L203 38 L197 33 Z'),
 'ز':('wiki-defence','M176 23 L182 29 L176 35 L170 29 Z M179 41 C197 64 180 79 158 90 L153 82 C180 65 181 62 173 47 Z'),
 'ف':('wiki-staff','M190 29 L197 35 L191 42 L184 36 Z M192 46 C207 47 214 65 208 78 Q204 84 192 84 H151 Q137 83 138 64 H147 V70 Q147 74 153 74 H193 Q202 73 201 69 C184 72 179 62 185 51 Q188 46 192 46 Z M192 54 Q187 58 193 61 H201 Q199 54 192 54 Z')}
# Every series glyph keeps its own source file; these six do not claim a complete class alphabet.
a['roles']['series']=dict(capHeight=80,baseline=96,glyphs=[obs(c,p,f,80,96,'series') for c,(f,p) in classes.items()],note='Bounded illustration-led observed class forms. Different source diagrams retained per glyph.')
freepaths={
 '۱':'M83 21 C90 30 93 45 93 61 H86 C86 47 83 34 79 27 Z',
 '۲':'M112 21 C116 30 119 33 125 32 Q128 31 126 25 L131 21 C137 35 132 39 120 38 Q122 48 122 61 H115 C115 46 111 35 107 27 Z',
 '۳':'M145 21 C150 31 151 34 155 32 V23 H161 V31 Q165 34 164 25 L168 22 C171 36 167 40 159 37 Q156 40 151 39 Q154 49 154 61 H147 C147 46 143 35 139 27 Z',
 '۵':'M213 21 C226 30 234 42 233 51 Q233 61 220 61 Q205 61 205 51 C205 41 211 33 214 29 L210 27 Z M217 34 C211 43 209 49 211 53 Q213 56 220 56 Q228 56 227 50 C226 44 221 37 217 34 Z',
 '۶':'M193 22 L191 27 Q183 24 179 31 C177 38 187 35 198 31 L201 37 Q185 43 177 61 H172 C175 52 180 46 184 41 Q169 43 173 33 C178 22 188 17 193 22 Z'}
f=profile('source-freezone-persian-numerals','Free-zone Persian upper row · Qeshm diagram','wiki-diplomatic',40,61,freepaths)
f['sourceFile']='modern-reference/wiki-freezone-Qeshm.png';f['sourceUrl']='https://commons.wikimedia.org/wiki/File:Qeshm_plate.png';f['credit']='Wikimedia Commons free-zone diagram; exact source title recorded per glyph.'
f['glyphs']=[obs(g['character'],g['path'],'wiki-freezone-Qeshm',40,61) if g['character'] in freepaths else g for g in f['glyphs']]
f['roles']={};profiles=[a,b,t,f]
source_pages={'wiki-diplomatic':'Pelak_melie_siasi.png','wiki-private':'Iran_private_vehicle_number_plate.svg','wiki-temporary':'Pelak_melie_gozar_movaqat.png','wiki-police':'Pelak_melie_polis.png','wiki-irgc':'Pelak_melie_sepah.png','wiki-army':'Pelak_melie_artesh.png','wiki-defence':'Pelak_melie_defa.png','wiki-staff':'Pelak_melie_setad.png','wiki-freezone-Qeshm':'Qeshm_plate.png'}
# Get exact already-retrieved source image titles rather than guessing file names.
for item in json.loads((E/'wiki-images.json').read_text()):
 n=Path(item['local_file']).stem
 if n in source_pages:
  import urllib.parse
  url=item['image_url']; part=url.split('/thumb/')[-1].split('/')
  if len(part)>2:source_pages[n]=urllib.parse.unquote(part[2])
for p in profiles:
  source_key=Path(p['sourceFile']).stem
  if source_key in source_pages:p['sourceUrl']='https://commons.wikimedia.org/wiki/File:'+source_pages[source_key]
for p in profiles:
 for role,gs in [('main',p['glyphs'])]+[(r,v['glyphs']) for r,v in p['roles'].items()]:
  for g in gs:
   if g.get('provenance')!='observed':
    g.pop('sourceBox',None);g.pop('occurrence',None);g['note']='Inferred source-style reconstruction. '+g.get('inference',{}).get('designNotes','Unobserved role glyph.')
    continue
   key=Path(g['sourceFile']).stem
   g['sourceUrl']='https://commons.wikimedia.org/wiki/File:'+source_pages[key]
   g['license']='Commons PD-Iran declaration; expiration basis unverified' if key=='wiki-private' else 'CC BY-SA 3.0'
   g['rights']='Source-guided diagram adaptation; no claim of official die certification. '+('2023 own-work PD-Iran declaration requires independent reuse review.' if key=='wiki-private' else 'Retain attribution and share-alike under CC BY-SA 3.0.')

# Evidence group boxes are measured in the original whole-plate pixel plane,
# not assembled from separately fitted glyph crops. x0,y0,x1,y1 is exclusive.
role_boxes={
 'source-national-numerals':((500,110),{'prefix':[65,19,136,87],'serial':[218,19,378,88],'rightcode':[396,33,472,96]}),
 'source-national-private-numerals':((500,112),{'prefix':[55,15,128,92],'serial':[221,13,378,93],'rightcode':[409,30,477,99],'series':[134,17,213,89]}),
 'source-national-temporary-numerals':((500,111),{'prefix':[51,23,128,91],'serial':[225,20,376,91],'rightcode':[421,31,452,59],'expiry':[400,66,482,96],'series':[132,24,220,91]}),
 'source-freezone-persian-numerals':((250,125),{'main':[79,20,234,62]})}
for p in profiles:
 size,boxes=role_boxes[p['id']];p['sourceImageSize']=list(size);p['sourceRoleBoxes']=boxes;p['sourceRoleBoxConvention']='x0,y0,x1,y1; original source plate pixels, excludes header and border; adjacent numeral group observed as a group'
# Advance widths are measured between adjacent numeral ink origins when the
# sample exposes that pair. Remaining advances are explicit design estimates.
advance_observations={
 'source-national-numerals':{'۱':28,'۳':59,'۶':53},
 'source-national-private-numerals':{'۱':32,'۳':59,'۴':51},
 'source-national-temporary-numerals':{'۱':34,'۳':59,'۴':43},
 'source-freezone-persian-numerals':{'۱':28,'۲':32,'۳':33,'۶':33}}
for p in profiles:
 for role,r in [('main',p)]+list(p['roles'].items()):
  for g in r['glyphs']:
   g['advanceProvenance']='inferred'
   g['advanceNote']='Designed native advance; sample does not expose a following numeral for direct measurement.'
   v=advance_observations[p['id']].get(g['character']) if role=='main' else None
   if role=='region' and g['character']=='۱':v={'source-national-numerals':50,'source-national-private-numerals':44,'source-national-temporary-numerals':21}.get(p['id'])
   if v is not None:
    g['sourceAdvance']=v;g['advanceProvenance']='observed';g['advanceNote']='Measured adjacent numeral ink-origin separation in unchanged source pixels. No per-glyph scaling.'
for p in profiles:
 p['numericCompletion']=dict(required='۰۱۲۳۴۵۶۷۸۹',observed=''.join(g['character'] for g in p['glyphs'] if g['provenance']=='observed'),inferred=''.join(g['character'] for g in p['glyphs'] if g['provenance']=='inferred'),unicodePolicy='Persian U+06F0–U+06F9; no Arabic-indic substitutions')
for n in ['wiki-diplomatic','wiki-private','wiki-temporary','wiki-motorcycle','wiki-police','wiki-irgc','wiki-army','wiki-defence','wiki-staff','wiki-freezone-Qeshm']:Image.open(E/(n+'.png')).convert('RGB').save(R/(n+'.png'))
(D/'modern-studies.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=2)+'\n')
# Fixed native source-plane overlays: the full plate image and all observed outlines have
# exactly the same source pixels and one shared display scale. No per-glyph placement fit.
rows=[(a,'wiki-diplomatic',list(old)),(b,'wiki-private',list(private)),(t,'wiki-temporary',list(temporary_paths)),(f,'wiki-freezone-Qeshm',list(freepaths))]
svg=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1530" height="1610"><rect width="100%" height="100%" fill="#eeeeea"/><style>text{font-family:sans-serif;font-size:16px}</style><text x="20" y="30">Current national numeric reconstruction: native source, smooth outlines, registered overlay</text><text x="20" y="55">Each plate uses one fixed scale; original x/y coordinates remain unchanged. Magenta exposes residuals.</text>']
for row,(p,source,cs) in enumerate(rows):
 yy=90+row*275;im=Image.open(R/(source+'.png'));data=base64.b64encode((R/(source+'.png')).read_bytes()).decode();sel=[g for g in p['glyphs'] if g['character'] in cs]
 if source=='wiki-temporary':sel+=p['roles']['series']['glyphs']
 if 'region' in p['roles'] and source!='wiki-temporary':sel+=[p['roles']['region']['glyphs'][1]]
 for j in range(3):
  x=10+j*510;svg.append(f'<text x="{x}" y="{yy}">{html.escape(p["id"])} · {j+1}</text><rect x="{x}" y="{yy+15}" width="500" height="130" fill="white"/>')
  if j!=1:svg.append(f'<image x="{x}" y="{yy+15}" width="{im.width}" height="{im.height}" xlink:href="data:image/png;base64,{data}"/>')
  if j>0:
   for g in sel:svg.append(f'<path d="{g["path"]}" fill="{"#171717" if j==1 else "#ff00bb"}" fill-rule="evenodd" opacity="{1 if j==1 else .5}" transform="translate({x},{yy+15})"/>')
 svg.append(f'<text x="10" y="{yy+175}">Source diagram · observed contours only. Blank positions in the middle panel are not claimed.</text>')
# Common cap specimen, demonstrates arbitrary sequence without fitting glyphs to cells.
y=1215
for p in profiles[:2]:
 x=20;svg.append(f'<text x="20" y="{y}">{p["id"]}: full repertoire, O=observed diagram / I=inferred</text>')
 for g in p['glyphs']:
  bb=bounds(g['path']);svg.append(f'<path d="{g["path"]}" fill="#111" fill-rule="evenodd" transform="translate({x-bb[0]},{y+20-p["baseline"]+p["capHeight"]})"/><text x="{x}" y="{y+125}">{"O" if g["provenance"]=="observed" else "I"}</text>');x+=g['sourceAdvance']+30
 y+=170
svg.append('</svg>');(R/'fixed-overlay.svg').write_text(''.join(svg))
print('Wrote',D/'modern-studies.json')
# Expanded fixed-scale class and tiny-expiry board. Source/middle/overlay are identically
# clipped at the same native box, then uniformly enlarged 3x across every role.
items=a['roles']['series']['glyphs']+t['roles']['series']['glyphs']+[g for g in t['roles']['expiry']['glyphs'] if g['provenance']=='observed']
out=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1140" height="{80+len(items)*300}"><rect width="100%" height="100%" fill="#eee"/><text x="15" y="30" font-family="sans-serif" font-size="22">Source-led class and expiry forms · fixed 3x overlay</text>']
for i,g in enumerate(items):
 y=70+i*300;bb=bounds(g['path']);x0=int(bb[0])-8;y0=int(bb[1])-8;w=int(bb[2]-bb[0])+17;h=int(bb[3]-bb[1])+17
 im=Image.open(D/g['sourceFile']).crop((x0,y0,x0+w,y0+h));from io import BytesIO
 buf=BytesIO();im.save(buf,format='PNG');b64=base64.b64encode(buf.getvalue()).decode()
 for j in range(3):
  x=15+j*375;out.append(f'<rect x="{x}" y="{y}" width="360" height="270" fill="white"/>')
  if j!=1:out.append(f'<image x="{x}" y="{y}" width="{w*3}" height="{h*3}" xlink:href="data:image/png;base64,{b64}"/>')
  if j>0:out.append(f'<path d="{g["path"]}" fill="{"#151515" if j==1 else "#ff00bb"}" opacity="{1 if j==1 else .55}" fill-rule="evenodd" transform="translate({x-x0*3},{y-y0*3}) scale(3)"/>')
 out.append(f'<text x="15" y="{y+290}" font-size="15" font-family="sans-serif">{g["character"]} · {g["sourceId"]} · original source coordinates; constant 3x</text>')
out.append('</svg>');(R/'class-expiry-overlay.svg').write_text(''.join(out))
