/** Portable PNG overview outputs. Run after build-comparisons.py. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
let sharp;
try { sharp=require('sharp'); }
catch { sharp=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'package.json'))('sharp'); }
const out='public/bc-font-reconstruction';
const records=[];
for(const name of ['modern','n']) {
  const svg=`${name}-overview.svg`, png=`${name}-overview.png`;
  const buffer=await sharp(fs.readFileSync(path.join(out,svg))).resize({width:1200}).png({compressionLevel:9}).toBuffer();
  fs.writeFileSync(path.join(out,png),buffer);
  const info=await sharp(buffer).metadata();
  records.push({svg,png,width:info.width,height:info.height,sha256:createHash('sha256').update(buffer).digest('hex')});
}
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
manifest.overviews=records;
for(const file of [path.join(out,'manifest.json'),'docs/research/bc-font-reconstruction-2026-11-08/comparisons.json']) fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({overviews:records}));
