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
const browserName=process.env.TYPOGRAPHY_BROWSER??'chromium';
const out=path.resolve('typography-evidence/browser-'+browserName);await mkdir(out,{recursive:true});
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
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
const browser=await ({chromium,firefox,webkit}[browserName]).launch({headless:true});
const results={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),browser:browserName,browserVersion:browser.version(),checks:[],formats:[],errors:[]};
function pixels(a,b){
 const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.width,y.width);assert.equal(x.height,y.height);
 let changed=0,total=0;for(let i=0;i<x.data.length;i+=4){let delta=0;for(let c=0;c<3;c++){
   const A=x.data[i+c]*x.data[i+3]/255+255-x.data[i+3],B=y.data[i+c]*y.data[i+3]/255+255-y.data[i+3];
   delta=Math.max(delta,Math.abs(A-B));total+=Math.abs(A-B);
 }if(delta>16)changed++;}
 return {pixels:x.width*x.height,changedFraction:changed/(x.width*x.height),meanAbsoluteChannelError:total/(x.width*x.height*3)};
}
async function check(name,fn){try{const detail=await fn();results.checks.push({name,status:'passed',...detail});}catch(e){results.errors.push({name,error:String(e),stack:e.stack});results.checks.push({name,status:'failed'});console.error(name,e);}}
try{
 const context=await browser.newContext({viewport:{width:1500,height:1050},deviceScaleFactor:1,acceptDownloads:true});
 const page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>results.errors.push({name:'pageerror',error:String(e)}));
 await page.goto('http://127.0.0.1:4173/qa/');await page.waitForFunction(()=>!!window.typographyQA);
 const formats=await page.evaluate(()=>window.typographyQA.formats);
 assert.ok(formats.length>=785);assert.equal(new Set(formats.map(f=>f.region+'/'+f.format)).size,formats.length);
 const representatives=[...new Map(formats.map(f=>[f.template,f])).values()];
 const extra=formats.filter(f=>['ca-bc','ca-nu','ca-ab','ca-nt','us-ca','eu-de','eu-gb','kr','jp','cn'].includes(f.region)&&!f.format.startsWith('stand-in-')).filter(f=>/^(standard|reflective|2020|electric|green|1951|1930|1964|1978|1979-first|1985|2001-flag|1985-flag|moraine-lake|spectacular)$/.test(f.format));
 const selected=[...new Map([...representatives,...extra].map(f=>[f.region+'/'+f.format,f])).values()];
 for(const f of selected)await check('raster parity '+f.region+'/'+f.format,async()=>{
   const info=await page.evaluate(f=>window.typographyQA.render(f.region,f.format,{},f.region==='ca-bc'),f);
   await page.locator('#plate svg').first().evaluate(el=>{const {width,height}=el.viewBox.baseVal;el.style.width=Math.round(width)+'px';el.style.height=Math.round(height)+'px';});
   const data=await page.evaluate(()=>window.typographyQA.export());
   const name=(f.region+'-'+f.format).replace(/[^a-z0-9-]/gi,'_');
   const inline=await page.locator('#plate svg').first().screenshot();const png=Buffer.from(data.png.split(',')[1],'base64');
   const delta=pixels(inline,png);
   await writeFile(path.join(out,name+'-inline.png'),inline);await writeFile(path.join(out,name+'-export.png'),png);
   const tesla=PNG.sync.read(Buffer.from(data.tesla.split(',')[1],'base64'));assert.equal(tesla.width,400);assert.equal(tesla.height,info.width/info.height>=3?100:200);
   assert.equal(data.metadata.systemFamilies.length,0,'Unexpected unbundled system font');
   assert.ok(delta.changedFraction<0.025,JSON.stringify(delta));
   return {region:f.region,format:f.format,info,delta,metadata:data.metadata,svgBytes:data.svgBytes};
 });
 const specimens=[
 ['barlow600','Barlow Condensed','ABC 0123456789',600,'normal'],['barlow500','Barlow Condensed','EL 13579',500,'normal'],
 ['barlow700italic','Barlow Condensed','BEAUTIFUL 2026',700,'italic'],['antonio-ext','Antonio','ĀČŁŊŞȚŽ 0123',500,'normal'],
 ['cn','Noto Sans SC','京粤警学港澳使领',700,'normal'],['jp','Noto Sans JP','品川横浜なあ東京',600,'normal'],
 ['kr','Noto Sans KR','서울경기가허하호',700,'normal'],['syllabics','Noto Sans Canadian Aboriginal','ᓄᓇᕗᑦ',700,'normal'],
 ['sans-italic','Noto Sans','Wild Rose Country',700,'italic'],['serif-italic','Noto Serif','Beautiful British',400,'italic'],
 ['script','Pinyon Script','California',400,'normal'],['euro-umlauts','EuroPlate','GÖ ÄÜ 1234',400,'normal'],
 ['uk-fallback','UKNumberPlate, "Barlow Condensed"','AB-123',400,'normal']
 ];
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
 const app=await context.newPage();app.setDefaultTimeout(20000);
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
   const input=p.locator('.inspector input[type="text"]').first();await input.fill('GÖ');await input.focus();
   const identity=await input.evaluate(el=>{el.dataset.focusProof='same-node';return el.value;});release();
   await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
   assert.deepEqual(await input.evaluate(el=>({focused:document.activeElement===el,value:el.value,identity:el.dataset.focusProof})),{focused:true,value:identity,identity:'same-node'});
   await cold.close();return {inputPreserved:true};
 });
 await check('mobile viewport, typography panel and SVG download',async()=>{
   await app.setViewportSize({width:390,height:844});await app.goto('http://127.0.0.1:4173/plateforge/#/jp/standard');await app.locator('.plate-preview svg').waitFor();
   await app.evaluate(()=>document.fonts.ready);assert.ok(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await app.screenshot({path:path.join(out,'mobile-japan.png'),fullPage:true});
   await app.getByRole('button',{name:'Save',exact:true}).click();const dl=app.waitForEvent('download');await app.getByRole('menuitem',{name:'Save SVG',exact:true}).click();const d=await dl;await d.delete();
   return {width:390,overflow:false};
 });
 await context.close();
}finally{
 await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
 await browser.close();await new Promise(r=>server.close(r));
}
console.log(JSON.stringify({checks:results.checks.length,failed:results.errors.length,formats:results.formats.length}));
if(results.errors.length)process.exitCode=1;
