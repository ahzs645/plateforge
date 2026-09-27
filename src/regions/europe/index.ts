import { codedFormat, patternFormat } from '../../core/format';
import { compilePattern } from '../../core/pattern';
import type { PlateFormat, Region } from '../../core/types';
import type { EuDesign } from '../../templates/eu';

const eu = (
  id: string,
  name: string,
  code: string,
  flag: string,
  formats: PlateFormat[],
  design: Partial<EuDesign> = {},
  notes?: string,
): Region => ({
  id: `eu-${id}`,
  name,
  code,
  group: 'Europe',
  flag,
  template: 'eu',
  design: { bandCode: code, ...design },
  formats,
  notes,
});

// ── Germany ───────────────────────────────────────────────────────────────
// District code (1–3) + 1–2 letters + 1–4 digits (no leading zero), 8 characters max.
const DE_DISTRICTS = ['B', 'M', 'HH', 'K', 'F', 'S', 'D', 'DO', 'E', 'HB', 'H', 'L', 'DD', 'N', 'KA', 'MA', 'HD', 'BN', 'MS', 'AC', 'WI', 'KI', 'LU', 'ROS', 'HRO', 'GÖ', 'FFB', 'STA', 'LB', 'ES'];
const DE_LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ';

const germany: PlateFormat = {
  id: 'standard',
  label: 'Standard',
  pattern: 'District · A[A] 9[999] [E|H]',
  description: 'Unterscheidungszeichen, Erkennungsnummer and optional E (electric) / H (historic) suffix.',
  fields: [
    { key: 'district', label: 'District', maxLength: 3 },
    { key: 'letters', label: 'Letters', maxLength: 2 },
    { key: 'digits', label: 'Digits', maxLength: 4 },
    { key: 'suffix', label: 'Suffix', options: [{ value: '', label: 'None' }, { value: 'E', label: 'E — electric' }, { value: 'H', label: 'H — historic' }] },
  ],
  generate(rng) {
    const district = rng.pick(DE_DISTRICTS);
    const letterCount = rng.int(1, 2);
    const letters = Array.from({ length: letterCount }, () => rng.pick(DE_LETTERS)).join('');
    const maxDigits = Math.min(4, 8 - district.length - letterCount);
    const n = rng.int(1, 10 ** rng.int(Math.max(1, maxDigits - 1), maxDigits) - 1);
    return { district, letters, digits: `${n}`, suffix: rng.chance(0.08) ? 'E' : '' };
  },
  validate({ district = '', letters = '', digits = '' }) {
    if (!/^[A-ZÄÖÜ]{1,3}$/.test(district)) return 'District must be 1–3 letters';
    if (!/^[A-Z]{1,2}$/.test(letters)) return 'Letters must be 1–2 letters';
    if (!/^[1-9]\d{0,3}$/.test(digits)) return 'Digits must be 1–4 digits without a leading zero';
    if ((district + letters + digits).length > 8) return 'German plates allow at most 8 characters';
    return null;
  },
  text: (p) => `${p.district} ${p.letters} ${p.digits}${p.suffix ?? ''}`,
};

// ── France ────────────────────────────────────────────────────────────────
const FR_DEPTS = [
  ['75', 'Paris'], ['13', 'Bouches-du-Rhône'], ['69', 'Rhône'], ['33', 'Gironde'], ['06', 'Alpes-Maritimes'],
  ['59', 'Nord'], ['31', 'Haute-Garonne'], ['67', 'Bas-Rhin'], ['44', 'Loire-Atlantique'], ['2A', 'Corse-du-Sud'],
  ['974', 'La Réunion'], ['29', 'Finistère'],
].map(([value, name]) => ({ value, label: `${value} — ${name}` }));
const FR_SERIAL = compilePattern('AA-999-AA', { exclude: 'IOU' });

