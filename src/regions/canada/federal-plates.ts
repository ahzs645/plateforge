/** Source-led federal layouts. Date captions and font construction are independent. */
import type {PlateFormat, PlateStatus} from '../../core/types';
import type {KitArt, KitRecipe, KitText} from '../../templates/bc/kit';
import {kitFormat, NO_SERIAL, type KitPalette} from './bc-kit';
import '../../templates/dies/canada-federal';
import '../../templates/bc/art-federal';
import catalog from './federal-catalog.json';

interface FederalSpec {
  id: string; label: string; family: string; example: string; patterns: string[]; style: string;
  period?: number[]; description: string; status?: string; referenceIds: string[];
  sideTabs?: boolean; exchange?: boolean; ink?: string; background?: string;
  validationColor?: string; palettes?: KitPalette[];
}
const W = 'http://www.worldlicenseplates.com/world/CN_CDNX.html';
const G = 'http://www.worldlicenseplates.com/world/EU_GMIL.html#CN';
const F = 'http://www.worldlicenseplates.com/world/EU_FRAN.html#CN';
const M = 'https://licenseplatemania.com/landenpaginas/canada_official.htm';
const REVIEW = 'https://projects.ahmadjalil.com/plateforge/federal-reference-review/';
const NOTE = 'Photographic layout reconstruction: shell dimensions are illustrative estimates; serial and smaller lettering use independent constructed candidates, not traced or authenticated dies. Validation checks an observed pattern subset, not a real registration or complete allocation. Website publication stamps are not issue dates.';
const die = (id: string) => `ca-federal-${id}`;
export const FEDERAL_CATALOG: readonly FederalSpec[] = catalog;

