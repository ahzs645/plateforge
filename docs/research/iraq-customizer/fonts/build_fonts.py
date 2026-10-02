#!/usr/bin/env python3
"""Build canonical reusable Iraq profiles, without photographs or damaged/occluded glyphs.
Run from anywhere. Dependencies: fontTools, native libharfbuzz (not network required).
Every imported character has one profile scale; only translations vary by glyph.
The generated module has no browser font dependency and does not contain EuroPlate/IRPlate.
"""
from pathlib import Path
from io import BytesIO
import ctypes as C
import ctypes.util
import hashlib
import json
import shutil
from statistics import median
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
SOURCE = REPO / 'docs/research/iraq-complete'
FONTS = SOURCE / 'font-help/fonts'
PROFILES = {}
NORMALIZATION = []


def ntos(value):
    return f'{value:.3f}'.rstrip('0').rstrip('.') if value else '0'


def bounds(path):
    pen = BoundsPen(None)
    parse_path(path, pen)
    return pen.bounds or (0, 0, 0, 0)


def rewrite(path, matrix):
    pen = SVGPathPen(None, ntos=ntos)
    parse_path(path, TransformPen(pen, matrix))
    return pen.getCommands()


def outline(character, path, source_id, provenance='observed', fill_rule='evenodd', advance=None, note=None):
    b = bounds(path)
    result = dict(character=character, path=path, advance=round(advance if advance is not None else b[2] + 4, 4),
                  bounds=dict(x=round(b[0], 4), y=round(b[1], 4), width=round(b[2]-b[0], 4), height=round(b[3]-b[1], 4)),
                  provenance=provenance, sourceId=source_id, fillRule=fill_rule)
    if note: result['note'] = note
    return result


def wordmark(word_id, text, path, source_id, provenance='observed', fill_rule='evenodd', note=None):
    b = bounds(path); scale = 100 / (b[3] - b[1])
    normalized = rewrite(path, (scale, 0, 0, scale, -b[0]*scale, -b[3]*scale))
    return dict(**outline(text, normalized, source_id, provenance, fill_rule, note=note), wordmarkId=word_id, text=text)


def profile(id, label, glyphs, words, rights, url, notes, provenance='observed'):
    PROFILES[id] = dict(id=id, label=label, coverage=''.join(sorted(glyphs)), provenance=provenance,
                        capHeight=100, baseline=0, glyphs=glyphs, wordmarks=words,
                        notes=notes, rights=rights, sourceUrl=url)


def observed_digits(id, items):
    tall = [bounds(path) for char, path, source_id in items if char != '٠']
    # One uniform scale for the entire profile. Individual shapes never width/height-fit.
    cap = median(b[3] - b[1] for b in tall); baseline = median(b[3] for b in tall); scale = 100 / cap
    glyphs = {}
    for char, path, source_id in items:
        b = bounds(path)
        # Full-height digits align on the baseline by translation; zero retains observed
        # vertical position relative to the shared source baseline and its native smaller size.
        base = baseline if char == '٠' else b[3]
        normalized = rewrite(path, (scale, 0, 0, scale, 4 - b[0]*scale, -base*scale))
        glyphs[char] = outline(char, normalized, source_id)
        NORMALIZATION.append(dict(profile=id, character=char, source_id=source_id,
                                  scale=scale, matrix=[scale,0,0,scale,4-b[0]*scale,-base*scale],
                                  source_bounds=b, shared_source_cap_height=cap, shared_source_baseline=baseline,
                                  zero_vertical_position_preserved=char == '٠'))
    return glyphs