const france: PlateFormat = {
  id: 'siv',
  label: 'SIV (2009+)',
  pattern: 'AA-999-AA',
  description: 'Système d’immatriculation des véhicules — I, O and U are never used. The department in the right band is the owner’s choice.',
  fields: [
    { key: 'serial', label: 'Serial', maxLength: 9 },
    { key: 'dept', label: 'Department', options: FR_DEPTS },
  ],
  generate: (rng) => ({ serial: FR_SERIAL.generate(rng), dept: rng.pick(FR_DEPTS).value }),
  validate: ({ serial = '' }) => (FR_SERIAL.test(serial) ? null : 'Expected AA-999-AA (no I, O, U)'),
};

// ── Ireland ───────────────────────────────────────────────────────────────
const IE_COUNTIES = ['D', 'C', 'G', 'L', 'KY', 'MH', 'KE', 'WW', 'WX', 'W', 'T', 'LK', 'DL', 'MO', 'SO', 'CE'];
const ireland: PlateFormat = {
  id: 'standard',
  label: 'Standard (2013+)',
  pattern: 'YY[1|2]-C-9…',
  description: 'Year + half-year period, county index mark, then a sequence number.',
  fields: [
    { key: 'year', label: 'Year + period', maxLength: 3 },
    { key: 'county', label: 'County', options: IE_COUNTIES.map((c) => ({ value: c, label: c })) },
    { key: 'seq', label: 'Sequence', maxLength: 6 },
  ],
  generate: (rng) => ({
    year: `${rng.int(13, 26)}${rng.int(1, 2)}`,
    county: rng.pick(IE_COUNTIES),
    seq: `${rng.int(1, rng.pick([999, 9999, 99999]))}`,
  }),
  validate: ({ year = '', seq = '' }) =>
    !/^\d{2}[12]$/.test(year) ? 'Year must be YY followed by 1 or 2' : !/^[1-9]\d{0,5}$/.test(seq) ? 'Sequence must be a number' : null,
  text: (p) => `${p.year}-${p.county}-${p.seq}`,
};

const SWISS_CANTONS = ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'];
const PL_COUNTIES = ['WA', 'WE', 'WI', 'KR', 'KK', 'PO', 'PZ', 'GD', 'GA', 'DW', 'LU', 'SK', 'BI', 'OP', 'ZS', 'EL', 'TK', 'RZ', 'NO', 'CB'];
const AT_DISTRICTS = ['W', 'G', 'L', 'S', 'I', 'K', 'SP', 'BN', 'KO', 'VB', 'MD', 'WN', 'GU', 'LL', 'VL', 'KU'];
const NL_LETTERS = 'BDFGHJKLNPRSTVXZ';
const ES_CONSONANTS = 'BCDFGHJKLMNPRSTVWXYZ';
const UK_MEMORY = 'ABCDEFGHJKLMNOPRSTUVWXY';

const ukFormats = (): PlateFormat[] => {
  const opts = { exclude: 'IQ', sets: { mem: UK_MEMORY, age: '0125678' } };
  return [
    patternFormat({ id: 'front', label: 'Front (white)', pattern: 'AA{age}9 AAA', options: opts, description: 'Memory tag, age identifier, random letters. Front plates are white.' }),
    patternFormat({ id: 'rear', label: 'Rear (yellow)', pattern: 'AA{age}9 AAA', options: opts, design: { bg: '#f8d21c' }, description: 'Rear plates use reflective yellow.' }),
  ];
};

