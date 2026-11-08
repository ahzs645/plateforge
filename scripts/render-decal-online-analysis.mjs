import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {auditDecalArt, auditPrintingProfiles, verifyAuditScene} from './decal-audit-inputs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'docs/research/decal-online-analysis/reference-manifest.json');
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
if (!process.argv[2]) throw new Error('Usage: node scripts/render-decal-online-analysis.mjs output.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (directory, ...args) => execFileSync('git', ['-C', directory, ...args], {encoding: 'utf8'}).trim();

function provenance(directory, requireClean = false) {
  directory = fs.realpathSync(directory);
  if (fs.realpathSync(git(directory, 'rev-parse', '--show-toplevel')) !== directory) {
    throw new Error(`Audit renderer root must be a complete repository checkout: ${directory}`);
  }
  const changes = git(directory, 'status', '--porcelain', '--untracked-files=normal');
  if (requireClean && changes) throw new Error('Historical baseline must be a clean, complete checkout; it has working changes');
  const files = [...new Set(execFileSync('git', ['-C', directory, 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'src', 'package-lock.json'], {encoding: 'utf8'}).split('\0').filter(Boolean))].sort();
  const source = crypto.createHash('sha256');
  for (const file of files) {
    source.update(file).update('\0');
    source.update(fs.existsSync(path.join(directory, file)) ? fs.readFileSync(path.join(directory, file)) : '<deleted>');
  }
  return {commit: git(directory, 'rev-parse', 'HEAD'), workingChanges: Boolean(changes), sourceSha256: source.digest('hex'), sourceHashScope: 'Sorted tracked and nonignored untracked src files plus package-lock.json: relative path, NUL, file bytes'};
}

async function renderCheckout(directory, references) {
  // This is an explicit SSR fixture, not an interactive dev server. Archived
  // research HTML is large and must not become a dependency-discovery entry.
  const server = await createServer({root: directory, configFile: false, appType: 'custom',
    optimizeDeps: {noDiscovery: true, entries: []}, server: {middlewareMode: true, hmr: false, watch: null}});
  try {
    const {BC_DECALS, decalId} = await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
    const {decalArt} = await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
    const {buildDecal} = await server.ssrLoadModule('/src/templates/bc/decal.ts');
    const {DECAL_PRINTING_PROFILES} = await server.ssrLoadModule('/src/templates/dies/decal-printing.ts');
    const {node, serializeSvgNode} = await server.ssrLoadModule('/src/templates/svg-scene.ts');
    const decals = references.map(reference => {
      const decal = BC_DECALS.find(candidate => decalId(candidate) === reference.catalogueId);
      if (!decal) throw new Error(`Unknown audit catalogue variant ${reference.catalogueId} for ${reference.id}`);
      const art = auditDecalArt(decal, reference, decalArt);
      const width = art.aspect * 100;
      const scene = buildDecal(art, {x: 0, y: 0, width, height: 100});
      const printedInputs = verifyAuditScene(scene, reference);
      return {
        id: reference.id, catalogueId: reference.catalogueId, source: reference.source, specimen: reference,
        auditInputs: {month: reference.month, control: reference.control, day: reference.day ?? null},
        renderedInputs: {month: art.month ?? null, control: art.serial ?? null, day: art.day ?? null},
        printedInputs,
        svg: serializeSvgNode(node('svg', {xmlns: 'http://www.w3.org/2000/svg', width, height: 100, viewBox: `0 0 ${width} 100`}, scene)),
      };
    });
    return {profiles: auditPrintingProfiles(DECAL_PRINTING_PROFILES), decals};
  } finally { await server.close(); }
}

const currentProvenance = provenance(root);
const data = await renderCheckout(root, manifest);
data.provenance = {
  schema: 'plateforge.decal-audit-render/v2', current: currentProvenance,
  manifestSha256: hash(manifestBytes),
  auditorSha256: Object.fromEntries(['scripts/render-decal-online-analysis.mjs', 'scripts/decal-audit-inputs.mjs'].map(file => [file, hash(fs.readFileSync(path.join(root, file)))])),
  inputPolicy: 'Explicit source month/control preserved. Invalid values fail; null control is omitted. Editor fallbacks are unchanged.',
  baseline: null,
  comparison: 'Current checkout only. No historical before render is asserted.',
};
if (process.env.DECAL_ANALYSIS_BASELINE_ROOT) {
  const baselineRoot = fs.realpathSync(process.env.DECAL_ANALYSIS_BASELINE_ROOT);
  if (baselineRoot === fs.realpathSync(root)) throw new Error('Use a separate clean baseline checkout, not the working checkout');
  const baselineProvenance = provenance(baselineRoot, true);
  const baseline = await renderCheckout(baselineRoot, manifest);
  if (provenance(baselineRoot, true).sourceSha256 !== baselineProvenance.sourceSha256) throw new Error('Baseline sources changed during rendering');
  data.baselineProfiles = baseline.profiles;
  data.decals.forEach((decal, index) => { decal.beforeSvg = baseline.decals[index].svg; });
  data.provenance.baseline = baselineProvenance;
  data.provenance.comparison = 'Complete clean baseline checkout and current checkout, rendered with the same corrected explicit specimen inputs. This is a newly reproduced comparison, not an archived historical capture.';
}
if (provenance(root).sourceSha256 !== currentProvenance.sourceSha256 || hash(fs.readFileSync(manifestPath)) !== hash(manifestBytes)) {
  throw new Error('Current sources or specimen bindings changed during rendering; rerun after edits are complete');
}
fs.writeFileSync(process.argv[2], JSON.stringify(data));
console.log(JSON.stringify({specimens: data.decals.length, current: data.provenance.current.commit, baseline: data.provenance.baseline?.commit ?? null, manifestSha256: data.provenance.manifestSha256}));
