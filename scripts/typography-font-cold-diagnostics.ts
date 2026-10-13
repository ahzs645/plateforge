import {serializeSvg} from '../src/ui/exporting';
import {availableFontAssets} from '../src/templates/fonts';
import {fontHasCharacter,fontWeightRange} from '../src/core/font-contract';
(window as any).coldFontRaster=async(mode:string)=>{
 const svg=document.querySelector<SVGSVGElement>('#plate svg')!;let source=await serializeSvg(svg);
 const fonts:FontFace[]=[];let frame:HTMLIFrameElement|undefined;let frameUrl='';
 if(mode==='hidden'){
  const parsed=new DOMParser().parseFromString(source,'image/svg+xml');const meta=JSON.parse(parsed.querySelector('[data-role="typography-export"]')!.textContent!);
  const bank=availableFontAssets();const input=svg.querySelector('text')!.textContent!;
  for(const alias of meta.fontAliases){const f=bank.find(f=>f.id===alias.id)!;const t=parsed.createElementNS('http://www.w3.org/2000/svg','text');
   t.setAttribute('font-family',alias.alias);t.setAttribute('font-weight',String(fontWeightRange(f.weight)[0]));t.setAttribute('font-style',f.style??'normal');t.setAttribute('font-size','1');t.setAttribute('opacity','0');
   t.textContent=[...input].filter(c=>fontHasCharacter(f,c)).join('');parsed.documentElement.insertBefore(t,parsed.querySelector('text'));
  }source=new XMLSerializer().serializeToString(parsed);
 }
 if(mode==='fontface'){
  const parsed=new DOMParser().parseFromString(source,'image/svg+xml');const css=new CSSStyleSheet();css.replaceSync([...parsed.querySelectorAll('style')].map(s=>s.textContent).join('\n'));
  for(const rule of css.cssRules)if(rule.type===CSSRule.FONT_FACE_RULE){const s=(rule as CSSFontFaceRule).style;
   const face=new FontFace(s.getPropertyValue('font-family').replace(/^['"]|['"]$/g,''),s.getPropertyValue('src'),{weight:s.getPropertyValue('font-weight'),style:s.getPropertyValue('font-style'),unicodeRange:s.getPropertyValue('unicode-range')});fonts.push(face);}
  await Promise.all(fonts.map(f=>f.load()));for(const f of fonts)document.fonts.add(f);
 }
 if(mode==='iframe'){
  frame=document.createElement('iframe');frame.sandbox.add('allow-same-origin');frame.style.cssText='position:fixed;left:-10000px;width:1000px;height:180px';frameUrl=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));frame.src=frameUrl;
  const loaded=new Promise(r=>frame!.onload=r);document.body.appendChild(frame);await loaded;
  const doc=frame.contentDocument!;await doc.fonts.ready;await Promise.all([...doc.querySelectorAll('text')].map(t=>{const s=doc.defaultView!.getComputedStyle(t);return doc.fonts.load(`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,t.textContent!);}));await doc.fonts.ready;
 }
 const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
 try{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=1000;c.height=180;c.getContext('2d')!.drawImage(image,0,0);return c.toDataURL('image/png');}
 finally{URL.revokeObjectURL(url);for(const f of fonts)document.fonts.delete(f);frame?.remove();if(frameUrl)URL.revokeObjectURL(frameUrl);}
};
