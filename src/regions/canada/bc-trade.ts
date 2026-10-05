/**
 * B.C. dealer & trade, industrial and carrier plates: Dealer (Demonstration),
 * Manufacturer, Repairer, Transporter; Industrial Vehicle, Logging Truck,
 * Restricted, Off-Road and Special Agreement; Motor Carrier, Passenger Carrier,
 * Motive Fuel, Prorate, Reciprocity and a possible temporary X plate.
 * Facts come from the BCpl8s class chapters (see each recipe's source); layout
 * fractions and colours were read from the photographs those chapters show.
 * Class plates share the passenger bases of their period, so the 1964–78
 * annual, 1979 and flag geometry follows the passenger recipes.
 */
import type { PlateEra, PlateFamily, PlateFormat, PlateStatus } from '../../core/types';
import type { KitArt, KitDecal, KitFontText, KitRecipe, KitSerial, KitText } from '../../templates/bc/kit';
import { registerDash, registerLetterBox } from '../../templates/bc/art-trade';
import { dieProfile } from '../../templates/dies/profiles';
import { dieRunWidth } from '../../templates/dies/engine';
import { kitFormat, type KitPalette, type SerialGrammar } from './bc-kit';

const page = (name: string, file: string) => ({ title: `BCpl8s · ${name}`, url: `https://www.bcpl8s.ca/${file}` });
const SRC = {
  dealer: page('Dealer', 'Dealer.htm'), dealerMc: page('Motorcycle Dealer', 'Dealer-Motorcycle.htm'),
  manufacturer: page('Manufacturer', 'Manufacturer.htm'), repairer: page('Repairer', 'Repairer.htm'), transporter: page('Transporter', 'Transporter.htm'),
  industrial: page('Industrial Vehicle', 'IndustrialVehicle.htm'), logging: page('Logging Truck', 'Logging.htm'),
  restricted: page('Restricted', 'Restricted.html'), offRoad: page('Off-Road Vehicle', 'Off-Road.html'), sa: page('Special Agreement', 'SpecialAgreement.htm'),
  carrier: page('Motor Carrier', 'MotorCarrier.htm'), passengerCarrier: page('Passenger Carrier', 'PassengerCarrier.html'),
  fuel: page('Motive Fuel', 'MotiveFuel.htm'), prorate: page('Prorate', 'Prorate.htm'), cavr: page('Prorate · CAVR', 'Prorate-CAVR.html'),
  reciprocity: page('Reciprocity', 'Reciprocity.htm'), temporary: page('Temporary Permits', 'Temporary-Permits.html'),
};
const NOTE = 'Class-plate reconstruction from BCpl8s photographs: layout proportions, paint colours and dies are approximate, and legends use the nearest reconstructed legend die. Validation checks the documented serial format and ranges, not a real registration.';
const SMALL_NOTE = 'Small-plate reconstruction. BCpl8s gives no size for this plate; it is drawn at the documented 5 × 8 in (203 × 127 mm) B.C. small-plate size, which matches the photographed proportions. Layout, colours and dies are approximate.';

// ── Serial grammars: a prefix/suffix around a formatted number in documented ranges ──
type Fmt = (n: number) => string;
/** Dash before the last three figures once there are four or more (9-999, 99-999). */
const dash3: Fmt = (n) => { const t = String(n); return t.length > 3 ? `${t.slice(0, -3)}-${t.slice(-3)}` : t; };
const plain: Fmt = (n) => String(n);
/** Zero-padded to `digits`, with a dash `dashAt` figures from the right (0 = none). */
const fixed = (digits: number, dashAt = 0): Fmt => (n) => { const t = String(n).padStart(digits, '0'); return dashAt ? `${t.slice(0, -dashAt)}-${t.slice(-dashAt)}` : t; };
interface Run { prefix?: string; suffix?: string; from: number; to: number; fmt: Fmt }
function runs(hint: string, ...list: Run[]): SerialGrammar {
  const show = (r: Run, n: number) => `${r.prefix ?? ''}${r.fmt(n)}${r.suffix ?? ''}`;
  return { blocks: [], hint, custom: {
    generate: (rng) => { const r = rng.pick(list); return show(r, rng.int(r.from, r.to)); },
    test: (serial) => list.some((r) => {
      const p = r.prefix ?? '', x = r.suffix ?? '';
      if (serial.length <= p.length + x.length || !serial.startsWith(p) || !serial.endsWith(x)) return false;
      const body = serial.slice(p.length, serial.length - x.length);
      if (!/^\d+(?:-\d+)?$/.test(body)) return false;
      const n = Number(body.replace('-', ''));
      return n >= r.from && n <= r.to && show(r, n) === serial;
    }),
  } };
}
const each = (prefixes: string, run: Omit<Run, 'prefix'>): Run[] => [...prefixes].map((p) => ({ ...run, prefix: p }));

// ── Small helpers ──────────────────────────────────────────────────────────
interface Base { w: number; h: number; bg: string; ink: string }
const B300 = (bg: string, ink: string): Base => ({ w: 300, h: 150, bg, ink });
const B302 = (bg: string, ink: string): Base => ({ w: 302, h: 150, bg, ink });
const SMALL = (bg: string, ink: string): Base => ({ w: 203, h: 127, bg, ink });
function t(text: string, x: number, baseline: number, cap: number, die: string, o: Partial<KitText> = {}): KitText {
  return { text, x, baseline, cap, die, role: o.role ?? `legend-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, ...o };
}
const serif = (text: string, x: number, baseline: number, size: number, color: string, o: Partial<KitFontText> = {}): KitFontText =>
  ({ text, x, baseline, size, font: 'serif', color, role: o.role ?? `legend-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, ...o });
const pal = (year: number, bg: string, ink: string, words: string): KitPalette => ({ id: String(year), label: `${year} · ${words}`, background: bg, ink, year });
const stacked = (chars: string, x: number, from: number, step: number, cap: number, die: string, role: string): KitText[] =>
  [...chars].map((c, i) => ({ text: c, x, baseline: from + i * step, cap, die, role: `${role}-${i}` }));
const DOT = { kind: 'dot' } as const, GAP = { kind: 'gap' } as const;

function recipe(id: string, label: string, b: Base, source: KitRecipe['source'], rest: Partial<KitRecipe> & Pick<KitRecipe, 'serial' | 'legends'>): KitRecipe {
  return { id, label, width: b.w, height: b.h, radius: 6, background: b.bg, ink: b.ink, rim: { inset: 3.5, width: 1.4 }, holes: 'slots',
    holeAt: { x: [0.21, 0.79], y: [9 / b.h, 1 - 9 / b.h] }, embossed: true, source, note: NOTE, ...rest };
}
function small(id: string, label: string, b: Base, source: KitRecipe['source'], rest: Partial<KitRecipe> & Pick<KitRecipe, 'serial' | 'legends'>): KitRecipe {
  return recipe(id, label, b, source, { radius: 5, rim: { inset: 3, width: 1.2 }, holeAt: { x: [0.2, 0.8], y: [0.06, 0.94] }, note: SMALL_NOTE, ...rest });
}

// ── 1955–78 annual layouts on the 300 mm base ───────────────────────────────
interface AnnualOpts {
  top?: string; year?: 'split-top' | 'top-right' | 'bottom-right'; bottom: 'whole' | 'split';
  serialDie: string; legendDie: string; separator?: KitSerial['separator']; topCap?: number;
}
/** Top legend (BEAUTIFUL, a class word or an expiry date), serial, BRITISH COLUMBIA below; the year where the base puts it. */
function annual(id: string, label: string, b: Base, source: KitRecipe['source'], o: AnnualOpts, rest: Partial<KitRecipe> = {}): KitRecipe {
  const w = b.w, L = o.legendDie, cap = o.topCap ?? 15, legends: KitText[] = [];
  if (o.top) legends.push(t(o.top, w / 2, 27, cap, L, { maxWidth: o.year ? 196 : 230, role: 'top-legend' }));
  if (o.year === 'split-top') legends.push(t('19', 25, 27, 15, L, { role: 'century' }), t('{yy}', w - 25, 27, 15, L, { role: 'year' }));
  if (o.year === 'top-right') legends.push(t('{yy}', w - 26, 27, 15, L, { role: 'year' }));
  const low = o.year === 'bottom-right';
  if (o.bottom === 'whole') legends.push(t('BRITISH COLUMBIA', low ? w / 2 - 17 : w / 2, 138, 15, L, { maxWidth: low ? 218 : 236, spread: true, role: 'province' }));
  else legends.push(t('BRITISH', 80, 138, 15, L, { maxWidth: 92, role: 'province-left' }), t('COLUMBIA', 206, 138, 15, L, { maxWidth: 112, role: 'province-right' }));
  if (low) legends.push(t('{yy}', w - 23, 138, 17, L, { role: 'year' }));
  return recipe(id, label, b, source, { legends, serial: { x: w / 2, baseline: 106, cap: 70, maxWidth: w - 26, die: o.serialDie, separator: o.separator ?? DOT }, ...rest });
}
/** 1960s–78 Manufacturer / Transporter: B and C stacked at left, class word along the bottom, year at bottom right. */
function stackedBC(id: string, label: string, b: Base, source: KitRecipe['source'], word: string, serialDie: string, legendDie: string): KitRecipe {
  return recipe(id, label, b, source, {
    legends: [...stacked('BC', 22, 62, 38, 28, legendDie, 'bc'),
      t(word, 128, 139, 17, legendDie, { maxWidth: 206, spread: true, role: 'class-word' }), t('{yy}', 274, 139, 15, legendDie, { role: 'year' })],
    serial: { x: 166, baseline: 108, cap: 72, maxWidth: 236, die: serialDie, separator: DOT },
  });
}

// ── 1979 base (class plates red, industrial green): legend top, BRITISH [decal] COLUMBIA below ──
const DIES_1979 = [{ id: 'bc-acme-1979', label: 'ACME (1979 bloc)' }, { id: 'bc-hisigns-1982', label: 'Hi-Signs (later blocs)' }];
function base1979(id: string, label: string, b: Base, source: KitRecipe['source'], top: string | null, separator: KitSerial['separator'] = { kind: 'dash' }, topText: Partial<KitText> = {}): KitRecipe {
  const L = 'bc-legend-acme';
  return recipe(id, label, b, source, {
    radius: 8, rim: { inset: 4, width: 1.5 }, holeAt: { x: [0.21, 0.79], y: [0.06, 0.94] },
    legends: [...(top ? [t(top, 150, 26, 15, L, { maxWidth: 190, role: 'top-legend', ...topText })] : []),
      t('BRITISH', 50, 138, 15, L, { maxWidth: 76, spread: true, role: 'province-left' }), t('COLUMBIA', 250, 138, 15, L, { maxWidth: 82, spread: true, role: 'province-right' })],
    serial: { x: 150, baseline: 101, cap: 70, maxWidth: 274, die: 'bc-acme-1979', separator },
    decal: { x: 96, y: 111, width: 108, height: 33 },
  });
}

// ── Flag base (1985–): serif slogan or class word, serial split by the flag ──
const SERIAL_BLUE = '#1a45a0', LEGEND_BLUE = '#2b7cd1', SHEETING = '#eef2f5', RIM = '#c5cfda';
const FLAG_WELL: KitDecal = { x: 94.5, y: 115, width: 112.5, height: 29, rx: 2 };
const FLAG_ART: KitArt = { art: 'bc-spirit-flag', x: 0, y: 63, width: 42, height: 32 };
const DIES_FLAG = [{ id: 'bc-astro-3', label: 'Astrographic · non-passenger dies' }, { id: 'bc-astro-4', label: 'Astrographic · Classic' }, { id: 'bc-waldale', label: 'Waldale' }];
const FLANKS = (color = LEGEND_BLUE): KitFontText[] => [serif('British', 51, 127, 13, color, { weight: 700, role: 'province-left' }), serif('Columbia', 250, 127, 13, color, { weight: 700, role: 'province-right' })];
interface FlagOpts { classWord?: { text: string; width: number }; sloganColor?: string; serialColor?: string; extra?: Partial<KitRecipe> }
/** The passenger flag base; a class word (DEMONSTRATION, APPORTIONED …) replaces the slogan and adds small serif British / Columbia either side of the well. */
function flagBase(id: string, label: string, source: KitRecipe['source'], o: FlagOpts = {}): KitRecipe {
  const fontLegends = o.classWord
    ? [serif(o.classWord.text, 150, 38, 20, LEGEND_BLUE, { width: o.classWord.width, role: 'class-word' }), ...FLANKS()]
    : [serif('Beautiful British Columbia', 150, 39, 19.5, o.sloganColor ?? LEGEND_BLUE, { width: 237, role: 'slogan' })];
  return {
    id, label, width: 300, height: 150, radius: 7, background: SHEETING, ink: o.serialColor ?? SERIAL_BLUE,
    rim: { inset: 4.5, width: 1.2, color: RIM }, holes: 'slots', holeAt: { x: [0.21, 0.79], y: [0.113, 0.88] },
    legends: [], fontLegends,
    serial: { x: 150, baseline: 109.5, cap: 64, maxWidth: 268, die: 'bc-astro-3', separator: { kind: 'art', gap: 2.5, art: FLAG_ART } },
    decal: FLAG_WELL, embossed: true, source,
    note: 'Flag-base reconstruction: flat screened legends and flag, embossed serial. Serif legends use a stand-in typeface; flag artwork, paint and dies are approximate. Validation checks the documented format and ranges, not a real registration.',
    ...o.extra,
  };
}

