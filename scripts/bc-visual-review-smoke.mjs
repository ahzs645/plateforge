/** Exercise the published report, its source assets, controls and mobile layout. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(path.resolve(process.env.TYPOGRAPHY_BROWSER_DEPS??'package.json'));
const engines=require('playwright'),name=process.env.TYPOGRAPHY_BROWSER??'chromium';
const port=Number(process.env.BC_VISUAL_PORT??4177),origin='http://127.0.0.1:'+port;
const evidence=path.resolve('typography-evidence/bc-report-browser-'+name);await mkdir(evidence,{recursive:true});
const manifest=JSON.parse(await readFile('public/bc-visual-review/manifest.json','utf8'));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff'};
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');assert(url.pathname.startsWith('/plateforge/'));
  let relative=decodeURIComponent(url.pathname.slice('/plateforge/'.length));if(!relative||relative.endsWith('/'))relative+='index.html';
  const root=path.resolve('dist'),file=path.resolve(root,relative);assert(file.startsWith(root+path.sep));
  res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404).end('not found');}});
let browser;
try{
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));browser=await engines[name].launch();
  const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto(origin+'/plateforge/#/ca-bc/1985-flag');
  const link=page.getByRole('link',{name:'Compare B.C. logos and source photographs'});await link.waitFor();
  assert.equal(await link.getAttribute('href'),'/plateforge/bc-visual-review/');
  await page.goto(origin+'/plateforge/bc-visual-review/');await page.locator('#title').filter({hasText:'1914'}).waitFor();
  await page.locator('#category').selectOption('all');
  for(const row of manifest.cases){
    await page.locator('#specimen').selectOption(row.id);await page.waitForFunction(title=>document.getElementById('title').textContent===title,row.title);
    await page.locator('#source').evaluate(im=>im.decode());
    const metadata=JSON.parse(await page.locator('#metadata').textContent());
    assert.match(metadata.referenceBytesSha256,/^[a-f0-9]{64}$/);assert(metadata.referenceByteScope);
    for(const mode of ['branch','source','difference',...(row.focus?['shape']:[])]){
      await page.locator('#mode').selectOption(mode);
      if(mode!=='difference'||row.difference.changedFraction>0.001)assert(await page.locator('#overlay').evaluate(el=>{const data=el.getContext('2d').getImageData(0,0,900,500).data;return data.some((v,i)=>i%4!==3&&v<240)}),row.id+' '+mode+' empty overlay');
    }
    if(['flag1989','centennial1986','lgcrest','decal-1970','decal-1976','decal-2014','apec149','carrier2005','collector-motorcycle'].includes(row.id)){await page.locator('#mode').selectOption('source');await page.locator('.overlay').screenshot({path:path.join(evidence,row.id+'.png')});}
  }
  await page.locator('#specimen').selectOption('flag1989');await page.waitForFunction(()=>document.getElementById('title').textContent.includes('Astrographic Classic'));
  await page.locator('#mode').selectOption('source');
  await page.locator('#opacity').focus();await page.locator('#opacity').press('End');assert.equal(await page.locator('#opacity').inputValue(),'1');
  await page.getByRole('button',{name:'Reset alignment'}).click();assert.equal(await page.locator('#opacity').inputValue(),'0.5');
  await page.getByRole('button',{name:'Blink',exact:true}).click();assert.equal(await page.locator('#blink').getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Blink',exact:true}).click();assert.equal(await page.locator('#blink').getAttribute('aria-pressed'),'false');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Save overlay PNG'}).click()]);
  await download.saveAs(path.join(evidence,'download.png'));assert((await readFile(path.join(evidence,'download.png'))).subarray(1,4).equals(Buffer.from('PNG')));
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await page.screenshot({path:path.join(evidence,'mobile.png'),fullPage:true});
  // Playwright WebKit rejects even a tiny file:// page with setOffline(true).
  // For that engine block HTTP instead, and assert the file attempts no network.
  const offlineRequests=[];
  await context.route(/^https?:/,route=>{offlineRequests.push(route.request().url());return route.abort()});
  await context.setOffline(name!=='webkit');await page.goto(pathToFileURL(path.resolve('typography-evidence/bc-visual/offline.html')).href);
  await page.locator('#title').filter({hasText:'1914'}).waitFor();await page.locator('#category').selectOption('all');
  for(const index of [...new Set([0,21,42,63,84,manifest.cases.length-1])]){
    const row=manifest.cases[index];await page.locator('#specimen').selectOption(row.id);await page.waitForFunction(title=>document.getElementById('title').textContent===title,row.title);
    assert((await page.locator('#source').getAttribute('src')).startsWith('data:image/'));await page.locator('#mode').selectOption('source');
  }
  assert.deepEqual(offlineRequests,[]);assert.deepEqual(errors,[]);
  console.log(`${name}: ${manifest.cases.length} specimens, every comparison mode, inspector link, keyboard, blink, download, mobile and offline atlases passed.`);
}finally{await browser?.close();server.close();}
