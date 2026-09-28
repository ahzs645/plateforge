/**
 * US state serial generators, ported from patrik-csak/license-plate-serial-generator
 * (issuing ranges as of late 2019). Each function takes an Rng so results are seedable.
 *
 * `numeric(rng, upper)` / `numeric(rng, lower, upper)` = zero-padded random number (inclusive).
 * `randomBb26(rng, upper)` / `randomBb26(rng, lower, upper)` = letters in [lower, upper).
 */
import { randomBb26, range as bb26Range } from '../../core/bb26';
import { numeric, type Rng } from '../../core/random';

const DOT = '·';
const rangeInt = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export type SerialFn = (rng: Rng) => string;

export const alabama: SerialFn = (rng) => {
  const county = numeric(rng, 1, 67);
  return county + randomBb26(rng, 'AA', 'ZZ') + numeric(rng, county.length === 2 ? 9999 : 999);
};

export const alaska: SerialFn = (rng) => {
  const letters = rng.pick(['FUZ', ...bb26Range('GAA', 'HAA'), ...bb26Range('KAA', 'KDZ')]);
  return `${letters} ${numeric(rng, 100, 999)}`;
};

export const arizona: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'AAA', 'CNY');
  return letters + numeric(rng, 1, letters === 'CNX' ? 1511 : 9999);
};

export const arkansas: SerialFn = (rng) => `${numeric(rng, 1, 999)} ${randomBb26(rng, 'KPG', 'YGA')}`;

export const california: SerialFn = (rng) => {
  let serial = numeric(rng, 6, 8);
  serial += randomBb26(rng, serial === '6' ? 'TPW' : 'AAA', serial === '8' ? 'KPQ' : 'AAAA');
  return serial + numeric(rng, 999);
};

export const colorado: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'AEWT', 'BFMZ');
  const numbers = numeric(rng, 1, letters === 'BFMY' ? 21 : 99);
  return `${letters.slice(0, 3)}-${letters[3]}${numbers}`;
};

export const connecticut: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'AA', 'AW');
  return letters + DOT + numeric(rng, 1, letters === 'AV' ? 42 : 99999, 5);
};

export const delaware: SerialFn = (rng) => `${rng.int(4, 999999)}`;

export const florida: SerialFn = (rng) => {
  const digits = numeric(rng, 890);
  const right = digits[2] + randomBb26(rng, 'AA', digits === '890' ? 'FY' : 'AAA');
  return `Z${digits.slice(0, 2)} ${right}`;
};

export const georgia: SerialFn = (rng) => randomBb26(rng, 'PFA', 'PMA') + numeric(rng, 9999);

export const hawaii: SerialFn = (rng) =>
  rng.pick<SerialFn>([
    (r) => `${r.pick(['H', 'Z'])}${randomBb26(r, 'AA', 'AAA')} ${numeric(r, 999)}`,
    (r) => {
      const county = r.pick(['E', 'F', 'G', 'J', 'N', 'P', 'R', 'S', 'T']);
      const letters = r.pick(
        bb26Range('AA', county === 'T' ? 'TU' : 'AAA').filter((l) => !/[HKLM]/.test(l)),
      );
      return `${county}${letters} ${numeric(r, 999)}`;
    },
    (r) => `K${randomBb26(r, 'AA', 'AAA')} ${numeric(r, 999)}`,
    (r) => `${r.pick(['M', 'L'])}${randomBb26(r, 'AA', 'AAA')} ${numeric(r, 999)}`,
  ])(rng);

const IDAHO_COUNTIES: Array<[string, number]> = [
  ['A', 2], ['B', 10], ['C', 7], ['E', 1], ['F', 2], ['G', 2], ['I', 1], ['J', 2], ['K', 1],
  ['L', 4], ['M', 2], ['N', 1], ['O', 2], ['P', 2], ['S', 1], ['T', 2], ['V', 1], ['W', 1],
];
const IDAHO_CODES = IDAHO_COUNTIES.flatMap(([letter, count]) =>
  Array.from({ length: count }, (_, i) => (count > 1 ? `${i + 1}` : '') + letter),
);

