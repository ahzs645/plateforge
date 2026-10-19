/** Test-only entry. It is compiled into qa-dist, never into the deployed application. */
import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import '../src/templates';
import '../src/regions';
import {getRegions,generatePlate,makePlate,templateFor} from '../src/core/registry';
import {createRng} from '../src/core/random';
import {PlateView} from '../src/ui/PlateView';
import {installPlateFonts,availableFontAssets} from '../src/templates/fonts';
import {serializeSvg,svgToPngBlob,svgToTeslaPngBlob} from '../src/ui/exporting';
import {inspectSvgTypography,svgTextRuns} from '../src/ui/font-inspection';
import {reviewPlateExport} from '../src/ui/export-policy';
import {loadResearchDies,setResearchDiesEnabled} from '../src/templates/dies/research-dies';
import {nextPaint} from '../src/ui/font-loading';
import type {Plate} from '../src/core/types';
installPlateFonts();
const root=createRoot(document.getElementById('plate')!);
let plate:Plate|null=null;
const all=getRegions().flatMap(region=>region.formats.map(format=>({region,format,template:templateFor(region,format).id})));
const getSvg=()=>document.querySelector<SVGSVGElement>('#plate svg')!;
const blobUrl=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});
async function ready(){
  for(let pass=0;pass<2;pass++){
    await Promise.all(svgTextRuns(getSvg()).map(run=>document.fonts.load(`${run.style} ${run.weight} ${run.size} ${run.family}`,run.text)));
    await document.fonts.ready;await nextPaint(document);
  }
  const images=[...getSvg().querySelectorAll('image')].map(async im=>{const image=new Image();image.src=im.getAttribute('href')!;await image.decode();});
  await Promise.all(images);
}
function info(){
  const svg=getSvg(),inspection=inspectSvgTypography(svg,availableFontAssets());
  const {x,y,width,height}=svg.viewBox.baseVal;
  if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)throw Error('Non-finite geometry');
  svg.style.width=width+'px';svg.style.height=height+'px';
  return {width,height,serial:plate?.text,template:plate&&templateFor(plate.region,plate.format).id,
    liveRuns:inspection.liveRuns,fonts:inspection.faces.map(f=>({id:f.id,family:f.family,weight:f.weight,style:f.style,version:f.sourceVersion,sha256:f.sha256})),
    warnings:inspection.warnings,systems:inspection.systemFamilies,profiles:inspection.profileIds,researchUnits:inspection.researchUnits,
    review:plate?reviewPlateExport(plate):null};
}
(window as any).typographyQA={
  formats:all.map(({region,format,template})=>({region:region.id,format:format.id,template,label:format.label,status:format.status})),
  async render(regionId:string,formatId:string,parts:Record<string,string>={},research=false){
    const found=all.find(x=>x.region.id===regionId&&x.format.id===formatId);if(!found)throw Error('Unknown exact format');
    setResearchDiesEnabled(research);if(research)await loadResearchDies();
    const generated=generatePlate(found.region,found.format,createRng(`typography:${regionId}:${formatId}`));
    plate=makePlate(found.region,found.format,{...generated.parts,...parts});
    flushSync(()=>root.render(createElement(PlateView,{plate})));
    await ready();return info();
  },
  async specimen(family:string,text:string,weight:number|string=400,style='normal'){
    plate=null;flushSync(()=>root.render(createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1000 180'},
      createElement('rect',{width:1000,height:180,fill:'white'}),createElement('text',{x:12,y:135,fontSize:96,fontFamily:family,fontWeight:weight,fontStyle:style},text))));
    await ready();return info();
  },
  async export(firstRaster='png'){
    const svg=getSvg(),source=await serializeSvg(svg,[],{currentSvg:getSvg,context:{testOnly:true}});
    const parsed=new DOMParser().parseFromString(source,'image/svg+xml');if(parsed.querySelector('parsererror'))throw Error('Invalid exported XML');
    const metadata=JSON.parse(parsed.querySelector('[data-role="typography-export"]')!.textContent!);
    if([...parsed.querySelectorAll('image')].some(image=>!image.getAttribute('href')?.startsWith('data:')))throw Error('External exported image');
    const {width,height}=svg.viewBox.baseVal;
    // Exercise either production raster path before an SVG image/font cache is warm.
    const png=async()=>blobUrl(await svgToPngBlob(source,width,height,1));
    const tesla=async()=>blobUrl(await svgToTeslaPngBlob(source,width,height));
    const first=await (firstRaster==='tesla'?tesla():png());
    return {png:firstRaster==='tesla'?await png():first,tesla:firstRaster==='tesla'?first:await tesla(),svg:source,metadata,svgBytes:new TextEncoder().encode(source).length};
  },
};
