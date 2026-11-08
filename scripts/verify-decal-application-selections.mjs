/** Preflight offered selections with production registration and validation.
 * This is independent of Chromium and does not claim browser/export execution.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {decalApplicationCases} from './decal-application-cases.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/verify-decal-application-selections.mjs output.json');
const source = fs.readFileSync(path.join(root, 'docs/research/decal-online-analysis/reference-manifest.json'));
const references = JSON.parse(source);
const server = await createServer({root, configFile: false, appType: 'custom',
  optimizeDeps: {noDiscovery: true, entries: []}, server: {middlewareMode: true, hmr: false, watch: null}});
try {
  await server.ssrLoadModule('/src/regions/index.ts');
  const {getRegions, generatePlate, makePlate} = await server.ssrLoadModule('/src/core/registry.ts');
  const {createRng} = await server.ssrLoadModule('/src/core/random.ts');
  const {BC_DECALS, decalId} = await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt} = await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal} = await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const regions = getRegions();
  const formats = regions.flatMap(region => region.formats.map(format => ({region: region.id, format: format.id,
    decalIds: format.fields.find(field => field.key === 'decal')?.options?.map(option => option.value) ?? []})));
  const cases = decalApplicationCases(references, formats);
  const rows = cases.map(item => {
    const region = regions.find(candidate => candidate.id === item.region);
    const format = region.formats.find(candidate => candidate.id === item.format);
    const generated = generatePlate(region, format, createRng(`typography:${region.id}:${format.id}`));
    const plate = makePlate(region, format, {...generated.parts, ...item.parts});
    assert.equal(format.validate?.(plate.parts) ?? null, null, item.specimen + ' is not a valid application selection');
    const decal = BC_DECALS.find(candidate => decalId(candidate) === item.parts.decal);
    const art = decalArt(decal, plate.parts);
    assert.equal(art.serial ?? null, item.expectedDecal.control);
    assert.equal(art.month ?? null, item.expectedDecal.month);
    const scene = buildDecal(art, {x: 0, y: 0, width: art.aspect * 100, height: 100});
    const printed = [];
    const visit = node => {
      if (typeof node === 'string') return;
      if (node.attrs['data-die']) {
        const glyphs = [];
        const collect = child => {
          if (typeof child === 'string') return;
          if (child.attrs['data-character']) glyphs.push(child.attrs['data-character']);
          child.children.forEach(collect);
        };
        collect(node);
        assert.equal(glyphs.join(''), node.attrs['aria-label'], item.specimen + ' lost an actual glyph');
        printed.push({role: node.attrs['data-role'], text: glyphs.join(''), profile: node.attrs['data-die']});
      }
      node.children.forEach(visit);
    };
    visit(scene);
    return {...item, generatedPlateSerial: plate.text, validation: null, printed};
  });
  const report = {schema: 'plateforge.decal-application-preflight/v1', status: 'passed',
    method: 'Production offered fields, generatePlate/makePlate, format.validate, decalArt and actual vector glyph sequences. No browser or raster-export execution.',
    referenceManifestSha256: crypto.createHash('sha256').update(source).digest('hex'),
    referenceCases: references.length, leadingZeroCases: 1, cases: rows};
  fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({referenceCases: references.length, leadingZeroCases: 1, status: report.status}));
} finally {
  await server.close();
}