function makeRecipe(s: FederalSpec): KitRecipe {
  let w = 300, h = 150;
  let background = '#f3f1e8', ink = '#1b211e', serialDie = 'rounded';
  let serialX = .5, baseline = .82, cap = .56, maxWidth = .87;
  const legends: KitText[] = [], art: KitArt[] = [];
  const source = s.id.includes('france') ? F : s.id.startsWith('germany-') || s.id.startsWith('rcaf-germany-') || s.id === 'rcaf-4-wing-booster' ? G : s.id.startsWith('europe-') ? M : W;
  const title = (text: string, x=.5, y=.2, size=.12, width=.76, profile='legend', color?:string) => {
    legends.push({text, x: x*w, baseline: y*h, cap: size*h, maxWidth: width*w, die: die(profile), color, role: 'legend'});
  };
  const maple = (x: number, y: number, size: number, color: string) => art.push({art: 'federal-maple', x:x*w, y:y*h, width:size*h, height:size*h, color, role:'maple'});
  const r: KitRecipe = {id:`federal-${s.id}`, label:s.label, width:w, height:h, radius:6, background, ink,
    rim:{inset:3,width:1}, holes:'slots', holeAt:{x:[.2,.8],y:[.07,.93]},
    legends, art, serial:{x:150,baseline:123,cap:84,maxWidth:261,die:die(serialDie)}, decal:null,
    embossed:true, status:s.status??'issued', source:{title:s.label+' · source gallery',url:source}, note: s.description+' '+NOTE,
    artworkAccuracy:'Schematic maple emblems and validation panels; tiny seal details and microtext omitted.'};
  // Set size before deriving any coordinates or small legends.
  if (['military-chamfer','red-sticker-long'].includes(s.style)) h=110;
  if (s.style==='military-rectangle') h=120;
  if (s.style==='fisheries') h=130;
  if (s.style==='ambulance') {w=400;h=100;}
  if (['af-long','af-france','cdn-long'].includes(s.style)) {w=400;h=85;}
  if (s.style==='attachment') {w=350;h=105;}
  if (s.style==='booster') {w=350;h=135;}
  if (s.style==='motorcycle') {w=220;h=150;}
  if (s.style==='sea') {w=250;h=145;}
  if (s.style==='flag') {w=350;h=85;}
  const cornerLeaves = (color:string) => {maple(.035,.085,.21,color); maple(1-.035-.21*h/w,.085,.21,color);};
  switch(s.style) {
    case 'fisheries':
      ink='#294d3d';serialDie='fisheries';title('CANADA-FISHERIES',.5,.22,.13,.72);baseline=.87;cap=.53;maxWidth=.7;
      if(s.sideTabs) r.panels=[.025,.88].map(x=>({x:x*w,y:.04*h,width:.095*w,height:.92*h,radius:0,background:ink,ink:'#e5dba6',rim:false,role:'side-renewal-tab',rivets:[[.0475*w,.1*h],[.0475*w,.82*h]]}));
      break;
    case 'bilingual':
      serialDie='block';title('FISHERIES',.29,.22,.09,.34);title('PECHES',.71,.22,.09,.3);title('CANADA 1976-1978',.5,.92,.1,.78);baseline=.7;cap=.43;
      // Accent is geometry, not a fabricated extra glyph in the alphabet.
      r.shapes=[{kind:'line',x1:.649*w,y1:.105*h,x2:.658*w,y2:.085*h,strokeWidth:.8},
        {kind:'line',x1:.658*w,y1:.085*h,x2:.667*w,y2:.105*h,strokeWidth:.8}];break;
    case 'sea':
      background='#252622';ink='#f2f1de';serialDie='heavy';title('R.C.A.F.',.55,.31,.18,.74);title('SEA ISLAND',.56,.51,.11,.7);serialX=.57;baseline=.86;cap=.29;maxWidth=.7;
      for(const [i,c] of [...'1957'].entries())title(c,.12,.25+i*.195,.15,.08);break;
    case 'ambulance':
      background='#283d2e';ink='#e3dda4';serialDie='legend-bold';title('ROYAL CANADIAN AIR FORCE',.5,.41,.18,.92);baseline=.85;cap=.18;maxWidth=.45;break;
    case 'dnd':title('DND',.5,.22,.16,.24);maple(.26,.07,.14,'#354854');maple(.665,.07,.14,'#354854');baseline=.8;cap=.51;break;
    case 'ppcli':background='#c2c5af';title('CANADA',.5,.22,.14,.56);title('2PPCLI',.5,.45,.11,.5,'legend','#aeb3ab');title('AIR COMDET',.5,.67,.14,.65);break;
    case 'red-leaves':cornerLeaves('#b7302f');title('CANADA',.5,.24,.15,.58);serialDie='rounded';baseline=.79;cap=.48;break;
    case 'green-leaves':ink='#245440';serialDie='narrow';cornerLeaves(ink);title('CANADA',.5,.24,.15,.58);baseline=.81;cap=.51;break;
    case 'flag':serialDie='narrow';r.rim=null;r.holes='none';art.push({art:'federal-flag',x:.06*w,y:.13*h,width:.23*w,height:.66*h});serialX=.64;maxWidth=.62;cap=.67;baseline=.82;r.serial.separator={kind:'dot'};break;
    case 'military-chamfer':
      r.cutOutline={path:'M0 20 L25 0 H275 L300 20 V110 H0 Z',viewBox:[300,110]};r.rim=null;
      // Follow the bevel rather than drawing a rectangular inset through it.
      r.shapes=[{kind:'line',x1:5,y1:22,x2:28,y2:4,strokeWidth:1},{kind:'line',x1:28,y1:4,x2:272,y2:4,strokeWidth:1},{kind:'line',x1:272,y1:4,x2:295,y2:22,strokeWidth:1}];
      background='#252421';ink='#f0efdc';serialDie='rounded';baseline=.83;cap=.64;break;
    case 'military-rectangle':background='#252421';ink='#f0efdc';serialDie='narrow';baseline=.82;cap=.61;break;
    case 'blue-bottom':background='#22608a';ink='#f2f0d3';serialDie='heavy';title('CANADA',.5,.88,.15,.78,'legend-bold');baseline=.62;cap=.43;break;
    case 'blue-maple':
      background='#25264f';ink='#eeeeda';serialDie='narrow';baseline=.81;cap=.61;r.serial.separator={kind:'art',art:{art:'federal-maple',x:0,y:.4*h,width:.14*h,height:.2*h,color:ink},gap:5};break;
    case 'army':
      background='#25264f';ink='#eeeeda';serialDie='narrow';title('CANADIAN ARMY',.5,.14,.095,.7);title('GERMANY',.5,.94,.12,.57);baseline=.73;cap=.51;
      r.serial.separator={kind:'art',art:{art:'federal-maple',x:0,y:.22*h,width:.23*h,height:.23*h,color:ink},gap:9};
      r.shapes=[{kind:'circle',cx:.5*w,cy:.59*h,r:.115*h,fill:'#c12c36',stroke:ink,strokeWidth:1}];break;
    case 'blue-top':
      background='#25264f';ink='#eeeeda';serialDie='narrow';title('CANADA',.5,.2,.14,.8);baseline=.85;cap=.57;
      r.serial.separator={kind:'art',art:{art:'federal-maple',x:0,y:.3*h,width:.32*h,height:.32*h,color:'#ce292b'},gap:9};
      r.panels=[{x:.453*w,y:.69*h,width:.094*w,height:.17*h,radius:0,background:s.validationColor??'#2b763c',ink:'#191919',rim:false,role:'validation-panel'}];break;
    case 'german-red':
      ink='#a62525';serialDie='narrow';cornerLeaves(ink);title('CANADA',.5,.24,.16,.64,'legend-bold');baseline=.82;cap=.52;
      if(s.exchange){serialX=.56;maxWidth=.77;r.shapes=[{kind:'rect',x:.035*w,y:.39*h,width:.09*w,height:.36*h,fill:'#171c1c'}];}break;
    case 'motorcycle':
      ink='#a62525';serialDie='narrow';cornerLeaves(ink);title('CANADA',.5,.36,.14,.67);baseline=.8;cap=.32;maxWidth=.85;r.holeAt={x:[.15,.85],y:[.08,.92]};break;
    case 'red-sticker':case 'red-sticker-long':case 'red-sticker-narrow':
      ink='#b92a2c';serialDie=s.style==='red-sticker-narrow'?'narrow':'block';title('CANADA',.5,.26,.15,.68,s.style==='red-sticker-narrow'?'legend':'legend-bold');baseline=.87;cap=.52;
      r.serial.separator={kind:'art',art:{art:'federal-validation',x:0,y:.49*h,width:.115*w,height:.3*h,color:s.validationColor??'#fff'},gap:11};break;
    case 'cdn-long':
      background='#f9f8ef';serialDie='angular';r.holes='none';r.rim=null;title('CDN',.085,.88,.16,.12,'legend-bold');serialX=.59;baseline=.85;cap=.65;maxWidth=.77;break;
    case 'cdn-stacked':
      background='#f9f8ef';serialDie='angular';title('CDN',.12,.88,.12,.17,'legend-bold');serialX=.61;baseline=.89;cap=.4;maxWidth=.64;
      r.serial.prefix={x:.61*w,baseline:.43*h,cap:.34*h,maxWidth:.6*w,die:die('angular')};
      r.shapes=[{kind:'circle',cx:.22*w,cy:.35*h,r:.13*h,fill:'#edeef2',stroke:'#bcc2c5',strokeWidth:.8}];title('17',.22,.4,.1,.13);break;
    case 'af-france':
      background='#273e26';ink='#eae6c7';serialDie='rounded';serialX=.365;cap=.68;baseline=.85;maxWidth=.72;
      r.shapes=[{kind:'circle',cx:.864*w,cy:.5*h,r:.45*h,fill:'#d0b95c'}];title('F',.864,.78,.58,.11,'legend-bold','#141c15');r.holes='none';break;
    case 'af-long':background=s.background??'#242725';ink='#f0eee3';serialDie='rounded';baseline=.87;cap=.72;maxWidth=.94;break;
    case 'af-compact':background='#242725';ink='#f0eee3';serialDie='narrow';title('CANADA',.5,.25,.15,.58);baseline=.88;cap=.55;maxWidth=.94;break;
    case 'attachment':background='#af242b';ink='#fff9de';title('CANADIAN ARMED FORCES',.5,.51,.28,.9,'legend-bold');title('1 WING',.5,.85,.22,.57,'legend-bold');break;
    case 'booster':title('ROYAL CANADIAN AIR FORCE',.5,.52,.23,.93);title('4(F) WING',.5,.83,.18,.54);r.holes='round';break;
    default: throw new Error(`Unimplemented federal photographic style: ${s.style}`);
  }
  Object.assign(r,{width:w,height:h,background:s.background??background,ink:s.ink??ink});
  Object.assign(r.serial,{x:w*serialX,baseline:h*baseline,cap:h*cap,maxWidth:w*maxWidth,die:die(serialDie)});
  return r;
}

