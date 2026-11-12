#!/usr/bin/env python3
"""Rebuild measured, explicitly approximate Pinyon-derived card script studies.
No raster tracing is used. Original glyph curves are transformed in an unslanted
coordinate system; six observed digits, C and V are hand-drawn cubic studies.
"""
from pathlib import Path
import argparse, base64, copy, ctypes, ctypes.util, hashlib, io, json, tempfile
from array import array
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphCoordinates
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

DEFAULT_MODEL=Path(__file__).resolve().parents[2]/'public/stationery/grace-mccarthy/model.json'
EXPECTED_BASE_SHA='4aab130a6ed27f8b8117738c84a5602edf9300cdcc0651a9a65bf96f451ac29a'
SOURCE_SHA='daeafbf0d0d5c76e3f176388a482da3598c6d59d35be604fba12019807763847'

# All coordinates below are original cubic constructions in font units,
# with y increasing upward. They are observations, not historical masters.
DIGITS={
 'zero':(620,[
 ('M220 0 C75 0 0 180 0 440 C0 735 90 1000 230 1000 C370 1000 410 800 410 560 C410 265 350 0 220 0 Z',False),
 ('M190 65 C275 65 325 305 325 555 C325 795 300 940 245 940 C160 940 85 700 85 445 C85 190 135 65 190 65 Z',True)]),
 'one':(420,[('M0 0 L150 0 L150 1000 L90 1000 C65 850 0 770 -90 700 L-60 640 L25 710 L15 100 Z',False)]),
 'three':(620,[
 ('M125 0 C-20 0 -55 60 -45 170 C-35 250 55 260 82 200 C100 160 80 115 50 100 C90 35 200 95 245 215 C290 340 285 435 170 470 C130 490 120 505 140 535 C180 575 260 595 300 720 C335 840 325 945 245 955 C180 960 125 890 110 780 C100 715 100 680 80 680 C0 680 0 820 35 900 C90 1035 280 1070 360 970 C430 870 400 720 325 620 C300 585 270 560 230 540 C310 490 340 400 320 285 C285 85 210 0 125 0 Z',False)]),
 'six':(620,[
 ('M260 1000 C375 1000 410 940 390 865 C380 825 310 820 300 860 C290 890 315 920 310 940 C260 960 205 925 165 855 C105 760 85 595 80 510 C145 600 250 630 315 570 C410 495 400 330 330 175 C250 5 150 -40 60 0 C-35 50 -40 170 -10 350 C20 710 115 1000 260 1000 Z',False),
 ('M155 65 C210 60 270 180 290 320 C310 440 270 535 220 535 C165 535 105 390 95 300 C65 150 70 95 155 65 Z',True)]),
 'seven':(560,[
 ('M-5 910 C45 935 55 1030 80 1040 C110 1020 155 975 190 970 C225 960 260 985 290 1005 L345 1015 C280 895 260 800 245 675 C210 400 160 110 110 -185 C100 -250 80 -295 40 -315 L-45 -310 C5 -210 45 -55 70 120 C115 410 160 700 230 925 C155 880 110 885 65 920 C55 885 25 860 -5 855 Z',False)]),
 'eight':(620,[
 ('M200 -5 C0 -5 -55 200 25 370 C70 480 125 530 155 570 C50 800 40 1000 240 1000 C430 1000 415 760 295 635 C260 600 235 575 225 550 C420 335 410 -5 200 -5 Z',False),
 ('M215 620 C300 720 335 875 280 935 C210 1010 145 905 150 825 C150 730 180 670 215 620 Z',True),
 ('M135 450 C65 355 55 220 85 125 C110 35 195 45 245 115 C315 215 280 345 180 500 C165 485 150 465 135 450 Z',True)]),
}
V_CONTOURS=[
 ('M0 80 C230 230 430 600 620 1040 C720 1280 835 1450 900 1500 C930 1525 950 1510 925 1475 C750 1200 600 770 455 460 C430 400 395 340 360 280 C530 430 700 680 910 1000 C1160 1360 1400 1530 1540 1560 L1545 1530 C1380 1465 1210 1320 1020 1030 C715 575 365 125 50 0 Z',False),
 ('M-20 1180 C170 1380 425 1510 510 1360 C550 1260 400 1170 440 1100 C480 1060 620 1140 680 1200 L700 1160 C600 1030 390 960 340 1060 C290 1140 420 1235 400 1290 C375 1360 150 1280 10 1140 Z',False)
]
C_CONTOURS=[
 ('M-20 700 C150 720 270 750 390 795 C610 1160 1020 1510 1260 1510 C1440 1510 1470 1380 1340 1240 C1160 1050 770 850 480 775 C330 535 190 230 340 90 C500 -65 850 60 1110 285 C1280 440 1290 610 1150 660 C930 740 650 540 520 350 L490 370 C630 610 970 840 1180 730 C1370 630 1310 390 1135 235 C850 -30 450 -135 285 45 C125 220 250 550 360 740 C230 705 100 665 -20 665 Z',False),
 ('M480 850 C760 970 1100 1135 1280 1305 C1390 1410 1360 1465 1260 1455 C1030 1440 695 1130 480 850 Z',True)
]

