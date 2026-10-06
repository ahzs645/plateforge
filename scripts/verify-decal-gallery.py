#!/usr/bin/env python3
"""Check province gallery navigation, compatible application and state preservation."""
import asyncio, json, os
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1]
out=Path('/tmp/plateforge-decal-gallery-qa');out.mkdir(exist_ok=True)
async def main():
 base=os.environ.get('DECAL_SITE','http://127.0.0.1:5176/plateforge/');errors=[];failed=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
  await page.goto(base+'?decal-gallery-check=20261005#/ca-bc/1985-flag')
  await page.locator('#field-serial').fill('XXH-578')
  await page.locator('#field-decalMonth').select_option('APR')
  await page.locator('#field-decal').select_option('1996')
  settings=await page.locator('.inspector select').evaluate_all('(els)=>Object.fromEntries(els.map(e=>[e.id,e.value]))')
  await page.get_by_role('tab',name='Decals',exact=True).filter(visible=True).click()
  await page.locator('[data-decal-id="1996-pink"]').wait_for()
  assert page.url.endswith('#/decals/ca-bc/1985-flag')
  count=await page.locator('.decal-card').count();assert count>=50
  assert not await page.locator('[data-decal-id="1973"], [data-decal-id="1979"]').count()
  assert await page.locator('.decal-card img').count()==count
  assert count==55
  assert await page.get_by_role('link',name='Full photograph / previous / current review ↗').count()==1
  assert await page.locator('[data-decal-id="2023"] button:first-of-type').is_disabled()
  await page.get_by_label('Choices for this plate',exact=True).check()
  supported=await page.locator('.decal-card').count();assert supported<count
  assert not await page.locator('[data-decal-id="2023"]').count()
  await page.get_by_label('Find a decal',exact=True).fill('1996')
  assert await page.locator('.decal-card').count()==2
  await page.locator('[data-decal-id="1996-pink"] button:first-of-type').click()
  assert await page.locator('[data-decal-id="1996-pink"]').get_attribute('data-selected')=='true'
  assert await page.locator('.decal-current').get_by_role('status').text_content()=='Renewal decal: 1996 · pink'
  assert await page.get_by_label('Gallery decal month',exact=True).input_value()=='APR'
  preview=page.locator('.decal-current-plate svg')
  assert await preview.locator('[data-role="renewal-decal"]').count()==1
  await page.screenshot(path=str(out/'gallery-desktop.png'),full_page=True)
  await page.get_by_role('button',name='Back to current plate',exact=True).click()
  assert await page.locator('#field-serial').input_value()=='XXH-578'
  after=await page.locator('.inspector select').evaluate_all('(els)=>Object.fromEntries(els.map(e=>[e.id,e.value]))')
  assert after=={**settings,'field-decal':'1996-pink'},(settings,after)
  svg=page.locator('.plate-preview svg').first
  for kind in ['SVG','PNG']:
   async with page.expect_download() as download:
    await page.get_by_role('button',name=kind,exact=True).click()
   target=out/('applied-decal.'+kind.lower());await(await download.value).save_as(str(target))
   if kind=='SVG':
    text=target.read_text();assert 'data-role="renewal-decal"' in text and '#c62f76' in text
   else:
    with Image.open(target) as im:
     rgb=im.convert('RGB');w,h=im.size
     pink=sum(1 for y in range(int(h*.74),int(h*.96)) for x in range(int(w*.3),int(w*.7)) if (lambda c:c[0]>100 and c[0]>c[1]*1.5 and c[2]>c[1]*1.5)(rgb.getpixel((x,y))))
     assert pink>30,pink
  await page.get_by_role('tab',name='Decals',exact=True).filter(visible=True).click()
  await page.get_by_role('button',name='Clear decal',exact=True).click()
  assert not await page.locator('.decal-current-plate [data-role="renewal-decal"]').count()
  await page.set_viewport_size({'width':390,'height':844})
  await page.get_by_label('Find a decal',exact=True).fill('1986')
  await page.locator('[data-decal-id="1986"] button:first-of-type').click()
  assert await page.locator('.decal-current-plate [data-role="renewal-decal"]').count()==1
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  await page.screenshot(path=str(out/'gallery-mobile.png'),full_page=True)
  await page.get_by_label('Find a decal',exact=True).fill('')
  await page.get_by_label('Choices for this plate',exact=True).check()
  await page.evaluate("location.hash='#/decals/ca-bc/carrier-passenger-2005'")
  await page.locator('.decal-current-plate [data-source="user-supplied-bc-flag-svg"]').wait_for()
  await page.locator('.decal-card').first.wait_for()
  assert await page.locator('.decal-card').count()==count, 'hidden compatibility filter must not empty the new class'
  assert await page.locator('.decal-card button:enabled').count()==0
  assert await page.locator('.decal-current-plate [data-source="user-supplied-bc-flag-svg"]').count()==1
  await page.goto(base+'#/ca-ab/standard')
  await page.locator('.plate-preview svg').wait_for()
  assert not await page.get_by_role('tab',name='Decals',exact=True).count()
  assert not errors and not failed,(errors,failed)
  result={'date':'2026-10-06','site':base,'references':count,'supportedOn1985Base':supported,'sameYearVariantApplied':True,'serialMonthStylePreserved':True,'clearDecal':True,'svg':True,'png':True,'mobile':True,'carrierExcludedFromPassengerDecals':True,'unavailableProvinceHasNoDecalTab':True,'errors':errors,'failedResources':failed}
  report=Path(os.environ.get('DECAL_REPORT',root/'docs/research/province-decal-gallery/browser-verification.json'));report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps(result));await browser.close()
asyncio.run(main())
