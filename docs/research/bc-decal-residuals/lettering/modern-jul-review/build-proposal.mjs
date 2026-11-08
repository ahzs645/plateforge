/** Exact 2021 JUL proposal, rendering scene paint before and after in memory only. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {auditDecalArt, verifyAuditScene} from '../../../../../scripts/decal-audit-inputs.mjs';

const here = import.meta.dirname;
const root = path.resolve(here, '../../../../..');
const output = path.join(here, 'scene');
fs.mkdirSync(output, {recursive: true});
const reference = JSON.parse(fs.readFileSync(path.join(root, 'public/bc-decal-corrections/render-metadata.json'))).specimens.find(r => r.id === '2021');
const source = JSON.parse(fs.readFileSync(path.join(here, 'metrics.json'))).sources.find(r => r.id === '2021-pinned');
const box = source.thresholdValidation.paintedBoxInCrop.map((v,i) => v + source.roi[i % 2]);
const [w,h] = source.pixels;
const sourceBounds = [(box[0]-w/2)*100/h+115, box[1]*100/h, (box[2]-w/2)*100/h+115, box[3]*100/h];
const round = x => Math.round(x*100000)/100000;
const server = await createServer({root, configFile: false, appType: 'custom', optimizeDeps: {noDiscovery: true, entries: [], include: []}, server: {middlewareMode: true, hmr: false, watch: null}});
try {
  const {BC_DECALS, decalId} = await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt} = await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal} = await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {DECAL_TYPOGRAPHY} = await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
  const {node, serializeSvgNode} = await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const art = auditDecalArt(BC_DECALS.find(d => decalId(d) === '2021'), reference, decalArt);
  const original = structuredClone(DECAL_TYPOGRAPHY['2021']);
  function render(name, typography) {
    DECAL_TYPOGRAPHY['2021'] = typography;
    const scene = buildDecal(art, {x: 0, y: 0, width: 230, height: 100});
    verifyAuditScene(scene, reference);
    const roles = [], counts = {};
    function walk(n) {
      if (typeof n === 'string') return;
      const role = n.attrs?.['data-role'];
      if (role && n.attrs['data-die']) {
        const index = counts[role] ?? 0; counts[role] = index+1;
        n.attrs.id = `paint-${role}-${index}`;
        roles.push({role, index, id: n.attrs.id, profile: n.attrs['data-die'], fit: n.attrs['data-fit']});
      }
      for (const c of n.children ?? []) walk(c);
    }
    walk(scene);
    if (roles.find(r => r.role === 'decal-month').fit !== 'natural') throw new Error('A month probe was reduced; enlarge the guard before calibrating paint height.');
    const file = path.join(output, `${name}.svg`);
    fs.writeFileSync(file, serializeSvgNode(node('svg', {xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 230 100', width: 230, height: 100}, scene)));
    const boxes = new Map(execFileSync('inkscape', [file, '--query-all'], {encoding: 'utf8', stdio: ['ignore','pipe','pipe']}).trim().split('\n').map(line => {const [id,...values]=line.split(','); return [id,values.map(Number)];}));
    for (const r of roles) {const [x,y,w,h]=boxes.get(r.id);r.box=[x,y,x+w,y+h];}
    execFileSync('inkscape', [file, '--export-height=400', '--export-filename='+file.replace('.svg','.png')], {stdio: 'pipe'});
    return {file: path.relative(here,file), roles};
  }
  const before = render('before', original);
  const candidate = structuredClone(original);
  const variant = candidate.monthVariants.find(v => v.fromMonth === 7 && v.throughMonth === 7);
  if (!variant) throw new Error('Expected exact 2021 JUL variant');
  const run = variant.runs['decal-month'][0];
  Object.assign(run, {profile: 'anton-400', tracking: 0, kerning: {JU: 2.5, UL: 3.5}, anchor: 'start', width: .34});
  const probe = render('probe', candidate).roles.find(r => r.role === 'decal-month').box;
  run.cap = round(run.cap*(sourceBounds[3]-sourceBounds[1])/(probe[3]-probe[1]));
  const measured = render('height-probe', candidate).roles.find(r => r.role === 'decal-month').box;
  run.x = round(run.x + ((sourceBounds[0]+sourceBounds[2]-measured[0]-measured[2])/2)/230);
  run.baseline = round(run.baseline + ((sourceBounds[1]+sourceBounds[3]-measured[1]-measured[3])/2)/100);
  const after = render('after', candidate);
  if (after.roles.find(r => r.role === 'decal-month').fit !== 'natural') throw new Error('Month run was fitted instead of natural');
  const proposal = {
    schema: 'plateforge.exact-month-native-proposal/v1', id: '2021', month: 'JUL', control: reference.control,
    scope: 'Only replace decal-month inside the existing exact 2021 JUL variant. Do not alter the base run, other months, other years, province, year, control or barcode.',
    source: {file: source.file, sha256: source.sourceSha256, pixels: source.pixels, boundsPixels: box, boundsUniformHeight: sourceBounds},
    registration: 'Uniform source frame-height and horizontal centre. Match actual paint height and centre; preserve native contour width and paint weight.',
    role: 'decal-month', run: structuredClone(run),
    contourProvenance: 'Existing bc-decal-print-anton-400 native outlines. No path edits, artificial stroke, or horizontal scaling.',
    spacingEvidence: 'Observed JU gap is about 0.091–0.093 of painted run height. UL is about 0.093–0.114. JU +2.5 and UL +3.5 cap units bring the native pair gaps into that interval without expanding the L to hide its short foot.',
    residual: 'Native L remains about 15–17% short in painted width at equal glyph height. J hook is slightly higher than the photographs. Small blurred unrectified sources do not establish historical font identity or exact contours.',
    before, after,
  };
  fs.writeFileSync(path.join(here, 'proposal.json'), JSON.stringify(proposal, null, 2)+'\n');
  console.log(JSON.stringify({run: proposal.run, sourceBounds, before: before.roles.find(r => r.role === 'decal-month'), after: after.roles.find(r => r.role === 'decal-month')}, null, 2));
} finally { await server.close(); }
