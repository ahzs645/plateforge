/**
 * British Columbia passenger plates before 1940: owner-made leather plates,
 * porcelain (1913–14), lithographed tin (1915–17), embossed steel with renewal
 * tabs (1918–23), then annual steel plates with BRITISH COLUMBIA (1924–39).
 * Sizes, colours, number ranges and layout fractions come from the BCpl8s
 * chapters 1904–1912 … 1936–1939; colours are read from aged photographs.
 */
import type { PlateFormat } from '../../core/types';
import type { KitPanel, KitRecipe, KitShape, KitText } from '../../templates/bc/kit';
import { kitFormat, numericGrammar, type SerialGrammar } from './bc-kit';
import { bcLeatherFormats } from './bc-leather';

const chapter = (period: string) => ({ title: `BCpl8s · Passenger ${period.replace('-', '–')}`, url: `https://www.bcpl8s.ca/Passenger-${period}.html` });
const NOTE = 'Early-plate reconstruction from BCpl8s photographs: layout proportions and colours are approximate, and the numerals are die reconstructions read from gallery photos. Validation checks the documented number range, not a real registration.';

interface Base { w: number; h: number; bg: string; ink: string }
const stacked = (chars: string, x: number, from: number, step: number, cap: number, die: string, role: string): KitText[] =>
  [...chars].map((c, i) => ({ text: c, x, baseline: from + i * step, cap, die, role: `${role}-${i}` }));

/** Top-edge slots plus four small corner grommets (porcelain and tin). */
const grommets = (b: Base): KitShape[] => [[0.025, 0.06], [0.975, 0.06], [0.025, 0.94], [0.975, 0.94]]
  .map(([x, y]) => ({ kind: 'circle' as const, cx: b.w * x, cy: b.h * y, r: 2.2, fill: '#1c1c1c', stroke: '#9a9a90', strokeWidth: 0.8 }));

function recipe(id: string, label: string, b: Base, period: string, rest: Partial<KitRecipe> & Pick<KitRecipe, 'serial' | 'legends'>): KitRecipe {
  return { id, label, width: b.w, height: b.h, radius: 5, background: b.bg, ink: b.ink, embossed: true, source: chapter(period), note: NOTE,
    holes: 'slots', holeAt: { x: [0.2, 0.8], y: [0.06] }, rim: { inset: 2.5, width: 1.6 }, ...rest };
}

// ── 1904–1912: owner-made leather plates with nickel house numerals ─────────
const leather: Base = { w: 330, h: 140, bg: '#2d2c2a', ink: '#bbb8ad' };
const leatherRecipe = recipe('early-1904', '1904–12 owner-made leather', leather, '1904-1912', {
  embossed: false, rim: null, holes: 'none',
  shapes: [
    { kind: 'rect', x: 7, y: 7, width: leather.w - 14, height: leather.h - 14, rx: 8, stroke: '#57534c', strokeWidth: 1.2, dash: '3 2.5' },
    { kind: 'rect', x: 40, y: -4, width: 22, height: 14, rx: 3, fill: '#4a3a2c' },
    { kind: 'rect', x: leather.w - 62, y: -4, width: 22, height: 14, rx: 3, fill: '#4a3a2c' },
  ],
  legends: [
    { text: 'B', x: leather.w * 0.09, baseline: leather.h * 0.5, cap: leather.h * 0.28, die: 'bc-block-1918', role: 'legend-b' },
    { text: 'C', x: leather.w * 0.16, baseline: leather.h * 0.8, cap: leather.h * 0.28, die: 'bc-block-1918', role: 'legend-c' },
  ],
  serial: { x: leather.w * 0.6, baseline: leather.h * 0.82, cap: leather.h * 0.6, maxWidth: leather.w * 0.7, die: 'bc-block-1918', font: { family: 'serif', weight: 700 } },
});

