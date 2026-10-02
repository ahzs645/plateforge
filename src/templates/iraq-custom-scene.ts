/** Parametric flat Iraq editor. No photograph geometry, hardware, wear or arbitrary SVG-string replacement. */
import { IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_CLASSES, IRAQ_CUSTOM_PROVINCES } from './iraq-custom-data';
import { renderGlyphRun, renderWordmark, IRAQ_FONT_PROFILES } from './iraq-custom-fonts';
import { IRAQ_LETTERS } from '../regions/asia/iraq-data';
import type { IraqCustomState, IraqCustomResult, IraqCustomKind, IraqCustomPreset } from './iraq-custom-types';
export { IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_CLASSES, IRAQ_CUSTOM_PROVINCES, IRAQ_CUSTOM_SOURCE_COVERAGE } from './iraq-custom-data';
export type { IraqCustomState, IraqCustomResult, IraqCustomPreset, IraqCustomSourceCoverage } from './iraq-custom-types';
const xml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]!));
const ascii = (s: string) => s.replace(/[٠-٩۰-۹]/g,c => String(c.charCodeAt(0) - (c.charCodeAt(0)>=0x6f0?0x6f0:0x660)));
const hex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
export function customizerState(presetId: string): IraqCustomState {
  const p = IRAQ_CUSTOM_PRESETS.find(x=>x.id===presetId) ?? IRAQ_CUSTOM_PRESETS[0];
  return { ...p.defaults };
}
export function applyIraqClass(state: IraqCustomState, classId: string): IraqCustomState {
  const p = IRAQ_CUSTOM_PRESETS.find(x=>x.id===state.presetId) ?? IRAQ_CUSTOM_PRESETS[0];
  const c = IRAQ_CUSTOM_CLASSES.find(x=>x.id===classId); if(!c)return {...state};
  const stripClass = p.kind==='modern' || p.kind==='modern-temporary' || p.kind==='bilingual' || p.kind==='international';
  if(p.kind==='inspection-temporary')return {...state,vehicleClass:classId,bg:'#f8f8f3',ink:'#171717',strip:'#f8f8f3'};
  return {...state,vehicleClass:classId,governorate:classId!=='temporary'&&['modern','modern-temporary'].includes(p.kind)?state.governorate.split('-')[0]:state.governorate,year:classId==='temporary'&&['divided','police','legacy-temporary'].includes(p.kind)?state.year||'2021':state.year,bg:stripClass?'#f8f8f3':c.colour,ink:classId==='temporary'?'#cc2233':stripClass?'#171717':c.ink,strip:classId==='temporary'?'#f8f8f3':c.colour};
}
function kindFor(base: IraqCustomKind, vehicleClass: string): IraqCustomKind {
  if(['modern','modern-temporary'].includes(base))return vehicleClass==='temporary'?'modern-temporary':'modern';
  if(['divided','police','legacy-temporary'].includes(base))return vehicleClass==='police'?'police':vehicleClass==='temporary'?'legacy-temporary':'divided';
  return base;
}
export function iraqCustomSize(state: IraqCustomState): {width:number;height:number} {
  const p=IRAQ_CUSTOM_PRESETS.find(x=>x.id===state.presetId)??IRAQ_CUSTOM_PRESETS[0],k=kindFor(p.kind,state.vehicleClass),long=state.layout==='long';
  if(k==='modern')return long?{width:520,height:110}:{width:335,height:155};
  if(k==='modern-temporary')return long?{width:520,height:155}:{width:335,height:185};
  if(['bilingual','icts'].includes(k))return {width:long?520:335,height:185};
  if(k==='international')return long?{width:520,height:110}:{width:335,height:155};
  if(k==='short-bilingual'||k==='inspection-temporary')return {width:long?460:335,height:190};
  if(k==='side')return long?{width:400,height:150}:{width:335,height:180};
  return long?{width:520,height:180}:{width:335,height:200};
}
export function renderIraqCustom(input: IraqCustomState): IraqCustomResult {
  const errors:string[]=[],warnings:string[]=[];
  const p=IRAQ_CUSTOM_PRESETS.find(x=>x.id===input.presetId)??IRAQ_CUSTOM_PRESETS[0];
  if(p.id!==input.presetId)errors.push('Unknown preset. Reset to a listed preset.');
  const s={...p.defaults,...input},kind=kindFor(p.kind,s.vehicleClass),{width:w,height:h}=iraqCustomSize(s);
  const serial=ascii(String(s.serial??'')).trim(),gov=ascii(String(s.governorate??'')).trim(),year=ascii(String(s.year??'')).trim(),letter=String(s.letter??'').trim().toUpperCase();
  if(!/^\d{1,8}$/.test(serial))errors.push('Serial must contain 1–8 digits (Western, Arabic-Indic or Persian input).');
  if((kind==='modern'||kind==='modern-temporary')&&!/^\d{2}(?:-\d{2})?$/.test(gov))errors.push('Governorate must be two digits, or a two-code range for a temporary plate.');
  if(kind==='modern'&&gov.includes('-'))errors.push('A governorate range belongs to the temporary layout.');
  if((['modern','bilingual','short-bilingual','inspection-temporary','icts'].includes(kind))&&!/^[A-Z]$/.test(letter))errors.push('Use one Latin series letter.');
  if(['bilingual','short-bilingual','inspection-temporary','icts'].includes(kind)&&!IRAQ_LETTERS.some(x=>x.latin===letter))errors.push('Select one of the documented bilingual letter pairs.');
  if(kind==='international'&&!/^[A-Z]{2,4}$/.test(letter))errors.push('International suffix must contain 2–4 Latin letters.');
  if(kind==='legacy-temporary'&&!/^\d{4}$/.test(year))errors.push('The year strip needs four digits.');
  if(!IRAQ_CUSTOM_PROVINCES.some(x=>x.id===s.province))errors.push('Choose a listed province.');
  if(!IRAQ_CUSTOM_CLASSES.some(x=>x.id===s.vehicleClass))errors.push('Choose a listed vehicle class.');
  if(!['long','compact'].includes(s.layout))errors.push('Choose long or compact layout.');
  if(!['strict','fallback'].includes(s.missingPolicy))errors.push('Choose strict or labelled-fallback policy.');
  const knownProfile=Object.values(IRAQ_FONT_PROFILES).some(x=>x.id===s.fontProfile);
  if(!knownProfile)errors.push('Choose a listed font profile.');
  const profile=knownProfile?s.fontProfile:p.defaults.fontProfile;
  const colours:Record<'bg'|'ink'|'strip',string>={bg:'#f8f8f3',ink:'#171717',strip:'#f8f8f3'};
  for(const k of ['bg','ink','strip'] as const){if(hex(s[k]))colours[k]=s[k];else errors.push(`Invalid ${k} colour; use #RRGGBB.`);}
  const tracking=Number.isFinite(s.tracking)?Math.min(12,Math.max(-2,s.tracking)):3;
  const scale=Number.isFinite(s.mainScale)?Math.min(1.4,Math.max(.5,s.mainScale)):1;
  if(tracking!==s.tracking||scale!==s.mainScale)warnings.push('Typography control was clamped to the supported range.');
  warnings.push(p.evidence);
  if(s.vehicleClass!==p.defaults.vehicleClass)warnings.push('Changed vehicle class is a user customization; this combination is not automatically verified as an issued layout.');
  if(['modern','modern-temporary','bilingual','icts'].includes(kind)&&colours.strip.toLowerCase()===colours.ink.toLowerCase())warnings.push('Strip and lettering use the same colour; change either colour to make the strip legend visible.');
  if(!p.id.startsWith('flat-'))warnings.push('Editable recipe uses a labelled candidate profile; an authentic complete physical die is not established.');
  if(p.id==='flat-erbil-truck')warnings.push('Damaged truck 8/9 are not font masters. They require explicit fallback; the plate frame and characters have no damage masks.');
  if(p.id==='flat-erbil-motorcycle')warnings.push('The source hid upper character tips. This flat template uses a declared compatible/candidate profile, not guessed source contours.');
  if(s.province==='halabja'&&!['modern','modern-temporary'].includes(kind))warnings.push('Halabja in this historical layout is a user customization, not documented legacy issuance.');
  warnings.push('Drawing units are canonical editor coordinates, not newly measured official physical dimensions.');
  const parts:string[]=[];
  const rect=(x:number,y:number,rw:number,rh:number,fill:string,extra='')=>`<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${fill}" ${extra}/>`;
  const rule=(x1:number,y1:number,x2:number,y2:number)=>`<path data-role="divider" d="M${x1} ${y1}H${x2===x1?x1:x2}${y2===y1?'':`V${y2}`}" fill="none" stroke="currentColor" stroke-width="2"/>`;
  function collect(r:ReturnType<typeof renderGlyphRun>,role:string){
    warnings.push(...r.warnings.map(x=>`${role}: ${x}`));
    if(r.provenance.includes('unsupported'))errors.push(`${role}: unsupported characters/wordmark in strict mode. Select another source profile or explicitly enable labelled fallback.`);
  }
  function run(text:string,x:number,y:number,slotW:number,cap:number,font=profile,role='serial') {
    const requested=cap*(role==='serial'?scale:1);
    let top=8,bottom=h-8;
    if(kind==='modern'&&s.layout==='compact'){if(role==='serial')top=h*.5+2;else bottom=h*.48-2;}
    else if(kind==='modern-temporary'){if(role==='serial')top=h*.5+2;else bottom=h*.5-5;}
    else if(kind==='international'&&s.layout==='compact'){if(role==='suffix')top=h*.52;else bottom=h*.48;}
    else if(kind==='bilingual'||kind==='icts'){if(role==='latin-pair'){top=h*.49;bottom=h*.69;}else if(role==='serial')bottom=h*.48;}
    else if(kind==='short-bilingual'||kind==='inspection-temporary')bottom=h*.57-8;
    else if(['divided','police','legacy-temporary'].includes(kind)&&role==='serial')bottom=h*.55-8;
    if(role==='year'){top=Math.max(8,y-cap*1.1);bottom=Math.min(h-8,y+cap*.1);}
    let r=renderGlyphRun(font,text,0,0,requested,tracking,s.missingPolicy);
    let chosen=requested;
    if(r.bounds.height>bottom-top&&r.bounds.height>0){chosen=requested*(bottom-top)/r.bounds.height;r=renderGlyphRun(font,text,0,0,chosen,tracking,s.missingPolicy);warnings.push(`${role}: whole run uniformly reduced to stay inside its row.`);}
    if(r.advance>slotW&&r.advance>0){const gaps=Math.max(0,(text.match(/هـ|[^]/gu)?.length??0)-1)*tracking;const glyphWidth=r.advance-gaps;chosen=chosen*Math.max(.01,(slotW-gaps)/Math.max(.01,glyphWidth));r=renderGlyphRun(font,text,0,0,chosen,tracking,s.missingPolicy);warnings.push(`${role}: whole run uniformly reduced to fit; no individual glyph was stretched.`);}
    if(r.advance>slotW+0.1)errors.push(`${role}: tracking is too wide for this field. Reduce tracking or serial length.`);
    collect(r,role);const left=x+(slotW-r.advance)/2;
    let baseline=y;
    if(baseline+r.bounds.y<top)baseline=top-r.bounds.y;
    if(baseline+r.bounds.y+r.bounds.height>bottom)baseline=bottom-r.bounds.y-r.bounds.height;
    const positioned=renderGlyphRun(font,text,left,baseline,chosen,tracking,s.missingPolicy);
    parts.push(`<g data-role="${role}" data-font-profile="${xml(font)}" data-provenance="${xml([...new Set(positioned.provenance)].join(','))}">${positioned.markup}</g>`);
  }
  function word(id:string,x:number,y:number,slotW:number,cap:number,role:string){
    let r=renderWordmark(profile,id,0,0,cap,s.missingPolicy),chosen=cap;
    if(r.advance>slotW&&r.advance>0){chosen=cap*slotW/r.advance;r=renderWordmark(profile,id,0,0,chosen,s.missingPolicy);warnings.push(`${role}: complete wordmark uniformly reduced; letters were not separated or squeezed.`);}
    collect(r,role);const q=renderWordmark(profile,id,x+(slotW-r.advance)/2,y,chosen,s.missingPolicy);
    parts.push(`<g data-role="${role}" data-wordmark="${xml(id)}" data-provenance="${xml([...new Set(q.provenance)].join(','))}">${q.markup}</g>`);
  }
  // Tiny strip role uses deliberately plain geometric capitals, separate from FE serial I.
  function stripWord(text:string,x:number,y:number,width:number,height:number,vertical:boolean){
    const paths:Record<string,[number,string]>={I:[16,'M0 0H16V100H0Z'],R:[68,'M0 0H37Q65 0 65 30Q65 49 44 57L68 100H48L25 61H18V100H0Z M18 18V43H36Q47 43 47 30Q47 18 36 18Z'],Q:[65,'M31 0Q60 0 60 28V71Q60 84 49 93L65 100H39Q0 100 0 71V28Q0 0 31 0Z M31 18Q18 18 18 30V68Q18 82 31 82Q42 82 42 68V30Q42 18 31 18Z'],K:[67,'M0 0H17V43L44 0H65L36 46L67 100H46L24 61L17 71V100H0Z'],A:[70,'M0 100L25 0H45L70 100H51L44 70H26L19 100Z M31 52H39L35 26Z'],C:[64,'M62 16Q50 0 31 0Q0 0 0 29V71Q0 100 31 100Q51 100 62 83L48 72Q42 82 32 82Q18 82 18 68V32Q18 18 32 18Q42 18 48 28Z'],T:[70,'M0 0H70V18H44V100H26V18H0Z'],S:[64,'M62 14Q52 0 31 0Q2 0 2 27Q2 46 28 56Q46 62 46 73Q46 83 33 83Q18 83 10 70L0 84Q13 100 33 100Q64 100 64 73Q64 53 37 42Q20 36 20 27Q20 17 32 17Q44 17 52 27Z']};
    const chars=[...text];if(vertical){const cell=height/chars.length;chars.forEach((c,i)=>{const g=paths[c];if(!g)return;const z=Math.min(cell*.72/100,width*.72/g[0]);parts.push(`<path data-role="small-strip" data-char="${c}" d="${g[1]}" fill-rule="evenodd" transform="translate(${x+(width-g[0]*z)/2} ${y+i*cell+(cell-100*z)/2}) scale(${z})"/>`);});}
    else {const units=chars.reduce((a,c)=>a+(paths[c]?.[0]??0),0)+12*(chars.length-1),z=Math.min(width/units,height/100);let px=x+(width-units*z)/2;for(const c of chars){const g=paths[c];if(!g)continue;parts.push(`<path data-role="small-strip" data-char="${c}" d="${g[1]}" fill-rule="evenodd" transform="translate(${px} ${y+(height-100*z)/2}) scale(${z})"/>`);px+=(g[0]+12)*z;}}
  }
  parts.push(rect(0,0,w,h,colours.bg,'rx="6" data-role="flat-frame"'));
  parts.push(`<g fill="${colours.ink}" color="${colours.ink}">`);
  if(s.border)parts.push(rect(3,3,w-6,h-6,'none','rx="4" stroke="currentColor" stroke-width="2" data-role="flat-border"'));
  const safeSerial=/^\d{1,8}$/.test(serial)?serial:'',safeLetter=/^[A-Z]$/.test(letter)?letter:'',safeGov=/^\d{2}(?:-\d{2})?$/.test(gov)?gov:'';
  if(kind==='modern'||kind==='modern-temporary'){
    const sw=s.layout==='long'?48:42;parts.push(rect(6,6,sw-6,h-12,colours.strip,'rx="3"'));parts.push(rule(sw,5,sw,h-5));
    stripWord('IRQ',8,10,sw-12,h-(p.kr?43:18),true);if(p.kr)stripWord('KR',10,h-32,sw-16,22,false);
    if(kind==='modern-temporary'){run(safeGov,sw+12,h*.46,w-sw-24,h*.32,'modern-eng','governorate');run(safeSerial,sw+12,h*.88,w-sw-24,h*.35,profile,'serial');}
    else if(s.layout==='long'){
      const content=w-sw-22;run(safeGov,sw+10,h*.81,content*.2,h*.64,'modern-eng','governorate');run(safeLetter,sw+content*.25,h*.81,content*.13,h*.64,profile,'series');run(safeSerial,sw+content*.41,h*.81,content*.57,h*.64,profile,'serial');
    }else{run(safeGov,sw+14,h*.43,(w-sw)*.51,h*.31,'modern-eng','governorate');run(safeLetter,sw+(w-sw)*.60,h*.43,(w-sw)*.30,h*.31,profile,'series');run(safeSerial,sw+14,h*.88,w-sw-28,h*.34,profile,'serial');}
  } else if(kind==='international'){
    const sw=34;parts.push(rect(5,5,sw-5,h-10,colours.strip));parts.push(rule(sw,5,sw,h-5));parts.push('<g color="#ffffff" fill="#ffffff">');stripWord('IRAQ',8,10,sw-12,h-20,true);parts.push('</g>');
    const suffix=/^[A-Z]{2,4}$/.test(letter)?letter:'';
    if(s.layout==='long'){run(safeSerial,sw+12,h*.80,(w-sw)*.56,h*.63,profile,'serial');run(suffix,sw+(w-sw)*.60,h*.80,(w-sw)*.34,h*.63,profile,'suffix');}
    else{run(safeSerial,sw+12,h*.43,w-sw-24,h*.32,profile,'serial');run(suffix,sw+12,h*.88,w-sw-24,h*.30,profile,'suffix');}
    warnings.push('International city suffix is editable Latin lettering. The compact arrangement is a labelled editor adaptation, not an independently observed compact issue.');
  } else if(kind==='short-bilingual'||kind==='inspection-temporary'){
    const split=h*.57,ar=IRAQ_LETTERS.find(x=>x.latin===safeLetter)?.arabic??'';parts.push(rule(5,split,w-5,split));run(ar+safeSerial,18,split-14,w-36,h*.36,profile,'serial');
    if(kind==='inspection-temporary')word(s.vehicleClass==='temporary'?'inspection-temporary':s.vehicleClass,18,h*.91,w-36,h*.24,'inspection-class');
    else{word(s.vehicleClass,12,h*.91,w*.44,h*.23,'motorcycle-class');word(s.province,w*.52,h*.91,w*.43,h*.23,'province');}
  } else if(kind==='bilingual'||kind==='icts'){
    const sw=38,footer=h*.72;parts.push(rect(5,5,sw-5,h-10,colours.strip));parts.push(rule(sw,5,sw,h-5));parts.push(rule(sw,footer,w-5,footer));stripWord(kind==='icts'?'ICTS':'IRAQ',8,12,sw-12,h-24,true);
    const ar=IRAQ_LETTERS.find(x=>x.latin===safeLetter)?.arabic??'';run(ar+safeSerial,sw+12,h*.44,w-sw-24,h*.30,profile,'serial');run(safeLetter+safeSerial,sw+14,h*.65,w-sw-28,h*.13,'modern-eng','latin-pair');
    const national=['government','customs'].includes(s.vehicleClass);if(kind==='icts')word(s.vehicleClass==='icts'?'counter-terrorism':s.vehicleClass,sw+10,h*.92,w-sw-20,h*.18,'icts-legend');else if(national)word(s.vehicleClass,sw+14,h*.91,w-sw-28,h*.18,'class');else{word(s.vehicleClass,sw+10,h*.92,(w-sw)*.45,h*.18,'class');word(s.province,sw+(w-sw)*.52,h*.92,(w-sw)*.43,h*.18,'province');}
  } else if(kind==='side'){
    const split=w*.39;word('iraq',10,h*.30,split-18,h*.20,'country');word(s.province,10,h*.89,split-18,h*.22,'province');run(safeSerial,split+10,h*.81,w-split-24,h*.63,profile,'serial');
    // Neutral public emblem approximation only. No security disk, stamp or photographed hardware.
    const cx=split/2,cy=h*.51,r=h*.12,z=r/57;parts.push(`<g data-role="anbar-nonsecurity-emblem" data-source="iq-2001-anbar-taxi" transform="translate(${cx-651*z} ${cy-155*z}) scale(${z})"><ellipse cx="651" cy="155" rx="57" ry="57" fill="currentColor"/><path d="M650 105 L667 120 L689 120 L689 141 L703 155 L687 172 L687 191 L666 191 L650 207 L634 191 L615 191 L615 174 L606 165 L606 144 L615 136 L615 119 L637 119 Z" fill="${colours.bg}"/><path d="M647 189 L647 157 L630 145 C624 142 625 136 630 133 C631 129 635 127 639 128 C642 122 648 120 652 125 C657 120 663 125 664 129 C672 128 676 135 675 141 L655 157 L655 189 Z" fill="currentColor"/></g>`);warnings.push('The non-security emblem retains the earlier Anbar source-guided outline, scaled as one object; its use on other side-layout presets is an explicit source-family approximation. No security mark is generated.');
  } else {
    const sw=kind==='legacy-temporary'?36:0,splitY=h*.55;
    if(sw){parts.push(rect(5,5,sw-5,h-10,colours.strip));parts.push(rule(sw,5,sw,h-5));for(const [i,digit] of [...(/^\d{4}$/.test(year)?year:'')].entries())run(digit,7,28+i*(h-36)/4,sw-14,h*.105,'modern-eng','year');}
    parts.push(rule(sw||5,splitY,w-5,splitY));run(safeSerial,sw+14,splitY-12,w-sw-28,h*.38,profile,'serial');
    if(kind==='police')word('police',20,h*.88,w-40,h*.24,'class');else if(kind==='legacy-temporary'){word(s.province,sw+10,h*.88,(w-sw)*.46,h*.21,'province');word('temporary',sw+(w-sw)*.53,h*.88,(w-sw)*.40,h*.21,'class');}
    else{parts.push(rule(w/2,splitY,w/2,h-5));word(s.province,10,h*.88,w/2-20,h*.24,'province');word('iraq',w/2+10,h*.88,w/2-20,h*.24,'country');}
  }
  parts.push('</g>');
  const uniqueWarnings=[...new Set(warnings)],uniqueErrors=[...new Set(errors)];
  const fontMetadata=Object.values(IRAQ_FONT_PROFILES).find(x=>x.id===profile)!;
  const desc=`Canonical flat configurable template. ${p.evidence} Font: ${profile}; policy: ${s.missingPolicy}. Font source: ${fontMetadata.sourceUrl}. Rights: ${fontMetadata.rights}. ${uniqueWarnings.join(' ')} ${uniqueErrors.join(' ')}`;
  const head=`<title>${xml(p.label+' · '+serial)}</title><desc>${xml(desc)}</desc>`,settings=xml(JSON.stringify({version:1,state:{...s,serial,governorate:gov,year,letter,tracking,mainScale:scale}}));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" data-canonical="true" data-preset="${xml(p.id)}" data-layout="${xml(s.layout)}">${head}<metadata id="plateforge-iraq-settings">${settings}</metadata>${parts.join('')}</svg>`;
  // Inner markup for pages showing many plates at once (timeline thumbnails), so the metadata carries no id.
  const body=`${head}<metadata data-role="plateforge-iraq-settings">${settings}</metadata>${parts.join('')}`;
  return {svg,body,width:w,height:h,warnings:uniqueWarnings,errors:uniqueErrors};
}

