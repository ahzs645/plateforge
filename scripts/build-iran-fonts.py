#!/usr/bin/env python3
"""Build Iran-only portable paths from licensed fonts and bounded source studies.
Requirements: fontTools 4.61.1 and system libharfbuzz. Run from any directory.
No web fetches. Original OFL / GL assets and their licences live alongside docs.
"""
from pathlib import Path
from io import BytesIO
import ctypes as C
import ctypes.util
import hashlib
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/research/iran-customizer/fonts'
SOURCE = DOC / 'source'
DIGITS = '۰۱۲۳۴۵۶۷۸۹'
LETTERS = 'اآأإءؤئبپتثجچحخدذرزژسشصضطظعغفقکكگلمنهویيىةە'

def number(n):
    return f'{n:.4f}'.rstrip('0').rstrip('.') if n else '0'

def bounds(path):
    pen = BoundsPen(None)
    parse_path(path, pen)
    return pen.bounds or (0,0,0,0)

def rewrite(path, transform):
    pen = SVGPathPen(None, ntos=number)
    parse_path(path, TransformPen(pen, transform))
    return pen.getCommands()

def glyph(character, path, advance, source_id, origin='candidate', note=None, fill_rule='nonzero'):
    x0,y0,x1,y1 = bounds(path)
    out = dict(character=character,path=path,advance=round(advance,4),
      bounds=dict(x=round(x0,4),y=round(y0,4),width=round(x1-x0,4),height=round(y1-y0,4)),
      provenance=origin,sourceId=source_id,fillRule=fill_rule)
    if note: out['note']=note
    return out

class Info(C.Structure):
    _fields_=[('codepoint',C.c_uint32),('mask',C.c_uint32),('cluster',C.c_uint32),('var1',C.c_uint32),('var2',C.c_uint32)]
class Position(C.Structure):
    _fields_=[('x_advance',C.c_int32),('y_advance',C.c_int32),('x_offset',C.c_int32),('y_offset',C.c_int32),('var',C.c_uint32)]
class HarfBuzz:
    def __init__(self,font):
        library=ctypes.util.find_library('harfbuzz')
        if not library: raise RuntimeError('Install libharfbuzz: joined text must not fall back to unshaped letters')
        self.hb=C.CDLL(library)
        signatures={
          'hb_blob_create':([C.c_void_p,C.c_uint,C.c_int,C.c_void_p,C.c_void_p],C.c_void_p),
          'hb_face_create':([C.c_void_p,C.c_uint],C.c_void_p),'hb_font_create':([C.c_void_p],C.c_void_p),
          'hb_ot_font_set_funcs':([C.c_void_p],None),'hb_font_set_scale':([C.c_void_p,C.c_int,C.c_int],None),
          'hb_buffer_create':([],C.c_void_p),'hb_buffer_add_utf8':([C.c_void_p,C.c_char_p,C.c_int,C.c_uint,C.c_int],None),
          'hb_buffer_guess_segment_properties':([C.c_void_p],None),'hb_buffer_set_direction':([C.c_void_p,C.c_int],None),
          'hb_language_from_string':([C.c_char_p,C.c_int],C.c_void_p),'hb_buffer_set_language':([C.c_void_p,C.c_void_p],None),
          'hb_shape':([C.c_void_p,C.c_void_p,C.c_void_p,C.c_uint],None),
          'hb_buffer_get_glyph_infos':([C.c_void_p,C.POINTER(C.c_uint)],C.POINTER(Info)),
          'hb_buffer_get_glyph_positions':([C.c_void_p,C.POINTER(C.c_uint)],C.POINTER(Position)),
          'hb_buffer_destroy':([C.c_void_p],None),'hb_font_destroy':([C.c_void_p],None),
          'hb_face_destroy':([C.c_void_p],None),'hb_blob_destroy':([C.c_void_p],None),
          'hb_version_string':([],C.c_char_p),
        }
        for name,(args,result) in signatures.items():
            f=getattr(self.hb,name);f.argtypes=args;f.restype=result
        stream=BytesIO();font.save(stream);self.data=C.create_string_buffer(stream.getvalue())
        self.blob=self.hb.hb_blob_create(self.data,len(stream.getvalue()),0,None,None)
        self.face=self.hb.hb_face_create(self.blob,0);self.font=self.hb.hb_font_create(self.face)
        self.hb.hb_ot_font_set_funcs(self.font);self.hb.hb_font_set_scale(self.font,font['head'].unitsPerEm,font['head'].unitsPerEm)
        self.gs=font.getGlyphSet();self.order=font.getGlyphOrder()
    def shape(self,text):
        b=self.hb.hb_buffer_create();raw=text.encode('utf8');self.hb.hb_buffer_add_utf8(b,raw,len(raw),0,len(raw))
        self.hb.hb_buffer_guess_segment_properties(b);self.hb.hb_buffer_set_direction(b,5)
        self.hb.hb_buffer_set_language(b,self.hb.hb_language_from_string(b'fa',2))
        self.hb.hb_shape(self.font,b,None,0)
        length=C.c_uint();infos=self.hb.hb_buffer_get_glyph_infos(b,C.byref(length));pos=self.hb.hb_buffer_get_glyph_positions(b,C.byref(length))
        pen=SVGPathPen(self.gs,ntos=number);x=y=0;records=[]
        for i in range(length.value):
            p=pos[i];gid=infos[i].codepoint
            if gid==0: raise RuntimeError(f'Missing shaped glyph in {text!r}')
            self.gs[self.order[gid]].draw(TransformPen(pen,(1,0,0,-1,x+p.x_offset,-y-p.y_offset)))
            records.append(dict(glyphId=gid,cluster=infos[i].cluster,xAdvance=p.x_advance,xOffset=p.x_offset,yOffset=p.y_offset))
            x+=p.x_advance;y+=p.y_advance
        self.hb.hb_buffer_destroy(b)
        return pen.getCommands(),x,records
    def close(self):
        for kind in ['font','face','blob']: getattr(self.hb,'hb_'+kind+'_destroy')(getattr(self,kind))

