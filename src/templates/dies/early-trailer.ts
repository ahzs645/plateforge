import type {DieProfile} from './engine';
import {registerDieProfile} from './profiles';
import {skeletonGlyph} from './skeleton';

const specimens = ['1925-BC323', '1928-T118', '1931-T1159', '1936-T1941', '1937-T2458', '1939-T242', '1940-T772', '1948-TR510']
  .map(name => ({title: `BCpl8s · Trailer ${name}`, url: `https://www.bcpl8s.ca/images/Trailer/${name}(XL).jpg`}));
const evidence = {status: 'legend-approximation' as const, specimens,
  notes: 'Upright narrow rounded trailer lettering checked across photographed 1923–48 plates. BC is a separate large abbreviation, not the small passenger province legend. T/TR use a separate smaller stamp. Smooth shared-stroke reconstruction excludes embossed shoulders, rust and paint spread. Similar visible construction supports comparison, not confirmed identical physical tooling or a complete measured alphabet.'};

export const EARLY_TRAILER_BC: DieProfile = {
  id: 'bc-trailer-early-bc', label: 'Early trailer · upright BC abbreviation',
  params: {width: 39, stroke: 12, curve: 'box', boxRadius: 18, tracking: 15},
  overrides: {
    B: {advance: 39, cap: 'round', paths: ['M6 94 V6 H22 Q33 6 33 18 V37 Q33 49 22 49 H6', 'M22 49 Q33 49 33 61 V82 Q33 94 22 94 H6']},
    C: {advance: 39, cap: 'round', paths: ['M33 24 V18 Q33 6 22 6 H17 Q6 6 6 18 V82 Q6 94 17 94 H22 Q33 94 33 82 V76']},
  },
  allowResearchReplacement: false, evidence,
};
export const EARLY_TRAILER_SERIAL: DieProfile = {
  id: 'bc-trailer-early-serial', label: 'Early trailer · narrow upright numerals',
  params: {width: 32, stroke: 11, curve: 'box', boxRadius: 14, tracking: 7,
    one: 'flag', two: 'curved', three: 'round', four: 'closed', six: 'curved', seven: 'straight', nine: 'curved', narrow: 0.5},
  overrides: {
    '1': {advance: 19, cap: 'round', paths: ['M5 15 L12 6 V94']},
    '3': {advance: 32, cap: 'round', paths: ['M5.5 21 V17 Q5.5 6 15 6 H17 Q26.5 6 26.5 18 V36 Q26.5 47 17 47 H13', 'M17 47 Q26.5 47 26.5 59 V82 Q26.5 94 17 94 H15 Q5.5 94 5.5 82 V77']},
    '5': {advance: 32, cap: 'round', paths: ['M26.5 6 H5.5 V45 H17 Q26.5 45 26.5 57 V82 Q26.5 94 17 94 H15 Q5.5 94 5.5 82 V76']},
    '9': {advance: 32, cap: 'round', paths: ['M26.5 48 H15 Q5.5 48 5.5 36 V18 Q5.5 6 15 6 H17 Q26.5 6 26.5 18 V81 Q26.5 94 17 94 H15 Q5.5 94 5.5 82 V77']},
    ...Object.fromEntries([... '024678'].map(char => [char, {...skeletonGlyph(char, {width: 32, stroke: 11, curve: 'box', boxRadius: 14, tracking: 7, two: 'curved', four: 'closed', six: 'curved', seven: 'straight'})!, cap: 'round' as const}])),
  },
  allowResearchReplacement: false, evidence,
};
export const EARLY_TRAILER_DATE: DieProfile = {
  id: 'bc-trailer-early-date', label: 'Early trailer · small upright date',
  params: {...EARLY_TRAILER_SERIAL.params, stroke: 13, tracking: 17},
  overrides: {...EARLY_TRAILER_SERIAL.overrides},
  allowResearchReplacement: false, evidence,
};
export const EARLY_TRAILER_PREFIX: DieProfile = {
  id: 'bc-trailer-early-prefix', label: 'Early trailer · separate T/TR stamp',
  params: {width: 52, stroke: 14, curve: 'box', boxRadius: 15, tracking: 10},
  overrides: {T: {advance: 52, cap: 'round', paths: ['M7 7 H45', 'M26 7 V93']}},
  allowResearchReplacement: false, evidence,
};
registerDieProfile(EARLY_TRAILER_BC, EARLY_TRAILER_SERIAL, EARLY_TRAILER_DATE, EARLY_TRAILER_PREFIX);
