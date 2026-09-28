import { compilePattern } from '../../core/pattern';
import type { FieldDef, PlateFormat, PlateStatus, Region } from '../../core/types';
import type { KrDesign } from '../../templates/kr';

/** Hangul series syllables. Listed explicitly — a `[가-마]` class would expand to thousands of syllables. */
export const KR_HANGUL = {
  private: '가나다라마거너더러머버서어저고노도로모보소오조구누두루무부수우주',
  commercial: '바사아자',
  delivery: '배',
  rental: '하허호',
} as const;

/** The 17 metropolitan/provincial names printed on commercial plates. */
export const KR_REGIONS: Array<[string, string]> = [
  ['서울', 'Seoul'], ['부산', 'Busan'], ['대구', 'Daegu'], ['인천', 'Incheon'], ['광주', 'Gwangju'], ['대전', 'Daejeon'],
  ['울산', 'Ulsan'], ['세종', 'Sejong'], ['경기', 'Gyeonggi'], ['강원', 'Gangwon'], ['충북', 'Chungbuk'], ['충남', 'Chungnam'],
  ['전북', 'Jeonbuk'], ['전남', 'Jeonnam'], ['경북', 'Gyeongbuk'], ['경남', 'Gyeongnam'], ['제주', 'Jeju'],
];