def font_path(font,ch,scale):
    name=font.getBestCmap().get(ord(ch))
    if name is None: raise RuntimeError(f'Missing Unicode character {ch!r}')
    gs=font.getGlyphSet();pen=SVGPathPen(gs,ntos=number)
    gs[name].draw(TransformPen(pen,(scale,0,0,-scale,0,0)))
    return pen.getCommands(),font['hmtx'][name][0]*scale

CITIES=[('tehran','Tehran','تهران'),('shiraz','Shiraz','شیراز'),('mashhad','Mashhad','مشهد'),('isfahan','Isfahan','اصفهان'),
 ('tabriz','Tabriz','تبریز'),('karaj','Karaj','کرج'),('ahvaz','Ahvaz','اهواز'),('qom','Qom','قم'),('rasht','Rasht','رشت'),
 ('kerman','Kerman','کرمان'),('kermanshah','Kermanshah','کرمانشاه'),('urmia','Urmia','ارومیه'),('yazd','Yazd','یزد'),
 ('ardabil','Ardabil','اردبیل'),('bandar-abbas','Bandar Abbas','بندرعباس'),('arak','Arak','اراک'),('hamadan','Hamadan','همدان'),
 ('zanjan','Zanjan','زنجان'),('sanandaj','Sanandaj','سنندج'),('zahedan','Zahedan','زاهدان'),('gorgan','Gorgan','گرگان'),
 ('sari','Sari','ساری'),('khorramabad','Khorramabad','خرم‌آباد'),('bojnurd','Bojnurd','بجنورد'),('birjand','Birjand','بیرجند'),
 ('bushehr','Bushehr','بوشهر'),('ilam','Ilam','ایلام'),('shahrekord','Shahrekord','شهرکرد'),('yasuj','Yasuj','یاسوج'),
 ('semnan','Semnan','سمنان'),('qazvin','Qazvin','قزوین'),('abadan','Abadan','آبادان'),('khorramshahr','Khorramshahr','خرمشهر')]
CLASSES=[('alef','Alef (government series)','الف'),('protocol','Protocol / ceremonial','تشریفات'),('historic','Historic vehicle','تاریخی'),
 ('temporary','Temporary passage','گذر موقت'),('private','Private','شخصی'),('government','Government','دولتی'),('taxi','Taxi','تاکسی'),
 ('public','Public transport','عمومی'),('police','Police','پلیس'),('agricultural','Agricultural','کشاورزی'),('military','Military','نظامی'),
 ('diplomatic','Diplomatic','سیاسی'),('political','Political / diplomatic title','سیاسی'),('consular','Consular','کنسولی'),('us-topographical','U.S. topographical team (observed geographical legend)','جغرافیایی'),('service','Service','سرویس'),('test','Test','آزمایش'),('international','International','بین‌المللی')]