// ── 1913–1914 porcelain ─────────────────────────────────────────────────────
const p1913: Base = { w: 305, h: 167, bg: '#100a56', ink: '#d9e2e5' };
const porcelain1913 = recipe('early-1913', '1913 porcelain', p1913, '1913-1914', {
  embossed: false, rim: null,
  shapes: [
    { kind: 'line', x1: p1913.w * 0.16, y1: p1913.h * 0.07, x2: p1913.w * 0.16, y2: p1913.h * 0.95, strokeWidth: 2.4 },
    { kind: 'line', x1: p1913.w * 0.865, y1: p1913.h * 0.07, x2: p1913.w * 0.865, y2: p1913.h * 0.95, strokeWidth: 2.4 },
    ...grommets(p1913),
  ],
  legends: [
    { text: 'B', x: p1913.w * 0.085, baseline: p1913.h * 0.43, cap: p1913.h * 0.26, die: 'bc-porcelain-1913', role: 'legend-b' },
    { text: '.', x: p1913.w * 0.085, baseline: p1913.h * 0.52, cap: p1913.h * 0.26, die: 'bc-porcelain-1913', role: 'legend-dot' },
    { text: 'C', x: p1913.w * 0.085, baseline: p1913.h * 0.84, cap: p1913.h * 0.26, die: 'bc-porcelain-1913', role: 'legend-c' },
    { text: '.', x: p1913.w * 0.085, baseline: p1913.h * 0.93, cap: p1913.h * 0.26, die: 'bc-porcelain-1913', role: 'legend-dot2' },
    ...stacked('1913', p1913.w * 0.935, p1913.h * 0.26, p1913.h * 0.22, p1913.h * 0.17, 'bc-porcelain-1913', 'year'),
  ],
  serial: { x: p1913.w * 0.5125, baseline: p1913.h * 0.9, cap: p1913.h * 0.77, maxWidth: p1913.w * 0.66, die: 'bc-porcelain-1913' },
});
const p1914: Base = { w: 305, h: 167, bg: '#f3ede5', ink: '#1a1712' };
const porcelain1914 = recipe('early-1914', '1914 porcelain', p1914, '1913-1914', {
  embossed: false, rim: null, shapes: grommets(p1914),
  art: [{ art: 'bc-monogram-1914', x: p1914.w * 0.025, y: p1914.h * 0.19, width: p1914.w * 0.185, height: p1914.h * 0.47, color: p1914.ink }],
  legends: [{ text: '1914', x: p1914.w * 0.11, baseline: p1914.h * 0.83, cap: p1914.h * 0.13, die: 'bc-porcelain-1914', role: 'year' }],
  serial: { x: p1914.w * 0.61, baseline: p1914.h * 0.88, cap: p1914.h * 0.74, maxWidth: p1914.w * 0.66, die: 'bc-porcelain-1914' },
});

