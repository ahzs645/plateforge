/** Render the actual application profiles and serial placement for the study.
 * Run from the repository root: node docs/research/bc-font-reconstruction-2026-11-08/render.mjs
 * Requires the app's Vite dependency and sharp (installed in the cloud runtime).
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const check=process.argv.includes('--check');
assert(process.argv.slice(2).every(arg=>arg==='--check'),'Unknown argument');
const require = createRequire(import.meta.url);
let sharp;
if(!check) {
  try { sharp = require('sharp'); }
  catch { sharp = createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'package.json'))('sharp'); }
}
const root = process.cwd();
const study = path.join(root, 'docs/research/bc-font-reconstruction-2026-11-08');
const sources = JSON.parse(fs.readFileSync(path.join(study, 'sources.json'), 'utf8'));
const expected=check?JSON.parse(fs.readFileSync(path.join(study,'rendered.json'),'utf8')):null;
const server = await createServer({root,configFile:false,server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[],entries:[]}});
const all = n => [n,...n.children.flatMap(c=>typeof c==='string'?[]:all(c))];
try {
  const {dieProfile} = await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const {buildDieText, dieGlyph} = await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {withResearchContext,installResearchRegistry,setResearchDiesEnabled} = await server.ssrLoadModule('/src/templates/dies/research-dies.ts');
  const {britishColumbia} = await server.ssrLoadModule('/src/regions/canada/index.ts');
  const {kitRecipe} = await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildKitScene} = await server.ssrLoadModule('/src/templates/bc/kit.ts');
  const {node,serializeSvgNode} = await server.ssrLoadModule('/src/templates/svg-scene.ts');
  installResearchRegistry(JSON.parse(fs.readFileSync(path.join(root,'src/templates/dies/research-registry.json'),'utf8')));
  const records = [];
  for (const source of sources.specimens) {
    const record = {id:source.id, modes:{}};
    for (const mode of ['previous-production','previous-research','current-production','current-research']) {
      setResearchDiesEnabled(mode.endsWith('research'));
      const scoped = build => mode.startsWith('previous')
        ? withResearchContext('comparison-baseline', () => withResearchContext(source.format, build))
        : withResearchContext(source.format, build);
      const glyphs = {};
      for (const char of [...new Set(source.serial.replace('-',''))]) {
        const profile = scoped(() => dieProfile(source.profile));
        const glyph = dieGlyph(profile,char);
        const run = scoped(() => buildDieText({text:char,profile,x:0,baseline:100,capHeight:100,anchor:'start',ink:'#000000',role:'serial'}));
        const svg = serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:960,height:1120,viewBox:'-20 -20 120 140'},run.node));
        let bounds;
        if(check) {
          // Geometry/paint/provenance is compared below against freshly emitted
          // SVG. The stored raster ink bounds need no image dependency in CI.
          bounds=expected.records.find(r=>r.id===source.id)?.modes[mode]?.glyphs[char]?.bounds;
        } else {
          const {data,info} = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
          let x0=info.width,y0=info.height,x1=0,y1=0;
          for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>127) {
            x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);
          }
          bounds=[x0/8-20,y0/8-20,x1/8-20,y1/8-20];
        }
        glyphs[char]={advance:glyph.advance, bounds, node:serializeSvgNode(run.node), reconstructed:profile.reconstructedGlyphs?.[char]??null};
      }
      const format = britishColumbia.formats.find(f=>f.id===source.format);
      const recipe = kitRecipe(format.design.kit);
      const selected = {...recipe,serial:{...recipe.serial,die:source.profile}};
      const plate = scoped(()=>buildKitScene(selected,{serial:source.serial,die:source.profile,finish:'flat'},{scope:'glyph-study'}));
      const monochrome = n => {
        if(n.attrs['data-role']==='serial-separator') return null;
        const copy={...n,attrs:{...n.attrs},children:n.children.flatMap(c=>typeof c==='string'?[c]:[monochrome(c)].filter(Boolean))};
        for(const key of ['fill','stroke']) if(copy.attrs[key] && copy.attrs[key]!=='none') copy.attrs[key]='#000000';
        return copy;
      };
      // Exclude separator artwork only from the painted comparison layer;
      // every glyph retains the actual application's original transforms.
      const serial = monochrome(all(plate).find(n=>n.attrs['data-role']==='serial'));
      const serialSvg = serializeSvgNode(node('svg',{xmlns:'http://www.w3.org/2000/svg',width:1200,height:600,viewBox:'0 0 300 150'},serial));
      record.modes[mode] = {glyphs,serialSvg};
    }
    records.push(record);
  }
  const result={schema:'plateforge.passenger-reconstruction-render/v1',records};
  if(check) assert.deepEqual(result,expected,'Committed reconstruction render evidence is stale; regenerate this study.');
  else fs.writeFileSync(path.join(study,'rendered.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({check,specimens:records.length,modes:4,occurrences:sources.specimens.reduce((n,s)=>n+s.occurrences.length,0),output:path.relative(root,study)+'/rendered.json'}));
} finally { await server.close(); }
