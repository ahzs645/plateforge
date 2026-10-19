/** Reproducible B.C. main/branch visual audit. Browser tools remain outside app dependencies. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
const root=process.cwd(),baseRoot=path.resolve(process.env.BC_VISUAL_BASE??'../plateforge-main-visual');
const require=createRequire(path.resolve(process.env.TYPOGRAPHY_BROWSER_DEPS??'package.json'));
const {chromium}=require('playwright'),{PNG}=require('pngjs');
const {default:pixelmatch}=await import(require.resolve('pixelmatch'));
const work=path.join(root,'typography-evidence/bc-visual');await mkdir(work,{recursive:true});
const sha=(cwd,ref='HEAD')=>execFileSync('git',['rev-parse',ref],{cwd,encoding:'utf8'}).trim();
const servers=[],generated=[];
const harness=(current)=>`${current?`import {installPlateFonts} from '../src/templates/fonts';installPlateFonts();`:`import '@fontsource/barlow-condensed/600.css';import '@fontsource/barlow-condensed/700.css';`}
import '@fontsource-variable/inter';import '../src/index.css';
import {createElement} from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
import '../src/templates';import '../src/regions';
import {getRegion,generatePlate,makePlate,templateFor} from '../src/core/registry';import {createRng} from '../src/core/random';
import {PlateView} from '../src/ui/PlateView';import {SvgScene} from '../src/templates/SvgScene';
import {loadResearchDies,researchRegistryLoaded,setResearchDiesEnabled} from '../src/templates/dies/research-dies';
import {BC_DECALS,decalId} from '../src/regions/canada/bc-decals';import {decalArt} from '../src/regions/canada/bc-kit';import {buildDecal} from '../src/templates/bc/decal';import {node} from '../src/templates/svg-scene';
const root=createRoot(document.getElementById('plate')!),region=getRegion('ca-bc');
function bbox(el){const b=el.getBBox(),m=el.getCTM(),svg=document.querySelector('#plate svg'),inv=svg.getCTM().inverse();const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m).matrixTransform(inv));const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];}
async function ready(){for(let i=0;i<2;i++){await Promise.all([...document.querySelectorAll('#plate text')].map(t=>{const s=getComputedStyle(t);return document.fonts.load(s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily,t.textContent)}));await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}await Promise.all([...document.querySelectorAll('#plate image')].map(async im=>{const i=new Image();i.src=im.getAttribute('href');await i.decode()}));}
(window as any).bcVisual={
 formats:region.formats.map(f=>({id:f.id,label:f.label,references:f.references,fields:f.fields})),
 async init(){await loadResearchDies();if(!researchRegistryLoaded())throw Error('Research registry unavailable');},
 async render(row){
  setResearchDiesEnabled(row.research!==false);let parts={},validation=null;
  if(row.kind==='decal'){const d=BC_DECALS.find(d=>decalId(d)===row.format);if(!d)throw Error('Unknown decal '+row.format);parts={serial:'visual-review',decalMonth:d.specimen.month??'JAN',decalSerial:d.specimen.control??'',...row.parts};const art=decalArt(d,parts);flushSync(()=>root.render(createElement(SvgScene,{node:node('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 '+art.aspect*100+' 100'},buildDecal(art,{x:0,y:0,width:art.aspect*100,height:100}))})));}
  else{const format=region.formats.find(f=>f.id===row.format);if(!format)throw Error('Unknown format '+row.format);parts={...generatePlate(region,format,createRng('bc-visual:'+row.format)).parts,...row.parts};const plate=makePlate(region,format,parts);validation=format.validate?.(parts)??null;flushSync(()=>root.render(createElement(PlateView,{plate})));}
  await ready();const svg=document.querySelector<SVGSVGElement>('#plate svg')!,v=svg.viewBox.baseVal;
  const width=row.width??900;svg.style.cssText='display:block;width:'+width+'px;height:'+Math.round(width*v.height/v.width)+'px;max-width:none';
  const art=[...svg.querySelectorAll<SVGGraphicsElement>('[data-art],[data-role="base-emblem"],[data-role="tab-emblem"],[data-role="decal-emblem"],[data-role="underlying-centennial-emblem"]')].map(el=>({art:el.getAttribute('data-art'),role:el.getAttribute('data-role'),box:bbox(el)}));
  const texts=[...svg.querySelectorAll<SVGTextElement>('text')].filter(t=>t.textContent.trim()).map(t=>({text:t.textContent,family:getComputedStyle(t).fontFamily,weight:getComputedStyle(t).fontWeight,box:bbox(t)}));
  return {parts,validation,viewBox:[v.x,v.y,v.width,v.height],art,texts};
 }
};`;
function difference(a,b){const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.width,y.width);assert.equal(x.height,y.height);let changed=0,error=0;for(let i=0;i<x.data.length;i+=4){let d=0;for(let c=0;c<3;c++){const A=x.data[i+c]*x.data[i+3]/255+255-x.data[i+3],B=y.data[i+c]*y.data[i+3]/255+255-y.data[i+3];error+=Math.abs(A-B);d=Math.max(d,Math.abs(A-B));x.data[i+c]=Math.round(A);y.data[i+c]=Math.round(B);}x.data[i+3]=y.data[i+3]=255;if(d>16)changed++;}return {pixels:x.width*x.height,changedFraction:changed/(x.width*x.height),meanAbsoluteChannelError:error/(3*x.width*x.height),perceptualChangedFraction:pixelmatch(x.data,y.data,null,x.width,x.height,{threshold:0.1,includeAA:false})/(x.width*x.height)};}
let browser;
try{
 for(const [name,dir,port] of [['main',baseRoot,4184],['current',root,4185]]){
  const html=path.join(dir,'bc-visual-harness.generated.html'),entry=path.join(dir,'scripts/bc-visual-harness.generated.tsx');generated.push(html,entry);
  await writeFile(entry,harness(name==='current'));await writeFile(html,'<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:white"><div id="plate"></div><script type="module" src="/scripts/bc-visual-harness.generated.tsx"></script></body></html>');
  const server=await createServer({root:dir,configFile:false,plugins:[react()],server:{port,host:'127.0.0.1',strictPort:true,watch:null,hmr:false,fs:{allow:[root,baseRoot]}},logLevel:'error'});await server.listen();servers.push(server);
 }
 browser=await chromium.launch();const pages={};const errors=[];
 for(const [name,port]of[['main',4184],['current',4185]]){const page=await browser.newPage({viewport:{width:1200,height:1000},deviceScaleFactor:1});page.on('pageerror',e=>errors.push({name,error:String(e)}));page.on('response',r=>{if(r.status()>=400)errors.push({name,status:r.status(),url:r.url()})});page.on('requestfailed',r=>errors.push({name,url:r.url(),error:r.failure()?.errorText}));await page.goto('http://127.0.0.1:'+port+'/bc-visual-harness.generated.html');await page.waitForFunction(()=>!!window.bcVisual);await page.evaluate(()=>window.bcVisual.init());pages[name]=page;await mkdir(path.join(work,name),{recursive:true});}
 const cases=JSON.parse(await readFile(path.join(root,'docs/research/bc-visual-review/cases.json'),'utf8'));
 const formats=await pages.current.evaluate(()=>window.bcVisual.formats);
 const auditFormats=process.env.BC_VISUAL_CASES_ONLY?formats.filter(f=>(process.env.BC_VISUAL_AUDIT_FORMATS??'').split(',').includes(f.id)):formats;
 const rows=[...auditFormats.map(f=>({id:'audit-'+f.id,format:f.id,kind:'plate',width:600,research:true,audit:true})),...cases];
 const sourceHash=createHash('sha256');for(const file of execFileSync('git',['ls-files','src','package-lock.json'],{cwd:root,encoding:'utf8'}).trim().split('\n')){sourceHash.update(file+'\0');sourceHash.update(await readFile(path.join(root,file)));}
 const results={renderSourceSha256:sourceHash.digest('hex'),workingChanges:!!execFileSync('git',['status','--porcelain','--','src','package-lock.json'],{encoding:'utf8'}).trim(),schema:'plateforge.bc-visual-review/v1',baseCommit:sha(baseRoot),branchCommit:sha(root),browser:browser.version(),cases:[],audit:process.env.BC_VISUAL_CASES_ONLY?JSON.parse(await readFile(path.join(work,'results.json'),'utf8')).audit:[],errors};
 for(const [i,row]of rows.entries()){
  const record={...row,states:{}};const buffers={};
  for(const name of ['main','current']){const page=pages[name];record.states[name]=await page.evaluate(row=>window.bcVisual.render(row),row);if(record.states[name].validation&&!row.allowInvalidSerial)throw Error(row.id+': '+record.states[name].validation);buffers[name]=await page.locator('#plate svg').first().screenshot();await writeFile(path.join(work,name,row.id+'.png'),buffers[name]);}
  record.difference=difference(buffers.main,buffers.current);if(row.audit){const index=results.audit.findIndex(r=>r.id===row.id);if(index>=0)results.audit[index]=record;else results.audit.push(record);}else results.cases.push(record);
  await writeFile(path.join(work,'results.json'),JSON.stringify(results,null,2)+'\n');if(i%50===0)console.log('B.C. visual audit',i,'/',rows.length);
 }
 await writeFile(path.join(work,'results.json'),JSON.stringify(results,null,2)+'\n');
 assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({formats:results.audit.length,cases:results.cases.length,changed:results.audit.filter(r=>r.difference.changedFraction>0.001).length,work}));
}finally{await browser?.close();for(const server of servers)await server.close();for(const file of generated)await rm(file,{force:true});}
