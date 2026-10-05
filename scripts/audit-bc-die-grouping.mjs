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
 const {buildKitScene}=await server.ssrLoadModule('/src/templates/bc/kit.ts');
 const {buildBcScene}=await server.ssrLoadModule('/src/templates/bc/scene.ts');
 const {buildBcLaterScene}=await server.ssrLoadModule('/src/templates/bc/later-scene.ts');
 const {kitPalette}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {withResearchContext}=await server.ssrLoadModule('/src/templates/dies/research-dies.ts');
 function letteringComponents(scene){
  const out=[];
  const walk=(node)=>{
   if(typeof node==='string')return;
   const a=node.attrs??{},role=String(a['data-role']??'');
   if(a['data-die']){
    const child=node.children.find(x=>typeof x!=='string'&&x.attrs?.transform?.includes('scale('));
    const scale=child?.attrs?.transform?.match(/scale\(([.\d]+)/)?.[1];
    out.push({text:String(a['aria-label']??''),die:String(a['data-die']),role,capMm:scale?Number(scale)*100:null,kind:'outline profile',origin:'declared scene component'});
   }else if(node.tag==='text' && a.fontFamily){
    out.push({text:node.children.filter(x=>typeof x==='string').join(''),die:'font:'+a.fontFamily,role:role||'screened-text',capMm:null,fontSizeMm:a.fontSize??null,kind:'screened typeface / proxy',origin:'declared text component'});
   }else if(a['data-art']){
    out.push({text:String(a['aria-label']??''),die:'art:'+a['data-art'],role:role||'artwork',capMm:null,kind:'fixed artwork',origin:'declared artwork component'});
   }else if(role==='province-letters' || (role==='serial'&&node.children.some(x=>typeof x!=='string'&&x.attrs?.['data-role']==='attached-character'))){
    out.push({text:String(a['aria-label']??''),die:'manual:attached-owner-lettering',role:role==='province-letters'?'province':role,capMm:null,kind:'manual attached-letter reconstruction',origin:'owner-made scene component'});
   }
   for(const child of node.children??[])walk(child);
  };walk(scene);return out;
 }
 const registry=JSON.parse(fs.readFileSync(path.join(root,'src/templates/dies/research-registry.json'),'utf8'));
 const formats=bc.formats.map(f=>{
  let recipe=null;try{if(f.design?.kit)recipe=kitRecipe(f.design.kit)}catch{}
  const serialDie=recipe?.serial.die??bcDieSet(f.design??{}).serial;
  const parts=f.generate(createRng('bc-cross-class-'+f.id));
  let extractedComponents=[],componentExtractionError=null;
  try{
   const design={...bc.design,...f.design};
   const scene=withResearchContext(f.id,()=>recipe
    ?buildKitScene(recipe,parts,{scope:'inventory-'+f.id,...kitPalette(recipe.id,parts.palette)})
    :Number(design.year)>=1964?buildBcLaterScene(design,parts,'inventory-'+f.id):buildBcScene(design,parts,'inventory-'+f.id));
   extractedComponents=letteringComponents(scene);
  }catch(error){componentExtractionError=String(error)}
  if(recipe?.serial.prefix && !extractedComponents.some(x=>x.role==='serial-prefix'))extractedComponents.push({text:'T / TR',die:recipe.serial.prefix.die,role:'serial-prefix',capMm:recipe.serial.prefix.cap,kind:'outline profile',origin:'declared optional prefix'});

  return {id:f.id,label:f.label,type:f.family??'passenger',period:f.period??null,designEra:f.era??null,status:f.status??'issued',pattern:f.pattern??null,serialDie,dieOptions:f.fields.find(x=>x.key==='die')?.options??[{value:serialDie,label:serialDie}],sampleParts:parts,physicalMm:recipe?{width:recipe.width,height:recipe.height}:null,shape:recipe?.cutOutline?'custom-cut':'rectangular',serialCapMm:recipe?.serial.cap??null,legendDies:recipe?.legends?.map(x=>({text:x.text,die:x.die,role:x.role,capMm:x.cap}))??[],letteringComponents:extractedComponents,componentExtractionError,serialFont:recipe?.serial.font??null,prefixDie:recipe?.serial.prefix??null,sharedPassengerMasters:recipe?.serial.researchFormats??null,researchBindings:registry.bindings[f.id]??{},description:f.description??'',sources:f.references??[],fields:f.fields.map(x=>({key:x.key,label:x.label,options:x.options??null}))};
 });
 const profiles=allDieProfiles().map(x=>({id:x.id,label:x.label,maker:x.maker??null,evidence:x.evidence??null}));
 fs.writeFileSync(destination,JSON.stringify({formats,profiles,types:bc.families},null,2)+'\n');
 console.log(JSON.stringify({destination,formats:formats.length,types:bc.families.length}));
}finally{await server.close()}