ZONES=[('free-zone','Free trade zone','منطقه آزاد'),('kish','Kish','کیش'),('qeshm','Qeshm','قشم'),('anzali','Anzali','انزلی'),
 ('aras','Aras','ارس'),('arvand','Arvand','اروند'),('chabahar','Chabahar','چابهار'),('maku','Maku','ماکو'),
 ('imam-khomeini','Imam Khomeini Airport City','شهر فرودگاهی امام خمینی')]
WORDS={}
for kind,items in [('country',[('iran','Iran (Persian yeh)','ایران'),('iran-arabic-yeh','Iran (Arabic yeh spelling)','ايران')]),('city',CITIES),('class',CLASSES),('free-zone',ZONES)]:
    for id,label,text in items: WORDS[id]=dict(id=id,label=label,text=text,kind=kind)
WORDS['us-topographical']['note']='Observed WLP U.S. topographical training-team specimen reads جغرافیایی; the complete label is a licensed candidate, not a traced historic die.'
for id,_,text in ZONES[1:]:
    WORDS['free-zone-'+id]=dict(id='free-zone-'+id,label='Free zone: '+WORDS[id]['label'],text='منطقه آزاد '+text,kind='free-zone')

CONFIGS=[
 dict(id='parastoo-candidate',name='Parastoo Bold',filename='Parastoo-Bold.ttf',url='https://github.com/rastikerdar/parastoo-font',version='2.0.1',license='SIL OFL 1.1',copyright='Copyright 2015 Saber Rastikerdar',script='persian'),
 dict(id='sahel-candidate',name='Sahel Bold',filename='Sahel-Bold.ttf',url='https://github.com/rastikerdar/sahel-font',version='3.4.0',license='SIL OFL 1.1',copyright='Copyright 2016 Saber Rastikerdar',script='persian'),
 dict(id='naskh-candidate',name='Noto Naskh Arabic Bold',filename='NotoNaskhArabic[wght].ttf',url='https://github.com/notofonts/arabic',version='wght=700',license='SIL OFL 1.1',copyright='Copyright 2022 The Noto Project Authors',script='persian'),
 dict(id='latin-candidate',name='GL-Nummernschild Eng',filename='GL-Nummernschild-Eng.ttf',url='https://github.com/Gutenberg-Labo/GL-Nummernschild/tree/c108a385ad67eab0e4e7cc9e1f5c3b9072bdbbd2',version='upstream c108a385',license='Gutenberg Labo permissive font licence',copyright='Gutenberg Labo',script='latin'),
 dict(id='latin-sans-candidate',name='Liberation Sans Regular',filename='LiberationSans-Regular.ttf',url='https://github.com/liberationfonts/liberation-fonts',version='2.1.5',license='SIL OFL 1.1',copyright='Liberation Fonts contributors; see Liberation-COPYRIGHT.txt',script='latin'),
 dict(id='latin-sans-bold-candidate',name='Liberation Sans Bold',filename='LiberationSans-Bold.ttf',url='https://github.com/liberationfonts/liberation-fonts',version='2.1.5',license='SIL OFL 1.1',copyright='Liberation Fonts contributors; see Liberation-COPYRIGHT.txt',script='latin'),
 dict(id='latin-freezone-candidate',name='Noto Sans Regular',filename='NotoSans-Regular.ttf',url='https://github.com/notofonts/noto-fonts',version='2.004',license='SIL OFL 1.1',copyright='Copyright 2015 Google LLC',script='latin'),
]