CONFIGS=[
 {'id':'plateforgecardscriptdisplaystudy','family':'PlateForge Card Script Display Study','styleName':'Display study','lower_x':.92,'lower_y':.74,'descender_y':1.15,'cap_x':1.0,'m_x':.85,'m_advance_x':.96,'space_scale':.52,'embolden_units':20,'role':'name'},
 {'id':'plateforgecardscriptcompactstudy','family':'PlateForge Card Script Compact Study','styleName':'Compact study','lower_x':.62,'lower_y':.91,'descender_y':1.12,'cap_x':.90,'m_x':.84,'space_scale':.50,'embolden_units':36,'role':'titles'},
 {'id':'plateforgecardscriptstudy','family':'PlateForge Card Script Study','styleName':'Text study','lower_x':.80,'lower_y':.96,'descender_y':1.08,'cap_x':.97,'m_x':.87,'space_scale':.52,'embolden_units':30,'role':'footer'},
]

class FTVector(ctypes.Structure):
    _fields_=[('x',ctypes.c_long),('y',ctypes.c_long)]
class FTOutline(ctypes.Structure):
    _fields_=[('n_contours',ctypes.c_short),('n_points',ctypes.c_short),('points',ctypes.POINTER(FTVector)),('tags',ctypes.POINTER(ctypes.c_ubyte)),('contours',ctypes.POINTER(ctypes.c_short)),('flags',ctypes.c_int)]
FT=ctypes.CDLL(ctypes.util.find_library('freetype') or 'libfreetype.so.6')
FT.FT_Outline_EmboldenXY.argtypes=[ctypes.POINTER(FTOutline),ctypes.c_long,ctypes.c_long]
FT.FT_Outline_EmboldenXY.restype=ctypes.c_int

def embolden_glyph(font,name,strength):
    g=flattened(font,name)
    if not g.coordinates:return g
    points=(FTVector*len(g.coordinates))(*[FTVector(x,y) for x,y in g.coordinates])
    tags=(ctypes.c_ubyte*len(g.coordinates))(*[(1 if flag&1 else 0) for flag in g.flags])
    ends=(ctypes.c_short*len(g.endPtsOfContours))(*g.endPtsOfContours)
    outline=FTOutline(len(ends),len(points),points,tags,ends,0)
    err=FT.FT_Outline_EmboldenXY(ctypes.byref(outline),strength,strength)
    if err:raise RuntimeError(f'FreeType could not embolden {name}: {err}')
    g.coordinates=GlyphCoordinates([(round(p.x-strength/2),round(p.y-strength/2)) for p in points])
    return g

def manual_glyph(contours,shear=0.0):
    dest=TTGlyphPen(None)
    curve=Cu2QuPen(dest,max_err=1.0,reverse_direction=False)
    for svg,hole in contours:
        rec=RecordingPen();parse_path(svg,rec)
        area=AreaPen(None);rec.replay(area)
        # Clockwise outer / counterclockwise inner contours.
        target_positive=hole
        target=curve if (area.value>0)==target_positive else ReverseContourPen(curve)
        if shear: target=TransformPen(target,(1,0,shear,1,60,0))
        rec.replay(target)
    return dest.glyph()

def flattened(base,name):
    src=base['glyf'][name]
    coords,ends,flags=src.getCoordinates(base['glyf'])
    g=Glyph();g.numberOfContours=len(ends);g.coordinates=GlyphCoordinates(coords)
    g.endPtsOfContours=list(ends);g.flags=array('B',flags)
    from fontTools.ttLib.tables.ttProgram import Program
    g.program=Program();g.program.fromBytecode([])
    return g

