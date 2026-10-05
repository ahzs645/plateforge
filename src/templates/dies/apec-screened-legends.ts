import type {DieProfile} from './engine';
import glyphs from './apec-screened-legends.json';

/** Fixed motorcade inscriptions, retaining the round geometric sans proportions. */
export const APEC_SCREENED_LEGENDS_PROFILE: DieProfile = {
  id: 'bc-apec-screened-legends', label: 'APEC 1997 · geometric screened legends',
  maker: 'TeX Gyre Adventor Regular · visual substitute',
  params: {width: 70, stroke: 0, curve: 'oval', tracking: 0},
  overrides: glyphs, allowConstructedFallback: false,
  evidence: {status: 'legend-approximation', specimens: [
    {title: 'BCpl8s · ICBC 100', url: 'https://www.bcpl8s.ca/images/APEC/ICBC-100.jpg'},
    {title: 'BCpl8s · ICBC 121', url: 'https://www.bcpl8s.ca/images/APEC/ICBC-121(XL).jpg'},
  ], notes: 'Outlined TeX Gyre Adventor Regular provides a close geometric sans visual substitute: single-storey a, circular o and C, broad V, and uncondensed mixed-case text. Checked as whole lines against two motorcade photographs; historical typeface identity is unconfirmed. Only characters needed by the four fixed inscriptions are defined. Native advances and one uniform cap scale are retained. Copyright 2007–2018 B. Jackowski, J.M. Nowacki et al.; GUST Font License. No font software is bundled.'},
};
