import type { Rng } from '../../core/random';
import type { FieldOption, Parts, PlateFormat, Region } from '../../core/types';
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

/** Five-character serial with at most two letters (GA 36-2018). */
function serial5(rng: Rng): string {
  const letterSlots = new Set(rng.shuffle([0, 1, 2, 3, 4]).slice(0, rng.pick([0, 0, 1, 1, 2])));
  return Array.from({ length: 5 }, (_, i) => rng.pick(letterSlots.has(i) ? LETTERS : DIGITS)).join('');
}
const digits = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick(DIGITS)).join('');

const baseFields = (serialLength: number) => [
  { key: 'province', label: 'Province', options: PROVINCE_OPTIONS },
  { key: 'city', label: 'Authority', maxLength: 1, placeholder: 'A' },
  { key: 'serial', label: 'Serial', maxLength: serialLength },
];

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
}): PlateFormat {
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    pattern: spec.pattern,
    design: spec.design,
    fields: baseFields(spec.pattern.length),
    generate: (rng) => ({
      province: spec.province ?? rng.pick(PROVINCES)[0],
      city: spec.city ?? rng.pick(LETTERS),
      serial: spec.serial(rng),
    }),
    validate: ({ city = '', serial = '' }: Parts) =>
      !/^[A-Z]$/.test(city)
        ? 'Authority code is one letter'
        : spec.shape.test(serial)
          ? null
          : `Serial should look like ${spec.pattern}`,
    text: (p) => `${p.province}${p.city}·${p.serial}`,
  };
}

export const china: Region = {
  id: 'cn',
  name: 'China (mainland)',
  code: 'CN',
  group: 'Asia',
  country: 'China',
  flag: '🇨🇳',
  template: 'cn',
  design: { variant: 'blue' },
  notes: 'Styles follow GA 36-2018. Letters I and O are never issued.',
  formats: [
    cnFormat({
      id: 'blue', label: 'Small vehicle (blue)', pattern: '*****', design: { variant: 'blue' },
      description: 'Private cars. Five characters, at most two letters.',
      serial: serial5, shape: /^(?=(?:[^A-Z]*[A-Z]){0,2}[^A-Z]*$)[0-9A-HJ-NP-Z]{5}$/,
    }),
    cnFormat({
      id: 'nev-small', label: 'New energy — small', pattern: 'D*####', design: { variant: 'nev' },
      description: 'Six-character serial. D = battery electric, F = hybrid (A–C, E also issued).',
      serial: (rng) => rng.pick('DABCEF') + rng.pick(ALNUM) + digits(rng, 4), shape: /^[A-F][0-9A-HJ-NP-Z]\d{4}$/,
    }),
    cnFormat({
      id: 'nev-large', label: 'New energy — large', pattern: '#####D', design: { variant: 'nevLarge' },
      description: 'Buses and trucks. Energy letter goes last.',
      serial: (rng) => digits(rng, 5) + rng.pick('DF'), shape: /^\d{5}[DF]$/,
    }),
    cnFormat({
      id: 'yellow', label: 'Large vehicle (yellow)', pattern: '*****', design: { variant: 'yellow' },
      serial: serial5, shape: /^[0-9A-HJ-NP-Z]{5}$/,
    }),
    cnFormat({
      id: 'coach', label: 'Driving school (学)', pattern: '####学', design: { variant: 'yellow', accentLast: true },
      serial: (rng) => digits(rng, 4) + '学', shape: /^[0-9A-HJ-NP-Z]{4}学$/,
    }),
    cnFormat({
      id: 'hkmo', label: 'Hong Kong / Macau crossing', pattern: 'A###港', design: { variant: 'black' },
      province: '粤', city: 'Z',
      serial: (rng) => rng.pick(LETTERS) + digits(rng, 3) + rng.pick(['港', '澳']), shape: /^[0-9A-HJ-NP-Z]{4}[港澳]$/,
    }),
  ],
};