// ── 1915–1917 lithographed tin with the coat of arms ────────────────────────
// Two makers (BCpl8s, Passenger 1915–1917): MacDonald Manufacturing of Toronto printed 1915 and 1916 up to
// No. 9,000 with very condensed numerals and a wire rim with crimped edging; J.R. Tacey & Sons of Vancouver made
// the late-1916 over-run (9,001–9,342) and 1917 with wider, heavier numerals. Tacey's 1917 coat of arms came in
// three qualities, and its first plates copied MacDonald's wire rim before a plainer edge took over.
type TinMaker = 'macdonald' | 'tacey';
type ArmsType = 'fine' | 'crude' | 'bold';
interface TinOptions { maker: TinMaker; arms?: ArmsType; wireRim?: boolean; id?: string; label?: string }
const ARMS_ART: Record<ArmsType, string> = { fine: 'bc-arms', crude: 'bc-arms-crude', bold: 'bc-arms-bold' };
function tin(year: number, b: Base, cap: number, baseline: number, panel: boolean, o: TinOptions): KitRecipe {
  const die = o.maker === 'macdonald' ? 'bc-tin-macdonald' : 'bc-tin-tacey';
  const arms = ARMS_ART[o.arms ?? 'fine'];
  const wire = o.wireRim ?? o.maker === 'macdonald';
  return recipe(o.id ?? `early-${year}`, o.label ?? `${year} tin`, b, '1915-1917', {
    // Wire rim with crimped edging (MacDonald, early Tacey) reads as a heavy edge band; later Tacey plates a plain edge.
    embossed: false, rim: wire ? { inset: 1.8, width: 2.6 } : { inset: 1.5, width: 1.2 }, shapes: grommets(b),
    // 1915 (cream panel) proportions are measured from BCpl8s No. 228: the arms fill the panel, the crown just under the arch.
    art: panel ? [
      { art: 'arms-panel', x: b.w * 0.014, y: b.h * 0.09, width: b.w * 0.176, height: b.h * 0.411, color: b.ink },
      { art: 'bc-arms', x: b.w * 0.018, y: b.h * 0.115, width: b.w * 0.168, height: b.h * 0.36, color: b.bg },
    ] : [
      { art: arms, x: b.w * 0.04, y: b.h * 0.09, width: b.w * 0.15, height: b.h * 0.36, color: b.ink },
    ],
    legends: panel ? [
      { text: 'B.C.', x: b.w * 0.107, baseline: b.h * 0.695, cap: b.h * 0.106, die: 'bc-legend-condensed', role: 'legend' },
      { text: String(year), x: b.w * 0.1, baseline: b.h * 0.937, cap: b.h * 0.188, maxWidth: b.w * 0.165, die: 'bc-tin-1915', role: 'year' },
    ] : [
      { text: 'B.C.', x: b.w * 0.11, baseline: b.h * (year === 1917 ? 0.59 : 0.66), cap: b.h * 0.13, die: 'bc-legend-condensed', role: 'legend' },
      { text: String(year), x: b.w * 0.11, baseline: b.h * (year === 1917 ? 0.86 : 0.9), cap: b.h * (year === 1917 ? 0.24 : 0.18), maxWidth: b.w * 0.16, die: 'bc-tin-1915', role: 'year' },
    ],
    serial: { x: b.w * 0.6, baseline: b.h * baseline, cap: b.h * cap, maxWidth: b.w * 0.7, die },
  });
}

// ── 1918–1923 embossed steel; 1919 and 1921/22 renewed with tabs ────────────
function steel(year: number, b: Base, mark: 'monogram' | 'frame' | 'letters', tab?: Omit<KitPanel, 'role'>): KitRecipe {
  const legends: KitText[] = [{ text: String(year), x: b.w * 0.155, baseline: b.h * 0.81, cap: b.h * 0.13, maxWidth: b.w * 0.18, die: 'bc-block-1918', role: 'year' }];
  if (mark === 'letters') legends.push({ text: 'BC', x: b.w * 0.165, baseline: b.h * 0.61, cap: b.h * 0.45, maxWidth: b.w * 0.22, die: 'bc-legend-1940', role: 'legend' });
  return recipe(`early-${year}${tab ? '-tab' : ''}`, `${year}${tab ? ' renewal tab' : ''}`, b, '1918-1923', {
    holeAt: { x: [0.12, 0.2, 0.8, 0.88], y: [0.07] },
    shapes: mark === 'frame' ? [{ kind: 'rect', x: b.w * 0.04, y: b.h * 0.13, width: b.w * 0.22, height: b.h * 0.73, rx: 2, strokeWidth: 2 }] : [],
    art: mark === 'letters' ? [] : [{ art: 'bc-monogram', x: b.w * 0.07, y: b.h * 0.17, width: b.w * 0.17, height: b.h * 0.47, color: b.ink }],
    legends,
    serial: { x: b.w * 0.63, baseline: b.h * 0.87, cap: b.h * 0.74, maxWidth: b.w * 0.6, die: 'bc-block-1918' },
    ...(tab ? { panels: [{ ...tab, role: 'renewal-tab' }] } : {}),
  });
}
function renewalTab(year: number, x: number, y: number, width: number, height: number, background: string, ink: string, rivets: boolean): Omit<KitPanel, 'role'> {
  return { x, y, width, height, background, ink, radius: 4,
    serial: { x: width / 2, baseline: height * 0.25, cap: height * 0.15, maxWidth: width * 0.84, die: 'bc-block-1918' },
    art: [{ art: 'bc-monogram', x: width * 0.2, y: height * 0.3, width: width * 0.6, height: height * 0.42, color: ink }],
    texts: [{ text: String(year), x: width / 2, baseline: height * 0.94, cap: height * 0.15, maxWidth: width * 0.7, die: 'bc-block-1918', role: 'tab-year' }],
    ...(rivets ? { rivets: [[width * 0.08, height * 0.33], [width * 0.92, height * 0.33], [width * 0.08, height * 0.68], [width * 0.92, height * 0.68]] } : {}) };
}

