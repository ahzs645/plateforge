import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {auditDecalArt,verifyAuditScene} from '../../../../scripts/decal-audit-inputs.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../../..');
const baseline=path.join(path.dirname(root),'plateforge-decal-pass1');
const data=JSON.parse(fs.readFileSync(path.join(here,'implementation-proposals.json')));
const selected=new Set(data.proposals.map(p=>p.id));
if(process.argv.includes('--all-reviewed')){
 const decisions=JSON.parse(fs.readFileSync(path.join(here,'retained-case-decisions.json')));
 for(const row of decisions.cases)selected.add(row.id);
 selected.add('2004');
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/research/decal-online-analysis/reference-manifest.json'))).filter(r=>selected.has(r.id));
const baseRecords=JSON.parse(fs.readFileSync(path.join(baseline,'src/regions/canada/bc-decal-typography.json')));
const out=path.join(here,'rendered');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(directory,...args)=>execFileSync('git',['-C',directory,...args],{encoding:'utf8'}).trim();
if(git(baseline,'rev-parse','HEAD')!==data.baselineCommit)throw new Error('First-pass baseline commit changed');
if(git(baseline,'status','--porcelain','--untracked-files=normal'))throw new Error('First-pass baseline is not clean');
function sourceHash(directory){
 const files=execFileSync('git',['-C',directory,'ls-files','-z','--cached','--others','--exclude-standard','--','src','package-lock.json'],{encoding:'utf8'}).split('\0').filter(Boolean).sort();
 const h=crypto.createHash('sha256');for(const f of new Set(files))h.update(f).update('\0').update(fs.readFileSync(path.join(directory,f)));return h.digest('hex');
}
const provenance={baselineCommit:git(baseline,'rev-parse','HEAD'),baselineSourceSha256:sourceHash(baseline),currentCommit:git(root,'rev-parse','HEAD'),currentSourceSha256:sourceHash(root)};

async function render(directory,stage) {
 const server=await createServer({root:directory,configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false,watch:null}});
 try {
  const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const {DECAL_TYPOGRAPHY}=await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
  if(stage==='after'&&!process.argv.includes('--integrated')){
   // Candidate changes live only in this isolated SSR instance.
   for(const id of selected)DECAL_TYPOGRAPHY[id]=structuredClone(baseRecords[id]);
   for(const p of data.proposals){
    const r=DECAL_TYPOGRAPHY[p.id];
    if(p.month===null){Object.assign(r.runs,p.runs);r.layout={...r.layout,...p.layout};}
    else {
     const n=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(p.month)+1;
     const existing=r.monthVariants?.find(v=>v.fromMonth===n&&v.throughMonth===n);
     if(existing){Object.assign(existing.runs,p.runs);existing.layout={...existing.layout,...p.layout};}
     else (r.monthVariants??=[]).push({fromMonth:n,throughMonth:n,evidence:p.scope,runs:p.runs,layout:p.layout});
    }
   }
  }
  const records=[];
  for(const ref of manifest){
   const decal=BC_DECALS.find(d=>decalId(d)===ref.catalogueId);
   const art=auditDecalArt(decal,ref,decalArt);const w=art.aspect*100;
   const scene=buildDecal(art,{x:0,y:0,width:w,height:100});const printed=verifyAuditScene(scene,ref);
   const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:w,height:100,viewBox:`0 0 ${w} 100`},scene));
   const folder=path.join(out,ref.id);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,stage+'.svg'),svg);
   records.push({id:ref.id,stage,source:ref.source,month:ref.month,control:ref.control,printedInputs:printed,svgSha256:hash(svg),viewBox:[w,100]});
  }
  return records;
 } finally {await server.close();}
}
const records=[];
if(!process.argv.includes('--after-only'))records.push(...await render(baseline,'before'));
records.push(...await render(root,'after'));
if(sourceHash(baseline)!==provenance.baselineSourceSha256||sourceHash(root)!==provenance.currentSourceSha256)throw new Error('Source files changed during rendering; rerun');
fs.writeFileSync(path.join(out,'render-inputs.json'),JSON.stringify({baseline,baselineCommit:data.baselineCommit,provenance,proposalSha256:hash(fs.readFileSync(path.join(here,'implementation-proposals.json'))),candidateScope:process.argv.includes('--integrated')?'After is the unmodified integrated current checkout. Before is the complete clean first-pass checkout.':'After is the complete current renderer with isolated proposal role/layout records. Before is the complete clean first-pass checkout.',records},null,2)+'\n');
console.log('Rendered',records.length,'exact-input SVGs');
