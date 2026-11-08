/** Actual 1972 fixture and uniformly scaled native/construction candidates. */
import fs from 'node:fs';
import {createServer} from 'vite';

const destination=process.argv[2];
if(!destination)throw new Error('Supply output JSON path');
const server=await createServer({root:process.cwd(),configFile:false,
  server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',
  optimizeDeps:{noDiscovery:true,include:[],entries:[]}});
try {
  const {BC_DECALS}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {DECAL_TYPOGRAPHY}=await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
  const {DECAL_ANNUAL_1972_PROFILE}=await server.ssrLoadModule('/src/templates/dies/decal-annual-1972.ts');
  const {buildDieText}=await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const candidate=process.argv.includes('--candidate');
  if(candidate)Object.assign(DECAL_TYPOGRAPHY['1972'].runs['decal-year'][0],{
    profile:'annual-1972-reconstruction',x:.203,baseline:.82,cap:.71,width:.33,tracking:0});
  const decal=BC_DECALS.find(d=>d.year===1972);
  const art=decalArt(decal,{decalSerial:'926403'});
  if(art.serial!=='926403')throw new Error('Explicit control was changed');
  const wrap=(child,width=190,height=100)=>serializeSvgNode(node('svg',{
    xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${width} ${height}`,width:width*4,height:height*4},child));
  const current=wrap(buildDecal(art,{x:0,y:0,width:190,height:100}));
  const candidates={};
  for(const file of ['docs/research/decal-online-analysis/candidate-outlines.json',
    'src/templates/dies/decal-printing.json','src/templates/dies/decal-audit-printing.json',
    'src/templates/dies/decal-modern-printing.json'])Object.assign(candidates,JSON.parse(fs.readFileSync(file,'utf8')));
  candidates['annual-1972-reconstruction']=DECAL_ANNUAL_1972_PROFILE.overrides;
  const glyphs={};
  for(const [name,overrides] of Object.entries(candidates)) {
    if(!overrides['7']||!overrides['2'])continue;
    glyphs[name]={};
    const profile={id:`review-${name}`,label:name,params:{width:40,stroke:0,curve:'oval',tracking:0},
      overrides,allowResearchReplacement:false,allowConstructedFallback:false,
      evidence:{status:'legend-approximation',specimens:[],notes:'Diagnostic candidate, not an attribution'}};
    for(const char of ['7','2'])glyphs[name][char]=wrap(buildDieText({text:char,profile,x:10,baseline:110,capHeight:100,
      anchor:'start',ink:'#000',role:'decal-year'}).node,140,125);
  }
  fs.writeFileSync(destination,JSON.stringify({candidateTypography:candidate,
    current,run:DECAL_TYPOGRAPHY['1972'].runs['decal-year'][0],glyphs},null,2)+'\n');
} finally {await server.close();}
