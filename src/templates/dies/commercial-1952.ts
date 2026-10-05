import type {DieProfile} from './engine';
import {BC_SERIAL_1940} from './traced-1940';
import {skeletonGlyph} from './skeleton';

const specimens = [{title: 'BCpl8s · Commercial 1952 C29·419', url: 'https://www.bcpl8s.ca/images/Commercial/1952/1952-C29419(XL).jpg'},
  {title: 'BCpl8s · Commercial 1952–1954 study', url: 'https://www.bcpl8s.ca/CommercialTruck1952-1954.html'}];

/** Commercial-specific proportions, not an assertion of different physical tooling. */
export const COMMERCIAL_1952_LEGEND: DieProfile = {
  id: 'bc-commercial-1952-legend', label: 'Commercial 1952 · broad rounded legend',
  params: {width: 68, stroke: 22, curve: 'box', boxRadius: 23, tracking: 29,
    narrow: 0.33, wide: 1.4, a: 'flat', one: 'plain'},
  overrides: {A: skeletonGlyph('A', {width: 85, stroke: 22, curve: 'box', tracking: 29, a: 'flat'})!},
  evidence: {status: 'legend-approximation', specimens,
    notes: 'BRITISH COLUMBIA checked character by character on C29·419: broad rounded B/R/S/C/O/U, narrow I, broad T/L/H, wide M and triangular A. Standard paint width is approximately 0.68–0.74 of the rectified cap height; I is about 0.22, M about 0.95 and the wider A about 0.85. Smooth shared-stroke construction excludes embossing shoulders and photographed wear; reconstructed proportions do not identify exact physical dies.'},
};

export const COMMERCIAL_1952_SERIAL: DieProfile = {
  id: 'bc-commercial-1952-serial', label: 'Commercial 1952 · rounded serial reconstruction',
  params: {width: 55, stroke: 20, curve: 'stadium', tracking: 11, one: 'flag', two: 'curved', three: 'round',
    four: 'closed', six: 'curved', seven: 'curved', nine: 'curved', narrow: 0.6, wide: 1.2,
    dash: {width: 4, weight: 17, y: 51}, dot: 'round'},
  overrides: {...BC_SERIAL_1940,
    C: {advance: 55, fill: true, paths: ['M55 4 C47 0 39 0 32 0 C15 0 8 13 5 31 L0 69 C-2 86 7 100 22 100 H31 C40 100 45 94 47 85 L49 70 H33 L32 79 C31 84 28 86 23 86 C17 86 14 82 15 76 L19 29 C20 20 24 15 30 15 C36 15 39 18 38 25 L37 29 H54 Z']},
    '·': {advance: 12, fill: true, paths: ['M1 39 H11 V55 H1 Z']},
  },
  evidence: {status: 'legend-approximation', specimens,
    notes: 'Existing 1940–54 digit reconstructions retained after C29·419 overlap check of 2, both 9 occurrences, 4 and flagged 1. The source separator is a short rectangular mark; observed pair spacing is calibrated in the recipe. Residual digit contour/height differences remain approximate. C receives a heavier rounded open bowl and forward lean supported by this commercial photograph. Other digits remain shared-era reconstructions; unobserved prefix A is constructed. No assertion of a different manufactured font or fully confirmed alphabet.'},
};

export const COMMERCIAL_1952_YEAR: DieProfile = {
  id: 'bc-commercial-1952-year', label: 'Commercial 1952 · heavy base date',
  params: {width: 55, stroke: 21.5, curve: 'oval', tracking: 12, two: 'curved', four: 'closed'},
  overrides: {
    '5': {advance: 55, cap: 'round', paths: ['M44.25 10.75 H12 L11 44 C17 40 23 39 28 40 C40 41 45 54 44 69 C43 83 36 89.25 26 89.25 C19 89.25 13 85 10.75 81']},
    '2': {advance: 55, cap: 'round', paths: ['M10.75 24 C13 8 31 5 40 17 C50 31 39 43 30 55 L11 82 Q8 89.25 14 89.25 H44.25']},
  },
  evidence: {status: 'legend-approximation', specimens,
    notes: 'Heavy 52 pair checked against the upright base date on C29·419; rounded terminals and curved 2 replace the thinner passenger date construction. Other dates, including the 1954 palette, are consistent category constructions, not confirmed physical dies. Paint/embossing remain approximate.'},
};