profiles={};audit={'formatVersion':1,'generatedBy':'scripts/build-iran-fonts.py','fonts':[],'shaping':[],'historical':[]}
for config in CONFIGS:
    file=SOURCE/config['filename']
    expected={'NotoSans-Regular.ttf':'89c3c497f618fdaa0b2d1e98fef93582f28c71debd2c4a8cdf41f190ced2909d','LiberationSans-Regular.ttf':'bade59d822652f76e6941aa87b40a87c13d1cc70db98ededb5011127efafd1d3','LiberationSans-Bold.ttf':'1b5f2da6f4cadce4c05b9ecebe3a6fcd374eb95ae443605e799f4c3287978939','Parastoo-Bold.ttf':'25f5eb2039739759a1666ce1a7a1b5dd3f08e6be5b9114f453b52e35aa08b104','Sahel-Bold.ttf':'d714fa224c92bc51d0e477337ef69e8818c2eff8f41e6698de35639e3857ae7b','NotoNaskhArabic[wght].ttf':'67b5a525a661b607971fbd3f96a81b89d3a768e74534fca84f18ac97e6fab72f','GL-Nummernschild-Eng.ttf':'14f88dc5e2443b7b4c12f4d2d5dba350ef8606c356d8b3107bc0083c744ad3bb'}
    if hashlib.sha256(file.read_bytes()).hexdigest()!=expected[file.name]: raise RuntimeError(f'Source hash mismatch: {file.name}; review provenance before rebuilding')
    font=TTFont(file)
    if 'fvar' in font: font=instantiateVariableFont(font,{'wght':700},inplace=False)
    source_id=config['filename']+':'+config['version'];latin=config['script']=='latin'
    cap=max(-bounds(font_path(font,c,1)[0])[1] for c in ('0123456789' if latin else DIGITS[1:]))
    scale=100/cap;glyphs={};words={}
    for ch in ('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-./&()' if latin else DIGITS+LETTERS+'-./'):
        path,advance=font_path(font,ch,scale)
        glyphs[ch]=glyph(ch,path,advance,source_id)
    if not latin:
        hb=HarfBuzz(font)
        raw,advance,record=hb.shape('هـ');glyphs['هـ']=glyph('هـ',rewrite(raw,(scale,0,0,scale,0,0)),advance*scale,source_id+':HB-fa',note='Connected plate heh: logical U+0647 U+0640 shaped together, not isolated ه or a PUA substitute')
        audit['shaping'].append(dict(profile=config['id'],id='connected-heh',text='هـ',glyphs=record))
        for id,word in WORDS.items():
            raw,advance,record=hb.shape(word['text']);x0,y0,x1,y1=bounds(raw);s=100/(y1-y0)
            path=rewrite(raw,(s,0,0,s,-x0*s,-y1*s))
            words[id]=dict(**glyph(word['text'],path,(x1-x0)*s+4,source_id+':HB-fa',note='Complete pre-shaped Persian candidate wordmark; not an authenticated plate die'),wordmarkId=id,text=word['text'])
            audit['shaping'].append(dict(profile=config['id'],id=id,text=word['text'],glyphs=record,rawAdvance=advance,inkTransform=[s,0,0,s,-x0*s,-y1*s]))
        audit['harfbuzzVersion']=hb.hb.hb_version_string().decode();hb.close()
    profiles[config['id']]=dict(id=config['id'],label=config['name']+' · licensed candidate',coverage=''.join(glyphs),provenance='candidate',
      capHeight=100,baseline=0,glyphs=glyphs,wordmarks=words,script=config['script'],license=config['license'],rights=config['license']+'. '+config['copyright']+'. Original licensed font supplied; no official plate die certification.',
      sourceUrl=config['url'],sourceIds=[source_id],notes=[
        'One font-wide numeral scale and original OpenType advances/baseline; no per-glyph height fitting or width distortion.',
        'Actual Persian Unicode U+06F0–U+06F9 digits; Arabic-Indic and ASCII digit input are explicitly normalized to Persian.' if not latin else 'Latin A–Z, 0–9 and separators. Licensed candidate; not an authenticated historical Iran die.',
        'Joined city, country and class words are built with HarfBuzz (RTL, Arabic script, fa language); no runtime font or PUA mapping.' if not latin else 'Persian words require the separate explicitly selected Persian candidate profile.'])
    audit['fonts'].append(dict(**config,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),unitsPerEm=font['head'].unitsPerEm,numeralCapHeight=cap,scale=scale,coverage=list(glyphs)))

# Manually drawn smooth source-guided subsets in each photograph's shared pixel plane.
# Observed contours are preserved. Missing numerals have explicit source-style
# inferred provenance; no threshold contours or licensed candidate substitution.
historical_studies=json.loads((DOC/'historical-studies.json').read_text())
studies=list(historical_studies)
for optional in ['city-studies.json','role-studies.json','parallel-studies.json','bilingual-studies.json','modern-studies.json','freezone-studies.json','previous-studies.json','zone-studies.json']:
    if (DOC/optional).exists(): studies.extend(json.loads((DOC/optional).read_text()))

