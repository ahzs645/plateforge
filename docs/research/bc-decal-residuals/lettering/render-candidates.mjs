/** Render isolated comparison runs through PlateForge's real portable glyph engine. */
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';

const root=path.resolve(import.meta.dirname,'../../../..');
const destination=path.join(import.meta.dirname,'rendered');
fs.mkdirSync(destination,{recursive:true});
const server=await createServer({root,configFile:false,server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[],entries:[]}});
try {
  const {buildDieText}=await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {dieProfile}=await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const {DECAL_RESIDUAL_LETTERING_PROFILES:newProfiles}=await server.ssrLoadModule('/src/templates/dies/decal-residual-lettering.ts');
  const native=JSON.parse(fs.readFileSync(path.join(root,'docs/research/decal-glyph-analysis/candidate-outlines.json'),'utf8'));
  const cases=[
    {id:'1983-jun',text:'JUN',before:'oswald-600',after:'panel-1983-jun-reconstruction',beforeSpacing:2},
    {id:'1999-may',text:'MAY',before:'bordered-may-reconstruction',after:'thick-1999-may-reconstruction',beforeKerning:{AY:-14},afterKerning:{AY:-7.5}},
    {id:'2004-year',text:'04',before:'heavy-year',after:'solid-2004-year-reconstruction',afterKerning:{'04':-1.5}},
  ];
  const records=[];
  for(const item of cases) {
    const entries=[{key:'before',profile:dieProfile('bc-decal-print-'+item.before),spacing:item.beforeSpacing,kerning:item.beforeKerning},
      {key:'after',profile:newProfiles.find(p=>p.id==='bc-decal-print-'+item.after),kerning:item.afterKerning},
      ...Object.entries(native).map(([key,glyphs])=>({key,profile:{id:'native-'+key,label:key,params:{width:50,stroke:0,curve:'oval',tracking:0},overrides:glyphs,allowConstructedFallback:false,allowResearchReplacement:false,evidence:{status:'research-candidate',specimens:[],notes:'Unmodified native comparison candidate.'}}}))];
    for(const entry of entries) {
      for(const text of entry.key==='before'||entry.key==='after'?[item.text,...new Set(item.text)]:[item.text]) {
        const result=buildDieText({text,profile:entry.profile,x:0,baseline:100,capHeight:100,anchor:'start',ink:'#111',role:'decal-comparison',letterSpacing:entry.spacing,kerning:entry.kerning});
        const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:result.width+20,height:124,viewBox:`-10 -12 ${result.width+20} 124`},result.node));
        const filename=item.id+'--'+entry.key+'--'+text+'.svg';
        fs.writeFileSync(path.join(destination,filename),svg);
        records.push({case:item.id,key:entry.key,text,profile:entry.profile.id,advanceWidth:result.width,capHeight:result.height,fit:result.fit,file:filename,spacing:entry.spacing??0,kerning:entry.kerning??{}});
      }
    }
  }
  fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(records,null,2)+'\n');
  console.log(JSON.stringify({rendered:records.length,natural:records.every(r=>r.fit==='natural')}));
} finally {await server.close();}
