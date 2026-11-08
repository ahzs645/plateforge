/** Read-only production probe: base 2004 year translation, with MAR unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';

const here=import.meta.dirname, root=path.resolve(here,'../../../../..');
const output=path.join(here,'scene');fs.mkdirSync(output,{recursive:true});
const server=await createServer({root,configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,entries:[],include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
try {
 const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
 const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
 const {DECAL_TYPOGRAPHY}=await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
 const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const decal=BC_DECALS.find(d=>decalId(d)==='2004');
 const baseline=structuredClone(DECAL_TYPOGRAPHY['2004']);baseline.runs['decal-year'][0].x=.732;
 const candidate=structuredClone(baseline);candidate.runs['decal-year'][0].x=.745;
 function render(month,name,typography) {
  DECAL_TYPOGRAPHY['2004']=typography;
  // Explicit generic layout fixture; this control is not asserted to be a specimen.
  const art=decalArt(decal,{decalMonth:month,decalSerial:'00000000'});
  const scene=buildDecal(art,{x:0,y:0,width:330,height:100});
  const roles=[],counts={};
  function visit(n){if(typeof n==='string')return;const role=n.attrs?.['data-role'];if(role&&n.attrs['data-die']){const index=counts[role]??0;counts[role]=index+1;n.attrs.id=`paint-${role}-${index}`;roles.push({role,index,id:n.attrs.id,text:n.attrs['aria-label'],profile:n.attrs['data-die'],fit:n.attrs['data-fit']});}for(const c of n.children??[])visit(c);}
  visit(scene);
  const file=path.join(output,`${month}-${name}.svg`);
  fs.writeFileSync(file,serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 330 100',width:330,height:100},scene)));
  const boxes=new Map(execFileSync('inkscape',[file,'--query-all'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim().split('\n').map(line=>{const [id,...v]=line.split(',');return[id,v.map(Number)];}));
  for(const r of roles){const [x,y,w,h]=boxes.get(r.id);r.box=[x,y,x+w,y+h];}
  if(month==='JAN'||month==='MAR')execFileSync('inkscape',[file,'--export-height=400','--export-filename='+file.replace('.svg','.png')],{stdio:'pipe'});
  return {file:path.relative(here,file),roles};
 }
 const results=[];
 for(const month of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']) {
  const before=render(month,'before',baseline),after=render(month,'after',candidate);
  const by=before.roles.find(r=>r.role==='decal-year'),ay=after.roles.find(r=>r.role==='decal-year');
  const bl=before.roles.find(r=>r.text==='COLUMBIA'),al=after.roles.find(r=>r.text==='COLUMBIA');
  const beforeGap=by.box[0]-bl.box[2],afterGap=ay.box[0]-al.box[2];
  if(ay.fit!=='natural'||afterGap<=2.8)throw new Error('Insufficient clear gap or unnatural fit');
  if(Math.abs((ay.box[2]-ay.box[0])-(by.box[2]-by.box[0]))>.001||Math.abs(ay.box[1]-by.box[1])>.001||Math.abs(ay.box[3]-by.box[3])>.001)throw new Error('Year shape, height or vertical placement changed');
  if(month==='MAR'&&JSON.stringify(before.roles)!==JSON.stringify(after.roles))throw new Error('MAR was changed');
  if(JSON.stringify(before.roles.filter(r=>r.role!=='decal-year'))!==JSON.stringify(after.roles.filter(r=>r.role!=='decal-year')))throw new Error('Another painted role changed');
  results.push({month,beforeGap,afterGap,yearTranslationX:ay.box[0]-by.box[0],before,after});
 }
 const report={schema:'plateforge.2004-base-clearance/v1',purpose:'Prevent COLUMBIA/year overlap introduced by the broader 04 in the eleven non-MAR months. This is a layout guard accommodation, not newly established month-specific historical positioning.',viewBox:[330,100],fixtureControl:'00000000 (generic layout verification only)',oldBaseX:.732,newBaseX:.745,translationUnits:4.29,expectedNonMarGap:2.9072,unchanged:['glyph contours','cap 0.515','baseline 0.683','tracking 0','kerning 04:-1.5','width guard 0.2','MAR variant','all other scene roles'],results,passed:true};
 fs.writeFileSync(path.join(here,'verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(results.map(r=>({month:r.month,beforeGap:r.beforeGap,afterGap:r.afterGap,yearTranslationX:r.yearTranslationX})),null,2));
}finally{await server.close();}