def source_glyphs(items, cap, baseline, source_id, note):
    scale=100/cap;result={}
    for item in items:
        if item['character'] in result: raise ValueError(f'Duplicate glyph {item["character"]!r} in {source_id}')
        p=item['path'];x0,y0,x1,y1=bounds(p)
        p=rewrite(p,(scale,0,0,scale,4-x0*scale,-baseline*scale))
        origin=item.get('provenance','observed')
        if origin not in ['observed','inferred']: raise ValueError(f'Invalid study provenance: {origin}')
        if origin=='inferred':
            inference=item.get('inference')
            if not isinstance(inference,dict) or not all(inference.get(k) for k in ['method','basisCharacters','designNotes']):
                raise ValueError(f'Inferred glyph requires structured method/basisCharacters/designNotes: {source_id}/{item["character"]}')
        advance=item['sourceAdvance']*scale if 'sourceAdvance' in item else (x1-x0)*scale+8
        result[item['character']]=glyph(item['character'],p,advance,item.get('sourceId',source_id),origin=origin,note=item.get('note',note),fill_rule=item.get('fillRule','evenodd'))
        if item.get('inference'): result[item['character']]['inference']=item['inference']
    return result

for study in studies:
    if study['id'] in profiles: raise ValueError(f'Duplicate source profile {study["id"]}')
    s=100/study.get('capHeight',100)
    glyphs=source_glyphs(study.get('glyphs',[]),study.get('capHeight',100),study.get('baseline',0),study['sourceId'],study['note'])
    words={}
    for item in study.get('wordmarks',[]):
        if item['id'] in words: raise ValueError(f'Duplicate wordmark {item["id"]}')
        raw=item['path'];x0,y0,x1,y1=bounds(raw);ws=100/(y1-y0)
        path=rewrite(raw,(ws,0,0,ws,-x0*ws,-y1*ws))
        words[item['id']]=dict(**glyph(item['text'],path,(x1-x0)*ws+4,item.get('sourceId',study['sourceId']),origin=item.get('provenance','observed'),note=item.get('note',study['note']),fill_rule=item.get('fillRule','evenodd')),wordmarkId=item['id'],text=item['text'],**({'role':item['role']} if 'role' in item else {}))
        if item['id'] not in WORDS: WORDS[item['id']]=dict(id=item['id'],label=item.get('label',item['id']),text=item['text'],kind=item.get('kind','city'),note=item.get('note',study['note']))
    roles={}
    for role,record in study.get('roles',{}).items():
        roles[role]=dict(label=record.get('label',role),capHeight=100,baseline=0,glyphs=source_glyphs(record['glyphs'],record['capHeight'],record['baseline'],study['sourceId']+'/'+role,study['note']))
    profiles[study['id']]=dict(id=study['id'],label=study['label'],coverage=''.join(glyphs),provenance=study.get('provenance','observed'),capHeight=100,baseline=0,
      glyphs=glyphs,wordmarks=words,roles=roles,script=study.get('script','persian'),license=study.get('license','Source-image reuse rights unverified'),rights=study.get('rights','Private critical study only. Source photograph reuse rights are unspecified; no public redistribution clearance.'),
      sourceUrl=study['sourceUrl'],sourceIds=[study['sourceId']],notes=[study['note'],'Source-observed contours retain observed provenance. Missing numeric forms are explicitly labelled inferred original source-style reconstructions; these are not authenticated historical die shapes. Contextual role alphabets remain independent.','Inferred glyphs do not use licensed candidate outlines. Fallback, if explicitly enabled for other missing content, is visibly labelled and uses licensed candidate lettering.'])
    audit['historical'].append(dict(id=study['id'],sourceId=study['sourceId'],sourceUrl=study['sourceUrl'],coverage=list(glyphs),wordmarks=list(words),roles={role:list(data['glyphs']) for role,data in roles.items()},scale=s,sourceBaseline=study.get('baseline',0),note=study['note'],glyphs=[dict(character=i['character'],provenance=i.get('provenance','observed'),inference=i.get('inference'),sourceBox=i.get('sourceBox'),occurrence=i.get('occurrence'),sourceBounds=bounds(i['path']),transform=[s,0,0,s,4-bounds(i['path'])[0]*s,-study.get('baseline',0)*s]) for i in study.get('glyphs',[])]))

