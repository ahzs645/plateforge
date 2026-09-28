/**
 * Czech Republic (CZ). Regional series since 2001: digit 1–9, region letter,
 * then a digit — or, once a region exhausted its range, a letter — and four
 * digits. Plate sizes and sticker fields follow the Ministry of Transport type
 * catalogue (types 101–119, 401–419, 701–719).
 */
import type { Rng } from '../../core/random';
import type { FieldDef, FieldOption, Parts, PlateFormat, Region } from '../../core/types';
import type { EuDesign, EuSize } from '../../templates/eu';

const SOURCES = {
  types: { title: 'MD ČR — Typy tabulek s registrační značkou (po 1. 1. 2016)', url: 'https://md.gov.cz/Dokumenty/Silnicni-doprava/Registrace-vozidel/Nove-registracni-znacky' },
  decree: { title: 'Vyhláška č. 343/2014 Sb., o registraci vozidel (§ 25–29)', url: 'https://www.zakonyprolidi.cz/cs/2014-343' },
  wiki: { title: 'Státní poznávací značky v Česku — Wikipedie', url: 'https://cs.wikipedia.org/wiki/St%C3%A1tn%C3%AD_pozn%C3%A1vac%C3%AD_zna%C4%8Dky_v_%C4%8Cesku' },
  prague: { title: 'Registr vozidel — Nový formát SPZ v Praze po 21 letech', url: 'https://www.registr-vozidel.cz/aktuality/novy-format-spz-v-praze-po-21-letech' },
  el: { title: 'Zdopravy.cz — EL 12345: elektromobily dostanou speciální registrační značky', url: 'https://zdopravy.cz/el-12345-elektromobily-dostanou-specialni-registracni-znacky-19768/' },
} as const;

export const CZ_REGIONS: readonly FieldOption[] = [
  ['A', 'Praha'], ['S', 'Středočeský'], ['C', 'Jihočeský'], ['P', 'Plzeňský'], ['K', 'Karlovarský'],
  ['U', 'Ústecký'], ['L', 'Liberecký'], ['H', 'Královéhradecký'], ['E', 'Pardubický'], ['J', 'Vysočina'],
  ['B', 'Jihomoravský'], ['M', 'Olomoucký'], ['T', 'Moravskoslezský'], ['Z', 'Zlínský'],
].map(([value, name]) => ({ value, label: `${value} — ${name}` }));

/** G, O, Q and W never appear; CH is additionally barred from personalised plates. */
export const CZ_LETTERS = 'ABCDEFHIJKLMNPRSTUVXYZ';
const DIGITS = '0123456789';
/** Regions documented as having moved to a letter in the third position (Praha 2009, Středočeský, Jihomoravský 2014, Moravskoslezský 2015, Jihočeský 2023). */
const LETTER_SERIES = 'ASBTC';

const regionField: FieldDef = { key: 'region', label: 'Region (kraj)', options: CZ_REGIONS };
const isRegion = (r = '') => CZ_REGIONS.some((o) => o.value === r);
const letter = new RegExp(`^[${CZ_LETTERS}]$`);
const pickLetters = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick(CZ_LETTERS)).join('');
const pickDigits = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick(DIGITS)).join('');

/** Shared validation for the leading digit, region and four-character number (`9999` or `A999`). */
function checkCommon(p: Parts, needLetterSeries: boolean): string | null {
  if (!/^[1-9]$/.test(p.digit ?? '')) return 'First character must be a digit 1–9';
  if (!isRegion(p.region)) return 'Choose a region letter';
  const n = p.number ?? '';
  if (/^\d{4}$/.test(n)) return null;
  if (/^[A-Z]\d{3}$/.test(n)) {
    if (!letter.test(n[0])) return 'G, O, Q and W are not used';
    return needLetterSeries ? 'A letter after the space follows a letter in the third position (1AA A000)' : null;
  }
  return 'Number must be four digits, or a letter and three digits';
}

// ── Standard cars (and two-row variants) ────────────────────────────────────
function carFormat(id: string, label: string, size: EuSize, description: string): PlateFormat {
  return {
    id,
    label,
    family: 'car',
    pattern: '9R9 9999  |  9RA 9999  |  9RA A999 (R = region)',
    description,
    references: [SOURCES.types, SOURCES.wiki, SOURCES.prague],
    fields: [
      { key: 'digit', label: 'Leading digit', maxLength: 1, placeholder: '1' },
      regionField,
      { key: 'series', label: '3rd character', maxLength: 1, placeholder: '2' },
      { key: 'number', label: 'Number', maxLength: 4, placeholder: '3456' },
    ],
    generate(rng) {
      const region = rng.pick(CZ_REGIONS).value;
      const lettered = LETTER_SERIES.includes(region) && rng.chance(0.5);
      const series = lettered ? rng.pick(CZ_LETTERS) : rng.pick(DIGITS);
      // Praha's 2023 series puts a third letter after the space.
      const number = lettered && region === 'A' && rng.chance(0.4) ? rng.pick(CZ_LETTERS) + pickDigits(rng, 3) : pickDigits(rng, 4);
      return { digit: `${rng.int(1, 9)}`, region, series: region === 'S' && series === 'S' ? 'R' : series, number };
    },
    validate(p) {
      const s = p.series ?? '';
      if (!/^\d$/.test(s) && !letter.test(s)) return '3rd character must be a digit or a letter other than G, O, Q, W';
      if (p.region === 'S' && s === 'S') return 'The xSS series is not issued in Středočeský kraj';
      return checkCommon(p, !letter.test(s));
    },
    text: (p) => `${p.digit ?? ''}${p.region ?? ''}${p.series ?? ''} ${p.number ?? ''}`,
    design: { size, seals: 'cz' } satisfies EuDesign,
  };
}