// ── 1924–1935: serial with a small year at right, BRITISH COLUMBIA below ───
function annual1924(year: number, b: Base, die: string, dashYear: boolean, leadingBar: boolean, long = false): KitRecipe {
  const legendWidth = year === 1930 ? 0.8 : 0.925;
  return recipe(`early-${year}${long ? '-long' : ''}`, `${year}${long ? ' long base' : ''}`, b, year === 1930 ? '1930' : year < 1930 ? '1924-1929' : '1931-1935', {
    holeAt: { x: [0.195, 0.805], y: [0.06] }, rim: { inset: 3, width: 1.6 },
    legends: [
      // The date was struck with its own small dies each year, not the serial's (traced per year from photos).
      // Measured over about 50 photographed plates: digits 25% of the height across 0.83–0.96 of the width, baseline at 51%.
      { text: `${dashYear ? '-' : ''}${String(year).slice(2)}`, x: b.w * (dashYear ? 0.878 : 0.8925), baseline: b.h * 0.513, cap: b.h * 0.253, maxWidth: b.w * (dashYear ? 0.17 : 0.14), die: `bc-date-${year}`, role: 'year' },
      // Legend 16.5% of the height, spanning about 0.035–0.96 of the width, baseline at 90%.
      { text: 'BRITISH COLUMBIA', x: b.w * (year === 1930 ? 0.48 : 0.497), baseline: b.h * 0.9, cap: b.h * 0.165, maxWidth: b.w * legendWidth, die: year === 1930 ? 'bc-legend-1930' : die === 'bc-straight-1928' ? 'bc-legend-1928' : 'bc-legend-1924', role: 'province', spread: true },
    ],
    // 1930's Thompson plates separate the groups with a small raised dot (36·349, 102·963), not a dash.
    serial: { x: b.w * 0.43, baseline: b.h * 0.67, cap: b.h * 0.54, maxWidth: b.w * 0.74, die, leadingBar, ...(year === 1930 ? { separator: { kind: 'dot' as const } } : {}) },
  });
}

// ── 1936–1939: year stacked at the far right ────────────────────────────────
function annual1936(year: number, b: Base): KitRecipe {
  const yy = String(year).slice(2);
  return recipe(`early-${year}`, String(year), b, '1936-1939', {
    holeAt: { x: [0.22, 0.77], y: [0.1, 0.9] }, rim: { inset: 3, width: 1.6 },
    legends: [
      // Measured over 22 plates: 23%-high digits centred at 0.94 of the width, baselines at 37% and 63%.
      ...stacked(yy, b.w * 0.938, b.h * 0.367, b.h * 0.264, b.h * 0.233, `bc-date-${year}`, 'year'),
      { text: 'BRITISH COLUMBIA', x: b.w * 0.504, baseline: b.h * 0.866, cap: b.h * 0.155, maxWidth: b.w * 0.88, die: 'bc-legend-1936', role: 'province', spread: true },
    ],
    // Serial 50.5% of the height, spanning up to 0.045–0.89 of the width; a raised dot between the groups (3·620, 30·503).
    serial: { x: b.w * 0.468, baseline: b.h * 0.645, cap: b.h * 0.505, maxWidth: b.w * 0.85, die: 'bc-tacey-1936', leadingBar: true, separator: { kind: 'dot' } },
  });
}

