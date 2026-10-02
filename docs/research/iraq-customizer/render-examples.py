from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess
r=Path(__file__).resolve().parent/'output';a=json.loads((r/'example-cases.json').read_text());im=Image.new('RGB',(1460,1170),'#f2f4ef');d=ImageDraw.Draw(im);f=lambda n:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)
d.text((30,24),'Iraq customizer: flat templates, editable lettering',font=f(34),fill='#173c3c');d.text((30,75),'Same live engine as the interactive editor. Engine previews, not browser screenshots.',font=f(18),fill='#526767')
for i,c in enumerate(a):
 p=r/('example-'+c['id']+'.svg');png=p.with_suffix('.png');subprocess.run(['inkscape',str(p),'--export-type=png',f'--export-filename={png}','--export-width=650'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);x=25+(i%2)*725;y=125+(i//2)*340;d.rounded_rectangle((x,y,x+705,y+320),10,fill='white');d.text((x+15,y+13),c['label'],font=f(20),fill='#173c3c');q=Image.open(png).convert('RGB');q.thumbnail((670,225));im.paste(q,(x+15+(670-q.width)//2,y+55));d.text((x+15,y+292),'Serial '+c['state']['serial']+' · '+c['state']['fontProfile'],font=f(14),fill='#526767')
im.save(r/'Iraq-Customizer-Examples.png')
