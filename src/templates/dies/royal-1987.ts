import type {DieProfile} from './engine';

/** Smooth paint-body construction: embossed shoulders and local wear are excluded. */
export const ROYAL_1987_PROFILE: DieProfile = {
  id: 'bc-royal-1987', label: 'Astrographic · 1987 Royal motorcade reconstruction', maker: 'Astrographic',
  params: {width: 45, stroke: 9.5, curve: 'box', boxRadius: 21, tracking: 12,
    one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight',
    nine: 'curved', narrow: 0.62, wide: 1.2, a: 'flat'},
  overrides: {
    R: {advance: 47, fill: true, paths: [
      'M3 0 H23 C36 0 43 9 43 25 V36 C43 45 40 50 35 53 L47 100 H36 L24 57 H11 V100 H0 V3 Q0 0 3 0 Z M11 11 V45 H22 C30 45 33 41 33 34 V25 C33 17 30 11 23 11 Z',
    ]},
    O: {advance: 44, fill: true, paths: [
      'M22 0 C8 0 0 9 0 23 V77 C0 91 8 100 22 100 C36 100 44 91 44 77 V23 C44 9 36 0 22 0 Z M22 10 C30 10 34 15 34 23 V77 C34 85 30 90 22 90 C14 90 10 85 10 77 V23 C10 15 14 10 22 10 Z',
    ]},
    Y: {advance: 47, fill: true, paths: [
      'M0 0 H10 L23 39 Q24 43 25 39 L37 0 H47 L31 55 Q30 61 30 66 V100 H17 V66 Q17 61 16 56 Z',
    ]},
    A: {advance: 52, fill: true, paths: [
      'M17 0 H35 L52 100 H40 L38 86 Q37 81 32 81 H20 Q15 81 14 86 L12 100 H0 Z M26 27 C23 27 21 31 20.5 36 L17 63 Q16.5 69 22 69 H30 Q35.5 69 35 63 L31.5 36 C31 31 29 27 26 27 Z',
    ]},
    L: {advance: 46, fill: true, paths: [
      'M0 0 H10 V83 Q10 89 16 89 H33 Q36 89 36 85 V80 H46 V100 H0 Z',
    ]},
    '1': {advance: 28, fill: true, paths: [
      'M18 0 H28 V100 H16 V20 L5 25 Q1 27 1 22 V13 Q1 10 5 9 L11 7 Q16 5 18 0 Z',
    ]},
    '8': {advance: 47, fill: true, paths: [
      'M23.5 1 C9 1 1 11 1 24 C1 34 4 42 10 49 C3 54 0 61 0 72 C0 89 8 98 23.5 98 C39 98 47 89 47 72 C47 61 44 54 37 49 C43 42 46 34 46 24 C46 11 38 1 23.5 1 Z M23.5 12 C32 12 36 18 36 26 C36 36 32 44 23.5 44 C15 44 11 36 11 26 C11 18 15 12 23.5 12 Z M23.5 55 C33 55 37 62 37 73 C37 83 33 89 23.5 89 C14 89 10 83 10 73 C10 62 14 55 23.5 55 Z',
    ]},
  },
  evidence: {status: 'research-candidate', specimens: [
    {title: 'BCpl8s · ROYAL 1', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL1(XL).jpg'},
    {title: 'BCpl8s · ROYAL 18', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL18(XL).jpg'},
    {title: 'BCpl8s · Royal visits and Astrographic manufacture', url: 'https://www.bcpl8s.ca/Royal.html'},
  ], notes: 'Observed R, O, Y, A, L and 1 cross-checked in ROYAL 1 and ROYAL 18; 8 is observed only in ROYAL 18. Smooth intended paint-body contours retain the narrow rounded-rectangular O, broad flat A top with a rounded triangular counter and large lower opening, curved Y junction, raised L toe and flagged 1. Approximate 9–12 cap-unit weight replaces the heavier generic skeleton; manufacturing paint spread, wear and embossed shoulders are excluded. Other digits remain coherent constructions for the documented 1–20 range and are not independently confirmed dies. Photographic overlap is a comparison, not proof of identical tooling.'},
};
