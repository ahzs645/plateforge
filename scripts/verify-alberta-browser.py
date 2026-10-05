#!/usr/bin/env python3
import asyncio,json,os
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1];out=Path('/tmp/plateforge-alberta-qa');out.mkdir(exist_ok=True)
async def main():
 base=os.environ.get('ALBERTA_SITE','http://127.0.0.1:5176/plateforge/');errors=[];failed=[];cases=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=await browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
  for id,serial,art in [('standard','CKZ-3449','script'),('wild-rose-1984','PWG-542','geometric'),('wild-rose-geometric-2010','BCJ-8178','geometric'),('moraine-lake-2026','DBD-2026',None)]:
   await page.set_viewport_size({'width':1440,'height':1000});await page.goto(base+'?alberta-artwork=20261005#/ca-ab/'+id)
   svg=page.locator('.plate-preview svg').first;await svg.wait_for();await page.locator('#field-serial').fill(serial);await page.wait_for_timeout(100)
   assert not await page.locator('#field-serial[aria-invalid=true]').count()
   if art:
    assert await svg.locator('[data-artwork="alberta-'+art+'"]').count()==1
    assert await svg.locator('[data-artwork="alberta-rose"]').count()==1
    assert not await svg.locator('text').filter(has_text='Alberta').count()
    assert not await svg.locator('text').filter(has_text='Government').count()
    slogan=svg.locator('[data-role="alberta-slogan"]');assert await slogan.count()==1
    assert await slogan.get_attribute('data-die')=='ab-avant-garde-slogan'
    assert await slogan.locator('path:not([d=""])').count()==15
    assert not await svg.locator('text').filter(has_text='Wild Rose Country').count()
    assert await slogan.evaluate('(el)=>{const b=el.getBBox();return b.x>140&&b.x+b.width<450&&b.y>250&&b.y+b.height<290}')
   else:assert not await svg.locator('[data-artwork^="alberta-"]').count()
   if id=='wild-rose-1984':assert await svg.locator('[data-emblem="square-dot"]').count()==1
   await svg.screenshot(path=str(out/(id+'.png')))
   for kind in ['SVG','PNG']:
    async with page.expect_download() as d:await page.get_by_role('button',name=kind,exact=True).click()
    file=out/(id+'.'+kind.lower());await(await d.value).save_as(str(file))
    if kind=='SVG' and art:assert 'data-artwork="alberta-'+art+'"' in file.read_text()
    if kind=='SVG' and art:
     assert 'data-role="alberta-slogan"' in file.read_text()
     assert 'data-reconstructed-alternates="W e t y"' in file.read_text()
    if kind=='PNG':
     with Image.open(file) as im:
      assert im.width>100 and im.height>50
      if id=='standard':
       rgb=im.convert('RGB');blue=[]
       for y in range(int(im.height*.3)):
        for x in range(int(im.width*.2),int(im.width*.65)):
         r,g,b=rgb.getpixel((x,y))
         if b>90 and b>r*1.4 and b>g*1.2:blue.append(y);break
       assert blue and min(blue)>im.height*.01,('script header touches/clips the top edge',min(blue) if blue else None)
      if art:
       rgb=im.convert('RGB');ys=[]
       for y in range(int(im.height*.83),int(im.height*.97)):
        for x in range(int(im.width*.24),int(im.width*.76)):
         r,g,b=rgb.getpixel((x,y))
         if b>80 and b>r*1.4 and b>g*1.2:ys.append(y);break
       assert ys and min(ys)<im.height*.87 and max(ys)<im.height*.97,('missing or clipped slogan',ys)
   await page.set_viewport_size({'width':390,'height':844});assert await svg.is_visible();assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   cases.append({'id':id,'serial':serial,'wordmark':art,'svg':True,'png':True,'mobile':True})
  await page.goto(base+'alberta-artwork-review/');await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)');assert await page.locator('article').count()==3
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert await page.locator('#slogan img').count()==2
  await page.set_viewport_size({'width':1440,'height':1000})
  for id in ['geometric','geometric-seven','script']:
   card=page.locator('#'+id);await card.screenshot(path=str(out/('comparison-'+id+'.png')))
  result={'site':base,'date':'2026-10-05','cases':cases,'allComparisonImagesLoaded':True,'sourceComparisons':3,'userReferenceSerials':2,'sloganDefaultAndReconstructedComparison':True,'outlinedSloganExports':3,'mobile':True,'errors':errors,'failedResources':failed}
  assert not errors and not failed,(errors,failed)
  report=Path(os.environ.get('ALBERTA_REPORT',root/'docs/research/alberta-artwork/browser-verification.json'));report.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));await browser.close()
asyncio.run(main())
