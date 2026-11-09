/**
 * Reviewed candidate pools for ordinary passenger serials. These are selection
 * constraints, not certification of historical tooling or complete alphabets.
 *
 * The archived registry compiler ranked broadly overlapping comparison units;
 * that can place another Astrographic variant or another maker ahead of the
 * selected die. Keep this small, explicit policy outside the generated registry
 * so regenerating the archive cannot silently undo the constraint. Existing
 * registry ranking is retained within each pool, and only already-bound units
 * can be selected. Missing characters keep their production fallback.
 *
 * Motorcycle, trailer, personalized and other class contexts are deliberately
 * absent. Similar names or overlapping dates do not establish the same tools.
 */
const astro = {
  'bc-astro-1': ['research-bc-astro-1-smooth-complete', 'research-bc-astro-1-chart-smooth-complete'],
  'bc-astro-2': ['research-bc-astro-2-smooth-complete', 'research-bc-astro-2-chart-smooth-complete'],
  'bc-astro-3': ['research-bc-astro-3-smooth-complete', 'research-bc-astro-3-chart-smooth-complete'],
  'bc-astro-4': ['research-bc-astro-4-smooth-complete', 'research-bc-astro-4-chart-smooth-complete'],
} as const;
const passengerWaldale = ['research-bc-waldale-passenger-refinement-v2', 'research-bc-waldale-passenger-serial'] as const;

export const BC_PASSENGER_RESEARCH_BINDINGS: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  '1985-flag': {
    ...astro,
    'bc-waldale': ['research-bc-waldale-trial-run-1998-1999'],
  },
  '2001-flag': { 'bc-astro-4': astro['bc-astro-4'], 'bc-waldale': passengerWaldale },
  '2013-flag-dual': { 'bc-waldale': passengerWaldale },
  '2014-flag': { 'bc-waldale': passengerWaldale },
  '2025-flag': { 'bc-waldale': passengerWaldale },
};
