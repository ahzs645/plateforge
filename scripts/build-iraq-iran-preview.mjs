/** Build a single-file, offline review editor using the SAME country modules and SVG scenes as PlateForge.
 * Run after npm ci: node scripts/build-iraq-iran-preview.mjs [output.html]
 * No remote fonts, scraped photographs or additional packages are bundled.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ids = ['core/random', 'regions/asia/plate-script', 'regions/asia/iraq-data', 'regions/asia/iran-data',
  'regions/asia/iraq', 'regions/asia/iran', 'templates/westasia-euro', 'templates/westasia-arabic', 'templates/westasia-glyphs', 'templates/westasia-scene'];
const modules = ids.map((id) => {
  const source = fs.readFileSync(path.join('src', id + '.ts'), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true } });
  return JSON.stringify(id) + ':function(require,module,exports){\n' + result.outputText + '\n}';
}).join(',\n');
const runtime = `
const modules={${modules}}, cache={};
function load(id) {
  if(cache[id]) return cache[id].exports;
  if(!modules[id]) throw new Error('Unknown bundled module: '+id);
  const module=cache[id]={exports:{}};
  const require=(name)=>{const segments=(id.slice(0,id.lastIndexOf('/')+1)+name).split('/'), clean=[];
    for(const s of segments){if(s==='..')clean.pop();else if(s!=='.'&&s)clean.push(s);}return load(clean.join('/'));};
  modules[id](require,module,module.exports);return module.exports;
}
const regions=[load('regions/asia/iraq').iraq,load('regions/asia/iran').iran];
const scenes=load('templates/westasia-scene'),{createRng}=load('core/random');
let region=regions[location.hash==='#iran'?1:0], format=region.formats[0], parts={}, count=0;
const el=(id)=>document.getElementById(id);
const option=(value,label)=>{const e=document.createElement('option');e.value=value;e.textContent=label;return e;};
function render(){
  const design={...region.design,...format.design}, text=format.text?.(parts)??'';
  const scene=(region.id==='iraq'?scenes.iraqScene:scenes.iranScene)(design,parts,text);
  el('plate').innerHTML=scenes.sceneSvg(scene,text);el('serial').textContent=text;
  el('dimensions').textContent=scene.width+' × '+scene.height+' drawing units';
  const error=format.validate?.(parts);el('validation').textContent=error??'Pattern checks passed · issuance not verified';
  el('validation').className=error?'invalid':'valid';
  el('description').textContent=format.description??region.notes;
  el('status').textContent=format.status==='reproduction'?'SCHEMATIC · ARTWORK PENDING':'EDITABLE RECONSTRUCTION';
  el('sources').replaceChildren(...(format.references??[]).map(s=>{const a=document.createElement('a');a.href=s.url;a.textContent=s.title;a.target='_blank';a.rel='noreferrer';return a;}));
}
function fields(){
  el('fields').replaceChildren(...format.fields.map(field=>{
    const label=document.createElement('label');label.textContent=field.label;
    const input=document.createElement(field.options?'select':'input');input.id='edit-'+field.key;
    if(field.options) input.append(...field.options.map(o=>option(o.value,o.label)));
    else {input.maxLength=field.maxLength??32;input.spellcheck=false;input.autocomplete='off';input.dir='ltr';}
    input.value=parts[field.key]??'';
    input.addEventListener(field.options?'change':'input',()=>{parts[field.key]=field.options||field.uppercase===false?input.value:input.value.toUpperCase();render();});
    label.append(input);return label;
  }));render();
}
function regenerate(keep=false){const fresh=format.generate(createRng('review/'+format.id+'/'+count++));
  if(keep)for(const f of format.fields)if(f.preserveOnGenerate&&parts[f.key]!==undefined)fresh[f.key]=parts[f.key];
  parts=fresh;fields();}
function choose(id){format=region.formats.find(f=>f.id===id)??region.formats[0];el('formats').value=format.id;regenerate();}
function gallery(){
  el('gallery').replaceChildren(...region.formats.map(f=>{
    const p=f.generate(createRng('gallery/'+f.id));const s=(region.id==='iraq'?scenes.iraqScene:scenes.iranScene)({...region.design,...f.design},p,f.text?.(p));
    const b=document.createElement('button');b.className='card';b.innerHTML=scenes.sceneSvg(s,f.label);
    const name=document.createElement('span');name.textContent=f.label;b.append(name);
    b.onclick=()=>{choose(f.id);el('editor').scrollIntoView({behavior:'smooth',block:'start'});};return b;
  }));
  el('gaps').replaceChildren(...(region.gaps??[]).map(g=>{const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=g.label+' — ';p.append(strong,document.createTextNode(g.note??''));return p;}));
}
function selectCountry(id){region=regions.find(r=>r.id===id)??regions[0];
  document.querySelectorAll('[data-country]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.country===region.id)));
  el('formats').replaceChildren(...region.formats.map(f=>option(f.id,f.label)));choose(region.formats[0].id);gallery();
  el('count').textContent=region.formats.length+' recipes · '+(region.id==='iran'?'includes one unfinished free-zone study':'includes federal and KRG systems');
}
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
el('svg').onclick=()=>download(el('plate').innerHTML,'image/svg+xml',region.id+'-'+format.id+'.svg');
el('png').onclick=async()=>{await document.fonts.ready;const image=new Image();const url=URL.createObjectURL(new Blob([el('plate').innerHTML],{type:'image/svg+xml'}));
  image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.width*3;canvas.height=image.height*3;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(blob)download(blob,'image/png',region.id+'-'+format.id+'.png');});URL.revokeObjectURL(url);};
  image.onerror=()=>{el('validation').textContent='PNG export failed; use SVG export.';URL.revokeObjectURL(url);};image.src=url;};
el('generate').onclick=()=>regenerate(true);el('formats').onchange=()=>choose(el('formats').value);
document.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>selectCountry(b.dataset.country));
selectCountry(region.id);
`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PlateForge · Iraq + Iran review</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f3ef;color:#222928;font:15px/1.55 system-ui,sans-serif}header{background:#162a2b;color:#fff;padding:27px 5vw;display:flex;align-items:center;justify-content:space-between;gap:20px}header strong{font-size:22px;letter-spacing:-.7px}header span{color:#9db4af;font-size:12px;letter-spacing:1.4px}main{max-width:1320px;margin:auto;padding:35px 34px 70px}h1{font-size:38px;letter-spacing:-1.4px;line-height:1.15;margin:8px 0 15px}h2{font-size:23px;letter-spacing:-.6px;margin:35px 0 14px}p{max-width:950px;color:#52605d}button,select,input{font:inherit;border:1px solid #cbd1cd;border-radius:7px;background:#fff;color:#263a36;padding:10px 13px}button{cursor:pointer}button:hover{border-color:#38665b}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #679b91;outline-offset:2px}nav{display:flex;gap:8px;margin:24px 0}nav button[aria-pressed=true]{background:#21483e;color:white;border-color:#21483e}#count{align-self:center;margin-left:14px;font-size:13px;color:#596d63}.editor{display:grid;grid-template-columns:minmax(0,1fr) 325px;border:1px solid #d2d8d2;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 7px 24px #22332b08}.stage{padding:29px;background:#e8eae4;display:flex;flex-direction:column;justify-content:space-between;min-height:345px}.eyebrow{font-size:11px;font-weight:750;letter-spacing:1.3px;color:#53685c}#plate{min-height:173px;display:flex;align-items:center;justify-content:center;margin:25px 0}#plate svg{max-width:100%;height:auto;max-height:230px;filter:drop-shadow(0 6px 6px #18261e21)}.stage footer{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;color:#54635a;font-size:13px}#serial{unicode-bidi:plaintext}aside{padding:23px;border-left:1px solid #d2d8d2}label{display:block;font-size:12px;font-weight:650;margin-bottom:14px}label input,label select{display:block;width:100%;margin-top:5px;font-size:15px}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.actions button{font-size:13px;padding:9px 11px}.actions button:first-child{background:#21483e;color:white}.facts{background:#fff;border:1px solid #d2d8d2;border-radius:9px;margin:15px 0 29px;padding:18px 22px}.facts p{font-size:13px;margin:9px 0}.valid{color:#266c4a;font-size:13px}.invalid{color:#9b3430;font-size:13px}#sources a{display:inline-block;font-size:12px;color:#406860;margin-right:18px;margin-top:8px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{min-height:155px;text-align:left;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;padding:20px;background:#e8eae4;border-color:#d5d9d1;border-radius:9px}.card svg{width:auto;max-width:100%;height:auto;max-height:100px}.card span{font-size:12px;align-self:flex-start;font-weight:600}.gaps{border-left:3px solid #bf915b;padding:1px 20px}.gaps p{font-size:13px}.intro{font-size:14px}small{color:#6b746a}@media(max-width:850px){.editor{grid-template-columns:1fr}aside{border-left:0;border-top:1px solid #d2d8d2}#fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gallery{grid-template-columns:1fr 1fr}header span{display:none}main{padding:24px 18px}h1{font-size:31px}#count{display:none}}@media(max-width:450px){.gallery{grid-template-columns:1fr}.stage{padding:18px}#fields{grid-template-columns:1fr}}
</style></head><body><header><strong>PlateForge / Research editions</strong><span>IRAQ + IRAN · 27 SEPTEMBER 2026</span></header><main>
<div class="eyebrow">COUNTRY SYSTEMS · EDITABLE SVG</div><h1>Two countries. Distinct plate systems.</h1><p class="intro">Browse the reconstructed formats, edit each serial component, and compare layouts. Serial glyphs are hand-built vector paths, not photographs or font files. Joined legends use your system fonts. This standalone review uses the same country and renderer modules supplied for PlateForge.</p>
<nav aria-label="Country"><button data-country="iraq">Iraq / العراق</button><button data-country="iran">Iran / ایران</button><span id="count"></span></nav>
<section class="editor" id="editor"><div class="stage"><div class="eyebrow" id="status"></div><div id="plate"></div><footer><span id="serial"></span><span id="dimensions"></span></footer></div><aside><label>Format<select id="formats"></select></label><div id="fields"></div><div class="actions"><button id="generate">New serial</button><button id="svg">Save SVG</button><button id="png">Save PNG</button></div></aside></section>
<section class="facts"><div id="validation" role="status"></div><p id="description"></p><div id="sources"></div></section>
<h2>Format library</h2><p>Choose a plate to open its fields. These are reconstruction recipes, not a claim that every historical issue has been recreated.</p><section id="gallery" class="gallery" aria-label="Format gallery"></section>
<h2>Known gaps</h2><div id="gaps" class="gaps"></div><p><small>Manufacturing dies, reflective/security features and flag micro-detail are not reproduced. WorldLicensePlates pages were not successfully retrieved in this research pass. Timeline windows are coverage bounds, not blanket issue or withdrawal dates.</small></p>
</main><script>${runtime.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
const out = process.argv[2] ?? 'preview/iraq-iran.html';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${Buffer.byteLength(html)} bytes)`);
