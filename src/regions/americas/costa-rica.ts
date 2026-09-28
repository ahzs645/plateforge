import type { Rng } from '../../core/random';
import type { FieldDef, Parts, PlateFormat, PlateStatus, Region } from '../../core/types';
import { CR_BLACK, CR_BLUE, CR_RED, type CrDesign } from '../../templates/cr';

const REVIEW_YEAR = 2026; // End of researched coverage, NOT a withdrawal date.
const S2013: readonly [number, number] = [2013, REVIEW_YEAR];

const REF = {
  wiki: { title: 'Wikipedia — Vehicle registration plates of Costa Rica', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Costa_Rica' },
  chart: { title: 'Wikimedia Commons — Placas de matrículas Costa Rica 2013 (drawn class chart)', url: 'https://commons.wikimedia.org/wiki/File:Placas_de_matr%C3%ADculas_Costa_Rica_2013.png' },
  classes: { title: 'registronacional.com — Clases de placas de vehículos (Registro class codes)', url: 'https://registronacional.com/costarica/vehiculos_placa_clases.htm' },
  alpha: { title: 'La Nación (2021) — Placa con letras y números: tres letras y tres números, sin vocales', url: 'https://www.nacion.com/el-pais/servicios/solicitar-placa-con-letras-y-numeros-para-su/JCDFXXMUP5EENFYPYTAIDZVFVM/story/' },
  vowels: { title: 'El Financiero (2024) — Registro Nacional permite vocales en placas alfanuméricas', url: 'https://www.elfinancierocr.com/economia-y-politica/registro-nacional-anuncia-cambios-en-la-seleccion/UJCV2ZFFGREAVJXDUIH3PFHDYQ/story/' },
  green: { title: 'La Nación (27 Feb 2019) — Autos eléctricos tendrán placas verdes', url: 'https://www.nacion.com/el-pais/infraestructura/gobierno-lanza-placas-verdes-para-vehiculos/DPUASSIAKJCPTFCSKFC5HJUDBY/story/' },
  moto: { title: 'La Nación (28 Dec 2025) — Placas de motocicleta cambiarán de formato (MOT 123ABC)', url: 'https://www.nacion.com/el-pais/placas-de-motocicleta-cambiaran-de-formato-en/AF5PDRWEGJG6ND65DU7ODSL32Y/story/' },
} as const;

/** Taxi class codes by province (Registro Nacional class list). */
export const CR_TAXI_PREFIXES = [
  { value: 'TSJ', label: 'TSJ — San José' }, { value: 'TA', label: 'TA — Alajuela' }, { value: 'TC', label: 'TC — Cartago' },
  { value: 'TH', label: 'TH — Heredia' }, { value: 'TP', label: 'TP — Puntarenas' }, { value: 'TG', label: 'TG — Guanacaste' },
  { value: 'TL', label: 'TL — Limón' },
] as const;
/** Bus class codes by province. */
export const CR_BUS_PREFIXES = [
  { value: 'SJB', label: 'SJB — San José' }, { value: 'AB', label: 'AB — Alajuela' }, { value: 'CB', label: 'CB — Cartago' },
  { value: 'HB', label: 'HB — Heredia' }, { value: 'PB', label: 'PB — Puntarenas' }, { value: 'GB', label: 'GB — Guanacaste' },
  { value: 'LB', label: 'LB — Limón' },
] as const;

/** Sequential alphanumeric series skip vowels (first series BBB); vowels are allowed on chosen plates since Oct 2024. */
export const CR_SERIES_LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ';

const digits = (rng: Rng, n: number) => Array.from({ length: n }, (_, i) => rng.pick(i ? '0123456789' : '123456789')).join('');
/** 1–6 digits, weighted toward full-length numbers. */
const upTo6 = (rng: Rng) => digits(rng, rng.chance(0.85) ? 6 : rng.int(1, 5));
const anyDigits = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick('0123456789')).join('');
const letters = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick(CR_SERIES_LETTERS)).join('');

