/** Supplied native wordmarks fitted to source-specific Alberta plate layouts. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {renderToStaticMarkup} from 'react-dom/server';
const root=process.cwd(),out=path.join(root,'public/alberta-artwork-review');fs.mkdirSync(out,{recursive:true});
const source='http://www.worldlicenseplates.com/jpglps/CN_ALBE_GI3.jpg';
const cases=[{id:'geometric',format:'wild-rose-1984',serial:'GRS-152',caption:'1984 Series',box:[19,279,192,366]},
 {id:'geometric-seven',format:'wild-rose-geometric-2010',serial:'BCJ-8178',caption:'2010 Series',box:[19,410,192,497]},
 {id:'script',format:'standard',serial:'CHS-6596',caption:'2019',box:[210,410,384,496]}];
const provenance=JSON.parse(fs.readFileSync(path.join(root,'docs/research/alberta-artwork/provenance.json'),'utf8'));
const cropCode=`import urllib.request,hashlib,json\nfrom pathlib import Path\nfrom PIL import Image\np=Path('/tmp/plateforge-alberta-inputs/CN_ALBE_GI3.jpg');p.parent.mkdir(exist_ok=True,parents=True)\nif not p.exists():\n with urllib.request.urlopen('${source}',timeout=30) as r:p.write_bytes(r.read())\nfor item in json.loads(${JSON.stringify(JSON.stringify(cases))}):\n with Image.open(p) as im:im.crop(tuple(item['box'])).save('${out}/source-'+item['id']+'.jpg',quality=93)\nprint(hashlib.sha256(p.read_bytes()).hexdigest())\n`;
const sourceHash=execFileSync('python',['-c',cropCode],{encoding:'utf8'}).trim();
const server=await createServer({root,server:{middlewareMode:true},appType:'custom'});
try{
 const {canadianProvinces}=await server.ssrLoadModule('/src/regions/canada/provinces.ts');
 const {caTemplate}=await server.ssrLoadModule('/src/templates/ca.tsx');
 const region=canadianProvinces.find(r=>r.id==='ca-ab');
 const samples=[...cases,{id:'pwg542',format:'wild-rose-1984',serial:'PWG-542'},{id:'ckz3449',format:'standard',serial:'CKZ-3449'}];
 for(const c of samples){
  const f=region.formats.find(f=>f.id===c.format),parts={serial:c.serial,lettering:'default'};
  if(f.validate(parts))throw new Error(f.validate(parts));
  let svg=renderToStaticMarkup(caTemplate.render({parts,text:f.text(parts),design:{...region.design,...f.design}}));
  const fontCss=[600,700].map(weight=>`@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(root,`node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-${weight}-normal.woff2`)).toString('base64')}) format("woff2")}`).join('');
  svg=svg.replace(/(<svg\b[^>]*>)/,`$1<style>${fontCss}</style>`);
  fs.writeFileSync(path.join(out,'current-'+c.id+'.svg'),svg+'\n');
 }
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify({...provenance,galleryImage:{url:source,sha256:sourceHash},cases},null,2)+'\n');
 const cards=cases.map(c=>`<article id="${c.id}"><h2>${c.serial} · ${c.caption}</h2><div class="pair"><figure><img src="source-${c.id}.jpg" alt="Original Alberta plate photograph · ${c.serial}"><figcaption>Original photograph · World License Plates</figcaption></figure><figure><img src="current-${c.id}.svg" alt="Current Alberta reconstruction · ${c.serial}"><figcaption>PlateForge · supplied native vectors</figcaption></figure></div><p><a href="../#/ca-ab/${c.format}">Open editable plate</a> · <a href="${source}">Full original source</a></p></article>`).join('');
 fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alberta artwork comparison · PlateForge</title><style>*{box-sizing:border-box}body{font:16px/1.6 system-ui,sans-serif;background:#f5f6f8;color:#182431;margin:0}main{max-width:1150px;margin:auto;padding:25px}h1{font-size:clamp(27px,4vw,40px)}a{color:#155bb0}article{background:white;padding:18px;border:1px solid #d6dbe1;border-radius:12px;margin:22px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0}figure img{width:100%;height:240px;object-fit:contain;background:#d9dde2;padding:12px}figcaption{padding:7px 0}.samples{display:grid;grid-template-columns:1fr 1fr;gap:18px}.samples img{width:100%}@media(max-width:650px){main{padding:12px}.pair,.samples{grid-template-columns:1fr}figure img{height:190px}}</style></head><body><main><a href="../#/ca-ab/standard">← Alberta plates</a><h1>Alberta wordmarks and red wild rose</h1><p>The supplied geometric and script Alberta paths replace font stand-ins. The native rose/stem/leaves vector replaces the generic flower. Both wordmarks are blue and the rose uses the serial red; graphics scale uniformly.</p><p>The script Government subline and teal block are excluded. The two EPS uploads are identical; their geometric wordmark agrees with the supplied SVG selection. The slogan and editable serial remain independent approximate lettering.</p><p>Source labels below distinguish the 1984 series, seven-character 2010 series, and photographed 2019 script revision. These labels do not certify exact tooling dates or the last use of older plates. The previous generic 1983 wording was corrected to the gallery’s 1984-series caption. Blank wells do not assign a photographed renewal year to every plate.</p>${cards}<h2>Your photographed serials</h2><p>These use the layouts fitted to the PWG-542 and CKZ-3449 references you supplied.</p><div class="samples"><figure><img src="current-pwg542.svg" alt="PWG-542 reproduction"><figcaption>PWG-542 · larger geometric wordmark and square separator</figcaption></figure><figure><img src="current-ckz3449.svg" alt="CKZ-3449 reproduction"><figcaption>CKZ-3449 · script wordmark</figcaption></figure></div><p>Photographic crops are credited to <a href="http://www.worldlicenseplates.com/world/CN_ALBE.html">World License Plates · Alberta</a>; rights remain with their creators. <a href="provenance.json">Source hashes and selected components</a> · <a href="https://github.com/ahzs645/plateforge/tree/main/docs/research/alberta-artwork">Research notes and rebuild steps</a></p></main></body></html>`);
 console.log(JSON.stringify({sourceComparisons:cases.length,userReferenceSerials:2,output:out}));
}finally{await server.close()}