const TWO_ROW_NOTE = 'Same serial as the long plate, set 3 over 4 with the EU band in the top-left corner and both sticker fields beside the first row.';

// ── Personalised plates ("na přání", since 2017) ────────────────────────────
/** Our own short list of blocked words: authority names and obvious profanity. */
export const CZ_RESERVED = ['POLICIE', 'POLICE', 'HZS', 'ZZS', 'ARMADA', 'HASICI', 'VLADA', 'SOUD', 'CELNI', 'URAD', 'KURVA', 'PICA', 'KOKOT', 'PRDEL', 'HOVNO', 'FUCK', 'SHIT', 'NAZI', 'HITLER'];

/** Rules of § 25 of the decree: exact length, A–Z/0–9, at least one digit, no G/O/Q/W/CH, nothing reserved. */
export function checkVanity(serial: string, length: number): string | null {
  if (!/^[A-Z0-9]*$/.test(serial)) return 'Only letters A–Z and digits (no diacritics or symbols)';
  if (serial.length !== length) return `Exactly ${length} characters`;
  const bad = serial.match(/[GOQW]/);
  if (bad) return `The letter ${bad[0]} is not allowed`;
  if (serial.includes('CH')) return 'The group CH is not allowed';
  if (!/\d/.test(serial)) return 'At least one digit is required';
  // Catch look-alike digits too (P0LICIE, KURV4).
  const plain = serial.replace(/0/g, 'O').replace(/1/g, 'I').replace(/4/g, 'A').replace(/5/g, 'S');
  const word = CZ_RESERVED.find((w) => plain.includes(w));
  return word ? `Contains a reserved or offensive word (${word})` : null;
}

function randomVanity(rng: Rng, length: number): string {
  for (;;) {
    const digits = rng.int(1, Math.max(1, length - 2));
    const letters = pickLetters(rng, length - digits);
    const nums = pickDigits(rng, digits);
    const s = rng.chance(0.75) ? letters + nums : nums + letters;
    if (checkVanity(s, length) === null) return s;
  }
}

const LAYOUTS: FieldDef = {
  key: 'layout',
  label: 'Plate size',
  preserveOnGenerate: true,
  options: [
    { value: 'standard', label: '520 × 110 mm (type 701)' },
    { value: 'truck', label: '340 × 200 mm (type 703/704)' },
    { value: 'van', label: '280 × 200 mm (type 705/706)' },
    { value: 'square', label: '320 × 160 mm (type 715/716)' },
  ],
};

function vanityFormat(id: string, label: string, family: string, length: number, top: number, size: EuSize | 'choice', description: string): PlateFormat {
  const choice = size === 'choice';
  return {
    id,
    label,
    family,
    pattern: `${length} × [A–Z 0–9], ≥ 1 digit, no G O Q W CH`,
    description,
    references: [SOURCES.decree, SOURCES.types, SOURCES.wiki],
    fields: [{ key: 'serial', label: 'Serial', maxLength: length, placeholder: 'A'.repeat(length - 1) + '1' }, ...(choice ? [LAYOUTS] : [])],
    generate: (rng) => ({ serial: randomVanity(rng, length), ...(choice ? { layout: 'standard' } : {}) }),
    validate: (p) =>
      checkVanity(p.serial ?? '', length) ??
      (choice && !LAYOUTS.options!.some((o) => o.value === p.layout) ? 'Choose a plate size' : null),
    text: (p) => `${(p.serial ?? '').slice(0, top)} ${(p.serial ?? '').slice(top)}`,
    design: (choice ? { sizeKey: 'layout', seals: 'cz' } : size === 'moped' ? { size } : { size, seals: 'cz' }) satisfies EuDesign,
  };
}