legacy = json.loads((SOURCE/'legacy-private/reconstruction-data.json').read_text())
for record in legacy:
    region = record['region'].lower(); id = 'legacy-' + region
    items = [(p['label'],p['d'],record['id']+'/'+p['id']) for p in record['paths'] if p['id'].startswith('serial-')]
    glyphs = observed_digits(id,items)
    words = {}
    for p in record['paths']:
        if p['id'].startswith('serial-'): continue
        word_id = region if p['id'].startswith('province-') else 'iraq'
        text = 'السليمانية' if word_id == 'sulaymaniyah' else 'اربيل' if word_id == 'erbil' else 'العراق'
        words[word_id] = wordmark(word_id,text,p['d'],record['id']+'/'+p['id'],note='Observed whole-word spelling and disconnected marks preserved; canonical label does not alter source contours')
    profile(id,record['region']+' private · observed subset',glyphs,words,
            'Private critical study only; source photo reuse licence unverified. Do not publicly redistribute without rights review.',record['url'],
            ['Source-guided clean Bezier outlines translated to a shared baseline; one common scale per profile.',
             'Small zero retains its smaller source-relative size and position.',
             'Only the observed characters are supplied. No official die master, full alphabet or general Arabic shaping is claimed.'])

anbar = json.loads((SOURCE/'anbar-taxi/paths.json').read_text())['items']
id = 'anbar-taxi'
glyphs = observed_digits(id,[(p['char'],p['d'],'iq-2001-anbar-taxi/'+key) for key,p in anbar.items() if key.startswith('digit-')])
words = {word_id:wordmark(word_id,anbar[key]['text'],anbar[key]['d'],'iq-2001-anbar-taxi/'+key)
         for word_id,key in [('iraq','country-iraq'),('anbar','province-anbar')]}
profile(id,'Anbar taxi · observed subset',glyphs,words,
        'CC BY-SA 3.0 derivative. Source photo: Dickelbers; smooth source-guided reconstruction and canonical normalization, modified 2026.',
        'https://commons.wikimedia.org/wiki/File:Iraq_licenceplate.JPG',
        ['Only ١٢٥٩ are observed. Connected country/province words are indivisible wordmark paths.',
         'Source was plate-wide rectified before the clean Bezier masters; no per-letter squeezing is applied here.'])

truck = json.loads((SOURCE/'utility/specimens.json').read_text())[0]
items = {p['id']:p for p in truck['items']}
selected = [items[key] for key in ['digit-1-third','digit-3','digit-0']]
glyphs = observed_digits('utility-truck',[(p['label'],p['path'],'truck-131098/'+p['id']) for p in selected])
words = {word_id:wordmark(word_id,items[key]['label'],items[key]['path'],'truck-131098/'+key)
         for word_id,key in [('iraq','wordmark-iraq'),('erbil','wordmark-erbil')]}
profile('utility-truck','Erbil commercial · clean observed subset',glyphs,words,
        'CC BY-SA 4.0 derivative. Source photo: Kurdistantolive; smooth source-guided reconstruction and canonical normalization, modified 2026.',
        truck['source_url'],['Only clean complete ٠١٣ are reusable. The second photographed ١ is the canonical master.',
                            'Source ٨٩ contain damage notches and are deliberately unsupported, not silently restored.',
                            'All partly hidden motorcycle digits are excluded. No hardware, lamps, masks or paint damage is included.'])


# HarfBuzz native library is used through its public C API. This avoids a network-only
# Python dependency while preserving OpenType GSUB/GPOS shaping of complete Arabic words.
class HbInfo(C.Structure):
    _fields_ = [('codepoint',C.c_uint32),('mask',C.c_uint32),('cluster',C.c_uint32),('var1',C.c_uint32),('var2',C.c_uint32)]
class HbPosition(C.Structure):
    _fields_ = [('x_advance',C.c_int32),('y_advance',C.c_int32),('x_offset',C.c_int32),('y_offset',C.c_int32),('var',C.c_uint32)]

