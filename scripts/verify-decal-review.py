#!/usr/bin/env python3
"""Check every published comparison, modern geometry and portable plate exports."""
import asyncio, ctypes as C, json, os
from pathlib import Path
from PIL import Image, ImageOps
from playwright.async_api import async_playwright

root=Path(__file__).resolve().parents[1]
out=Path('/tmp/plateforge-decal-review-qa');out.mkdir(exist_ok=True)

def decode(path):
 z=C.CDLL('libzbar.so.0')
 for name,args,ret in [('zbar_image_scanner_create',[],C.c_void_p),('zbar_image_scanner_destroy',[C.c_void_p],None),('zbar_image_create',[],C.c_void_p),('zbar_image_set_format',[C.c_void_p,C.c_ulong],None),('zbar_image_set_size',[C.c_void_p,C.c_uint,C.c_uint],None),('zbar_image_set_data',[C.c_void_p,C.c_void_p,C.c_ulong,C.c_void_p],None),('zbar_scan_image',[C.c_void_p,C.c_void_p],C.c_int),('zbar_image_first_symbol',[C.c_void_p],C.c_void_p),('zbar_symbol_get_data',[C.c_void_p],C.c_char_p),('zbar_symbol_next',[C.c_void_p],C.c_void_p),('zbar_image_destroy',[C.c_void_p],None)]:
  f=getattr(z,name);f.argtypes=args;f.restype=ret
 scanner=z.zbar_image_scanner_create();found=[]
 with Image.open(path) as im:
  gray=im.convert('L')
  for scale in [1,3]:
   img=ImageOps.expand(gray.resize((gray.width*scale,gray.height*scale)),border=50,fill=255)
   buf=C.create_string_buffer(img.tobytes());obj=z.zbar_image_create()
   z.zbar_image_set_format(obj,ord('Y')|(ord('8')<<8)|(ord('0')<<16)|(ord('0')<<24));z.zbar_image_set_size(obj,*img.size)
   z.zbar_image_set_data(obj,C.cast(buf,C.c_void_p),len(img.tobytes()),None);z.zbar_scan_image(scanner,obj)
   sym=z.zbar_image_first_symbol(obj)
   while sym:
    found.append(z.zbar_symbol_get_data(sym).decode());sym=z.zbar_symbol_next(sym)
   z.zbar_image_destroy(obj)
 z.zbar_image_scanner_destroy(scanner)
 return sorted(set(found))

async def main():
 base=os.environ.get('DECAL_SITE','http://127.0.0.1:5176/plateforge/');errors=[];failed=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
  await page.goto(base+'bc-decal-review/')
  await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
  assert await page.locator('article').count()==55
  assert await page.locator('article img').count()==165
  await page.locator('#decal-2022').scroll_into_view_if_needed()
  await page.screenshot(path=str(out/'modern-side-by-side.png'))
  records=(await(await page.request.get(base+'data/decal-review/review.json')).json())['records']
  bounds=[]
  for record in records:
   svg=await(await page.request.get(base+'data/decal-review/current/'+record['id']+'.svg')).text()
   await page.evaluate('(svg)=>{let el=document.getElementById("measurement");if(!el){el=document.createElement("div");el.id="measurement";el.style="position:fixed;left:-10000px";document.body.append(el)}el.innerHTML=svg}',svg)
   finding=await page.evaluate('''()=>{
    const svg=document.querySelector('#measurement svg');const view=svg.viewBox.baseVal;
    const years=Array.from(svg.querySelectorAll('[data-role="decal-year"]'));
    const bar=svg.querySelector('[data-role="decal-barcode"]');const control=svg.querySelector('[data-role="decal-serial"]');
    function box(el){const b=el.getBBox();return {x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height}}
    return {year:years.map(el=>el.getAttribute('aria-label')).join(''),bar:bar?box(bar):null,control:control?box(control):null,viewWidth:view.width};
   }''')
   assert record['year']==1986 or finding['year']==(str(record['year']) if record['year']>=2014 else str(record['year'])[2:]),(record['id'],finding)
   if record['year']>=2009:
    assert finding['bar']['right']+1 < finding['control']['x'],(record['id'],finding)
    assert finding['control']['right']<=finding['viewWidth']+1,(record['id'],finding)
    bounds.append({'id':record['id'],**finding})
  await page.goto(base+'#/ca-bc/2014-flag')
  await page.locator('#field-serial').wait_for();serial=await page.locator('#field-serial').input_value()
  await page.get_by_role('tab',name='Decals',exact=True).filter(visible=True).click()
  card=page.locator('[data-decal-id="2022"]')
  await card.get_by_role('button',name='Use photographed text on plate',exact=True).click()
  assert await page.get_by_label('Gallery decal month',exact=True).input_value()=='MAR'
  assert await page.get_by_label('Gallery decal control',exact=True).input_value()=='72919128'
  await page.get_by_label('Gallery decal control',exact=True).fill('12345678')
  await page.get_by_role('button',name='Back to current plate',exact=True).click()
  assert await page.locator('#field-serial').input_value()==serial
  assert await page.locator('#field-decalSerial').input_value()=='12345678'
  for kind in ['SVG','PNG']:
   async with page.expect_download() as download:await page.get_by_role('button',name=kind,exact=True).click()
   target=out/('modern-plate.'+kind.lower());await(await download.value).save_as(str(target))
  svg=(out/'modern-plate.svg').read_text()
  assert 'data-control="12345678"' in svg and 'aria-label="2022"' in svg
  assert decode(out/'modern-plate.png')==['12345678']
  await page.get_by_role('tab',name='Decals',exact=True).filter(visible=True).click()
  await page.set_viewport_size({'width':390,'height':844})
  for card in await page.locator('.decal-card').all():
   await card.scroll_into_view_if_needed();await card.locator('img').evaluate('(i)=>i.decode()')
  assert await page.locator('.decal-card img').count()==55
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  await page.locator('[data-decal-id="2022"]').scroll_into_view_if_needed()
  await page.screenshot(path=str(out/'modern-gallery-mobile.png'))
  assert not errors and not failed,(errors,failed)
  result={'date':'2026-10-06','site':base,'individualComparisons':55,'loadedComparisonImages':165,'mobileSourceImages':55,'modernFooterBounds':bounds,'photographedTextApplied':True,'plateSerialPreserved':True,'svgExport':True,'pngExportDecodedControl':'12345678','errors':errors,'failedResources':failed}
  report=Path(os.environ.get('DECAL_REVIEW_REPORT',root/'docs/research/decal-review/browser-verification.json'));report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps({k:v for k,v in result.items() if k!='modernFooterBounds'}));await browser.close()

asyncio.run(main())