def transform_glyph(base,name,x_scale,y_positive=1,y_negative=1,shear=.62):
    g=flattened(base,name)
    pts=[]
    for x,y in g.coordinates:
        new_y=y*(y_positive if y>=0 else y_negative)
        # Change body width/height in an upright system and restore the same pen slant.
        new_x=(x-shear*y)*x_scale+shear*new_y
        pts.append((round(new_x),round(new_y)))
    g.coordinates=GlyphCoordinates(pts)
    return g

def build(cfg,base_bytes,license_text,output_root):
    base=TTFont(io.BytesIO(base_bytes));out=copy.deepcopy(base)
    cmap=base.getBestCmap();lower={g for c,g in cmap.items() if chr(c).islower()}
    upper={g for c,g in cmap.items() if chr(c).isupper()}
    changed=[]
    for name in base.getGlyphOrder():
        is_lower=name in lower or any(name.startswith(g+'.') for g in lower) or name in ['f_f','f_i','f_l','f_f_i','f_f_l']
        is_upper=name in upper or any(name.startswith(g+'.') for g in upper)
        if not (is_lower or is_upper): continue
        if is_lower:
            x,y,d=cfg['lower_x'],cfg['lower_y'],cfg['descender_y']
        else:
            x=cfg['m_x'] if name=='M' or name.startswith('M.') else cfg['cap_x'];y=d=1.0
        source_name='C.alt' if name=='C' else name
        out['glyf'][name]=transform_glyph(base,source_name,x,y,d)
        advance=base['hmtx'][name][0]
        advance_x=cfg.get('m_advance_x',x) if name=='M' else x
        out['hmtx'][name]=(round(advance*advance_x),0)
        changed.append(name)
    for name,(advance,contours) in DIGITS.items():
        for variant in [name,name+'.lf',name+'.osf']:
            if variant in out['glyf']:
                out['glyf'][variant]=manual_glyph(contours,shear=.52)
                out['hmtx'][variant]=(advance,0);changed.append(variant)
    out['glyf']['V']=manual_glyph(V_CONTOURS)
    out['hmtx']['V']=(1050,0);changed.append('V')
    for name in ['C','C.alt']:
        out['glyf'][name]=manual_glyph(C_CONTOURS)
        out['hmtx'][name]=(1286,0);changed.append(name)
    out['hmtx']['space']=(round(base['hmtx']['space'][0]*cfg['space_scale']),0)
    if 'nbspace' in out['hmtx'].metrics:
        out['hmtx']['nbspace']=out['hmtx']['space']
    # Match the photographed modest hyphen between figures.
    out['glyf']['hyphen']=manual_glyph([('M60 460 C135 520 230 475 300 490 L310 530 C230 500 130 555 55 500 Z',False)],shear=.35)
    out['hmtx']['hyphen']=(420,0);changed.append('hyphen')
    # A modest vector offset approximates the visibly heavier printed strokes.
    # FreeType preserves the existing curve-point count; it does not trace a raster.
    before_weight=copy.deepcopy(out)
    for name in out.getGlyphOrder():
        out['glyf'][name]=embolden_glyph(before_weight,name,cfg['embolden_units'])
    # No inherited TrueType hint programs can refer safely to edited points.
    for name in out.getGlyphOrder():
        g=out['glyf'][name]
        if hasattr(g,'program'):
            from fontTools.ttLib.tables.ttProgram import Program
            g.program=Program();g.program.fromBytecode([])
    for tag in ['fpgm','prep','cvt ']:
        if tag in out:del out[tag]
    for name in out.getGlyphOrder():
        g=out['glyf'][name];g.recalcBounds(out['glyf'])
        adv,_=out['hmtx'][name];out['hmtx'][name]=(adv,getattr(g,'xMin',0))
    family=cfg['family'];ps=family.replace(' ','')+'-Regular'
    for rec in out['name'].names:
        if rec.nameID in [1,2,3,4,6,16,17,21,22]:
            value={1:family,2:'Regular',3:'1.000;PlateForge;'+ps,4:family+' Regular',6:ps,16:family,17:'Regular',21:family,22:'Regular'}[rec.nameID]
            rec.string=value.encode(rec.getEncoding(),errors='replace')
        elif rec.nameID==5:rec.string='Version 1.000; source-informed study, not a historical font identification'.encode(rec.getEncoding(),errors='replace')
    out['name'].setName('Pinyon-derived fitting study for the supplied Grace M. McCarthy card; approximate, observed subset only. Original Pinyon design by Nicole Fally. Study modifications 2026 PlateForge contributors.',10,3,1,0x409)
    out['OS/2'].sCapHeight=1480
    out['OS/2'].sxHeight=round(685*cfg['lower_y'])
    out['OS/2'].sTypoAscender=1850;out['OS/2'].sTypoDescender=-1200;out['OS/2'].sTypoLineGap=0
    out['OS/2'].usWinAscent=2400;out['OS/2'].usWinDescent=1500
    out['hhea'].ascent=1850;out['hhea'].descent=-1200;out['hhea'].lineGap=0
    out['head'].fontRevision=1.0
    out.recalcTimestamp=False
    folder=output_root/cfg['id'];folder.mkdir(parents=True,exist_ok=True)
    font_path=folder/(ps+'.ttf');out.save(font_path)
    (folder/'OFL.txt').write_text(license_text,encoding='utf-8')
    provenance={
        **cfg,'source_url':'https://github.com/SorkinType/Pinyon/tree/91d502f9b3a98c210c54916c356caa534cdc4d70',
        'base_font':'Pinyon Script Regular','source_font_sha256':hashlib.sha256(base_bytes).hexdigest(),'source_image_sha256':SOURCE_SHA,
        'sha256':hashlib.sha256(font_path.read_bytes()).hexdigest(),
        'matchStatus':'source-informed approximation',
        'matchNote':'Measured fitting study derived from Pinyon; historical font identity and unobserved letters are unverified.',
        'method':'Pinyon curves adjusted in an unslanted coordinate system; hand-drawn observed C,V,0,1,3,6,7,8,hyphen; modest FreeType vector outline weight adjustment; recomputed metrics; no raster tracing.',
        'notes':'Display/name, compact/titles, and text/footer are fitting studies; their separation does not prove the source used three fonts. Weight and detailed letterforms remain approximate.',
        'observed_capitals':'BCDGIMPRSTV','observed_lowercase':'abcdefhilmnoprstuvy','observed_digits':'013678',
        'inherited_unobserved':'Unobserved characters, accents and alternate glyphs inherit Pinyon anatomy and remain unverified even when a consistent fitting transform was applied.',
        'manual_glyphs':['zero','one','three','six','seven','eight','C','V','hyphen'],
        'fitted_glyph_count':len(set(changed)),
        'weight_adjusted_glyph_count':sum(out['glyf'][n].numberOfContours>0 for n in out.getGlyphOrder()),
        'rebuild_script':'scripts/mccarthy-card/rebuild-study-fonts.py',
        'license':'SIL Open Font License 1.1; original copyright 2024 Pinyon Project Authors retained verbatim in OFL.txt; embedded original copyright 2022 retained.'
    }
    (folder/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    return {'id':cfg['id'],'font':str(font_path),'sha256':provenance['sha256']}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',type=Path,default=DEFAULT_MODEL,help='Canonical card model containing the licensed Pinyon TTF bytes and OFL.')
    parser.add_argument('--output-dir',type=Path,help='Output directory; omitted creates a temporary directory and prints its path.')
    args=parser.parse_args()
    model=json.loads(args.model.read_text(encoding='utf-8'))
    source=next((f for f in model['fonts'] if f['id']=='pinyonscript'),None)
    if source is None:raise SystemExit('Model does not contain the canonical pinyonscript font.')
    base_bytes=base64.b64decode(source['ttfBase64'],validate=True)
    actual=hashlib.sha256(base_bytes).hexdigest()
    if actual!=EXPECTED_BASE_SHA:
        raise SystemExit(f'Pinyon SHA-256 changed: expected {EXPECTED_BASE_SHA}, received {actual}. Review the source before rebuilding.')
    license_text=source['license']
    if 'SIL OPEN FONT LICENSE Version 1.1' not in license_text:
        raise SystemExit('Canonical Pinyon OFL text is missing.')
    output_root=args.output_dir.resolve() if args.output_dir else Path(tempfile.mkdtemp(prefix='plateforge-card-fonts-'))
    output_root.mkdir(parents=True,exist_ok=True)
    built=[build(cfg,base_bytes,license_text,output_root) for cfg in CONFIGS]
    print(json.dumps({'output_dir':str(output_root),'source_sha256':actual,'fonts':built},indent=2))


if __name__=='__main__':main()