const NUMERIC_6 = /^\d{1,6}$/;
const flagField: FieldDef = { key: 'flag', label: 'Flag', preserveOnGenerate: true, options: [{ value: 'flag', label: 'With flag' }, { value: 'none', label: 'No flag' }] };

interface Spec {
  id: string;
  label: string;
  family: 'private' | 'commercial' | 'special';
  pattern: string;
  description: string;
  references: readonly { title: string; url: string }[];
  design: CrDesign;
  serial: (rng: Rng) => string;
  shape: RegExp;
  maxLength: number;
  hint?: string;
  period?: readonly [number, number];
  status?: PlateStatus;
  /** Select-able prefix (taxi/bus province code). */
  prefixes?: readonly { value: string; label: string }[];
  /** Two stacked digits before the serial (diplomatic, mission, executive). */
  code?: boolean;
  /** Plain-text reading; defaults to prefix + serial. */
  text?: (p: Parts) => string;
}

function cr(spec: Spec): PlateFormat {
  const embossed = spec.design.series === 'embossed';
  const fields: FieldDef[] = [
    ...(spec.prefixes ? [{ key: 'prefix', label: 'Class / province', options: [...spec.prefixes] }] : []),
    ...(spec.code ? [{ key: 'code', label: 'Stacked code', maxLength: 2, placeholder: '12' }] : []),
    { key: 'serial', label: 'Serial', maxLength: spec.maxLength, placeholder: spec.hint },
    ...(embossed ? [flagField] : []),
  ];
  const fixed = spec.design.prefix ?? '';
  return {
    id: spec.id, label: spec.label, family: spec.family, pattern: spec.pattern, description: spec.description,
    references: spec.references, design: spec.design, fields,
    ...(spec.period ? { period: spec.period } : {}),
    ...(spec.status ? { status: spec.status } : {}),
    generate: (rng) => ({
      ...(spec.prefixes ? { prefix: rng.pick(spec.prefixes).value } : {}),
      ...(spec.code ? { code: `${rng.int(1, 9)}${rng.int(1, 9)}` } : {}),
      serial: spec.serial(rng),
      ...(embossed ? { flag: 'flag' } : {}),
    }),
    validate: (p) => {
      if (spec.prefixes && !spec.prefixes.some((o) => o.value === p.prefix)) return 'Choose a class / province code.';
      if (spec.code && !/^\d{2}$/.test(p.code ?? '')) return 'Stacked code is two digits.';
      return spec.shape.test(p.serial ?? '') ? null : `Serial should look like ${spec.pattern}`;
    },
    text: spec.text ?? ((p) => [p.prefix ?? fixed, spec.code ? `${p.code}·${p.serial}` : p.serial].filter(Boolean).join(' ')),
  };
}

const BLUE: CrDesign = { ink: CR_BLUE };
const RED: CrDesign = { ink: CR_RED };
const BLACK: CrDesign = { ink: CR_BLACK };
const YELLOW_BG = '#f4e616';
const NOTE_2013 = 'Flat 2013 series with a grey security strip at the left edge. Colours and layout follow a drawn Commons chart and Wikipedia; the lettering is Barlow Condensed, not the official die.';
const NOTE_EMBOSSED = 'Embossed series in use before the 2013 replacement (completed early 2015); introduction year not established. Layout reconstructed from photographs of blank plates.';

