/** Fixed screened inscription outlined from the user-supplied Times BoldItalic. */
import type {DieProfile} from './engine';
import {registerDieProfile} from './profiles';
import glyphs from './commonwealth-times.json';
import cityGlyphs from './commonwealth-helvetica.json';

export const COMMONWEALTH_TIMES: DieProfile = {
  id: 'bc-commonwealth-times-bolditalic', label: 'Times Bold Italic · Commonwealth Games legend',
  params: {width: 70, stroke: 0, curve: 'oval', tracking: 0}, overrides: glyphs,
  allowConstructedFallback: false, allowResearchReplacement: false,
  evidence: {status: 'legend-approximation', specimens: [{title: 'BCpl8s · 1994 Royal Visit', url: 'https://www.bcpl8s.ca/Royal.html'}],
    notes: 'Fixed XV COMMONWEALTH GAMES wording outlined from the uploaded Times BoldItalic.ttf. Native curves, advances and italic angle retained; the entire inscription is fitted to the photographed header. Font software is not bundled. Historical production font version remains unconfirmed.'},
};
export const COMMONWEALTH_HELVETICA: DieProfile = {
  id: 'bc-commonwealth-helvetica-compressed', label: 'Helvetica Compressed Regular · Victoria decal',
  params: {width: 40, stroke: 0, curve: 'oval', tracking: 0}, overrides: cityGlyphs,
  allowConstructedFallback: false, allowResearchReplacement: false,
  evidence: {status: 'legend-approximation', specimens: [{title: 'BCpl8s · 1994 Royal Visit', url: 'https://www.bcpl8s.ca/Royal.html'}],
    notes: 'Fixed VICTORIA B.C. wording outlined from the uploaded Helvetica Compressed Regular.otf, with native curves and advances. Fitted as white screened lettering in the blue Games decal. Font software is not bundled. Historical production font version remains unconfirmed.'},
};
registerDieProfile(COMMONWEALTH_TIMES, COMMONWEALTH_HELVETICA);
