"""Check all selectable months for printed-run clipping and collisions in Chromium."""
from pathlib import Path
import subprocess, tempfile
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
out=Path(tempfile.mkdtemp(prefix='plateforge-typography-'))
subprocess.run(['node','scripts/render-decal-typography-fixtures.mjs',str(out/'fixtures.json')],cwd=root,check=True)
fixtures=json.loads((out/'fixtures.json').read_text());failures=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();allrows=[]
 for f in fixtures:
  page.set_content(f['svg'])
  metrics=page.evaluate('''() => {
   const svg=document.querySelector('svg'); const w=svg.viewBox.baseVal.width;
   const runs=[...svg.querySelectorAll('[data-die]')].map(el=>{const b=el.getBBox(),m=el.getCTM();const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return {role:el.getAttribute('data-role'),text:el.getAttribute('aria-label'),profile:el.getAttribute('data-die'),fit:el.getAttribute('data-fit'),x:Math.min(...pts.map(p=>p.x)),y:Math.min(...pts.map(p=>p.y)),right:Math.max(...pts.map(p=>p.x)),bottom:Math.max(...pts.map(p=>p.y))};});
   return {w,runs};
  }''')
  reasons=[]
  for run in metrics['runs']:
   if run['x']<-.5 or run['y']<-.5 or run['right']>metrics['w']+.5 or run['bottom']>100.5:reasons.append(['bounds',run])
  for i,a in enumerate(metrics['runs']):
   for c in metrics['runs'][i+1:]:
    dx=min(a['right'],c['right'])-max(a['x'],c['x']);dy=min(a['bottom'],c['bottom'])-max(a['y'],c['y'])
    if dx>.6 and dy>.6:reasons.append(['overlap',a['text'],c['text'],round(dx,2),round(dy,2)])
  if reasons:failures.append({'id':f['id'],'month':f['month'],'reasons':reasons})
  allrows.append({'id':f['id'],'month':f['month'],**metrics})
 b.close()
(out/'geometry.json').write_text(json.dumps(allrows,indent=2))
(out/'failures.json').write_text(json.dumps(failures,indent=2))
print('Checked',len(fixtures),'renderings; failures',len(failures))
print(json.dumps({'renderings':len(fixtures),'catalogueVariants':len(set(f['id'] for f in fixtures)),'failures':failures,'metrics':str(out/'geometry.json')},indent=2))
assert not failures, 'Printed runs overlap or leave the decal.'
