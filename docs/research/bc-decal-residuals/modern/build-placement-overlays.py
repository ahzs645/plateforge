#!/usr/bin/env python3
"""Uniform frame-height source/current overlays; no horizontal fitting."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
records=json.loads((HERE/'placement-proposals.json').read_text())['proposals']
sheet=Image.new('RGB',(1500,5*310+100),'#f5f7fa');draw=ImageDraw.Draw(sheet)
draw.text((20,15),'Modern specimen placement: photograph / first pass overlay / proposed overlay',font=font,fill='#13243a')
draw.text((20,48),'Uniform frame height and horizontal centre; original aspect retained. 50% blend. Small-source uncertainty remains.',font=small,fill='#475569')
metrics=[]
measure={r['id']:r for r in json.loads((HERE/'placement-measurements.json').read_text())['records']}
def align(im,w,h=200):
 im=im.convert('RGB').resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS)
 out=Image.new('RGB',(w,h),'#e4e8ed');out.paste(im,((w-im.width)//2,0));return out
for i,r in enumerate(records):
 id=r['id'];y=100+i*310
 source=ROOT/'public/bc-decal-corrections/evidence'/id/'source.png'
 if hashlib.sha256(source.read_bytes()).hexdigest()!=measure[id]['sourceSha256']:raise ValueError(f'Source changed: {id}')
 photo=Image.open(source)
 before=Image.open(HERE/'placements'/f'{id}-before.png');after=Image.open(HERE/'placements'/f'{id}-after.png')
 w=max(round(im.width*200/im.height)for im in [photo,before,after]);a,b,c=[align(im,w)for im in [photo,before,after]]
 cells=[a,Image.blend(a,b,.5),Image.blend(a,c,.5)]
 for j,cell in enumerate(cells):sheet.paste(cell,(j*500+(500-w)//2,y+40))
 draw.text((20,y),f'{id} {r["month"]} · {r["control"]}',font=font,fill='#13243a')
 for label,im in [('source-aligned',a),('before-aligned',b),('after-aligned',c),('before-overlay',cells[1]),('after-overlay',cells[2])]:im.save(HERE/'placements'/f'{id}-{label}.png')
 per=[]
 for role in ['month','year','serial','legend0','legend1','barcode']:
  idx=int(role[-1])if role.startswith('legend')else 0;name='decal-legend'if role.startswith('legend')else 'decal-'+role
  s=measure[id]['roles'][role]['sourceBoundsUniformHeight'];sc=[(s[0]+s[2])/2,(s[1]+s[3])/2]
  vals={}
  for state in ['before','after']:
   b=next(a['box']for a in r[state]if a['role']==name and a['index']==idx)
   vals[state]={'centreDeltaUnits':[round((b[k]+b[k+2])/2-sc[k],4)for k in range(2)],'paintedWidth':round(b[2]-b[0],4),'paintedHeight':round(b[3]-b[1],4)}
  per.append({'role':role,'sourcePaintedWidth':round(s[2]-s[0],4),'sourcePaintedHeight':round(s[3]-s[1],4),**vals})
 metrics.append({'id':id,'month':r['month'],'control':r['control'],'roles':per,'limits':'Measured centre improvements are intended layout effects, not independent evidence of historical accuracy. Source aspect is unrectified. 2022 year retains a conservative right margin instead of matching the wider photograph centre exactly.'})
 note='Year/control resized uniformly; month/province contours retained. Barcode sizes refer to painted bars.'
 if id=='2022':note='Year right margin retained conservatively: source frame is 4.7% broader. Month/province contours retained.'
 if id=='2020':note='All-zero catalogue sample: layout evidence only; normal issuance is not established.'
 draw.text((20,y+255),note,font=small,fill='#475569')
sheet.save(HERE/'modern-placement-summary.png')
(HERE/'placement-results.json').write_text(json.dumps({'method':'Uniform frame-height and horizontal-centre registration; actual vector paint bounds; no x-only scaling; source and model widths retained. Province columns translate independently but share a centre. Barcode paint is measured excluding quiet zones.','specimens':metrics},indent=2)+'\n')
print(f'{len(records)} placement comparisons and before/after paint metrics')
