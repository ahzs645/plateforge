/** Historical facts and reconstruction choices are deliberately kept separate.
 * Sources: Christopher Garrish / BCpl8s.ca, consulted 2026-09-26.
 * Photographs are references, NOT bundled or licensed assets. */
export const BC_SOURCES = {
  annual: { title: 'BCpl8s — Passenger 1940–1948', url: 'https://www.bcpl8s.ca/Passenger-1940-1948.html' },
  strip: { title: 'BCpl8s — Passenger 1949–1951', url: 'https://www.bcpl8s.ca/Passenger-1949-1951.html' },
  totem: { title: 'BCpl8s — Passenger 1952–1954', url: 'https://www.bcpl8s.ca/Passenger-1952-1954.html' },
  standard: { title: 'BCpl8s — Passenger 1955–1963', url: 'https://www.bcpl8s.ca/Passenger-1955-1963.html' },
} as const;

export type BcLayout = 'stacked-year' | 'renewal-strip' | 'totem-base' | 'annual-standard' | 'centenary';
export interface BcYear {
  year: number;
  baseYear: number;
  layout: BcLayout;
  /** Source-reported millimetres, not a conversion of nominal 12 × 6 inches. */
  widthMm: number;
  heightMm: number;
  longWidthMm?: number;
  /** Digitisation choices, NOT authoritative paint specifications. */
  background: string;
  ink: string;
  colourDescription: string;
  source: keyof typeof BC_SOURCES;
  sample: string;
  prefixes: string;
  /** Conservative sampling domain, NOT a claim of continuous issuance. */
  generationMax: number;
  note: string;
}

// Each row is a recipe, not a separate drawing. Historical colour names come
// from the reference chart and BCpl8s; hexadecimal approximations are ours.
const rows: Array<[number, string, string, string, string]> = [
  [1940, '#17232a', '#eee194', 'yellow on black', '7-020'],
  [1941, '#f5f3e9', '#1c2a54', 'dark blue on white', '75-185'],
  [1942, '#1c2d48', '#f0eee2', 'white on dark blue', '80-162'],
  [1943, '#eee9d6', '#202222', 'black on cream', '53-643'],
  [1944, '#1c2226', '#eee6d4', 'cream on black', '31-636'],
  [1945, '#f4eee6', '#b82c42', 'red on white', '94-211'],
  [1946, '#bd2d45', '#f7efdf', 'white on red', '31-210'],
  [1947, '#f0efe2', '#287354', 'green on white', '65-797'],
  [1948, '#28502e', '#f1e9c6', 'white on green', '36-229'],
  [1949, '#e9bd3b', '#202321', 'black on yellow', '94-998'],
  [1950, '#1b2022', '#deb65c', 'dark yellow on black', '36-010'],
  [1951, '#1b2022', '#deb65c', '1950 base + blue-on-white strip', '79-583'],
  [1952, '#d8d7ce', '#242525', 'black on aluminum', '12-753'],
  [1953, '#d8d7ce', '#242525', '1952 base + white-on-blue tab', '33-638'],
  [1954, '#d8d7ce', '#242525', '1952 base + yellow-on-black tab', '19-217'],
  [1955, '#e4b647', '#222221', 'black on yellow', '26-543'],
  [1956, '#202629', '#e5c56c', 'yellow on black', '10-101'],
  [1957, '#edece3', '#203650', 'dark blue on white', '110-341'],
  [1958, '#e4cb42', '#316a32', 'green on yellow', '126-175'],
  [1959, '#481f23', '#73b9aa', 'turquoise on maroon', '167-890'],
  [1960, '#74b5ae', '#693640', 'maroon on turquoise', '119-679'],
  [1961, '#d2a39f', '#492326', 'maroon on pink', '350-770'],
  [1962, '#54282e', '#dfb2ae', 'pink on maroon', '207-861'],
  [1963, '#327e9e', '#eeeede', 'white on light blue', '1-877'],
];

export const BC_YEARS: readonly BcYear[] = rows.map(([year, background, ink, colourDescription, sample]) => {
  const totem = year >= 1952 && year <= 1954;
  const source = year <= 1948 ? 'annual' : year <= 1951 ? 'strip' : totem ? 'totem' : 'standard';
  const layout: BcLayout = year === 1951 ? 'renewal-strip' : totem ? 'totem-base'
    : year === 1958 ? 'centenary' : year >= 1955 ? 'annual-standard' : 'stacked-year';
  const note = year === 1943 ? 'Many 1943 singles were repainted, re-stamped halves of 1942 pairs; surface re-strike damage is not simulated.'
    : year === 1951 ? 'The visible serial and stacked 50 belong to the 1950 base. A separately numbered renewal strip covers the lower legend.'
    : totem ? '1952 aluminum base; 1953/54 renew it with a 90 × 140 mm side tab. Late blank-base, W/Y and suffix over-runs are not reconstructed.'
    : year === 1958 ? 'Separate centenary layout: province above serial; 1858 CENTENARY 1958 below.'
    : year >= 1949 && year <= 1950 ? 'Short base for up to five numeric digits; long base for six. Geometry follows the edited serial.'
    : year === 1948 ? 'Includes documented passenger prefixes A/B/H/J/K/P/R/S/U/W; F was reserved for farm plates. Uncertain T passenger use is excluded.'
    : 'Standard passenger reconstruction; minor die, spacing and production variations are not exhaustive.';
  return {
    year, baseYear: year === 1951 ? 1950 : totem ? 1952 : year,
    layout, widthMm: totem ? 350 : year >= 1955 ? 300 : year >= 1947 ? 287 : 290,
    heightMm: totem ? 140 : year >= 1955 ? 150 : 137,
    ...(year >= 1949 && year <= 1951 ? { longWidthMm: 335 } : {}),
    background, ink, colourDescription, source, sample,
    prefixes: year <= 1945 ? 'ABF' : year === 1946 ? 'ABFH' : year === 1947 ? 'ABFHJ' : year === 1948 ? 'ABHJKPRSUW' : '',
    generationMax: year <= 1948 || totem ? 99999 : year === 1949 ? 144725 : year === 1950 ? 162025
      : year === 1951 ? 230000 : year === 1955 ? 275000 : 300000,
    note,
  };
});

export function bcYear(year: number): BcYear {
  const recipe = BC_YEARS.find((item) => item.year === year);
  if (!recipe) throw new RangeError(`Unsupported B.C. passenger year: ${year}. Implemented: 1940–1963.`);
  return recipe;
}

export const BC_RECONSTRUCTION_NOTE = 'Research reconstruction, not an issued registration. Original die fonts, exact paint colours, hole positions and totem details remain approximations. Serial validation checks the supported format, not an individual registration or exhaustive issue ranges.';
