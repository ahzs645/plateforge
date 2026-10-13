/** Test-only controlled experiment. Outputs raster samples, never font software. */
import {serializeSvg} from '../src/ui/exporting';
import {availableFontAssets} from '../src/templates/fonts';
import {fontHasCharacter} from '../src/core/font-contract';

const asData=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(blob);});
async function raster(source:string,delay=0){
 const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
 try{const image=new Image();image.src=url;await image.decode();if(delay)await new Promise(r=>setTimeout(r,delay));
 const c=document.createElement('canvas');c.width=1000;c.height=180;c.getContext('2d')!.drawImage(image,0,0,1000,180);
 return await asData(await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('PNG failed')),'image/png')));
 }finally{URL.revokeObjectURL(url);}
}
(window as any).diagnoseFonts=async()=>{
 const svg=document.querySelector<SVGSVGElement>('#plate svg')!;
 const source=await serializeSvg(svg);const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
 const meta=JSON.parse(parsed.querySelector('[data-role="typography-export"]')!.textContent!);
 const original=source.replace(/PlateForgeExportFace\d+/g,(alias)=>meta.fontAliases.find((f:any)=>f.alias===alias)?.family??alias);
 const results:Record<string,string>={};
 for(const [label,value] of [['alias',source],['original',original]])for(const display of ['swap','auto','block']){
   const candidate=value.replaceAll('font-display:block','font-display:'+display);
   results[label+'-'+display+'-immediate']=await raster(candidate);
   results[label+'-'+display+'-500ms']=await raster(candidate,500);
 }
 const fonts=availableFontAssets();const text=svg.querySelector('text')!.textContent!;
 for(const mode of ['hidden-preload','explicit-glyph']){
  const doc=new DOMParser().parseFromString(source.replaceAll('font-display:block','font-display:auto'),'image/svg+xml');
  const node=doc.querySelector('text')!;
  if(mode==='hidden-preload'){
   for(const alias of meta.fontAliases){
    const font=fonts.find(f=>f.id===alias.id)!;
    const sample=[...text].filter(ch=>fontHasCharacter(font,ch)).join('');
    const t=doc.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('font-family',alias.alias);t.setAttribute('font-size','1');t.setAttribute('font-weight',String(font.weight??400));t.setAttribute('font-style',font.style??'normal');t.setAttribute('opacity','0');t.textContent=sample;doc.documentElement.insertBefore(t,node);
   }
  }else{
   node.textContent='';for(const ch of text){
    const f=[...meta.fontAliases].reverse().find((a:any)=>fontHasCharacter(fonts.find(f=>f.id===a.id)!,ch));
    const span=doc.createElementNS('http://www.w3.org/2000/svg','tspan');if(f)span.setAttribute('font-family',f.alias);span.textContent=ch;node.appendChild(span);
   }
  }
  results[mode]=await raster(new XMLSerializer().serializeToString(doc));
 }
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-10000px;width:1000px;height:180px';
 try{
  const loaded=new Promise(r=>frame.onload=r);frame.srcdoc=source;document.body.appendChild(frame);await loaded;
  const doc=frame.contentDocument!;await doc.fonts.ready;await Promise.all([...doc.querySelectorAll('text')].map(t=>{const s=doc.defaultView!.getComputedStyle(t);return doc.fonts.load(`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,t.textContent!);}));
  results['iframe-font-warmup']=await raster(source);
 }finally{frame.remove();}
 return {metadata:meta,results};
};
