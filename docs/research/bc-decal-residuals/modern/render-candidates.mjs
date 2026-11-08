import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
const here=path.dirname(new URL(import.meta.url).pathname),root=path.resolve(here,'../../../..');
const out=path.join(here,'candidate');fs.mkdirSync(out,{recursive:true});
const overrides=JSON.parse(fs.readFileSync(path.join(here,'late-year-candidate.json'),'utf8'));
const server=await createServer({root,configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,entries:[],include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
try {
 const {buildDieText}=await server.ssrLoadModule('/src/templates/dies/engine.ts');
 const {dieProfile}=await server.ssrLoadModule('/src/templates/dies/profiles.ts');
 const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const old=dieProfile('bc-decal-print-modern-year-reconstruction');
 const profile=dieProfile('bc-decal-print-modern-late-year-reconstruction');
 if(JSON.stringify(profile.overrides)!==JSON.stringify(overrides))throw new Error('Research and production outlines differ');
 let records=[];
 for(const text of ['0','1','2','3','9','2019','2020','2021','2022','2023']) {
  for(const [name,p] of [['before',old],['candidate',profile]]) {
   const r=buildDieText({text,profile:p,x:0,baseline:100,capHeight:100,anchor:'start',ink:'#111',role:'decal-year'});
   const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:r.width+20,height:120,viewBox:`-10 -10 ${r.width+20} 120`},r.node));
   const filename=`${name}-${text}.svg`;fs.writeFileSync(path.join(out,filename),svg);
   records.push({name,text,filename,width:r.width,height:r.height,fit:r.fit,profile:p.id,candidateTypography:false});
  }
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(records,null,2)+'\n');
 console.log(JSON.stringify({runs:records.length,natural:records.every(r=>r.fit==='natural')}));
}finally{await server.close();}
