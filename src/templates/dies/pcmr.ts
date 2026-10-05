import type {DieProfile} from './engine';

const specimens = [
  {title: 'BCpl8s · Company 71 wooden plate, City of Penticton Archives', url: 'https://www.bcpl8s.ca/images/PCMR/PCMR-71(XL).jpg'},
  {title: 'BCpl8s · Pacific Coast Militia Rangers', url: 'https://www.bcpl8s.ca/NationalDefence.html'},
];

/** Smooth construction of the fixed lettering on Company 71's painted wooden plate. */
export const PCMR_PROFILE: DieProfile = {
  id: 'bc-pcmr-71', label: 'P.C.M.R. · Company 71 painted lettering',
  params: {width: 55, stroke: 0, curve: 'oval', tracking: 0},
  allowConstructedFallback: false,
  overrides: {
    P: {advance: 38, fill: true, paths: [
      'M0 0 H15 C34 0 48 18 48 41 C48 64 36 80 19 80 V100 H0 Z M19 17 V64 C26 63 29 53 29 41 C29 29 26 20 19 17 Z',
    ]},
    C: {advance: 57, fill: true, paths: [
      'M55 7 L51 30 C48 23 43 20 37 20 C24 20 20 35 20 51 C20 68 24 82 37 82 C43 82 48 77 51 72 L54 95 C49 99 43 100 36 100 C13 100 0 80 0 51 C0 22 13 0 37 0 C44 0 51 2 55 7 Z',
    ]},
    M: {advance: 64, fill: true, paths: [
      'M0 0 H21 L30 34 L40 0 H60 V100 H40 V63 L30 98 L20 63 V100 H0 Z',
    ]},
    R: {advance: 59, fill: true, paths: [
      'M0 0 H24 C49 0 61 15 61 39 C61 54 55 63 46 69 L59 100 H37 L28 78 H21 V100 H0 Z M21 21 V60 H25 C35 60 39 51 39 40 C39 30 35 23 25 21 Z',
    ]},
    '.': {advance: 12, fill: true, paths: ['M4 91 L8 95.5 L4 100 L0 95.5 Z']},
  },
  evidence: {status: 'legend-approximation', specimens,
    notes: 'Only P, C, M, R and diamond punctuation are constructed from the Company 71 photograph. Heavy narrow P, wedge-ended C, triangular M notches and broad R leg are preserved as smooth filled shapes; scuffs, grain and uneven paint edges are excluded. Punctuation overlaps the open lower-right space of the P. This is one hand-painted wooden specimen, not a manufactured die or a common alphabet for other PCMR companies. Physical dimensions remain unknown.'},
};

/** The compact company column uses different proportions from the large abbreviation. */
export const PCMR_COMPANY_PROFILE: DieProfile = {
  id: 'bc-pcmr-71-company', label: 'P.C.M.R. · Company 71 compact column',
  params: {width: 98, stroke: 0, curve: 'oval', tracking: 0},
  allowConstructedFallback: false,
  overrides: {
    C: {advance: 92, fill: true, paths: [
      'M85 9 L82 37 C77 28 66 23 56 23 C37 23 24 35 24 51 C24 68 38 79 56 79 C68 79 77 74 84 68 L87 93 C78 98 66 100 55 100 C23 100 0 80 0 51 C0 22 23 0 55 0 C67 0 78 3 85 9 Z',
    ]},
    O: {advance: 103, fill: true, paths: [
      'M51.5 0 C83 0 103 20 103 50 C103 80 83 100 51.5 100 C20 100 0 80 0 50 C0 20 20 0 51.5 0 Z M51.5 25 C35 25 26 35 26 50 C26 65 35 75 51.5 75 C68 75 77 65 77 50 C77 35 68 25 51.5 25 Z',
    ]},
    '7': {advance: 96, fill: true, paths: ['M0 0 H96 L38 100 H8 L61 30 H0 Z']},
    '1': {advance: 62, fill: true, paths: ['M0 0 H47 V77 H62 V100 H4 V77 H21 V23 H0 Z']},
  },
  evidence: {status: 'legend-approximation', specimens,
    notes: 'C/O/7/1 reconstructed only for the observed Company 71 column: nearly round C and O, wide straight-bar 7, and flagged 1 with a broad baseline foot. The column is not the same alphabet or proportions as the large painted P.C.M.R. No other company number is inferred.'},
};