# Preserve original role metrics and every whole-word normalization for auditing.
for study,record in zip(studies,audit['historical']):
    source_path=DOC/study['sourceFile']
    record['sourceImageSha256']=hashlib.sha256(source_path.read_bytes()).hexdigest()
    record['numericCompletion']=study.get('numericCompletion')
    record['roleNumericCompletion']={role:data['numericCompletion'] for role,data in study.get('roles',{}).items() if 'numericCompletion' in data}
    record['roleMetrics']={}
    for role,data in study.get('roles',{}).items():
        rs=100/data['capHeight']
        record['roleMetrics'][role]=dict(sourceCapHeight=data['capHeight'],sourceBaseline=data['baseline'],scale=rs,glyphs=[dict(character=g['character'],provenance=g.get('provenance','observed'),inference=g.get('inference'),sourceId=g.get('sourceId'),sourceBox=g.get('sourceBox'),sourceBounds=bounds(g['path']),transform=[rs,0,0,rs,4-bounds(g['path'])[0]*rs,-data['baseline']*rs]) for g in data['glyphs']])
    record['wordmarkMetrics']=[]
    for word in study.get('wordmarks',[]):
        x0,y0,x1,y1=bounds(word['path']);ws=100/(y1-y0)
        record['wordmarkMetrics'].append(dict(id=word['id'],text=word['text'],sourceId=word.get('sourceId'),sourceBox=word.get('sourceBox'),sourceBounds=[x0,y0,x1,y1],transform=[ws,0,0,ws,-x0*ws,-y1*ws]))

# Complete Latin legend alternatives remain Latin in every Latin candidate profile.
# No Arabic-script alias is shared with a Latin country/mission label.
for p in profiles.values():
    if p['provenance']!='candidate' or p['script']!='latin': continue
    for wid,meta in WORDS.items():
        if not meta['text'].isascii() or not any(c.isalpha() for c in meta['text']): continue
        paths=[];pen=0;valid=True
        for ch in meta['text'].upper():
            if ch==' ': pen+=34;continue
            g=p['glyphs'].get(ch)
            if not g: valid=False;break
            paths.append(rewrite(g['path'],(1,0,0,1,pen,0)));pen+=g['advance']
        if not valid: continue
        raw=''.join(paths);x0,y0,x1,y1=bounds(raw);s=100/(y1-y0)
        path=rewrite(raw,(s,0,0,s,-x0*s,-y1*s))
        p['wordmarks'][wid]=dict(**glyph(meta['text'],path,(x1-x0)*s+4,p['sourceIds'][0]+':LTR-word',note='Complete Latin legend composed from licensed native glyph outlines; not a source-observed plate wordmark'),wordmarkId=wid,text=meta['text'])

