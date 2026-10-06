/** Render every catalogue/month combination for browser geometry checks. */
import {createServer} from 'vite';
import fs from 'node:fs';
const destination=process.argv[2];
if(!destination) throw new Error('Supply an output JSON path.');
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
  const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const fixtures=[];
  for(const decal of BC_DECALS) {
    const months=decal.year>=1980?['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']:['JAN'];
    for(const month of months) {
      const art=decalArt(decal,{decalMonth:month,decalSerial:decal.specimen.control??''});
      const width=art.aspect*100;
      fixtures.push({id:decalId(decal),month,svg:serializeSvgNode(node('svg',{
        xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${width} 100`,width,height:100,
      },buildDecal(art,{x:0,y:0,width,height:100})))});
    }
  }
  fs.writeFileSync(destination,JSON.stringify(fixtures));
} finally {await server.close()}
