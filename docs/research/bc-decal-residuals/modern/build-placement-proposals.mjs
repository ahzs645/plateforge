/** Compare actual renderer paint, then propose only the photographed month. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {auditDecalArt,verifyAuditScene} from '../../../../scripts/decal-audit-inputs.mjs';
const here=path.dirname(new URL(import.meta.url).pathname),root=path.resolve(here,'../../../..');
const baselineRoot=process.env.DECAL_PASS1_ROOT||path.resolve(root,'../plateforge-decal-pass1');
const firstPass=JSON.parse(fs.readFileSync(path.join(baselineRoot,'src/regions/canada/bc-decal-typography.json')));
const measurements=JSON.parse(fs.readFileSync(path.join(here,'placement-measurements.json'))).records;
const references=JSON.parse(fs.readFileSync(path.join(baselineRoot,'public/bc-decal-corrections/render-metadata.json'))).specimens;
const out=path.join(here,'placements');fs.mkdirSync(out,{recursive:true});
const round=v=>Math.round(v*100000)/100000;
const server=await createServer({root,configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,entries:[],include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
try {
 const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
 const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
 const {DECAL_TYPOGRAPHY}=await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
 const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const proposals=[];
 function render(id,art,reference,name,typography) {
  DECAL_TYPOGRAPHY[id]=typography;
  const scene=buildDecal(art,{x:0,y:0,width:230,height:100});verifyAuditScene(scene,reference);
  const roles=[],counts={};
  function visit(n){if(typeof n==='string')return;const r=n.attrs?.['data-role'];if(r&&(n.attrs['data-die']||r==='decal-barcode')){const i=counts[r]??0;counts[r]=i+1;n.attrs.id=`paint-${r}-${i}`;roles.push({role:r,index:i,id:n.attrs.id,text:n.attrs['aria-label'],profile:n.attrs['data-die'],fit:n.attrs['data-fit']});}for(const c of n.children??[])visit(c);}
  visit(scene);const file=path.join(out,`${id}-${name}.svg`);fs.writeFileSync(file,serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 230 100',width:230,height:100},scene)));
  const boxes=new Map(execFileSync('inkscape',[file,'--query-all'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim().split('\n').map(line=>{const [key,...v]=line.split(',');return[key,v.map(Number)];}));
  for(const r of roles){const [x,y,w,h]=boxes.get(r.id);r.box=[x,y,x+w,y+h];}
  execFileSync('inkscape',[file,'--export-height=400','--export-filename='+file.replace('.svg','.png')],{stdio:'pipe'});
  return roles;
 }
 for(const measurement of measurements){
  const id=measurement.id,reference=references.find(r=>r.id===id),decal=BC_DECALS.find(d=>decalId(d)===id);
  const art=auditDecalArt(decal,reference,decalArt),base=structuredClone(firstPass[id]);delete base.monthVariants;
  const before=render(id,art,reference,'before',base),candidate=structuredClone(base);
  if(+id>=2019)candidate.runs['decal-year'][0].profile='modern-late-year-reconstruction';
  // Only uniform cap height changes. Month/province contours and dimensions stay.
  candidate.runs['decal-year'][0].cap=round(measurement.roles.year.sourcePaintHeight/100);
  candidate.runs['decal-year'][0].width=.48;
  const serial=candidate.runs['decal-serial'][0];
  serial.cap=round(serial.cap*measurement.roles.serial.sourcePaintHeight/measurement.roles.serial.modelPaintHeight);serial.width=.44;
  const probe=render(id,art,reference,'probe',candidate);
  for(const role of ['month','year','serial']){
   const b=probe.find(r=>r.role==='decal-'+role).box,s=measurement.roles[role].sourceBoundsUniformHeight;
   const run=candidate.runs['decal-'+role][0];run.x=round(run.x+((s[0]+s[2]-b[0]-b[2])/2)/230);run.baseline=round(run.baseline+((s[1]+s[3]-b[1]-b[3])/2)/100);
  }
  // 2022's unrectified crop is 4.7% broader than the authored decal. Keep a
  // visible right margin instead of overfitting the frame-centred photograph.
  if(id==='2022')candidate.runs['decal-year'][0].x=.98;
  const cols=[.445,.485],dy=[];
  for(let i=0;i<2;i++){const b=probe.find(r=>r.role==='decal-legend'&&r.index===i).box,s=measurement.roles['legend'+i].sourceBoundsUniformHeight;cols[i]=round(cols[i]+((s[0]+s[2]-b[0]-b[2])/2)/230);dy.push((s[1]+s[3]-b[1]-b[3])/2);}
  const bar=probe.find(r=>r.role==='decal-barcode').box,s=measurement.roles.barcode.sourceBoundsUniformHeight;
  const factor=(s[2]-s[0])/(bar[2]-bar[0]),oldRect={x:-.015,y:.75,width:.59,height:.16};
  const newWidth=oldRect.width*factor,quiet=(bar[0]/230-oldRect.x)*factor;
  candidate.layout={...(candidate.layout??{}),provinceColumns:cols,provinceCentre:round(.36+(dy[0]+dy[1])/200),barcode:{x:round(s[0]/230-quiet),y:round(s[1]/100),width:round(newWidth),height:round((s[3]-s[1])/100)}};
  const after=render(id,art,reference,'after',candidate);
  const monthNumber=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(reference.month)+1;
  const variant={fromMonth:monthNumber,throughMonth:monthNumber,evidence:`Observed ${id} ${reference.month} specimen only, control ${reference.control}. Uniform frame-height/centre registration, source aspect preserved. Actual ink bounds include native strokes; barcode dimensions fit painted bars with quiet zones accounted for. Month/province contours are retained. ${id==='2020'?'The all-zero sample is qualified evidence, not proof of normal issuance. ':''}See docs/research/bc-decal-residuals/modern.`,runs:Object.fromEntries(['decal-month','decal-year','decal-serial'].map(r=>[r,candidate.runs[r]])),layout:candidate.layout};
  proposals.push({id,month:reference.month,control:reference.control,scope:'Exact photographed month; no inferred issue-date boundary',baseYearProfile:+id>=2019?'modern-late-year-reconstruction':'modern-year-reconstruction',monthVariant:variant,before,after});
 }
 fs.writeFileSync(path.join(here,'placement-proposals.json'),JSON.stringify({schema:'plateforge.modern-placement-proposals/v1',profileBindings:{'2019':'modern-late-year-reconstruction','2020':'modern-late-year-reconstruction','2021':'modern-late-year-reconstruction','2022':'modern-late-year-reconstruction','2023':'modern-late-year-reconstruction'},proposals},null,2)+'\n');
 console.log(JSON.stringify(proposals.map(p=>({id:p.id,month:p.month,runs:p.monthVariant.runs,layout:p.monthVariant.layout})),null,2));
}finally{await server.close();}