output='/** Generated by scripts/build-iran-fonts.py. Do not hand-edit. Licences and audit: docs/research/iran-customizer/fonts. */\n'
output+='import type { IranFontProfile, IranFontProfileId, IranWordmarkMetadata } from "./iran-custom-fonts";\n'
output+='export const IRAN_GENERATED_PROFILES: Record<IranFontProfileId, IranFontProfile> = '+json.dumps(profiles,ensure_ascii=False,separators=(',',':'))+';\n'
output+='export const IRAN_GENERATED_WORDMARKS: Record<string, IranWordmarkMetadata> = '+json.dumps(WORDS,ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT/'src/templates/iran-custom-font-data.ts').write_text(output)
(DOC/'build-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
(DOC/'profile-summary.json').write_text(json.dumps([{k:v for k,v in p.items() if k not in ['glyphs','wordmarks']}|{'wordmarkIds':list(p['wordmarks'])} for p in profiles.values()],ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(profiles)} profiles; {sum(len(p["wordmarks"]) for p in profiles.values())} joined outlines; {sum(len(p["glyphs"]) for p in profiles.values())} main glyphs; {sum(len(r["glyphs"]) for p in profiles.values() for r in p.get("roles",{}).values())} role glyphs')

# A compact generated index exposes every independent alphabet without path dumps.
index=['# Iran profile coverage index','','Generated by `scripts/build-iran-fonts.py`; source-specific roles are separate alphabets.','', '| Profile | Main glyph coverage | Role glyph coverage | Complete wordmarks |', '|---|---|---|---|']
for p in profiles.values():
    role_text='; '.join(role+': '+''.join(data['glyphs']) for role,data in p.get('roles',{}).items()) or '—'
    index.append('| '+p['id']+' | '+(p['coverage'] or '—')+' | '+role_text+' | '+(', '.join(p['wordmarks']) or '—')+' |')
(DOC/'coverage-index.md').write_text('\n'.join(index)+'\n')

# Human-review boards: the content under test is paths, not system-font Arabic.
# English annotations are ordinary SVG text. These are review artefacts, not plates.
from html import escape
import base64

def svg_start(width,height,title):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {width} {height}"><title>{escape(title)}</title><rect width="100%" height="100%" fill="#f6f4ee"/><g fill="#182b35" font-family="sans-serif">']
def label(out,text,x,y,size=16): out.append(f'<text x="{x}" y="{y}" font-size="{size}">{escape(text)}</text>')
def paint(out,g,x,baseline,size):
    out.append(f'<g transform="translate({number(x)} {number(baseline)}) scale({number(size/100)})"><path d="{g["path"]}" fill-rule="{g["fillRule"]}"/></g>')
def run(out,p,text,x,baseline,size,tracking=5):
    import re
    for ch in re.findall('هـ|.',text):
        if ch==' ': x+=size*.34;continue
        g=p['glyphs'][ch];paint(out,g,x,baseline,size);x+=g['advance']*size/100+tracking
    return x
board=svg_start(1200,2300,'Iran licensed candidate typography coverage')
label(board,'Iran: complete candidates and labelled source-style numeral reconstructions',35,42,25)
label(board,'Same numeral cap-height and native advances. All Arabic-script content below is portable path artwork.',35,71)
y=125
for id in ['parastoo-candidate','sahel-candidate','naskh-candidate']:
    p=profiles[id];label(board,p['label'],35,y,21);y+=85
    run(board,p,DIGITS,35,y,65,10);label(board,'Persian U+06F0–U+06F9',855,y-25,14);y+=85
    run(board,p,'ب پ ت ث ج د س ص ط ع ق ک گ ه هـ ی',35,y,38,5);y+=60
    for i,wid in enumerate(['iran','tehran','shiraz','mashhad','isfahan','tabriz']):
        w=p['wordmarks'][wid];size=min(36,165/w['bounds']['width']*100);paint(board,w,35+i*190,y,size);label(board,WORDS[wid]['label'],35+i*190,y+25,12)
    y+=80
for latin_id in ['latin-candidate','latin-sans-candidate','latin-sans-bold-candidate','latin-freezone-candidate']:
    p=profiles[latin_id];label(board,p['label'],35,y,21);y+=76;run(board,p,'UNIIMOG TEH THR D S 0123456789',35,y,44,2);y+=80
label(board,'Historical numerals: observed contours plus labelled inferred additions',35,y,21);y+=90
for index,id in enumerate([study['id'] for study in historical_studies]):
    x=35+(index%2)*580;yy=y+(index//2)*120;p=profiles[id]
    label(board,p['label'],x,yy-60,16);run(board,p,p['coverage'],x,yy,52,5)
    label(board,'Per-glyph provenance distinguishes observed and inferred',x,yy+25,13)
label(board,'No official die claim. Historical source-photo rights are unverified: private critical study only.',35,y+450,16)
board.append('</g></svg>');(DOC/'font-specimen.svg').write_text(''.join(board))

candidate_words={wid:WORDS[wid] for wid in profiles['parastoo-candidate']['wordmarks']}
rows=(len(candidate_words)+3)//4;board=svg_start(1200,110+rows*112,'Iran complete joined wordmark catalogue')
label(board,'Iran: complete joined labels / Parastoo Bold candidate',30,39,25)
label(board,'HarfBuzz RTL shaping, Persian language; one proportional path per word. Labels are selectable, not certified plate dies.',30,68,14)
for i,(id,w) in enumerate(candidate_words.items()):
    x=30+(i%4)*295;y=128+(i//4)*112;g=profiles['parastoo-candidate']['wordmarks'][id]
    size=min(44,265/g['bounds']['width']*100);paint(board,g,x,y,size)

    short_label='U.S. topographical team' if id=='us-topographical' else w['label']
    label(board,short_label,x,y+25,12);label(board,id,x,y+44,11)
board.append('</g></svg>');(DOC/'wordmark-catalogue.svg').write_text(''.join(board))

board=svg_start(1200,1050,'Iran candidate paths beside inspected photograph references')
label(board,'Photo references and licensed candidate lettering',35,40,25)
label(board,'Native outline proportions; no reference-position fitting, distortion, similarity score or authenticity claim.',35,69,15)
for name,y,w,h in [('iran-flat-reference.png',95,1040,220),('iran-heh-reference.png',355,1040,220)]:
    b64=base64.b64encode((ROOT/'public/typography-review'/name).read_bytes()).decode()
    board.append(f'<image x="35" y="{y}" width="{w}" height="{h}" href="data:image/png;base64,{b64}"/>')
label(board,'Above: Dickelbers, Iran_licenceplate_02.JPG / MohsenKalali, Iranianplate.jpg; CC BY-SA 4.0; cropped and rectified.',35,604,12)
y=680
for id in ['parastoo-candidate','sahel-candidate','naskh-candidate']:
    p=profiles[id];label(board,p['label'].replace(' · licensed candidate',''),35,y-20,15);run(board,p,'۲۴ ع ۴۱۷',335,y,62,5);run(board,p,'۸۸ هـ ۸۶۳',805,y,48,3);y+=115
label(board,'Source: commons.wikimedia.org/wiki/File:Iran_licenceplate_02.JPG and File:Iranianplate.jpg',35,1025,13)
board.append('</g></svg>');(DOC/'source-comparison.svg').write_text(''.join(board))

# Seven bounded source/candidate/overlay sheets. Every pane uses the SAME 3× pixel
# scale, without per-character fitting. These private critical-study sheets contain
# attributed source crops; the reusable glyph library contains clean paths only.
from PIL import Image
for study in historical_studies:
    source_file=DOC/study['sourceFile'];im=Image.open(source_file)
    board_items=[dict(g,role='serial') for g in study.get('glyphs',[]) if g.get('provenance','observed')=='observed']
    for role,record in study.get('roles',{}).items(): board_items.extend(dict(g,role=role) for g in record['glyphs'] if g.get('provenance','observed')=='observed')
    h=135+sum(max(100,(g['sourceBox'][3]-g['sourceBox'][1])*3+48) for g in board_items)
    out=svg_start(1100,h,study['label']+' source comparison')
    label(out,study['label'],30,35,23)
    label(out,'Observed contours only; inferred additions are shown separately on the numeric-repertoire boards. Unmodified 3× scale.',30,62,14)
    label(out,study['credit']+' · photograph rights unspecified · private critical study only',30,85,13)
    label(out,'Source crop',30,113,14);label(out,'Clean candidate',380,113,14);label(out,'Overlay (red)',730,113,14)
    y=135
    for i,g in enumerate(board_items):
        x0,y0,x1,y1=g['sourceBox'];w=(x1-x0)*3;hh=(y1-y0)*3
        cropped=BytesIO();im.crop((x0,y0,x1,y1)).save(cropped,format='PNG')
        crop_data='data:image/png;base64,'+base64.b64encode(cropped.getvalue()).decode()
        for col,x in enumerate([30,380,730]):
            out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" fill="white"/>')
            if col in [0,2]:out.append(f'<image href="{crop_data}" x="{x}" y="{y}" width="{w}" height="{hh}"/>')
            if col in [1,2]:out.append(f'<g transform="translate({x-x0*3} {y-y0*3}) scale(3)"><path d="{g["path"]}" fill="'+('#bb3636' if col==2 else '#141414')+'" fill-rule="evenodd" opacity="'+('0.64' if col==2 else '1')+'"/></g>')
        label(out,'U+'+format(ord(g['character']),'04X')+' · '+g['role']+' · '+g['occurrence']+' · crop '+str(g['sourceBox']),30,y+hh+20,12)
        y+=max(100,hh+48)
    out.append('</g></svg>');(DOC/(study['id']+'-comparison.svg')).write_text(''.join(out))

# Keep complete numeric audit/boards and unchanged-observation checks in the same
# offline build so downstream integration cannot ship stale subset coverage.
import subprocess, sys
subprocess.run([sys.executable,str(DOC/'check-observed-paths.py')],check=True)
subprocess.run([sys.executable,str(DOC/'build-numeric-review.py')],check=True)
