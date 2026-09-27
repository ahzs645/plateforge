import type { Rng } from '../../core/random';
import type { FieldOption, Parts, PlateFormat, Region } from '../../core/types';
import type { JpDesign } from '../../templates/jp';

const OFFICES: Array<[string, string]> = [
  ['札幌', 'Sapporo'], ['函館', 'Hakodate'], ['旭川', 'Asahikawa'], ['青森', 'Aomori'], ['仙台', 'Sendai'],
  ['宮城', 'Miyagi'], ['秋田', 'Akita'], ['山形', 'Yamagata'], ['福島', 'Fukushima'], ['水戸', 'Mito'],
  ['土浦', 'Tsuchiura'], ['つくば', 'Tsukuba'], ['宇都宮', 'Utsunomiya'], ['群馬', 'Gunma'], ['大宮', 'Omiya'],
  ['川越', 'Kawagoe'], ['所沢', 'Tokorozawa'], ['千葉', 'Chiba'], ['習志野', 'Narashino'], ['成田', 'Narita'],
  ['品川', 'Shinagawa'], ['練馬', 'Nerima'], ['足立', 'Adachi'], ['八王子', 'Hachioji'], ['多摩', 'Tama'],
  ['世田谷', 'Setagaya'], ['横浜', 'Yokohama'], ['川崎', 'Kawasaki'], ['湘南', 'Shonan'], ['相模', 'Sagami'],
  ['新潟', 'Niigata'], ['長野', 'Nagano'], ['静岡', 'Shizuoka'], ['浜松', 'Hamamatsu'], ['富士山', 'Fujisan'],
  ['名古屋', 'Nagoya'], ['豊橋', 'Toyohashi'], ['岐阜', 'Gifu'], ['京都', 'Kyoto'], ['大阪', 'Osaka'],
  ['なにわ', 'Naniwa'], ['和泉', 'Izumi'], ['神戸', 'Kobe'], ['姫路', 'Himeji'], ['奈良', 'Nara'],
  ['岡山', 'Okayama'], ['広島', 'Hiroshima'], ['福山', 'Fukuyama'], ['山口', 'Yamaguchi'], ['香川', 'Kagawa'],
  ['愛媛', 'Ehime'], ['高知', 'Kochi'], ['徳島', 'Tokushima'], ['福岡', 'Fukuoka'], ['北九州', 'Kitakyushu'],
  ['長崎', 'Nagasaki'], ['熊本', 'Kumamoto'], ['大分', 'Oita'], ['宮崎', 'Miyazaki'], ['鹿児島', 'Kagoshima'],
  ['沖縄', 'Okinawa'],
];
const OFFICE_OPTIONS: FieldOption[] = OFFICES.map(([value, name]) => ({ value, label: `${value} ${name}` }));

// Hiragana series (from japanLicensePlate_Generator); お, し, へ, ん are never used.
const KANA_PRIVATE = 'さすせそたちつてとなにぬねのはひふほまみむめもやゆよらりるろ';
const KANA_COMMERCIAL = 'あいうえかきくけこを';
const KANA_RENTAL = 'われ';
/** Letters allowed in the classification number since 2017. */
const CLASS_LETTERS = 'ACFHKLMPRXY';

/**
 * Serial number layout: 4 digits read "12-34"; shorter numbers are padded with
 * "・" and the hyphen only appears when the left pair holds a digit ("・1-23", "・・12").
 */
export function displayNumber(number: string): string {
  const padded = number.padStart(4, '・');
  const hasLeft = /\d/.test(padded.slice(0, 2));
  return `${padded.slice(0, 2)}${hasLeft ? '-' : ' '}${padded.slice(2)}`;
}

function classNumber(rng: Rng, first: string): string {
  const tail = () => (rng.chance(0.12) ? rng.pick(CLASS_LETTERS) : rng.pick('0123456789'));
  return first + tail() + tail();
}

function jpFormat(spec: {
  id: string;
  label: string;
  description: string;
  kana: string;
  classFirst: string;
  design: Partial<JpDesign>;
}): PlateFormat {
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    pattern: `Office  ${spec.classFirst}##  ${spec.kana[0]}  ##-##`,
    design: spec.design,
    fields: [
      { key: 'office', label: 'Office', options: OFFICE_OPTIONS },
      { key: 'classNo', label: 'Class no.', maxLength: 3 },
      { key: 'kana', label: 'Hiragana', options: [...spec.kana].map((k) => ({ value: k, label: k })) },
      { key: 'number', label: 'Number', maxLength: 4 },
    ],
    generate: (rng) => ({
      office: rng.pick(OFFICES)[0],
      classNo: classNumber(rng, rng.pick(spec.classFirst)),
      kana: rng.pick(spec.kana),
      number: `${rng.int(1, rng.chance(0.85) ? 9999 : 999)}`,
    }),
    validate: ({ classNo = '', number = '' }: Parts) =>
      !/^[1-9][0-9ACFHKLMPRXY]{0,2}$/.test(classNo)
        ? 'Class number is 1–3 characters and starts with 1–9'
        : !/^[1-9]\d{0,3}$/.test(number)
          ? 'Number must be 1–9999'
          : null,
    text: (p) => `${p.office} ${p.classNo} ${p.kana} ${displayNumber(p.number ?? '')}`,
  };
}

export const japan: Region = {
  id: 'jp',
  name: 'Japan',
  code: 'JP',
  group: 'Asia',
  flag: '🇯🇵',
  template: 'jp',
  design: {},
  notes: 'Colour depends on engine size and use; hiragana series identifies private, commercial and rental vehicles.',
  formats: [
    jpFormat({ id: 'private', label: 'Private (white)', kana: KANA_PRIVATE, classFirst: '335', description: 'Private passenger cars — green characters on white.', design: { bg: '#fbfbf5', text: '#0e5a2c' } }),
    jpFormat({ id: 'commercial', label: 'Commercial (green)', kana: KANA_COMMERCIAL, classFirst: '1458', description: 'Taxis, buses and trucks — white on green.', design: { bg: '#0e5a2c', text: '#f7f7f2' } }),
    jpFormat({ id: 'kei', label: 'Kei car (yellow)', kana: KANA_PRIVATE, classFirst: '58', description: 'Kei cars (≤660cc) — black on yellow.', design: { bg: '#f6d31a', text: '#161616' } }),
    jpFormat({ id: 'kei-commercial', label: 'Kei commercial (black)', kana: KANA_COMMERCIAL, classFirst: '48', description: 'Commercial kei vehicles — yellow on black.', design: { bg: '#161616', text: '#f6d31a' } }),
    jpFormat({ id: 'rental', label: 'Rental (わ/れ)', kana: KANA_RENTAL, classFirst: '35', description: 'Rental cars use わ or れ.', design: { bg: '#fbfbf5', text: '#0e5a2c' } }),
  ],
};