// ── Palettes shared by annual class plates (they followed the passenger colours until 1971) ──
const PASSENGER_196X = (year: number): KitPalette => year === 1967 ? pal(1967, '#f2f1e9', '#bb2737', 'red on white')
  : year % 2 ? pal(year, '#245993', '#f1f0e7', 'white on blue') : pal(year, '#f2f1e9', '#20538e', 'blue on white');

// ════════════════════════════════════════════════════════════════════════════
// DEALER & TRADE
// ════════════════════════════════════════════════════════════════════════════
const p1913 = { w: 305, h: 167 };
const dealer1913 = recipe('trade-dealer-1913', '1913 Dealer · porcelain', { ...p1913, bg: '#e6ecee', ink: '#262626' }, SRC.dealer, {
  embossed: false, rim: null, radius: 5, holeAt: { x: [0.2, 0.8], y: [0.06] },
  shapes: [{ kind: 'line', x1: p1913.w * 0.835, y1: p1913.h * 0.07, x2: p1913.w * 0.835, y2: p1913.h * 0.95, strokeWidth: 2.4 },
    ...[[0.025, 0.06], [0.975, 0.06], [0.025, 0.94], [0.975, 0.94]].map(([x, y]) => ({ kind: 'circle' as const, cx: p1913.w * x, cy: p1913.h * y, r: 2.2, fill: '#1c1c1c', stroke: '#9a9a90', strokeWidth: 0.8 }))],
  legends: stacked('1913', p1913.w * 0.92, p1913.h * 0.26, p1913.h * 0.22, p1913.h * 0.17, 'bc-porcelain-1913', 'year'),
  serial: { x: p1913.w * 0.42, baseline: p1913.h * 0.9, cap: p1913.h * 0.77, maxWidth: p1913.w * 0.76, die: 'bc-porcelain-1913' },
  note: 'Porcelain reconstruction from BCpl8s photographs of D18 and D78: drawn at the 305 × 167 mm size of the 1913 passenger porcelain, which the photographed proportions match. Numerals are the 1913 porcelain die reconstruction.',
});
const b1950 = { w: 287, h: 137 };
const dealer1950 = recipe('trade-dealer-1950', '1950 Dealer', { ...b1950, bg: '#1b2022', ink: '#deb65c' }, SRC.dealer, {
  legends: [...stacked('50', b1950.w * 0.945, b1950.h * 0.36, b1950.h * 0.28, b1950.h * 0.24, 'bc-early-1940', 'year'),
    t('BRITISH COLUMBIA', b1950.w * 0.47, b1950.h * 0.92, b1950.h * 0.14, 'bc-legend-1940', { maxWidth: b1950.w * 0.86, spread: true, role: 'province' })],
  serial: { x: b1950.w * 0.45, baseline: b1950.h * 0.73, cap: b1950.h * 0.58, maxWidth: b1950.w * 0.84, die: 'bc-early-1940' },
});
const dealer1968 = annual('trade-dealer-1968', '1968–75 Dealer · 19 BEAUTIFUL yy', B300('#eceeec', '#202020'), SRC.dealer,
  { top: 'BEAUTIFUL', year: 'split-top', bottom: 'split', serialDie: 'bc-oakalla-1970', legendDie: 'bc-legend-1964' });
