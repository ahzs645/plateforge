/** Rebuild a durable source/current review of every inventoried federal occurrence. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
const root=process.cwd();
const output=path.join(root,'public/federal-reference-review');
fs.mkdirSync(path.join(output,'current'),{recursive:true});
const ledger=JSON.parse(fs.readFileSync(path.join(root,'docs/research/canada-federal/inventory.json'),'utf8'));
const [W,M]=ledger.sources;
execFileSync('python',['scripts/crop-federal-references.py',...(process.env.FEDERAL_SOURCE_CACHE?['--cache',process.env.FEDERAL_SOURCE_CACHE]:[])],{stdio:'inherit'});
const server=await createServer({root,server:{middlewareMode:true},appType:'custom'});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
 const {canadaFederal:region}=await server.ssrLoadModule('/src/regions/canada/federal.ts');
 const {kitRecipe,kitPalette}=await server.ssrLoadModule('/src/regions/canada/bc-kit.ts');
 const {buildKitScene}=await server.ssrLoadModule('/src/templates/bc/kit.ts');
 const {serializeSvgNode}=await server.ssrLoadModule('/src/templates/svg-scene.ts');
 const {createRng}=await server.ssrLoadModule('/src/core/random.ts');
 const records=[];
 for(const ref of ledger.references){
  const format=region.formats.find(f=>f.id===ref.preset);
  if(!format)throw new Error(`Unmapped reference ${ref.id}`);
  const numbered=format.fields.some(f=>f.key==='serial');
  const parts={...format.generate(createRng(ref.id)),...(numbered?{serial:ref.serial}:{}),...(ref.palette?{palette:ref.palette}:{})};
  if(format.validate(parts))throw new Error(`${ref.id}: ${format.validate(parts)}`);
  const recipe=kitRecipe(format.design.kit);
  const options={scope:ref.id,...kitPalette(recipe.id,parts.palette),metadata:{jurisdiction:'CA'},title:`Canada · ${format.label} · ${parts.serial??''}`};
  // A recorded reference-panel colour, not a claim about another example's year.
  const preview=ref.validationColor&&recipe.serial.separator?.kind==='art'?{...recipe,serial:{...recipe.serial,separator:{...recipe.serial.separator,art:{...recipe.serial.separator.art,color:ref.validationColor}}}}:recipe;
  const svg=serializeSvgNode(buildKitScene(preview,parts,options));
  fs.writeFileSync(path.join(output,'current',ref.id+'.svg'),svg+'\n');
  records.push({...ref,label:format.label,status:format.status,period:format.period??null,description:format.description,dimensions:{width:recipe.width,height:recipe.height},parts,die:recipe.serial.die});
 }
 fs.writeFileSync(path.join(output,'inventory.json'),JSON.stringify({...ledger,reviewCases:records},null,2)+'\n');
 const cards=records.map(ref=>`${ledger.presets.find(p=>p.id===ref.preset).referenceIds[0]===ref.id?`<span id="${ref.preset}"></span>`:''}<article id="${ref.id}" data-preset="${ref.preset}" data-family="${ledger.presets.find(p=>p.id===ref.preset).family}">
 <h3>${escape(ref.serial)} · ${escape(ref.label)}</h3><p><strong>Source caption:</strong> ${escape(ref.caption)} · ${escape(ref.status??'issued')}<br><strong>Current lettering:</strong> ${escape(ref.die)} · illustrative candidate</p>
 <div class="pair"><figure><div class="frame"><img src="photos/${ref.id}.jpg" alt="Original photographic plate crop · ${escape(ref.serial)}" loading="lazy"></div><figcaption>Original photograph · source-box crop</figcaption></figure>
 <figure><div class="frame"><img src="current/${ref.id}.svg" alt="Current reconstruction · ${escape(ref.serial)}" loading="lazy"></div><figcaption>PlateForge · current reconstruction</figcaption></figure></div>
 <details><summary>Overlay on the photograph</summary><p>Approximate plate-frame fit. This crop is not perspective rectified; frame fitting does not establish individual glyph agreement.</p><div class="overlay" style="aspect-ratio:${ref.box[2]-ref.box[0]}/${ref.box[3]-ref.box[1]}"><img class="original" src="photos/${ref.id}.jpg" alt="Original plate photograph"><img class="reproduction" src="current/${ref.id}.svg" alt="Reproduction over photograph"></div><label>Reproduction opacity <input type="range" min="0" max="100" value="45" aria-label="Reproduction opacity ${ref.id}"></label></details>
 ${ref.caution?`<p class="caution">${escape(ref.caution)}</p>`:''}<p>${escape(ref.description)}</p>
 <p class="links"><a href="../#/ca-federal/${ref.preset}">Open editable design</a> · <a href="${escape(ref.image)}" target="_blank" rel="noopener">Full original source image</a> · <a href="${escape(ref.page)}" target="_blank" rel="noopener">Source gallery</a></p></article>`).join('\n');
 const styles=ledger.presets.map(s=>`<li><a href="#${s.referenceIds[0]}">${escape(s.label)}</a> · ${s.referenceIds.length} reference${s.referenceIds.length===1?'':'s'} · ${s.period?s.period.join('–'):'undated'}${s.status?' · '+s.status:''}</li>`).join('');
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Canadian federal plate reference review · PlateForge</title><style>
 :root{font-family:system-ui,sans-serif;color:#182431;background:#f5f6f8}*{box-sizing:border-box}body{margin:0}main{max-width:1200px;margin:auto;padding:24px}h1{font-size:clamp(25px,4vw,40px)}h2{margin-top:30px}p,li{line-height:1.55}a{color:#155bb0}article{padding:20px;border:1px solid #d6dbe1;border-radius:12px;margin:20px 0;background:white;scroll-margin-top:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0}.frame{height:220px;background:#d9dde2;display:grid;place-items:center;padding:14px}.frame img{width:100%;height:100%;max-height:192px;object-fit:contain}figcaption{padding:8px 0}details{margin:12px 0}summary{cursor:pointer;font-weight:600}.overlay{position:relative;max-width:650px;margin:12px auto;background:#d9dde2;overflow:hidden}.overlay img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.overlay .reproduction{opacity:.45}.caution{border-left:4px solid #b17616;padding:8px 12px;background:#fff5db}label{display:flex;gap:16px;align-items:center}input{flex:1;max-width:400px}select{padding:9px;max-width:100%}.links{font-size:.95rem}.hidden{display:none}footer{padding:20px 0;color:#465666} @media(max-width:650px){main{padding:12px}.pair{grid-template-columns:1fr}.frame{height:190px}article{padding:13px}label{display:block}}
 </style></head><body><main><a href="../#/ca-federal/standard">← Canada · Federal plates</a><h1>Canadian federal plate reference review</h1>
 <p>41 photographed examples reviewed · 33 new layouts · ${region.formats.length} federal presets including the national CANADA plate and both APEC military variants. Review date: ${ledger.reviewDate}.</p>
 <p>The requested galleries include 13 ordinary provincial and territorial plates, which stay with their jurisdictions. This review also follows their Canadian Forces links to France and Germany. It distinguishes military vehicles, Fisheries, overseas private-vehicle uses, attachments and souvenirs.</p>
 <p>Dates below are source captions. Related serials and colour variants can share a layout without proving identical physical dies. Undated examples remain undated; “2016 Series” has no documented end date here. All new lettering and dimensions are illustrative candidates. This review does not certify every letter or number contour.</p>
 <p>Photographic thumbnails are credited crops of <a href="${W}">World License Plates</a> and <a href="${M}">License Plate Mania</a> images; rights remain with the original photographers and galleries. Each entry links its full source and caption. The thumbnails are original paint photographs, not traces or monochrome reconstructions.</p>
 <details><summary>Layout inventory and dates</summary><ul>${styles}</ul></details>
 <label>Show group <select id="family"><option value="all">All 41 examples</option><option value="fisheries">Fisheries</option><option value="domestic">Military in Canada</option><option value="overseas">Forces overseas</option><option value="attachments">Attachments and boosters</option></select></label><p id="count">41 examples shown</p>${cards}
 <h2>Provincial and territorial examples accounted for separately</h2><ul>${ledger.excludedRegional.map(r=>`<li>${escape(r.region)} · ${escape(r.serial)} — ${escape(r.disposition)}</li>`).join('')}</ul>
 <footer><a href="inventory.json">Download the complete evidence ledger</a> · <a href="https://github.com/ahzs645/plateforge/tree/main/docs/research/canada-federal">Research notes</a></footer>
 </main><script>document.querySelectorAll('input[type=range]').forEach(input=>input.addEventListener('input',()=>input.closest('details').querySelector('.reproduction').style.opacity=input.value/100));document.querySelector('#family').addEventListener('change',e=>{let count=0;document.querySelectorAll('article').forEach(card=>{const show=e.target.value==='all'||card.dataset.family===e.target.value;card.classList.toggle('hidden',!show);if(show)count++});document.querySelector('#count').textContent=count+' examples shown'});</script></body></html>`);
 console.log(JSON.stringify({presets:region.formats.length,newPresets:ledger.presets.length,photographs:records.length,excludedRegional:ledger.excludedRegional.length,output}));
}finally{await server.close()}
