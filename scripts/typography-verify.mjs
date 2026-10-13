import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const manifest=json('src/templates/font-manifest.json');
for(const [id,f] of Object.entries(manifest)){
  assert.equal(id,f.id);assert.equal(sha(f.path),f.sha256,`Font bytes changed: ${id}`);
  assert.ok(f.sourceVersion&&f.unicodeRange&&f.license?.status,`Missing identity: ${id}`);
  if(f.package)assert.equal(json(`node_modules/${f.package.name}/package.json`).version,f.package.version);
}
const geometry=json('scripts/typography-geometry-baseline.json');
for(const [path,hash] of Object.entries(geometry))assert.equal(sha(path),hash,`An existing source glyph master changed: ${path}`);
const summary={schema:'plateforge.typography-verification/v1',faces:Object.keys(manifest).length,families:[...new Set(Object.values(manifest).map(f=>f.family))],immutableGeometryFiles:Object.keys(geometry).length,unverifiedFamilies:[...new Set(Object.values(manifest).filter(f=>f.license.status!=='open').map(f=>f.family))],result:'passed'};
mkdirSync('typography-evidence',{recursive:true});writeFileSync('typography-evidence/manifest-verification.json',JSON.stringify(summary,null,2)+'\n');console.log(summary);
