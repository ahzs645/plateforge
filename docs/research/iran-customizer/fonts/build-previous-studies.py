#!/usr/bin/env python3
"""Smooth observed masters from six diagram sources + expressly inferred digits.
No raster contours, fonts, shape squeezing or source-image ink in exported plates.
"""
from pathlib import Path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
import importlib.util,json,hashlib,shutil
D=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('persian_reconstruction',D/'complete-persian-numerals.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
DIGITS=mod.DIGITS
OUT=[]
LICENSE='CC BY-SA 3.0'
CREDIT='Haghal Jagul; original illustrative diagram; smooth outline adaptation. https://creativecommons.org/licenses/by-sa/3.0/'

def b(path):
 pen=BoundsPen(None);parse_path(path,pen);return list(pen.bounds)
def observed(ch,path,occ='main-row'):
 return dict(character=ch,path=path,provenance='observed',sourceBox=b(path),occurrence=occ,fillRule='evenodd',note='Observed numeral in the named source diagram, reconstructed with sparse smooth Bezier anchors. No raster trace; source-role baseline and relative outline dimensions preserved.')
def geometric(ch,w):
 p=mod.Outline();c=p.c
 if ch=='۰':c('M',w*.5,36);c('L',w,50);c('L',w*.5,64);c('L',0,50);c('Z')
 elif ch=='۱':
  c('M',w*.27,0);c('Q',w*.58,9,w*.72,34);c('Q',w*.99,62,w,100);c('L',w*.5,100);c('Q',w*.5,51,0,13);c('Z')
 elif ch=='۲':
  c('M',w*.13,0);c('Q',w*.3,21,w*.56,22);c('Q',w*.81,27,w*.76,5);c('L',w*.94,0);c('Q',w*1.06,22,w*.95,36);c('Q',w*.85,47,w*.58,46);c('Q',w*.7,72,w*.68,100);c('L',w*.43,100);c('Q',w*.4,51,0,15);c('Z')
 elif ch=='۳':
  c('M',w*.12,0);c('Q',w*.23,15,w*.35,21);c('Q',w*.49,29,w*.48,5);c('L',w*.62,5);c('L',w*.62,19);c('Q',w*.63,31,w*.74,22);c('L',w*.74,6);c('L',w*.91,0);c('Q',w*1.04,30,w*.9,40);c('Q',w*.75,48,w*.61,40);c('Q',w*.51,48,w*.44,45);c('Q',w*.54,73,w*.52,100);c('L',w*.29,100);c('Q',w*.29,56,0,15);c('Z')
 elif ch=='۴':
  c('M',w*.15,0);c('L',w*.46,22);c('Q',w*.51,0,w*.81,0);c('Q',w*.99,0,w,14);c('Q',w*.68,8,w*.62,26);c('Q',w*.78,36,w*.98,23);c('Q',w,46,w*.55,46);c('Q',w*.61,68,w*.6,100);c('L',w*.32,100);c('Q',w*.3,52,0,19);c('Z')
 elif ch=='۵':
  c('M',w*.16,0);c('Q',w*.72,29,w*.96,62);c('Q',w*1.11,91,w*.87,98);c('Q',w*.5,105,w*.17,98);c('Q',-w*.1,90,w*.04,60);c('L',w*.29,18);c('L',w*.07,12);c('Z')
  c('M',w*.4,34);c('Q',w*.14,74,w*.28,81);c('Q',w*.55,89,w*.74,80);c('Q',w*.88,71,w*.4,34);c('Z')
 elif ch=='۶':
  c('M',w*.82,1);c('L',w*.77,14);c('Q',w*.54,7,w*.25,32);c('Q',w*.12,47,w*.38,43);c('L',w*.95,27);c('L',w,43);c('Q',w*.58,57,w*.2,101);c('L',0,91);c('Q',w*.17,64,w*.37,51);c('Q',-w*.1,56,w*.06,28);c('Q',w*.43,-6,w*.82,1);c('Z')
 elif ch=='۷':
  c('M',w*.1,0);c('Q',w*.34,11,w*.5,55);c('Q',w*.58,20,w*.89,0);c('L',w,14);c('Q',w*.63,49,w*.63,100);c('L',w*.33,100);c('Q',w*.31,46,0,15);c('Z')
 elif ch=='۸':
  c('M',w*.36,0);c('L',w*.62,0);c('Q',w*.63,59,w,85);c('L',w*.89,100);c('Q',w*.6,80,w*.49,49);c('Q',w*.39,84,w*.12,100);c('L',0,85);c('Q',w*.34,54,w*.36,0);c('Z')
 elif ch=='۹':
  c('M',w*.52,0);c('Q',w*.9,-3,w*.9,29);c('Q',w*.88,67,w,86);c('L',w*.8,101);c('Q',w*.56,84,w*.53,54);c('Q',-w*.04,58,0,33);c('Q',0,4,w*.52,0);c('Z')
  c('M',w*.42,17);c('Q',w*.2,18,w*.2,33);c('Q',w*.26,42,w*.57,39);c('Q',w*.59,17,w*.42,17);c('Z')
 return p.path()

def complete(s,r,role,style='traditional'):
 chars=[g['character'] for g in r['glyphs']];w=([23,30,60,71,59,61,57,60,59,51] if style=='traditional' else [23,35,66,75,64,66,67,67,67,58])
 design=dict(widths=w,stroke=14 if style=='traditional' else 19,six='hook',lean=0)
 rationale=('Traditional illustrated numerals: tapered blade stem, separately articulated rounded crown lobes, pointed downstrokes and asymmetrical heart five. Added shapes are source-style hypotheses at this role’s own metrics.' if style=='traditional' else 'Geometric illustrated numerals: broad almost uniform stroke, blunt flat stem feet, upright bowl terminals, open teardrop five, flat-headed eight and broad hooked six. Added shapes retain the independent role dimensions.')
 for ch in DIGITS:
  if ch in chars:continue
  path=mod.outline(ch,design) if style=='traditional' else geometric(ch,w[DIGITS.index(ch)])
  r['glyphs'].append(dict(character=ch,path=mod.transform(path,r['capHeight'],r['baseline']),provenance='inferred',fillRule='evenodd',sourceId=s['sourceId']+'/'+role+'/inferred-'+str(DIGITS.index(ch)),note='Inferred numeral absent from this role in the diagram. '+rationale,inference=dict(method='source-style-reconstruction',basisCharacters=chars,designNotes=rationale)))
 r['numericCompletion']=dict(coverage=DIGITS,observed=''.join(c for c in DIGITS if c in chars),inferred=''.join(c for c in DIGITS if c not in chars),sourceFile=s['sourceFile'],designNotes=rationale,confidence='provisional' if len(chars)>2 else 'low')

def add(id,label,file,url,cap,base,serial,paths,roles=None,style='traditional',boxes=None):
 s=dict(id=id,label=label,sourceId=id+'/manual-smooth-diagram',sourceFile='role-reference/'+file,sourceUrl='https://commons.wikimedia.org/wiki/File:'+url,script='persian',license=LICENSE,credit=CREDIT,rights=CREDIT+' Smooth outline adaptation is shared under CC BY-SA 3.0. Diagram evidence is not manufacturing certification.',capHeight=cap,baseline=base,observedSerial=serial,note='Source-specific numeric study of the inspected illustrative diagram. Observed contours and independently inferred additions are marked per glyph. This is not an authenticated plate-manufacturing typeface.',glyphs=[observed(ch,path) for ch,path in paths.items()],sourceRoleBoxes=boxes or {})
 s['sourceSha256']=hashlib.sha256((D/s['sourceFile']).read_bytes()).hexdigest()
 complete(s,s,'main',style)
 if roles:
  s['roles']={}
  for name,(rcap,rbase,rpaths) in roles.items():
   r=dict(label=name,capHeight=rcap,baseline=rbase,glyphs=[observed(ch,path,name) for ch,path in rpaths.items()]);complete(s,r,name,style);s['roles'][name]=r
 OUT.append(s)

PREVIOUS={
'۳':'M68 15 C72 24 78 25 82 20 L84 15 C87 24 94 26 97 15 L99 15 Q100 33 92 33 Q88 33 85 30 Q82 34 78 34 C80 45 80 57 76 65 L75 65 C74 48 70 35 64 26 Z',
'۴':'M120 16 L116 22 L115 27 C121 39 124 50 124 65 L126 65 C130 55 129 42 129 36 C138 38 143 34 144 25 L143 24 C139 26 135 29 131 27 C132 23 136 19 143 21 L141 17 C135 14 129 18 127 24 Z',
'۵':'M169 15 C183 24 188 39 188 50 C188 65 180 67 173 63 Q166 68 160 63 C153 57 159 38 166 25 L164 25 Z M169 29 C165 38 161 48 163 52 Q166 58 173 52 Q179 59 182 52 C184 44 176 33 169 29 Z'}
LOWER={
'۱':'M39 84 C43 87 45 101 44 108 L42 109 C41 98 40 94 37 90 Z',
'۲':'M59 85 Q64 90 68 87 L70 84 Q72 86 69 91 Q67 94 63 94 C64 101 64 105 62 109 L61 109 C61 102 59 95 56 90 Z'}
for kind,file,url in [('diplomatic','wiki-diplomatic-previous.png','Pelak_siasi.png'),('service','wiki-service-previous.png','Pelak_servis.png')]:
 add('source-previous-'+kind+'-numerals','Earlier '+kind+' numeric diagram · complete inferred repertoire',file,url,50,65,'۳۴۵',PREVIOUS,roles={'prefix':(25,109,LOWER)},boxes={'main':[64,15,189,66],'prefix':[37,84,71,110]})

add('source-previous-temporary-numerals','Earlier temporary numeric diagram · independent small boxes','wiki-temporary-previous.png','Pelak_gozar_movaqat.png',50,105,'۱۲۳۴',{
'۱':'M81 54 C87 61 90 76 91 99 L89 104 L86 104 C85 80 79 67 75 64 Z',
'۲':'M121 55 C127 63 135 66 140 60 L142 55 Q145 55 144 62 C142 73 137 78 131 75 C133 86 133 98 129 105 L127 105 C126 87 122 74 116 65 Z',
'۳':'M161 55 C165 63 172 65 177 57 L178 54 Q183 65 187 60 L189 54 Q192 57 189 65 C186 73 182 73 178 70 Q174 74 169 73 C172 87 170 101 167 105 L166 103 C166 84 161 73 155 65 Z',
'۴':'M212 55 L207 62 L206 67 C212 78 215 91 215 104 L217 104 C221 94 220 80 220 74 C229 75 235 70 236 64 L234 64 Q227 71 222 67 C222 62 228 59 234 61 L232 57 C226 53 220 59 219 63 Z'},
roles={'category':(25,44,{'۵':'M33 19 C40 24 42 31 42 37 Q42 45 36 43 Q32 45 28 42 C24 40 27 32 31 24 L30 24 Z M33 27 Q27 38 30 39 L33 36 Q37 41 39 37 Q39 32 33 27 Z'}),
'prefix':(25,102,{'۹':'M23 77 C28 76 29 82 29 89 C29 95 31 98 33 99 L32 102 C26 103 25 95 25 91 C20 92 17 89 18 85 C18 81 20 78 23 77 Z M23 82 Q19 83 20 85 L25 86 Q26 82 23 82 Z','۲':'M47 78 Q51 83 56 80 L58 77 Q60 80 57 84 Q55 87 52 86 C53 94 53 99 51 102 L49 102 C50 95 47 88 44 84 Z'})},boxes={'main':[75,54,237,105],'category':[26,19,43,44],'prefix':[18,77,59,103]})

add('source-historic-numerals','Historic vehicle geometric diagram numerals','wiki-historic.png','Pelak_melie_tarikhi.png',38,110,'۱۲۳۶۵',{
'۱':'M102 72 C108 78 112 91 112 109 L106 109 C106 93 102 82 98 78 Z',
'۲':'M128 72 C132 80 138 85 141 81 L141 74 L145 72 Q149 84 144 88 Q139 91 134 88 C137 96 137 103 137 110 L130 110 C130 94 128 84 123 78 Z',
'۳':'M156 72 Q160 82 164 82 L164 74 L169 74 L169 81 Q173 86 174 82 L174 75 L177 73 Q181 86 176 88 Q172 92 168 87 L164 89 Q168 100 167 110 L160 110 C160 96 156 86 151 78 Z',
'۶':'M198 72 L201 74 L198 78 C194 76 189 80 187 83 Q184 87 190 86 L205 82 L207 88 Q193 96 185 110 L181 106 Q185 96 191 90 C183 92 180 88 182 82 Q187 72 198 72 Z',
'۵':'M218 73 C229 80 237 89 237 101 Q238 110 227 110 L219 110 Q208 109 211 99 L217 83 L215 80 Z M222 86 Q214 100 217 103 Q225 107 231 103 Q233 99 222 86 Z'},style='geometric',boxes={'main':[98,72,238,110]})

add('source-protocol-numerals','Protocol geometric diagram numerals','wiki-protocol.png','Pelak_melie_tashrifat.png',68,88,'۱۳۹۱',{
'۱':'M294 20 Q304 27 309 57 Q312 70 311 88 L299 88 Q299 54 287 29 Z',
'۳':'M337 20 Q344 34 348 37 Q354 40 354 22 L363 22 L363 33 Q363 40 368 36 L368 24 L376 20 Q381 37 377 43 Q373 50 360 47 Q355 50 350 48 Q355 67 355 88 L344 88 Q344 52 331 30 Z',
'۹':'M405 18 Q419 16 420 33 L422 58 Q423 69 430 79 L422 89 Q411 80 411 56 C391 58 386 51 389 35 Q391 21 405 18 Z M404 29 Q397 30 397 40 Q398 46 411 44 Q412 29 404 29 Z'},style='geometric',boxes={'main':[287,18,474,89]})

# Keep the exact source crop and independently observed upper/lower role metrics.
assert (D/'role-reference/wiki-motorcycle.png').exists(), 'The inspected motorcycle reference must remain alongside the other offline source assets.'
add('source-motorcycle-numerals','Motorcycle geometric diagram · independent allocation and main rows','wiki-motorcycle.png','Pelak_melie_motor.png',54,142,'۵۶۷۸۹',{
'۵':'M30 89 C46 100 56 116 56 130 Q57 142 43 142 L33 142 Q17 142 20 125 Q21 114 30 99 L26 96 Z M35 106 Q24 125 29 131 Q41 136 47 130 Q51 124 35 106 Z',
'۶':'M85 88 L90 90 L88 97 C82 94 74 98 71 104 Q68 108 75 107 L97 101 L99 109 Q82 115 67 143 L62 138 Q65 125 76 115 C64 117 61 111 63 103 Q69 91 79 89 Z',
'۷':'M108 88 Q118 96 123 117 Q127 97 137 87 L141 96 Q128 111 128 142 L118 142 Q118 111 103 97 Z',
'۸':'M159 88 L168 88 C168 111 173 124 183 134 L179 142 Q165 133 164 113 Q161 132 149 142 L145 134 C155 123 159 108 159 88 Z',
'۹':'M204 87 C213 87 214 95 214 109 C214 121 217 130 222 135 L217 143 C210 137 208 128 207 117 C193 118 187 113 189 104 Q190 90 204 87 Z M201 97 Q196 99 197 105 Q197 109 207 108 Q207 96 201 97 Z'},
roles={'allocation':(53,68,{'۱':'M96 15 C105 24 109 44 110 68 L100 68 Q100 37 91 22 Z','۲':'M132 15 Q138 28 146 29 Q152 30 151 18 L156 14 Q161 31 155 36 Q150 40 141 37 Q145 53 145 68 L136 68 Q136 41 126 23 Z','۳':'M171 15 Q179 31 183 27 L183 17 L190 17 L190 25 Q191 31 196 27 L196 18 L202 15 Q206 32 200 35 Q194 38 188 34 Q185 39 180 37 Q185 53 185 68 L176 68 Q176 40 165 23 Z'})},style='geometric',boxes={'main':[20,87,222,143],'allocation':[91,14,204,68]})
# Observed next-origin distances retain source spacing independently of glyph ink.
# Inferred glyphs use the same role's typical source-space inter-ink gap.
ADVANCES={
 'source-previous-diplomatic-numerals':{'main':(15,{'۳':51,'۴':42,'۵':46}),'prefix':(10,{'۱':19,'۲':25})},
 'source-previous-service-numerals':{'main':(15,{'۳':51,'۴':42,'۵':46}),'prefix':(10,{'۱':19,'۲':25})},
 'source-previous-temporary-numerals':{'main':(12,{'۱':41,'۲':39,'۳':51,'۴':43}),'category':(8,{'۵':24}),'prefix':(10,{'۹':26,'۲':25})},
 'source-historic-numerals':{'main':(5,{'۱':25,'۲':28,'۳':30,'۶':30,'۵':32})},
 'source-protocol-numerals':{'main':(15,{'۱':44,'۳':58,'۹':62})},
 'source-motorcycle-numerals':{'main':(5,{'۵':42,'۶':41,'۷':42,'۸':44,'۹':38}),'allocation':(8,{'۱':35,'۲':39,'۳':46})},
}
for s in OUT:
 for role,r in [('main',s)]+list(s.get('roles',{}).items()):
  gap,adv=ADVANCES[s['id']][role]
  for g in r['glyphs']:
   bb=b(g['path']);g['sourceAdvance']=adv.get(g['character'],round(bb[2]-bb[0]+gap,4))
  r['numericCompletion']['advanceMethod']='Observed next-origin distances where available; inferred widths plus role-specific measured inter-ink gap of '+str(gap)+' source pixels. No individual fitting.'
(D/'previous-studies.json').write_text(json.dumps(OUT,ensure_ascii=False,indent=2)+'\n')
print('Built six previous/nonnational numeric source profiles; 11 complete main/role alphabets.')
