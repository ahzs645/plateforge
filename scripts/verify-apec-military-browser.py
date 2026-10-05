#!/usr/bin/env python3
"""Check both route aliases, the shared standard and source comparison/export."""
import asyncio,json,os
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1]
out=Path('/tmp/plateforge-apec-qa');out.mkdir(exist_ok=True)
async def main():
 base=os.environ.get('APEC_SITE','http://127.0.0.1:5176/plateforge/');errors=[];failed=[];cases=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
  routes=[('ca-federal/standard','12 345',2,False),
   ('ca-federal/apec-1997','180',0,True),
   ('ca-federal/apec-1997-maple-leaves','134',2,True),
   ('ca-bc/events-apec-1997-military','180',0,True),
   ('ca-bc/events-apec-1997-military-maple-leaves','134',2,True)]
  for route,serial,leaves,apec in routes:
   await page.set_viewport_size({'width':1440,'height':1000})
   await page.goto(base+'?apec-variant=20261005#/'+route)
   svg=page.locator('.plate-preview svg').first;await svg.wait_for()
   await page.locator('#field-serial').fill(serial)
   assert not await page.locator('#field-serial[aria-invalid=true]').count(),(route,serial,page.url)
   assert await svg.locator('[data-art="official-maple-leaf"]').count()==leaves
   assert await svg.locator('[data-art="official-apec-sticker"]').count()==int(apec)
   metadata=json.loads(await svg.locator('metadata').text_content())
   assert metadata['jurisdiction']=='CA',metadata
   expected='events-apec-military'+('-maple-leaves' if leaves else '') if apec else 'official-canada'
   assert metadata['recipe']==expected,(route,metadata)
   if apec:
    await page.locator('#field-serial').fill('1134')
    assert await page.locator('#field-serial[aria-invalid=true]').count()==1
    await page.locator('#field-serial').fill(serial)
   name=route.replace('/','-')
   await svg.screenshot(path=str(out/(name+'-preview.png')))
   for kind in ['SVG','PNG']:
    async with page.expect_download() as download:
     await page.get_by_role('button',name=kind,exact=True).click()
    target=out/(name+'.'+kind.lower());await(await download.value).save_as(str(target))
    if kind=='SVG':
     content=target.read_text();assert '&quot;jurisdiction&quot;:&quot;CA&quot;' in content or '"jurisdiction":"CA"' in content
     assert content.count('data-art="official-maple-leaf"')==leaves
    else:
     with Image.open(target) as im:
      assert im.width>500 and im.height>250
      if leaves:
       rgb=im.convert('RGB')
       for lo,hi in [(0,.18),(.82,1)]:
        red=sum(1 for y in range(int(im.height*.3)) for x in range(int(im.width*lo),int(im.width*hi))
                if (lambda c:c[0]>110 and c[0]>c[1]*1.5 and c[0]>c[2]*1.5)(rgb.getpixel((x,y))))
        assert red>50,('missing maple leaf in PNG',route,lo,red)
   await page.set_viewport_size({'width':390,'height':844})
   assert await svg.is_visible();assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   cases.append({'route':route,'serial':serial,'mapleLeaves':leaves,'apecSticker':apec,'nationalMetadata':True,'svg':True,'png':True,'mobile':True})
  await page.goto(base+'apec-military-review/')
  await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
  assert await page.locator('article').count()==2
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  await page.set_viewport_size({'width':1440,'height':1000})
  for id in ['maple-leaves','plain']:
   await page.locator('#'+id).screenshot(path=str(out/(id+'-comparison.png')))
  result={'date':'2026-10-05','site':base,'cases':cases,'sourceComparisons':2,'sharedStandard':True,'errors':errors,'failedResources':failed}
  assert not errors and not failed,result
  report=Path(os.environ.get('APEC_REPORT',root/'docs/research/apec-military/browser-verification.json'))
  report.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));await browser.close()
asyncio.run(main())