export const idaho: SerialFn = (rng) => {
  const code = rng.pick(IDAHO_CODES);
  let right = '';
  if (code.length === 1) {
    right = numeric(rng, 999999);
  } else if (code.length === 2) {
    const len = rng.pick([3, 4, 5]);
    if (len === 3) {
      const letters = randomBb26(rng, 'ZZ');
      const numbers = numeric(rng, 999);
      right = letters.length === 1 ? numeric(rng, 9) + letters + numbers : rng.shuffle([letters, numbers]).join('');
    } else if (len === 4) {
      right = rng.shuffle([randomBb26(rng, 'Z'), numeric(rng, 9999)]).join('');
    } else {
      right = numeric(rng, 99999);
    }
  } else {
    right = rng.chance(0.5) ? randomBb26(rng, 'Z') + numeric(rng, 999) : numeric(rng, 9999);
  }
  return `${code} ${right}`;
};

export const illinois: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'AQ', 'BP');
  return `${letters} ${numeric(rng, letters === 'AQ' ? 11001 : 0, letters === 'BP' ? 20703 : 99999)}`;
};

export const indiana: SerialFn = (rng) => numeric(rng, 999) + randomBb26(rng, 'ZZZ');

export const iowa: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'GXV', 'IBC');
  return `${letters} ${numeric(rng, 0, letters === 'HAH' ? 57 : 999, 3)}`;
};

export const kansas: SerialFn = (rng) => {
  const numbers = numeric(rng, 302);
  const letters = rng.pick(
    bb26Range(numbers === '000' ? 'LJX' : 'AAA', numbers === '302' ? 'PLA' : 'AAAA').filter(
      (l) => !/[IOQ]/.test(l),
    ),
  );
  return `${numbers} ${letters}`;
};

export const kentucky: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'JCB', 'ZJL');
  return `${numeric(rng, letters === 'JCB' ? 901 : 0, letters === 'ZJK' ? 253 : 999)} ${letters}`;
};

export const louisiana: SerialFn = (rng) => {
  const numbers = numeric(rng, 999);
  return `${numbers} ${randomBb26(rng, 'AAA', numbers === '999' ? 'DEV' : 'ZZZ')}`;
};

export const maine: SerialFn = (rng) => {
  const digits = rng.int(5252);
  const letters = rng.pick(
    bb26Range(digits === 1 ? 'GA' : 'AA', digits === 5252 ? 'XL' : 'AAA').filter((l) => !l.includes('O')),
  );
  return `${digits} ${letters}`;
};

export const maryland: SerialFn = (rng) => {
  const digit = rng.pick([8, 9]);
  const letters = randomBb26(rng, digit === 8 ? 'CN' : 'AA', digit === 9 ? 'DW' : 'ZZ');
  return `${digit}${letters}${numeric(rng, 0, `${digit}${letters}` === '9DW' ? 2552 : 9999, 4)}`;
};

const MA_LETTERS = bb26Range('AAA', 'AAAA').filter((l) => !/[IOQU]/.test(l));
export const massachusetts: SerialFn = (rng) => {
  const letters = rng.pick(MA_LETTERS);
  return `1${letters} ${numeric(rng, letters === 'AAA' ? 10 : 0, 99)}`;
};

export const michigan: SerialFn = (rng) => `${randomBb26(rng, 'DAA', 'ECR')} ${numeric(rng, 9999)}`;

export const minnesota: SerialFn = (rng) => `${randomBb26(rng, 'AAA', 'DBY')}-${numeric(rng, 1, 999)}`;

