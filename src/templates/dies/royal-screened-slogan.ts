import type {DieProfile} from './engine';
import glyphs from './royal-screened-slogan.json';

/** Fixed Times-compatible screened slogan, using uniform native outline proportions. */
export const ROYAL_SCREENED_SLOGAN_PROFILE: DieProfile = {
  id: 'bc-royal-screened-slogan', label: 'Royal motorcade · high-contrast screened slogan',
  maker: 'TeX Gyre Termes Regular · visual substitute',
  params: {width: 60, stroke: 0, curve: 'oval', tracking: 0},
  overrides: glyphs, allowConstructedFallback: false,
  evidence: {status: 'legend-approximation', specimens: [
    {title: 'BCpl8s · ROYAL 18', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL18(XL).jpg'},
    {title: 'BCpl8s · ROYAL 1', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/ROYAL1(XL).jpg'},
  ], notes: 'The photographed Beautiful British Columbia uses a narrow, high-contrast serif compatible with Times proportions, rather than the wider Georgia substitute. TeX Gyre Termes Regular supplies a close visual substitute with native filled glyph proportions; historical typeface identity is unconfirmed. Only the fixed slogan characters are present. Whole-line spacing and cap height were checked against both photographed plates. Copyright 2007–2018 B. Jackowski, J.M. Nowacki et al.; GUST Font License. No font software bundled.'},
};
