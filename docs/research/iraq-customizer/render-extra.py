from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess
r=Path(__file__).resolve().parent/'output';a=[p for p in json.loads((r/'preset-render-report.json').read_text()) if p['id'].startswith('illustration-')];im=Image.new('RGB',(1440,780),'#f2f4ef');d=ImageDraw.Draw(im);f=lambda n:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n);d.text((25,20),'Four additional editable illustration-based layouts',font=f(31),fill='#173c3c');d.text((25,65),'Flat geometry + explicit candidate lettering. Every one of the 39 source artworks now maps to an editor preset.',font=f(16),fill='#526767')
for i,c in enumerate(a):
 p=r/(c['id']+'.svg');png=p.with_suffix('.png');subprocess.run(['inkscape',str(p),'--export-type=png',f'--export-filename={png}','--export-width=650'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);x=20+(i%2)*710;y=110+(i//2)*325;d.text((x,y),c['label'],font=f(16),fill='#173c3c');q=Image.open(png).convert('RGB');q.thumbnail((675,255));im.paste(q,(x+(680-q.width)//2,y+37));d.text((x,y+298),c['id'],font=f(13),fill='#526767')
im.save(r/'Additional-Editable-Layouts.png')