const MS_CODES = [
  'AD', 'AE', 'AL', 'AC', 'AM', 'AT', 'AA', 'BE', 'BR', 'BV', 'BL', 'CA', 'CN', 'CR', 'CH', 'CT', 'CB',
  'CK', 'CL', 'CY', 'CM', 'CP', 'CQ', 'CV', 'CW', ...bb26Range('DA', 'EA'), ...bb26Range('FR', 'FV'),
  'FN', 'GE', 'GF', 'GN', 'GA', ...bb26Range('KA', 'KE'), ...bb26Range('HA', 'HL'), ...bb26Range('HN', 'IA'),
  'HL', 'HM', 'IS', 'IT', 'IW', ...bb26Range('JG', 'JN'), 'JA', 'JB', 'JF', 'JD', 'JN', 'JP', 'JQ', 'JR',
  'KM', ...bb26Range('LX', 'MA'), ...bb26Range('LL', 'LO'), ...bb26Range('LA', 'LE'), 'LW', 'LJ', 'LK',
  ...bb26Range('LE', 'LI'), 'LR', 'LS', 'LI', 'LP', 'LQ', ...bb26Range('LT', 'LW'), ...bb26Range('MA', 'MG'),
  'MN', 'MP', ...bb26Range('MQ', 'MT'), ...bb26Range('MJ', 'MM'), 'MT', 'NE', 'NF', 'NV', 'NW', 'NX', 'KT',
  'KU', 'PA', 'PB', 'PC', ...bb26Range('PR', 'PV'), 'PE', ...bb26Range('PK', 'PN'), 'PN', 'PP', 'PQ', 'PW',
  'PX', ...bb26Range('RA', 'SA'), 'SC', 'SD', 'SH', 'SP', 'SR', 'SM', 'SN', 'ST', 'SU', 'SF', 'SG', 'TL',
  'TA', 'TB', 'TP', 'TQ', 'TS', 'TT', 'TN', 'UN', 'UP', 'WL', 'WM', ...bb26Range('WA', 'WE'),
  ...bb26Range('WS', 'WX'), 'WY', 'WZ', 'WE', 'WK', 'WN', 'WP', 'YL', 'YZ', 'YA',
];
export const mississippi: SerialFn = (rng) =>
  `${rng.pick(MS_CODES)}${randomBb26(rng, 'Z')} ${numeric(rng, 9999)}`;

const MO_MONTHS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
export const missouri: SerialFn = (rng) => {
  const left = rng.pick(MO_MONTHS) + randomBb26(rng, 'Z') + numeric(rng, 9);
  const right = randomBb26(rng, 'Z') + numeric(rng, 9) + randomBb26(rng, 'Z');
  return `${left} ${right}`;
};

export const montana: SerialFn = (rng) => {
  const county = `${rng.int(1, 56)}`;
  return `${county}-${numeric(rng, county.length === 1 ? 99999 : 9999)}${randomBb26(rng, 'Z')}`;
};

export const nebraska: SerialFn = (rng) => {
  const county = rng.int(1, 93);
  if ([1, 2, 59].includes(county)) return `${randomBb26(rng, 'UMA', 'WDH')} ${numeric(rng, 999)}`;
  const letters = `${county}-${randomBb26(rng, 'ZZ')}`;
  return letters + numeric(rng, 10 ** (7 - letters.length) - 1);
};

export const nevada: SerialFn = (rng) => {
  const left = numeric(rng, 1, 191);
  const letter = randomBb26(rng, left === '191' ? 'T' : 'Z');
  return left + DOT + letter + numeric(rng, left === '191' && letter === 'T' ? 71 : 99);
};

export const newHampshire: SerialFn = (rng) => {
  const n = numeric(rng, 1000000, 4585718);
  return `${n.slice(0, 3)} ${n.slice(3)}`;
};

const NJ_PREFIX = bb26Range('V').filter((s) => !/[IOQ]/.test(s));
const NJ_SUFFIX = bb26Range('AAA', 'AAAA').filter((s) => !/[IOQ]/.test(s));
export const newJersey: SerialFn = (rng) => {
  let left = rng.pick(NJ_PREFIX);
  left += numeric(rng, left === 'A' ? 10 : 0, left === 'U' ? 50 : 99);
  const pool =
    left === 'A10' ? NJ_SUFFIX.slice(NJ_SUFFIX.indexOf('EFF')) :
    left === 'U50' ? NJ_SUFFIX.slice(0, NJ_SUFFIX.indexOf('PMD')) : NJ_SUFFIX;
  return `${left}-${rng.pick(pool)}`;
};

export const newMexico: SerialFn = (rng) => {
  const digits = numeric(rng, 1, 999);
  return `${digits}-${randomBb26(rng, digits === '001' ? 'MAA' : 'AAA', digits === '999' ? 'WJT' : 'ZZZ')}`;
};

export const newYork: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'FAA', 'JCT');
  return `${letters}-${numeric(rng, letters === 'FAA' ? 1000 : 0, 9999)}`;
};

export const northCarolina: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'PAA', 'PLA');
  return `${letters}-${numeric(rng, letters === 'PAA' ? 1001 : 0, 9999)}`;
};

export const northDakota: SerialFn = (rng) => {
  const digits = numeric(rng, 825);
  return `${digits} ${randomBb26(rng, digits === '000' ? 'BTR' : 'AAA', digits === '825' ? 'CNL' : 'ZZZ')}`;
};

