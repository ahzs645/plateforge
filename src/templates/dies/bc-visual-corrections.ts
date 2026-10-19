/** Separate photographed components; sharing a digital candidate does not identify tooling. */
import type {DieProfile} from './engine';
import fonts from './bc-correction-fonts.json';

const apec={title:'BCpl8s · APEC 149, enlarged',url:'https://www.bcpl8s.ca/images/APEC/Canada-149%28XL%29.jpg'};
export const BC_CORRECTION_PRINTING:DieProfile[]=Object.entries(fonts).map(([name,glyphs])=>({
  id:`bc-corrected-${name}`,label:`Source comparison · ${name}`,
  params:{width:65,stroke:0,curve:'oval',tracking:0},overrides:glyphs,
  allowResearchReplacement:false,allowConstructedFallback:false,
  evidence:{status:'legend-approximation',specimens:[name.startsWith('carrier')?{title:'BCpl8s · Passenger carrier 2005',url:'https://www.bcpl8s.ca/PassengerCarrier.htm'}:name==='collector-multi'?{title:'BCpl8s · Collector multi-vehicle',url:'https://www.bcpl8s.ca/Collector.htm'}:apec],notes:'Native open URW font outlines for an independently identified printed component. Source hashes, roles and notices are in docs/research/bc-visual-corrections. No historical font/tooling identity is asserted.'},
}));

export const APEC_MOTORCADE_SERIAL:DieProfile={
  id:'bc-apec-motorcade-serial',label:'APEC motorcade · narrow embossed figures',
  params:{width:50,stroke:9,curve:'oval',tracking:22,one:'flag',two:'curved',three:'round',four:'open',seven:'straight'},
  overrides:{
    '1':{advance:23,fill:true,paths:['M15 0 H23 V100 H14 V19 L4 23 Q0 24 0 20 V13 Q0 10 4 9 L10 6 Q14 4 15 0 Z']},
    '2':{advance:52,fill:true,paths:['M1 21 C3 7 13 0 27 0 C43 0 52 9 52 24 C52 38 44 47 33 59 C19 74 12 84 11 91 H52 V100 H0 V90 C1 75 13 60 26 47 C37 36 42 30 42 23 C42 14 37 9 27 9 C18 9 12 14 10 23 Z']},
  },allowResearchReplacement:false,
  evidence:{status:'research-candidate',specimens:[{title:'BCpl8s · APEC 121',url:'https://www.bcpl8s.ca/images/APEC/ICBC-121(XL).jpg'}],notes:'Observed 1/2 reconstructed as narrow rounded paint bodies, with separate large inter-figure spaces. Other digits remain constructed. This is independent of the military number and ordinary passenger dies.'},
};
const federalBase=fonts['federal-serial'];
export const APEC_MILITARY_SERIAL:DieProfile={
  id:'ca-apec-military-serial',label:'Canada APEC · bold military figures',
  params:{width:60,stroke:0,curve:'oval',tracking:15},
  overrides:{...federalBase,
    '1':{advance:33,fill:true,paths:['M0 6 C10 5 16 3 21 0 H32 V100 H14 V20 H0 Z']},
    '4':{advance:65,fill:true,paths:['M38 0 H55 V72 H64 V85 H55 V100 H38 V85 H0 V70 Z M38 27 L14 72 H38 Z']},
    '9':{advance:62,fill:true,paths:['M29 0 C10 0 0 12 0 31 C0 50 10 62 28 62 C34 62 39 60 43 56 C37 72 25 85 12 94 L22 100 C49 84 61 59 61 31 C61 11 49 0 29 0 Z M29 14 C39 14 44 20 44 31 C44 42 39 48 29 48 C19 48 16 42 16 31 C16 20 20 14 29 14 Z']},
  },allowConstructedFallback:false,allowResearchReplacement:false,
  evidence:{status:'research-candidate',specimens:[apec,{title:'BCpl8s · APEC 180',url:'https://www.bcpl8s.ca/images/APEC/Canada-180.jpg'},{title:'BCpl8s · APEC 134',url:'https://www.bcpl8s.ca/images/APEC/Canada-134.jpg'}],notes:'Observed 1/4/9 are source-guided filled constructions from 149; remaining figures use a native Nimbus Sans Narrow Bold visual candidate checked against the smaller 180/134 photos. Not a recovered federal alphabet. National jurisdiction remains CA.'},
};

export const PG_BICYCLE_PROFILES:DieProfile[]=[
  {id:'bc-pg-bicycle-legend',label:'Prince George bicycle · narrow outer lettering',params:{width:61,stroke:13,curve:'box',boxRadius:17,tracking:11,narrow:.45,wide:1.15},allowResearchReplacement:false,
    evidence:{status:'legend-approximation',specimens:[{title:'Prince George bicycle 1953',url:'https://www.bcpl8s.ca/images/Bicycle/PrinceGeorge/1953-580.jpg'}],notes:'Narrow rounded outer PR.GEORGE/BICYCLE components, separate from the broad square centre numerals. Geometric reconstruction; not a shared municipal vehicle die claim.'}},
  {id:'bc-pg-bicycle-centre',label:'Prince George bicycle · square centre numerals',params:{width:72,stroke:16,curve:'box',boxRadius:12,tracking:9,one:'flag-base',three:'round',four:'closed',narrow:.72},allowResearchReplacement:false,
    evidence:{status:'legend-approximation',specimens:[{title:'Prince George bicycle 1959, visible 36',url:'https://www.bcpl8s.ca/images/Bicycle/PrinceGeorge/1959-86.jpg'}],notes:'Broader square-bowled serial/date figures with a serifed 1. Separate geometry from outer legends; paint spread and worn shoulders are excluded.'}},
];
