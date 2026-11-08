/** Actual SVG fixtures plus isolated source/derived glyphs for the 1986 review. */
import {createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const destination = process.argv[2];
if (!destination) throw new Error('Supply an output JSON path.');
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/bc-decal-corrections/expo86/references.json'), 'utf8'));
// This review loads renderer modules only. Do not scan the hundreds of stored
// HTML evidence previews as application dependency entry points.
const server = await createServer({root, configFile: false,
  server: {middlewareMode: true, watch: null, hmr: false}, appType: 'custom',
  optimizeDeps: {noDiscovery: true, include: [], entries: []},
});
try {
  const {BC_DECALS} = await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt} = await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal} = await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {buildDieText} = await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {dieProfile} = await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const {DECAL_EXPO_MONTH_PROFILE} = await server.ssrLoadModule('/src/templates/dies/decal-expo-month.ts');
  const {node, serializeSvgNode} = await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const candidate = process.argv.includes('--candidate');
  if (candidate) {
    const {DECAL_TYPOGRAPHY} = await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
    const run = DECAL_TYPOGRAPHY['1986'].runs['decal-month'][0];
    run.profile = '1986-rounded-corrected';
    run.kerning = {...run.kerning, AR:0, PR:-3};
  }
  const decal = BC_DECALS.find(d => d.year === 1986);
  const svg = (child, width=330, height=100) => serializeSvgNode(node('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${width} ${height}`, width: width*4, height: height*4,
  }, child));
  const fixtures = manifest.specimens.map(reference => {
    const art = decalArt(decal, {decalMonth: reference.month, decalSerial: reference.control});
    if (art.serial !== reference.control) throw new Error(`Control changed for ${reference.id}`);
    const fixture = svg(buildDecal(art, {x:0,y:0,width:330,height:100}));
    if (!fixture.includes(DECAL_EXPO_MONTH_PROFILE.id)) throw new Error('1986 month is not using the corrected decal profile');
    return {...reference, svg: fixture};
  });
  const glyphs = {};
  for (const [name, profile] of Object.entries({before: dieProfile('bc-decal-print-1986-rounded-reconstruction'), after: DECAL_EXPO_MONTH_PROFILE})) {
    glyphs[name] = {};
    for (const char of [...new Set('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC')]) {
      glyphs[name][char] = svg(buildDieText({text: char, profile, x:15, baseline:115, capHeight:100,
        anchor:'start', ink:'#000', role:'decal-month'}).node, 150, 130);
    }
  }
  fs.writeFileSync(destination, JSON.stringify({baseline: manifest.baseline, candidate, fixtures, glyphs}, null, 2)+'\n');
} finally {await server.close();}