export const ohio: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'FWA', 'HME');
  return `${letters} ${numeric(rng, letters === 'FWA' ? 1000 : 0, 9999)}`;
};

export const oklahoma: SerialFn = (rng) => `${randomBb26(rng, 'AAA', 'JRL')}-${numeric(rng, 1, 999)}`;

export const oregon: SerialFn = (rng) => `${numeric(rng, 1, 999)} ${randomBb26(rng, 'BAA', 'KUH')}`;

export const pennsylvania: SerialFn = (rng) => `${randomBb26(rng, 'KLF', 'KTL')}-${numeric(rng, 9999)}`;

export const rhodeIsland: SerialFn = (rng) =>
  rng.chance(0.5) ? `${randomBb26(rng, 'AA', 'ZZ')}-${rng.int(10, 999)}` : numeric(rng, 99999);

export const southCarolina: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'LZD', 'PVY');
  return `${letters} ${numeric(rng, letters === 'LZD' ? 101 : 0, 999)}`;
};

export const southDakota: SerialFn = (rng) => {
  let left = `${rng.pick([...rangeInt(1, 66), 67])}` + randomBb26(rng, 'Z');
  if (left.length === 2) left += rng.int(9);
  return `${left} ${numeric(rng, 999)}`;
};

export const tennessee: SerialFn = (rng) => `${randomBb26(rng, 'BBB', 'BTG')}-${numeric(rng, 1, 999)}`;

export const texas: SerialFn = (rng) => `${randomBb26(rng, 'BBB', 'KZR')}-${numeric(rng, 1, 9999)}`;

export const utah: SerialFn = (rng) =>
  rng.pick<SerialFn>([
    // Delicate Arch
    (r) => {
      const letter = randomBb26(r, 'V', 'Z');
      const digits = numeric(r, letter === 'V' ? 215 : 1, 999, 3);
      const letters = randomBb26(r, letter + digits === 'V215' ? 'RK' : 'AA', 'AAA');
      return `${letter}${digits.slice(0, 2)} ${digits.slice(2)}${letters}`;
    },
    // In God We Trust
    (r) => {
      let s = numeric(r, 5);
      s += randomBb26(r, s === '5' ? 'E' : 'Z');
      s += numeric(r, 9);
      return s + randomBb26(r, 'AA', 'AAA');
    },
    // Ski Utah
    (r) => {
      const n = numeric(r, 1, 999);
      return `${randomBb26(r, 'F')}${n.slice(0, 2)} ${n.slice(2)}${randomBb26(r, 'AA', 'KB')}`;
    },
  ])(rng);

export const vermont: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'AAB', 'HNQ');
  return `${letters} ${numeric(rng, letters === 'HNP' ? 100 : 0, 999)}`;
};

export const virginia: SerialFn = (rng) => {
  const vRange = rng.chance(0.5);
  const letters = vRange ? randomBb26(rng, 'VAA', 'VZZ') : randomBb26(rng, 'UPA', 'UZZ');
  return `${letters}-${numeric(rng, vRange && letters === 'VAA' ? 1000 : 0, 9999, 4)}`;
};

export const washington: SerialFn = (rng) => randomBb26(rng, 'AAA', 'BKU') + numeric(rng, 9999);

export const washingtonDc: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'FN', 'GB');
  return `${letters}-${numeric(rng, letters === 'FN' ? 4000 : 0, letters === 'GB' ? 4718 : 9999, 4)}`;
};

const WV_MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'O', 'N', 'D'];
export const westVirginia: SerialFn = (rng) => {
  let s = rng.pick(WV_MONTHS) + (rng.chance(0.5) ? `${rng.int(9)}` : '');
  s += randomBb26(rng, s.length === 2 ? 'Z' : 'ZZ');
  return `${s} ${numeric(rng, s.length === 3 ? 999 : 9999)}`;
};

export const wisconsin: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'AAA', 'AFR');
  return `${letters}-${numeric(rng, letters === 'AAA' ? 1001 : 0, letters === 'AFR' ? 2743 : 9999)}`;
};

export const wyoming: SerialFn = (rng) =>
  `${rng.pick([...rangeInt(1, 23), 99])}-${numeric(rng, 99999)}`;

// ── Variant and territory series (ranges from the Wikipedia plate tables, as of 2026) ──

