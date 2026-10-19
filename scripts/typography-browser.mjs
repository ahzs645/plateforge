/** Real-browser font, raster-export and application checks. No font software is written to evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
const require=createRequire(path.resolve(process.env.TYPOGRAPHY_BROWSER_DEPS??'package.json'));
const {chromium,firefox,webkit}=require('playwright');
const {PNG}=require('pngjs');
const {default:pixelmatch}=await import(require.resolve('pixelmatch'));
const browserName=process.env.TYPOGRAPHY_BROWSER??'chromium';
const requested=(process.env.TYPOGRAPHY_SPECIMENS??'').split(',').filter(Boolean);
const out=path.resolve('typography-evidence/browser-'+browserName+(requested.length?'-targeted':''));await mkdir(out,{recursive:true});
const html=path.resolve('typography-harness.html');
await writeFile(html,'<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:white}svg{display:block;max-width:none}</style></head><body><div id="plate"></div><script type="module" src="/scripts/typography-browser-harness.tsx"></script></body></html>');
try{await build({configFile:false,plugins:[react()],base:'/qa/',publicDir:false,logLevel:'warn',build:{outDir:'qa-dist',emptyOutDir:true,rolldownOptions:{input:html}}});}finally{await rm(html,{force:true});}
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');const qa=url.pathname.startsWith('/qa/');
  const root=path.resolve(qa?'qa-dist':'dist');const relative=decodeURIComponent(url.pathname.replace(qa?'/qa/':'/plateforge/',''));
  const file=path.resolve(root,relative||(qa?'typography-harness.html':'index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');res.end(bytes);
}catch{res.writeHead(404).end('not found');}});
const browser=await ({chromium,firefox,webkit}[browserName]).launch({headless:true});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4173,'127.0.0.1',resolve);});
const results={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),browser:browserName,browserVersion:browser.version(),checks:[],formats:[],errors:[]};
function pixels(a,b){
 const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.width,y.width);assert.equal(x.height,y.height);
 let changed=0,total=0;for(let i=0;i<x.data.length;i+=4){let delta=0;for(let c=0;c<3;c++){
   const A=x.data[i+c]*x.data[i+3]/255+255-x.data[i+3],B=y.data[i+c]*y.data[i+3]/255+255-y.data[i+3];
   delta=Math.max(delta,Math.abs(A-B));total+=Math.abs(A-B);
   // The screenshot has a white page behind it; PNG cutouts are transparent.
   // Compare both on white, rather than Pixelmatch's transparency backdrop.
   x.data[i+c]=Math.round(A);y.data[i+c]=Math.round(B);
 }x.data[i+3]=255;y.data[i+3]=255;if(delta>16)changed++;}
 return {pixels:x.width*x.height,changedFraction:changed/(x.width*x.height),meanAbsoluteChannelError:total/(x.width*x.height*3),
   perceptualChangedFraction:pixelmatch(x.data,y.data,null,x.width,x.height,{threshold:0.1,includeAA:false})/(x.width*x.height)};
}
async function check(name,fn){try{const detail=await fn();results.checks.push({name,status:'passed',...detail});}catch(e){results.errors.push({name,error:String(e),stack:e.stack});results.checks.push({name,status:'failed'});console.error(name,e);}}
try{
 const context=await browser.newContext({viewport:{width:1500,height:1050},deviceScaleFactor:1,acceptDownloads:true});
 const page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>results.errors.push({name:'pageerror',error:String(e)}));
 await page.goto('http://127.0.0.1:4173/qa/');await page.waitForFunction(()=>!!window.typographyQA);
 const formats=await page.evaluate(()=>window.typographyQA.formats);
 assert.equal(formats.length,878);assert.equal(new Set(formats.map(f=>f.region+'/'+f.format)).size,formats.length);
 const representatives=[...new Map(formats.map(f=>[f.template,f])).values()];
 const extra=formats.filter(f=>['ca-bc','ca-nu','ca-ab','ca-nt','us-ca','eu-de','eu-gb','kr','jp','cn'].includes(f.region)&&!f.format.startsWith('stand-in-')).filter(f=>/^(standard|reflective|2020|electric|green|1951|1930|1964|1978|1979-first|1985|2001-flag|1985-flag|moraine-lake|spectacular)$/.test(f.format));
 const corrections=JSON.parse(await readFile('docs/research/bc-visual-review/cases.json','utf8')).filter(row=>['apec1997','apec149','apec134','carrier2005','bicycle-prince-george-1953','bicycle-prince-george-1959','collector-passenger','collector-multi','collector-motorcycle'].includes(row.id)).map(row=>({region:'ca-bc',format:row.format,parts:row.parts,specimen:row.id}));
 const dates=[['2014','NOV','99103688'],['2017','JUL','20093481'],['2023','MAY','12345678']].map(([decal,decalMonth,decalSerial])=>({region:'ca-bc',format:'2001-flag',parts:{decal,decalMonth,decalSerial},specimen:'renewal-'+decal}));
 const selected=[...new Map([...representatives,...extra].map(f=>[f.region+'/'+f.format,f])).values(),...corrections,...dates];
 const cases=requested.length?selected.filter(f=>requested.includes(f.specimen)):selected;
 assert.ok(cases.length,'No selected export specimens');
 for(const f of cases)await check('raster parity '+f.region+'/'+f.format+(f.specimen?' '+f.specimen:''),async()=>{
   const info=await page.evaluate(f=>window.typographyQA.render(f.region,f.format,f.parts??{},f.region==='ca-bc'),f);
   if(f.specimen==='carrier2005')assert(await page.evaluate(()=>{
     const svg=document.querySelector('#plate svg'),well=svg.querySelector('rect[fill="#eef0ee"]').getBBox();
     const left=svg.querySelector('[data-role="class-left"]').getBBox(),right=svg.querySelector('[data-role="class-right"]').getBBox();
     return left.x+left.width<well.x-.5&&right.x>well.x+well.width+.5;
   }),'Carrier labels collide with renewal panel');
   await page.locator('#plate svg').first().evaluate(el=>{const {width,height}=el.viewBox.baseVal;el.style.width=Math.round(width)+'px';el.style.height=Math.round(height)+'px';});
   const data=await page.evaluate(()=>window.typographyQA.export());
   const name=(f.region+'-'+f.format+(f.specimen?'-'+f.specimen:'')).replace(/[^a-z0-9-]/gi,'_');
   const inline=await page.locator('#plate svg').first().screenshot();const png=Buffer.from(data.png.split(',')[1],'base64');
   const delta=pixels(inline,png);
   await writeFile(path.join(out,name+'-inline.png'),inline);await writeFile(path.join(out,name+'-export.png'),png);
   const tesla=PNG.sync.read(Buffer.from(data.tesla.split(',')[1],'base64'));assert.equal(tesla.width,400);assert.equal(tesla.height,info.width/info.height>=3?100:200);
   assert.equal(data.metadata.systemFamilies.length,0,'Unexpected unbundled system font');
   // Page and SVG-image engines rasterize outline edges differently (notably
   // WebKit). Keep raw deltas as evidence and exclude antialias-only pixels.
   assert.ok(delta.perceptualChangedFraction<0.025,JSON.stringify(delta));
   return {region:f.region,format:f.format,info,delta,metadata:data.metadata,svgBytes:data.svgBytes};
 });
 if(!requested.length){
 const specimens=[
 ['barlow600','Barlow Condensed','ABC 0123456789',600,'normal'],['barlow500','Barlow Condensed','EL 13579',500,'normal'],
 ['barlow700italic','Barlow Condensed','BEAUTIFUL 2026',700,'italic'],['antonio-ext','Antonio','ĀČŁŐŞȚŽ 0123',500,'normal'],
 ['cn','Noto Sans SC','京粤警学港澳使领',700,'normal'],['jp','Noto Sans JP','品川横浜なあ東京',600,'normal'],
 ['kr','Noto Sans KR','서울경기가허하호',700,'normal'],['syllabics','Noto Sans Canadian Aboriginal','ᓄᓇᕗᑦ',700,'normal'],
 ['sans-italic','Noto Sans','Wild Rose Country',700,'italic'],['serif-italic','Noto Serif','Beautiful British',400,'italic'],
 ['script','Pinyon Script','California',400,'normal'],['euro-umlauts','EuroPlate','GÖ ÄÜ 1234',400,'normal'],
 ['uk-fallback','UKNumberPlate, "Barlow Condensed"','AB-123',400,'normal']
 ];
 // Each sample gets a new document/cache, and each raster path is tested first.
 // These assert real production output; no experimental warmup or timing sleep.
 for(const firstRaster of ['png','tesla'])for(const [name,family,text,weight,style] of specimens)await check('cold '+firstRaster+' '+name,async()=>{
   const fresh=await browser.newContext({viewport:{width:1500,height:1050},deviceScaleFactor:1});
   try{
     const cold=await fresh.newPage();
     cold.on('pageerror',e=>results.errors.push({name:'cold pageerror',error:String(e)}));
     await cold.goto('http://127.0.0.1:4173/qa/');await cold.waitForFunction(()=>!!window.typographyQA);
     await cold.evaluate(a=>window.typographyQA.specimen(...a),[family,text,weight,style]);
     const inline=await cold.locator('#plate svg').screenshot();
     const data=await cold.evaluate(first=>window.typographyQA.export(first),firstRaster);
     const delta=pixels(inline,Buffer.from(data.png.split(',')[1],'base64'));
     assert.ok(delta.changedFraction<0.01,JSON.stringify(delta));
     const standalone=await fresh.newPage();
     await standalone.goto('data:image/svg+xml;base64,'+Buffer.from(data.svg).toString('base64'));
     await standalone.evaluate(()=>document.fonts.ready);
     const svgDelta=pixels(inline,await standalone.locator('svg').screenshot());
     assert.ok(svgDelta.changedFraction<0.01,JSON.stringify(svgDelta));
     // Use preview pixels at the encoder's working resolution, then downsample
     // them. Comparing with a low-resolution screenshot would mistake different
     // antialiasing for missing glyphs.
     const tesla=PNG.sync.read(Buffer.from(data.tesla.split(',')[1],'base64'));
     const target=await cold.evaluate(({width,height})=>{
       const svg=document.querySelector('#plate svg');
       const {width:w,height:h}=svg.viewBox.baseVal,scale=Math.min(width/w,height/h);
       svg.style.cssText=`width:${Math.round(w*scale*4)}px;height:${Math.round(h*scale*4)}px`;
       return {width,height,x:(width-w*scale)/2,y:(height-h*scale)/2,w:w*scale,h:h*scale};
     },{width:tesla.width,height:tesla.height});
     const preview=await cold.locator('#plate svg').screenshot();
     const reference=await cold.evaluate(async({target,png})=>{
       const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
       const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;};
       const draw=(c,image,...rect)=>{const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,...rect);};
       let source=image;
       while(source.width>target.w*2){const half=canvas(source.width/2,source.height/2);draw(half,source,0,0,half.width,half.height);source=half;}
       const result=canvas(target.width,target.height);draw(result,source,target.x,target.y,target.w,target.h);return result.toDataURL();
     },{target,png:preview.toString('base64')});
     const referenceBytes=Buffer.from(reference.split(',')[1],'base64'),teslaBytes=Buffer.from(data.tesla.split(',')[1],'base64');
     const teslaDelta=pixels(referenceBytes,teslaBytes);
     // SVG-as-image and page screenshots can hint scaled text differently.
     // Pixelmatch excludes antialias edges while retaining wrong/missing glyphs.
     if(teslaDelta.perceptualChangedFraction>=0.01){
       await writeFile(path.join(out,'cold-'+firstRaster+'-'+name+'-reference.png'),Buffer.from(reference.split(',')[1],'base64'));
       await writeFile(path.join(out,'cold-'+firstRaster+'-'+name+'-export.png'),Buffer.from(data.tesla.split(',')[1],'base64'));
     }
     assert.ok(teslaDelta.perceptualChangedFraction<0.01,JSON.stringify(teslaDelta));
     return {delta,svgDelta,teslaDelta};
   }finally{await fresh.close();}
 });
 for(const [name,family,text,weight,style] of specimens)await check('font specimen '+name,async()=>{
   const info=await page.evaluate(a=>window.typographyQA.specimen(...a),[family,text,weight,style]);
   const data=await page.evaluate(()=>window.typographyQA.export());const inline=await page.locator('#plate svg').screenshot();
   const png=Buffer.from(data.png.split(',')[1],'base64'),delta=pixels(inline,png);
   await writeFile(path.join(out,'font-'+name+'-inline.png'),inline);await writeFile(path.join(out,'font-'+name+'-export.png'),png);
   assert.equal(info.systems.length,0);assert.ok(delta.changedFraction<0.01,JSON.stringify(delta));
   return {info,delta,metadata:data.metadata};
 });
 if(browserName==='chromium')for(const [i,f] of formats.entries()){
   try{const row=await page.evaluate(f=>window.typographyQA.render(f.region,f.format,{},false),f);results.formats.push({...f,...row});}
   catch(e){results.errors.push({name:'format '+f.region+'/'+f.format,error:String(e)});}
   if(i%100===0)console.log('Browser format coverage',i,'/',formats.length);
 }
 await check('unsupported Antonio character blocks portable export',async()=>{
   const info=await page.evaluate(()=>window.typographyQA.specimen('Antonio','Ŋ',500,'normal'));
   assert.ok(info.systems.length>0);
   const error=await page.evaluate(async()=>{try{await window.typographyQA.export();return null;}catch(e){return String(e);}});
   assert.match(error,/unsupported or unbundled lettering/);return {error};
 });
 const app=await context.newPage();app.setDefaultTimeout(20000);
 app.on('pageerror',e=>results.errors.push({name:'app pageerror',error:String(e)}));
 await check('production UI downloads and navigation',async()=>{
   const examples=representatives.filter(f=>!['bc-historical','standin'].includes(f.template));
   let downloads=0;const metadata=[];
   for(const f of examples){
     await app.goto(`http://127.0.0.1:4173/plateforge/#/${f.region}/${f.format}`);
     await app.locator('.plate-preview svg').waitFor();await app.evaluate(()=>document.fonts.ready);
     const dl=app.waitForEvent('download',{timeout:30000});await app.locator('.export-section').getByRole('button',{name:'SVG',exact:true}).click();
     const download=await dl;const svg=await readFile(await download.path(),'utf8');
     assert.ok(svg.includes('typography-export'));const m=await app.evaluate(source=>{
       const doc=new DOMParser().parseFromString(source,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('XML error');
       return JSON.parse(doc.querySelector('[data-role="typography-export"]').textContent);
     },svg);metadata.push(m);downloads++;await download.delete();
   }
   await app.goto('http://127.0.0.1:4173/plateforge/#/eu-de/standard');await app.locator('.plate-preview svg').waitFor();
   for(const kind of ['PNG','Tesla']){const dl=app.waitForEvent('download');await app.locator('.export-section').getByRole('button',{name:kind,exact:true}).click();
     const d=await dl;const png=PNG.sync.read(await readFile(await d.path()));assert.ok(png.width>0);downloads++;await d.delete();}
   return {downloads,metadata};
 });
 await check('cold font arrival preserves input focus',async()=>{
   const cold=await browser.newContext({viewport:{width:1400,height:1000}});const p=await cold.newPage();
   let release;const gate=new Promise(r=>release=r);await p.route(/\.(woff2?|ttf)(?:\?|$)/,async route=>{await gate;await route.continue();});
   await p.goto('http://127.0.0.1:4173/plateforge/#/eu-de/standard',{waitUntil:'domcontentloaded'});
   const input=p.locator('.inspector input.mono').first();await input.fill('GÖ');await input.focus();
   const identity=await input.evaluate(el=>{el.dataset.focusProof='same-node';return el.value;});release();
   await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   assert.deepEqual(await input.evaluate(el=>({focused:document.activeElement===el,value:el.value,identity:el.dataset.focusProof})),{focused:true,value:identity,identity:'same-node'});
   await cold.close();return {inputPreserved:true};
 });
 await check('research failure blocks export and explicit retry recovers',async()=>{
   const fresh=await browser.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
   try{
     const p=await fresh.newPage(),downloads=[];p.on('download',d=>downloads.push(d));
     await p.route(/research-registry[^/]*\.json$/,route=>route.fulfill({status:503,body:'unavailable'}));
     await p.goto('http://127.0.0.1:4173/plateforge/#/ca-bc/1940');
     await p.getByRole('button',{name:'Retry research glyphs',exact:true}).waitFor();
     await p.locator('.export-section').getByRole('button',{name:'SVG',exact:true}).click();
     await p.locator('.toast').filter({hasText:'Requested research glyphs are unavailable'}).waitFor();
     assert.equal(downloads.length,0);
     await p.unroute(/research-registry[^/]*\.json$/);
     await p.getByRole('button',{name:'Retry research glyphs',exact:true}).click();
     await p.waitForFunction(()=>document.querySelector('.plate-preview [data-research-unit]'));
     const dl=p.waitForEvent('download');await p.locator('.export-section').getByRole('button',{name:'SVG',exact:true}).click();
     const d=await dl,source=await readFile(await d.path(),'utf8');
     const metadata=await p.evaluate(source=>JSON.parse(new DOMParser().parseFromString(source,'image/svg+xml').querySelector('[data-role="typography-export"]').textContent),source);
     assert.equal(metadata.researchRequested,true);assert.match(metadata.researchRegistrySha256,/^[a-f0-9]{64}$/);assert.ok(metadata.researchUnits.length>0);
     await d.delete();return {blockedDownloads:0,recovered:true};
   }finally{await fresh.close();}
 });
 await check('editing during font preparation cancels the old export',async()=>{
   const fresh=await browser.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
   let release;const gate=new Promise(r=>release=r);
   try{
     const p=await fresh.newPage(),downloads=[];p.on('download',d=>downloads.push(d));
     await p.route(/\.(woff2?|ttf)(?:\?|$)/,async route=>{await gate;await route.continue();});
     await p.goto('http://127.0.0.1:4173/plateforge/#/eu-de/standard',{waitUntil:'domcontentloaded'});
     await p.locator('.plate-preview svg').waitFor();
     await p.locator('.export-section').getByRole('button',{name:'SVG',exact:true}).click();
     const input=p.locator('.inspector input.mono').first();await input.fill(await input.inputValue()==='B'?'M':'B');
     release();await p.locator('.toast').filter({hasText:'The plate changed while preparing the export'}).waitFor();
     assert.equal(downloads.length,0);return {staleDownloadBlocked:true};
   }finally{release();await fresh.close();}
 });
 await check('mobile viewport, typography panel and SVG download',async()=>{
   await app.setViewportSize({width:390,height:844});await app.goto('http://127.0.0.1:4173/plateforge/#/jp/standard');await app.locator('.plate-preview svg').waitFor();
   await app.evaluate(()=>document.fonts.ready);assert.ok(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await app.screenshot({path:path.join(out,'mobile-japan.png'),fullPage:true});
   await app.getByRole('button',{name:'Save',exact:true}).click();const dl=app.waitForEvent('download');await app.getByRole('menuitem',{name:'Save SVG',exact:true}).click();const d=await dl;await d.delete();
   return {width:390,overflow:false};
 });
 }
 await context.close();
}finally{
 await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
 await browser.close();await new Promise(r=>server.close(r));
}
console.log(JSON.stringify({checks:results.checks.length,failed:results.errors.length,formats:results.formats.length}));
if(results.errors.length)process.exitCode=1;
