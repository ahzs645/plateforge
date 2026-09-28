import fs from 'node:fs';
import {VARIANTS, glyphMarkup, stripSvg, studyGlyph} from './glyph-study.mjs';
const out=new URL('./output/',import.meta.url);
const labels=[['current','Current bc-waldale'],['minimal','0 override + stock curved 7'],['global','Global stadium + curved 7'],['exploratory','0 override + exploratory 7']];
const chars='06789JPS';
let content=`<rect width="1420" height="990" fill="white"/><g font-family="DejaVu Sans,sans-serif" fill="black"><text x="45" y="62" font-size="32" font-weight="bold">B.C. serial lettering: geometry test</text><text x="45" y="97" font-size="17">Same 100-unit cap-height, width and stroke settings. Shapes only; not a full plate rendering.</text><text x="45" y="123" font-size="15">Selected Plateforge formulas transcribed from public main, 28 September 2026. No font binaries used.</text>`;
[...chars].forEach((c,i)=>content+=`<text x="${390+i*122}" y="174" font-size="21" text-anchor="middle">${c}</text>`);
labels.forEach(([v,label],row)=>{
 const y=212+row*173;
 content+=`<line x1="45" y1="${y-25}" x2="1375" y2="${y-25}" stroke="#b8b8b8"/><text x="45" y="${y+28}" font-size="18" font-weight="bold">${label}</text>`;
 const notes={current:['Original profile','Oval zero / straight seven'],minimal:['Only 0 and 7 change','Other tested glyphs unchanged'],global:['Diagnostic control','Other rounded glyphs change too'],exploratory:['Hand-set seven curve','Exploratory, not calibrated']}[v];
 notes.forEach((s,i)=>content+=`<text x="45" y="${y+60+i*23}" font-size="16">${s}</text>`);
 [...chars].forEach((c,i)=>{let g=studyGlyph(c,v);let x=390+i*122-g.advance*.62;content+=`<g transform="translate(${x} ${y}) scale(1.24)" color="black">${glyphMarkup(c,v)}</g>`;});
});
content+=`<text x="45" y="939" font-size="16">Visual comparison only: no image registration, segmentation, match percentages or official-font identification.</text><text x="45" y="964" font-size="15">Photographs and published font specimens are linked in the companion HTML. The exploratory row is not a production patch.</text></g>`;
fs.writeFileSync(new URL('geometry-comparison.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" width="1420" height="990" viewBox="0 0 1420 990">${content}</svg>`);
for (const text of ['098 SJF','976 SKP','JA7 91L']) for(const v of VARIANTS){fs.writeFileSync(new URL(`${text.replace(' ','-')}-${v.id}.svg`,out),stripSvg(text,v.id,220));}
console.log('Wrote geometry board and 12 strip SVGs.');
