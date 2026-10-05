/** Source comparison for the two national CANADA APEC military variants. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=process.cwd(),out=path.join(root,'public/apec-military-review');
fs.mkdirSync(out,{recursive:true});
const cases=[
  {id:'maple-leaves',format:'apec-1997-maple-leaves',bcFormat:'events-apec-1997-military-maple-leaves',serial:'134',photo:'Canada-134.jpg',caption:'Red maple leaves beside CANADA'},
  {id:'plain',format:'apec-1997',bcFormat:'events-apec-1997-military',serial:'180',photo:'Canada-180.jpg',caption:'CANADA without maple leaves'},
];
const crop=`import urllib.request,json,hashlib\nfrom pathlib import Path\nfrom PIL import Image\np=Path('/tmp/plateforge-apec-leaves');p.mkdir(exist_ok=True)\nrecords=[]\nfor c in json.loads(${JSON.stringify(JSON.stringify(cases))}):\n url='https://www.bcpl8s.ca/images/APEC/'+c['photo'];file=p/c['photo']\n if not file.exists():\n  with urllib.request.urlopen(url,timeout=30) as r:file.write_bytes(r.read())\n with Image.open(file) as im:\n  box=(2,2,im.width-2,im.height-1);im.crop(box).save('${out}/source-'+c['id']+'.jpg',quality=95)\n records.append(dict(**c,sourceUrl=url,sourceSha256=hashlib.sha256(file.read_bytes()).hexdigest(),cropBox=box))\nprint(json.dumps(records))`;
const records=JSON.parse(execFileSync('python',['-c',crop],{encoding:'utf8'}));
const server=await createServer({root,server:{middlewareMode:true},appType:'custom'});
try{
  const {canadaFederal}=await server.ssrLoadModule('/src/regions/canada/federal.ts');
  const {bcTemplate}=await server.ssrLoadModule('/src/templates/bc.tsx');
  for(const c of [...cases,{id:'standard',format:'standard',serial:'12 345'}]){
    const format=canadaFederal.formats.find(f=>f.id===c.format),parts={serial:c.serial};
    if(format.validate(parts))throw new Error(format.validate(parts));
    const svg=renderToStaticMarkup(createElement(bcTemplate.render,{parts,text:format.text(parts),design:{...canadaFederal.design,...format.design}}));
    fs.writeFileSync(path.join(out,'current-'+c.id+'.svg'),svg+'\n');
  }
  const evidence={date:'2026-10-05',sourcePage:'https://www.bcpl8s.ca/APEC.htm',
    attribution:'BCpl8s explicitly contrasts maple leaves on No. 134 with their absence on the other illustrated military plates. Rights remain with the original photographers and gallery.',
    sharedLayout:'src/regions/canada/federal-canada-layout.ts',
    shared:'300 × 150 shell, raised serial panel, CANADA legend and existing serial candidate; variant settings select mounts, leaves, sticker and number position.',
    limits:'No. 134 reference is 150 × 75 pixels: construction/placement support only, not precise font outlines. Three-digit number grammar, actual allocation unknown. These are maple leaves rather than rectangular flags. Serial and country dies and sticker caption remain approximate. No evidence of identical historical physical dies is implied.',records};
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(evidence,null,2)+'\n');
  fs.mkdirSync(path.join(root,'docs/research/apec-military'),{recursive:true});
  fs.writeFileSync(path.join(root,'docs/research/apec-military/provenance.json'),JSON.stringify(evidence,null,2)+'\n');
  const cards=cases.map(c=>`<article id="${c.id}"><h2>CANADA ${c.serial} · ${c.caption}</h2><div class="pair"><figure><img src="source-${c.id}.jpg" alt="Original APEC CANADA ${c.serial} photograph"><figcaption>Original photograph · BCpl8s</figcaption></figure><figure><img src="current-${c.id}.svg" alt="PlateForge APEC CANADA ${c.serial}"><figcaption>PlateForge · shared federal CANADA template</figcaption></figure></div><p><a href="../#/ca-federal/${c.format}">Canada · Federal plate</a> · <a href="../#/ca-bc/${c.bcFormat}">B.C. · APEC events</a> · <a href="https://www.bcpl8s.ca/images/APEC/${c.photo}">Original source</a></p></article>`).join('');
  fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>APEC military variants · PlateForge</title><style>*{box-sizing:border-box}body{font:16px/1.6 system-ui;background:#f5f6f8;color:#182431;margin:0}main{max-width:1120px;margin:auto;padding:24px}a{color:#155bb0}article{border:1px solid #d6dbe1;border-radius:12px;background:white;padding:18px;margin:20px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0}img{width:100%;height:240px;object-fit:contain;background:#d9dde2;padding:12px}figcaption{padding:8px 0}.standard{max-width:540px}@media(max-width:650px){main{padding:12px}.pair{grid-template-columns:1fr}img{height:190px}}</style></head><body><main><a href="../#/ca-federal/standard">← Canada · Federal plates</a><h1>APEC 1997 military · CANADA variants</h1><p>The photographed No. 134 has red maple leaves beside CANADA. BCpl8s explicitly distinguishes this from the leafless 180 and 149 plates. Both APEC versions now use the same CANADA shell, raised serial panel, header and serial candidate as the federal standard plate; mounts and APEC sticker/number placement are separate variant settings.</p><p>These are individual maple leaves rather than rectangular flags. The number range is unknown. The small No. 134 photograph supports layout and decoration, but cannot establish exact font contours, dimensions or identical historical tooling. The sticker and lettering remain approximate.</p>${cards}<h2>Shared standard CANADA layout</h2><figure class="standard"><img src="current-standard.svg" alt="Federal CANADA standard plate"><figcaption>The standard plate uses the same base layout with a full-width number and no APEC sticker.</figcaption></figure><p><a href="https://www.bcpl8s.ca/APEC.htm">BCpl8s · APEC source article</a> · <a href="provenance.json">Source hashes and variant record</a></p></main></body></html>`);
  console.log(JSON.stringify({variants:cases.length,sharedStandard:true,output:out}));
}finally{await server.close()}