const noIOQ = (s: string) => !/[IOQ]/.test(s);
const letter = (rng: Rng) => randomBb26(rng, 'A', 'AA');

/** Puerto Rico 2023 base: `ABC 123`, KBV 001 → KYN 025 (Sept 2026). */
export const puertoRico: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'KBV', 'KYO');
  return `${letters} ${numeric(rng, 1, letters === 'KYN' ? 25 : 999, 3)}`;
};

/** California 1956 black-on-yellow and 1963 gold-on-black bases: `ABC 123`. */
export const californiaAbc123: SerialFn = (rng) => `${randomBb26(rng, 'AAA', 'AAAA')} ${numeric(rng, 999)}`;
/** California 1969/70 gold-on-blue base: `123 ABC`. */
export const california123Abc: SerialFn = (rng) => `${numeric(rng, 999)} ${randomBb26(rng, 'AAA', 'AAAA')}`;
/** California Legacy (2015–): `A123B4`, B001A0 → L783N1. */
export const californiaLegacy: SerialFn = (rng) => {
  const first = randomBb26(rng, 'B', 'M');
  return first + numeric(rng, 1, first === 'L' ? 783 : 999, 3) + letter(rng) + rng.int(9);
};
/** California 2026 order: `123ABC1`, 000AAA1 → ~801BEZ1. */
export const california2026: SerialFn = (rng) => `${numeric(rng, 999)}${randomBb26(rng, 'AAA', 'BFA')}1`;

/** Arizona alternative fuel: `AF·1234`, then `AF·123A`, `AF·12A3`, `AF12A3`, `AF·1A23`, `1A23AF`. */
export const arizonaAltFuel: SerialFn = (rng) =>
  rng.pick<SerialFn>([
    (r) => `AF${DOT}${numeric(r, 9999)}`,
    (r) => `AF${DOT}${numeric(r, 999)}${letter(r)}`,
    (r) => `AF${DOT}${numeric(r, 99)}${letter(r)}${r.int(9)}`,
    (r) => `AF${numeric(r, 99)}${letter(r)}${r.int(9)}`,
    (r) => `AF${DOT}${r.int(9)}${letter(r)}${numeric(r, 99)}`,
    (r) => `${r.int(9)}${letter(r)}${numeric(r, 99)}AF`,
  ])(rng);

/** Illinois electric vehicle (2020–): `12345 EL`, later `A1234 EL` (A1001 → D1748). */
export const illinoisEv: SerialFn = (rng) => {
  if (rng.chance(0.5)) return `${rng.int(1, 99999)} EL`;
  const first = randomBb26(rng, 'A', 'E');
  return `${first}${numeric(rng, first === 'A' ? 1001 : 0, first === 'D' ? 1748 : 9999, 4)} EL`;
};

const NY_2001 = bb26Range('ACA', 'EYI').filter(noIOQ);
/** New York 2001–2010 Empire State: ACA-1000 → EYH-2999, no I/O/Q. */
export const newYork2001: SerialFn = (rng) => {
  const letters = rng.pick(NY_2001);
  return `${letters}-${numeric(rng, letters === 'ACA' ? 1000 : 0, letters === 'EYH' ? 2999 : 9999, 4)}`;
};
const NY_2020 = bb26Range('KDA', 'MHU').filter(noIOQ);
/** New York 2020 Excelsior: reissued from KDA (KAA–KCH recalled), through MHT (July 2026). */
export const newYork2020: SerialFn = (rng) => {
  const letters = rng.pick(NY_2020);
  return `${letters}-${numeric(rng, letters === 'KDA' ? 1000 : 0, letters === 'MHT' ? 1800 : 9999, 4)}`;
};

const PA_2004 = bb26Range('GBA', 'KLF').filter((s) => !/[AE]/.test(s[1]));
/** Pennsylvania 2004 visitPA.com: GBA-0000 → KLE-9999, second letter never A or E. */
export const pennsylvania2004: SerialFn = (rng) => `${rng.pick(PA_2004)}-${numeric(rng, 9999)}`;
/** Pennsylvania 2025 Liberty Bell: `ABC1234`, MYR0200 → NJS3686 (Sept 2026). */
export const pennsylvania2025: SerialFn = (rng) => {
  const letters = randomBb26(rng, 'MYR', 'NJT');
  return letters + numeric(rng, letters === 'MYR' ? 200 : 0, letters === 'NJS' ? 3686 : 9999, 4);
};
