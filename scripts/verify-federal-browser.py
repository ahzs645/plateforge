#!/usr/bin/env python3
"""Verify every federal preset and every source/current reference on a built site."""
import asyncio,json,os,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1];ledger=json.loads((root/'docs/research/canada-federal/inventory.json').read_text());out=Path('/tmp/plateforge-federal-qa');out.mkdir(exist_ok=True)
async def main():
 base=os.environ.get('FEDERAL_SITE','http://127.0.0.1:5176/plateforge/');cases=[];errors=[];failed=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.on('response',lambda response:failed.append(response.url) if response.status>=400 else None)
  specs=[dict(id='standard'),dict(id='apec-1997')]+ledger['presets']
  for spec in specs:
   await page.set_viewport_size({'width':1440,'height':1000})
   await page.goto(base+'?federal-review=20261005#/ca-federal/'+spec['id']);svg=page.locator('.plate-preview svg');await svg.wait_for()
   if spec.get('example') and await page.locator('#field-serial').count():
    await page.locator('#field-serial').fill(spec['example']);await page.wait_for_timeout(100)
   meta=json.loads(await svg.locator('metadata').text_content())
   assert meta['jurisdiction']=='CA',(spec['id'],meta)
   assert (await svg.get_attribute('aria-label')).startswith('Canada ·')
   assert meta['status']==spec.get('status','issued'),(spec['id'],meta['status'])
   assert not await page.locator('#field-serial[aria-invalid=true]').count(),spec['id']
   await svg.screenshot(path=str(out/(spec['id']+'.png')))
   for kind in ['SVG','PNG']:
    async with page.expect_download() as download:await page.get_by_role('button',name=kind,exact=True).click()
    saved=out/(spec['id']+'.'+kind.lower());await(await download.value).save_as(str(saved))
    if kind=='SVG':assert '"jurisdiction":"CA"' in saved.read_text()
    else:
     with Image.open(saved) as image:assert image.width>10 and image.height>10
   await page.set_viewport_size({'width':390,'height':844})
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),spec['id']
   assert await svg.is_visible()
   cases.append(dict(id=spec['id'],jurisdiction='CA',status=meta['status'],svg=True,png=True,mobile=True))
  await page.set_viewport_size({'width':1440,'height':1000})
  await page.goto(base+'federal-reference-review/');assert await page.locator('article').count()==41
  await page.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')")
  await page.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)')
  for ref in ledger['references']:
   card=page.locator('#'+ref['id'])
   await card.locator('.pair figure').nth(1).locator('img').screenshot(path=str(out/(ref['id']+'.png')))
   await card.locator('summary').click()
   slider=card.locator('input[type=range]');await slider.fill('80');await slider.dispatch_event('input')
   assert await card.locator('.reproduction').evaluate('e=>getComputedStyle(e).opacity')=='0.8'
   await card.locator('summary').click()
  groups={}
  for family in ['fisheries','domestic','overseas','attachments','all']:
   await page.locator('#family').select_option(family)
   actual=await page.locator('article:not(.hidden)').count()
   expected=41 if family=='all' else sum(r['preset'] in {s['id'] for s in ledger['presets'] if s['family']==family} for r in ledger['references'])
   assert actual==expected,(family,actual,expected);groups[family]=actual
  await page.set_viewport_size({'width':390,'height':844})
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  for spec in ledger['presets']:assert await page.locator('#'+spec['id']).count()==1
  await page.locator('#ref-01').get_by_role('link',name='Open editable design').click();await page.wait_for_selector('.plate-preview svg');assert '#/ca-federal/fisheries-tabs' in page.url
  assert not errors and not failed,(errors,failed)
  result=dict(site=base,reviewDate=ledger['reviewDate'],presets=cases,photographicOccurrences=41,allReferenceImagesLoaded=True,allOpacityControls=True,groups=groups,mobile=True,errors=errors,failedResources=failed)
  target=Path(os.environ.get('FEDERAL_REPORT',root/'docs/research/canada-federal/browser-verification.json'));target.write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps(dict(site=base,presets=len(cases),exports=2*len(cases),photographicOccurrences=41,groups=groups,mobile=True,errors=errors,failedResources=failed)))
  await browser.close()
 # Source/current contact sheets for manual visual review; source photos are never traces.
 for start in range(0,41,10):
  subset=ledger['references'][start:start+10];sheet=Image.new('RGB',(1000,185*len(subset)),'#f4f5f8');draw=ImageDraw.Draw(sheet)
  for i,ref in enumerate(subset):
   draw.text((12,i*185+7),ref['id']+' '+ref['serial']+' · '+ref['preset'],fill='#222')
   for x,imagepath in [(12,root/'public/federal-reference-review/photos'/(ref['id']+'.jpg')),(515,out/(ref['id']+'.png'))]:
    with Image.open(imagepath) as image:
     image=image.convert('RGBA');image.thumbnail((465,145));sheet.paste(image,(x,i*185+32),image)
  sheet.save(out/f'contact-{start//10+1}.png')
asyncio.run(main())
