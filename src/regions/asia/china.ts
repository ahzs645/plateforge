import type { Rng } from '../../core/random';
import type { FieldDef, FieldOption, Parts, PlateFormat, PlateStatus, Region } from '../../core/types';
import type { CnDesign } from '../../templates/cn';

const PROVINCES: Array<[string, string]> = [
  ['京', 'Beijing'], ['津', 'Tianjin'], ['沪', 'Shanghai'], ['渝', 'Chongqing'], ['冀', 'Hebei'], ['豫', 'Henan'],
  ['云', 'Yunnan'], ['辽', 'Liaoning'], ['黑', 'Heilongjiang'], ['湘', 'Hunan'], ['皖', 'Anhui'], ['鲁', 'Shandong'],
  ['新', 'Xinjiang'], ['苏', 'Jiangsu'], ['浙', 'Zhejiang'], ['赣', 'Jiangxi'], ['鄂', 'Hubei'], ['桂', 'Guangxi'],
  ['甘', 'Gansu'], ['晋', 'Shanxi'], ['蒙', 'Inner Mongolia'], ['陕', 'Shaanxi'], ['吉', 'Jilin'], ['闽', 'Fujian'],
  ['贵', 'Guizhou'], ['粤', 'Guangdong'], ['青', 'Qinghai'], ['藏', 'Tibet'], ['川', 'Sichuan'], ['宁', 'Ningxia'],
  ['琼', 'Hainan'],
];
const PROVINCE_OPTIONS: FieldOption[] = PROVINCES.map(([value, name]) => ({ value, label: `${value} ${name}` }));

/** Letters used on Chinese plates: I and O are skipped to avoid confusion with 1 and 0. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '0123456789';
const ALNUM = DIGITS + LETTERS;
/** NEV energy letters (GA 36-2018 tables 5–6): D A B C E battery electric, F G H J K other. D and F are issued first. */
const NEV_LETTERS = 'DDDFFFABCEGHJK';

const GA36 = { title: 'GA 36-2018 Motor vehicle license plates of the PRC (standard text, via Wikimedia Commons)', url: 'https://commons.wikimedia.org/wiki/File:GA_36-2018.pdf' };
const DIPLOMATIC_2017 = { title: 'The Paper (2017): embassy plates move 使 behind the number, in white', url: 'https://www.thepaper.cn/newsDetail_forward_1618277' };

/**
 * Four- or five-character serial with at most two letters. GA 36-2018 table 4 lists every one- and
 * two-letter position combination (letters only in positions 1–4 for four-character serials).
 */
export function serialN(rng: Rng, n: number): string {
  const letterSlots = new Set(rng.shuffle([...Array(n).keys()]).slice(0, rng.pick([0, 0, 1, 1, 2])));
  return Array.from({ length: n }, (_, i) => rng.pick(letterSlots.has(i) ? LETTERS : DIGITS)).join('');
}
const upToTwoLetters = (n: number, suffix = '') =>
  new RegExp(`^(?=(?:[^A-Z]*[A-Z]){0,2}[^A-Z]*$)[0-9A-HJ-NP-Z]{${n}}${suffix}$`);
const digits = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick(DIGITS)).join('');

const provinceField: FieldDef = { key: 'province', label: 'Province', options: PROVINCE_OPTIONS };
const cityField: FieldDef = { key: 'city', label: 'Authority', maxLength: 1, placeholder: 'A' };
const serialField = (maxLength: number): FieldDef => ({ key: 'serial', label: 'Serial', maxLength });
const orgField: FieldDef = { key: 'org', label: 'Mission code', maxLength: 3, placeholder: '224' };

const standardText = (p: Parts) => `${p.province}${p.city}·${p.serial}`;

function cnFormat(spec: {
  id: string;
  label: string;
  description?: string;
  pattern: string;
  serial: (rng: Rng) => string;
  shape: RegExp;
  design: Partial<CnDesign>;
  province?: string;
  city?: string;
  status?: PlateStatus;
  text?: (p: Parts) => string;
  references?: PlateFormat['references'];
}): PlateFormat {
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    pattern: spec.pattern,
    design: spec.design,
    status: spec.status,
    references: spec.references ?? [GA36],
    fields: [provinceField, cityField, serialField([...spec.pattern].length)],
    generate: (rng) => ({
      province: spec.province ?? rng.pick(PROVINCES)[0],
      city: spec.city ?? rng.pick(LETTERS),
      serial: spec.serial(rng),
    }),
    validate: ({ province = '', city = '', serial = '' }: Parts) =>
      spec.province && province !== spec.province
        ? `Province must be ${spec.province}`
        : spec.city && city !== spec.city
          ? `Authority code must be ${spec.city}`
          : !/^[A-Z]$/.test(city)
            ? 'Authority code is one letter'
            : spec.shape.test(serial)
              ? null
              : `Serial should look like ${spec.pattern}`,
    text: spec.text ?? standardText,
  };
}

const twoRowText = (p: Parts) => `${p.province}·${p.city} ${p.serial}`;
const policeText = (p: Parts) => `${p.province}·${p.city}${p.serial}`;