class HarfBuzz:
    def __init__(self,font):
        self.hb = C.CDLL(ctypes.util.find_library('harfbuzz'))
        signatures = {
            'hb_blob_create':([C.c_void_p,C.c_uint,C.c_int,C.c_void_p,C.c_void_p],C.c_void_p),
            'hb_face_create':([C.c_void_p,C.c_uint],C.c_void_p),
            'hb_font_create':([C.c_void_p],C.c_void_p),
            'hb_ot_font_set_funcs':([C.c_void_p],None),
            'hb_font_set_scale':([C.c_void_p,C.c_int,C.c_int],None),
            'hb_buffer_create':([],C.c_void_p),
            'hb_buffer_add_utf8':([C.c_void_p,C.c_char_p,C.c_int,C.c_uint,C.c_int],None),
            'hb_buffer_guess_segment_properties':([C.c_void_p],None),
            'hb_buffer_set_direction':([C.c_void_p,C.c_int],None),
            'hb_shape':([C.c_void_p,C.c_void_p,C.c_void_p,C.c_uint],None),
            'hb_buffer_get_glyph_infos':([C.c_void_p,C.POINTER(C.c_uint)],C.POINTER(HbInfo)),
            'hb_buffer_get_glyph_positions':([C.c_void_p,C.POINTER(C.c_uint)],C.POINTER(HbPosition)),
            'hb_buffer_destroy':([C.c_void_p],None),
        }
        for name,(args,result) in signatures.items():
            f=getattr(self.hb,name); f.argtypes=args; f.restype=result
        stream=BytesIO();font.save(stream);self.data=C.create_string_buffer(stream.getvalue())
        self.blob=self.hb.hb_blob_create(self.data,len(stream.getvalue()),0,None,None)
        self.face=self.hb.hb_face_create(self.blob,0);self.font=self.hb.hb_font_create(self.face)
        self.hb.hb_ot_font_set_funcs(self.font);self.hb.hb_font_set_scale(self.font,font['head'].unitsPerEm,font['head'].unitsPerEm)
        self.glyph_set=font.getGlyphSet();self.order=font.getGlyphOrder()
    def shape(self,text):
        buffer=self.hb.hb_buffer_create();encoded=text.encode('utf8')
        self.hb.hb_buffer_add_utf8(buffer,encoded,len(encoded),0,len(encoded))
        self.hb.hb_buffer_guess_segment_properties(buffer);self.hb.hb_buffer_set_direction(buffer,5)
        self.hb.hb_shape(self.font,buffer,None,0)
        length=C.c_uint();info=self.hb.hb_buffer_get_glyph_infos(buffer,C.byref(length));positions=self.hb.hb_buffer_get_glyph_positions(buffer,C.byref(length))
        pen=SVGPathPen(self.glyph_set,ntos=ntos);x=y=0;glyph_ids=[]
        for i in range(length.value):
            p=positions[i];name=self.order[info[i].codepoint];glyph_ids.append(info[i].codepoint)
            if info[i].codepoint == 0: raise ValueError(f'Missing shaped glyph for {text}')
            self.glyph_set[name].draw(TransformPen(pen,(1,0,0,-1,x+p.x_offset,-y-p.y_offset)))
            x+=p.x_advance;y+=p.y_advance
        self.hb.hb_buffer_destroy(buffer)
        return pen.getCommands(),glyph_ids


def font_path(font,character,scale):
    name=font.getBestCmap().get(ord(character))
    if name is None: return None
    gs=font.getGlyphSet();pen=SVGPathPen(gs,ntos=ntos)
    gs[name].draw(TransformPen(pen,(scale,0,0,-scale,0,0)))
    return pen.getCommands()

