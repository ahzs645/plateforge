import type { DieProfile } from './engine';
import outlines from './decal-modern-printing.json';

/** Printing reconstructions are independent of stamped plate serial dies. */
export const DECAL_MODERN_PRINTING_PROFILES: DieProfile[] = [
  {
    id: 'bc-decal-print-modern-year-reconstruction',
    label: 'Modern decal year · specimen numeral construction',
    params: { width: 44, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: outlines['modern-year-reconstruction'],
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '2015 JAN renewal decal · 70118033', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2015-70118033(XL).jpg' },
        { title: '2017 NOV renewal decal · 91115136', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2017-91115136(XL).jpg' },
      ],
      notes: 'Clean independent vector constructions at authored widths, not a horizontally compressed font. Numerals 0/1/2 are supported by two enlarged photographs; 5 and 7 by one each. Numerals 3/4/6/8/9 are lower-confidence constructions checked against small catalogue photographs; 9 uses the related 6 bowl construction. No historical font or manufacturer identification. Authored advances and uncertainty are recorded in docs/research/bc-modern-numerals/README.md and provenance.json.',
    },
  },
  {
    id: 'bc-decal-print-modern-control-reconstruction',
    label: 'Modern decal control · native narrow numerals, reconstructed 1',
    params: { width: 60, stroke: 0, curve: 'oval', tracking: 0 },
    overrides: outlines['modern-control-reconstruction'],
    allowConstructedFallback: false, allowResearchReplacement: false,
    evidence: {
      status: 'legend-approximation',
      specimens: [
        { title: '2015 JAN control 70118033', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2015-70118033(XL).jpg' },
        { title: '2017 NOV control 91115136', url: 'https://www.bcpl8s.ca/images/Decals/Passenger/2017-91115136(XL).jpg' },
      ],
      notes: 'Native Nimbus Sans Narrow Bold 0/2/3/4/5/6/7/8/9 outlines and all native tabular advances, with a reconstructed diagonal-flag 1 supported by six occurrences in the enlarged 2015 and November 2017 photographs. No x-only scaling, synthetic stroke, or tracking fitted to a whole-run score. Printed counter and stem comparisons support this candidate; historical font identity is unconfirmed. See docs/research/bc-modern-numerals.',
    },
  },
];