// ── Motorcycles ──────────────────────────────────────────────────────────────
const motorcycle: PlateFormat = {
  id: 'motorcycle',
  label: 'Motorcycle (200 × 160)',
  family: 'motorcycle',
  pattern: '9R / 9999  |  9R / A999',
  description: 'Type 118: digit and region letter over four characters, one sticker field beside the top row and the EU band top left.',
  references: [SOURCES.types, SOURCES.wiki],
  fields: [
    { key: 'digit', label: 'Leading digit', maxLength: 1, placeholder: '1' },
    regionField,
    { key: 'number', label: 'Number', maxLength: 4, placeholder: '2345' },
  ],
  generate: (rng) => {
    const region = rng.pick(CZ_REGIONS).value;
    const number = region === 'A' && rng.chance(0.3) ? rng.pick(CZ_LETTERS) + pickDigits(rng, 3) : pickDigits(rng, 4);
    return { digit: `${rng.int(1, 9)}`, region, number };
  },
  validate: (p) => checkCommon(p, false),
  text: (p) => `${p.digit ?? ''}${p.region ?? ''} ${p.number ?? ''}`,
  design: { size: 'moto', seals: 'cz' } satisfies EuDesign,
};

// ── Special series ───────────────────────────────────────────────────────────
const electric: PlateFormat = {
  id: 'electric',
  label: 'Electric (EL)',
  family: 'car',
  pattern: 'EL9 99AA',
  description: 'Vehicles emitting at most 50 g CO₂/km: EL, a digit, then two digits and two letters (EL0 01AA – EL9 99ZZ). Black on white like the regional plates.',
  references: [SOURCES.el, SOURCES.wiki],
  fields: [{ key: 'serial', label: 'Serial', maxLength: 8, placeholder: 'EL0 01AA' }],
  generate: (rng) => {
    let s: string;
    do s = `EL${pickDigits(rng, 1)} ${pickDigits(rng, 2)}${pickLetters(rng, 2)}`;
    while (s.startsWith('EL0 00'));
    return { serial: s };
  },
  validate: ({ serial = '' }) =>
    !new RegExp(`^EL\\d \\d\\d[${CZ_LETTERS}]{2}$`).test(serial) ? 'Expected EL9 99AA (no G, O, Q, W)' : serial.startsWith('EL0 00') ? 'The range starts at EL0 01AA' : null,
  design: { seals: 'cz' } satisfies EuDesign,
};

const historic: PlateFormat = {
  id: 'historic',
  label: 'Historic vehicle (V)',
  family: 'car',
  status: 'uncertain',
  pattern: '99V 9999',
  description: 'Type 401: green characters and border on white, two digits, V, four digits. The meaning of the two-digit prefix is not verified, so any pair is accepted.',
  references: [SOURCES.types, SOURCES.wiki],
  fields: [{ key: 'serial', label: 'Serial', maxLength: 8, placeholder: '12V 3456' }],
  generate: (rng) => ({ serial: `${pickDigits(rng, 2)}V ${pickDigits(rng, 4)}` }),
  validate: ({ serial = '' }) => (/^\d\dV \d{4}$/.test(serial) ? null : 'Expected 99V 9999'),
  design: { text: '#0b7a2a', border: '#0b7a2a', seals: 'cz' } satisfies EuDesign,
};

export const czechRepublic: Region = {
  id: 'eu-cz',
  name: 'Czech Republic',
  code: 'CZ',
  group: 'Europe',
  flag: '🇨🇿',
  template: 'eu',
  design: { bandCode: 'CZ' } satisfies EuDesign,
  families: [
    { id: 'car', label: 'Cars, trucks & trailers' },
    { id: 'motorcycle', label: 'Motorcycles' },
    { id: 'moped', label: 'Mopeds' },
  ],
  notes: 'Validation checks the documented shape, not whether a series has been reached; random plates only use third-position letters in regions documented as having switched. Not modelled: tractor (yellow), export (red validity field), trial and sport plates, and regular moped serials.',
  formats: [
    carFormat('standard', 'Standard', 'standard', 'Type 101 (520 × 110 mm): two sticker fields between the groups; since 2015 only the upper one carries the inspection sticker.'),
    carFormat('two-row', 'Two-row 340 × 200', 'truck', `Types 103/104 — trucks, buses and trailers. ${TWO_ROW_NOTE}`),
    carFormat('two-row-280', 'Two-row 280 × 200', 'van', `Types 105/106 — cars with a square rear recess. ${TWO_ROW_NOTE}`),
    carFormat('two-row-320', 'Two-row 320 × 160', 'square', `Types 115/116 — cars with US/JDM-size recesses. ${TWO_ROW_NOTE}`),
    electric,
    historic,
    vanityFormat('personalised', 'Personalised (na přání)', 'car', 8, 3, 'choice', 'Since 2017: exactly eight characters, at least one digit; G, O, Q, W and CH are barred, as are offensive words and authority names. Printed 3 + 5 around the sticker fields.'),
    motorcycle,
    vanityFormat('personalised-motorcycle', 'Personalised motorcycle', 'motorcycle', 7, 2, 'moto', 'Type 718: seven characters, set 2 over 5; same character rules as cars.'),
    vanityFormat('personalised-moped', 'Personalised moped (80 × 110)', 'moped', 5, 2, 'moped', 'Type 719 (moped with pedals): five characters, 2 over 3, no EU band (§ 29(9) of the decree).'),
  ],
};
