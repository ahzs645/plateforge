import type {DieProfile} from './engine';

/** Fixed, smooth high-contrast numerals; worn photographic paint edges are not traced. */
export const ROYAL_1951_PROFILE: DieProfile = {
  id: 'bc-royal-1951', label: '1951 Royal Tour · high-contrast gold numerals',
  params: {width: 65, stroke: 0, curve: 'oval', tracking: 0},
  allowConstructedFallback: false,
  overrides: {
    '1': {advance: 41, fill: true, paths: [
      'M1 10 C12 8 21 4 25 0 L25 95 C25 97 29 98 34 98 L34 100 L1 100 L1 98 C7 98 13 97 13 95 L13 12 C9 13 5 13 1 13 Z',
    ]},
    '9': {advance: 65, fill: true, paths: [
      'M29 0 C9 0 0 14 0 32 C0 51 10 61 29 61 C39 61 46 57 51 52 C50 73 43 97 26 98 C19 98 14 96 10 91 C15 94 22 90 22 83 C22 77 18 74 13 74 C7 74 3 78 3 84 C3 94 14 100 26 100 C51 100 64 77 64 46 C64 14 50 0 29 0 Z M29 2 C44 2 50 20 51 47 C48 54 40 59 30 59 C16 59 11 47 11 31 C11 13 17 2 29 2 Z',
    ]},
    '5': {advance: 65, fill: true, paths: [
      'M13 4 L58 4 L62 0 L64 0 L57 17 L15 17 L11 45 C18 40 27 38 35 38 C53 38 65 49 65 67 C65 87 48 100 28 100 C12 100 2 92 2 82 C2 76 6 72 12 72 C18 72 22 76 22 81 C22 88 16 91 10 88 C14 95 21 98 29 98 C44 98 52 85 52 69 C52 53 45 42 31 42 C24 42 16 44 9 49 L7 49 Z',
    ]},
  },
  evidence: {status: 'legend-approximation', specimens: [{
    title: 'BCpl8s · 1951 Royal Tour plate', url: 'https://www.bcpl8s.ca/images/LiuetenantGovenor/1951-Royal-Plate.jpg',
  }], notes: 'Only the observed 1, 9 and 5 are defined. A shared high-contrast construction reproduces the narrow flagged 1 and hairline foot, oval 9 with long curved descent and ball terminal, and slab-topped 5 with ball terminal. Widths and contrast were checked against both year pairs at a single scale. Historical typeface identity is unconfirmed; outlines regularize painted edges rather than trace photographic wear.'},
};
