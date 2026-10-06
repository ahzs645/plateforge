import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
const root=process.cwd(),out=path.join(root,'public/data/decal-review');
fs.mkdirSync(path.join(out,'sources'),{recursive:true});fs.mkdirSync(path.join(out,'current'),{recursive:true});fs.mkdirSync(path.join(out,'before'),{recursive:true});
const server=await createServer({root,server:{middlewareMode:true},appType:'custom'});
try{
 const {BC_DECALS,decalId}=await server.ssrLoadModule('/src/regions/canada/bc-decals.ts');
 const {decalArt}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {buildDecal}=await server.ssrLoadModule('/src/templates/bc/decal.ts');
 const before=await server.ssrLoadModule('/docs/research/decal-review/renderer-before.ts');
 const {node,serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const {DECAL_TYPOGRAPHY}=await server.ssrLoadModule('/src/templates/bc/decal-typography.ts');
 const records=[];
 for(const decal of BC_DECALS){
  const id=decalId(decal),r=decal.specimen;
  if(!r?.photoInspected)throw new Error('Missing individual review '+id);
  const parts={serial:'source-comparison',decalMonth:r.month??'JAN',decalSerial:r.control??''};
  const art=decalArt(decal,parts),oldArt={...art,year:String(decal.year).slice(2),aspect:decal.style==='annual'?1.9:decal.style==='solid'&&decal.year>=2005?2.3:3.3};
  for(const [folder,model,renderer]of[['current',art,buildDecal],['before',oldArt,before.buildDecal]]){
   const svg=node('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${model.aspect*100} 100`,width:model.aspect*100,height:100},
    node('title',{},`${id} · ${folder} reconstruction`),node('metadata',{},JSON.stringify({id,source:decal.image,month:parts.decalMonth,control:r.control,system:r.system,accuracy:'source-reviewed layout; candidate fonts and colour approximate'})),renderer(model,{x:0,y:0,width:model.aspect*100,height:100}));
   fs.writeFileSync(path.join(out,folder,id+'.svg'),serializeSvgNode(svg));
  }
  records.push({id,year:decal.year,variant:decal.variant??null,source:decal.image,...r,typography:DECAL_TYPOGRAPHY[id]});
 }
 const py=`import json,urllib.request,hashlib\nfrom pathlib import Path\nfrom PIL import Image\nrecords=json.loads(${JSON.stringify(JSON.stringify(records))})\ncache=Path('/tmp/plateforge-decal-review');cache.mkdir(exist_ok=True)\nfor r in records:\n p=cache/(r['id']+'.jpg')\n if not p.exists():\n  with urllib.request.urlopen(r['source'],timeout=40) as f:p.write_bytes(f.read())\n if hashlib.sha256(p.read_bytes()).hexdigest()!=r['sourceSha256']:raise ValueError('Changed source '+r['id'])\n with Image.open(p) as im:\n  thumb=im.crop(tuple(r['crop'])).convert('RGB');thumb.thumbnail((320,120));thumb.save('${out}/sources/'+r['id']+'.webp',quality=90)\nprint(len(records))`;
 execFileSync('python',['-c',py],{stdio:'pipe'});
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({reviewedOn:'2026-10-06',records,unissuedYears:[1973,1979],limits:'Catalogue specimens inspected individually. Candidate printing fonts, colours, emblems and security scoring remain approximate. Only four source barcodes decoded; encoding for related years is reconstructed.'},null,2)+'\n');
 const review=path.join(root,'public/bc-decal-review');fs.mkdirSync(review,{recursive:true});
 const fontNames={'normal':'Nimbus Sans Bold','regular':'Nimbus Sans Regular','control':'Nimbus Sans Narrow Regular','control-bold':'Nimbus Sans Narrow Bold','vertical-province':'Nimbus Roman Bold','condensed-medium':'Barlow Condensed Semibold','condensed-bold':'Barlow Condensed Bold','heavy-month':'Helvetica Compressed (narrow reconstruction)','heavy-year':'Helvetica Compressed (narrow reconstruction)','heavy-month-wide':'Helvetica Compressed (native candidate)','heavy-year-wide':'Helvetica Compressed (width reconstruction)','outline-1970':'Constructed outlined 70','oswald-600':'Oswald Semibold','anton-400':'Anton Regular','robotocondensed-600':'Roboto Condensed Semibold','archivonarrow-700':'Archivo Narrow Bold','1986-month-reconstruction':'Mixed native reconstruction (Oswald J / Archivo Narrow U / Barlow L; Roboto for other letters)'};
 const fontSummary=r=>Object.entries(r.typography.runs).map(([role,runs])=>`${role.replace('decal-','')}: ${[...new Set(runs.map(run=>fontNames[run.profile]))].join(' / ')}`).join('; ');
 const cards=records.map(r=>`<article id="decal-${r.id}" data-decal-id="${r.id}"><h2>${r.id} · ${r.system}</h2><div class="pair"><figure><img src="../data/decal-review/sources/${r.id}.webp" alt="Original photographed ${r.id} decal"><figcaption>Original photograph · BCpl8s</figcaption></figure><figure><img src="../data/decal-review/${fs.existsSync(path.join(out,'typography-before',r.id+'.svg'))?'typography-before':'before'}/${r.id}.svg" alt="Before typography review · ${r.id}"><figcaption>Before typography review</figcaption></figure><figure><img src="../data/decal-review/current/${r.id}.svg" alt="Corrected ${r.id} rendering"><figcaption>Current reconstruction</figcaption></figure></div><p>${r.reviewNote}</p><p><strong>Line breaks:</strong> ${r.typography.lineBreaks}</p><p><strong>Lettering review:</strong> ${r.typography.finding}</p><p><strong>Font candidates:</strong> ${fontSummary(r)}. Historical font identity unconfirmed; glyph proportions retained and each whole run fitted uniformly.</p><p>Matched specimen text: ${r.month??'annual'} · ${r.control??'control unreadable / illustrative'}. Fonts, colour and fine printing remain approximate.</p><a href="${r.source}">Full original photograph ↗</a></article>`).join('');
 fs.writeFileSync(path.join(review,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B.C. decal comparison · PlateForge</title><style>*{box-sizing:border-box}body{font:16px/1.6 system-ui;background:#f5f6f8;color:#182431;margin:0}main{max-width:1400px;margin:auto;padding:24px}a{color:#155bb0}article{background:white;border:1px solid #d6dbe1;border-radius:10px;padding:18px;margin:20px 0}.pair{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}figure{margin:0}img{width:100%;height:160px;object-fit:contain;background:#e7e9ec;padding:10px}figcaption{padding-top:6px}nav{display:flex;gap:8px;flex-wrap:wrap}h2{font-size:20px}@media(max-width:700px){main{padding:12px}.pair{grid-template-columns:1fr}img{height:130px}}</style></head><body><main><a href="../#/decals/ca-bc/2014-flag">← Decal gallery and current plate</a><h1>Every imported B.C. passenger decal · photograph / before typography review / current</h1><p>${records.length} original specimens individually reviewed. The missing 2001 reference is now included. Four generic layouts have been separated into photographed printing systems; source text is matched for comparison. This is an audit of imported specimens, not every historical decal variant.</p><p>Source photographs are credited cropped thumbnails; rights remain with their creators. Renewal labels are not manufacture dates. Fonts, scan colours, symbols and security scoring remain approximate. Code 128 control encoding was confirmed on four originals; related barcode years use that reconstructed system.</p><p><a href="../bc-decal-glyph-review/index.html">Letter-by-letter overlays, native font candidates and spacing measurements</a></p><nav>${records.map(r=>`<a href="#decal-${r.id}">${r.id}</a>`).join('')}</nav>${cards}<p><a href="../data/decal-review/review.json">Individual findings, source hashes and crop coordinates</a></p></main></body></html>`);
 // Embed credited thumbnails and both SVG states for a portable offline review.
 const ledger='https://github.com/ahzs645/plateforge/blob/fix/1976-1977-decal-flower/docs/research/decal-typography/README.md';
 const standalone=fs.readFileSync(path.join(review,'index.html'),'utf8')
  .replace(/src="(\.\.\/data\/decal-review\/[^"]+)"/g,(_,relative)=>{
   const file=path.resolve(review,relative),mime=file.endsWith('.svg')?'image/svg+xml':'image/webp';
   return `src="data:${mime};base64,${fs.readFileSync(file).toString('base64')}"`;
  })
  .replace('<a href="../#/decals/ca-bc/2014-flag">← Decal gallery and current plate</a>','<p>Standalone review · 55 original / before / current comparisons. Changes are pending in <a href="https://github.com/ahzs645/plateforge/pull/14">pull request #14</a>.</p>')
  .replace('../bc-decal-glyph-review/index.html','https://raw.githubusercontent.com/ahzs645/plateforge/refs/heads/fix/1976-1977-decal-flower/public/bc-decal-glyph-review/standalone.html')
  .replace('../data/decal-review/review.json',ledger);
 fs.writeFileSync(path.join(review,'standalone.html'),standalone);
 fs.writeFileSync(path.join(root,'docs/research/decal-review/review.json'),fs.readFileSync(path.join(out,'review.json')));
 console.log(JSON.stringify({reviewed:records.length,comparisons:records.length,sources:'public/data/decal-review/sources',preview:'public/bc-decal-review'}));
}finally{await server.close()}
