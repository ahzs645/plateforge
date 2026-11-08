/** Bounded exact-month JAN spacing proposals, with current contours unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {auditDecalArt, verifyAuditScene} from '../../../../../../scripts/decal-audit-inputs.mjs';

const here = import.meta.dirname, root = path.resolve(here, '../../../../../..');
const output = path.join(here, 'scene');
fs.mkdirSync(output, {recursive: true});
const references = JSON.parse(fs.readFileSync(path.join(root, 'public/bc-decal-corrections/render-metadata.json'))).specimens;
const sources = JSON.parse(fs.readFileSync(path.join(here, 'metrics.json'))).sources;
const pairs = {'2018': {AN: 4}, '2019': {JA: 5, AN: 9}, '2020': {JA: 5, AN: 7}};
const round = x => Math.round(x*100000)/100000;
const server = await createServer({root, configFile: false, appType: 'custom', optimizeDeps: {noDiscovery: true, entries: [], include: []}, server: {middlewareMode: true, hmr: false, watch: null}});
try {
  const {BC_DECALS, decalId} = await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
  const {decalArt} = await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
  const {buildDecal} = await server.ssrLoadModule('/src/templates/bc/decal.ts');
  const {DECAL_TYPOGRAPHY} = await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
  const {node, serializeSvgNode} = await server.ssrLoadModule('/src/templates/svg-scene.ts');
  const proposals = [];
  for (const source of sources) {
    const id = source.id.slice(0,4), reference = references.find(r => r.id === id);
    if (reference.month !== 'JAN') throw new Error('The bounded check requires exact JAN audit inputs');
    const art = auditDecalArt(BC_DECALS.find(d => decalId(d) === id), reference, decalArt);
    const original = structuredClone(DECAL_TYPOGRAPHY[id]);
    const box = source.thresholdValidation.paintedBoxInCrop.map((v,i) => v + source.roi[i % 2]);
    const [w,h] = source.pixels;
    const sourceBounds = [(box[0]-w/2)*100/h+115, box[1]*100/h, (box[2]-w/2)*100/h+115, box[3]*100/h];
    function render(name, typography) {
      DECAL_TYPOGRAPHY[id] = typography;
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
      if (roles.find(r => r.role === 'decal-month').fit !== 'natural') throw new Error('Month probe was reduced; cannot use it for cap calibration.');
      const file = path.join(output, `${id}-${name}.svg`);
      fs.writeFileSync(file, serializeSvgNode(node('svg', {xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 230 100', width: 230, height: 100}, scene)));
      const boxes = new Map(execFileSync('inkscape', [file, '--query-all'], {encoding: 'utf8', stdio: ['ignore','pipe','pipe']}).trim().split('\n').map(line => {const [key,...v]=line.split(',');return[key,v.map(Number)];}));
      for (const r of roles) {const [x,y,w,h]=boxes.get(r.id);r.box=[x,y,x+w,y+h];}
      execFileSync('inkscape', [file, '--export-height=400', '--export-filename='+file.replace('.svg','.png')], {stdio: 'pipe'});
      return {file: path.relative(here,file), roles};
    }
    const before = render('before', original), candidate = structuredClone(original);
    const variant = candidate.monthVariants.find(v => v.fromMonth === 1 && v.throughMonth === 1);
    if (!variant) throw new Error('Expected exact JAN variant');
    const run = variant.runs['decal-month'][0];
    Object.assign(run, {profile: 'heavy-month-weighted', tracking: 0, kerning: pairs[id], anchor: 'start'});
    const probe = render('probe', candidate).roles.find(r => r.role === 'decal-month').box;
    run.cap = round(run.cap*(sourceBounds[3]-sourceBounds[1])/(probe[3]-probe[1]));
    const measured = render('height-probe', candidate).roles.find(r => r.role === 'decal-month').box;
    run.x = round(run.x + ((sourceBounds[0]+sourceBounds[2]-measured[0]-measured[2])/2)/230);
    run.baseline = round(run.baseline + ((sourceBounds[1]+sourceBounds[3]-measured[1]-measured[3])/2)/100);
    const after = render('after', candidate);
    const c = source.candidates.find(c => c.key === 'spacing-'+id);
    proposals.push({id, month: 'JAN', control: reference.control, role: 'decal-month', run: structuredClone(run),
      scope: 'Only replace decal-month inside the existing exact JAN variant. Retain the base run, other months, glyph outlines, paint weight and every other scene role.',
      source: {file: source.file, sha256: source.sourceSha256, pixels: source.pixels, boundsPixels: box, boundsUniformHeight: sourceBounds},
      registration: 'Uniform source frame-height and horizontal centre; match actual paint height and centre. Source aspect and retained glyph proportions remain unchanged.',
      contourDecision: 'Retain heavy-month-weighted. Existing native alternatives do not improve the complete J/A/N diagnostics: Anton A counter is too tall, and J is too broad for 2018/2020.',
      diagnostic: {widthRatio: c.widthRatio, widthRatioSensitivityRange: c.widthRatioSensitivityRange, sourceGapsPerRunHeight: source.sourceComponents.gapPerRunHeight, candidateGapsPerRunHeight: c.modelComponents.gapPerRunHeight},
      residual: 'A remains narrow, N remains broad in the 2019/2020 photos, and J hook shape is approximate. Pair spacing is based on visible gaps, not forced to eliminate the remaining overall width difference.' + (id === '2020' ? ' The control 00000000 is qualified sample evidence, not proof of normal issuance.' : ''), before, after});
    DECAL_TYPOGRAPHY[id] = original;
  }
  fs.writeFileSync(path.join(here, 'proposals.json'), JSON.stringify({schema: 'plateforge.exact-month-spacing-proposals/v1', proposals}, null, 2)+'\n');
  console.log(JSON.stringify(proposals.map(p => ({id: p.id, run: p.run, sourceBounds: p.source.boundsUniformHeight, before: p.before.roles.find(r => r.role === 'decal-month'), after: p.after.roles.find(r => r.role === 'decal-month'), diagnostic: p.diagnostic})), null, 2));
} finally { await server.close(); }
