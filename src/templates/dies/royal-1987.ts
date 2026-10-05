import type {DieProfile} from './engine';

/** One coherent construction for the Royal motorcade lettering, rather than mixed photo traces. */
export const ROYAL_1987_PROFILE: DieProfile = {
  id: 'bc-royal-1987', label: 'Astrographic · 1987 Royal motorcade reconstruction', maker: 'Astrographic',
  params: {width: 45, stroke: 11.5, curve: 'box', boxRadius: 15, tracking: 14,
    one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight',
    nine: 'curved', narrow: 0.6, wide: 1.2, a: 'flat'},
  overrides: {
    '1': {advance: 27, paths: ['M5.75 20 L17 5.75 V94.25']},
    L: {advance: 45, paths: ['M5.75 5.75 V94.25 H39.25 V85.5']},
    Y: {advance: 45, paths: ['M5.75 5.75 C11 27 18 43 22.5 61 C27 43 34 27 39.25 5.75', 'M22.5 61 V94.25']},
  },
  evidence: {status: 'category', specimens: [
    {title: 'BCpl8s · ROYAL 1', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL1(XL).jpg'},
    {title: 'BCpl8s · ROYAL 18', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL18(XL).jpg'},
    {title: 'BCpl8s · Royal visits and Astrographic manufacture', url: 'https://www.bcpl8s.ca/Royal.html'},
  ], notes: 'Narrow rounded rectangular O, flat-topped A with a lower bar, curved Y junction, raised L toe and flagged 1 checked against both photographed motorcade plates. Shared stroke construction; no photographed wear or embossed shoulder is traced. The remaining digits are consistent constructions for the documented 1–20 range, not independently confirmed dies.'},
};
