/**
 * Audit actual B.C. renderer output, including every explicit serial-die choice.
 *
 * node scripts/audit-bc-font-evidence.mjs
 * node scripts/audit-bc-font-evidence.mjs --check
 * node /path/to/this/script.mjs --out-dir /tmp/bc-font-before   (cwd selects checkout)
 *
 * Uses the installed app dependencies and Python 3's standard XML parser only.
 * Counts describe these deterministic samples, not complete historical alphabets.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const check = args.includes('--check');
const outputIndex = args.indexOf('--out-dir');
assert(args.every((arg, index) => arg === '--check' || arg === '--out-dir' || index === outputIndex + 1 && outputIndex >= 0), 'Unknown argument');
if (outputIndex >= 0) assert(args[outputIndex + 1] && !args[outputIndex + 1].startsWith('--'), '--out-dir needs a path');
const root = process.cwd();
const out = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : null;
const auditFile = out ? path.join(out, 'audit.json') : path.join(root, 'docs/research/bc-font-audit-2026-11-02/audit.json');
const htmlFile = out ? path.join(out, 'index.html') : path.join(root, 'public/bc-font-audit/index.html');
const sha = (value) => createHash('sha256').update(value).digest('hex');

// XML is parsed rather than searched with a regular expression. Ancestor roles
// distinguish serials, prefixes, legends and dates; repeated occurrences survive.
const parserCode = String.raw`
import sys, json, hashlib, copy, re
import xml.etree.ElementTree as ET
ET.register_namespace('', 'http://www.w3.org/2000/svg')
registry = json.load(open(sys.argv[1]))
paint_keys = ('fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','color')
def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()
def inspect(record):
    root = ET.fromstring(record['svg'])
    runs, texts, errors, tiles, strips, artwork = [], [], [], [], [], []
    def walk(node, role='', die=None, run=None, serial=False, paint=None, transforms=None, art=None):
        attrs = node.attrib
        role = attrs.get('data-role', role)
        art = attrs.get('data-art',art)
        serial = serial or role == 'serial' or role.startswith('serial-')
        paint = dict(paint or {})
        paint.update({key:attrs[key] for key in paint_keys if key in attrs})
        transforms = list(transforms or [])
        if 'transform' in attrs: transforms.append(attrs['transform'])
        if 'data-die' in attrs:
            die = attrs['data-die']
            run = {'role':role, 'serial':serial, 'die':die, 'text':attrs.get('aria-label',''), 'fit':attrs.get('data-fit'), 'glyphs':[]}
            runs.append(run)
        if 'data-character' in attrs:
            char = attrs['data-character']
            unit = attrs.get('data-research-unit')
            provenance = attrs.get('data-provenance','unlabelled')
            is_research = attrs.get('data-source') == 'research'
            if (provenance == 'research-candidate') != is_research:
                errors.append('Research source/provenance disagree: '+char)
            if is_research and not unit or not is_research and unit:
                errors.append('Research source/unit disagree: '+char)
            paths = [n.attrib.get('d','') for n in node.iter() if n.tag.rsplit('}',1)[-1]=='path']
            glyph = {'character':char, 'provenance':provenance, 'unit':unit, 'outlineSha256':digest('\n'.join(paths))}
            if attrs.get('data-source') == 'research':
                source = registry['units'].get(unit)
                index = source and source['glyphs'].get(char)
                match = index is not None and paths == registry['glyphs'][index][1:]
                glyph['matchesRegistryOutline'] = match
                if not match: errors.append('Rendered research outline does not match unit: '+str(unit)+' '+char)
            if run is None:
                # Fixed logo/owner artwork may expose individual characters
                # without being a die alphabet. Preserve it separately.
                artwork.append({'role':role,'art':art,'character':char,'provenance':provenance,'outlineSha256':glyph['outlineSha256']})
            else:
                glyph['index'] = len(run['glyphs'])
                run['glyphs'].append(glyph)
            if record.get('focus') and serial and char.strip():
                # Preserve the actual outline and inherited paint at its native
                # 100-unit cap. Remove placement translation, never squeeze width.
                tile = copy.deepcopy(node)
                for key,value in paint.items(): tile.set(key,value)
                transform = re.sub(r'translate\([^)]*\)', '', tile.get('transform','')).strip()
                if transform: tile.set('transform',transform)
                else: tile.attrib.pop('transform',None)
                svg = ET.Element('{http://www.w3.org/2000/svg}svg', {'viewBox':'-14 -16 128 134','role':'img','aria-label':char+' '+provenance})
                svg.append(tile)
                tiles.append({'character':char,'provenance':provenance,'unit':unit,'svg':ET.tostring(svg,encoding='unicode')})
        if node.tag.rsplit('}',1)[-1] == 'text':
            texts.append({'role':role,'serial':serial,'text':''.join(node.itertext()),'family':attrs.get('font-family'), 'status':attrs.get('data-typeface-status','native-text')})
        # Serial component copies keep actual plate-plane placement and spacing.
        if record.get('focus') and attrs.get('data-role') == 'serial':
            clone = copy.deepcopy(node)
            for descendant in clone.iter():
                for attr in ('filter','mask','clip-path'): descendant.attrib.pop(attr,None)
            for parent in clone.iter():
                for child in list(parent):
                    if child.attrib.get('data-role') == 'serial-separator': parent.remove(child)
            group = ET.Element('{http://www.w3.org/2000/svg}g', paint)
            ancestor_transforms = transforms[:-1] if 'transform' in attrs else transforms
            if ancestor_transforms: group.set('transform',' '.join(ancestor_transforms))
            group.append(clone)
            strips.append(group)
        for child in node:
            walk(child,role,die,run,serial,paint,transforms,art)
    walk(root)
    strip = None
    if record.get('focus'):
        svg = ET.Element('{http://www.w3.org/2000/svg}svg', {'viewBox':root.get('viewBox','0 0 300 150'),'role':'img','aria-label':'Actual serial placement; artwork separator omitted'})
        for element in strips: svg.append(element)
        strip = ET.tostring(svg,encoding='unicode')
    return {'id':record['id'],'runs':runs,'textRuns':texts,'artworkCharacters':artwork,'errors':errors, 'tiles':tiles,'strip':strip}
for line in sys.stdin:
    try: print(json.dumps(inspect(json.loads(line)),separators=(',',':')),flush=True)
    except Exception as error: print(json.dumps({'id':json.loads(line).get('id'),'runs':[],'textRuns':[],'artworkCharacters':[],'tiles':[],'strip':None,'errors':[str(error)]}),flush=True)
`;

async function sourceDigest() {
  const records = [];
  async function visit(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else records.push([path.relative(root, file).split(path.sep).join('/'), sha(await readFile(file))]);
    }
  }
  await visit(path.join(root, 'src'));
  return { algorithm: 'SHA-256 of JSON [relative path, file SHA-256] pairs sorted by path traversal', files: records.length, sha256: sha(JSON.stringify(records)) };
}

const registryBytes = await readFile(path.join(root, 'src/templates/dies/research-registry.json'), 'utf8');
const registry = JSON.parse(registryBytes);
let sourceLedgerBytes = null;
try { sourceLedgerBytes = await readFile(path.join(root, 'docs/research/bc-font-audit-2026-11-02/sources.json'), 'utf8'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const externalEvidence = sourceLedgerBytes ? JSON.parse(sourceLedgerBytes).sources.map(({ id,title,url,sourceType,supports,limitations }) => ({ id,title,url,sourceType,supports,limitations })) : [];
const server = await createServer({ root, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
let parser;
try {
  const { britishColumbia: bc } = await server.ssrLoadModule('/src/regions/canada/index.ts');
  const { bcTemplate } = await server.ssrLoadModule('/src/templates/bc.tsx');
  const { createRng } = await server.ssrLoadModule('/src/core/random.ts');
  const { allDieProfiles } = await server.ssrLoadModule('/src/templates/dies/profiles.ts');
  const { installResearchRegistry, setResearchDiesEnabled } = await server.ssrLoadModule('/src/templates/dies/research-dies.ts');
  installResearchRegistry(registry);
  setResearchDiesEnabled(true);
  const profiles = Object.fromEntries(allDieProfiles().map(profile => [profile.id, {
    label: profile.label, maker: profile.maker ?? null, evidence: profile.evidence,
  }]));
  const cases = [];
  for (const format of bc.formats) {
    const parts = format.generate(createRng('bc-font-evidence:' + format.id));
    cases.push({ id: format.id + '/default', format, parts, kind: 'default', selectedDie: parts.die ?? null });
    for (const option of format.fields.find(field => field.key === 'die')?.options ?? []) {
      cases.push({ id: format.id + '/' + option.value, format, parts: { ...parts, die: option.value }, kind: 'explicit-die', selectedDie: option.value, selectionLabel: option.label });
    }
  }
  const focusSpecs = [
    ...['bc-astro-1','bc-astro-2','bc-astro-3','bc-astro-4'].map(die => ({ format: '1985-flag', die, serial: 'ABC-123' })),
    { format: '1985-flag', die: 'bc-waldale', serial: 'KRL-978' },
    { format: '2001-flag', die: 'bc-astro-4', serial: '123-ABC' },
    { format: '2001-flag', die: 'bc-waldale', serial: '098-SJF' },
    { format: '2001-flag', die: 'bc-waldale', serial: '976-SKP' },
    { format: '2014-flag', serial: 'JA7-91L' },
    { format: '2025-flag', serial: 'A12-3UY' },
    { format: '2025-flag', serial: 'B45-6YZ' },
    { format: 'motorcycle-2011' },
    { format: 'trailer-utility-2016' },
  ];
  for (const [index, spec] of focusSpecs.entries()) {
    const format = bc.formats.find(format => format.id === spec.format);
    assert(format, 'Missing focus format ' + spec.format);
    const parts = { ...format.generate(createRng('bc-font-evidence:' + format.id)), ...(spec.die ? { die: spec.die } : {}), ...(spec.serial ? { serial: spec.serial } : {}) };
    cases.push({ id: 'focus/' + index + '/' + format.id, format, parts, kind: 'focus', selectedDie: parts.die ?? null });
  }

  parser = spawn('python3', ['-u', '-c', parserCode, path.join(root, 'src/templates/dies/research-registry.json')], { stdio: ['pipe','pipe','pipe'] });
  let parserError = '';
  parser.stderr.on('data', chunk => { parserError += chunk; });
  const exited = once(parser, 'exit');
  const parsed = new Map();
  const reading = (async () => {
    for await (const line of createInterface({ input: parser.stdout })) {
      const value = JSON.parse(line);
      parsed.set(value.id, value);
    }
  })();
  for (const item of cases) {
    const design = { ...bc.design, ...item.format.design };
    try {
      assert(!item.format.template || item.format.template === bcTemplate.id, 'Unexpected non-BC template ' + item.format.template);
      const svg = renderToStaticMarkup(createElement(bcTemplate.render, { design, parts: item.parts, text: item.parts.serial ?? '' }), { identifierPrefix: 'font-audit-' });
      assert(!/\b(?:NaN|Infinity)\b/.test(svg), 'Non-finite SVG geometry');
      if (!parser.stdin.write(JSON.stringify({ id: item.id, svg, focus: item.kind === 'focus' }) + '\n')) await once(parser.stdin, 'drain');
    } catch (error) {
      parsed.set(item.id, { id:item.id, runs:[], textRuns:[], artworkCharacters:[], errors:[String(error)], tiles:[], strip:null });
    }
  }
  parser.stdin.end();
  const [code] = await exited;
  await reading;
  assert.equal(code, 0, parserError || 'SVG XML parser failed');
  assert.equal(parsed.size, cases.length, 'Every submitted SVG must have an audit result');

  const focus = [];
  const rows = cases.map(item => {
    const result = parsed.get(item.id);
    const serialRuns = result.runs.filter(run => run.serial);
    const serialDies = [...new Set(serialRuns.map(run => run.die))];
    const glyphs = result.runs.flatMap(run => run.glyphs);
    const counts = { research:0, profileOverride:0, constructed:0, unlabelled:0, whitespace:0 };
    for (const glyph of glyphs) {
      if (!glyph.character.trim()) counts.whitespace++;
      else if (glyph.provenance === 'research-candidate') counts.research++;
      else if (glyph.provenance === 'profile-override') counts.profileOverride++;
      else if (glyph.provenance === 'constructed') counts.constructed++;
      else counts.unlabelled++;
    }
    const selection = !item.selectedDie ? 'not-explicitly-selected'
      : !serialDies.length ? 'not-observable-as-die-run'
      : serialDies.includes(item.selectedDie) ? 'selected-die-rendered' : 'selected-die-mismatch';
    const row = {
      id:item.id, format:item.format.id, label:item.format.label, family:item.format.family ?? 'passenger', kind:item.kind,
      selectedDie:item.selectedDie, selectionLabel:item.selectionLabel ?? null, selectionCheck:selection,
      parts:item.parts, validationError:item.format.validate?.(item.parts) ?? null,
      serialDies, counts, runs:result.runs, textRuns:result.textRuns, artworkCharacters:result.artworkCharacters, errors:result.errors,
      sources:item.format.references ?? [],
    };
    if (item.kind === 'focus') focus.push({ id:item.id, strip:result.strip, tiles:result.tiles });
    return row;
  });
  const nonFocus = rows.filter(row => row.kind !== 'focus');
  const errors = rows.flatMap(row => row.errors.map(error => ({ case:row.id,error })));
  const selectionMismatches = rows.filter(row => row.selectionCheck === 'selected-die-mismatch').map(row => row.id);
  const summary = {
    formats:bc.formats.length, defaultCases:rows.filter(row => row.kind === 'default').length,
    explicitDieCases:rows.filter(row => row.kind === 'explicit-die').length, focusCases:focus.length, totalCases:rows.length,
    sampledGlyphOccurrences:nonFocus.reduce((sum,row) => sum + Object.values(row.counts).reduce((a,b) => a+b,0),0),
    sampledNonWhitespace:nonFocus.reduce((sum,row) => sum + row.counts.research + row.counts.profileOverride + row.counts.constructed + row.counts.unlabelled,0),
    research:nonFocus.reduce((sum,row) => sum + row.counts.research,0),
    profileOverride:nonFocus.reduce((sum,row) => sum + row.counts.profileOverride,0),
    constructed:nonFocus.reduce((sum,row) => sum + row.counts.constructed,0),
    unlabelled:nonFocus.reduce((sum,row) => sum + row.counts.unlabelled,0),
    separateArtworkCharacters:nonFocus.reduce((sum,row) => sum + row.artworkCharacters.length,0),
    structuralErrors:errors.length, selectionMismatches:selectionMismatches.length,
    invalidSampleCases:rows.filter(row => row.validationError).length,
  };
  const usedUnits = [...new Set(rows.flatMap(row => row.runs.flatMap(run => run.glyphs.map(glyph => glyph.unit).filter(Boolean))))].sort();
  const usedProfiles = [...new Set(rows.flatMap(row => row.runs.map(run => run.die)))].sort();
  const audit = {
    schemaVersion:1,
    scope:'One deterministic generated default per B.C. format, every explicitly selectable serial-die option on that same sample, and separate targeted modern examples. No claim of exhaustive input, palette, decal, or historical alphabet coverage.',
    method:'Actual bcTemplate React server render with the committed research registry enabled. Standard-library XML parsing records each emitted data-character occurrence, its nearest die/role, production fallback status and exact research unit. Every research outline is checked byte-for-byte against its claimed registry glyph.',
    limitations:[
      'Research-candidate is provenance, not historical validation. Profile overrides can be traced, supplied outlines or hand-built; consult each profile evidence note.',
      'Live font text and tagged lettering embedded in artwork are recorded separately from die-glyph counts. Artwork without per-character tags cannot be counted as an alphabet. This source-level audit does not measure browser glyph bounds, paint accuracy, photographic similarity or raster-export parity.',
      'Whitespace is counted separately. Default and explicit-selection cases intentionally overlap; totals are sample occurrences, not unique historic observations.',
      'Named die selection alone cannot certify historical tooling, size equivalence or source completeness. Compact and motorcycle contexts remain independently qualified.',
    ],
    inputs:{ sourceTree:await sourceDigest(), registrySha256:sha(registryBytes), scriptSha256:sha(await readFile(fileURLToPath(import.meta.url))), sourceLedgerSha256:sourceLedgerBytes ? sha(sourceLedgerBytes) : null },
    summary, errors, selectionMismatches,
    externalEvidence,
    evidenceGaps:{
      defaultsWithoutResearch:rows.filter(row => row.kind === 'default' && !row.counts.research).map(row => row.format),
      defaultsWithConstructedGlyphs:rows.filter(row => row.kind === 'default' && row.counts.constructed).map(row => row.format),
      casesWithLiveFontText:rows.filter(row => row.textRuns.length).map(row => row.id),
      selectionsWithoutObservableSerialDie:rows.filter(row => row.kind === 'explicit-die' && row.selectionCheck === 'not-observable-as-die-run').map(row => row.id),
    },
    units:Object.fromEntries(usedUnits.map(id => [id,{ title:registry.units[id].title, role:registry.units[id].role, reviewReady:registry.units[id].reviewReady, glyphs:Object.keys(registry.units[id].glyphs).sort().join('') }])),
    profiles:Object.fromEntries(usedProfiles.map(id => [id,profiles[id] ?? { label:id, evidence:null }])),
    cases:rows,
  };
  const html = reportHtml(audit, focus);
  for (const [file, value] of [[auditFile, JSON.stringify(audit,null,2)+'\n'],[htmlFile,html]]) {
    if (check) assert.equal(await readFile(file,'utf8'), value, 'Stale generated audit: '+path.relative(root,file));
    else { await mkdir(path.dirname(file),{recursive:true}); await writeFile(file,value); }
  }
  console.log(JSON.stringify({ ...summary, checked:check, audit:path.relative(root,auditFile), review:path.relative(root,htmlFile) },null,2));
  // Evidence gaps are reported, not converted into false historical failures.
  assert.equal(errors.length,0,'Structural renderer/provenance errors; inspect audit.json');
  assert.equal(selectionMismatches.length,0,'Selected die did not govern an observable serial; inspect audit.json');
  assert.equal(summary.invalidSampleCases,0,'Deterministic sample failed its format validator; inspect audit.json');
} finally {
  parser?.kill();
  await server.close();
}

function reportHtml(audit, focus) {
  // Keep paths only for the thirteen focus strips. Every other row has hashes
  // and provenance, so this offline report does not embed all plate artwork.
  const viewAudit = { ...audit, cases:audit.cases.map(row => ({...row,
    runs:row.runs.map(run => ({...run,glyphs:run.glyphs.map(({outlineSha256,matchesRegistryOutline,...glyph}) => glyph)})),
    artworkCharacters:row.artworkCharacters.map(({outlineSha256,...glyph}) => glyph),
  })) };
  const data = JSON.stringify({ audit:viewAudit, focus }).replace(/</g,'\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B.C. font evidence · PlateForge</title>
<style>
:root{color-scheme:light;--ink:#183043;--muted:#536571;--line:#d4dfe4;--blue:#205f8e;--amber:#8b5d13}*{box-sizing:border-box}body{margin:0;background:#f4f7f8;color:var(--ink);font:16px/1.55 system-ui,sans-serif}header,main,footer{max-width:1160px;margin:auto;padding:28px 24px}header{padding-bottom:12px}h1{font-size:clamp(28px,4vw,44px);letter-spacing:-.035em;line-height:1.12;margin:8px 0 18px}h2{font-size:23px;margin-top:0}h3{font-size:18px;margin:0 0 6px}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--blue)}p{margin:8px 0 15px}.lead{font-size:18px;max-width:900px}.muted,small{color:var(--muted)}a{color:#1b5987}code{font-family:ui-monospace,monospace;font-size:.9em;overflow-wrap:anywhere}.note{border-left:4px solid #d29c43;background:#fff7e6;padding:14px 18px;max-width:1000px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}.stat,.card{background:white;border:1px solid var(--line);border-radius:10px}.stat{padding:13px 16px}.stat strong{display:block;font-size:27px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{padding:18px;min-width:0}.strip{border-bottom:1px solid var(--line);background:#fbfcfd;margin:8px -4px 12px;line-height:0}.strip svg{width:100%;max-height:170px;display:block}.tiles{display:flex;flex-wrap:wrap;gap:6px}.tile{flex:1 1 55px;min-width:48px;max-width:86px;border:1px solid var(--line);border-top:4px solid #397ea5;border-radius:5px;padding:3px;background:#fff}.tile.production{border-top-color:#c89039}.tile svg{width:100%;height:auto;display:block}.tile small{display:block;text-align:center;font-size:10px;line-height:1.2}.sources{font-size:12px;margin-top:12px}.sources a{margin-right:12px}section{margin-bottom:36px}.toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:18px 0}label{font-size:13px;font-weight:600;display:block}input,select{font:inherit;border:1px solid #adbfc9;border-radius:6px;padding:9px 11px;background:white;max-width:100%}input{min-width:260px}.rows{display:grid;gap:8px}details{background:#fff;border:1px solid var(--line);border-radius:7px;padding:10px 14px;overflow-wrap:anywhere}summary{cursor:pointer;font-size:14px}.run{border-top:1px solid #e6ebee;margin-top:13px;padding-top:9px}.glyph{display:inline-block;position:relative;margin:4px 3px 3px 0;padding:4px 7px;border-radius:4px;background:#e6f1f7;border:1px solid #b3d1e1;font:14px ui-monospace,monospace;cursor:help}.glyph.production{background:#fff3da;border-color:#e2c98f}.glyph.whitespace{background:#f1f1f1;border-color:#ddd}.legend{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;margin-bottom:16px}.dot{display:inline-block;width:10px;height:10px;background:#397ea5;border-radius:50%;margin-right:5px}.dot.prod{background:#c89039}button{font:inherit;padding:7px 12px;background:white;border:1px solid #adbfc9;border-radius:5px;cursor:pointer}footer{border-top:1px solid var(--line);font-size:13px;padding-top:18px}ul{padding-left:22px}.table-scroll{overflow:auto}table{border-collapse:collapse;font-size:14px}th,td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left}#result-count{font-size:13px;color:var(--muted)}@media(max-width:700px){header,main,footer{padding-left:15px;padding-right:15px}.grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}input{min-width:0;width:100%}.toolbar>div{flex:1 1 150px}.card{padding:14px}.tile{max-width:72px}}
.muted,.sources,#fingerprint{overflow-wrap:anywhere}.toolbar>div{min-width:0}select{width:100%}
</style></head><body>
<header><div class="eyebrow">PlateForge · B.C. lettering research</div><h1>Which alphabet is actually drawn?</h1><p class="lead">An audit of the real renderer, with every B.C. format and every explicit serial-die choice. The focused comparisons below retain each glyph’s native proportions and identify its exact research unit or production fallback.</p><p class="note"><strong>Evidence, not certification.</strong> Research outlines remain unvalidated candidates. Counts describe the chosen samples; they do not establish historical font identity, complete alphabet coverage or photographic accuracy.</p><div id="stats" class="stats"></div></header>
<main><p><a href="before-after.html">Open the four before / after font-selection comparisons</a></p><section aria-labelledby="focus-heading"><h2 id="focus-heading">Modern passenger and small-format checks</h2><p>Each strip preserves the actual serial’s placement and spacing. The artwork separator is omitted, leaving its gap visible. Individual tiles show the same emitted outlines at a common 100-unit cap height; widths are never independently stretched.</p><div class="legend"><span><i class="dot"></i>Research candidate</span><span><i class="dot prod"></i>Production override or constructed fallback</span></div><div id="focus" class="grid"></div></section>
<section aria-labelledby="inventory-heading"><h2 id="inventory-heading">Complete sampled inventory</h2><p>Choose a row to see every emitted character, including repeated occurrences. Hover or focus a character for its source. Live font text is listed separately. A selected family name does not by itself verify the original tooling.</p><div class="toolbar"><div><label for="search">Search format, die or source</label><input id="search" type="search" placeholder="Try Astrographic, 1951 or UYZ"></div><div><label for="family">Plate family</label><select id="family"><option value="">All families</option></select></div><div><label for="kind">Cases</label><select id="kind"><option value="">Defaults and explicit choices</option><option value="default">Default</option><option value="explicit-die">Explicit die choice</option><option value="focus">Focused examples</option></select></div><button id="reset" type="button">Reset</button></div><p id="result-count" aria-live="polite"></p><div id="rows" class="rows"></div></section>
<section><h2>Sources reviewed in this pass</h2><p>Official specifications establish dated requirements. Photographs support only their observed characters; independent font recreations remain comparison candidates.</p><div id="evidence" class="rows"></div></section>
<section><h2>How to read the evidence</h2><ul id="limitations"></ul><p>Generated by <code>node scripts/audit-bc-font-evidence.mjs</code>. Use <code>--check</code> to verify the committed audit and this report. The complete machine-readable occurrence ledger is <code>docs/research/bc-font-audit-2026-11-02/audit.json</code>.</p><p id="fingerprint" class="muted"></p></section></main><footer>Photographs and font software are not embedded. Source owners retain their rights. Profile source links provide context; archived research-unit originals may still be needed to validate the traced contours.</footer>
<script id="audit-data" type="application/json">${data}</script><script>
const {audit,focus}=JSON.parse(document.getElementById('audit-data').textContent);const byId=new Map(audit.cases.map(r=>[r.id,r]));
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function sourceLinks(row){const wrap=el('div',undefined,'sources');const sources=[...row.sources,...row.serialDies.flatMap(id=>audit.profiles[id]?.evidence?.specimens??[])];for(const source of [...new Map(sources.map(s=>[s.url,s])).values()]){const a=el('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';wrap.append(a)}return wrap}
for(const [value,label] of [[audit.summary.formats,'B.C. formats'],[audit.summary.explicitDieCases,'explicit die cases'],[audit.summary.research,'research glyph occurrences'],[audit.summary.constructed,'constructed occurrences']]){const box=el('div',undefined,'stat');box.append(el('strong',value.toLocaleString()),el('span',label));document.getElementById('stats').append(box)}
for(const item of focus){const row=byId.get(item.id),card=el('article',undefined,'card');card.append(el('h3',row.label),el('p',row.parts.serial+' · '+row.serialDies.map(id=>audit.profiles[id]?.label??id).join(', '),'muted'));const strip=el('div',undefined,'strip');strip.innerHTML=item.strip;card.append(strip);const tiles=el('div',undefined,'tiles');for(const glyph of item.tiles){const tile=el('div',undefined,'tile'+(glyph.provenance==='research-candidate'?'':' production'));tile.tabIndex=0;tile.title=glyph.character+' — '+glyph.provenance+(glyph.unit?' — '+glyph.unit:'');tile.innerHTML=glyph.svg;tile.append(el('small',glyph.provenance==='research-candidate'?'research':glyph.provenance==='constructed'?'constructed':'override'));tiles.append(tile)}card.append(tiles);const units=[...new Set(row.runs.filter(r=>r.serial).flatMap(r=>r.glyphs.map(g=>g.unit).filter(Boolean)))];card.append(el('p',units.length?units.map(id=>audit.units[id]?.title??id).join(' · '):'No research unit in this serial.','sources'));card.append(sourceLinks(row));document.getElementById('focus').append(card)}
for(const family of [...new Set(audit.cases.map(row=>row.family))].sort()){const option=el('option',family);option.value=family;document.getElementById('family').append(option)}
for(const source of audit.externalEvidence){const row=el('details');row.append(el('summary',source.title));const link=el('a','Open original source');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';row.append(link,el('p',source.supports));row.append(el('p',Array.isArray(source.limitations)?source.limitations.join(' '):source.limitations,'muted'));document.getElementById('evidence').append(row)}
for(const limitation of audit.limitations)document.getElementById('limitations').append(el('li',limitation));document.getElementById('fingerprint').textContent='Source tree SHA-256: '+audit.inputs.sourceTree.sha256+' · Registry SHA-256: '+audit.inputs.registrySha256;
function details(row){const box=el('details');box.dataset.case=row.id;const count=row.counts;box.append(el('summary',row.label+' · '+(row.selectionLabel??row.selectedDie??row.kind)+' · '+row.parts.serial+' — '+count.research+' research / '+(count.profileOverride+count.constructed)+' production'));box.addEventListener('toggle',()=>{if(!box.open||box.dataset.loaded)return;box.dataset.loaded='yes';box.append(el('p',row.selectionCheck+' · '+row.id,'muted'));for(const run of row.runs){const group=el('div',undefined,'run');group.append(el('strong',run.role+' · '+run.die+' · '+run.text));const chars=el('div');for(const glyph of run.glyphs){const g=el('span',glyph.character.trim()?glyph.character:'␠','glyph'+(glyph.provenance==='research-candidate'?'':' production')+(!glyph.character.trim()?' whitespace':''));g.tabIndex=0;g.title='Occurrence '+glyph.index+' · '+glyph.provenance+(glyph.unit?' · '+glyph.unit+' · '+(audit.units[glyph.unit]?.title??''):'');chars.append(g)}group.append(chars);const units=[...new Set(run.glyphs.map(g=>g.unit).filter(Boolean))];for(const unit of units)group.append(el('p',unit+' — '+audit.units[unit]?.title,'sources'));box.append(group)}if(row.artworkCharacters.length){const a=el('div',undefined,'run');a.append(el('strong','Tagged artwork characters (outside die counts)'));for(const glyph of row.artworkCharacters)a.append(el('span',glyph.character+' · '+(glyph.art??glyph.role)+' · '+glyph.provenance,'glyph production'));box.append(a)}if(row.textRuns.length){const t=el('div',undefined,'run');t.append(el('strong','Live font text (outside outline counts)'));for(const run of row.textRuns)t.append(el('p',run.role+': '+run.text+' · '+run.family+' · '+run.status,'sources'));box.append(t)}for(const error of row.errors)box.append(el('p',error,'note'));box.append(sourceLinks(row))});return box}
function update(){const q=document.getElementById('search').value.toLowerCase(),family=document.getElementById('family').value,kind=document.getElementById('kind').value;const rows=audit.cases.filter(row=>(kind?row.kind===kind:row.kind!=='focus')&&(!family||row.family===family)&&(!q||JSON.stringify(row).toLowerCase().includes(q)));document.getElementById('result-count').textContent=rows.length+' matching cases. Default and explicit-choice samples intentionally overlap.';document.getElementById('rows').replaceChildren(...rows.map(details))}
for(const id of ['search','family','kind'])document.getElementById(id).addEventListener(id==='search'?'input':'change',update);document.getElementById('reset').addEventListener('click',()=>{for(const id of ['search','family','kind'])document.getElementById(id).value='';update()});update();
</script></body></html>\n`;
}
