import { IRAN_EVIDENCE_RECORDS } from './iran-custom-evidence';
import type { IranCustomKind, IranCustomPreset, IranCustomState, IranSourceCoverage } from './iran-custom-types';
export const IRAN_CUSTOM_CLASSES = [
  {id:'private',label:'Private',bg:'#fafaf6',ink:'#171717'},
  {id:'accessible',label:'Accessibility',bg:'#fafaf6',ink:'#171717'},
  {id:'taxi',label:'Taxi',bg:'#ffc913',ink:'#171717',letter:'ت'},
  {id:'public',label:'Public transport',bg:'#ffc913',ink:'#171717',letter:'ع'},
  {id:'agricultural',label:'Agricultural',bg:'#ffc913',ink:'#171717',letter:'ک'},
  {id:'government',label:'Government',bg:'#ed1c24',ink:'#ffffff',letter:'الف'},
  {id:'police',label:'Police',bg:'#005329',ink:'#ffffff',letter:'پ'},
  {id:'irgc',label:'IRGC',bg:'#005329',ink:'#ffffff',letter:'ث'},
  {id:'army',label:'Army',bg:'#cea160',ink:'#171717',letter:'ش'},
  {id:'defence',label:'Ministry of Defence',bg:'#0079c1',ink:'#ffffff',letter:'ز'},
  {id:'staff',label:'Armed Forces General Staff',bg:'#0079c1',ink:'#ffffff',letter:'ف'},
  {id:'diplomatic',label:'Diplomatic',bg:'#00a2e8',ink:'#171717',letter:'D'},
  {id:'service',label:'Consular / international services',bg:'#00a2e8',ink:'#171717',letter:'S'},
  {id:'commercial',label:'Commercial',bg:'#e98639',ink:'#171717'},
  {id:'temporary',label:'Temporary passage',bg:'#fafaf6',ink:'#171717',letter:'گ'},
  {id:'historic',label:'Historic vehicle',bg:'#663d28',ink:'#ffffff'},
  {id:'protocol',label:'Protocol',bg:'#ed1c24',ink:'#ffffff'},
  {id:'military',label:'Foreign forces',bg:'#fafaf6',ink:'#171717'},
  {id:'observer',label:'UN observer',bg:'#fafaf6',ink:'#171717'},
] as const;
export const IRAN_CUSTOM_CITIES = [
  {id:'tehran',label:'Tehran',text:'تهران'},{id:'rasht',label:'Rasht · Gilan',text:'رشت'},
  {id:'shiraz',label:'Shiraz',text:'شیراز'},{id:'mashhad',label:'Mashhad',text:'مشهد'},
  {id:'isfahan',label:'Isfahan',text:'اصفهان'},{id:'tabriz',label:'Tabriz',text:'تبریز'},
  {id:'qazvin',label:'Qazvin',text:'قزوین'},{id:'ahvaz',label:'Ahvaz',text:'اهواز'},
  {id:'kerman',label:'Kerman',text:'کرمان'},{id:'yazd',label:'Yazd',text:'یزد'},
] as const;
export const IRAN_CUSTOM_ZONES = [{id:'anzali',label:'Anzali',text:'انزلی'},{id:'aras',label:'Aras',text:'ارس'},{id:'arvand',label:'Arvand',text:'اروند'},{id:'kish',label:'Kish',text:'کیش'},{id:'maku',label:'Maku',text:'ماکو'},{id:'chabahar',label:'Chabahar',text:'چابهار'},{id:'qeshm',label:'Qeshm',text:'قشم'}] as const;
const WIKI={label:'Wikipedia · Iranian registration plates (secondary)',url:'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iran'};
const WLP={label:'WorldLicensePlates · Iran specimen catalogue',url:'http://www.worldlicenseplates.com/world/AS_IRAN.html'};
const DNA={label:'DNA collector archive · Iran',url:'https://dna.nl/iran.htm'};
const RF={label:'Radio Farda · national rollout already operational, 26 April 2004',url:'https://www.radiofarda.com/a/340739.html'};
const commonFields: (keyof IranCustomState)[]=['serial','fontProfile','missingPolicy','layout','aspectRatio','bg','ink','tracking','mainScale','border'];
const defaults: IranCustomState={presetId:'',serial:'345',prefix:'12',letter:'ب',code:'11',city:'tehran',year:'1326',expiry:'1405/07',zone:'qeshm',vehicleClass:'private',fontProfile:'parastoo-candidate',missingPolicy:'strict',layout:'source',aspectRatio:0,nationalVariant:'diagram',bg:'#fafaf6',ink:'#171717',strip:'#165099',tracking:3,mainScale:1,border:true};
function preset(id:string,label:string,family:string,kind:IranCustomKind,period:string,sortYear:number,patch:Partial<IranCustomState>,fields:(keyof IranCustomState)[],sourceArtworks:string[],evidence:string,dateNote:string,confidence:IranCustomPreset['confidence']='observed'):IranCustomPreset{
 return {id,label,family,kind,period,sortYear,dateNote,evidence,confidence,defaults:{...defaults,...patch,presetId:id},fields:[...new Set([...commonFields,...(['national','protocol','motorcycle','temporary','historic-vehicle','free-zone-old','city-band','bilingual-2002'].includes(kind)||id==='us-military'||id==='international-2010'?['strip' as const]:[]),...fields])],sourceArtworks,sources:[WLP,WIKI,...(sourceArtworks.some(x=>x.startsWith('iran'))?[DNA]:[])],notes:['Flat research reconstruction. Palette, measurements and candidate lettering are not certified production specifications. Edited combinations are not evidence of issuance.']};
}
const early=(id:string,label:string,year:string,serial:string,bg:string,ink:string,source:string)=>preset(id,label,'Dated city-initial specimens','historical',`${year} SH · ${Number(year)+621}/${String(Number(year)+622).slice(-2)}`,Number(year)+621,{year,serial,bg,ink,letter:'ط',fontProfile:'parastoo-candidate'},['letter','year'],[source],'Photographed city-initial / year-tab composition. Exact historical die is not established.','Solar Hijri year is a specimen/tab date, not a national redesign boundary.');
export const IRAN_CUSTOM_PRESETS: IranCustomPreset[] = [
 early('historical-1326','1326 SH · truck','1326','7376','#171717','#ffffff','iran47trucku'),
 early('historical-1328','1328 SH · city initial','1328','3435','#faf7e9','#171717','wlp-1949'),
 early('historical-1333-commercial','1333 SH · commercial','1333','200','#171717','#f7f3d8','wlp-1954-commercial'),
 early('historical-1335','1335 SH · passenger','1335','4255','#faf7e9','#171717','iran56caru'),
 early('historical-1339','1339 SH · passenger','1339','1827','#fafaf6','#171717','iran60caru'),
 early('historical-1340','1340 SH · passenger','1340','22875','#fafaf6','#171717','iran61caru'),
 early('historical-1342','1342 SH · year above initial','1342','62019','#f3eed8','#171717','iran63caru'),
 preset('full-city-1964','Full city · left extension','Full-city domestic','historical','1964–1972? · collector attribution',1964,{serial:'1231',prefix:'13'},['city','prefix'],['iran70acaru','wlp-1964'],'Observed city legend above numeric extension at left, four digits at right.','Collector endpoints uncertain; earlier specimens already have five figures. Tiny extension reads 13? in the new inspection versus 12 in prior notes; this default is uncertain.'),
 preset('full-city-gilan','Rasht / Gilan · two rows','Full-city domestic','historical','1969 series · catalogue attribution',1969,{serial:'12273',city:'rasht',prefix:''},['city'],['wlp-1969-gilan'],'Observed five figures above a full city wordmark.','UNIDO reports renumbering in SH1348 (1969/70); this does not date every surviving specimen.'),
 preset('full-city-letter','Full city · letter extension','Full-city domestic','historical','Approximately 1969–1993 · disputed boundary',1969,{serial:'94699',letter:'ج'},['city','letter'],['iran70bcaru'],'Observed serial over city and isolated extension letter.','DNA uses 1972?–1993?; contemporary UNIDO records general renumbering in 1969/70.','disputed'),
 preset('full-city-numeric','Full city · numeric extension','Full-city domestic','historical','1969 series · specimen undated',1969,{serial:'41629',code:'91',bg:'#f4e0d4'},['city','code'],['iran70caru','wlp-1969-tehran'],'Observed two-row pale/pink plate; diplomatic attribution comes only from collector metadata.','No verified mission identity is assigned to code 91.'),
 preset('full-city-commercial','Commercial · orange two-row','Full-city domestic','historical','Circa 1970 · catalogue attribution',1970,{serial:'18686',code:'12',vehicleClass:'commercial',bg:'#e97835'},['city','code'],['wlp-1970-commercial'],'Observed orange field, Persian serial above city and numeric extension.','Photograph date and legal introduction are not established.'),
 preset('old-government','Older government · serial only','Full-city domestic','historical','Undated · archive attribution',1972,{serial:'34027',vehicleClass:'government',bg:'#eee1ba'},[],['iran72govtu'],'Five digits only; class attributed by collector.','Filename is not a verified date. No invented city legend.'),
 preset('consular-1960s','Consular corps · 1960s specimen','Earlier official','consular-old','1960s · catalogue attribution',1960,{serial:'1',vehicleClass:'service',bg:'#efebc4'},[],['wlp-1960s-consular'],'Observed single digit at right and joined consular legend at left.','Decade from collector; exact issue interval and serial allocation unresolved.'),
 ...(['commercial','government'] as const).map(c=>preset(`city-band-${c}`,`City-band · ${c}`,'City-band domestic','city-band','1993–2003 attribution; 1998 also cited',1993,{serial:c==='commercial'?'497':'245',prefix:c==='commercial'?'19':'16',letter:c==='commercial'?'ط':'ب',vehicleClass:c,bg:'#fafaf6',strip:c==='commercial'?'#ed9b26':'#6dc0d6'},['prefix','letter','city'],[c==='commercial'?'iran98trucku':'wlp-1993-government'],'Observed city header over 2 + letter + 3 serial.','Olav/WLP label 1993; DNA labels 1998. Replacement was phased and old plates persisted into 2004.','disputed')),
 preset('city-band-commercial-wlp','City-band · WLP commercial specimen','City-band domestic','city-band','1993 series · commercial / public / temporary attribution',1993,{serial:'161',prefix:'15',letter:'ط',vehicleClass:'commercial',bg:'#fafaf6',strip:'#df773b'},['prefix','letter','city'],['ir-wlp-1993-commercial'],'Separate photographed city-band lettering master; it is not the same glyph set as the DNA Tehran truck specimen.','Collector class attribution and source date do not establish exact manufacture or all permitted registrations.'),
 preset('city-band-header-code','City-band · city and extension header','City-band domestic','city-band','1993 series · catalogue attribution',1993,{serial:'774',prefix:'14',letter:'ل',code:'14',vehicleClass:'private',strip:'#eda922'},['prefix','letter','city','code'],['wlp-1993'],'Observed numeric extension alongside city in coloured header.','Do not conflate header extension with the modern right-hand allocation code.'),
 ...IRAN_CUSTOM_CLASSES.filter(c=>['private','accessible','taxi','public','agricultural','government','police','irgc','army','defence','staff','diplomatic','service'].includes(c.id)).map(c=>{
 const year=c.id==='police'?2012:['irgc','army','defence','staff','diplomatic','service'].includes(c.id)?2016:2003;
 return {...preset(`national-${c.id}`,`National · ${c.label}`,'National long plates','national',year===2003?'2003 catalogue; operational Feb–Mar 2004 onward':`${year} reported introduction onward`,year,{vehicleClass:c.id,bg:c.bg,ink:c.ink,letter:'letter' in c?c.letter:'ب',serial:['diplomatic','service'].includes(c.id)?'214':'345'},['prefix','letter','code','vehicleClass','nationalVariant'],[`wiki-${c.id}`,...(c.id==='public'?['iran05trucku','wlp-2003-public']:c.id==='private'?['wlp-2003']:[])],'Current class layout supported by secondary diagram; candidate glyphs and palette.','2003 is a catalogue label. Radio Farda, 26 April 2004, reports rollout since Esfand 1382 and 52 × 11 cm. Police: 30 September 2012, military: 30 May 2016, diplomatic: unveiling 6 March 2016; operation planned April–May 2016 are separately reported class milestones.','illustrated'),sources:[WIKI,RF,WLP]};
 }),
 preset('protocol','Protocol · joined legend','National special layouts','protocol','Current family · introduction unresolved',2004,{serial:'1234',vehicleClass:'protocol',bg:'#ed1c24',ink:'#ffffff'},[],['wiki-protocol'],'Illustrated separate protocol legend and four-digit arrangement.','No verified introduction date; sort position is a grouping device, not a claimed first issue.','illustrated'),
 preset('motorcycle','Motorcycle · three over five','National special layouts','motorcycle','Current family · introduction unresolved',2004,{serial:'12345',code:'111'},['code'],['wiki-motorcycle'],'Illustrated three-digit allocation above five-digit serial.','Drawing dimensions are illustrative; year of introduction not established.','illustrated'),
 preset('temporary','Temporary passage · expiry panel','National special layouts','temporary','Current family · introduction unresolved',2004,{serial:'365',prefix:'12',letter:'گ',vehicleClass:'temporary'},['prefix','code','expiry'],['wiki-temporary'],'Distinct temporary arrangement with expiry field, not a standard provincial allocation.','Expiry is explicitly Solar Hijri year/month; no legal validity is implied.','illustrated'),
 preset('temporary-old','Temporary passage · earlier format','Earlier official','temporary-old','Earlier format · dates unresolved',1990,{serial:'1234',prefix:'5',year:'1392',vehicleClass:'temporary'},['prefix','year'],['wiki-temporary-old'],'Earlier temporary source layout is retained separately.','Only the source drawing establishes arrangement; issue boundaries unresolved.','illustrated'),
 preset('diplomatic-old','Political / services · earlier format','Earlier official','diplomatic-old','Before 6 March 2016 · start unresolved',1990,{serial:'345',prefix:'12',vehicleClass:'diplomatic'},['prefix'],['wiki-diplomatic-old'],'Earlier political/services layout; no modern D/S mission code projected backward.','Start date unresolved;2016 is the reported succeeding format change.','illustrated'),
 preset('service-old','Services · earlier format','Earlier official','diplomatic-old','Before 6 March 2016 · start unresolved',1990,{serial:'345',prefix:'12',vehicleClass:'service'},['prefix'],['wiki-service-old'],'Observed compact white plate: three figures above prefix and joined service label.','Start date unresolved; 2016 is the reported succeeding format change.','illustrated'),
 preset('historic-vehicle','Historic vehicle · Bagh-e Melli','National special layouts','historic-vehicle','Current family · introduction unresolved',2010,{serial:'12345',vehicleClass:'historic',bg:'#643200',ink:'#ffffff'},[],['wiki-historic'],'Historic-vehicle class is a modern plate for older cars, not a historical issue.','American-proportion format; building emblem reconstructed from source art, not a certified master.','illustrated'),
 ...IRAN_CUSTOM_ZONES.map(z=>preset(`free-zone-old-${z.id}`,`${z.label} · local free-zone design`,'Legacy free-zone designs','free-zone-old','Local generation · before2017 redesign; boundaries unresolved',2010,{serial:'12713',zone:z.id},['zone'],[`wiki-free-zone-${z.id}`,...(z.id==='qeshm'?['wlp-qeshm-2010']:[])],'Distinct local badge and bilingual-number composition; logo is a source-guided illustration.','Circa 2010 applies only to the WLP Qeshm specimen, not all seven zones.','illustrated')),
 preset('public-2002','Public transport · AA bilingual','Parallel bilingual transport','bilingual-2002','2002–2003 · catalogue attribution',2002,{serial:'19916',prefix:'111',letter:'AA',vehicleClass:'public',bg:'#fafaf6',strip:'#e6a029'},['prefix','letter'],['wlp-public-2002'],'Observed Persian upper row / Latin lower row, separate left code blocks.','Public transport plate; not a foreign-travel plate.'),
 preset('international-teh','Foreign travel · TEH','Foreign-travel additional plates','international','1969–1998 · additional plate',1969,{serial:'4470',letter:'TEH',fontProfile:'latin-candidate'},['letter'],['wlp-travel-teh'],'Additional Latin plate used alongside domestic registration.','Collector period; colour differences do not prove a different issue generation.'),
 preset('international-teh-green','Foreign travel · green TEH','Foreign-travel additional plates','international','1969–1998 · additional plate',1969,{serial:'32312',letter:'TEH',fontProfile:'latin-candidate',ink:'#328343'},['letter'],['wlp-travel-teh-green'],'Green Latin lettering specimen, same additional-plate system.','Not inferred to be an official vehicle class.'),
 preset('international-thr','Foreign travel · THR','Foreign-travel additional plates','international','1998–2005 · additional plate',1998,{serial:'77706',letter:'THR',fontProfile:'latin-candidate',bg:'#edb844'},['letter'],['wlp-travel-thr'],'Observed black Latin lettering on yellow additional plate.','Domestic and foreign-travel systems run in parallel.'),
 preset('international-2010','Foreign travel · blue perimeter','Foreign-travel additional plates','international','Circa 2010 · catalogue attribution',2010,{serial:'743',prefix:'34',letter:'E',code:'10',fontProfile:'latin-candidate'},['prefix','letter','code'],['wlp-travel-2010'],'Observed Latin serial with red class box and blue perimeter/footer.','Small club legend uses licensed candidate text; no security hologram reproduced.'),
 preset('un-observer','UNIIMOG · observer group','Foreign forces / observers','observer','1988–1991 · UN mission period',1988,{serial:'55',letter:'UNIIMOG',vehicleClass:'observer',fontProfile:'latin-candidate'},['letter'],['wlp-uniimog'],'Observed two-line Latin mission label and numeric serial.','Mission period is not an exact manufacture date.'),
 preset('us-military','U.S. military · Persian serial','Foreign forces / observers','military-old','1950s–1979 · catalogue attribution',1950,{serial:'806',vehicleClass:'military',strip:'#dca02a'},[],['wlp-us-military'],'Observed broad orange rim, pale centre and Persian serial.','Specific starting year and full character set unverified.'),
 preset('us-topographical','U.S. topographical training team','Foreign forces / observers','military-old','1963–1971 · catalogue attribution',1963,{serial:'30784',vehicleClass:'military',bg:'#ddcb38'},[],['wlp-us-topographical'],'Observed yellow plate with joined team legend and Persian serial.','Historical label reconstructed as a complete wordmark, not arbitrary isolated characters.'),
];
export const IRAN_CUSTOM_PRESET_ALIASES: Record<string,string>={'free-zone-study':'free-zone-old-qeshm'};
// Source-specific specimen masters retain observed forms; completed numerals are
// explicitly inferred. Strict still blocks genuinely missing outlines.
const specimenFonts:Record<string,string>={
 'historical-1326':'historic-1947-study','historical-1328':'historic-1949-study',
 'historical-1333-commercial':'historic-1954-study','historical-1335':'historic-1956-study',
 'historical-1339':'historic-1960-study','historical-1340':'historic-1961-study','historical-1342':'historic-1963-study',
 'full-city-1964':'historic-1964-city-study','full-city-gilan':'historic-1969-rasht-study',
 'full-city-numeric':'historic-1969-tehran-study','full-city-letter':'historic-fullcity-letter-study',
 'full-city-commercial':'historic-1970-commercial-study','old-government':'historic-old-government-study',
 'city-band-header-code':'historic-1993-private-study','city-band-commercial-wlp':'historic-1993-commercial-study',
 'city-band-government':'historic-1993-government-study','city-band-commercial':'historic-cityband-truck-study',
 'consular-1960s':'historic-1960s-consular-study',
 'international-teh':'wlp-teh-black-study','international-teh-green':'wlp-teh-green-study','international-thr':'wlp-thr-travel-study',
 'international-2010':'wlp-touring-2010-study','un-observer':'wlp-uniimog-study','us-military':'wlp-us-military-study','us-topographical':'wlp-us-topographical-study',
 'diplomatic-old':'source-previous-diplomatic-numerals','service-old':'source-previous-service-numerals',
 'temporary-old':'source-previous-temporary-numerals','motorcycle':'source-motorcycle-numerals',
 'historic-vehicle':'source-historic-numerals','protocol':'source-protocol-numerals','temporary':'source-national-temporary-numerals',
 ...Object.fromEntries(IRAN_CUSTOM_CLASSES.filter(c=>['private','accessible','taxi','public','agricultural','government','police','irgc','army','defence','staff','diplomatic','service'].includes(c.id)).map(c=>[`national-${c.id}`,['private','accessible','taxi','public','agricultural','government'].includes(c.id)?'source-national-private-numerals':'source-national-numerals'])),
};
for(const [id,fontProfile] of Object.entries(specimenFonts)){
 const p=IRAN_CUSTOM_PRESETS.find(x=>x.id===id)!;p.defaults.fontProfile=fontProfile;p.defaults.missingPolicy='strict';
 p.notes.push('Source-specific observed numeral, small-role and whole-word forms. Missing numeral shapes are completed as explicitly labelled inferences; they are not newly observed source evidence. Strict blocks characters still absent from the selected profile.');
}
// Default examples follow the inspected illustrations; generated values remain format-bounded.
for(const id of ['national-police','national-irgc','national-army','national-defence','national-staff','national-diplomatic','national-service'])IRAN_CUSTOM_PRESETS.find(p=>p.id===id)!.defaults.serial='365';
IRAN_CUSTOM_PRESETS.find(p=>p.id==='temporary')!.defaults.serial='345';
Object.assign(IRAN_CUSTOM_PRESETS.find(p=>p.id==='motorcycle')!.defaults,{code:'123',serial:'56789'});
for(const id of ['free-zone-old-qeshm','free-zone-old-chabahar'])IRAN_CUSTOM_PRESETS.find(p=>p.id===id)!.defaults.serial='12365';
for(const p of IRAN_CUSTOM_PRESETS.filter(p=>p.kind==='free-zone-old')){p.defaults.fontProfile='source-freezone-persian-numerals';p.defaults.serial=p.id==='free-zone-old-maku'?'11111':'12365';}
// Specimen-spaced numeral rows. These are plate-layout tracking values, not claimed factory advances.
IRAN_CUSTOM_PRESETS.find(p=>p.id==='historical-1333-commercial')!.defaults.tracking=48;
IRAN_CUSTOM_PRESETS.find(p=>p.id==='us-military')!.defaults.tracking=35;
IRAN_CUSTOM_PRESETS.find(p=>p.id==='public-2002')!.defaults.fontProfile='source-bilingual-2002-persian';
IRAN_CUSTOM_PRESETS.find(p=>p.id==='public-2002')!.defaults.tracking=0;
// Attach exact artwork references to presets, rather than silently omitting same-family specimens.
for (const p of IRAN_CUSTOM_PRESETS) {
 p.sourceArtworks = IRAN_EVIDENCE_RECORDS.filter(r=>r.presetId===p.id).map(r=>r.id);
 const sources=IRAN_EVIDENCE_RECORDS.filter(r=>r.presetId===p.id);
 p.sources=[...new Map([...p.sources,...sources.map(r=>({label:r.label,url:r.imageUrl||r.sourceUrl}))].map(s=>[s.url,s])).values()];
}
export const IRAN_CUSTOM_SOURCE_COVERAGE: IranSourceCoverage[] = IRAN_EVIDENCE_RECORDS.map(r=>({...r}));
IRAN_CUSTOM_SOURCE_COVERAGE.push({id:'earliest-registration',label:'Earliest registration claims · 1920s',presetId:null,status:'evidence barrier',note:'No authenticated physical specimen or geometry in the bounded source set. No invented 1920s template; earliest dated inspected specimen is 1326 SH (1947/48).',sourceUrl:'https://dna.nl/iran.htm'});
export const IRAN_CUSTOM_COVERAGE_COUNTS={requestedImages:52,excludedFakes:1,priorPhotographs:11,supportingTextOnly:3,earlyEvidenceBarriers:1};
