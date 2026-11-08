/**
 * The two photographed 1972 year numerals, independently constructed at their
 * observed narrow proportions. They do not inherit modern decal printing.
 * Clean straight edges and cubic shoulder curves preserve the designed forms;
 * neither photographic blur nor scan-edge pixels become part of the master.
 */
import type {DieProfile} from './engine';

export const DECAL_ANNUAL_1972_PROFILE: DieProfile = {
  id: 'bc-decal-print-annual-1972-reconstruction',
  label: '1972 decal year · narrow 7/2 reconstruction',
  params: {width: 40, stroke: 0, curve: 'oval', tracking: 0},
  overrides: {
    '7': {advance: 38, fill: true, paths: [
      'M0 0 H35 V12 L20.5 100 H8.5 L23 12 H0 Z',
    ]},
    '2': {advance: 43, fill: true, paths: [
      'M0 25 C0 8 6.5 0 20 0 C33.5 0 40 8.5 40 23 C40 36 33 49 26 61 L11 88.5 H40 V100 H0 V88.5 C0 80 4 70 10 60 L25 34 C28 29 29 25.5 29 22 C29 14.5 26 11 20 11 C14 11 11 15 11 25 Z',
    ]},
  },
  allowConstructedFallback: false,
  allowResearchReplacement: false,
  evidence: {
    status: 'legend-approximation',
    specimens: [
      {title:'BCpl8s · 1972, control 926403',url:'https://www.bcpl8s.ca/images/Decals/Passenger/1972-926403.jpg'},
      {title:'BCpl8s · 1972, control 910938',url:'https://www.bcpl8s.ca/images/Decals/Passenger/1972.jpg'},
    ],
    notes: 'Independent 1972-only geometric reconstruction of the observed 7 and 2. The narrow 7 head, shallow leaning stem, round open 2 shoulder and long diagonal are supported by both source specimens. Authored construction coordinates and advances; no horizontal font compression or pixel tracing. Only the two observed numerals are available. Exact historical font and fine print contour remain unconfirmed. See docs/research/bc-decal-corrections/annual-1972/.',
  },
};