export const china: Region = {
  id: 'cn',
  name: 'China (mainland)',
  code: 'CN',
  group: 'Asia',
  country: 'China',
  flag: '🇨🇳',
  template: 'cn',
  design: { variant: 'blue' },
  notes:
    'Styles, box geometry and serial rules follow GA 36-2018 (figs 1–8, tables 1 and 3–6). Letters I and O are never issued. ' +
    'Military and armed-police plates follow separate PLA / PAP standards and are not modelled.',
  formats: [
    cnFormat({
      id: 'blue', label: 'Small vehicle (blue)', pattern: '*****', design: { variant: 'blue' },
      description: 'Private cars. Five characters, at most two letters.',
      serial: (rng) => serialN(rng, 5), shape: upToTwoLetters(5),
    }),
    cnFormat({
      id: 'nev-small', label: 'New energy — small', pattern: 'D*9999', design: { variant: 'nev' },
      description:
        'Six-character serial on a white-to-green gradient. First letter D, A, B, C or E = battery electric; F, G, H, J or K = other new energy. ' +
        'The second character may be a letter. The printed emblem is our own simplified drawing.',
      serial: (rng) => rng.pick(NEV_LETTERS) + rng.pick(ALNUM) + digits(rng, 4), shape: /^[A-HJK][0-9A-HJ-NP-Z]\d{4}$/,
    }),
    cnFormat({
      id: 'nev-large', label: 'New energy — large', pattern: '99999D', design: { variant: 'nevLarge' },
      description: 'Buses and trucks: yellow province section, green serial section. Energy letter goes last. The rear plate is identical but its bolt slots are 240 mm apart.',
      serial: (rng) => digits(rng, 5) + rng.pick(NEV_LETTERS), shape: /^\d{5}[A-HJK]$/,
    }),
    cnFormat({
      id: 'yellow', label: 'Large vehicle (yellow)', pattern: '*****', design: { variant: 'yellow' },
      description: 'Front plate of buses and trucks. The rear plate is the two-row 440×220 layout.',
      serial: (rng) => serialN(rng, 5), shape: upToTwoLetters(5),
    }),
    cnFormat({
      id: 'yellow-rear', label: 'Large vehicle rear (yellow, two rows)', pattern: '*****', design: { variant: 'yellow', rows: 2 },
      description: '440×220 mm rear plate: province and authority above, five-character serial below.',
      serial: (rng) => serialN(rng, 5), shape: upToTwoLetters(5), text: twoRowText,
    }),
    cnFormat({
      id: 'trailer', label: 'Trailer (挂)', pattern: '****挂', design: { variant: 'yellow', rows: 2 },
      description: 'Single 440×220 mm plate. 挂 is black like the rest of the serial.',
      serial: (rng) => serialN(rng, 4) + '挂', shape: upToTwoLetters(4, '挂'), text: twoRowText,
    }),
    cnFormat({
      id: 'coach', label: 'Driving school (学)', pattern: '****学', design: { variant: 'yellow' },
      description: 'GA 36-2018 specifies black lettering throughout, including 学.',
      serial: (rng) => serialN(rng, 4) + '学', shape: upToTwoLetters(4, '学'),
    }),
    cnFormat({
      id: 'hkmo', label: 'Hong Kong / Macau crossing', pattern: '****港', design: { variant: 'black' },
      description: 'Cross-boundary vehicles registered in Guangdong under authority code Z; 港 = Hong Kong, 澳 = Macau.',
      province: '粤', city: 'Z',
      serial: (rng) => serialN(rng, 4) + rng.pick(['港', '澳']), shape: upToTwoLetters(4, '[港澳]'),
    }),
    cnFormat({
      id: 'police', label: 'Police (警)', pattern: '****警', design: { variant: 'white', separatorAfter: 1, red: [-1] },
      description: 'White plate, black text, red 警. The separator follows the province character.',
      serial: (rng) => serialN(rng, 4) + '警', shape: upToTwoLetters(4, '警'), text: policeText,
    }),
    cnFormat({
      id: 'police-rear', label: 'Police (警) — rear', pattern: '****警', design: { variant: 'white', separatorAfter: 1, separator: 'dash', red: [-1] },
      description: 'Rear police plate: as the front, but the separator is a short dash (GA 36-2018 fig. 5).',
      serial: (rng) => serialN(rng, 4) + '警', shape: upToTwoLetters(4, '警'), text: policeText,
    }),
    {
      id: 'embassy', label: 'Embassy (使)', pattern: '999·999使',
      description:
        'Beijing embassies, since 2017: three-digit mission code, three-digit serial and a white 使 at the end. ' +
        'The earlier red 使 prefix plates were withdrawn on 1 May 2017.',
      references: [GA36, DIPLOMATIC_2017],
      design: { variant: 'black', separatorAfter: 3 },
      fields: [orgField, serialField(4)],
      generate: (rng) => ({ org: digits(rng, 3), serial: digits(rng, 3) + '使' }),
      validate: ({ org = '', serial = '' }) =>
        !/^\d{3}$/.test(org) ? 'Mission code is three digits' : /^\d{3}使$/.test(serial) ? null : 'Serial should look like 999使',
      text: (p) => `${p.org}·${p.serial}`,
    },
    {
      id: 'consulate', label: 'Consulate (领)', pattern: '省 999·9*领',
      description:
        'Consulates outside Beijing: province, three-digit mission code, two-character serial (digits, or a digit then a letter) and 领. ' +
        'GA 36-2018 lists these plates as plain white-on-black; older photos show a red 领.',
      references: [GA36],
      design: { variant: 'black', separatorAfter: 4 },
      fields: [provinceField, orgField, serialField(3)],
      generate: (rng) => ({
        province: rng.pick(PROVINCES)[0],
        org: digits(rng, 3),
        serial: rng.pick(DIGITS) + rng.pick(rng.pick([DIGITS, LETTERS])) + '领',
      }),
      validate: ({ org = '', serial = '' }) =>
        !/^\d{3}$/.test(org) ? 'Mission code is three digits' : /^\d[0-9A-HJ-NP-Z]领$/.test(serial) ? null : 'Serial should look like 9*领',
      text: (p) => `${p.province}${p.org}·${p.serial}`,
    },
  ],
};
