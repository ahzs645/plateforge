#!/usr/bin/env python3
"""Readable, attributed source sheets from the pinned observed-input ledger."""
from pathlib import Path
import json,hashlib,math
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent
records=json.loads((HERE/'source-inventory.json').read_text())['sources']
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
months='JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()
for year in sorted({r['observedYear']for r in records if 'commons'not in r['id']}):
 rows=sorted([r for r in records if r['observedYear']==year and 'commons'not in r['id']],key=lambda r:(months.index(r['observedMonth']),r['observedControl']))
 out=Image.new('RGB',(1200,math.ceil(len(rows)/2)*315+60),'#f5f7fa');d=ImageDraw.Draw(out)
 d.text((16,12),f'Observed {year} · BCpl8s catalogue photographs · source widths preserved',font=font,fill='#16243b')
 for i,r in enumerate(rows):
  p=HERE/r['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sourceSha256']
  im=Image.open(p).convert('RGB');im=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
  if im.width>570 or im.height>245:im.thumbnail((570,245))
  x=(i%2)*600;y=60+(i//2)*315
  d.text((x+12,y),f"{r['observedMonth']} {r['observedYear']} · {r['observedControl']}",font=font,fill='#16243b')
  d.text((x+12,y+28),p.name+(' · filename corrected in ledger'if r['captionOrFilenameMismatch']else''),font=small,fill='#475569')
  out.paste(im,(x+12,y+55))
 out.save(HERE/f'supplemental-{year}.png')
rows=[r for r in records if 'commons'in r['id']]
out=Image.new('RGB',(1100,1650),'#f5f7fa');d=ImageDraw.Draw(out)
for i,r in enumerate(rows):
 im=Image.open(HERE/r['file']).convert('RGB');im.thumbnail((1060,475));y=i*550
 d.text((20,y+8),f"{r['observedYear']} {r['observedMonth']} · {r['observedControl']} | D5e58, CC BY-SA 4.0",font=font,fill='#15243b')
 out.paste(im,((1100-im.width)//2,y+50))
 d.text((20,y+522),f"Original: {r['sourcePixels'][0]} × {r['sourcePixels'][1]} px. Unrectified; source hash in ledger.",font=font,fill='#475569')
out.save(HERE/'commons-originals-sheet.png')
print(f'Built eight catalogue sheets and one enlarged-original sheet from {len(records)} verified inputs.')
