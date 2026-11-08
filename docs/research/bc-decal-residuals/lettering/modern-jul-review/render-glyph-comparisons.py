#!/usr/bin/env python3
"""Reproduce independent glyph panels for the bounded JUL and JAN checks."""
from pathlib import Path
import importlib.util
import json
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent

def load(directory, name):
    spec = importlib.util.spec_from_file_location(name, directory / 'analyze.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def source_glyphs(directory, module, row, text):
    crop = Image.open(directory / 'evidence' / row['id'] / 'source-crop.png')
    mask, boxes, _ = module.audit.source_components(np.asarray(crop.convert('L'), dtype=float), row['threshold'], False)
    if not row['glyphSegmentationAccepted']:
        raise ValueError('Unstable source glyph segmentation')
    return [(char,module.audit.trim(mask.crop(box))) for char,box in zip(text,boxes)]

jul = load(HERE, 'jul_audit')
row = json.loads((HERE / 'metrics.json').read_text())['sources'][0]
board = Image.new('RGB', (1500,980), '#f1f4f8'); d = ImageDraw.Draw(board)
d.text((20,15), '2021 JUL — separate character comparison at equal painted height', font=jul.F, fill='#17243a')
d.text((20,48), 'Source only: magenta · Model only: blue · Overlap: dark · Source width retained', font=jul.S, fill='#334155')
for i,key in enumerate(['retained','anton-400','heavy-month-wide','oswald-700']):
    x=15+i*375;d.text((x,90),key,font=jul.F,fill='#17243a')
    for j,(char,glyph) in enumerate(source_glyphs(HERE,jul,row,'JUL')):
        m=jul.model(key,char);image=jul.audit.compare(glyph,m,180);y=135+j*270
        board.paste(image,(x+(350-image.width)//2,y))
        d.text((x+30,y+215),f'{char} width/source: {jul.audit.ratio(m)/jul.audit.ratio(glyph):.3f}',font=jul.S,fill='#334155')
board.save(HERE/'separate-glyphs.png')

directory=HERE/'jan-review';jan=load(directory,'jan_audit')
rows=json.loads((directory/'metrics.json').read_text())['sources']
board=Image.new('RGB',(1500,1200),'#f1f4f8');d=ImageDraw.Draw(board)
d.text((20,20),'JAN — independent glyph overlays: retained vs native Anton',font=jan.F,fill='#17243a')
for ri,row in enumerate(rows):
    y=80+ri*370;d.text((20,y),row['id'],font=jan.F,fill='#17243a')
    for ci,(char,glyph) in enumerate(source_glyphs(directory,jan,row,'JAN')):
        for ki,key in enumerate(['retained','anton-400']):
            x=20+ci*490+ki*235;m=jan.model(key,char);im=jan.audit.compare(glyph,m,210)
            board.paste(im,(x+(220-im.width)//2,y+45))
            d.text((x,y+285),f'{char} {key}',font=jan.S,fill='#334155')
            d.text((x,y+311),f'Width ratio {jan.audit.ratio(m)/jan.audit.ratio(glyph):.3f}',font=jan.S,fill='#334155')
board.save(directory/'separate-glyphs.png')
