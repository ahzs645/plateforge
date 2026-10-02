import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'../../..'),cache={};
function load(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;const src=fs.readFileSync(path.join(root,'src',id+'.ts'),'utf8');const code=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(n=>load(path.posix.normalize(path.posix.join(path.posix.dirname(id),n))),m,m.exports);return m.exports;}
const api=load('templates/iraq-custom-scene'),out=path.join(import.meta.dirname,'output');fs.mkdirSync(out,{recursive:true});let report=[];
for(const p of api.IRAQ_CUSTOM_PRESETS){const s=api.customizerState(p.id),r=api.renderIraqCustom(s);fs.writeFileSync(path.join(out,p.id+'.svg'),r.svg);report.push({id:p.id,label:p.label,width:r.width,height:r.height,errors:r.errors,warnings:r.warnings,state:s});}
fs.writeFileSync(path.join(out,'preset-render-report.json'),JSON.stringify(report,null,2));console.log(report.length,'rendered;',report.filter(r=>r.errors.length).map(r=>({id:r.id,errors:r.errors})));