interface EarlySpec { id: string; label: string; period: [number, number]; recipe: KitRecipe; grammar: SerialGrammar; description: string; status?: PlateFormat['status'] }
const plain = (hi: number, lo = 1) => numericGrammar([[lo, hi]], false);
const dashed = (hi: number, lo = 1) => numericGrammar([[lo, hi]], true);

const s1918: Base = { w: 365, h: 133, bg: '#393835', ink: '#d7af25' };
const s1920: Base = { w: 363, h: 135, bg: '#38362f', ink: '#e8c226' };
const annual: Array<[number, Base, string, boolean, boolean, number]> = [
  [1924, { w: 343, h: 149, bg: '#30312f', ink: '#d8a323' }, 'bc-tacey-1924', true, false, 45000],
  [1925, { w: 340, h: 147, bg: '#1d1c1e', ink: '#e1dcc7' }, 'bc-tacey-1924', false, false, 58500],
  [1926, { w: 338, h: 148, bg: '#e9dec4', ink: '#1e1a16' }, 'bc-tacey-1924', true, false, 69000],
  [1927, { w: 340, h: 148, bg: '#e67620', ink: '#31302f' }, 'bc-tacey-1924', false, false, 78000],
  [1928, { w: 340, h: 147, bg: '#2e2a29', ink: '#d47e38' }, 'bc-straight-1928', false, false, 90000],
  [1929, { w: 345, h: 148, bg: '#dcc79a', ink: '#333a36' }, 'bc-straight-1928', false, false, 99999],
  [1930, { w: 338, h: 148, bg: '#8e2c2a', ink: '#d99206' }, 'bc-thompson-1930', true, false, 99999],
  [1931, { w: 338, h: 148, bg: '#ece2cc', ink: '#2b2c2e' }, 'bc-tacey-1924', false, false, 99999],
  // 1932 photos (223, 103-216) show the curved, slanted Tacey dies of 1931, not the straight ones of 1933–35.
  [1932, { w: 340, h: 149, bg: '#4a2722', ink: '#dacfac' }, 'bc-tacey-1924', false, false, 99999],
  [1933, { w: 342, h: 149, bg: '#e1ac3c', ink: '#863a2c' }, 'bc-straight-1928', false, true, 99000],
  [1934, { w: 342, h: 148, bg: '#1f498e', ink: '#e4e3d9' }, 'bc-straight-1928', false, true, 92000],
  [1935, { w: 348, h: 149, bg: '#e6e8e2', ink: '#1a344f' }, 'bc-straight-1928', false, true, 99999],
];
const annualNotes: Record<number, string> = {
  1924: 'First BRITISH COLUMBIA legend; numbers of four or more figures gain a dash, and the date reads -24.',
  1926: 'Black on white with a -26 date; most survivors have discoloured paint.',
  1927: 'Last year of the 1924 slanted dies; early numbers have extra top holes.',
  1928: 'New straighter dies; one- to three-figure numbers are centred.',
  1930: 'Made by Thompson Heating & Ventilating with one-off dies never used again (traced from photographs; no 8 is known, so it is built from the 3) and a -30 date; six-figure numbers went on a longer base.',
  1931: 'Slanted dies return; about 7,000 unissued sets were dumped at sea.',
  1932: 'The slanted Tacey dies again; about 30,000 sets went unissued, and some turned up in an Oakalla wall in 1991.',
  1933: 'Straight dies 1933–35; four-figure numbers carry a long leading bar.',
  1934: 'Licence year moved to March 1; four-figure numbers carry the leading bar.',
};
const longBases: Array<[number, Base, string, number, number]> = [
  [1930, { w: 355, h: 148, bg: '#8e2c2a', ink: '#d99206' }, 'bc-thompson-1930', 100001, 105000],
  [1931, { w: 355, h: 148, bg: '#ece2cc', ink: '#2b2c2e' }, 'bc-tacey-1924', 100000, 115000],
  [1935, { w: 360, h: 149, bg: '#e6e8e2', ink: '#1a344f' }, 'bc-straight-1928', 100000, 105000],
];
const late: Array<[number, Base, number]> = [
  [1936, { w: 292, h: 142, bg: '#1d3523', ink: '#f0e9c7' }, 90000],
  [1937, { w: 292, h: 142, bg: '#f5e2ad', ink: '#2f2c28' }, 95000],
  [1938, { w: 286, h: 136, bg: '#4d362f', ink: '#f6ebb0' }, 90000],
  [1939, { w: 288, h: 136, bg: '#dec337', ink: '#35322b' }, 99999],
];

