#!/usr/bin/env python3
"""Verify supplied flag geometry in the plate preview and portable exports."""
import asyncio, json, os
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
root = Path(__file__).resolve().parents[1]
out = Path('/tmp/plateforge-passenger-carrier-qa'); out.mkdir(exist_ok=True)
async def main():
 base = os.environ.get('CARRIER_SITE', 'http://127.0.0.1:5176/plateforge/')
 errors = []; failed = []; cases = []
 async with async_playwright() as p:
  browser = await p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  page = await browser.new_page(viewport={'width':1440,'height':1000}, accept_downloads=True)
  page.on('pageerror', lambda e: errors.append(str(e)))
  page.on('response', lambda r: failed.append(r.url) if r.status >= 400 else None)
  for serial in ['810-301','814-298']:
   await page.set_viewport_size({'width':1440,'height':1000})
   await page.goto(base + '?carrier-check=20261005#/ca-bc/carrier-passenger-2005')
   await page.locator('#field-serial').fill(serial)
   assert not await page.locator('#field-serial[aria-invalid=true]').count()
   svg = page.locator('.plate-preview svg').first
   source = svg.locator('[data-source="user-supplied-bc-flag-svg"]')
   assert await source.count() == 1
   assert await source.locator('path').count() == 15
   assert await svg.locator('#carrier-flag-a').count() == 1
   assert await svg.locator('[clip-path="url(#carrier-flag-a)"]').count() == 1
   assert await svg.locator('[data-role="flag-print-wash"]').get_attribute('opacity') == '0.5'
   assert await svg.locator('[data-role="blank-renewal-box"]').get_attribute('fill') == '#eef0ee'
   assert not await svg.locator('[data-art="bc-flag"], image, svg').count()
   geometry = await source.evaluate('(el)=>{const b=el.getBoundingClientRect(); return {width:b.width,height:b.height};}')
   assert geometry['width'] > 100 and abs(geometry['width']/geometry['height'] - 5/3) < .01, geometry
   await svg.screenshot(path=str(out/(serial+'-preview.png')))
   for kind in ['SVG','PNG']:
    async with page.expect_download() as download:
     await page.get_by_role('button', name=kind, exact=True).click()
    target = out/(serial+'.'+kind.lower()); await (await download.value).save_as(str(target))
    if kind == 'SVG':
     xml = ET.fromstring(target.read_text()); ns={'s':'http://www.w3.org/2000/svg'}
     group = xml.find('.//s:g[@data-source="user-supplied-bc-flag-svg"]', ns)
     assert group is not None and len(group.findall('.//s:path', ns)) == 15
     assert xml.find('.//s:clipPath[@id="carrier-flag-a"]', ns) is not None
     text = target.read_text()
     assert text.index('user-supplied-bc-flag-svg') < text.index('data-role="serial"')
     for colour in ['#0047bb','#d22630','#ffd200']:
      assert colour in text, colour
    else:
     with Image.open(target) as im:
      assert im.width > 600 and im.height > 300
      rgb = im.convert('RGB'); w,h=im.size
      top=[rgb.getpixel((x,y)) for y in range(int(h*.10),int(h*.40),2) for x in range(int(w*.10),int(w*.90),2)]
      bottom=[rgb.getpixel((x,y)) for y in range(int(h*.72),int(h*.84),2) for x in range(int(w*.10),int(w*.90),2)]
      assert sum(c[2]>c[0]+20 and c[2]>c[1]+10 for c in top) > 50, 'flag blue absent'
      assert sum(c[0]>c[2]+20 and c[1]>c[2]+20 for c in bottom) > 50, 'flag sun absent'
      well=rgb.getpixel((int(w*.5),int(h*.84)))
      assert min(well)>220 and max(well)-min(well)<5, ('blank well must cover flag',well)
   await page.set_viewport_size({'width':390,'height':844})
   assert await svg.is_visible()
   assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
   cases.append({'serial':serial,'nativePaths':15,'clipping':True,'svg':True,'png':True,'mobile':True})
  await page.goto(base+'#/ca-bc/carrier-passenger-2010')
  assert not await page.locator('.plate-preview [data-source="user-supplied-bc-flag-svg"]').count()
  await page.goto(base+'passenger-carrier-flag-review/')
  await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
  assert await page.locator('article').count()==2
  await page.set_viewport_size({'width':1440,'height':1000})
  await page.locator('article').first.screenshot(path=str(out/'source-comparison.png'))
  await page.set_viewport_size({'width':390,'height':844})
  assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
  report={'date':'2026-10-05','site':base,'cases':cases,'temporaryUnchanged':True,'sourceComparisons':2,'errors':errors,'failedResources':failed}
  assert not errors and not failed, report
  Path(os.environ.get('CARRIER_REPORT',root/'docs/research/passenger-carrier-flag/browser-verification.json')).write_text(json.dumps(report,indent=2)+'\n')
  print(json.dumps(report)); await browser.close()
asyncio.run(main())
