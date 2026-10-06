import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
 const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
 const {buildDecal:beforeDecal}=await server.ssrLoadModule('/docs/research/decal-online-analysis/renderer-before.ts');
 const {DECAL_PRINTING_PROFILES}=await server.ssrLoadModule('/src/templates/dies/decal-printing.ts');
 const {DECAL_TYPOGRAPHY}=await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
 const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const manifest=JSON.parse(fs.readFileSync('docs/research/decal-online-analysis/reference-manifest.json','utf8'));
 const before=JSON.parse(fs.readFileSync('docs/research/decal-online-analysis/before-typography.json','utf8'));
 const current=structuredClone(DECAL_TYPOGRAPHY);
 const render=(r,renderer=buildDecal)=>{const d=BC_DECALS.find(d=>decalId(d)===r.catalogueId);if(!d)throw Error(r.id);const a=decalArt(d,{decalMonth:r.month??'JAN',decalSerial:r.control??''});const width=a.aspect*100;return serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width,height:100,viewBox:`0 0 ${width} 100`},renderer(a,{x:0,y:0,width,height:100})))};
 const decals=manifest.map(r=>({id:r.id,catalogueId:r.catalogueId,source:r.source,specimen:{...r,photoInspected:true},svg:render(r)}));
 Object.assign(DECAL_TYPOGRAPHY,before);
 for(let i=0;i<manifest.length;i++)decals[i].beforeSvg=render(manifest[i],beforeDecal);
 Object.assign(DECAL_TYPOGRAPHY,current);
 fs.writeFileSync(process.argv[2],JSON.stringify({profiles:Object.fromEntries(DECAL_PRINTING_PROFILES.map(p=>[p.id.replace('bc-decal-print-',''),p.overrides])),decals}));
} finally {await server.close()}
