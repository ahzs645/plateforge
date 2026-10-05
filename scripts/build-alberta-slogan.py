#!/usr/bin/env python3
"""Outline only Wild Rose Country from the supplied Std Medium font.

Usage: python scripts/build-alberta-slogan.py /path/to/font.otf
The upload lacks W/e/t/y alternates. The four plate forms below are explicit
reconstructions, not recovered Pro glyphs. No uploaded code or font is bundled.
"""
import hashlib, io, json, math, sys
from pathlib import Path
from zipfile import ZipFile
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen

root = Path(__file__).resolve().parents[1]
font_path = Path(sys.argv[1])
input_bytes = font_path.read_bytes()
font_name, font_bytes = font_path.name, input_bytes
if font_path.suffix.lower() == '.zip':
    with ZipFile(io.BytesIO(input_bytes)) as archive:
        candidates = [n for n in archive.namelist() if n.lower().endswith(('.otf','.ttf')) and not n.startswith('__MACOSX/')]
        if len(candidates) != 1: raise ValueError('Expected exactly one source font in the archive')
        font_name, font_bytes = Path(candidates[0]).name, archive.read(candidates[0])
font = TTFont(io.BytesIO(font_bytes))
if font['name'].getDebugName(6) != 'ITCAvantGardeStd-Md' or font['OS/2'].sCapHeight != 740:
    raise ValueError('This reconstruction is fitted to ITCAvantGardeStd-Md with a 740-unit cap height; inspect other fonts separately')
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
word = 'Wild Rose Country'
cap = font['OS/2'].sCapHeight
scale = 100 / cap

def outline(name, transform=None):
    pen = SVGPathPen(glyphs)
    target = TransformPen(RoundingPen(pen, roundFunc=lambda v: round(v, 3)),
                          (scale, 0, 0, -scale, 0, 100))
    glyphs[name].draw(TransformPen(target, transform) if transform else target)
    return {'advance': round(glyphs[name].width * scale, 3),
            'fill': True, 'paths': [pen.getCommands()]}

default = {c: outline(cmap[ord(c)]) for c in sorted(set(word))}
plate = dict(default)

def polygon(points, advance):
    d = 'M' + ' L'.join(f'{round(x*scale,3)} {round(100-y*scale,3)}' for x,y in points) + ' Z'
    return {'advance': round(advance*scale,3), 'fill': True, 'paths': [d]}

# Left-leaning W: two descending diagonals joined to upright middle/right stems.
plate['W'] = polygon([(14,740),(134,740),(330,250),(330,740),(434,740),
                      (638,250),(638,740),(742,740),(742,0),(638,0),
                      (434,490),(434,0),(330,0)], 756)
# Preserve the supplied circular e and stroke weight; rotate its bar/opening.
angle = math.pi/4
a,b = math.cos(angle),math.sin(angle)
cx,cy = 317,272
plate['e'] = outline('e', (a,b,-b,a,cx-a*cx+b*cy,cy-b*cx-a*cy))
# Right-only crossbar; retain the supplied 104-unit upright and 81-unit bar.
plate['t'] = polygon([(40,0),(144,0),(144,463),(249,463),(249,544),
                      (144,544),(144,740),(40,740)], 274)
# Upright left branch and one diagonal continuing into the descender.
plate['y'] = polygon([(68,544),(172,544),(172,54),(430,544),(548,544),
                      (157,-198),(39,-198),(143,0),(68,0)], 560)

# Retain native pair positioning for unchanged glyphs. Reconstructed alternates
# use their explicit advances without borrowing incompatible default kerning.
kerning = {}
if 'GPOS' in font:
    lookups = font['GPOS'].table.LookupList.Lookup
    ids = {i for r in font['GPOS'].table.FeatureList.FeatureRecord
           if r.FeatureTag == 'kern' for i in r.Feature.LookupListIndex}
    for left,right in zip(word,word[1:]):
        if left in 'Wety' or right in 'Wety': continue
        g1,g2 = cmap[ord(left)],cmap[ord(right)]
        value = 0
        for i in ids:
            for sub in lookups[i].SubTable:
                sub = getattr(sub,'ExtSubTable',sub)
                if g1 not in sub.Coverage.glyphs: continue
                if sub.Format == 1:
                    records = sub.PairSet[sub.Coverage.glyphs.index(g1)].PairValueRecord
                    record = next((r for r in records if r.SecondGlyph == g2),None)
                    if record: value += getattr(record.Value1,'XAdvance',0)
                elif sub.Format == 2:
                    record = sub.Class1Record[sub.ClassDef1.classDefs.get(g1,0)].Class2Record[sub.ClassDef2.classDefs.get(g2,0)]
                    value += getattr(record.Value1,'XAdvance',0)
        if value: kerning[left+right] = round(value*scale,3)

data = {'default':default, 'plate':plate, 'kerning':kerning}
(root/'src/templates/dies/alberta-avant-garde.json').write_text(json.dumps(data,indent=2)+'\n')
directory = root/'docs/research/alberta-slogan'
directory.mkdir(parents=True,exist_ok=True)
provenance = {
    'date':'2026-10-05', 'text':word, 'fileName':font_name,
    'sha256':hashlib.sha256(font_bytes).hexdigest(),
    'family':font['name'].getDebugName(1), 'style':font['name'].getDebugName(2),
    'postScriptName':font['name'].getDebugName(6), 'version':font['name'].getDebugName(5),
    'capHeightUnits':cap, 'unitsPerEm':font['head'].unitsPerEm,
    'features':[r.FeatureTag for r in font['GSUB'].table.FeatureList.FeatureRecord],
    'requestedAlternatesPresent':False,
    'reconstructed':{'W':'Left-leaning diagonals and upright stems; polygon master.',
                     'e':'Supplied e rotated 45 degrees about its bowl centre.',
                     't':'Supplied stem/bar dimensions; left crossbar removed, advance refitted.',
                     'y':'Upright left branch and continuous diagonal descender; polygon master.'},
    'referenceSpecimen':'https://www.e-daylight.jp/fonts/type/a/agg/avant-garde-gothic.jpg',
    'referencePhotos':['PWG-542 and CKZ-3449 supplied in conversation',
                       'http://www.worldlicenseplates.com/jpglps/CN_ALBE_GI3.jpg'],
    'fit':'Native outlines/advances and native kerning for unchanged pairs; explicit advances for four reconstructed forms. Whole line uniformly scaled and centred; no independent width stretch.',
    'limits':'Std Medium, not Pro. Four forms are reconstructions, not authentic alternate font outlines. Family identification and weight are visual candidates, not confirmed historical printing specifications. No Book font supplied for a weight comparison. Fixed-word outlines only; source font software not bundled.'
}
if font_path.suffix.lower() == '.zip':
    provenance['upload'] = {'fileName':font_path.name,'sha256':hashlib.sha256(input_bytes).hexdigest()}
(directory/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(json.dumps({'font':provenance['postScriptName'],'outlinedCharacters':len(default),'reconstructed':['W','e','t','y'],'kerning':kerning}))