for style in ['Eng','Mtl']:
    filename='GL-Nummernschild-'+style+'.ttf';font=TTFont(FONTS/filename)
    height=bounds(font_path(font,'H',1))[3]-bounds(font_path(font,'H',1))[1];scale=100/height
    glyphs={}
    for character in '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-':
        path=font_path(font,character,scale)
        if not path: continue
        b=bounds(path);path=rewrite(path,(1,0,0,1,4-b[0],0))
        glyphs[character]=outline(character,path,filename,'candidate','nonzero')
    profile('modern-'+style.lower(),'GL-Nummernschild '+style+' · FE candidate',glyphs,{},
            'Gutenberg Labo permissive font licence: unlimited use, modification and redistribution, commercial or noncommercial; provided as is.',
            'https://github.com/Gutenberg-Labo/GL-Nummernschild/tree/c108a385ad67eab0e4e7cc9e1f5c3b9072bdbbd2',
            ['Full licensed glyph coverage is a FE-style candidate, not verified as the Iraqi manufacturer’s die.',
             'Native common cap-height, baseline and aspect ratios preserved. No per-character width fitting.'], 'candidate')

noto_filename='NotoNaskhArabic[wght].ttf'
noto=instantiateVariableFont(TTFont(FONTS/noto_filename),{'wght':700},inplace=False)
hb=HarfBuzz(noto)
# All numeral and alphabet outlines share the digit cap metric and natural baseline.
numeral_height=max(-bounds(font_path(noto,char,1))[1] for char in '١٢٣٤٥٦٧٨٩')
scale=100/numeral_height
noto_glyphs={}
for character in '٠١٢٣٤٥٦٧٨٩ابتثجحخدذرزسشصضطظعغفقكلمنهويىةأإآؤئءپچژگکیەABCDEFGHIJKLMNOPQRSTUVWXYZ-':
    path=font_path(noto,character,scale)
    if not path: continue
    b=bounds(path);path=rewrite(path,(1,0,0,1,4-b[0],0))
    noto_glyphs[character]=outline(character,path,'NotoNaskhArabic[wght].ttf:wght=700','candidate','nonzero')
path,_=hb.shape('هـ');path=rewrite(path,(scale,0,0,scale,0,0));b=bounds(path);path=rewrite(path,(1,0,0,1,4-b[0],0))
noto_glyphs['هـ']=outline('هـ',path,'NotoNaskhArabic[wght].ttf:wght=700:HB-shaped','candidate','nonzero',note='Connected Heh class token, pre-shaped as one cluster')

GOVERNORATES = [
    ('baghdad','Baghdad','بغداد'),('nineveh','Nineveh','نينوى'),('maysan','Maysan','ميسان'),('basra','Basra','البصرة'),
    ('anbar','Anbar','الانبار'),('qadisiyyah','Al-Qadisiyyah','القادسية'),('muthanna','Muthanna','المثنى'),('babil','Babil','بابل'),
    ('karbala','Karbala','كربلاء'),('diyala','Diyala','ديالى'),('sulaymaniyah','Sulaymaniyah','السليمانية'),('erbil','Erbil','اربيل'),
    ('halabja','Halabja','حلبجة'),('dohuk','Dohuk','دهوك'),('kirkuk','Kirkuk','كركوك'),('saladin','Saladin','صلاح الدين'),
    ('dhi-qar','Dhi Qar','ذي قار'),('najaf','Najaf','النجف'),('wasit','Wasit','واسط'),
]
CLASSES = [('private','Private','خصوصي'),('hire','Taxi / bus / for hire','اجرة'),('government','Government','حكومية'),
           ('commercial','Commercial / goods','حمل'),('agricultural','Agricultural','زراعي'),
           ('construction','Construction','إنشائية'),('customs','Customs','كمركية'),('police','Police','شرطة'),
           ('military','Military','عسكرية'),('temporary','Temporary','مؤقتة'),('motorcycle','Motorcycle','دراجة'),
           ('inspection-temporary','Temporary inspection','فحص مؤقت'),
           ('counter-terrorism','Counter Terrorism Service','جهاز مكافحة الارهاب')]
