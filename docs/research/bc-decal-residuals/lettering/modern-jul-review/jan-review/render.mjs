/** Bounded canonical JAN comparison using existing outlines, with no construction or x scaling. */
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const root = path.resolve(import.meta.dirname, '../../../../../..');
const output = path.join(import.meta.dirname, 'rendered');
fs.mkdirSync(output, { recursive: true });
const server = await createServer({root, configFile: false, server: {middlewareMode: true, watch: null, hmr: false}, appType: 'custom', optimizeDeps: {noDiscovery: true, include: [], entries: []}});
try {
  const { buildDieText } = await server.ssrLoadModule('/src/templates/dies/engine.ts');
  const { dieProfile } = await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const { node, serializeSvgNode } = await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const native = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/decal-glyph-analysis/candidate-outlines.json'), 'utf8'));
  const entries = [
    {key: 'retained', profile: dieProfile('bc-decal-print-heavy-month-weighted'), native: false},
    {key: 'heavy-month-wide', profile: dieProfile('bc-decal-print-heavy-month-wide'), native: true},
    {key: 'spacing-2018', profile: dieProfile('bc-decal-print-heavy-month-weighted'), native: false, kerning: {AN: 4}},
    {key: 'spacing-2019', profile: dieProfile('bc-decal-print-heavy-month-weighted'), native: false, kerning: {JA: 5, AN: 9}},
    {key: 'spacing-2020', profile: dieProfile('bc-decal-print-heavy-month-weighted'), native: false, kerning: {JA: 5, AN: 7}},
    ...Object.entries(native).map(([key, glyphs]) => ({key, native: true, profile: {
      id: 'native-' + key, label: key, params: {width: 50, stroke: 0, curve: 'oval', tracking: 0},
      overrides: glyphs, allowConstructedFallback: false, allowResearchReplacement: false,
      evidence: {status: 'research-candidate', specimens: [], notes: 'Unmodified native comparison candidate.'},
    }})),
  ];
  const manifest = [];
  for (const entry of entries) {
    for (const text of ['JAN', 'J', 'A', 'N']) {
      const result = buildDieText({text, profile: entry.profile, x: 0, baseline: 100, capHeight: 100, anchor: 'start', ink: '#111', role: 'decal-comparison', letterSpacing: 0, kerning: entry.kerning});
      const file = `${entry.key}--${text}.svg`;
      fs.writeFileSync(path.join(output, file), serializeSvgNode(node('svg', {xmlns: 'http://www.w3.org/2000/svg', width: result.width + 20, height: 124, viewBox: `-10 -12 ${result.width + 20} 124`}, result.node)));
      manifest.push({key: entry.key, native: entry.native, text, profile: entry.profile.id, file, fit: result.fit, advanceWidth: result.width, filledStroke: entry.profile.filledStroke ?? 0, kerning: entry.kerning ?? {}});
    }
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({rendered: manifest.length, natural: manifest.every(x => x.fit === 'natural')}));
} finally { await server.close(); }
