import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
 const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
 const {DECAL_PRINTING_PROFILES}=await server.ssrLoadModule('/src/templates/dies/decal-printing.ts');
 const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const profiles=Object.fromEntries(DECAL_PRINTING_PROFILES.map(p=>[p.id.replace('bc-decal-print-',''),p.overrides]));
 const decals=BC_DECALS.map(d=>{const a=decalArt(d,{decalMonth:d.specimen.month??'JAN',decalSerial:d.specimen.control??''});const width=a.aspect*100;return {id:decalId(d),source:d.image,specimen:d.specimen,svg:serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width,height:100,viewBox:`0 0 ${width} 100`},buildDecal(a,{x:0,y:0,width,height:100})))};});
 fs.writeFileSync(process.argv[2],JSON.stringify({profiles,decals}));
} finally {await server.close()}
