#!/usr/bin/env python3
"""Select every B.C. preset in a real browser and capture current reproduction.
These are route/preview checks, never evidence of photographed glyph accuracy.
"""
import argparse,asyncio,json,re,time
from pathlib import Path
from PIL import Image,ImageOps
from playwright.async_api import async_playwright
async def main():
 parser=argparse.ArgumentParser();parser.add_argument('--inventory',default='/tmp/bc-grouping-inventory.json');parser.add_argument('--base',default='http://127.0.0.1:5177/plateforge/');parser.add_argument('--output',default='public/bc-font-comparisons/die-grouping');parser.add_argument('--only',default='');parser.add_argument('--workers',type=int,default=1);args=parser.parse_args()
 root=Path(args.output);(root/'previews').mkdir(parents=True,exist_ok=True)
 inventory=json.loads(Path(args.inventory).read_text());formats=[f for f in inventory['formats'] if not args.only or f['id'] in args.only.split(',')];results=[];errors=[];start=time.monotonic()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);queue=asyncio.Queue()
  for f in formats:queue.put_nowait(f)
  async def worker():
   page=await browser.new_page(viewport={'width':1180,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)))
   while not queue.empty():
    f=await queue.get()
    try:
     await page.goto(args.base+'?die-catalogue=1#/ca-bc/'+f['id'],wait_until='domcontentloaded',timeout=45000)
     svg=page.locator('.plate-preview svg');await svg.wait_for(timeout=30000)
     for k,v in f['sampleParts'].items():
      field=page.locator('#field-'+k)
      if await field.count():
       if await field.evaluate('n=>n.tagName')=='SELECT':await field.select_option(v)
       else:await field.fill(v)
     toggle=page.get_by_role('checkbox',name='Research lettering',exact=True)
     if await toggle.count():await toggle.check()
     await page.wait_for_function("!document.querySelector('.research-dies-note')?.textContent.includes('Loading')",timeout=45000)
     await page.evaluate('document.fonts.ready');await page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
     meta=await svg.evaluate('n=>({label:n.getAttribute("aria-label"),viewBox:n.getAttribute("viewBox"),metadata:n.querySelector("metadata")?.textContent??null,paths:n.querySelectorAll("path").length,profiles:[...new Set([...n.querySelectorAll("[data-die]")].map(x=>x.getAttribute("data-die")))],text:n.textContent})')
     assert not re.search(r'NaN|Infinity',await svg.get_attribute('viewBox'))
     temp=root/'previews'/(f['id']+'.png');await svg.screenshot(path=str(temp))
     im=Image.open(temp).convert('RGB');im.thumbnail((580,330));im.save(temp.with_suffix('.webp'),'WEBP',quality=91);temp.unlink()
     results.append({'id':f['id'],'url':args.base+'#/ca-bc/'+f['id'],'selected':True,'previewCaptured':True,'serial':f['sampleParts'].get('serial',''),**meta})
     if len(results)%50==0:print(json.dumps({'captured':len(results),'elapsedSeconds':round(time.monotonic()-start)}),flush=True)
    except Exception as e:results.append({'id':f['id'],'selected':False,'previewCaptured':False,'error':str(e)})
    finally:queue.task_done()
   await page.close()
  await asyncio.gather(*(worker() for _ in range(args.workers)));await browser.close()
 results.sort(key=lambda x:x['id']);report={'method':'Selected each preset URL and rendered the declared default die/flat finish with research lettering enabled after the registry settled with deterministic generated parts. Preview captures and metadata are implementation checks; they do not certify source photograph accuracy, every glyph, or identical physical tooling.','site':args.base,'requested':len(formats),'captured':sum(x['previewCaptured'] for x in results),'errors':errors,'elapsedSeconds':round(time.monotonic()-start),'formats':results}
 target=root/('browser-selection.json' if not args.only else 'browser-selection-refresh.json');target.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='formats'}),flush=True)
asyncio.run(main())