export const europeRegions: Region[] = [
  eu('de', 'Germany', 'D', '🇩🇪', [
    germany,
  ], { seals: true }),
  eu('fr', 'France', 'F', '🇫🇷', [france], { rightBand: '#1c3f94', rightBandKey: 'dept' }),
  eu('it', 'Italy', 'I', '🇮🇹', [
    patternFormat({ id: 'standard', label: 'Standard (1994+)', pattern: 'AA 999AA', options: { exclude: 'IOQU' } }),
  ], { rightBand: '#1c3f94' }),
  eu('es', 'Spain', 'E', '🇪🇸', [
    patternFormat({ id: 'standard', label: 'Standard (2000+)', pattern: '9999 {c}{c}{c}', options: { sets: { c: ES_CONSONANTS } }, description: 'Four digits and three consonants — no vowels, Ñ or Q.' }),
  ]),
  eu('pt', 'Portugal', 'P', '🇵🇹', [
    patternFormat({ id: 'standard', label: 'Standard (2020+)', pattern: 'AA-99-AA', options: { exclude: 'KWY' } }),
  ], { rightBand: '#f2c318' }),
  eu('nl', 'Netherlands', 'NL', '🇳🇱', [
    patternFormat({
      id: 'sidecode',
      label: 'Sidecodes 9–11',
      pattern: ['{l}{l}-999-{l}', '{l}-999-{l}{l}', '99-{l}{l}{l}-9', '9-{l}{l}{l}-99'],
      options: { sets: { l: NL_LETTERS } },
      description: 'Dutch “sidecodes” — vowels, C, M, Q and W are avoided.',
    }),
  ], { bg: '#f8c80a' }),
  eu('be', 'Belgium', 'B', '🇧🇪', [
    patternFormat({ id: 'standard', label: 'Standard (2010+)', pattern: '[12]-AAA-999' }),
  ], { text: '#b3202a', border: '#b3202a' }),
  eu('lu', 'Luxembourg', 'L', '🇱🇺', [
    patternFormat({ id: 'standard', label: 'Standard', pattern: 'AA 9999' }),
  ], { bg: '#f8d21c' }),
  eu('at', 'Austria', 'A', '🇦🇹', [
    codedFormat({ id: 'standard', label: 'Standard', code: { key: 'district', label: 'District', values: AT_DISTRICTS }, pattern: ['99999A', '9999AA', '999AA', '99AAA'], join: (c, s) => `${c} ${s}` }),
  ], { stripes: '#c8102e', seals: true }),
  eu('ch', 'Switzerland', 'CH', '🇨🇭', [
    codedFormat({ id: 'standard', label: 'Standard', code: { key: 'canton', label: 'Canton', values: SWISS_CANTONS }, pattern: ['9999', '99999', '999999'] }),
  ], { band: 'none' }),
  eu('pl', 'Poland', 'PL', '🇵🇱', [
    codedFormat({ id: 'standard', label: 'Standard', code: { key: 'county', label: 'Voivodeship / county', values: PL_COUNTIES }, pattern: ['99999', '9999A', '999AA', '9A999', '9AA99'], options: { exclude: 'BDIOZ' } }),
  ]),
  eu('cz', 'Czech Republic', 'CZ', '🇨🇿', [
    patternFormat({ id: 'standard', label: 'Standard', pattern: '9A9 9999', options: { exclude: 'GOQW' } }),
  ]),
  eu('dk', 'Denmark', 'DK', '🇩🇰', [
    patternFormat({ id: 'standard', label: 'Standard', pattern: 'AA 99 999', options: { exclude: 'IOQ' } }),
  ], { border: '#c8102e' }),
  eu('se', 'Sweden', 'S', '🇸🇪', [
    patternFormat({ id: 'standard', label: 'Standard', pattern: ['AAA 999', 'AAA 99A'], options: { exclude: 'IQVO' }, description: 'Since 2019 the last character may be a letter.' }),
  ]),
  eu('fi', 'Finland', 'FIN', '🇫🇮', [
    patternFormat({ id: 'standard', label: 'Standard', pattern: 'AAA-999', options: { exclude: 'QW' } }),
  ]),
  eu('no', 'Norway', 'N', '🇳🇴', [
    patternFormat({ id: 'standard', label: 'Standard', pattern: 'AA 99999', options: { exclude: 'GIMOQW' } }),
    patternFormat({ id: 'ev', label: 'Electric (EL/EK/EV…)', pattern: 'E[BCDEKLV] 99999', design: { text: '#0a6e3c' } }),
  ], { band: 'national', bandColor: '#00205b' }),
  eu('ie', 'Ireland', 'IRL', '🇮🇪', [ireland]),
  eu('gb', 'United Kingdom', 'UK', '🇬🇧', ukFormats(), { band: 'national', bandColor: '#012169', font: 'uk' }),
];
