/** Actual-engine shape fixtures; local geometry only, no shared layout edits. */
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'docs/research/bc-late-two-digit-printing');fs.mkdirSync(path.join(out,'rendered'),{recursive:true});
const cases=[
  {id:'2008-month',catalogueId:'2008',month:8,role:'decal-month',text:'AUG',roi:[5,10,126,88],polarity:'light',before:'heavy-month',after:'bebasneue-400',anchor:'start'},
  {id:'2008-year',catalogueId:'2008',role:'decal-year',text:'08',roi:[174,10,235,70],polarity:'light',before:'heavy-year',after:'oswald-400',anchor:'end'},
  {id:'2011-month',catalogueId:'2011',month:5,role:'decal-month',text:'MAY',roi:[9,4,106,65],polarity:'dark',before:'heavy-month',after:'heavy-month',anchor:'start'},
  {id:'2011-year',catalogueId:'2011',role:'decal-year',text:'11',roi:[174,4,225,65],polarity:'dark',before:'heavy-year',after:'heavy-year',kerning:{'11':-4},anchor:'end'},
  {id:'2013-month',catalogueId:'2013',month:10,role:'decal-month',text:'OCT',roi:[7,5,79,69],polarity:'dark',before:'heavy-month',after:'late-oct-reconstruction',anchor:'start'},
  {id:'2013-year',catalogueId:'2013',role:'decal-year',text:'13',roi:[174,4,228,69],polarity:'dark',before:'heavy-year',after:'heavy-year',kerning:{'13':-6},anchor:'end'},
];
const server=await createServer({root,configFile:false,server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[],entries:[]}});
try {
  const {buildDieText}=await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {dieProfile}=await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  for(const entry of cases) {
    entry.renders={};
    for(const stage of ['before','after']) {
      const profile=dieProfile('bc-decal-print-'+entry[stage]);
      const run=buildDieText({profile,text:entry.text,x:10,baseline:110,capHeight:100,anchor:'start',ink:'#111',role:entry.role,kerning:stage==='after'?entry.kerning:undefined});
      run.node.attrs.id='diagnostic-run';
      const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:run.width+20,height:120,viewBox:`0 0 ${run.width+20} 120`},run.node));
      const file=entry.id+'-'+stage+'.svg';fs.writeFileSync(path.join(out,'rendered',file),svg);
      entry.renders[stage]={file,nativeAdvance:run.width,fit:run.fit};
    }
  }
  fs.writeFileSync(path.join(out,'rendered/manifest.json'),JSON.stringify(cases,null,2)+'\n');
  console.log('Rendered '+cases.length+' before/after pairs with native widths.');
} finally {await server.close();}
