import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'../../..'),cache={};function load(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;const code=ts.transpileModule(fs.readFileSync(path.join(root,'src',id+'.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(n=>load(path.posix.normalize(path.posix.join(path.posix.dirname(id),n))),m,m.exports);return m.exports;}
const api=load('templates/iraq-custom-scene'),out=path.join(import.meta.dirname,'output');const cases=[
['modern-default','Modern preset',api.customizerState('flat-modern-long')],
['modern-edited','Edited serial, code, letter, layout',{...api.customizerState('flat-modern-long'),serial:'49380',governorate:'14',letter:'A',layout:'compact'}],
['legacy-default','Rounded Erbil observed-subset preset',api.customizerState('flat-erbil-rounded')],
['legacy-edited','Different serial, same observed font',{...api.customizerState('flat-erbil-rounded'),serial:'650340',tracking:5,mainScale:.82}],
['anbar-default','Anbar observed-subset preset',api.customizerState('flat-anbar-taxi')],
['anbar-edited','Different serial + user palette',{...api.customizerState('flat-anbar-taxi'),serial:'9152',bg:'#e9eff8',ink:'#18252b',tracking:6,mainScale:.9}],
];for(const [id,label,state] of cases){const r=api.renderIraqCustom(state);if(r.errors.length)throw new Error(id+':'+r.errors.join());fs.writeFileSync(path.join(out,'example-'+id+'.svg'),r.svg);}fs.writeFileSync(path.join(out,'example-cases.json'),JSON.stringify(cases.map(([id,label,state])=>({id,label,state})),null,2));
