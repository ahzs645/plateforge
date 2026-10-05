import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=process.cwd(),out=path.join(root,'public/passenger-carrier-flag-review');fs.mkdirSync(out,{recursive:true});
const cases=[{id:'2005',serial:'810-301',source:'https://www.bcpl8s.ca/images/MotorCarrier/2005-810301(XL).jpg',file:'2005-810301(XL).jpg',box:[37,17,1480,846]},
  {id:'2024',serial:'814-298',source:'https://www.bcpl8s.ca/images/PassengerCarrier/2024-814298(XL).jpg',file:'2024-814298(XL).jpg',box:[5,5,1110,630]}];
const crop=`import json,hashlib,urllib.request\nfrom pathlib import Path\nfrom PIL import Image\np=Path('/tmp/plateforge-passenger-carrier');p.mkdir(exist_ok=True)\nrecords=[]\nfor c in json.loads(${JSON.stringify(JSON.stringify(cases))}):\n f=p/c['file']\n if not f.exists():\n  with urllib.request.urlopen(c['source'],timeout=30) as r:f.write_bytes(r.read())\n with Image.open(f) as im:\n  thumb=im.crop(tuple(c['box']));thumb.thumbnail((700,450));thumb.save('${out}/source-'+c['id']+'.jpg',quality=92)\n records.append(dict(**c,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))\nprint(json.dumps(records))`;
const photographs=JSON.parse(execFileSync('python',['-c',crop],{encoding:'utf8'}));
const server=await createServer({root,server:{middlewareMode:true},appType:'custom'});
try{
 const {britishColumbia}=await server.ssrLoadModule('/src/regions/canada/index.ts');
 const {bcTemplate}=await server.ssrLoadModule('/src/templates/bc.tsx');
 const format=britishColumbia.formats.find(f=>f.id==='carrier-passenger-2005');
 for(const c of cases){
  const parts={serial:c.serial};if(format.validate(parts))throw new Error(format.validate(parts));
  const svg=renderToStaticMarkup(createElement(bcTemplate.render,{parts,text:format.text(parts),design:{...britishColumbia.design,...format.design}}));
  fs.writeFileSync(path.join(out,'current-'+c.id+'.svg'),svg+'\n');
 }
 const provenance=JSON.parse(fs.readFileSync(path.join(root,'docs/research/passenger-carrier-flag/provenance.json'),'utf8'));
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify({...provenance,photographs},null,2)+'\n');
 const cards=cases.map(c=>`<article id="photo-${c.id}"><h2>${c.serial} · ${c.id} photograph label</h2><div class="pair"><figure><img src="source-${c.id}.jpg" alt="Original Passenger Carrier ${c.serial}"><figcaption>Original photograph · BCpl8s</figcaption></figure><figure><img src="current-${c.id}.svg" alt="Passenger Carrier ${c.serial} with supplied flag"><figcaption>PlateForge · supplied flag paths and pale print treatment</figcaption></figure></div><p><a href="${c.source}">Full original photograph</a></p></article>`).join('');
 fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Passenger Carrier flag · PlateForge</title><style>*{box-sizing:border-box}body{font:16px/1.6 system-ui;background:#f5f6f8;color:#182431;margin:0}main{max-width:1120px;margin:auto;padding:24px}a{color:#155bb0}article{background:white;padding:18px;border:1px solid #d6dbe1;border-radius:12px;margin:22px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0}img{width:100%;height:280px;object-fit:contain;background:#d9dde2;padding:12px}figcaption{padding:8px 0}@media(max-width:650px){main{padding:12px}.pair{grid-template-columns:1fr}img{height:220px}}</style></head><body><main><a href="../#/ca-bc/carrier-passenger-2005">← Passenger Carrier plate</a><h1>Passenger Carrier · supplied British Columbia flag</h1><p>Your SVG replaces the approximate flag drawing. All 15 paths, colours, crown, curved sun rays and waves are retained. The complete flag fits uniformly inside the rim, with a pale print treatment behind the lettering.</p><p>The photographs show screened dots. The reproduction uses their approximate mean colour through a 50% white wash; the dot texture, reflection and wear are not reproduced. Existing plate dimensions and lettering remain approximate. The later photograph has a renewal sticker; that sticker is separate from this flag update.</p>${cards}<p>The labels are photograph/decal labels, not manufacture dates. Images are credited crops of <a href="https://www.bcpl8s.ca/PassengerCarrier.html">BCpl8s Passenger Carrier photographs</a>; rights remain with their creators. <a href="provenance.json">Supplied SVG hash and photographic evidence</a></p></main></body></html>`);
 console.log(JSON.stringify({photographs:cases.length,output:out}));
}finally{await server.close()}
