/** Inventory every B.C. preset without equating design dates with die identity. */
import {createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const destination=process.argv[2]??'/tmp/bc-grouping-inventory.json';
const server=await createServer({root,server:{middlewareMode:true},appType:'custom'});
try{
 const {britishColumbia:bc}=await server.ssrLoadModule('/src/regions/canada/index.ts');
 const {kitRecipe}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {bcDieSet}=await server.ssrLoadModule('/src/templates/bc/dies.ts');
 const {allDieProfiles}=await server.ssrLoadModule('/src/templates/dies/profiles.ts');
 const {createRng}=await server.ssrLoadModule('/src/core/random.ts');
 const registry=JSON.parse(fs.readFileSync(path.join(root,'src/templates/dies/research-registry.json'),'utf8'));
 const formats=bc.formats.map(f=>{
  let recipe=null;try{if(f.design?.kit)recipe=kitRecipe(f.design.kit)}catch{}
  const serialDie=recipe?.serial.die??bcDieSet(f.design??{}).serial;
  const parts=f.generate(createRng('bc-cross-class-'+f.id));
  return {id:f.id,label:f.label,type:f.family??'passenger',period:f.period??null,designEra:f.era??null,status:f.status??'issued',pattern:f.pattern??null,serialDie,dieOptions:f.fields.find(x=>x.key==='die')?.options??[{value:serialDie,label:serialDie}],sampleParts:parts,physicalMm:recipe?{width:recipe.width,height:recipe.height}:null,shape:recipe?.cutOutline?'custom-cut':'rectangular',serialCapMm:recipe?.serial.cap??null,legendDies:recipe?.legends?.map(x=>({text:x.text,die:x.die,role:x.role,capMm:x.cap}))??[],sharedPassengerMasters:recipe?.serial.researchFormats??null,researchBindings:registry.bindings[f.id]??{},description:f.description??'',sources:f.references??[],fields:f.fields.map(x=>({key:x.key,label:x.label,options:x.options??null}))};
 });
 const profiles=allDieProfiles().map(x=>({id:x.id,label:x.label,maker:x.maker??null,evidence:x.evidence??null}));
 fs.writeFileSync(destination,JSON.stringify({formats,profiles,types:bc.families},null,2)+'\n');
 console.log(JSON.stringify({destination,formats:formats.length,types:bc.families.length}));
}finally{await server.close()}
