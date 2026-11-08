/** Render comparison runs through the actual portable die engine. */
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';

const root=path.resolve(import.meta.dirname,'..');
const destination=path.join(root,'docs/research/bc-modern-numerals/rendered');
fs.mkdirSync(destination,{recursive:true});
const server=await createServer({root,configFile:false,server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[],entries:[]}});
try {
  const {buildDieText}=await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {dieProfile}=await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const profiles=['anton-400','normal','control-bold','modern-year-reconstruction','modern-control-reconstruction'];
  const texts=['2015','2017','70118033','91115136','0123456789',...'0123456789'];
  const records=[];
  for(const key of profiles) {
    const profile=dieProfile('bc-decal-print-'+key);
    for(const text of texts) {
      const result=buildDieText({text,profile,x:0,baseline:100,capHeight:100,anchor:'start',ink:'#111',role:'decal-comparison'});
      const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:result.width+20,height:120,viewBox:`-10 -10 ${result.width+20} 120`},result.node));
      const filename=key+'-'+text+'.svg';
      fs.writeFileSync(path.join(destination,filename),svg);
      records.push({profile:key,text,width:result.width,height:result.height,fit:result.fit,file:filename});
    }
  }
  for(const key of ['heavy-month-wide','bordered-may-reconstruction']) {
    const profile=dieProfile('bc-decal-print-'+key);
    for(const text of ['MAY',...'MAY']) {
      const kerning=key==='bordered-may-reconstruction'?{AY:-14}:undefined;
      const result=buildDieText({text,profile,x:0,baseline:100,capHeight:100,anchor:'start',ink:'#111',role:'decal-comparison',kerning});
      const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:result.width+20,height:120,viewBox:`-10 -10 ${result.width+20} 120`},result.node));
      const filename=key+'-'+text+'.svg';
      fs.writeFileSync(path.join(destination,filename),svg);
      records.push({profile:key,text,width:result.width,height:result.height,fit:result.fit,file:filename,kerning});
    }
  }
  fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(records,null,2)+'\n');
  console.log(JSON.stringify({rendered:records.length,nativeRuns:records.every(r=>r.fit==='natural')}));
} finally {await server.close();}