const SERIES_2013: PlateFormat[] = [
  cr({
    id: 'private', label: 'Private · ABC-123', family: 'private', period: S2013, pattern: 'AAA-999', hint: 'BBB-123',
    description: `Private cars: three letters and three digits. Sequential issue skips vowels (first series BBB); owner-chosen plates may use vowels since October 2024. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.alpha, REF.vowels], design: BLUE, maxLength: 7,
    serial: (rng) => `${letters(rng, 3)}-${anyDigits(rng, 3)}`, shape: /^[A-Z]{3}-\d{3}$/,
  }),
  cr({
    id: 'private-numeric', label: 'Private · numeric', family: 'private', period: S2013, pattern: '1–6 digits', hint: '123456',
    description: `Older all-numeric private registrations (up to 999999) carried onto the 2013 plate. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart], design: BLUE, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'electric', label: 'Electric (green) · ABC-123', family: 'private', period: [2019, REVIEW_YEAR], pattern: 'AAA-999', hint: 'FGM-226',
    description: 'Green plate for zero-emission (battery-electric) vehicles under Ley 9518, from February 2019; hybrids are excluded. Green and ink shades are approximate.',
    references: [REF.wiki, REF.green], design: { ink: '#1b3a7a', bg: '#2fc3a1', frame: '#1b3a7a' }, maxLength: 7,
    serial: (rng) => `${letters(rng, 3)}-${anyDigits(rng, 3)}`, shape: /^[A-Z]{3}-\d{3}$/,
  }),
  cr({
    id: 'motorcycle', label: 'Motorcycle · M 123456', family: 'private', period: S2013, pattern: 'M bar + 1–6 digits', hint: '225846',
    description: `Registry class MOT; the plate shows M in a yellow side bar. Smaller plate — the drawn size is approximate. Numeric series reached 999999 in December 2025. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.classes], design: { ...BLUE, prefix: 'M', prefixStyle: 'bar', compact: true }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'motorcycle-alpha', label: 'Motorcycle · MOT 123ABC', family: 'private', period: [2025, REVIEW_YEAR], status: 'uncertain', pattern: 'M bar + 999AAA', hint: '123BCD',
    description: 'From late December 2025, after numeric plate 999999: three digits then three letters, written “MOT 123ABC” by the Registro. The physical layout is not yet confirmed; drawn like the numeric motorcycle plate.',
    references: [REF.moto], design: { ...BLUE, prefix: 'M', prefixStyle: 'bar', compact: true }, maxLength: 6,
    serial: (rng) => `${anyDigits(rng, 3)}${letters(rng, 3)}`, shape: /^\d{3}[A-Z]{3}$/,
  }),
  cr({
    id: 'disabled', label: 'Disabled driver · D-123', family: 'private', period: S2013, pattern: 'D-999 | D-9999', hint: 'D-699',
    description: `Class D plates for drivers with disabilities (issued since 2004) carry an access-symbol panel. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.classes], design: { ...BLUE, wheelchair: true }, maxLength: 6,
    serial: (rng) => `D-${digits(rng, rng.chance(0.7) ? 3 : 4)}`, shape: /^D-\d{3,4}$/, text: (p) => p.serial,
  }),
  cr({
    id: 'historical', label: 'Historical vehicle · VH', family: 'private', period: S2013, status: 'uncertain', pattern: 'VH + 2–4 digits', hint: '30',
    description: 'Yellow plate with stacked VH. Listed by Wikipedia only; VH does not appear in the Registro class list consulted.',
    references: [REF.wiki, REF.chart], design: { ...BLACK, bg: YELLOW_BG, prefix: 'VH', prefixStyle: 'stack' }, maxLength: 4,
    serial: (rng) => digits(rng, rng.int(2, 4)), shape: /^\d{2,4}$/,
  }),
  cr({
    id: 'heavy-cargo', label: 'Heavy cargo · C', family: 'commercial', period: S2013, pattern: 'C bar + 1–6 digits', hint: '457611',
    description: `Class C (carga pesada), red, with C in the yellow side bar. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.classes], design: { ...RED, prefix: 'C', prefixStyle: 'bar' }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'light-cargo', label: 'Light cargo · CL', family: 'commercial', period: S2013, pattern: 'CL bar + 1–6 digits', hint: '561937',
    description: `Class CL (carga liviana), red, with C over L in the yellow side bar. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.classes], design: { ...RED, prefix: 'CL', prefixStyle: 'bar' }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'taxi', label: 'Taxi · TSJ 1234', family: 'commercial', period: S2013, pattern: 'Province code bar + 1–5 digits', hint: '1234',
    description: `Taxi class code by province, stacked in the yellow bar; red ink. The Commons chart also shows a red-background TA variant, not reproduced here. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.classes], design: { ...RED, prefixStyle: 'bar' }, prefixes: CR_TAXI_PREFIXES, maxLength: 5,
    serial: (rng) => digits(rng, rng.chance(0.8) ? 4 : rng.pick([3, 5])), shape: /^\d{1,5}$/,
  }),
  cr({
    id: 'bus', label: 'Bus · SJB 1234', family: 'commercial', period: S2013, pattern: 'Province code bar + 1–5 digits', hint: '1234',
    description: `Bus class code by province (SJB San José, AB Alajuela …), stacked in the yellow bar; black ink. ${NOTE_2013}`,
    references: [REF.wiki, REF.chart, REF.classes], design: { ...BLACK, prefixStyle: 'bar' }, prefixes: CR_BUS_PREFIXES, maxLength: 5,
    serial: (rng) => digits(rng, rng.chance(0.8) ? 4 : rng.pick([3, 5])), shape: /^\d{1,5}$/,
  }),
  cr({
    id: 'official', label: 'Official vehicle · 12-3456', family: 'special', period: S2013, status: 'uncertain', pattern: '99-9999', hint: '29-6944',
    description: 'Government vehicle, red on white, no prefix. Meaning of the two-digit group (institution) is not verified.',
    references: [REF.wiki, REF.chart], design: RED, maxLength: 7, serial: (rng) => `${digits(rng, 2)}-${digits(rng, 4)}`, shape: /^\d{2}-\d{4}$/,
  }),
  cr({
    id: 'executive', label: 'Poder Ejecutivo · PE', family: 'special', period: S2013, status: 'uncertain', pattern: 'PE + 2 stacked digits · 9999', hint: '4122', code: true,
    description: 'Executive-branch plate in green: stacked PE and a stacked two-digit code, then four digits. Code meaning not verified.',
    references: [REF.wiki, REF.chart, REF.classes], design: { ink: '#1d6b2e', prefix: 'PE', prefixStyle: 'stack' }, maxLength: 4,
    serial: (rng) => digits(rng, 4), shape: /^\d{4}$/,
  }),
  cr({
    id: 'diplomatic', label: 'Diplomatic corps · CD', family: 'special', period: S2013, status: 'uncertain', pattern: 'CD + 2 stacked digits · 999', hint: '427', code: true,
    description: 'Cuerpo Diplomático: black on white, stacked CD and a stacked two-digit code, then three digits.',
    references: [REF.wiki, REF.chart, REF.classes], design: { ...BLACK, prefix: 'CD', prefixStyle: 'stack' }, maxLength: 3,
    serial: (rng) => digits(rng, 3), shape: /^\d{3}$/,
  }),
  cr({
    id: 'consular', label: 'Consular corps · CC', family: 'special', period: S2013, status: 'uncertain', pattern: 'CC + 9-99', hint: '4-77',
    description: 'Cuerpo Consular: black on white, stacked CC, then digit-hyphen-two digits.',
    references: [REF.wiki, REF.chart, REF.classes], design: { ...BLACK, prefix: 'CC', prefixStyle: 'stack' }, maxLength: 4,
    serial: (rng) => `${rng.int(1, 9)}-${anyDigits(rng, 2)}`, shape: /^\d-\d{2}$/,
  }),
  cr({
    id: 'mission', label: 'International mission · MI', family: 'special', period: S2013, status: 'uncertain', pattern: 'MI + 2 stacked digits · 999', hint: '289', code: true,
    description: 'Misión Internacional: yellow plate, stacked MI and a stacked two-digit code, then three digits.',
    references: [REF.wiki, REF.chart, REF.classes], design: { ...BLACK, bg: YELLOW_BG, prefix: 'MI', prefixStyle: 'stack' }, maxLength: 3,
    serial: (rng) => digits(rng, 3), shape: /^\d{3}$/,
  }),
];

const EMBOSSED: PlateFormat[] = [
  cr({
    id: 'embossed-private', label: 'Embossed · private 123456', family: 'private', pattern: '1–6 digits', hint: '398259',
    description: `Blue on white. ${NOTE_EMBOSSED}`,
    references: [REF.wiki], design: { ...BLUE, series: 'embossed' }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'embossed-motorcycle', label: 'Embossed · motorcycle M', family: 'private', pattern: 'M + 1–6 digits', hint: '876232',
    description: `Blue, with a small M before the number. Drawn at car-plate size. ${NOTE_EMBOSSED}`,
    references: [REF.wiki], design: { ...BLUE, series: 'embossed', prefix: 'M', prefixStyle: 'stack' }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'embossed-disabled', label: 'Embossed · disabled D', family: 'private', status: 'uncertain', pattern: 'D + 3 digits', hint: '693',
    description: `Blue with an access-symbol panel; the panel on the source photograph may be a later edit. ${NOTE_EMBOSSED}`,
    references: [REF.classes], design: { ...BLUE, series: 'embossed', prefix: 'D', prefixStyle: 'inline', wheelchair: true }, maxLength: 4,
    serial: (rng) => digits(rng, 3), shape: /^\d{3,4}$/,
  }),
  cr({
    id: 'embossed-light-cargo', label: 'Embossed · light cargo CL', family: 'commercial', pattern: 'CL + 1–6 digits', hint: '040479',
    description: `Red, C over L stacked before the number. ${NOTE_EMBOSSED}`,
    references: [REF.wiki, REF.classes], design: { ...RED, series: 'embossed', prefix: 'CL', prefixStyle: 'stack' }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
  }),
  cr({
    id: 'embossed-heavy-cargo', label: 'Embossed · heavy cargo C', family: 'commercial', pattern: 'C123456', hint: '510273',
    description: `Red, full-height C run in with the number. ${NOTE_EMBOSSED}`,
    references: [REF.wiki, REF.classes], design: { ...RED, series: 'embossed', prefix: 'C', prefixStyle: 'inline' }, maxLength: 6, serial: upTo6, shape: NUMERIC_6,
    text: (p) => `C${p.serial}`,
  }),
  cr({
    id: 'embossed-taxi', label: 'Embossed · taxi TSJ', family: 'commercial', pattern: 'Province code bar + 1–5 digits', hint: '9589',
    description: `Red, province code stacked in a yellow side bar. ${NOTE_EMBOSSED}`,
    references: [REF.wiki, REF.classes], design: { ...RED, series: 'embossed', prefixStyle: 'bar' }, prefixes: CR_TAXI_PREFIXES, maxLength: 5,
    serial: (rng) => digits(rng, 4), shape: /^\d{1,5}$/,
  }),
  cr({
    id: 'embossed-bus', label: 'Embossed · bus SJB', family: 'commercial', status: 'uncertain', pattern: 'Province code bar + 1–5 digits', hint: '1234',
    description: `Black-rimmed blank with a yellow side bar is known from photographs; its use for buses is inferred from the 2013 colours. ${NOTE_EMBOSSED}`,
    references: [REF.classes], design: { ...BLACK, series: 'embossed', prefixStyle: 'bar' }, prefixes: CR_BUS_PREFIXES, maxLength: 5,
    serial: (rng) => digits(rng, 4), shape: /^\d{1,5}$/,
  }),
];

export const costaRica: Region = {
  id: 'cr', name: 'Costa Rica', code: 'CR', flag: '🇨🇷', group: 'North America', template: 'cr', design: { series: '2013' },
  notes: 'Registro Nacional plates, 12 × 6 in. The class code precedes the number (SJB 001 is a San José bus). Validation checks the documented shape, not whether a registration exists. Timeline end 2026 means researched through 2026.',
  families: [
    { id: 'private', label: 'Private, motorcycle & special use', summary: 'Private cars, electric, motorcycles, disabled drivers and historical vehicles.' },
    { id: 'commercial', label: 'Cargo, taxi & bus' },
    { id: 'special', label: 'Official & diplomatic' },
  ],
  eras: [
    { id: 'private-2013', label: '2013 series', period: S2013, family: 'private', summary: 'Replacement of every plate began mid-2013 and finished early 2015.' },
    { id: 'commercial-2013', label: '2013 series', period: S2013, family: 'commercial' },
    { id: 'special-2013', label: '2013 series', period: S2013, family: 'special' },
  ],
  formats: [...SERIES_2013, ...EMBOSSED],
};