const REFS = {
  wiki: { title: 'Wikipedia — Vehicle registration plates of South Korea', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_South_Korea' },
  kowiki: { title: '위키백과 — 대한민국의 차량 번호판', url: 'https://ko.wikipedia.org/wiki/%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD%EC%9D%98_%EC%B0%A8%EB%9F%89_%EB%B2%88%ED%98%B8%ED%8C%90' },
  notice: { title: '자동차 등록번호판 등의 기준에 관한 고시 (MOLIT)', url: 'https://www.law.go.kr/%ED%96%89%EC%A0%95%EA%B7%9C%EC%B9%99/%EC%9E%90%EB%8F%99%EC%B0%A8%20%EB%93%B1%EB%A1%9D%EB%B2%88%ED%98%B8%ED%8C%90%20%EB%93%B1%EC%9D%98%20%EA%B8%B0%EC%A4%80%EC%97%90%20%EA%B4%80%ED%95%9C%20%EA%B3%A0%EC%8B%9C/' },
  ev: { title: '찾기쉬운 생활법령 — 전기자동차 등록번호판', url: 'https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1404&ccfNo=2&cciNo=1&cnpClsNo=3' },
} as const;

const NOTE = 'Approximate reconstruction: character boxes follow published plate proportions; hangul uses a system gothic in place of the government plate typeface.';
const REVIEW_YEAR = 2026; // End of researched coverage, not a withdrawal date.

/** Splits `123가 4567` (space optional) into class number, hangul and serial. */
export function splitKrSerial(serial: string): { cls: string; hangul: string; number: string } {
  const m = /^(\d{2,3})(\S)\s?(\d{4})$/.exec(serial.trim());
  return m ? { cls: m[1], hangul: m[2], number: m[3] } : { cls: '', hangul: '', number: serial };
}

function krFormat(spec: {
  id: string;
  label: string;
  description: string;
  family: 'private' | 'commercial';
  hangul: string;
  /** Allowed class-number lengths; the first is generated. */
  digits: readonly (2 | 3)[];
  range: readonly [number, number];
  region?: boolean;
  design: Partial<KrDesign>;
  period?: readonly [number, number];
  era?: string;
  status?: PlateStatus;
  references?: readonly { title: string; url: string }[];
}): PlateFormat {
  const sets = { h: spec.hangul };
  const compiled = spec.digits.flatMap((n) => [`${'9'.repeat(n)}{h} 9999`, `${'9'.repeat(n)}{h}9999`].map((p) => compilePattern(p, { sets })));
  const shape = spec.digits.map((n) => `${'9'.repeat(n)}${spec.hangul[0]} 9999`).join(' | ');
  const regionField: FieldDef = { key: 'region', label: 'Region', options: KR_REGIONS.map(([value, en]) => ({ value, label: `${value} ${en}` })) };
  return {
    id: spec.id,
    label: spec.label,
    description: `${spec.description} ${NOTE}`,
    family: spec.family,
    period: spec.period,
    era: spec.era,
    status: spec.status,
    references: spec.references ?? [REFS.wiki, REFS.kowiki, REFS.notice],
    pattern: spec.region ? `Region + ${shape}` : shape,
    design: spec.design,
    fields: [...(spec.region ? [regionField] : []), { key: 'serial', label: 'Serial', maxLength: 9, uppercase: false, placeholder: shape }],
    generate: (rng) => {
      const n = spec.digits[0];
      const cls = `${rng.int(Math.max(spec.range[0], n === 3 ? 100 : 1), Math.min(spec.range[1], n === 3 ? 999 : 99))}`.padStart(n, '0');
      const number = `${rng.int(1, 9999)}`.padStart(4, '0');
      return { ...(spec.region ? { region: rng.pick(KR_REGIONS)[0] } : {}), serial: `${cls}${rng.pick(spec.hangul)} ${number}` };
    },
    validate: ({ region = '', serial = '' }) => {
      if (spec.region && !KR_REGIONS.some(([r]) => r === region)) return 'Choose one of the 17 regions.';
      if (!compiled.some((c) => c.test(serial))) return `Serial should look like ${shape} using ${[...spec.hangul].join(' ')}`;
      const cls = Number(splitKrSerial(serial).cls);
      return cls < spec.range[0] || cls > spec.range[1] ? `Class number must be ${spec.range[0]}–${spec.range[1]}` : null;
    },
    text: ({ region = '', serial = '' }) => (spec.region ? `${region} ${serial}` : serial),
  };
}

const priv = KR_HANGUL.private;

export const korea: Region = {
  id: 'kr',
  name: 'South Korea',
  code: 'ROK',
  group: 'Asia',
  flag: '🇰🇷',
  template: 'kr',
  design: { layout: 'long', variant: 'white' },
  notes:
    'Class number + hangul series + four digits. Passenger class numbers were 01–69 until September 2019 and 100–699 afterwards; 70–79 vans/buses, 80–97 trucks, 98–99 special. Private hangul, 바사아자 commercial, 배 delivery, 하허호 rental. ' + NOTE,
  families: [
    { id: 'private', label: 'Non-commercial', summary: 'Black on white; electric and corporate variants.' },
    { id: 'commercial', label: 'Commercial (yellow)', summary: 'Taxis, buses, trucks and delivery vans; region name retained.' },
  ],
  eras: [
    { id: 'seven', label: '2006 one-row · 7 characters', period: [2006, 2019], family: 'private' },
    { id: 'eight', label: '2019 · 8 characters', period: [2019, REVIEW_YEAR], family: 'private' },
  ],
  formats: [
    krFormat({
      id: 'private-2020', era: 'eight', label: '2020 reflective · 8 characters', family: 'private', period: [2020, REVIEW_YEAR],
      hangul: priv, digits: [3], range: [100, 699], design: { band: 'kor' },
      description: 'From July 2020: reflective film with a blue anti-forgery hologram band, taegeuk emblem and KOR at the left. 520 × 110 mm. The band artwork is simplified.',
    }),
    krFormat({
      id: 'private-2019', era: 'eight', label: '2019 · 8 characters', family: 'private', period: [2019, 2020],
      hangul: priv, digits: [3], range: [100, 699], design: {},
      description: 'September 2019: three-digit class number (100–699 for passenger cars) on the plain black-on-white 520 × 110 mm plate.',
    }),
    krFormat({
      id: 'private-2019-short', era: 'eight', label: '2019 · 8 characters · short', family: 'private', period: [2019, REVIEW_YEAR], status: 'uncertain',
      hangul: priv, digits: [3], range: [100, 699], design: { layout: 'short' },
      description: '335 × 155 mm one-row plate for American-size mounts with the three-digit class number. Character spacing is derived, not measured.',
    }),
    krFormat({
      id: 'private-2006', label: '2006 · 7 characters', family: 'private', period: [2006, 2019],
      hangul: priv, digits: [2], range: [1, 69], design: {},
      description: 'November 2006: one-row black-on-white 520 × 110 mm plate, two-digit class number without a region name.',
    }),
    krFormat({
      id: 'private-2006-short', label: '2006 · 7 characters · short', family: 'private', period: [2006, 2019],
      hangul: priv, digits: [2], range: [1, 69], design: { layout: 'short' },
      description: '335 × 155 mm one-row plate; smaller hangul between the class number and serial.',
    }),
    krFormat({
      id: 'rental', era: 'eight', label: 'Rental (하·허·호)', family: 'private', period: [2019, REVIEW_YEAR],
      hangul: KR_HANGUL.rental, digits: [3], range: [100, 699], design: { band: 'kor' },
      description: 'Rental cars use 하, 허 or 호 on the white plate (two-digit class numbers before September 2019).',
    }),
    krFormat({
      id: 'ev', label: 'Electric / hydrogen (blue)', family: 'private', period: [2017, REVIEW_YEAR],
      hangul: priv, digits: [3, 2], range: [1, 699], design: { variant: 'ev', band: 'ev' },
      description: 'Eco-friendly vehicles since June 2017: blue film plate, black characters, taegeuk and EV emblem at the left. Two-digit class numbers before September 2019. Gradient and emblem are simplified.',
      references: [REFS.ev, REFS.kowiki, REFS.wiki],
    }),
    krFormat({
      id: 'corporate', era: 'eight', label: 'Corporate luxury (green)', family: 'private', period: [2024, REVIEW_YEAR], status: 'uncertain',
      hangul: priv + KR_HANGUL.rental, digits: [3], range: [100, 699], design: { variant: 'green', band: 'kor' },
      description: 'From January 2024, corporate-owned or leased cars priced at ₩80 million or more carry a yellow-green plate. Exact colour and band treatment not verified.',
    }),
    krFormat({
      id: 'commercial', label: 'Commercial · one row', family: 'commercial', region: true,
      hangul: KR_HANGUL.commercial, digits: [2], range: [1, 97], design: { variant: 'yellow', layout: 'stacked' },
      description: 'Taxis, buses and trucks: yellow 520 × 110 mm plate with the two-syllable region stacked at the left.',
    }),
    krFormat({
      id: 'delivery', label: 'Delivery (배)', family: 'commercial', region: true,
      hangul: KR_HANGUL.delivery, digits: [2], range: [80, 97], design: { variant: 'yellow', layout: 'stacked' },
      description: 'Parcel-delivery trucks use the series 배 with a truck class number.',
    }),
    krFormat({
      id: 'commercial-two-row', label: 'Commercial · two rows', family: 'commercial', region: true,
      hangul: KR_HANGUL.commercial + KR_HANGUL.delivery, digits: [2], range: [70, 97], design: { variant: 'yellow', layout: 'two-row' },
      description: '335 × 170 mm yellow plate: region and class number above, large hangul and serial below.',
    }),
  ],
};
