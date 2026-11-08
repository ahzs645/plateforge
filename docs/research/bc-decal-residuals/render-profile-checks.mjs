/** Render newly authored province/year characters through the production engine. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const server = await createServer({root, configFile: false, appType: 'custom',
  optimizeDeps: {noDiscovery: true, entries: []}, server: {middlewareMode: true, hmr: false, watch: null}});
try {
  const {dieProfile} = await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const {buildDieText} = await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const {node, serializeSvgNode} = await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const rows = [];
  for (const [profile, text] of [
    ['province-wide-1981-reconstruction', 'ABCHILMORSTU'],
    ['province-tall-2010-reconstruction', 'ABCHILMORSTU'],
    ['modern-late-year-reconstruction', '01239'],
  ]) {
    for (const character of text) {
      const run = buildDieText({text: character, profile: dieProfile('bc-decal-print-' + profile),
        x: 20, baseline: 120, capHeight: 100, maxWidth: 200, anchor: 'start', ink: '#000', role: 'glyph-check'}).node;
      rows.push({profile, character, fit: run.attrs['data-fit'],
        expectedCounters: ({A: 1, B: 2, O: 1, R: 1, '0': 1, '9': 1})[character] ?? 0,
        svg: serializeSvgNode(node('svg', {xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 180 150'}, run))});
    }
  }
  fs.writeFileSync(path.join(here, 'profile-check-inputs.json'), JSON.stringify(rows, null, 2) + '\n');
  console.log(JSON.stringify({glyphs: rows.length, natural: rows.every(row => row.fit === 'natural')}));
} finally { await server.close(); }