const dealer1976 = annual('trade-dealer-1976', '1976–78 Dealer · 19 BEAUTIFUL 76', B300('#d9deda', '#911b0a'), SRC.dealer,
  { top: 'BEAUTIFUL', year: 'split-top', bottom: 'whole', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973' });
const dealer1979 = base1979('trade-dealer-1979', '1979 Dealer · DEMONSTRATION', B300('#e8eff2', '#bf3b40'), SRC.dealer, 'DEMONSTRATION');
const dealerFlag = flagBase('trade-dealer-flag', 'Flag Dealer · DEMONSTRATION', SRC.dealer, { classWord: { text: 'DEMONSTRATION', width: 184 } });

// Motorcycle dealer plates on the small base.
const mcDealer1976 = small('trade-dealer-mc-1976', '1976 Motorcycle Dealer', SMALL('#dde2e6', '#b04c52'), SRC.dealerMc, {
  legends: [t('B.C.', 38, 34, 15, 'bc-legend-1973', { role: 'province' }), t('{yy}', 171, 34, 15, 'bc-legend-1973', { role: 'year' }),
    t('MOTORCYCLE', 101.5, 115, 16, 'bc-legend-1973', { maxWidth: 150, spread: true, role: 'class-word' })],
  serial: { x: 101.5, baseline: 92, cap: 50, maxWidth: 176, die: 'bc-oakalla-1973' },
});
const mcDealer1979 = small('trade-dealer-mc-1979', '1979 Motorcycle Dealer · M.C. / TRLR.', SMALL('#e2e1e5', '#8f4642'), SRC.dealerMc, {
  legends: [t('B.C.', 32, 32, 14, 'bc-legend-acme', { role: 'province' }), t('M.C.', 70, 117, 13, 'bc-legend-acme', { role: 'class-left' }), t('TRLR.', 135, 117, 13, 'bc-legend-acme', { role: 'class-right' })],
  fontLegends: [{ text: '/', x: 101.5, baseline: 117, size: 18, font: 'sans', weight: 600, role: 'class-slash' }],
  serial: { x: 101.5, baseline: 96, cap: 50, maxWidth: 180, die: 'bc-acme-1979', separator: DOT },
  decal: { x: 92, y: 8, width: 96, height: 30 },
});
const mcDealerFlag: KitRecipe = {
  ...small('trade-dealer-mc-flag', 'Flag Motorcycle Dealer · DM', SMALL(SHEETING, SERIAL_BLUE), SRC.dealerMc, {
    legends: [], serial: { x: 101.5, baseline: 88, cap: 50, maxWidth: 190, die: 'bc-astro-3', separator: { kind: 'art', gap: 2, art: { art: 'bc-spirit-flag', x: 0, y: 49, width: 30, height: 23 } } },
  }),
  rim: { inset: 3, width: 1, color: RIM }, holes: 'round', holeAt: { x: [0.07, 0.93], y: [0.1, 0.9] },
  fontLegends: [serif('Beautiful British Columbia', 101.5, 27, 13.5, LEGEND_BLUE, { width: 176, role: 'slogan' }),
    serif('M.C.', 36, 115, 11, SERIAL_BLUE, { weight: 700, role: 'class-left' }), serif('TRLR', 167, 115, 11, SERIAL_BLUE, { weight: 700, role: 'class-right' })],
  decal: { x: 55, y: 96, width: 93, height: 26 },
};

const manufacturer1968 = stackedBC('trade-manufacturer-1968', '1968–78 Manufacturer · MANUFACTURER', B300('#ece6e0', '#262f63'), SRC.manufacturer, 'MANUFACTURER', 'bc-oakalla-1970', 'bc-legend-1964');
const manufacturer1979 = base1979('trade-manufacturer-1979', '1979 Manufacturer', B300('#f0f0f0', '#d03030'), SRC.manufacturer, 'MANUFACTURER');
const manufacturerFlag = flagBase('trade-manufacturer-flag', 'Flag Manufacturer · MA', SRC.manufacturer, { classWord: { text: 'MANUFACTURER', width: 174 } });

const repairer1974 = annual('trade-repairer-1974', '1974–78 Repairer · 19 REPAIRER yy', B300('#f5faf8', '#c85710'), SRC.repairer,
  { top: 'REPAIRER', year: 'split-top', bottom: 'whole', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973', separator: GAP });
const repairer1979 = base1979('trade-repairer-1979', '1979 Repairer · REPAIRMAN', B300('#f0f0f0', '#d03030'), SRC.repairer, 'REPAIRMAN');
const repairmanFlag = flagBase('trade-repairer-flag', 'Flag Repairer · REPAIRMAN', SRC.repairer, { classWord: { text: 'REPAIRMAN', width: 136 } });
const repairerFlag = flagBase('trade-repairer-flag-1995', 'Flag Repairer · REPAIRER', SRC.repairer, { classWord: { text: 'REPAIRER', width: 124 } });

const transporter1964 = stackedBC('trade-transporter-1964', '1964–78 Transporter · TRANSPORTER', B300('#1a69a5', '#e0e0e0'), SRC.transporter, 'TRANSPORTER', 'bc-oakalla-1955', 'bc-legend-1964');
const transporter1979 = base1979('trade-transporter-1979', '1979 Transporter', B300('#f0f0f0', '#d03030'), SRC.transporter, 'TRANSPORTER');
const transporterFlag = flagBase('trade-transporter-flag', 'Flag Transporter · TR / TS', SRC.transporter, { classWord: { text: 'TRANSPORTER', width: 152 } });

const ANNUAL_DIES_70 = [{ id: 'bc-oakalla-1970', label: 'Oakalla (1970–72)' }, { id: 'bc-oakalla-1955', label: 'Oakalla (1955–69)' }, { id: 'bc-oakalla-1973', label: 'Oakalla (1973–77)' }];
const ANNUAL_DIES_73 = [{ id: 'bc-oakalla-1973', label: 'Oakalla (1973–77)' }, { id: 'bc-acme-1978', label: 'ACME (1978)' }];

interface Spec { id: string; label: string; family: string; era: string; period: [number, number]; recipe: KitRecipe; grammar: SerialGrammar; description: string; references?: PlateFormat['references'];
  palettes?: KitPalette[]; dies?: { id: string; label?: string }[]; decals?: [number, number]; status?: PlateStatus }
const fmt = (s: Spec): PlateFormat => kitFormat({ ...s, ...(s.status ? { recipe: { ...s.recipe, status: s.status } } : {}) });

const tradeSpecs: Spec[] = [
  { id: 'trade-dealer-1913', label: '1913 Dealer · porcelain', family: 'trade', era: 'trade-early', period: [1913, 1913], recipe: dealer1913,
    grammar: runs('D1–D120', { prefix: 'D', from: 1, to: 120, fmt: plain }),
    description: 'The first provincial Demonstration plates: black on white porcelain on heavy steel by McClary Manufacturing, with 1913 stacked behind a rule at the right and, unusually, no reference to the province. Five of each number were ordered (D1–D120 is the 1911 allocation; 1913 totals are unknown). Size assumed equal to the 1913 passenger porcelain.' },
  { id: 'trade-dealer-1950', label: '1950 Dealer', family: 'trade', era: 'trade-early', period: [1950, 1950], recipe: dealer1950,
    grammar: runs('D1–D1450 (1950 issue)', { prefix: 'D', from: 1, to: 1450, fmt: plain }),
    description: 'Dealer plates followed the passenger colours and layout of each year: in 1950 dark yellow on black with the year stacked at the right and BRITISH COLUMBIA below. The D is the same size as the figures and D1158 shows no separator. Size assumed equal to the 1950 short passenger/commercial base (287 × 137 mm).' },
  { id: 'trade-dealer-1968', label: '1968–75 Dealer · 19 BEAUTIFUL yy', family: 'trade', era: 'trade-annual', period: [1968, 1975], recipe: dealer1968,
    palettes: [pal(1970, '#f0ece2', '#1f5cb0', 'blue on white'), pal(1973, '#eeeeee', '#202020', 'black on white')], dies: ANNUAL_DIES_70,
    grammar: runs('D1–D9-000 (1969–75 blocks D1-001 … D9-000; raised dot)', { prefix: 'D', from: 1, to: 9000, fmt: dash3 }),
    description: 'Annual Dealer plates with the split date 19 … yy either side of BEAUTIFUL and a gap between BRITISH and COLUMBIA (1970 D3·362, 1973 D3·792). Issued D1-001 to D5-000 (1970), D1-001 to D5-500 (1973) and D5-001 to D9-000 (1974).' },
  { id: 'trade-dealer-1976', label: '1976–78 Dealer', family: 'trade', era: 'trade-annual', period: [1976, 1978], recipe: dealer1976,
    palettes: [pal(1976, '#e6e9e6', '#911b0a', 'red on white')], dies: ANNUAL_DIES_73,
    grammar: runs('D10-001–D23-000 (1976)', { prefix: 'D', from: 10001, to: 23000, fmt: dash3 }),
    description: 'The 1976 Dealer base (D10-001 to D23-000): red on white, 19 BEAUTIFUL 76 across the top and an unbroken BRITISH COLUMBIA below, as on D14·000. 1977–78 figures are unknown.' },
  { id: 'trade-dealer-1979', label: '1979 Dealer · DEMONSTRATION', family: 'trade', era: 'trade-1979', period: [1979, 1986], recipe: dealer1979, dies: DIES_1979, decals: [1980, 1986],
    grammar: runs('D50-000–D73-000 (photographed blocks D53-000 … D75-000; above D73-000 presumed unissued)', { prefix: 'D', from: 50000, to: 73000, fmt: dash3 }),
    description: 'Red on white 1979 base with DEMONSTRATION replacing BEAUTIFUL, BRITISH and COLUMBIA either side of the bottom-centre decal box. BCpl8s notes any plate above D73-000 is presumed never issued.' },
  { id: 'trade-dealer-flag', label: 'Flag Dealer · DEMONSTRATION', family: 'trade', era: 'trade-flag', period: [1985, 2026], recipe: dealerFlag, dies: DIES_FLAG, decals: [1985, 2023],
    grammar: runs('D0-0000 … D4-0099 (1985–94), flag after the first figure', { prefix: 'D', from: 0, to: 49999, fmt: fixed(5, 4) }),
    description: 'Flag base with DEMONSTRATION screened in place of the slogan and small serif British / Columbia either side of the decal well. D0-0000 to D2-5499 in 1985, reaching D4-0099 by 1994. Issued as singles.' },
  { id: 'trade-dealer-mc-1976', label: '1976 Motorcycle Dealer', family: 'trade', era: 'trade-annual', period: [1976, 1978], recipe: mcDealer1976,
    palettes: [pal(1976, '#dde2e6', '#b04c52', 'red on white')],
    grammar: runs('D1–D2000 (1972–78)', { prefix: 'D', from: 1, to: 2000, fmt: plain }),
    description: 'Motorcycle Dealer plate on the small base: B.C. and the year above a D-prefix number, MOTORCYCLE below (D601–D1600 issued in 1976).' },
  { id: 'trade-dealer-mc-1979', label: '1979 Motorcycle Dealer', family: 'trade', era: 'trade-1979', period: [1979, 1986], recipe: mcDealer1979, dies: DIES_1979, decals: [1980, 1985],
    grammar: runs('D1-000–D6-999 (D5·305 … D6·389 photographed; issue figures unknown)', { prefix: 'D', from: 1, to: 6999, fmt: dash3 }),
    description: 'Red on white small base with B.C. at top left, a decal box at top right and M.C. / TRLR. along the bottom (the plate served motorcycle and trailer dealers).' },
  { id: 'trade-dealer-mc-flag', label: 'Flag Motorcycle Dealer · DM', family: 'trade', era: 'trade-flag', period: [1985, 2026], recipe: mcDealerFlag, dies: DIES_FLAG, decals: [1985, 2023],
    grammar: runs('DM-0000–DM-2269 (1985–94)', { prefix: 'DM-', from: 0, to: 2269, fmt: fixed(4) }),
    description: 'Small flag base: “Beautiful British Columbia” above DM, the flag and four figures, with M.C. and TRLR either side of the decal well. DM-0000 to DM-2119 in 1985, DM-2120 to DM-2269 in 1994.' },
  { id: 'trade-manufacturer-1968', label: '1968–78 Manufacturer', family: 'trade', era: 'trade-annual', period: [1968, 1978], recipe: manufacturer1968,
    palettes: [pal(1970, '#ece6e0', '#262f63', 'dark blue on white'), pal(1976, '#eeeeee', '#c83030', 'red on white')], dies: ANNUAL_DIES_70,
    grammar: runs('1–999 (e.g. 501–700 in 1969, 1–125 in 1975)', { from: 1, to: 999, fmt: plain }),
    description: 'MANUFACTURER stamped across the bottom with B and C stacked at the left and the year at bottom right; plain numbers with no prefix.' },
  { id: 'trade-manufacturer-1979', label: '1979 Manufacturer', family: 'trade', era: 'trade-1979', period: [1979, 1986], recipe: manufacturer1979, dies: DIES_1979, decals: [1980, 1986],
    grammar: runs('1–999', { from: 1, to: 999, fmt: plain }),
    description: 'Red on white 1979 base with MANUFACTURER across the top and a bottom-centre decal box (e.g. 678). Issue figures unknown.' },
  { id: 'trade-manufacturer-flag', label: 'Flag Manufacturer · MA', family: 'trade', era: 'trade-flag', period: [1985, 2026], recipe: manufacturerFlag, dies: DIES_FLAG, decals: [1985, 2023],
    grammar: runs('MA-0000 … (MA-0000 to MA-0299 in 1985; MA0642 seen in 2021)', { prefix: 'MA-', from: 0, to: 999, fmt: fixed(4) }),
    description: 'Flag base with Manufacturer screened across the top, an MA prefix in the AA-0000 style and small serif British / Columbia either side of the well.' },
  { id: 'trade-repairer-1974', label: '1974–78 Repairer', family: 'trade', era: 'trade-annual', period: [1974, 1978], recipe: repairer1974,
    palettes: [pal(1974, '#f7fbfa', '#c85710', 'orange on white'), pal(1975, '#f5fbfa', '#095033', 'green on white'), pal(1976, '#f4f4f4', '#d83030', 'red on white')], dies: ANNUAL_DIES_73,
    grammar: runs('R80-001–R90-000 (1974–75), R1–R3-000 (1976)', { prefix: 'R', from: 80001, to: 90000, fmt: dash3 }, { prefix: 'R', from: 1, to: 3000, fmt: dash3 }),
    description: '19 REPAIRER yy across the top and BRITISH COLUMBIA below; the number is spaced rather than dashed (R80 331). The 1974 plate leaves a gap between BRITISH and COLUMBIA that is not drawn here.' },
  { id: 'trade-repairer-1979', label: '1979 Repairer · REPAIRMAN', family: 'trade', era: 'trade-1979', period: [1979, 1986], recipe: repairer1979, dies: DIES_1979, decals: [1980, 1986],
    grammar: runs('R9-999 / R99-999 (R11-980 photographed; issue figures unknown)', { prefix: 'R', from: 1, to: 29999, fmt: dash3 }),
    description: 'In 1979 the legend became the “rather un-inclusive” REPAIRMAN: red on white 1979 base with a bottom-centre decal box.' },
  { id: 'trade-repairer-flag', label: 'Flag Repairer · REPAIRMAN', family: 'trade', era: 'trade-flag', period: [1985, 1995], recipe: repairmanFlag, dies: DIES_FLAG, decals: [1985, 1996],
    grammar: runs('R0-0000–R1-3149 (1985–94)', { prefix: 'R', from: 0, to: 13149, fmt: fixed(5, 4) }),
    description: 'Flag base with REPAIRMAN in place of the slogan (R0·0800 1985, R0·4631 1994). R00-000 to R09-999 were allocated in 1985, reaching R13-149 in 1994.' },
  { id: 'trade-repairer-flag-1995', label: 'Flag Repairer · REPAIRER', family: 'trade', era: 'trade-flag', period: [1995, 2013], recipe: repairerFlag, dies: DIES_FLAG, decals: [1995, 2013],
    grammar: runs('R1-3150 onward (range not recorded)', { prefix: 'R', from: 13150, to: 19999, fmt: fixed(5, 4) }),
    description: 'REPAIRER was reinstated in the mid-1990s on the same flag base. No REPAIRER flag plate is photographed on BCpl8s; this is the REPAIRMAN layout with the documented word.' },
  { id: 'trade-transporter-1964', label: '1964–78 Transporter', family: 'trade', era: 'trade-annual', period: [1964, 1978], recipe: transporter1964,
    palettes: [pal(1965, '#1a69a5', '#e6e6e0', 'white on blue'), pal(1972, '#f0eeea', '#c0302a', 'red on white'), pal(1976, '#e4e9ec', '#b32d25', 'red on white')], dies: ANNUAL_DIES_70,
    grammar: runs('T1–T250 (1965), 1–350 (1964–73), 501–2700 (1975–76, raised dot)', { prefix: 'T', from: 1, to: 250, fmt: plain }, { from: 1, to: 350, fmt: plain }, { from: 501, to: 2700, fmt: dash3 }),
    description: 'TRANSPORTER across the bottom until 1979, with B and C stacked at the left and the year at bottom right. The 1965 plates carry a T prefix; later ones are plain numbers.' },
  { id: 'trade-transporter-1979', label: '1979 Transporter', family: 'trade', era: 'trade-1979', period: [1979, 1986], recipe: transporter1979, dies: DIES_1979, decals: [1980, 1986],
    grammar: runs('9-999 (5-977 photographed)', { from: 1, to: 9999, fmt: dash3 }),
    description: 'From 1979 TRANSPORTER moved to the top of the red on white base, with a bottom-centre decal box.' },
  { id: 'trade-transporter-flag', label: 'Flag Transporter · TR / TS', family: 'trade', era: 'trade-flag', period: [1985, 2026], recipe: transporterFlag, dies: DIES_FLAG, decals: [1985, 2023],
    grammar: runs('TR-0000–TR-9999 (1985–2022), TS-0000 on (2022)', { prefix: 'TR-', from: 0, to: 9999, fmt: fixed(4) }, { prefix: 'TS-', from: 0, to: 2999, fmt: fixed(4) }),
    description: 'Flag base with TRANSPORTER across the top and small serif British / Columbia below. TR-0000 to TR-5999 from 1985, then to TR-9999; the TS series began in 2022.' },
];

// ════════════════════════════════════════════════════════════════════════════
// INDUSTRIAL, LOGGING, RESTRICTED, OFF-ROAD, SPECIAL AGREEMENT
// ════════════════════════════════════════════════════════════════════════════
const industrial1957 = recipe('industrial-x-1957', '1957 Industrial Vehicle', B302('#e7e8f2', '#1b2650'), SRC.industrial, {
  legends: [t('BRITISH COLUMBIA', 128, 139, 18, 'bc-legend-1955', { maxWidth: 228, spread: true, role: 'province' }), t('{yy}', 275, 139, 19, 'bc-legend-1955', { role: 'year' })],
  serial: { x: 151, baseline: 104, cap: 76, maxWidth: 276, die: 'bc-oakalla-1955', separator: DOT },
});
const industrial1958 = recipe('industrial-xh-1958', '1958 Industrial · XH centenary', B302('#e4cb42', '#316a32'), SRC.industrial, {
  legends: [t('BRITISH COLUMBIA', 151, 29, 17, 'bc-legend-1955', { maxWidth: 266, spread: true, role: 'province' }),
    t('1858', 30, 140, 12, 'bc-legend-1955', { role: 'year-left' }), t('CENTENARY', 151, 140, 13, 'bc-legend-1955', { maxWidth: 150, spread: true, role: 'centenary' }), t('1958', 272, 140, 12, 'bc-legend-1955', { role: 'year-right' })],
  serial: { x: 151, baseline: 118, cap: 74, maxWidth: 276, die: 'bc-oakalla-1955', separator: DOT },
});
const industrial1964 = annual('industrial-x-1964', '1964–71 Industrial Vehicle', B302('#eeeeee', '#3080c0'), SRC.industrial,
  { top: 'BEAUTIFUL', year: 'bottom-right', bottom: 'whole', serialDie: 'bc-oakalla-1955', legendDie: 'bc-legend-1964' });
const industrial1972 = annual('industrial-x-1972', '1972–73 Industrial Vehicle', B302('#eeeeee', '#202020'), SRC.industrial,
  { top: 'BEAUTIFUL', year: 'split-top', bottom: 'split', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973' });
const industrial1976: KitRecipe = {
  ...annual('industrial-x-1976', '1976 base Industrial Vehicle', B302('#f0f0f0', '#e87030'), SRC.industrial,
    { top: 'BEAUTIFUL', year: 'bottom-right', bottom: 'whole', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973' }),
  // L-shaped embossed rules close off a decal box in each top corner.
  shapes: [{ kind: 'line', x1: 4, y1: 33, x2: 72, y2: 33, strokeWidth: 1.4 }, { kind: 'line', x1: 72, y1: 33, x2: 72, y2: 4, strokeWidth: 1.4 },
    { kind: 'line', x1: 230, y1: 33, x2: 298, y2: 33, strokeWidth: 1.4 }, { kind: 'line', x1: 230, y1: 33, x2: 230, y2: 4, strokeWidth: 1.4 }],
};
industrial1976.legends = industrial1976.legends.map((l) => l.role === 'year' ? { ...l, cap: 12, x: 277 } : l);
const industrial1979 = base1979('industrial-x-1979', '1979 Industrial Vehicle', B300('#eef2ee', '#30a070'), SRC.industrial, 'BEAUTIFUL');
const industrialFlag = flagBase('industrial-x-flag', 'Flag Industrial Vehicle · X', SRC.industrial);

const b1938 = { w: 286, h: 136 };
const loggingPF = recipe('industrial-logging-pf-1938', '1938 Forestry Department · PF', { ...b1938, bg: '#4d362f', ink: '#f6ebb0' }, SRC.logging, {
  holeAt: { x: [0.22, 0.77], y: [0.1, 0.9] }, rim: { inset: 3, width: 1.6 },
  legends: [...stacked('38', b1938.w * 0.93, b1938.h * 0.36, b1938.h * 0.22, b1938.h * 0.19, 'bc-tacey-1936', 'year'),
    t('BRITISH COLUMBIA', b1938.w * 0.505, b1938.h * 0.85, b1938.h * 0.12, 'bc-legend-1924', { maxWidth: b1938.w * 0.87, spread: true, role: 'province' })],
  serial: { x: b1938.w * 0.465, baseline: b1938.h * 0.65, cap: b1938.h * 0.48, maxWidth: b1938.w * 0.8, die: 'bc-tacey-1936' },
  note: 'Only a rusted 1938 PF-91 is known, so the colours are ASSUMED to be the 1938 passenger brown and cream; the layout and 286 × 136 mm size follow the 1938 passenger base the plate is stamped on.',
});
const logging1961 = annual('industrial-logging-1961', '1961–62 Logging · EXPIRES', B302('#e4abac', '#4e282e'), SRC.logging,
  { top: 'EXPIRES 31-8-{yy}', year: 'bottom-right', bottom: 'whole', serialDie: 'bc-oakalla-1955', legendDie: 'bc-legend-1955', topCap: 13 });
const logging1963 = annual('industrial-logging-1963', '1963–71 Logging · EXP.', B302('#214d93', '#e8dfce'), SRC.logging,
  { top: 'EXP. 31-8-{yy}', year: 'bottom-right', bottom: 'whole', serialDie: 'bc-oakalla-1955', legendDie: 'bc-legend-1964', topCap: 13 });
const logging1972 = annual('industrial-logging-1972', '1972–79 Logging · EXP.', B302('#dde2df', '#2e6a55'), SRC.logging,
  { top: 'EXP. 31-8-{yy}', bottom: 'whole', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973', topCap: 13 });
const logging1980 = annual('industrial-logging-1980', '1980–83 Logging · EXP', B300('#ecebdd', '#c26333'), SRC.logging,
  { top: 'EXP 30-6-{yy}', bottom: 'whole', serialDie: 'bc-acme-1979', legendDie: 'bc-legend-acme', topCap: 13 });
const logging1984 = base1979('industrial-logging-1984', '1984 Logging · EXP. 30.06.84', B300('#f2f0ee', '#d9642e'), SRC.logging, 'EXP. 30.06.84', DOT, { cap: 13, maxWidth: 120 });
const loggingStrip = flagBase('industrial-logging-1985', '1985–88 Logging · expiry strip', SRC.logging, { extra: {
  // Reverse-printed strip across the top instead of the slogan; the legend is set with a die so the year can change.
  art: [{ art: 'trade-solid', x: 58, y: 18, width: 200, height: 21, color: '#1c2486', role: 'expiry-strip' }],
  legends: [t('EXPIRES JUNE 30 - {yyyy}', 158, 34, 11, 'bc-legend-condensed', { maxWidth: 186, color: '#f4f6f8', role: 'expiry' })],
  fontLegends: FLANKS('#1c2486'),
} });
const loggingFlag = flagBase('industrial-logging-flag', 'Flag Logging · T', SRC.logging);

const restricted = small('industrial-restricted', 'Restricted · RESTRICTED bar', SMALL('#e9ecec', '#b01f33'), SRC.restricted, {
  radius: 7, rim: null, holes: 'round', holeAt: { x: [0.1, 0.9], y: [0.1, 0.9] },
  art: [{ art: 'trade-solid', x: 0, y: 0, width: 203, height: 29, color: '#b02030', role: 'restricted-bar' }],
  legends: [],
  fontLegends: [serif('RESTRICTED', 101.5, 22, 17, '#f8f8f8', { weight: 700, width: 120, role: 'class-word' }), serif('B.C.', 25, 104, 14, '#b01f33', { weight: 700, role: 'province' })],
  serial: { x: 101.5, baseline: 82, cap: 44, maxWidth: 188, die: 'bc-astro-3', separator: GAP },
  decal: { x: 55, y: 92, width: 108, height: 29 },
  note: `${SMALL_NOTE} The Waldale version adds a white band round the RESTRICTED bar; not drawn.`,
});
const offRoad = small('industrial-off-road', 'Off-Road Vehicle', SMALL('#fbfafb', '#26262c'), SRC.offRoad, {
  radius: 7, rim: null, holeAt: { x: [0.15, 0.85], y: [0.07, 0.93] },
  art: [{ art: 'trade-solid', x: 0, y: 0, width: 203, height: 26, color: '#3c4fa8', role: 'orv-bar' },
    { art: 'bc-logo-wordmark', x: 160, y: 90, width: 36, height: 24.5, role: 'bc-mark' }],
  legends: [t('OFF ROAD VEHICLE', 101.5, 20, 12, 'bc-legend-condensed', { maxWidth: 130, color: '#ffffff', role: 'class-word' }), t('BC', 22, 110, 11, 'bc-legend-condensed', { role: 'province' })],
  serial: { x: 101.5, baseline: 86, cap: 50, maxWidth: 190, die: 'bc-waldale' },
  decal: { x: 76, y: 94, width: 76, height: 27 }, extraWells: [{ x: 40, y: 94, width: 32, height: 27 }],
});

const saSplit = annual('industrial-sa-1973', '1973–75 Special Agreement · GR / CL', B300('#0d6fb1', '#e6d356'), SRC.sa,
  { top: 'BEAUTIFUL', year: 'split-top', bottom: 'split', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973' });
const saWhole = annual('industrial-sa-1976', '1976–78 Special Agreement · GR / CL', B300('#e4e6e4', '#bd2b1d'), SRC.sa,
  { top: 'BEAUTIFUL', year: 'split-top', bottom: 'whole', serialDie: 'bc-oakalla-1973', legendDie: 'bc-legend-1973' });
const sa1979 = base1979('industrial-sa-1979', '1979 Special Agreement', B300('#ecebf0', '#b0324c'), SRC.sa, null);
const saFlag = flagBase('industrial-sa-flag', 'Flag Special Agreement · SA', SRC.sa);
const SA_RUNS: Run[] = [{ prefix: 'GR', from: 1, to: 400, fmt: fixed(3) }, { prefix: 'CL', from: 501, to: 800, fmt: fixed(3) }];

const industrialSpecs: Spec[] = [
  { id: 'industrial-x-1957', label: '1957–63 Industrial Vehicle · X', family: 'industrial', era: 'industrial-annual', period: [1957, 1963], recipe: industrial1957,
    palettes: [pal(1957, '#e7e8f2', '#1b2650', 'dark blue on white')],
    grammar: runs('X1–X9-999 (raised dot; 1957–63 figures unknown)', { prefix: 'X', from: 1, to: 9999, fmt: dash3 }),
    description: 'Industrial Vehicle plates are “easily identifiable by their X prefix”; they took the annual colours of other types. 1957: dark blue on white, BRITISH COLUMBIA 57 along the bottom. Size is the documented 302 × 150 mm commercial base of the period.' },
  { id: 'industrial-xh-1958', label: '1958 Industrial · XH centenary', family: 'industrial', era: 'industrial-annual', period: [1958, 1959], recipe: industrial1958,
    grammar: runs('XH1–XH999', { prefix: 'XH', from: 1, to: 999, fmt: plain }),
    description: 'XH plates (dump trucks) are only known for the late 1950s, e.g. XH·896 on the 1958 centenary base with BRITISH COLUMBIA above and 1858 CENTENARY 1958 below. Colours are the 1958 passenger green on yellow.' },
  { id: 'industrial-x-1964', label: '1964–71 Industrial Vehicle', family: 'industrial', era: 'industrial-annual', period: [1964, 1971], recipe: industrial1964,
    palettes: [pal(1964, '#eeeeee', '#3080c0', 'blue on white'), ...[1965, 1966, 1967, 1968, 1969].map(PASSENGER_196X)],
    grammar: runs('X1–X4-500 (1964–71)', { prefix: 'X', from: 1, to: 4500, fmt: dash3 }),
    description: 'BEAUTIFUL across the top, BRITISH COLUMBIA with the year below (X645, 1964). Only 1964 is photographed; the 1965–69 palettes follow the passenger colours, which BCpl8s says every class used until 1971.' },
  { id: 'industrial-x-1972', label: '1972–73 Industrial Vehicle', family: 'industrial', era: 'industrial-annual', period: [1972, 1973], recipe: industrial1972,
    palettes: [pal(1973, '#eeeeee', '#202020', 'black on white')], dies: ANNUAL_DIES_70,
    grammar: runs('X35-001–X41-700 (1972–73)', { prefix: 'X', from: 35001, to: 41700, fmt: dash3 }),
    description: '19 BEAUTIFUL 73 across the top and a gap between BRITISH and COLUMBIA (X38·357). X35-001 to X40-000 (1972) and X35-001 to X41-700 (1973).' },
  { id: 'industrial-x-1976', label: '1976 base Industrial Vehicle', family: 'industrial', era: 'industrial-decal', period: [1976, 1978], recipe: industrial1976,
    palettes: [pal(1976, '#f0f0f0', '#e87030', 'orange on white')], dies: ANNUAL_DIES_73,
    grammar: runs('X00-001–X10-000 (1976)', { prefix: 'X', from: 1, to: 10000, fmt: fixed(5, 3) }),
    description: 'The 1976 base (used 1976–78): BEAUTIFUL between two L-shaped decal boxes in the top corners, BRITISH COLUMBIA and a small 76 below, orange on white. The 1974 and 1975 bases (X35-001–X50-000) are not photographed and are not drawn.' },
  { id: 'industrial-x-1979', label: '1979 Industrial Vehicle', family: 'industrial', era: 'industrial-decal', period: [1979, 1986], recipe: industrial1979, dies: DIES_1979, decals: [1980, 1986],
    grammar: runs('X50-000–X73-999 (1979 and 1983 blocs)', { prefix: 'X', from: 50000, to: 73999, fmt: fixed(5, 3) }),
    description: 'Green on white 1979 base with BEAUTIFUL across the top. The first bloc (X50-000 to X69-999) was made by Acme Signalisation of Quebec, the 1983 bloc (X70-000 to X73-999) by High Signs of Alberta.' },
  { id: 'industrial-x-flag', label: 'Flag Industrial Vehicle · X', family: 'industrial', era: 'industrial-flag', period: [1985, 2026], recipe: industrialFlag, dies: DIES_FLAG, decals: [1985, 2023],
    grammar: runs('X0-0000–X2-9449 (1985–94)', { prefix: 'X', from: 0, to: 29449, fmt: fixed(5, 4) }),
    description: 'The standard “Beautiful British Columbia” flag base with no class legend; only the X prefix identifies it. X0-0000 to X1-4999 in 1985, reaching X2-9449 in 1994.' },
  { id: 'industrial-logging-pf-1938', label: '1938 Forestry Department · PF', family: 'industrial', era: 'industrial-annual', period: [1938, 1939], recipe: loggingPF,
    grammar: runs('PF-1–PF-99', { prefix: 'PF-', from: 1, to: 99, fmt: plain }),
    description: 'PF plates were for vehicles belonging to the Forestry Department, stamped on the 1938 base (PF-91). The one known example is rusted; colours are assumed to be the 1938 passenger colours.' },
  { id: 'industrial-logging-1961', label: '1961–62 Logging · EXPIRES', family: 'industrial', era: 'industrial-annual', period: [1961, 1962], recipe: logging1961,
    palettes: [pal(1961, '#e4abac', '#4e282e', 'maroon on pink'), pal(1962, '#54282e', '#dfb2ae', 'pink on maroon')],
    grammar: runs('T1–T59-999 (quarterly blocks from T1, T25-000, T50-000)', { prefix: 'T', from: 1, to: 59999, fmt: dash3 }),
    description: 'Quarterly Logging Truck plates distinguished by the full word EXPIRES and a date at the top (EXPIRES 31-8-61), BRITISH COLUMBIA and the year below. The date is fixed at the photographed 31 August quarter; other quarters differ. 1962 colours follow the passenger plate.' },
  { id: 'industrial-logging-1963', label: '1963–71 Logging · EXP.', family: 'industrial', era: 'industrial-annual', period: [1963, 1971], recipe: logging1963,
    palettes: [pal(1965, '#214d93', '#e8dfce', 'white on blue'), ...[1964, 1966, 1967, 1968, 1969].map(PASSENGER_196X)],
    grammar: runs('T1–T2-900 and quarterly blocks to T59-999', { prefix: 'T', from: 1, to: 59999, fmt: dash3 }),
    description: 'From 1963 the expiry reads EXP. 31-8-65; the year stays at bottom right until 1971. BEAUTIFUL was never used on Logging plates. 1965 is photographed; other years follow the passenger colours.' },
  { id: 'industrial-logging-1972', label: '1972–79 Logging · EXP.', family: 'industrial', era: 'industrial-annual', period: [1972, 1979], recipe: logging1972,
    palettes: [pal(1974, '#e4e6e6', '#cf5e26', 'orange on white'), pal(1978, '#dde2df', '#2e6a55', 'green on white'), pal(1979, '#ecece6', '#202020', 'black on white')],
    dies: [{ id: 'bc-oakalla-1973', label: 'Oakalla (1973–77)' }, { id: 'bc-acme-1978', label: 'ACME Quebec dies (1978–79)' }, { id: 'bc-oakalla-1970', label: 'Oakalla (1970–72)' }],
    grammar: runs('T1–T18-000 (T10-001–T15-000 in 1977, T15-001–T18-000 in 1978)', { prefix: 'T', from: 1, to: 18000, fmt: dash3 }),
    description: 'Expiry date at the top, BRITISH COLUMBIA below and no year. The date is drawn as 31-8-yy; the 1979 plate reads 31-5-79 and the 1974 plate splits BRITISH and COLUMBIA.' },
  { id: 'industrial-logging-1980', label: '1980–83 Logging · EXP', family: 'industrial', era: 'industrial-decal', period: [1980, 1983], recipe: logging1980,
    palettes: [pal(1980, '#ecebdd', '#c26333', 'orange on white'), pal(1981, '#f0f0f0', '#202020', 'black on white'), pal(1982, '#ecebdd', '#c26333', 'orange on white'), pal(1983, '#f0f0f0', '#202020', 'black on white')], dies: DIES_1979,
    grammar: runs('T01-000–T04-499 (1980), T10-000–T21-499 (1981–83)', { prefix: 'T', from: 1000, to: 4499, fmt: fixed(5, 3) }, { prefix: 'T', from: 10000, to: 21499, fmt: fixed(5, 3) }),
    description: 'Orange on white in 1980, rotated with the 1979 black on white scheme; EXP 30-6-80 at the top. The expiry is drawn at the photographed 30 June quarter.' },
  { id: 'industrial-logging-1984', label: '1984 Logging · EXP. 30.06.84', family: 'industrial', era: 'industrial-decal', period: [1984, 1984], recipe: logging1984, dies: DIES_1979,
    grammar: runs('T01-000–T04-999 per the issue table (T46-912 is photographed)', { prefix: 'T', from: 1000, to: 4999, fmt: fixed(5, 3) }, { prefix: 'T', from: 40000, to: 49999, fmt: fixed(5, 3) }),
    description: 'The 1984 plate (thought to be by High Signs) writes the date with dots (30.06.84) and adds a decal box between BRITISH and COLUMBIA.' },
  { id: 'industrial-logging-1985', label: '1985–88 Logging · expiry strip', family: 'industrial', era: 'industrial-flag', period: [1985, 1988], recipe: loggingStrip, dies: DIES_FLAG,
    palettes: [1986, 1987, 1988].map((y) => ({ ...pal(y, SHEETING, SERIAL_BLUE, 'blue strip'), label: `${y} · EXPIRES JUNE 30 - ${y}` })),
    grammar: runs('T0-9500–T2-5999 per the 1986–88 table; T3-3949 (1986) is photographed', { prefix: 'T', from: 9500, to: 39999, fmt: fixed(5, 4) }),
    description: 'Flag base with a reverse white-on-blue (or black) expiry strip across the top in place of the slogan (EXPIRES JUNE 30 - 1986) and small serif British / Columbia below. The strip lettering is serif on the plate but drawn with a legend die here so the year can change; the black strip and other quarters are not drawn.' },
  { id: 'industrial-logging-flag', label: 'Flag Logging · T', family: 'industrial', era: 'industrial-flag', period: [1989, 2026], recipe: loggingFlag, dies: DIES_FLAG, decals: [1989, 2023],
    grammar: runs('T0-0001–T3-0750 (1989–2001)', { prefix: 'T', from: 1, to: 30750, fmt: fixed(5, 4) }),
    description: 'From 1989 Logging plates are on the flag base with decal renewal and the full “Beautiful British Columbia” across the top.' },
  { id: 'industrial-restricted', label: 'Restricted (ATV)', family: 'industrial', era: 'industrial-small', period: [1998, 2026], recipe: restricted, dies: [{ id: 'bc-astro-3', label: 'Astrographic' }, { id: 'bc-waldale', label: 'Waldale' }], decals: [1998, 2023],
    grammar: runs('AT 0000–AT 2999 (1998), then 00 000X (Astrographic) or 00000 X (Waldale)',
      { prefix: 'AT-', from: 0, to: 2999, fmt: fixed(4) }, { suffix: 'X', from: 0, to: 9999, fmt: fixed(5, 3) }, { suffix: '-X', from: 0, to: 9999, fmt: fixed(5) }),
    description: 'Small plate for ATVs, golf carts and similar: white serif RESTRICTED in a red bar across the top, red serial, B.C. at bottom left and the decal well at bottom centre. No flag graphic. Later plates have a separate day box beside the well (not drawn).' },
  { id: 'industrial-off-road', label: 'Off-Road Vehicle', family: 'industrial', era: 'industrial-small', period: [2014, 2026], recipe: offRoad, dies: [{ id: 'bc-waldale' }], decals: [2014, 2023],
    grammar: runs('0B0001–9B9999', ...Array.from({ length: 10 }, (_, d) => ({ prefix: `${d}B`, from: 0, to: 9999, fmt: fixed(4) }))),
    description: 'OFF ROAD VEHICLE in a blue bar across the top, large black figures, BC at bottom left (carried over from the Restricted plate) and the BC Mark at bottom right. Day and month/year boxes are used only when the vehicle is insured for road use. Numbering runs 0B0001 to 9B9999, then 0C0001. The numbered adhesive sticker version is not a plate and is not drawn.' },
  { id: 'industrial-sa-1973', label: '1973–75 Special Agreement · GR / CL', family: 'industrial', era: 'industrial-annual', period: [1973, 1975], recipe: saSplit,
    palettes: [pal(1973, '#0d6fb1', '#e6d356', 'yellow on blue'), pal(1974, '#edc370', '#281b12', 'black on yellow'), pal(1975, '#0d6fb1', '#e6d356', 'yellow on blue')],
    grammar: runs('GR001–GR400 (Gold River), CL501–CL800 (Cominco)', ...SA_RUNS),
    description: 'Annual plates for vehicles of the Gold River (GR) and Cominco (CL) special agreements, new each year in alternating colours: 19 BEAUTIFUL yy across the top and a gap between BRITISH and COLUMBIA. GR-001 to GR-050 (1973), CL-551 to CL-575 (1975).' },
  { id: 'industrial-sa-1976', label: '1976–78 Special Agreement · GR / CL', family: 'industrial', era: 'industrial-annual', period: [1976, 1978], recipe: saWhole,
    palettes: [pal(1976, '#e4e6e4', '#bd2b1d', 'red on white'), pal(1977, '#efede8', '#1e1a19', 'black on white'), pal(1978, '#e2e8e6', '#265841', 'green on white')],
    grammar: runs('GR001–GR400 (Gold River), CL501–CL800 (Cominco)', ...SA_RUNS),
    description: 'From 1976 the GR and CL plates carry an unbroken BRITISH COLUMBIA below the number (GR253, GR317, GR357). GR-251 to GR-400 were issued 1976–78.' },
  { id: 'industrial-sa-1979', label: '1979 Special Agreement', family: 'industrial', era: 'industrial-decal', period: [1979, 1986], recipe: sa1979, dies: DIES_1979, decals: [1980, 1986],
    grammar: runs('GR-001–GR-999, CL-001–CL-999', { prefix: 'GR-', from: 1, to: 999, fmt: fixed(3) }, { prefix: 'CL-', from: 1, to: 999, fmt: fixed(3) }),
    description: 'Yearly validated red on white plates like the Dealer and Repairer bases, with no top legend and a bottom-centre decal box (GR-459). Cominco plates show a raised dot (CL·786) rather than the dash drawn here.' },
  { id: 'industrial-sa-flag', label: 'Flag Special Agreement · SA', family: 'industrial', era: 'industrial-flag', period: [1985, 2026], recipe: saFlag, dies: DIES_FLAG, decals: [1985, 2023],
    grammar: runs('0000-SA … (0000-SA to 0499-SA in 1985)', { suffix: '-SA', from: 0, to: 999, fmt: fixed(4) }),
    description: 'In 1985 the plates switched to the 1234-SA format on the standard “Beautiful British Columbia” flag base, the flag between the figures and SA.' },
];

// ════════════════════════════════════════════════════════════════════════════
// CARRIER, MOTIVE FUEL, PRORATE, RECIPROCITY, TEMPORARY
// ════════════════════════════════════════════════════════════════════════════
const pwd1928 = small('carrier-pwd-1928', '1928 P.W.D. Special Permit', SMALL('#f0f0ee', '#101010'), SRC.carrier, {
  holes: 'round', holeAt: { x: [0.05, 0.95], y: [0.1] },
  legends: [t('P.W.D.', 42, 26, 14, 'bc-legend-1924', { role: 'pwd' }), t('1928', 163, 26, 14, 'bc-legend-1924', { role: 'year' }),
    t('SPECIAL', 34, 70, 12, 'bc-legend-1924', { role: 'special' }), t('PERMIT', 170, 70, 12, 'bc-legend-1924', { role: 'permit' }),
    t('BRITISH COLUMBIA', 101.5, 117, 15, 'bc-legend-1924', { maxWidth: 186, spread: true, role: 'province' })],
  serial: { x: 101.5, baseline: 90, cap: 55, maxWidth: 70, die: 'bc-straight-1928' },
});
const pc1934 = small('carrier-pc-1934', '1934 P.C. Licence · triangle', { w: 203, h: 130, bg: 'none', ink: '#e8dcc0' }, SRC.carrier, {
  rim: null, radius: 0, holes: 'round', holeAt: { x: [0.22, 0.78], y: [0.07] },
  art: [{ art: 'trade-pc-triangle', x: 0, y: 0, width: 203, height: 130, role: 'triangle' }],
  legends: [t('B.C. ‒ 1934', 101.5, 27, 10, 'bc-legend-1924', { maxWidth: 110, role: 'province-year' }), t('P.C. LICENCE', 101.5, 42, 10, 'bc-legend-1924', { maxWidth: 118, role: 'licence' }),
    t('FREIGHT', 101.5, 57, 10, 'bc-legend-1924', { maxWidth: 80, role: 'class' })],
  serial: { x: 100, baseline: 90, cap: 28, maxWidth: 76, die: 'bc-straight-1928' },
});

/** 1935–50: class letter in a stamped box (drawn as an artwork separator; see art-trade.ts). */
function boxedCL(year: number, b: Base, die: string, legendDie: string): KitRecipe {
  const cap = 50, pad = 3, baseline = 110, letter = (dieRunWidth(dieProfile(die), 'H') * cap) / 100;
  const id = `carrier-cl-box-${year}`;
  registerLetterBox(id, b.ink, { letter, pad, space: 14, height: cap + 2 * pad, stroke: 1.6 });
  return small(`carrier-cl-${year}`, `${year} Motor Carrier · B.C.-${year}-C.L.`, b, SRC.carrier, {
    holes: 'round', holeAt: { x: [0.05, 0.95], y: [0.08, 0.92] }, rim: { inset: 3, width: 1.4 },
    legends: [t(`B.C.-${year}-C.L.`, 101.5, 32, 17, legendDie, { maxWidth: 184, spread: true, role: 'legend' })],
    serial: { x: 101.5, baseline, cap, maxWidth: 186, die, separator: { kind: 'art', gap: 0, art: { art: id, x: 0, y: baseline - cap - pad, width: 14, height: cap + 2 * pad } } },
  });
}
const cl1936 = boxedCL(1936, SMALL('#9a2a28', '#d8c090'), 'bc-tacey-1936', 'bc-legend-1924');
const cl1946 = boxedCL(1946, SMALL('#ece8e0', '#d83030'), 'bc-early-1940', 'bc-legend-1940');
const cl1951 = small('carrier-cl-1951', '1951–69 Motor Carrier · B.C.-yyyy-C.L.', SMALL('#e8ece8', '#2a9040'), SRC.carrier, {
  holes: 'round', holeAt: { x: [0.05, 0.95], y: [0.08, 0.92] }, rim: { inset: 3, width: 1.4 },
  legends: [t('B.C.-{yyyy}-C.L.', 101.5, 32, 17, 'bc-legend-1955', { maxWidth: 184, spread: true, role: 'legend' })],
  serial: { x: 101.5, baseline: 108, cap: 56, maxWidth: 186, die: 'bc-oakalla-1955' },
});
const mc1970 = small('carrier-mc-1970', '1970–73 Motor Carrier · Public Utilities Commission', SMALL('#f0f0f0', '#2a60b0'), SRC.carrier, {
  legends: [t('BRITISH COLUMBIA', 101.5, 27, 12, 'bc-legend-1964', { maxWidth: 150, spread: true, role: 'province' }),
    t('{yyyy} MOTOR CARRIER', 101.5, 50, 16, 'bc-legend-1964', { maxWidth: 176, role: 'class' }),
    t('PUBLIC UTILITIES COMMISSION', 101.5, 113, 11, 'bc-legend-1964', { maxWidth: 176, spread: true, role: 'commission' })],
  serial: { x: 101.5, baseline: 91, cap: 28, maxWidth: 120, die: 'bc-oakalla-1970' },
});
const mc1974 = small('carrier-mc-1974', '1974 Motor Carrier', SMALL('#1a5ab0', '#f0f0f0'), SRC.carrier, {
  legends: [t('BRITISH COLUMBIA', 101.5, 27, 12, 'bc-legend-1973', { maxWidth: 150, spread: true, role: 'province' }), t('MOTOR CARRIER {yyyy}', 101.5, 55, 17, 'bc-legend-1973', { maxWidth: 184, role: 'class' })],
  serial: { x: 101.5, baseline: 104, cap: 36, maxWidth: 150, die: 'bc-oakalla-1973' },
});
const mc1975 = small('carrier-mc-1975', '1975–81 Motor Carrier', SMALL('#f0f0f0', '#2a50a0'), SRC.carrier, {
  legends: [t('MOTOR CARRIER {yyyy}', 101.5, 30, 16, 'bc-legend-1973', { maxWidth: 178, role: 'class' }), t('BRITISH COLUMBIA', 101.5, 113, 13, 'bc-legend-1973', { maxWidth: 170, spread: true, role: 'province' })],
  serial: { x: 101.5, baseline: 94, cap: 50, maxWidth: 176, die: 'bc-oakalla-1973', separator: DOT },
});
const mc1982 = small('carrier-mc-1982', '1982–84 Motor Carrier', SMALL('#f0f0f0', '#b03040'), SRC.carrier, {
  legends: [t('MOTOR CARRIER', 86, 30, 15, 'bc-legend-hisigns', { maxWidth: 140, role: 'class' }), t('{yy}', 178, 30, 15, 'bc-legend-hisigns', { role: 'year' }),
    t('BRITISH COLUMBIA', 101.5, 113, 13, 'bc-legend-hisigns', { maxWidth: 170, role: 'province' })],
  serial: { x: 101.5, baseline: 94, cap: 50, maxWidth: 186, die: 'bc-hisigns-1982' },
});
const dash = (id: string, color: string, baseline: number, cap: number): KitSerial['separator'] => {
  registerDash(id, color);
  return { kind: 'art', gap: 3, art: { art: id, x: 0, y: baseline - cap / 2 - 5, width: 11, height: 10 } };
};
const RED = '#c03040', BLUE = '#2a40a0';
const mc1985 = small('carrier-mc-1985', '1985–87 Motor Carrier · serif legends', SMALL('#e4e4e2', '#2040a0'), SRC.carrier, {
  holeAt: { x: [0.2, 0.8], y: [0.07, 0.93] }, rim: { inset: 3, width: 1, color: RIM },
  legends: [t('{yy}', 172, 29, 12, 'bc-legend-condensed', { color: RED, role: 'year' })],
  fontLegends: [serif('MOTOR CARRIER', 92, 29, 15, RED, { width: 128, role: 'class' }), serif('British Columbia', 101.5, 113, 16, RED, { width: 136, role: 'province' })],
  serial: { x: 101.5, baseline: 90, cap: 48, maxWidth: 186, die: 'bc-astro-3', separator: dash('carrier-dash-red', RED, 90, 48) },
});
function mc1988(id: string, label: string, digits: string, legends: string, lines: string[]): KitRecipe {
  const top = lines.length > 1;
  return small(id, label, SMALL('#eeeeec', digits), SRC.carrier, {
    holes: 'round', holeAt: { x: [0.12, 0.88], y: [0.1, 0.9] }, rim: { inset: 3, width: 1, color: RIM },
    legends: [],
    fontLegends: [...lines.map((l, i) => serif(l, 101.5, 22 + i * 12, top ? 12 : 14, legends, { weight: 700, role: `class-${i}` })),
      serif('British', 26, 108, 10, legends, { weight: 700, role: 'province-left' }), serif('Columbia', 177, 108, 10, legends, { weight: 700, role: 'province-right' })],
    serial: { x: 101.5, baseline: top ? 84 : 80, cap: 46, maxWidth: 188, die: 'bc-astro-3', separator: top ? GAP : dash(`${id}-dash`, legends, 80, 46) },
    decal: { x: 55, y: 92, width: 93, height: 29 },
  });
}
const mcRed = mc1988('carrier-mc-1988', '1988–94 Motor Carrier · red numbers', '#d03030', BLUE, ['MOTOR CARRIER']);
const mcBlue = mc1988('carrier-mc-1995', '1995–2005 Motor Carrier · blue numbers', '#2a40a0', RED, ['MOTOR CARRIER']);
const mcTaxi = mc1988('carrier-mc-taxi', '1994–2001 Motor Carrier · Taxi', '#2a6ac0', '#d84830', ['MOTOR CARRIER', 'TAXI']);
const passengerCarrier = small('carrier-passenger-2005', 'Passenger Carrier · flag background', SMALL('#f4f4f4', '#101010'), SRC.passengerCarrier, {
  rim: { inset: 2.5, width: 1, color: '#9aa4b4' }, holes: 'round', holeAt: { x: [0.05, 0.95], y: [0.08, 0.92] },
  art: [{ art: 'trade-flag-wash', x: 4, y: 4, width: 195, height: 119, role: 'flag-background' }],
  artworkAccuracy:'Supplied BC flag SVG; plate fitting and pale screened colour are approximate.',
  legends: [],
  fontLegends: [serif('BRITISH COLUMBIA', 101.5, 20, 14, '#1c2d6b', { weight: 700, width: 160, role: 'province' }),
    { text: 'PASSENGER', x: 34, baseline: 114, size: 10, font: 'sans', weight: 700, color: '#101010', role: 'class-left' },
    { text: 'CARRIER', x: 170, baseline: 114, size: 10, font: 'sans', weight: 700, color: '#101010', role: 'class-right' }],
  serial: { x: 101.5, baseline: 82, cap: 44, maxWidth: 180, die: 'bc-waldale', separator: GAP },
  decal: { x: 68, y: 91, width: 67, height: 29, background: '#eef0ee' },
});
const passengerCarrier2010 = small('carrier-passenger-2010', '2010 Games Passenger Transportation (temporary)', SMALL('#ecd13c', '#101010'), SRC.passengerCarrier, {
  rim: null, holes: 'slots', holeAt: { x: [0.18, 0.82], y: [0.07, 0.93] },
  legends: [],
  fontLegends: [serif('BRITISH COLUMBIA', 101.5, 26, 13, '#3a3220', { weight: 700, width: 136, role: 'province' }),
    { text: 'PASSENGER', x: 34, baseline: 112, size: 8, font: 'sans', weight: 700, color: '#101010', role: 'class-left' },
    { text: 'TRANSPORTATION', x: 162, baseline: 112, size: 7.5, font: 'sans', weight: 700, color: '#101010', role: 'class-right' }],
  serial: { x: 101.5, baseline: 84, cap: 44, maxWidth: 190, die: 'bc-waldale', separator: { kind: 'art', gap: 2.5, art: { art: 'bc-logo-wordmark', x: 0, y: 44, width: 34, height: 38, role: 'bc-logo' } } },
  decal: { x: 76, y: 92, width: 52, height: 28 },
});

const fuel1961 = small('carrier-fuel-1961', '1961–68 Motive Fuel', SMALL('#dcdcdc', '#202020'), SRC.fuel, {
  legends: [t('B.C. MOTIVE FUEL', 101.5, 26, 13, 'bc-legend-1955', { maxWidth: 170, spread: true, role: 'class' }), t('EXP.-JUNE-1-{yy}', 101.5, 113, 12, 'bc-legend-1955', { maxWidth: 170, spread: true, role: 'expiry' })],
  serial: { x: 101.5, baseline: 96, cap: 54, maxWidth: 170, die: 'bc-oakalla-1955' },
});
const fuel1969 = small('carrier-fuel-1969', '1969–70 Motive Fuel · MF', SMALL('#e0e070', '#202020'), SRC.fuel, {
  legends: [t('BRITISH COLUMBIA', 101.5, 26, 13, 'bc-legend-1964', { maxWidth: 176, spread: true, role: 'province' }), t('EXP.-JUNE-1 {yy}', 101.5, 113, 12, 'bc-legend-1964', { maxWidth: 170, spread: true, role: 'expiry' })],
  serial: { x: 101.5, baseline: 94, cap: 48, maxWidth: 186, die: 'bc-oakalla-1970' },
});

const prorate1962 = recipe('carrier-prorate-1962', '1962–63 Prorate · P', B302('#5a1a28', '#e8b8b0'), SRC.prorate, {
  legends: [t('BRITISH COLUMBIA', 128, 139, 18, 'bc-legend-1955', { maxWidth: 228, spread: true, role: 'province' }), t('{yy}', 275, 139, 19, 'bc-legend-1955', { role: 'year' })],
  serial: { x: 151, baseline: 106, cap: 78, maxWidth: 276, die: 'bc-oakalla-1955' },
});
const prorate1964 = annual('carrier-prorate-1964', '1964–71 Prorate', B302('#eeeeee', '#3080c0'), SRC.prorate,
  { top: 'BEAUTIFUL', year: 'top-right', bottom: 'split', serialDie: 'bc-oakalla-1955', legendDie: 'bc-legend-1964' });
const prorate1972 = annual('carrier-prorate-1972', '1972–78 Prorate', B302('#f0f0f0', '#d83030'), SRC.prorate,
  { top: 'BEAUTIFUL', year: 'split-top', bottom: 'split', serialDie: 'bc-oakalla-1970', legendDie: 'bc-legend-1964' });
const prorate1979 = annual('carrier-prorate-1979', '1979–80 Prorate · 19 PRORATE yy', B300('#f0f0f0', '#202020'), SRC.prorate,
  { top: 'PRORATE', year: 'split-top', bottom: 'whole', serialDie: 'bc-acme-1979', legendDie: 'bc-legend-acme' });
const prorate1981 = base1979('carrier-prorate-1981', '1981–84 Prorate · DEC yy', B300('#f4f4f4', '#202020'), SRC.cavr, 'DEC {yy}', DOT, { maxWidth: 80 });
const prorateFlag1985 = flagBase('carrier-prorate-flag-1985', '1985–88 Prorate · red flag base', SRC.prorate, { sloganColor: '#c03040', serialColor: '#b82030', extra: {
  legends: [t('{yy}', 262, 136, 7, 'bc-legend-condensed', { color: '#b82030', role: 'year' })], decal: null,
  shapes: [{ kind: 'rect', x: 94.5, y: 115, width: 112.5, height: 29, rx: 2, stroke: '#c9cdd2', strokeWidth: 0.8 }] } });
const prorateFlag1989 = flagBase('carrier-prorate-flag-1989', '1989–95 Prorate · flag', SRC.prorate);
const apportioned = flagBase('carrier-prorate-apportioned', 'Apportioned (IRP) · flag', SRC.prorate, { classWord: { text: 'APPORTIONED', width: 150 } });

const reciprocity1963 = small('carrier-reciprocity-1963', '1963–72 Reciprocity · BR.COLUMBIA', SMALL('#2060c0', '#f0f0f0'), SRC.reciprocity, {
  legends: [t('BR.COLUMBIA', 101.5, 28, 15, 'bc-legend-1955', { maxWidth: 150, role: 'province' }), t('RECIPROCITY', 101.5, 113, 14, 'bc-legend-1955', { maxWidth: 150, spread: true, role: 'class' })],
  serial: { x: 101.5, baseline: 96, cap: 54, maxWidth: 170, die: 'bc-oakalla-1955' },
});
const reciprocity1973 = small('carrier-reciprocity-1973', '1973–79 Reciprocity · BR.COLUMBIA yy', SMALL('#eeeeee', '#101010'), SRC.reciprocity, {
  legends: [t('BR.COLUMBIA', 90, 28, 15, 'bc-legend-1973', { maxWidth: 140, role: 'province' }), t('{yy}', 178, 28, 15, 'bc-legend-1973', { role: 'year' }),
    t('RECIPROCITY', 101.5, 113, 14, 'bc-legend-1973', { maxWidth: 150, spread: true, role: 'class' })],
  serial: { x: 101.5, baseline: 96, cap: 54, maxWidth: 170, die: 'bc-oakalla-1973' },
});
const reciprocity1980 = small('carrier-reciprocity-1980', '1980–81 Reciprocity · DEC', SMALL('#dcdcdc', '#c05040'), SRC.reciprocity, {
  legends: [t('BRITISH COLUMBIA', 101.5, 28, 13, 'bc-legend-acme', { maxWidth: 176, spread: true, role: 'province' }),
    t('DEC', 28, 113, 10, 'bc-legend-acme', { role: 'month' }), t('RECIPROCITY', 101.5, 113, 13, 'bc-legend-acme', { maxWidth: 124, role: 'class' }), t('{yy}', 176, 113, 11, 'bc-legend-acme', { role: 'year' })],
  serial: { x: 101.5, baseline: 94, cap: 50, maxWidth: 170, die: 'bc-acme-1979' },
});
const b1947 = { w: 287, h: 137 };
const temporaryX = recipe('carrier-temporary-x', 'Possible temporary X plate', { ...b1947, bg: '#e2e0d8', ink: '#2a2a2a' }, SRC.temporary, {
  legends: [t('BRITISH COLUMBIA', b1947.w / 2, b1947.h * 0.9, b1947.h * 0.13, 'bc-legend-1940', { maxWidth: b1947.w * 0.86, spread: true, role: 'province' })],
  serial: { x: b1947.w / 2, baseline: b1947.h * 0.7, cap: b1947.h * 0.55, maxWidth: b1947.w * 0.8, die: 'bc-early-1940' },
  note: 'Known only from black-and-white photographs (X-439, around 1952); colours are a neutral light-on-dark guess and the size is the 1947–51 passenger base. Purpose unconfirmed.',
});

const carrierSpecs: Spec[] = [
  { id: 'carrier-pwd-1928', label: '1928 P.W.D. Special Permit', family: 'carrier', era: 'carrier-early', period: [1926, 1929], recipe: pwd1928, status: 'uncertain',
    palettes: [pal(1928, '#f0f0ee', '#101010', 'black on white')],
    grammar: runs('1–999', { from: 1, to: 999, fmt: plain }),
    description: 'Public Works Department “Special Permit” plate: P.W.D. and 1928 at the top, SPECIAL and PERMIT either side of the number, BRITISH COLUMBIA below. The 1928 permits were to be “black letters on a white background” (1927: white on olive). BCpl8s calls their placement as early motor-carrier plates “purely speculative”.' },
  { id: 'carrier-pc-1934', label: '1934 P.C. Licence · triangle', family: 'carrier', era: 'carrier-early', period: [1930, 1934], recipe: pc1934, status: 'uncertain',
    grammar: runs('1–999', { from: 1, to: 999, fmt: plain }),
    description: 'A downward-pointing triangular plate, cream on dark navy: B.C. — 1934, P.C. LICENCE and FREIGHT above the number (427). Attribution to motor carriers is speculative. Size is not recorded; drawn 203 mm across the top.' },
  { id: 'carrier-cl-1936', label: '1936 Motor Carrier · boxed class letter', family: 'carrier', era: 'carrier-early', period: [1935, 1939], recipe: cl1936,
    grammar: runs('A–L class letter + 1–99999; the stored dash marks the end of the boxed letter', ...each('ABCDEFGHJKL', { from: 1, to: 99999, fmt: plain }).map((r) => ({ ...r, prefix: `${r.prefix}-` }))),
    description: 'B.C.-1936-C.L. across the top and a class letter (A–L, eleven prefixes) enclosed in a rectangle before the number (H2733), cream on red. The class letter and frame are drawn at the serial size; on the plate the boxed letter is a little smaller.' },
  { id: 'carrier-cl-1946', label: '1946 Motor Carrier · boxed class letter', family: 'carrier', era: 'carrier-early', period: [1940, 1950], recipe: cl1946,
    grammar: runs('A–L class letter + 1–99999; the stored dash marks the end of the boxed letter', ...each('ABCDEFGHJKL', { from: 1, to: 99999, fmt: plain }).map((r) => ({ ...r, prefix: `${r.prefix}-` }))),
    description: 'The 1940s layout, red on white (K20510, 1946): B.C.-1946-C.L. above, class letter in a stamped rectangle. From late 1950 the rectangle was dropped for a larger stand-alone letter.' },
  { id: 'carrier-cl-1951', label: '1951–69 Motor Carrier · B.C.-yyyy-C.L.', family: 'carrier', era: 'carrier-early', period: [1951, 1969], recipe: cl1951,
    palettes: [pal(1953, '#e8ece8', '#2a9040', 'green on white'), pal(1965, '#f0f0f0', '#4a9ad0', 'light blue on white'), pal(1969, '#ecebe4', '#2b3f8f', 'dark blue on white (no prefix)')],
    dies: [{ id: 'bc-oakalla-1955', label: 'Oakalla (1955–69)' }, { id: 'bc-early-1940', label: 'Early rounded (1951–54)' }],
    grammar: runs('A–L + 1–99999; 1969 plain numbers', ...each('ABCDEFGHJKL', { from: 1, to: 99999, fmt: plain }), { from: 1, to: 9999, fmt: plain }),
    description: 'Large stand-alone class letter before the number with B.C.-yyyy-C.L. above (L41173 1953, J15888 1965). The 1969 plates display no letter prefix (6315).' },
  { id: 'carrier-mc-1970', label: '1970–73 Motor Carrier · P.U.C.', family: 'carrier', era: 'carrier-annual', period: [1970, 1973], recipe: mc1970,
    palettes: [pal(1971, '#f0f0f0', '#2a60b0', 'blue on white')],
    grammar: runs('1–9999', { from: 1, to: 9999, fmt: plain }),
    description: 'BRITISH COLUMBIA, the year and MOTOR CARRIER, then an “unduly small” number and PUBLIC UTILITIES COMMISSION along the bottom.' },
  { id: 'carrier-mc-1974', label: '1974 Motor Carrier', family: 'carrier', era: 'carrier-annual', period: [1974, 1974], recipe: mc1974,
    palettes: [pal(1974, '#1a5ab0', '#f0f0f0', 'white on blue')],
    grammar: runs('1–19-999', { from: 1, to: 19999, fmt: dash3 }),
    description: 'After the Public Utilities Commission was abolished: BRITISH COLUMBIA and MOTOR CARRIER 1974 above a dashed number, white on blue.' },
  { id: 'carrier-mc-1975', label: '1975–81 Motor Carrier', family: 'carrier', era: 'carrier-annual', period: [1975, 1981], recipe: mc1975,
    palettes: [pal(1977, '#f0f0f0', '#2a50a0', 'blue on white')],
    grammar: runs('1–19·999 (raised dot)', { from: 1, to: 19999, fmt: dash3 }),
    description: 'MOTOR CARRIER and the year across the top, BRITISH COLUMBIA below (6·932, 1977).' },
  { id: 'carrier-mc-1982', label: '1982–84 Motor Carrier', family: 'carrier', era: 'carrier-annual', period: [1982, 1984], recipe: mc1982,
    palettes: [pal(1983, '#f0f0f0', '#b03040', 'red on white')], dies: [{ id: 'bc-hisigns-1982' }, { id: 'bc-acme-1979' }],
    grammar: runs('000-001–099-999', { from: 1, to: 99999, fmt: fixed(6, 3) }),
    description: 'MOTOR CARRIER yy across the top, a six-figure number (008-385) and BRITISH COLUMBIA below.' },
  { id: 'carrier-mc-1985', label: '1985–87 Motor Carrier · serif', family: 'carrier', era: 'carrier-annual', period: [1985, 1987], recipe: mc1985, dies: DIES_FLAG,
    palettes: [pal(1985, '#e4e4e2', '#2040a0', 'blue on white'), pal(1986, '#e4e4e2', '#2040a0', 'blue on white'), pal(1987, '#e4e4e2', '#2040a0', 'blue on white')],
    grammar: runs('000-001–099-999', { from: 1, to: 99999, fmt: fixed(6, 3) }),
    description: 'Flag-era small base: MOTOR CARRIER and the year in red serif, blue figures with a red dash, British Columbia in red serif below (006-470, 1986). The year is drawn with a legend die rather than the serif.' },
  { id: 'carrier-mc-1988', label: '1988–94 Motor Carrier · red numbers', family: 'carrier', era: 'carrier-1988', period: [1988, 1994], recipe: mcRed, dies: DIES_FLAG,
    grammar: runs('000-001–199-999', { from: 1, to: 199999, fmt: fixed(6, 3) }),
    description: 'Red figures with a blue dash, MOTOR CARRIER in blue serif caps and small serif British / Columbia either side of the Motor Carrier decal (052-798, 1990). Renewed with MC decals.' },
  { id: 'carrier-mc-1995', label: '1995–2005 Motor Carrier · blue numbers', family: 'carrier', era: 'carrier-1988', period: [1995, 2005], recipe: mcBlue, dies: DIES_FLAG,
    grammar: runs('000-001–199-999', { from: 1, to: 199999, fmt: fixed(6, 3) }),
    description: 'The colours reversed: blue figures, red dash, red MOTOR CARRIER and British / Columbia (139-986, 1997).' },
  { id: 'carrier-mc-taxi', label: '1994–2001 Motor Carrier · Taxi', family: 'carrier', era: 'carrier-1988', period: [1994, 2001], recipe: mcTaxi, dies: DIES_FLAG,
    grammar: runs('6-figure numbers, spaced (102 386 photographed)', { from: 1, to: 199999, fmt: fixed(6, 3) }),
    description: 'Taxi version: MOTOR CARRIER over TAXI in red serif, blue figures spaced in two groups of three, British / Columbia beside the decal.' },
  { id: 'carrier-passenger-2005', label: 'Passenger Carrier', family: 'carrier', era: 'carrier-1988', period: [2005, 2026], recipe: passengerCarrier, dies: [{ id: 'bc-waldale' }],
    grammar: runs('800 000 onward (from 800-000 in 2005)', { from: 800000, to: 899999, fmt: fixed(6, 3) }),
    description: 'Passenger Transportation Board plates, similar in size to the former Motor Carrier plates. The supplied British Columbia flag SVG forms the pale printed background inside the rim, with its crown, waves and sun retained. BRITISH COLUMBIA in serif above, black figures starting with 8, PASSENGER and CARRIER either side of the decal. Flag placement and print colour remain approximate; lettering is independently reconstructed.',
    references:[{title:'BCpl8s · Passenger Carrier 810-301, flag background',url:'https://www.bcpl8s.ca/images/MotorCarrier/2005-810301(XL).jpg'}]},
  { id: 'carrier-passenger-2010', label: '2010 Games Passenger Transportation', family: 'carrier', era: 'carrier-1988', period: [2010, 2010], recipe: passengerCarrier2010, dies: [{ id: 'bc-waldale' }],
    grammar: runs('S10-000–S10-999 (S10-010 photographed)', { prefix: 'S10-', from: 0, to: 999, fmt: fixed(3) }),
    description: 'Temporary plates for the 2010 Winter Games, “a bright yellow background” to set them apart: BRITISH COLUMBIA above an S-prefix number, the BC logo at centre, PASSENGER and TRANSPORTATION either side of the decal. The yellow gradient and small day box are simplified.' },
  { id: 'carrier-fuel-1961', label: '1961–68 Motive Fuel', family: 'carrier', era: 'carrier-annual', period: [1961, 1968], recipe: fuel1961,
    palettes: [pal(1962, '#dcdcdc', '#202020', 'black on silver'), pal(1965, '#d8e8e0', '#2a7050', 'green on pale green'), pal(1968, '#f0f0f0', '#e06040', 'orange-red on white')],
    grammar: runs('1–9999', { from: 1, to: 9999, fmt: plain }),
    description: 'The Motive Fuel (diesel tax) “emblem” took the form of a small plate: B.C. MOTIVE FUEL above the number and the June 1 expiry below.' },
  { id: 'carrier-fuel-1969', label: '1969–70 Motive Fuel · MF', family: 'carrier', era: 'carrier-annual', period: [1969, 1970], recipe: fuel1969,
    palettes: [pal(1970, '#e0e070', '#202020', 'black on yellow')],
    grammar: runs('MF1–MF19-999', { prefix: 'MF', from: 1, to: 19999, fmt: dash3 }),
    description: 'BRITISH COLUMBIA above an MF-prefix number (MF12-864) and EXP.-JUNE-1 70 below. Discontinued after 1970.' },
  { id: 'carrier-prorate-1962', label: '1962–63 Prorate · P', family: 'carrier', era: 'carrier-annual', period: [1962, 1963], recipe: prorate1962,
    palettes: [pal(1962, '#5a1a28', '#e8b8b0', 'pink on maroon'), pal(1963, '#327e9e', '#eeeede', 'white on light blue')],
    grammar: runs('P1–P999', { prefix: 'P', from: 1, to: 999, fmt: plain }),
    description: 'P-prefix plates for prorated trucks, BRITISH COLUMBIA and the year along the bottom (P217, 1962). 1963 colours follow the passenger plate.' },
  { id: 'carrier-prorate-1964', label: '1964–71 Prorate', family: 'carrier', era: 'carrier-annual', period: [1964, 1971], recipe: prorate1964,
    palettes: [pal(1966, '#eeeeee', '#3080c0', 'blue on white'), ...[1964, 1965, 1967, 1968, 1969].map(PASSENGER_196X)],
    grammar: runs('P1–P1-000', { prefix: 'P', from: 1, to: 1000, fmt: dash3 }),
    description: 'BEAUTIFUL and the year across the top, BRITISH and COLUMBIA split below (P229, 1966). Other years follow the passenger colours.' },
  { id: 'carrier-prorate-1972', label: '1972–78 Prorate', family: 'carrier', era: 'carrier-annual', period: [1972, 1978], recipe: prorate1972,
    palettes: [pal(1972, '#f0f0f0', '#d83030', 'red on white')], dies: ANNUAL_DIES_70,
    grammar: runs('P2-001–P24-500 (1972–78 blocks)', { prefix: 'P', from: 2001, to: 24500, fmt: dash3 }),
    description: '19 BEAUTIFUL yy across the top (P20·075, 1972). The 1976 plate joins BRITISH COLUMBIA into one line; not drawn separately.' },
  { id: 'carrier-prorate-1979', label: '1979–80 Prorate · 19 PRORATE yy', family: 'carrier', era: 'carrier-annual', period: [1979, 1980], recipe: prorate1979,
    palettes: [pal(1979, '#f0f0f0', '#202020', 'black on white')], dies: DIES_1979,
    grammar: runs('P10-501–P19-999', { prefix: 'P', from: 10501, to: 19999, fmt: dash3 }),
    description: '19 PRORATE 79 across the top, black on white (P13·143). A 1979 variant has an errant dot before the P (not drawn).' },
  { id: 'carrier-prorate-1981', label: '1981–84 Prorate · DEC yy', family: 'carrier', era: 'carrier-annual', period: [1981, 1984], recipe: prorate1981,
    palettes: [pal(1981, '#f4f4f4', '#202020', 'black on white'), pal(1982, '#f4f4f4', '#e86a20', 'orange on white'), pal(1983, '#f4f4f4', '#e86a20', 'orange on white'), pal(1984, '#f4f4f4', '#e86a20', 'orange on white')], dies: DIES_1979,
    grammar: runs('P20-000–P37-999', { prefix: 'P', from: 20000, to: 37999, fmt: fixed(5, 3) }),
    description: 'A December expiry at the top and a decal box between BRITISH and COLUMBIA for the CAVR “PRP” decal (P21·135 1981, P26·680 1982). The PRP decal itself is not drawn.' },
  { id: 'carrier-prorate-flag-1985', label: '1985–88 Prorate · red flag base', family: 'carrier', era: 'carrier-1988', period: [1985, 1988], recipe: prorateFlag1985, dies: DIES_FLAG,
    palettes: [1985, 1986, 1987, 1988].map((y) => pal(y, SHEETING, '#b82030', 'red on white')),
    grammar: runs('P3-8000–P6-6999 (P38-000–P66-999, 1985–88)', { prefix: 'P', from: 38000, to: 66999, fmt: fixed(5, 4) }),
    description: 'Dated flag-base Prorate plates in red: red slogan and serial with a small year at bottom right (P4·4433 86). The embossed well is empty; decal renewal began in 1989.' },
  { id: 'carrier-prorate-flag-1989', label: '1989–95 Prorate · flag', family: 'carrier', era: 'carrier-1988', period: [1989, 1995], recipe: prorateFlag1989, dies: DIES_FLAG, decals: [1989, 1995],
    grammar: runs('P0-0001–P2-1450 (1989–94)', { prefix: 'P', from: 1, to: 21450, fmt: fixed(5, 4) }),
    description: 'Standard blue “Beautiful British Columbia” flag base with decal renewal and no class legend (P0·0070).' },
  { id: 'carrier-prorate-apportioned', label: 'Apportioned (IRP) · flag', family: 'carrier', era: 'carrier-1988', period: [1996, 2026], recipe: apportioned, dies: DIES_FLAG, decals: [1996, 2023],
    grammar: runs('P9-9999 to 2010 (P7·5280), then 9999-9P (0000-1P from 2010)',
      { prefix: 'P', from: 21451, to: 99999, fmt: fixed(5, 4) }, { suffix: 'P', from: 1, to: 29999, fmt: fixed(5, 1) }),
    description: 'International Registration Plan plates with APPORTIONED in place of the slogan and small serif British / Columbia either side of the well. From 2010 the P moved to the end (1225·5P). A Waldale bloc around 2004 omitted APPORTIONED (not drawn).' },
  { id: 'carrier-reciprocity-1963', label: '1963–72 Reciprocity', family: 'carrier', era: 'carrier-annual', period: [1963, 1972], recipe: reciprocity1963,
    palettes: [pal(1963, '#2060c0', '#f0f0f0', 'white on blue')],
    grammar: runs('1–400', { from: 1, to: 400, fmt: plain }),
    description: 'Small plates for out-of-province trucks: BR.COLUMBIA above the number and RECIPROCITY below (No. 25, dated 1963–64 by colour). Later colours of this layout are not photographed.' },
  { id: 'carrier-reciprocity-1973', label: '1973–79 Reciprocity', family: 'carrier', era: 'carrier-annual', period: [1973, 1979], recipe: reciprocity1973,
    palettes: [pal(1973, '#eeeeee', '#101010', 'black on white'), pal(1976, '#f4f4f4', '#c03020', 'red on white')],
    grammar: runs('1–1200 (401–800 in 1975, 801–1200 in 1976)', { from: 1, to: 1200, fmt: plain }),
    description: 'From 1973 the year appears at top right after BR.COLUMBIA (227, 1973; 1053, 1976).' },
  { id: 'carrier-reciprocity-1980', label: '1980–81 Reciprocity · DEC', family: 'carrier', era: 'carrier-annual', period: [1980, 1981], recipe: reciprocity1980,
    palettes: [pal(1980, '#dcdcdc', '#c05040', 'red on grey-white')],
    grammar: runs('1–9-999', { from: 1, to: 9999, fmt: dash3 }),
    description: 'A December expiry was added and the full name BRITISH COLUMBIA spelled out at the top; DEC RECIPROCITY 80 along the bottom (2-206).' },
  { id: 'carrier-temporary-x', label: 'Possible temporary X plate', family: 'carrier', era: 'carrier-early', period: [1936, 1954], recipe: temporaryX, status: 'uncertain',
    grammar: runs('X-1–X-999', { prefix: 'X-', from: 1, to: 999, fmt: plain }),
    description: 'Undated X-prefix plates with BRITISH COLUMBIA below, seen only in black-and-white photographs; BCpl8s assumes they “might be examples of the special number-plates” for temporary use. No example survives; colours and size are guesses.' },
];

export const BC_TRADE_FAMILIES: PlateFamily[] = [
  { id: 'trade', label: 'Dealer & trade', summary: 'Dealer (Demonstration), Manufacturer, Repairer and Transporter plates, 1913 onward.' },
  { id: 'industrial', label: 'Industrial & logging', summary: 'Industrial Vehicle (X), Logging Truck, Special Agreement, Restricted and Off-Road plates.' },
  { id: 'carrier', label: 'Carrier & prorate', summary: 'Motor Carrier, Passenger Carrier, Motive Fuel, Prorate/Apportioned and Reciprocity plates, plus a possible temporary X plate.' },
];
export const BC_TRADE_ERAS: PlateEra[] = [
  { id: 'trade-early', family: 'trade', label: 'Porcelain & annual plates', period: [1913, 1963], summary: 'D-prefix Demonstration plates in the colours of each year.' },
  { id: 'trade-annual', family: 'trade', label: 'BEAUTIFUL-era class plates', period: [1964, 1978], summary: 'Class words stamped on the annual and 1976 bases.' },
  { id: 'trade-1979', family: 'trade', label: '1979 red class base', period: [1979, 1986], summary: 'Red on white with the class word replacing BEAUTIFUL.' },
  { id: 'trade-flag', family: 'trade', label: 'Flag base class plates', period: [1985, 2026], summary: 'The class word replaces the slogan; small serif British / Columbia flank the well.' },
  { id: 'industrial-annual', family: 'industrial', label: 'Annual plates', period: [1938, 1979], summary: 'X, XH, PF, T and GR/CL prefixes on annual and quarterly plates.' },
  { id: 'industrial-decal', family: 'industrial', label: '1976 & 1979 bases', period: [1976, 1986], summary: 'Decal bases and dated logging plates.' },
  { id: 'industrial-flag', family: 'industrial', label: 'Flag base', period: [1985, 2026], summary: 'Standard flag base with no class legend (logging with an expiry strip 1985–88).' },
  { id: 'industrial-small', family: 'industrial', label: 'Restricted & off-road', period: [1998, 2026], summary: 'Small plates with a coloured bar across the top.' },
  { id: 'carrier-early', family: 'carrier', label: 'Permits & C.L. plates', period: [1926, 1969], summary: 'Public Works permits and B.C.-yyyy-C.L. motor-carrier plates.' },
  { id: 'carrier-annual', family: 'carrier', label: 'Annual carrier & prorate plates', period: [1961, 1987], summary: 'Motor Carrier, Motive Fuel, Prorate and Reciprocity annuals.' },
  { id: 'carrier-1988', family: 'carrier', label: 'Flag-era carrier plates', period: [1985, 2026], summary: 'Decal-renewed Motor Carrier, Passenger Carrier and Apportioned plates.' },
];
export const BC_TRADE_FORMATS: PlateFormat[] = [...tradeSpecs, ...industrialSpecs, ...carrierSpecs].map(fmt);