export const federalGalleryFormats: PlateFormat[] = FEDERAL_CATALOG.map(s => {
  const recipe = makeRecipe(s);
  const format = kitFormat({id:s.id,label:s.label,family:s.family,
    ...(s.period ? {period:[s.period[0],s.period[1]] as const, era:`federal-${s.id}`} : {}), status:(s.status??'issued') as PlateStatus,
    recipe, grammar:s.patterns.length ? {blocks:s.patterns.map(pattern=>({pattern})),hint:`Observed pattern subset: ${s.patterns.join(' / ')}`} : NO_SERIAL,
    dies:[{id:recipe.serial.die}],palettes:s.palettes,description:s.description+' '+NOTE,
    references:[{title:'Federal photographic inventory · all examples and limitations',url:REVIEW+'#'+s.id},
      ...(s.id==='canada-red-leaves'||s.id.startsWith('europe-')?[{title:'World License Plates · Canada',url:W},{title:'License Plate Mania · Canada official',url:M}]:[])]});
  return {...format,design:{...format.design,jurisdiction:'CA'}};
});

/** Explicit caption groups prevent overseas designs falling into the national CANADA era. */
export const federalGalleryEras = FEDERAL_CATALOG.filter(s=>s.period).map(s=>({
  id:`federal-${s.id}`,family:s.family,label:s.label,period:[s.period![0],s.period![1]] as const,
  summary:'Source-caption period, not a certified tooling lifetime. See the reference ledger for undated related examples.',
}));