const specs: EarlySpec[] = [
  { id: '1904-leather', label: '1904–12 · leather', period: [1904, 1912], recipe: leatherRecipe, grammar: plain(4500),
    description: 'Before 1913 owners made their own plates: permanent registration numbers (1904: 1–32 … 1910: 615–1,326) in house-number figures riveted to leather, with B and C set diagonally. No standard size or typeface; this is one representative example with a serif stand-in for the nickel numerals.' },
  { id: '1908-porcelain', label: '1908 · porcelain (doubtful)', period: [1908, 1908], status: 'uncertain',
    recipe: recipe('early-1908-porcelain', '1908 porcelain (doubtful)', { w: 152, h: 102, bg: '#1c1f6a', ink: '#e0e4e6' }, '1904-1912', {
      embossed: false, rim: null, holes: 'none', legends: [],
      shapes: [[0.06, 0.12], [0.94, 0.12], [0.06, 0.88], [0.94, 0.88]].map(([x, y]) => ({ kind: 'circle' as const, cx: 152 * x, cy: 102 * y, r: 2.4, fill: '#111', stroke: '#9a9a90', strokeWidth: 0.8 })),
      serial: { x: 76, baseline: 102 * 0.85, cap: 102 * 0.7, maxWidth: 152 * 0.8, die: 'bc-porcelain-1914' } }),
    grammar: plain(999, 100),
    description: 'A 6 × 4 in white-on-cobalt porcelain found near Nanaimo; BCpl8s notes it may be a house-number sign rather than a plate. No jurisdiction or date appears on it.' },
  { id: '1913', label: '1913 · porcelain', period: [1913, 1913], recipe: porcelain1913, grammar: plain(7000),
    description: 'The first provincial plates: white on blue porcelain, 305 × 167 mm, with B.C. and the year stacked either side of the number between two rules. Numbers 1–7,000.' },
  { id: '1914', label: '1914 · porcelain', period: [1914, 1914], recipe: porcelain1914, grammar: plain(8000),
    description: 'Black on white porcelain with the interlaced BC monogram and 1914 at left. Estimated 1–7,500; No. 7968 is known.' },
  { id: '1915', label: '1915 · tin', period: [1915, 1915], recipe: tin(1915, { w: 323, h: 146, bg: '#4e6735', ink: '#e2d795' }, 0.84, 0.92, true, { maker: 'macdonald' }), grammar: plain(8199),
    description: 'Lithographed tin, dark green with “pearl white” figures, the coat of arms on a cream panel. Numbers 1–8,000 plus an over-run to 8,199.' },
  { id: '1916', label: '1916 · tin', period: [1916, 1916], recipe: tin(1916, { w: 323, h: 146, bg: '#cc8d0b', ink: '#312b1e' }, 0.82, 0.92, false, { maker: 'macdonald' }), grammar: plain(9000),
    description: 'Dark on orange-yellow tin by MacDonald Manufacturing, numbers 1–9,000. The over-run above 9,000 is a separate design.' },
  { id: '1916-overrun', label: '1916 · Tacey over-run', period: [1916, 1916],
    recipe: tin(1916, { w: 342, h: 146, bg: '#cc8d0b', ink: '#2c261c' }, 0.76, 0.9, false, { maker: 'tacey', arms: 'crude', id: 'early-1916-overrun', label: '1916 over-run (Tacey)' }), grammar: plain(9342, 9001),
    description: 'Nos. 9,001–9,342, issued from late 1916 and most likely made by J.R. Tacey & Sons, who won the 1917 contract: heavier, wider numerals, a cruder coat of arms, and a slightly longer plate (about 342 mm, scaled from the BCpl8s side-by-side photo).' },
  { id: '1917', label: '1917 · tin', period: [1917, 1917], recipe: tin(1917, { w: 342, h: 139, bg: '#ebebd7', ink: '#161318' }, 0.7, 0.83, false, { maker: 'tacey' }), grammar: plain(9999, 3000),
    description: 'Black on cream tin by J.R. Tacey & Sons, 342 × 139 mm, with the fine (Type 2) coat of arms. BCpl8s places the change-overs between arms types around Nos. 3,000, 10,000 and 12,000, but a gap in photographs from 3,000 to 6,500 leaves them uncertain.' },
  { id: '1917-early', label: '1917 · early (Type 1 arms)', period: [1917, 1917],
    recipe: tin(1917, { w: 342, h: 139, bg: '#ebebd7', ink: '#161318' }, 0.7, 0.83, false, { maker: 'tacey', arms: 'crude', wireRim: true, id: 'early-1917-type1', label: '1917 tin, Type 1 arms' }), grammar: plain(2999),
    description: 'Low-number 1917 plates: a crude, blotted coat of arms and a wire rim with crimped edging copied from MacDonald. These wore badly within months. The upper number is an estimate.' },
  { id: '1917-late', label: '1917 · late (Type 3 arms)', period: [1917, 1917],
    recipe: tin(1917, { w: 342, h: 139, bg: '#ebebd7', ink: '#161318' }, 0.7, 0.83, false, { maker: 'tacey', arms: 'bold', id: 'early-1917-type3', label: '1917 tin, Type 3 arms' }), grammar: plain(13000, 10000),
    description: 'High-number 1917 plates with the heavier (Type 3) coat of arms; the change-over number is an estimate.' },
  { id: '1918', label: '1918 · steel', period: [1918, 1918], recipe: steel(1918, s1918, 'frame'), grammar: plain(20500),
    description: 'Embossed yellow on black steel meant to last three years with renewal tabs; the framed monogram area is where the tab fits. Numbers 1–15,000 with an over-run to 20,500.' },
  { id: '1919-tab', label: '1919 · green tab', period: [1919, 1919],
    recipe: steel(1919, s1918, 'frame', renewalTab(1919, s1918.w * 0.035, 11, 90, 110, '#3d6346', '#c9a860', false)), grammar: plain(21500),
    description: 'The 1918 base renewed with a 90 × 110 mm green tab over the monogram frame, repeating the plate number.' },
  { id: '1919-cardboard', label: '1919 · cardboard temporary', period: [1919, 1919],
    recipe: recipe('early-1919-card', '1919 cardboard temporary', { w: 330, h: 140, bg: '#0e111c', ink: '#96c733' }, '1918-1923', {
      embossed: false, rim: null, holes: 'none',
      art: [{ art: 'bc-arms', x: 330 * 0.1, y: 140 * 0.3, width: 330 * 0.16, height: 140 * 0.34, color: '#96c733' }],
      legends: [
        { text: 'B. C.', x: 330 * 0.18, baseline: 140 * 0.27, cap: 140 * 0.14, die: 'bc-legend-condensed', role: 'legend' },
        { text: '1919', x: 330 * 0.18, baseline: 140 * 0.9, cap: 140 * 0.16, die: 'bc-block-1918', role: 'year' },
      ],
      serial: { x: 330 * 0.63, baseline: 140 * 0.86, cap: 140 * 0.7, maxWidth: 330 * 0.6, die: 'bc-block-1918' } }),
    grammar: plain(22000, 21501),
    description: 'Printed cardboard plates for numbers 21,501–22,000 while metal stock ran out. One survivor (21965) is known and its size is not recorded.' },
  { id: '1920', label: '1920 · steel', period: [1920, 1920], recipe: steel(1920, s1920, 'monogram'), grammar: plain(30000),
    description: 'A new yellow on black base with the monogram (no frame) and four rivet holes for the 1921 and 1922 tabs.' },
  { id: '1921-tab', label: '1921 · red tab', period: [1921, 1921],
    recipe: steel(1921, s1920, 'monogram', renewalTab(1921, s1920.w * 0.02, 7.5, 98, 120, '#9a1e1e', '#d8c8c4', true)), grammar: plain(35000),
    description: 'The 1920 base with a brilliant red 98 × 120 mm tab bolted over the monogram.' },
  { id: '1922-tab', label: '1922 · green tab', period: [1922, 1922],
    recipe: steel(1922, s1920, 'monogram', renewalTab(1922, s1920.w * 0.02, 7.5, 98, 120, '#3f6a50', '#d9d0a8', true)), grammar: plain(40000),
    description: 'The 1920 base with a green tab; known high 39-397.' },
  { id: '1923', label: '1923 · steel', period: [1923, 1923], recipe: steel(1923, { w: 361, h: 135, bg: '#3b4c35', ink: '#d6af19' }, 'letters'), grammar: plain(41000),
    description: 'Yellow on green with plain BC capitals instead of the monogram; numbers allotted in blocks per office.' },
  ...annual.map(([year, b, die, dashYear, bar, hi]): EarlySpec => ({ id: String(year), label: String(year), period: [year, year],
    recipe: annual1924(year, b, die, dashYear, bar), grammar: dashed(hi),
    description: annualNotes[year] ?? 'Annual steel plate with BRITISH COLUMBIA along the bottom and a small date beside the number.' })),
  ...longBases.map(([year, b, die, lo, hi]): EarlySpec => ({ id: `${year}-long`, label: `${year} · long base`, period: [year, year],
    recipe: annual1924(year, b, die, year === 1930, false, true), grammar: dashed(hi, lo),
    description: 'Six-figure numbers were stamped on a longer base; its length is not stated, so it is estimated from photo proportions.' })),
  ...late.map(([year, b, hi]): EarlySpec => ({ id: String(year), label: String(year), period: [year, year],
    recipe: annual1936(year, b), grammar: dashed(hi),
    description: year === 1936 ? 'Smaller plates with the two-figure year stacked at far right; four-figure numbers carry a long leading bar. A C prefix moved commercial trucks off the passenger series.'
      : year === 1937 ? 'The 37 stamp was redesigned against counterfeiting; slanted dies with an oval 0.' : 'Annual plate with a stacked year at far right.' })),
];

export const bcEarlyFormats: PlateFormat[] = specs.map((s) => kitFormat({
  id: s.id, label: s.label, family: 'passenger', period: s.period, era: s.period[0] < 1913 ? 'owner-1904' : s.period[0] < 1918 ? 'enamel-1913' : s.period[0] < 1924 ? 'steel-1918' : 'annual-1924',
  ...(s.status ? { status: s.status } : {}), recipe: s.recipe, grammar: s.grammar, description: s.description,
})).flatMap((format) => format.id === '1904-leather' ? bcLeatherFormats : [format]);
