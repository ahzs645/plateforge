#!/usr/bin/env python3
"""Concise equal-height word figures and exact additional-source credits."""
import json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

HERE=Path(__file__).resolve().parent
PANELS=HERE/'candidate-comparison'
OUT=HERE/'proof';OUT.mkdir(exist_ok=True)
def font(n):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)

for key,old,new,title,credit in [
    ('1981-oct','normal','province-wide-1981-reconstruction','1981 wide province capitals','Jerry Woody · CC BY-SA 2.0'),
    ('2012-aug','condensed-medium','province-tall-2010-reconstruction','2012 tall province capitals','PartColumbia · CC BY-SA 4.0'),
]:
    board=Image.new('RGB',(1720,530),'#f7f8fb');draw=ImageDraw.Draw(board)
    draw.text((20,15),title+' · equal painted height',font=font(27),fill='#142238')
    draw.text((20,55),'Relative width retained. Original photo tilt, blur and print spread are visible; no horizontal squeeze.',font=font(18),fill='#43546d')
    for column,word in enumerate(['BRITISH','COLUMBIA']):
        x=240 if column==0 else 900
        draw.text((x,95),word,font=font(19),fill='#142238')
        rows=[('Photograph',PANELS/f'{key}-{word.lower()}-crop.png'),
              ('Previous candidate',PANELS/'native'/f'{old}-{word}.png'),
              ('Limited reconstruction',PANELS/'native'/f'{new}-{word}.png')]
        for index,(label,file)in enumerate(rows):
            y=130+index*115;im=Image.open(file).convert('RGBA')
            im=im.resize((round(im.width*70/im.height),70),Image.Resampling.LANCZOS)
            board.paste(im,(x,y),im)
            if column==0:draw.text((20,y+20),label,font=font(17),fill='#43546d')
    draw.text((20,490),'Source photograph: '+credit+' · exact attribution and licence links in source-credits.md.',font=font(17),fill='#43546d')
    board.save(OUT/f'{key}-shape-proof.png',optimize=True)

records=json.loads((HERE/'source-manifest.json').read_text())
lines=['# Additional source credits','',
       'Original files are preserved byte-for-byte. The manifest records their SHA-256 hashes, dimensions, author, source attribution and the licence link published on each Commons description page. Review crops and overlays are separate derived artifacts.','',
       '| Specimen | Author | File page | Published licence link |','|---|---|---|---|']
for record in records:
    author=record['author'].replace('"','');licence=record['licence']
    if 'Help:Public_domain'in licence:label='Public-domain metadata link (see file page)'
    elif '/by-sa/4.0'in licence:label='CC BY-SA 4.0'
    elif '/by-sa/2.0'in licence:label='CC BY-SA 2.0'
    else:label='Published licence'
    lines.append(f"| {record['id']} | {author} | [{record['title']}]({record['descriptionPage']}) | [{label}]({licence}) |")
lines.extend(['',
    'The two concise shape figures reuse the credited 1981 OCT and 2012 AUG photographs. Their photographic/derived-image content remains subject to the linked CC BY-SA terms; repository code licensing does not replace those credits. The original pinned BCpl8s crops are reused from the first-pass evidence set, with their original URLs and crop hashes preserved in the case ledger and proof index.','',
    'Dates and expiry labels identify photographed specimens; they do not independently establish manufacture dates, printing tooling, historical font identity, calibrated ink colour or material finish.'])
(HERE/'source-credits.md').write_text('\n'.join(lines)+'\n')
print('Two concise shape figures and additional source credits written')
