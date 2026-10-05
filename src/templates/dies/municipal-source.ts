/** Component-specific municipal lettering; dates are specimen labels, not tooling chronology. */
import type { DieProfile } from './engine';
import { registerDieProfile } from './profiles';
import glyphs from './municipal-frankfurter.json';
import pgGeometry from './municipal-prince-george-glyphs.json';
const pg = {title: 'BCpl8s · Prince George 1959 · 15', url: 'https://www.bcpl8s.ca/images/Municipal/Prince%20George/1959-15(XL).jpg'};
const van = {title: 'BCpl8s · Vancouver blank centennial base', url: 'https://www.bcpl8s.ca/images/Municipal/Vancouver/1986-BLANK(XL).jpg'};
export const MUNICIPAL_FRANKFURTER: DieProfile = {id: 'municipal-vancouver-frankfurter', label: 'Vancouver screened words · Frankfurter Std Medium', maker: 'International Typeface Corporation', params: {width:85,stroke:0,curve:'oval',tracking:0}, overrides:glyphs,allowConstructedFallback:false,allowResearchReplacement:false,evidence:{status:'legend-approximation',specimens:[van,{title:'BCpl8s · Vancouver taxi 1996 · 1071',url:'https://www.bcpl8s.ca/images/Municipal/Vancouver/1996-1071(XL).jpg'}],notes:'Fixed screened words use official Frankfurter Std Medium preview outlines, the same digital family as the EXPO86 reconstruction. Native advances and proportions retained. Historical font identity unconfirmed; embossed municipal serials use separate tooling. Font software is not bundled. International Typeface Corporation. All rights reserved.'}};
const pgUpper = Object.fromEntries(Object.entries(pgGeometry.upper).map(([char,g])=>[char,{...g,cap:'round' as const}]));
const pgLower = Object.fromEntries(Object.entries(pgGeometry.lower).map(([char,g])=>[char,{...g,cap:'round' as const}]));
export const PG_WIDE: DieProfile = {id:'municipal-prince-george-wide',label:'Prince George 1959 · broad upper legends',params:{width:95,stroke:22,curve:'box',boxRadius:18,tracking:8,narrow:.3,wide:1.1},overrides:pgUpper,allowResearchReplacement:false,evidence:{status:'legend-approximation',specimens:[pg],notes:'Geometric reconstruction of the broad rounded rectangular PRINCE / GEORGE lettering. Paint wear and raised shoulders excluded; no manufacturer or shared physical tooling established.'}};
export const PG_TALL: DieProfile = {id:'municipal-prince-george-tall',label:'Prince George 1959 · tall VEHICLE',params:{width:54,stroke:18,curve:'stadium',tracking:8,narrow:.32,wide:1.1},overrides:pgLower,allowResearchReplacement:false,evidence:{status:'legend-approximation',specimens:[pg],notes:'Separate taller narrow VEHICLE construction; not a claim that the upper and lower words were punched with one die size.'}};
export const PG_DIGITS: DieProfile = {id:'municipal-prince-george-digits',label:'Prince George 1959 · rounded serif date and serial',params:{width:64,stroke:20,curve:'oval',tracking:15,one:'flag'},overrides:{
 '1':{advance:53,cap:'round',paths:['M8 12 Q23 11 26 0 V100 M7 100 H47']},
 '5':{advance:68,cap:'round',paths:['M60 0 H8 V48 C23 38 59 34 59 67 C59 110 1 113 2 82']},
 '9':{advance:68,cap:'round',paths:['M58 31 C58 -11 4 -11 4 31 C4 71 58 71 58 31 C58 69 44 100 11 100']},
},allowResearchReplacement:false,evidence:{status:'legend-approximation',specimens:[pg],notes:'Observed1/5/9 reconstructed as consistent rounded strokes and broad serif1. Other generated serial digits remain geometric candidates; this single specimen does not certify the entire numeral set.'}};
export const VANCOUVER_SERIAL: DieProfile = {id:'municipal-vancouver-embossed',label:'Vancouver centennial base · embossed serial',params:{width:60,stroke:17,curve:'box',boxRadius:17,tracking:27,one:'flag',seven:'curved',narrow:.65},overrides:{
 '1':{advance:63,cap:'round',paths:['M12 4 H33 V89 Q33 100 54 100 M4 100 H58']},
 '7':{advance:65,cap:'round',paths:['M2 0 H60 Q64 0 56 13 Q33 45 23 100']},
},allowResearchReplacement:false,evidence:{status:'legend-approximation',specimens:[{title:'BCpl8s · Vancouver taxi 1996 ·1071',url:'https://www.bcpl8s.ca/images/Municipal/Vancouver/1996-1071(XL).jpg'}],notes:'Embossed1071 has slab-footed1, rounded rectangular0 and curved7; it differs from the screened Frankfurter inscriptions. Observed1/7 are geometric reconstructions; unobserved digits remain construction candidates. Maker and exact tooling unconfirmed.'}};
registerDieProfile(MUNICIPAL_FRANKFURTER,PG_WIDE,PG_TALL,PG_DIGITS,VANCOUVER_SERIAL);
