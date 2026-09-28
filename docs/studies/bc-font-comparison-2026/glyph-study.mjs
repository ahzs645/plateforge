/**
 * Isolated Plateforge BC glyph study, 2026-09-28.
 * Selected glyph formulas manually transcribed from the public main-branch
 * skeleton.ts/profile source inspected on that date. NOT the complete app.
 * Sources:
 * https://raw.githubusercontent.com/ahzs645/plateforge/main/src/templates/dies/skeleton.ts
 * https://raw.githubusercontent.com/ahzs645/plateforge/main/src/templates/dies/profiles.ts
 * Formula reproduction is restricted to the specimens used in this study.
 * Exploratory changes are explicitly named; no licensed font data is included.
 */
export const BASE = Object.freeze({width:53, stroke:11, curve:'oval', tracking:8,
  one:'flag', two:'curved', three:'round', four:'closed', six:'curved',
  seven:'straight', nine:'curved', narrow:0.58, wide:1.2});
export const VARIANTS = Object.freeze([
  {id:'current', label:'Current bc-waldale', note:'Original oval bowls and straight 7.'},
  {id:'minimal', label:'0 override + built-in curved 7', note:'Only 0 and 7 change. All other paths stay identical.'},
  {id:'global', label:'Global stadium + curved 7', note:'A diagnostic control: bowl construction changes across other glyphs too.'},
  {id:'exploratory', label:'0 override + exploratory 7', note:'Hand-set 7 curve, not calibrated or proposed as an exact die.'},
]);
const K=0.5522847498307936;
const f=v=>Math.round(v*100)/100;
function quarters(p,{l,t,r,b}) {
  const cx=(l+r)/2,cy=(t+b)/2,rx=(r-l)/2,ry=(b-t)/2;
  if(p.curve==='oval') return [
    `C${f(cx+K*rx)} ${f(t)} ${f(r)} ${f(cy-K*ry)} ${f(r)} ${f(cy)}`,
    `C${f(r)} ${f(cy+K*ry)} ${f(cx+K*rx)} ${f(b)} ${f(cx)} ${f(b)}`,
    `C${f(cx-K*rx)} ${f(b)} ${f(l)} ${f(cy+K*ry)} ${f(l)} ${f(cy)}`,
    `C${f(l)} ${f(cy-K*ry)} ${f(cx-K*rx)} ${f(t)} ${f(cx)} ${f(t)}`];
  const rad=p.curve==='box'?Math.min(p.boxRadius??8,rx,ry):Math.min(rx,ry);
  const arc=(x,y)=>`A${f(rad)} ${f(rad)} 0 0 1 ${f(x)} ${f(y)}`;
  return [`H${f(r-rad)} ${arc(r,t+rad)} V${f(cy)}`,
    `V${f(b-rad)} ${arc(r-rad,b)} H${f(cx)}`,
    `H${f(l+rad)} ${arc(l,b-rad)} V${f(cy)}`,
    `V${f(t+rad)} ${arc(l+rad,t)} H${f(cx)}`];
}
const loop=(p,box)=>`M${f((box.l+box.r)/2)} ${f(box.t)} ${quarters(p,box).join(' ')} Z`;
const rightBowl=(p,box,from)=>`M${f(from)} ${f(box.t)} H${f((box.l+box.r)/2)} ${quarters(p,box).slice(0,2).join(' ')} H${f(from)}`;
export function geometryGlyph(char,p=BASE) {
  const w=p.width,s=p.stroke,h=s/2,L=h,R=w-h,T=h,B=100-h,MX=w/2;
  const waist=100*(p.waist??0.5),narrowW=w*(p.narrow??0.62);
  const g=(paths,advance=w)=>({advance,paths,stroke:s});
  switch(char) {
    case '0': {const inset=p.zero==='narrow'?w*0.06:0;return g([loop(p,{l:L+inset,t:T,r:R-inset,b:B})]);}
    case '1': {
      const x=p.one==='plain'?narrowW/2:narrowW*0.62;
      const paths=[p.one==='plain'?`M${f(x)} ${f(T)} V${f(B)}`:`M${f(h+1)} ${f(T+18)} L${f(x)} ${f(T)} V${f(B)}`];
      if(p.one==='flag-base')paths.push(`M${f(h)} ${f(B)} H${f(narrowW-h)}`);
      return g(paths,narrowW);
    }
    case '6': return g([loop(p,{l:L,t:42,r:R,b:B}),p.six==='straight'
      ?`M${f(L)} ${f(71)} V${f(T+22)} Q${f(L)} ${f(T)} ${f(MX)} ${f(T)} H${f(R-4)}`
      :`M${f(L)} ${f(71)} C${f(L-2)} ${f(34)} ${f(MX-4)} ${f(T+4)} ${f(R-6)} ${f(T)}`]);
    case '7': return g([p.seven==='curved'
      ?`M${f(L)} ${f(T)} H${f(R)} C${f(R-w*0.08)} ${f(38)} ${f(MX-2)} ${f(62)} ${f(MX-4)} ${f(B)}`
      :`M${f(L)} ${f(T)} H${f(R)} L${f(L+w*0.28)} ${f(B)}`]);
    case '8': return g([loop(p,{l:L+w*0.05,t:T,r:R-w*0.05,b:waist}),loop(p,{l:L,t:waist,r:R,b:B})]);
    case '9': return g([loop(p,{l:L,t:T,r:R,b:58}),p.nine==='straight'
      ?`M${f(R)} ${f(29)} V${f(B-22)} Q${f(R)} ${f(B)} ${f(MX)} ${f(B)} H${f(L+4)}`
      :`M${f(R)} ${f(29)} C${f(R+2)} ${f(66)} ${f(MX+4)} ${f(B-4)} ${f(L+6)} ${f(B)}`]);
    case 'A':return g([`M${f(L)} ${f(B)} L${f(MX)} ${f(T)} L${f(R)} ${f(B)}`,`M${f(L+w*0.17)} ${f(66)} H${f(R-w*0.17)}`]);
    case 'F':return g([`M${f(R)} ${f(T)} H${f(L)} V${f(B)}`,`M${f(L)} ${f(waist)} H${f(R-w*0.14)}`]);
    case 'J':return g([`M${f(R)} ${f(T)} V${f(B-24)} Q${f(R)} ${f(B)} ${f(MX)} ${f(B)} Q${f(L)} ${f(B)} ${f(L)} ${f(B-24)}`]);
    case 'K':return g([`M${f(L)} ${f(T)} V${f(B)}`,`M${f(R)} ${f(T)} L${f(L)} ${f(62)}`,`M${f(L+w*0.3)} ${f(46)} L${f(R)} ${f(B)}`]);
    case 'L':return g([`M${f(L)} ${f(T)} V${f(B)} H${f(R)}`]);
    case 'P':return g([`M${f(L)} ${f(B)} V${f(T)}`,rightBowl(p,{l:L,t:T,r:R,b:waist+4},L)]);
    case 'S':return g([p.curve==='box'
      ?`M${f(R)} ${f(T+14)} V${f(T+(p.boxRadius??8))} Q${f(R)} ${f(T)} ${f(R-8)} ${f(T)} H${f(L+8)} Q${f(L)} ${f(T)} ${f(L)} ${f(T+8)} V${f(waist-8)} Q${f(L)} ${f(waist)} ${f(L+8)} ${f(waist)} H${f(R-8)} Q${f(R)} ${f(waist)} ${f(R)} ${f(waist+8)} V${f(B-8)} Q${f(R)} ${f(B)} ${f(R-8)} ${f(B)} H${f(L+8)} Q${f(L)} ${f(B)} ${f(L)} ${f(B-8)} V${f(B-14)}`
      :`M${f(R)} ${f(T+16)} C${f(R)} ${f(T-4)} ${f(L)} ${f(T-4)} ${f(L)} ${f(T+24)} C${f(L)} ${f(waist-2)} ${f(R)} ${f(waist-4)} ${f(R)} ${f(B-24)} C${f(R)} ${f(B+4)} ${f(L)} ${f(B+4)} ${f(L)} ${f(B-16)}`]);
    case ' ':return g([],w*0.45);
    default:throw new RangeError(`Glyph ${JSON.stringify(char)} is outside this isolated study.`);
  }
}
export function studyGlyph(char,variant='current') {
  if(!VARIANTS.some(v=>v.id===variant))throw new RangeError(`Unknown variant: ${variant}`);
  const p={...BASE};
  if(variant==='global'){p.curve='stadium';p.seven='curved';}
  else if(variant!=='current') {
    if(char==='0')p.curve='stadium';
    p.seven='curved';
  }
  const result=geometryGlyph(char,p);
  if(variant==='exploratory'&&char==='7')result.paths=['M5.5 5.5 H47.5 C31 30 23 57 23 94.5'];
  return result;
}
const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
export function glyphMarkup(char,variant='current') {
  const g=studyGlyph(char,variant);
  return `<g fill="none" stroke="currentColor" stroke-width="${g.stroke}" stroke-linecap="square" stroke-linejoin="round">${g.paths.map(d=>`<path d="${d}"/>`).join('')}</g>`;
}
export function glyphSvg(char,variant='current',height=150) {
  const g=studyGlyph(char,variant);
  // Pad around source cap-height to retain square-cap overshoot rather than clipping.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -7 ${g.advance+14} 114" height="${height}" role="img" aria-label="${esc(variant+' '+char)}">${glyphMarkup(char,variant)}</svg>`;
}
export function stripSvg(text,variant='current',height=110) {
  let x=0,markup='';
  for(const ch of text){const g=studyGlyph(ch,variant);markup+=`<g transform="translate(${f(x)} 0)">${glyphMarkup(ch,variant)}</g>`;x+=g.advance+BASE.tracking;}
  x-=BASE.tracking;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -7 ${f(x+14)} 114" height="${height}" role="img" aria-label="${esc(variant+' '+text)}">${markup}</svg>`;
}