metadata={'iraq':dict(id='iraq',label='Iraq',text='العراق',kind='country')}
for kind,rows in [('governorate',GOVERNORATES),('class',CLASSES)]:
    for id,label,text in rows:
        metadata[id]=dict(id=id,label=label,text=text,kind=kind)
        if kind=='class' and id in ['construction','customs','police','military','temporary','motorcycle']:
            metadata[id]['note']='Descriptive Arabic label; exact historic plate wording has not been verified'
        if id in ['inspection-temporary','counter-terrorism']:
            metadata[id]['note']='Complete joined Noto Naskh candidate label; not an observed or source-matched Iraqi plate wordmark'
fallback_words={};shaping=[]
for id,entry in metadata.items():
    path,glyph_ids=hb.shape(entry['text'])
    fallback_words[id]=wordmark(id,entry['text'],path,'NotoNaskhArabic[wght].ttf:wght=700:HB-shaped','candidate','nonzero',note=entry.get('note'))
    shaping.append(dict(id=id,text=entry['text'],direction='rtl',glyph_ids=glyph_ids,missing_glyphs=0))
profile('naskh-candidate','Noto Naskh Arabic Bold · labelled candidate',noto_glyphs,fallback_words,
        'SIL Open Font License 1.1. Copyright 2022 The Noto Project Authors (https://github.com/notofonts/arabic).',
        'https://github.com/notofonts/arabic',
        ['Full Arabic digits and isolated series letters use the actual licensed font outlines with one shared numeral cap-height scale.',
         'Governorate/country/class words are OpenType-shaped right-to-left at build time and exported as complete vector wordmarks.',
         'A generic Arabic typeface candidate, not a source-matched Iraqi plate die.'], 'candidate')

header='''/**
 * Generated by docs/research/iraq-customizer/fonts/build_fonts.py. Do not hand-edit.
 * Canonical reusable outlines, not source photographs or positioned plate replicas.
 * Licences/provenance: docs/research/iraq-customizer/fonts/README.md and licences/.
 * Legacy private-study restrictions remain in profile metadata. No EuroPlate or IRPlate data.
 */\n'''
constants='export const IRAQ_FONT_PROFILES: Record<IraqFontProfileId, IraqFontProfile> = '+json.dumps(PROFILES,ensure_ascii=False,separators=(',',':'))+';\n\n'
constants+='export const IRAQ_WORDMARKS: Record<string, IraqWordmarkMetadata> = '+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+';\n\n'
constants+="export const IRAQ_NASKH_WORDMARKS: Record<string, IraqWordmarkOutline> = IRAQ_FONT_PROFILES['naskh-candidate'].wordmarks;\n"
runtime=(HERE/'runtime.ts.txt').read_text()
(REPO/'src/templates/iraq-custom-fonts.ts').write_text(header+runtime.replace('/* GENERATED_DATA */',constants))
(HERE/'canonical-font-data.json').write_text(json.dumps(PROFILES,ensure_ascii=False,indent=2)+'\n')
(HERE/'normalization.json').write_text(json.dumps(NORMALIZATION,ensure_ascii=False,indent=2)+'\n')
(HERE/'wordmark-shaping.json').write_text(json.dumps(shaping,ensure_ascii=False,indent=2)+'\n')
licences=HERE/'licences';licences.mkdir(exist_ok=True)
for file in ['GL-LICENSE.txt','Noto-Naskh-Arabic-LICENSE.txt']:
    shutil.copyfile(FONTS/file,licences/file)
inputs=[SOURCE/'legacy-private/reconstruction-data.json',SOURCE/'anbar-taxi/paths.json',SOURCE/'utility/specimens.json']+[FONTS/name for name in ['GL-Nummernschild-Eng.ttf','GL-Nummernschild-Mtl.ttf',noto_filename]]
(HERE/'input-sha256.json').write_text(json.dumps({str(path.relative_to(REPO)):hashlib.sha256(path.read_bytes()).hexdigest() for path in inputs},indent=2)+'\n')
print('Generated',len(PROFILES),'profiles;',sum(len(p['glyphs']) for p in PROFILES.values()),'glyphs;',len(metadata),'complete fallback wordmarks')
