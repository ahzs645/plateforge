import type { DieProfile } from './engine';
import nativeOutlines from './decal-late-printing.json';

/** Candidates for the separately observed 2008 and late two-digit printing. */
export const DECAL_LATE_PRINTING_PROFILES: DieProfile[] = [
  {
    id: 'bc-decal-print-bebasneue-400',
    label: 'Decal print · native Bebas Neue candidate',
    params: {width:60,stroke:0,curve:'oval',tracking:0},
    overrides:nativeOutlines['bebasneue-400'],
    allowConstructedFallback:false,allowResearchReplacement:false,
    evidence:{status:'legend-approximation',specimens:[{title:'2008 AUG passenger decal',url:'https://www.bcpl8s.ca/images/Decals/Passenger/2008.jpg'}],
      notes:'Native Bebas Neue Regular outlines, unchanged from the archived open-font comparison candidate. The 2008 AUG photograph supports a lighter print, more open counters, rounded U, and G without a projecting spur. Candidate proportions are substantially closer than the compressed heavy profile; A aperture and terminal details remain approximate. Only AUG has been compared; other letters are native unverified coverage. Historical font identity unconfirmed. Font source/hash and equal-height evidence are in docs/research/bc-late-two-digit-printing.'},
  },
  {
    id: 'bc-decal-print-oswald-400',
    label: 'Decal print · native Oswald Regular candidate',
    params: {width:60,stroke:0,curve:'oval',tracking:0},
    overrides:nativeOutlines['oswald-400'],
    allowConstructedFallback:false,allowResearchReplacement:false,
    evidence:{status:'legend-approximation',specimens:[{title:'2008 year 08',url:'https://www.bcpl8s.ca/images/Decals/Passenger/2008.jpg'}],
      notes:'Native Oswald at weight400, unchanged from the archived candidate. The clean source year ROI excludes adjacent COLUMBIA ink. The lighter stroke and open 0/8 counters improve the previous heavy compressed year. The source0 has a more continuously oval outer bowl; this native candidate remains an approximation. Only 0/8 were compared for this assignment. Historical font identity unconfirmed. See docs/research/bc-late-two-digit-printing.'},
  },
  {
    id:'bc-decal-print-late-oct-reconstruction',
    label:'2013 OCT decal · observed narrow construction',
    params:{width:37,stroke:0,curve:'oval',tracking:0},
    overrides:{
      O:{advance:40.5,fill:true,paths:['M18.75 0 C32 0 37.5 15 37.5 50 C37.5 85 32 100 18.75 100 C5.5 100 0 85 0 50 C0 15 5.5 0 18.75 0 Z M18.75 17 C14 17 13.5 29 13.5 50 C13.5 71 14 83 18.75 83 C23.5 83 24 71 24 50 C24 29 23.5 17 18.75 17 Z']},
      C:{advance:37,fill:true,paths:['M35.5 34 H22 V27 C22 19 21 15 18 15 C14.5 15 13.5 24 13.5 50 C13.5 76 14.5 85 18 85 C21 85 22 80 22 72 V58 H35.5 V74 C35.5 92 29 100 18 100 C5 100 0 86 0 50 C0 15 5 0 18 0 C30 0 35.5 10 35.5 29 Z']},
      T:{advance:37,fill:true,paths:['M0 0 H34.5 V22 H24 V100 H10.25 V22 H0 Z']},
    },
    allowConstructedFallback:false,allowResearchReplacement:false,
    evidence:{status:'legend-approximation',specimens:[{title:'2013 OCT passenger decal',url:'https://www.bcpl8s.ca/images/Decals/Passenger/2013.jpg'}],
      notes:'Independent O/C/T constructions from the clean 59-pixel-high source. Preserves observed narrow outer widths, O counter, C opening and T stem; no font x scaling. Only the exact 2013 OCT selection is supported. Other months must retain their prior profile. Fine curves remain uncertain at this source resolution; no historical font identity claimed. See docs/research/bc-late-two-digit-printing.'},
  },
];
