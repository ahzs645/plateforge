/** Exact specimen texts through the currently integrated buildDecal path. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createServer} from 'vite';
const root=path.resolve(import.meta.dirname,'..');const out=path.join(root,'docs/research/bc-late-two-digit-printing/integrated');fs.mkdirSync(out,{recursive:true});
const server=await createServer({root,configFile:false,server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[],entries:[]}});
try {
  const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const records=[];
  for(const [id,month,control] of [['2008','AUG','47144166'],['2011','MAY','24516329'],['2013','OCT','79670318']]) {
    const d=BC_DECALS.find(d=>decalId(d)===id);const art=decalArt(d,{decalMonth:month,decalSerial:control});
    if(art.serial!==control)throw new Error('Audit control changed: '+id);
    const width=art.aspect*100;
    const svg=serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width,height:100,viewBox:`0 0 ${width} 100`},buildDecal(art,{x:0,y:0,width,height:100})));
    const folder=path.join(out,id);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'after.svg'),svg);
    const before=path.join(folder,'before.svg');
    if(!fs.existsSync(before)) {
      const baseline=path.join(root,'../decal-analysis/evidence',id,'current.svg');
      if(!fs.existsSync(baseline))throw new Error('Missing archived baseline '+baseline+'; retain the existing integrated/before.svg files when reproducing.');
      fs.copyFileSync(baseline,before);
    }
    records.push({id,month,control,source:d.image,sourceFile:`public/bc-decal-online-review/${id}/photo.png`,viewBox:[width,100],candidateTypography:false,
      baseline:'17b974f51c687780c5d0b106fd9ae37e4c83ccae',beforeSvgSha256:crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),afterSvgSha256:crypto.createHash('sha256').update(svg).digest('hex')});
  }
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({candidateTypography:false,records},null,2)+'\n');
  console.log(JSON.stringify({candidateTypography:false,controls:records.map(r=>[r.id,r.control]),specimens:records.length}));
} finally {await server.close();}