/** Editable fields for a preset's fixed class; the main app and the standalone editor share these rules. */
export function iraqActiveFields(preset: IraqCustomPreset, vehicleClass = preset.defaults.vehicleClass): Set<keyof IraqCustomState> {
  const active = new Set(preset.fields);
  if (['modern', 'modern-temporary'].includes(preset.kind)) { if (vehicleClass === 'temporary') active.delete('letter'); else active.add('letter'); }
  if (['divided', 'police', 'legacy-temporary'].includes(preset.kind)) { if (vehicleClass === 'temporary') active.add('year'); else active.delete('year'); }
  if (['modern', 'modern-temporary', 'international', 'icts', 'inspection-temporary'].includes(preset.kind)) active.delete('province');
  if (['side', 'short-bilingual', 'inspection-temporary', 'police'].includes(preset.kind)) active.delete('strip');
  if (['divided', 'legacy-temporary'].includes(preset.kind) && vehicleClass !== 'temporary') active.delete('strip');
  if (preset.kind === 'bilingual') { if (['government', 'customs'].includes(vehicleClass)) active.delete('province'); else active.add('province'); }
  return active;
}
/** Plate parts are strings; numbers and the border flag round-trip through their string forms. */
export function iraqCustomParts(state: IraqCustomState): Record<string, string> {
  const { presetId: _preset, tracking, mainScale, border, ...text } = state;
  return { ...text, tracking: String(tracking), mainScale: String(mainScale), border: border ? 'on' : 'off' };
}
export function iraqCustomStateFromParts(presetId: string, parts: Record<string, string | undefined>): IraqCustomState {
  const state = customizerState(presetId);
  const value = (key: keyof IraqCustomState) => parts[key] ?? undefined;
  const number = (key: 'tracking' | 'mainScale') => { const n = Number(value(key)); return value(key) !== undefined && value(key) !== '' && Number.isFinite(n) ? n : state[key]; };
  return {
    ...state,
    ...Object.fromEntries((['serial', 'province', 'letter', 'governorate', 'year', 'vehicleClass', 'fontProfile', 'bg', 'ink', 'strip'] as const)
      .filter((key) => value(key) !== undefined).map((key) => [key, value(key)!])),
    layout: value('layout') === 'compact' || value('layout') === 'long' ? value('layout') as IraqCustomState['layout'] : state.layout,
    missingPolicy: value('missingPolicy') === 'strict' || value('missingPolicy') === 'fallback' ? value('missingPolicy') as IraqCustomState['missingPolicy'] : state.missingPolicy,
    tracking: number('tracking'), mainScale: number('mainScale'),
    border: value('border') === undefined ? state.border : value('border') !== 'off',
  };
}
