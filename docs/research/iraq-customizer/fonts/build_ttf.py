#!/usr/bin/env python3
"""Export normalized canonical profiles as limited installable TrueType fonts.
These are serial/wordmark convenience subsets, not Arabic shaping fonts. The app uses SVG.
"""
from pathlib import Path
import json, hashlib
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.pointInsidePen import PointInsidePen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
R=Path(__file__).resolve().parent
profiles=json.loads((R/'canonical-font-data.json').read_text())
out=R/'ttf';out.mkdir(exist_ok=True)
word_ids=list(profiles['naskh-candidate']['wordmarks'])


def contours(path):
    pen=RecordingPen();parse_path(path,pen);result=[];current=[]
    for operation,points in pen.value:
        current.append((operation,points))
        if operation in ['closePath','endPath']:
            p=RecordingPen();p.value=current;result.append(p);current=[]
    assert not current
    return result


def draw(path,pen,fill_rule):
    if fill_rule != 'evenodd':parse_path(path,pen);return
    # TrueType uses nonzero winding. Convert even-odd clean source paths to equivalent
    # outer/hole winding before y-flipping; no geometry or counter is added or removed.
    parts=contours(path)
    for i,part in enumerate(parts):
        test_point=part.value[0][1][0];depth=0
        for j,other in enumerate(parts):
            if i==j:continue
            inside=PointInsidePen(None,test_point,evenOdd=True);other.replay(inside)
            if inside.getResult():depth+=1
        area=AreaPen(None);part.replay(area)
        desired_positive=depth%2==0
        part.replay(pen if (area.value>0)==desired_positive else ReverseContourPen(pen))


manifest=[]
for id,p in profiles.items():
    fb=FontBuilder(1000,isTTF=True);glyphs={};metrics={};cmap={};mapping=[]
    pen=TTGlyphPen(None)
    draw('M40 0H620V-1000H40Z M90 -50H570V-950H90Z',TransformPen(pen,(1,0,0,-1,0,0)),'evenodd')
    glyphs['.notdef']=pen.glyph();metrics['.notdef']=(680,40)
    glyphs['space']=TTGlyphPen(None).glyph();metrics['space']=(340,0);cmap[32]='space'
    entries=[(char,g,None) for char,g in p['glyphs'].items()]+[(None,w,word_id) for word_id,w in p['wordmarks'].items()]
    for char,g,word_id in entries:
        if word_id:codepoints=[0xE000+word_ids.index(word_id)];name='word.'+word_id.replace('-','_')
        elif len(char)>1:codepoints=[0xE100];name='class.heh_connected'
        else:
            codepoints=[ord(char)];name=f'uni{ord(char):04X}'
            if char in '٠١٢٣٤٥٦٧٨٩':
                index='٠١٢٣٤٥٦٧٨٩'.index(char);codepoints+=[ord('0')+index,ord('۰')+index]
            elif id.startswith('modern') and char in '0123456789':
                index=int(char);codepoints+=[ord('٠')+index,ord('۰')+index]
        pen=TTGlyphPen(None);quad=Cu2QuPen(pen,max_err=.35,reverse_direction=False)
        draw(g['path'],TransformPen(quad,(10,0,0,-10,0,0)),g['fillRule'])
        glyph=pen.glyph();glyph.recalcBounds(None);glyphs[name]=glyph;metrics[name]=(round(g['advance']*10),glyph.xMin)
        for codepoint in codepoints:cmap[codepoint]=name
        mapping.append(dict(glyph=name,character=char,wordmark_id=word_id,text=g.get('text'),codepoints=[f'U+{cp:04X}' for cp in codepoints],
                            provenance=g['provenance'],source_id=g['sourceId'],advance=metrics[name][0],
                            role='Complete whole-word PUA token; never a general Arabic letter' if word_id else 'Atomic pre-shaped class token' if len(char)>1 else 'Single serial character; aliases share this exact master'))
    fb.setupGlyphOrder(list(glyphs));fb.setupCharacterMap(cmap);fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=1400,descent=-600)
    family='PlateForge Iraq '+id.replace('-',' ').title()+' Canonical'
    ps='PlateForgeIraq'+''.join(x.title() for x in id.split('-'))+'Canonical'
    license_text=p['rights']
    if id.startswith('modern'):license_text=(R/'licences/GL-LICENSE.txt').read_text()
    if id=='naskh-candidate':license_text=(R/'licences/Noto-Naskh-Arabic-LICENSE.txt').read_text()
    fb.setupNameTable(dict(familyName=family,styleName='Regular',uniqueFontIdentifier=ps+'-20261002',fullName=family,psName=ps,
                          version='Version 0.200; canonical limited study subset',copyright=p['rights'],licenseDescription=license_text,
                          description='Reusable upright serial masters. Missing characters intentionally absent. Arabic words require explicit PUA mapping. No GSUB/GPOS Arabic alphabet shaping. Not an official Iraqi plate font.'))
    fb.setupOS2(sTypoAscender=1400,sTypoDescender=-600,usWinAscent=1400,usWinDescent=600,sCapHeight=1000,
                fsType=2 if id.startswith('legacy-') else 0)
    fb.setupPost();fb.setupMaxp();fb.font['head'].created=3873744000;fb.font['head'].modified=3873744000
    path=out/(id+'-canonical-subset.ttf');fb.save(path)
    checked=TTFont(path);assert set(checked.getBestCmap())==set(cmap)
    assert 'GSUB' not in checked and 'GPOS' not in checked
    if id=='utility-truck':assert ord('٨') not in cmap and ord('٩') not in cmap
    assert all(0xE000+word_ids.index(word_id) in cmap for word_id in p['wordmarks'])
    manifest.append(dict(id=id,file=path.name,family=family,units_per_em=1000,cap_height=1000,baseline=0,rights=p['rights'],source_url=p['sourceUrl'],
                         sha256=hashlib.sha256(path.read_bytes()).hexdigest(),mapping=mapping,
                         restrictions=['Not an official die font.','No Arabic GSUB/GPOS; use only isolated serial characters and listed complete PUA wordmarks.',
                                       'Wordmark codepoints are token mappings, not an Arabic alphabet.','Legacy source-study fonts carry restricted embedding and unverified source rights.'] if id.startswith('legacy-') else ['Not an official die font.','No Arabic GSUB/GPOS; use only isolated serial characters and listed complete PUA wordmarks.','Wordmark codepoints are token mappings, not an Arabic alphabet.']))
(out/'font-mapping.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Built and validated',len(manifest),'canonical TTF subsets')
