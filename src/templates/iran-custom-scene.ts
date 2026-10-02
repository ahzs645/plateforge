/** Flat source-aware Iran compositions; no photographic warp or background plate image. */
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_PRESET_ALIASES, IRAN_CUSTOM_CLASSES, IRAN_CUSTOM_CITIES, IRAN_CUSTOM_ZONES } from './iran-custom-data';
import { IRAN_FONT_PROFILES, renderIranGlyphRun, renderIranRoleGlyphRun, renderIranWordmark } from './iran-custom-fonts';
import { renderIranZoneEmblem, renderIranHistoricArtwork } from './iran-custom-artwork';
import { IRAN_SOURCE_ROLE_RECTS } from './iran-source-layouts';
import { validateIranNumberState } from './iran-number-generation';
import { IRAN_CODES, IRAN_PRIVATE_LETTERS, IRAN_MOTORCYCLE_CODES } from '../regions/asia/iran-data';
import type { IranCustomState, IranCustomResult, IranLetteringUsage } from './iran-custom-types';
export * from './iran-custom-data';
export type * from './iran-custom-types';
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const ascii=(s:string)=>s.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c.charCodeAt(0)>=0x6f0?0x6f0:0x660)));
const persian=(s:string)=>ascii(s).replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[Number(c)]);
const round=(n:number)=>Math.round(n*1000)/1000;
export function iranCustomizerState(presetId:string):IranCustomState{
 const id=IRAN_CUSTOM_PRESET_ALIASES[presetId]??presetId;
 return {...(IRAN_CUSTOM_PRESETS.find(p=>p.id===id)??IRAN_CUSTOM_PRESETS[0]).defaults};
}
export function applyIranClass(state:IranCustomState,classId:string):IranCustomState{
 const c=IRAN_CUSTOM_CLASSES.find(x=>x.id===classId);if(!c)return {...state};
 const nextLetter='letter' in c?c.letter:classId==='private'&&!IRAN_PRIVATE_LETTERS.some(x=>x===state.letter.replace(/ـ/g,''))?'ب':state.letter;
 const classProfile=['private','accessible','taxi','public','agricultural','government'].includes(classId)?'source-national-private-numerals':'source-national-numerals';
 return {...state,...(/^source-national-(?:private-)?numerals$/.test(state.fontProfile)&&Object.hasOwn(IRAN_FONT_PROFILES,classProfile)?{fontProfile:classProfile}:{}),vehicleClass:classId,bg:c.bg,ink:c.ink,letter:nextLetter,...(!['private','public'].includes(classId)?{nationalVariant:'diagram' as const}:{}),...(['police','irgc','army','defence','staff','diplomatic','service'].includes(classId)?{code:'11'}:{})};
}
export function iranCustomSize(state:IranCustomState):{width:number;height:number}{
 const p=IRAN_CUSTOM_PRESETS.find(x=>x.id===state.presetId)??IRAN_CUSTOM_PRESETS[0];
 const sizes:Record<string,[number,number]>={national:[520,110],protocol:[520,110],motorcycle:[200,120],temporary:[520,110],'temporary-old':[320,155],'diplomatic-old':[320,155],'historic-vehicle':[305,153],'free-zone-old':[305,153],'free-zone-2017':[360,150],'city-band':[320,155],'bilingual-2002':[360,140],observer:[305,180],'consular-old':[340,130],'military-old':[340,135],international:[440,110],historical:[340,130]};
 let [width,height]=sizes[p.kind];
 if(p.kind==='historical'&&['full-city-gilan','full-city-letter','full-city-numeric','full-city-commercial','old-government'].includes(p.id)){width=320;height=155;}
 if(p.id==='international-2010'){width=520;height=110;}
 if(p.id==='historical-1342'){width=360;height=114;}
 // Historical source mode follows inspected projected aspect where physical dimensions are unknown.
 // National520×110 remains physical; drawings with different aspect are not treated as measurements.
 const sourceAspects:Record<string,number>={'historical-1326':2.327,'historical-1335':2.097,'historical-1339':2.965,'historical-1340':3.136,'city-band-commercial-wlp':2.394};
 if(sourceAspects[p.id])height=Math.round(width/sourceAspects[p.id]);
 if(state.layout==='long'){width=520;height=110;}
 if(state.layout==='compact'){width=320;height=160;}
 if(state.aspectRatio&&Number.isFinite(state.aspectRatio)&&state.aspectRatio>=1.2&&state.aspectRatio<=6)height=Math.round(width/state.aspectRatio);
 return {width,height};
}
export function renderIranCustom(input:IranCustomState):IranCustomResult{
 const p=IRAN_CUSTOM_PRESETS.find(x=>x.id===input.presetId)??IRAN_CUSTOM_PRESETS[0],s={...p.defaults,...input};
 const validation=validateIranNumberState(s);
 const errors:string[]=[...validation.errors],warnings:string[]=[...validation.warnings];
 if(p.id!==input.presetId)errors.push('Unknown preset. Restore a listed design.');
 const fields=new Set(p.fields);const {width:w,height:h}=iranCustomSize(s);
 const serial=ascii(String(s.serial??'')).trim(),prefix=ascii(String(s.prefix??'')).trim(),code=ascii(String(s.code??'')).trim(),year=ascii(String(s.year??'')).trim(),expiry=ascii(String(s.expiry??'')).trim();
 const c=IRAN_CUSTOM_CLASSES.find(x=>x.id===s.vehicleClass);
 const letter=String(s.letter??'').normalize('NFC').trim();
 if(!/^\d{1,8}$/.test(serial))errors.push('Serial must contain 1–8 digits. Western, Persian and Arabic-Indic input are accepted.');
 if(fields.has('prefix')&&!/^\d{0,3}$/.test(prefix))errors.push('Prefix must contain up to three digits.');
 if(fields.has('code')&&!/^\d{1,3}$/.test(code))errors.push('Code must contain 1–3 digits.');
 if(fields.has('year')&&!/^1[23]\d{2}$/.test(year))errors.push('Enter the complete four-digit Solar Hijri year, such as 1342.');
 if(fields.has('expiry')&&!/^1[34]\d{2}\/(?:0?[1-9]|1[0-2])$/.test(expiry))errors.push('Expiry must be a Solar Hijri year/month, such as 1405/07.');
 if(!['strict','fallback'].includes(s.missingPolicy))errors.push('Choose a valid missing-glyph policy.');
 if(!['source','long','compact'].includes(s.layout))errors.push('Choose a valid layout.');
 if(s.aspectRatio!==undefined&&s.aspectRatio!==0&&(!Number.isFinite(s.aspectRatio)||s.aspectRatio<1.2||s.aspectRatio>6))errors.push('Aspect ratio must be0 for the preset, or between1.2 and6.');
 if(s.nationalVariant!==undefined&&!['diagram','early-photo'].includes(s.nationalVariant))errors.push('Choose a supported national arrangement.');
 if(s.nationalVariant==='early-photo'){if(p.kind!=='national'||!['private','public'].includes(s.vehicleClass))errors.push('Early-photograph arrangement is documented only for private/public plates.');warnings.push('Early-photograph arrangement follows the catalogued private/public source layout. Numeral shape evidence belongs to the selected profile; this is not proof of a separate legal introduction or certified photographic die.');}
 if(s.aspectRatio)warnings.push('Custom aspect ratio is an editor adaptation, not a measured or authenticated issue size.');
 if(!c)errors.push('Choose a listed vehicle class.');
 if(fields.has('city')&&!IRAN_CUSTOM_CITIES.some(x=>x.id===s.city))errors.push('Choose a supplied complete joined city wordmark.');
 if(fields.has('zone')&&!IRAN_CUSTOM_ZONES.some(x=>x.id===s.zone))errors.push('Choose a documented free zone.');
 const colours={bg:s.bg,ink:s.ink,strip:s.strip};for(const key of ['bg','ink','strip'] as const)if(!/^#[0-9a-f]{6}$/i.test(colours[key])){errors.push(`Invalid ${key} colour.`);colours[key]=p.defaults[key];}
 const tracking=Number.isFinite(s.tracking)?Math.max(-2,Math.min(60,s.tracking)):3,scale=Number.isFinite(s.mainScale)?Math.max(.5,Math.min(1.4,s.mainScale)):1;
 if(!Number.isFinite(s.tracking)||!Number.isFinite(s.mainScale))errors.push('Letter spacing and scale must be finite numbers.');
 const profile=Object.hasOwn(IRAN_FONT_PROFILES,s.fontProfile)?s.fontProfile:p.defaults.fontProfile;
 if(!Object.hasOwn(IRAN_FONT_PROFILES,s.fontProfile))errors.push('Choose a listed font profile.');
 if(['international','observer'].includes(p.kind)&&Object.values(IRAN_FONT_PROFILES).find(f=>f.id===s.fontProfile)?.script!=='latin')errors.push('This Latin-only design requires a Latin lettering profile.');
 if(['historical-1326','historical-1335','historical-1339','historical-1340','city-band-commercial-wlp'].includes(p.id))warnings.push('Source aspect is a projected photographic estimate; these drawing dimensions are not authenticated physical dimensions.');
 if(s.layout!=='source')warnings.push('Alternate aspect ratio is an editor adaptation, not an independently verified issue.');
 if(p.confidence==='provisional')warnings.push('Provisional source coverage: '+p.evidence);
 warnings.push('Lettering candidates, reconstructed artwork and editable palettes are not certified manufacturing specifications.');
 const modern=p.kind==='national'||p.kind==='temporary';
 const geometryId=p.kind==='national'?`national-${s.vehicleClass}${s.nationalVariant==='early-photo'?'-early-photo':''}`:p.kind==='free-zone-old'?`free-zone-old-${s.zone}`:p.id;
 const baseReferencePreset=IRAN_CUSTOM_PRESETS.find(p=>p.id===geometryId)??p;
 const referencePreset=s.nationalVariant==='early-photo'?{...baseReferencePreset,defaults:{...baseReferencePreset.defaults,...(s.vehicleClass==='public'?{prefix:'31',serial:'957',letter:'ع',code:'32'}:{prefix:'18',serial:'399',letter:'ج',code:'94'})}}:baseReferencePreset;
 const nationalClasses=['private','accessible','taxi','public','agricultural','government','police','irgc','army','defence','staff','diplomatic','service'];
 if(p.kind==='national'){
  if(!nationalClasses.includes(s.vehicleClass))errors.push('This national layout requires a listed national vehicle class.');
  if(!/^[1-9]{2}$/.test(prefix))errors.push('National prefix requires two digits from 1–9.');
  if(!(['diplomatic','service'].includes(s.vehicleClass)?/^\d{3}$/:/^[1-9]{3}$/).test(serial))errors.push('National serial requires three digits; zero is allowed only in mission identifiers.');
  if(s.vehicleClass==='private'&&!IRAN_PRIVATE_LETTERS.some(x=>x===letter.replace(/ـ/g,'')))errors.push('Choose one of the documented private-series letters.');
  if(!/^\d{2}$/.test(code))errors.push('National allocation code requires two digits.');
  if(['police','irgc','army','defence','staff','diplomatic','service'].includes(s.vehicleClass)){if(code!=='11')warnings.push('This national class is documented from code11; later code assignments are not verified.');}
  else if(!IRAN_CODES.some(x=>x.value===code))errors.push('Allocation code is not in the researched table.');
 }
 if(p.kind==='temporary'&&(!/^[1-9]{2}$/.test(prefix)||!/^[1-9]{3}$/.test(serial)||!/^\d{2}$/.test(code)))errors.push('Temporary national layout needs a two-digit prefix, three nonzero serial digits and two-digit code.');
 if(p.kind==='motorcycle'&&(!/^[1-9]{5}$/.test(serial)||!IRAN_MOTORCYCLE_CODES.some(x=>x.value===code)))errors.push('Motorcycle needs five nonzero digits and a researched three-digit allocation.');
 if(['free-zone-old','free-zone-2017','historic-vehicle'].includes(p.kind)&&!/^\d{5}$/.test(serial))errors.push('This layout requires five serial digits.');
 if(p.kind==='protocol'&&!/^\d{4}$/.test(serial))errors.push('Protocol needs four digits.');
 const nationalPrefixWidth=w*(s.vehicleClass==='agricultural'?.27:.29)-w*.085-14;
 let uniformNationalCap:number|undefined;
 if(modern){
  const a=renderIranGlyphRun(profile,persian(prefix),0,100,100,tracking,s.missingPolicy==='fallback'?'fallback':'strict');
  const b=renderIranGlyphRun(profile,persian(serial),0,100,100,tracking,s.missingPolicy==='fallback'?'fallback':'strict');
  const logicalHeight=Math.max(100,a.bounds.y+a.bounds.height,b.bounds.y+b.bounds.height)-Math.min(0,a.bounds.y,b.bounds.y);
  const rects=IRAN_SOURCE_ROLE_RECTS[geometryId];
  uniformNationalCap=Math.min((rects?.prefix?.width?w*rects.prefix.width:nationalPrefixWidth)/Math.max(a.bounds.width,1),(rects?.serial?.width?w*rects.serial.width:w*.310)/Math.max(b.bounds.width,1),h*Math.min(rects?.prefix?.height??.73,rects?.serial?.height??.73)/logicalHeight);
 }
 const pieces:string[]=[],letteringUsage:IranLetteringUsage[]=[];
 let classInkRight:number|undefined;
 const rect=(x:number,y:number,width:number,height:number,fill:string,extra='')=>`<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" fill="${fill}" ${extra}/>`;
 const rule=(x:number,y:number,x2:number,y2:number)=>`<path d="M${round(x)} ${round(y)}L${round(x2)} ${round(y2)}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
 const add=(result:{markup:string;warnings:string[]})=>{pieces.push(result.markup);warnings.push(...result.warnings);};
 function fit(result:ReturnType<typeof renderIranGlyphRun>,x:number,y:number,bw:number,bh:number,role:string,main=false,selectedProfile=profile){
  letteringUsage.push({role,profileId:selectedProfile,profileLabel:IRAN_FONT_PROFILES[selectedProfile]?.label??selectedProfile,provenance:[...new Set(result.provenance)],sourceIds:result.sourceIds});
  warnings.push(...result.warnings);errors.push(...result.errors);
  const sourceRect=IRAN_SOURCE_ROLE_RECTS[geometryId]?.[role==='header-code'?'extension':role];
  if(sourceRect){x=sourceRect.x*w;y=sourceRect.y*h;bw=sourceRect.width*w;bh=sourceRect.height*h;}
  if(p.id==='full-city-gilan'&&role==='serial'&&serial!==p.defaults.serial){y-=h*.045;warnings.push('Edited Rasht numerals are moved slightly upward to keep clear of the city wordmark’s high dots; the source default retains its observed interleaving.');}
  if(modern&&role==='serial'&&classInkRight!==undefined&&(scale>1.001||tracking>p.defaults.tracking+.1)){const right=x+bw;x=Math.max(x,classInkRight+Math.max(1,w*.004));bw=Math.max(1,right-x);}
  const b=result.bounds;if(!b.width||!b.height)return;
  // One nominal numeral cap/baseline for a run: a lone zero must stay a small zero,
  // and changing 111 to 555 must not individually stretch every character to the box.
  const nominalTop=main?Math.min(0,b.y):b.y,nominalBottom=main?Math.max(100,b.y+b.height):b.y+b.height;
  const logicalHeight=nominalBottom-nominalTop,logicalWidth=sourceRect||modern?b.width:Math.max(b.width,main?result.advance:0);
  const natural=Math.min(bw/logicalWidth,bh/logicalHeight);
  const shared=modern&&main&&['prefix','serial'].includes(role)?uniformNationalCap:undefined;
  const z2=Math.min((shared??natural)*(main?(sourceRect||modern?1:.9)*scale:1),bw/b.width,bh/logicalHeight);
  const tx=x+(bw-b.width*z2)/2-b.x*z2,ty=y+(bh-logicalHeight*z2)/2-nominalTop*z2;
  if(role==='class')classInkRight=tx+(b.x+b.width)*z2;
  pieces.push(`<g data-role="${xml(role)}" transform="translate(${round(tx)} ${round(ty)}) scale(${round(z2)})">${result.markup}</g>`);
 }
 const run=(text:string,x:number,y:number,bw:number,bh:number,role:string,latin=false,main=true)=>{
  const microProfile=role==='latin-serial'?'latin-freezone-candidate'
   :(role==='zone-name'&&s.zone!=='maku')||role==='club'||role==='protocol-latin'?'latin-sans-candidate':'latin-sans-bold-candidate';
  const freezoneLatin=p.kind==='free-zone-old'&&role==='latin-serial'?`source-freezone-latin-${['qeshm','chabahar'].includes(s.zone)?'wide':'tall'}`:undefined;
  const bilingualRole=freezoneLatin??(p.kind==='bilingual-2002'?(role==='latin-serial'?'source-bilingual-2002-latin':role==='latin-code'?'source-bilingual-2002-code':undefined):undefined);
  const baseChosen=bilingualRole&&Object.hasOwn(IRAN_FONT_PROFILES,bilingualRole)?bilingualRole:latin?(['international','observer'].includes(p.kind)&&main?profile:microProfile):profile;
  // Main numeral masters do not pretend to contain an unseen private-series alphabet.
  // Valid unobserved series letters use a separately identified licensed class role.
  const chosen=modern&&role==='class'&&!IRAN_FONT_PROFILES[baseChosen].glyphs[text]?'parastoo-candidate':baseChosen;
  const selected=Object.values(IRAN_FONT_PROFILES).find(f=>f.id===chosen)!;
  const roleKey=p.kind==='temporary-old'&&selected.roles?.category&&role==='month'?'category':p.kind==='temporary-old'&&selected.roles?.prefix&&role==='year'?'prefix':role==='allocation'&&selected.roles?.region?'region':selected.roles?.[role]?role:role==='year-tab'||role==='year'?'year':role==='city-initial'?'city-initial':role==='header-code'&&selected.roles?.extension?'extension':['extension','header-code','allocation','international-code'].includes(role)?'code':undefined;
  const value=latin?text:persian(text),policy=s.missingPolicy==='fallback'?'fallback':'strict';
  // Calibrate spacing once from the reference's whole numeric group, not by stretching
  // glyphs. Edits retain the same source cap metrics / advances plus the user's delta.
  let runTracking=p.kind==='bilingual-2002'?0:tracking;
  const sourceRect=IRAN_SOURCE_ROLE_RECTS[geometryId]?.[role];
  const referenceText=role==='serial'&&p.kind==='city-band'?referencePreset.defaults.prefix+referencePreset.defaults.letter+referencePreset.defaults.serial
   :role==='international-serial'?referencePreset.defaults.letter+'-'+referencePreset.defaults.serial
   :role==='prefix'?referencePreset.defaults.prefix:['serial','persian-serial','latin-serial'].includes(role)?referencePreset.defaults.serial:undefined;
  if(main&&sourceRect&&referenceText&&selected.provenance==='observed'&&p.kind!=='bilingual-2002'){
   const reference=renderIranGlyphRun(chosen,latin?referenceText:persian(referenceText),0,100,100,0,'strict');
   const count=(referenceText.match(/هـ|[\s\S]/gu)??[]).length;
   const nominal=iranCustomSize({...p.defaults,layout:'source'});
   const logical=Math.max(100,reference.bounds.y+reference.bounds.height)-Math.min(0,reference.bounds.y);
   const cap=nominal.height*sourceRect.height/logical;
   if(count>1&&cap>0&&reference.errors.length===0){
    const measured=(nominal.width*sourceRect.width/cap-reference.bounds.width)/(count-1);
    if(measured>=-2&&measured<=250)runTracking=measured+(tracking-p.defaults.tracking);
   }
  }
  const result=roleKey&&selected.roles?.[roleKey]
   ?renderIranRoleGlyphRun(chosen,roleKey,value,0,100,100,0,policy)
   :renderIranGlyphRun(chosen,value,0,100,100,runTracking,policy);
  fit(result,x,y,bw,bh,role,main,chosen);
 };
 const word=(id:string,x:number,y:number,bw:number,bh:number,role=id)=>{
  const fixed:Record<string,string>={'iran':'source-national-diagram-lettering','political':'source-diplomatic-lettering','service':'source-service-lettering','alef':'source-government-lettering'};
  const special=p.kind==='diplomatic-old'?(id==='political'?'source-previous-diplomatic-lettering':id==='service'?'source-previous-service-lettering':undefined)
   :p.kind==='temporary-old'&&id==='temporary'?'source-previous-temporary-lettering'
   :p.kind==='protocol'&&id==='protocol'?'source-protocol-lettering'
   :p.kind==='historic-vehicle'&&id==='historic'?'source-historic-lettering':undefined;
  const zoneMaster=p.kind==='free-zone-old'&&['qeshm','chabahar'].includes(id)?`source-freezone-${id}-wordmark`:undefined;
  const requested=zoneMaster??(modern?fixed[id]:special);
  const selected=requested&&Object.hasOwn(IRAN_FONT_PROFILES,requested)?requested:profile;
  fit(renderIranWordmark(selected,id,0,100,100,s.missingPolicy==='fallback'?'fallback':'strict'),x,y,bw,bh,role,false,selected);
 };
 const flag=(x:number,y:number,bw:number,bh:number)=>{pieces.push(`<g data-role="flag">${rect(x,y,bw,bh/3,'#168244')}${rect(x,y+bh/3,bw,bh/3,'#ffffff')}${rect(x,y+bh*2/3,bw,bh/3,'#d92d37')}<path d="M${x+bw*.5} ${y+bh*.39}v${bh*.2}m${-bw*.04} ${-bh*.16}q${-bw*.045} ${bh*.11} ${bw*.04} ${bh*.15}q${bw*.085} ${-bh*.04} ${bw*.04} ${-bh*.15}" fill="none" stroke="#d92d37" stroke-width=".6"/></g>`);};
 const band=(bw:number,bh=h,paint=colours.strip)=>{pieces.push(rect(3,3,bw-3,bh-6,paint));flag(7,7,bw-12,Math.min(18,bh*.16));pieces.push('<g color="#ffffff" fill="currentColor">');run('I.R.',7,bh-32,bw-12,10,'latin-country',true,false);run('IRAN',5,bh-19,bw-8,10,'latin-country',true,false);pieces.push('</g>');};
 pieces.push(rect(0,0,w,h,colours.bg,'rx="4"'),`<g color="${colours.ink}" fill="currentColor">`);
 if(s.border)pieces.push(`<rect x="2" y="2" width="${w-4}" height="${h-4}" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>`);
 if(modern){
  const sw=w*.085,right=w*.79;band(sw);pieces.push(rule(right,3,right,h-3));
  run(prefix,sw+8,h*.15,nationalPrefixWidth,h*.73,'prefix');
  let mark=p.kind==='temporary'?'گ':c&&'letter' in c?c.letter:letter;
  if(s.vehicleClass==='private'&&mark.replace(/ـ/g,'')==='ه')mark='هـ';
  if(s.vehicleClass==='accessible'){
   const z=Math.min((w*.16-6)/90,h*.70/94),x=w*.29+(w*.16-90*z)/2+8*z,y=h*.15+(h*.70-94*z)/2;pieces.push(`<g data-role="accessibility-symbol" transform="translate(${x} ${y}) scale(${z})"><circle cx="28" cy="9" r="8"/><path d="M27 24v30h29l12 22 10-6M27 37h29" fill="none" stroke="currentColor" stroke-width="8"/><path d="M17 37a27 27 0 1 0 30 37" fill="none" stroke="currentColor" stroke-width="7"/></g>`);
  }else if(mark==='الف')word('alef',w*.29,h*.1681,w*.16,h*.6372,'class');
  else{
   const classBox=mark==='ع'?[.12,.78]:mark==='هـ'?[.177,.645]:mark==='ب'?[.152,.643]:mark==='D'?[.2081,.5656]:mark==='S'?[.2036,.552]:s.vehicleClass==='taxi'?[.4425,.3894]:[.1327,.6726];
   const observed=mark==='ع'?'source-national-lettering':mark==='هـ'?'source-national-heh-lettering':mark==='ت'?'source-taxi-lettering':mark==='ک'?'source-agricultural-lettering':mark==='D'?'source-diplomatic-lettering':mark==='S'?'source-service-lettering':mark==='گ'?'source-national-temporary-numerals':'بپثشزف'.includes(mark)?'source-national-numerals':undefined;
   const classX=mark==='ک'?w*.27:w*.29,classWidth=mark==='ک'?w*.18:w*.16;
   if(observed&&Object.hasOwn(IRAN_FONT_PROFILES,observed))fit(IRAN_FONT_PROFILES[observed].roles?.series?renderIranRoleGlyphRun(observed,'series',mark,0,100,100,tracking,'strict'):renderIranGlyphRun(observed,mark,0,100,100,tracking,'strict'),classX,h*classBox[0],classWidth,h*classBox[1],'class',false,observed);
   else run(mark,w*.29,h*classBox[0],w*.16,h*classBox[1],'class',['D','S'].includes(mark),false);
   if(s.vehicleClass==='taxi')run('TAXI',w*.30,h*.17,w*.14,h*.16,'taxi-label',true,false);
  }
  run(serial,w*.465,h*.15,w*.310,h*.73,'serial');
  word(s.vehicleClass==='diplomatic'?'political':s.vehicleClass==='service'?'service':'iran',right+6,7,w-right-12,h*.20,'allocation-title');
  if(p.kind==='temporary'){run(code,right+7,h*.29,w-right-14,h*.28,'allocation');pieces.push(rule(right,h*(62.5/111),w-3,h*(62.5/111)));run(expiry.replace(/^1[34]/,''),right+7,h*.68,w-right-14,h*.24,'expiry');}
  else run(code,right+8,h*.33,w-right-16,h*.55,'allocation');
 }else if(p.kind==='protocol'){
  band(w*.09);word('protocol',w*.11,h*.11,w*.43,h*.32);run('PROTOCOL',w*.12,h*.59,w*.40,h*.25,'protocol-latin',true,false);run(serial,w*.55,h*.16,w*.42,h*.69,'serial');
 }else if(p.kind==='motorcycle'){
  band(w*.21,h*.54);run(code,w*.28,h*.09,w*.66,h*.34,'allocation');run(serial,w*.05,h*.60,w*.90,h*.33,'serial');
 }else if(p.kind==='city-band'){
  pieces.push(rect(4,4,w-8,h*.35,colours.strip));word(s.city,p.id==='city-band-header-code'?w*.30:8,h*.035,p.id==='city-band-header-code'?w*.64:w-16,h*.28,'city');
  if(p.id==='city-band-header-code'){run(code+'-',w*.04,h*.07,w*.21,h*.24,'header-code');}
  run(prefix+letter+serial,w*.04,h*.45,w*.92,h*.45,'serial');
 }else if(p.kind==='historical'){
  if(p.id.startsWith('historical-')){
   const sw=w*.2,y=year.slice(-2),above=p.id==='historical-1342';
   run(letter,8,above?h*.52:h*.06,sw-16,h*.37,'city-initial');
   const yearY=above?h*.06:h*.57;const contrast=['historical-1328','historical-1335','historical-1339'].includes(p.id);
   if(contrast){pieces.push(rect(8,yearY-1,sw-16,h*.30,colours.ink));pieces.push(`<g color="${colours.bg}" fill="currentColor">`);}
   if(p.id==='historical-1326'||p.id==='historical-1333-commercial'){const divider=p.id==='historical-1333-commercial'&&(s.layout!=='source'||s.aspectRatio)?Math.max(h*.53,h*.5251+1.5):h*.53;pieces.push(rule(8,divider,sw-8,divider));}
   if(above)pieces.push(rule(11,h*.40,sw-11,h*.40));
   run(y,11,yearY,sw-22,h*.26,'year-tab');if(contrast)pieces.push('</g>');
   run(serial,sw+4,h*.13,w-sw-15,h*.72,'serial');
  }else if(p.id==='full-city-1964'){
   word(s.city,8,h*.11,w*.24,h*.26,'city');run(prefix,12,h*.52,w*.20,h*.33,'extension');run(serial,w*.29,h*.13,w*.67,h*.73,'serial');
  }else if(p.id==='old-government')run(serial,w*.055,h*.16,w*.89,h*.68,'serial');
  else{
   run(serial,w*.05,h*.08,w*.90,h*.49,'serial');
   if(p.id==='full-city-gilan')word(s.city,w*.12,h*.67,w*.76,h*.24,'city');
   else{word(s.city,w*.41,h*.67,w*.53,h*.24,'city');run((p.id==='full-city-letter'?letter:code)+'-',w*.06,h*.65,w*.27,h*.27,'extension');}
  }
 }else if(p.kind==='consular-old'){
  word('consular',w*.05,h*.16,w*.45,h*.62,'class');run(serial,w*.58,h*.15,w*.33,h*.69,'serial');
 }else if(p.kind==='diplomatic-old'){
  run(serial,w*.20,h*.08,w*.60,h*.49,'serial');run(prefix,w*.08,h*.68,w*.22,h*.22,'prefix');word(s.vehicleClass==='service'?'service':'political',w*.43,h*.66,w*.47,h*.23,'class');
 }else if(p.kind==='temporary-old'){
  const sw=w*.266;pieces.push(rule(sw,3,sw,h-3),rule(3,h*.50,sw,h*.50));run(prefix,9,h*.08,sw-18,h*.30,'month');run(year.slice(-2),9,h*.64,sw-18,h*.28,'year');word('temporary',sw+10,h*.06,w-sw-20,h*.22);run(serial,sw+8,h*.39,w-sw-18,h*.50,'serial');
 }else if(p.kind==='historic-vehicle'){
  const sw=w*.36;pieces.push(rect(3,3,sw-3,h-6,colours.strip),rule(sw,3,sw,h-3),rule(sw,h*.49,w-3,h*.49));flag(8,8,34,16);pieces.push('<g color="#ffffff" fill="currentColor">');run('I.R. IRAN',8,28,45,9,'country-latin',true,false);pieces.push('</g>');add(renderIranHistoricArtwork(8,h*.46,sw-16,h*.49));word('historic',sw+12,h*.08,w-sw-24,h*.29);run(serial,sw+8,h*.57,w-sw-16,h*.31,'serial');
 }else if(p.kind==='free-zone-old'||p.kind==='free-zone-2017'){
  const q=s.zone==='qeshm',ch=s.zone==='chabahar',sw=w*(q||ch?.26:.36),split=h*(q||ch?72/125:.50);
  if(!q)pieces.push(rect(3,3,sw-3,h-6,colours.strip));
  if(ch)pieces.push(rect(sw,split,w-sw-3,h-split-3,colours.strip));
  pieces.push(rule(sw,3,sw,h-3),rule(q?sw:ch?3:sw,split,w-3,split));
  if(!q&&!ch){flag(7,8,30,15);pieces.push('<g color="#ffffff" fill="currentColor">');run('I.R. IRAN',40,10,sw-46,7,'zone-country',true,false);pieces.push('</g>');}
  const emblemBox=IRAN_SOURCE_ROLE_RECTS[geometryId]?.emblem;
  add(renderIranZoneEmblem(s.zone,emblemBox?emblemBox.x*w:sw*.15,emblemBox?emblemBox.y*h:h*(q?.06:ch?.10:.22),emblemBox?emblemBox.width*w:sw*.70,emblemBox?emblemBox.height*h:h*(q?.40:ch?.33:.48)));
  if(q||ch){pieces.push(`<g color="${ch?'#ffffff':colours.ink}" fill="currentColor">`);word(s.zone,sw*.09,h*.65,sw*.82,h*.23,'zone-name');pieces.push('</g>');}
  else{pieces.push('<g color="#ffffff" fill="currentColor">');run(s.zone.toUpperCase(),sw*.06,h*.80,sw*.88,h*.12,'zone-name',true,false);pieces.push('</g>');}
  run(serial,sw+10,h*.08,w-sw-20,h*.34,'persian-serial');pieces.push(`<g color="${ch?'#ffffff':colours.ink}" fill="currentColor">`);run(serial,sw+10,h*.60,w-sw-20,h*.27,'latin-serial',true);pieces.push('</g>');
  if(p.kind==='free-zone-2017')warnings.push('2017 pilot text establishes dimensions and class colours; exact zone-code geometry remains provisional pending the cited pilot photograph.');
 }else if(p.kind==='bilingual-2002'){
  const sw=w*(27/258),split=h*(52/101),col=w*(80/258);band(sw,h,'#165099');pieces.push(`<ellipse data-role="source-disc-silhouette" cx="${w*14.5/258}" cy="${h*52.5/101}" rx="${w*9/258}" ry="${h*9/101}" fill="#a4b3ae"><title>Visible plain disc silhouette; no unreadable internal seal detail is invented</title></ellipse>`);warnings.push('The visible plain circular disc is a silhouette only; its tiny internal detail cannot be established from this photograph.');pieces.push(rect(sw,4,w-sw-4,split-4,colours.strip),rule(sw,split,w-4,split),rule(col,3,col,h-3));
  run(prefix,sw+5,h*.08,col-sw-10,h*.31,'allocation');run(serial,col+8,h*.08,w-col-16,h*.32,'persian-serial');run(letter,sw+5,h*.64,col-sw-10,h*.23,'latin-code',true);run(serial,col+8,h*.61,w-col-16,h*.29,'latin-serial',true);
 }else if(p.kind==='international'){
  if(p.id==='international-2010'){
   warnings.push('The small circular touring-club medallion is omitted: the source is too small to establish its internal artwork. No invented security or identity mark is substituted.');
   const sw=w*.105,footer=h*.19,right=w*.83;pieces.push(rect(3,3,w-6,h-6,colours.strip),rect(sw,7,right-sw,h-footer-10,colours.bg));
   pieces.push('<g color="#ffffff" fill="currentColor">');if(IRAN_FONT_PROFILES[profile]?.wordmarks['iran-latin'])word('iran-latin',7,8,sw-14,11,'country');else run('IRAN',7,8,sw-14,11,'country',true,false);run('TOURING & AUTOMOBILE CLUB OF THE ISLAMIC REPUBLIC OF IRAN',8,h-footer+4,w-16,9,'club',true,false);run(code,right+6,14,w-right-13,h-footer-24,'international-code',true);pieces.push('</g>');
   run(prefix,sw+8,17,w*.17,h*.55,'prefix',true);pieces.push(rect(w*.31,7,w*.12,h-footer-10,'#b9323e'),'<g color="#ffffff" fill="currentColor">');run(letter,w*.325,16,w*.09,h*.55,'letter',true);pieces.push('</g>');run(serial,w*.45,16,w*.35,h*.55,'serial',true);
  }else run(letter+'-'+serial,w*.035,h*.17,w*.93,h*.66,'international-serial',true);
 }else if(p.kind==='observer'){
  if(letter.toUpperCase()==='UNIIMOG'&&IRAN_FONT_PROFILES[profile]?.wordmarks.uniimog)word('uniimog',w*.055,h*.10,w*.89,h*.25,'mission');else run(letter,w*.055,h*.10,w*.89,h*.25,'mission',true);run(serial,w*.23,h*.47,w*.54,h*.42,'serial',true);
 }else if(p.kind==='military-old'){
  if(p.id==='us-military'){pieces.push(rect(3,3,w-6,h-6,colours.strip),rect(w*.07,h*.15,w*.86,h*.70,colours.bg));run(serial,w*.16,h*.22,w*.68,h*.56,'serial');}
  else{word('us-topographical',w*.025,h*.12,w*.30,h*.49,'unit');run(serial,w*.34,h*.14,w*.63,h*.68,'serial');}
 }
 pieces.push('</g>');
 const uniqueErrors=[...new Set(errors)],uniqueWarnings=[...new Set(warnings)];
 const metadata={version:1,preset:p.id,state:{...s,serial,prefix,code,year,expiry},evidence:p.evidence,dateNote:p.dateNote,sources:p.sources,letteringUsage,warnings:uniqueWarnings,errors:uniqueErrors};
 return {width:w,height:h,letteringUsage,errors:uniqueErrors,warnings:uniqueWarnings,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" data-canonical="true" data-preset="${xml(p.id)}"><title>${xml(p.label+' · '+serial)}</title><desc>${xml(p.evidence+' '+p.dateNote+' '+uniqueWarnings.join(' '))}</desc><metadata id="plateforge-iran-settings">${xml(JSON.stringify(metadata))}</metadata>${pieces.join('')}</svg>`};
}
