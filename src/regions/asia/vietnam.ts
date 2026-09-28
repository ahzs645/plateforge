import type { Rng } from '../../core/random';
import type { FieldOption, PlateFormat, PlateStatus, Region } from '../../core/types';
import type { VnDesign } from '../../templates/vn';

/**
 * Local codes (ký hiệu địa phương): [code, issuing province before the July 2025 merger, province since].
 * Merged provinces keep every former code (Circular 51/2025/TT-BCA), so the code still names the old area.
 * 80 is the central Traffic Police Department (central agencies); unlisted numbers are not allocated.
 */
export const VN_PROVINCES: ReadonlyArray<readonly [string, string, string?]> = [
  ['11', 'Cao Bằng'], ['12', 'Lạng Sơn'], ['14', 'Quảng Ninh'], ['15', 'Hải Phòng'], ['16', 'Hải Phòng'],
  ['17', 'Thái Bình', 'Hưng Yên'], ['18', 'Nam Định', 'Ninh Bình'], ['19', 'Phú Thọ'], ['20', 'Thái Nguyên'],
  ['21', 'Yên Bái', 'Lào Cai'], ['22', 'Tuyên Quang'], ['23', 'Hà Giang', 'Tuyên Quang'], ['24', 'Lào Cai'],
  ['25', 'Lai Châu'], ['26', 'Sơn La'], ['27', 'Điện Biên'], ['28', 'Hòa Bình', 'Phú Thọ'],
  ['29', 'Hà Nội'], ['30', 'Hà Nội'], ['31', 'Hà Nội'], ['32', 'Hà Nội'], ['33', 'Hà Nội'],
  ['34', 'Hải Dương', 'Hải Phòng'], ['35', 'Ninh Bình'], ['36', 'Thanh Hóa'], ['37', 'Nghệ An'], ['38', 'Hà Tĩnh'],
  ['39', 'Đồng Nai'], ['40', 'Hà Nội'], ['41', 'TP. Hồ Chí Minh'], ['43', 'Đà Nẵng'], ['47', 'Đắk Lắk'],
  ['48', 'Đắk Nông', 'Lâm Đồng'], ['49', 'Lâm Đồng'],
  ...Array.from({ length: 10 }, (_, i) => [`${50 + i}`, 'TP. Hồ Chí Minh'] as const),
  ['60', 'Đồng Nai'], ['61', 'Bình Dương', 'TP. Hồ Chí Minh'], ['62', 'Long An', 'Tây Ninh'], ['63', 'Tiền Giang', 'Đồng Tháp'],
  ['64', 'Vĩnh Long'], ['65', 'Cần Thơ'], ['66', 'Đồng Tháp'], ['67', 'An Giang'], ['68', 'Kiên Giang', 'An Giang'],
  ['69', 'Cà Mau'], ['70', 'Tây Ninh'], ['71', 'Bến Tre', 'Vĩnh Long'], ['72', 'Bà Rịa–Vũng Tàu', 'TP. Hồ Chí Minh'],
  ['73', 'Quảng Bình', 'Quảng Trị'], ['74', 'Quảng Trị'], ['75', 'Thừa Thiên Huế', 'TP. Huế'], ['76', 'Quảng Ngãi'],
  ['77', 'Bình Định', 'Gia Lai'], ['78', 'Phú Yên', 'Đắk Lắk'], ['79', 'Khánh Hòa'], ['81', 'Gia Lai'],
  ['82', 'Kon Tum', 'Quảng Ngãi'], ['83', 'Sóc Trăng', 'Cần Thơ'], ['84', 'Trà Vinh', 'Vĩnh Long'],
  ['85', 'Ninh Thuận', 'Khánh Hòa'], ['86', 'Bình Thuận', 'Lâm Đồng'], ['88', 'Vĩnh Phúc', 'Phú Thọ'], ['89', 'Hưng Yên'],
  ['90', 'Hà Nam', 'Ninh Bình'], ['92', 'Quảng Nam', 'Đà Nẵng'], ['93', 'Bình Phước', 'Đồng Nai'],
  ['94', 'Bạc Liêu', 'Cà Mau'], ['95', 'Hậu Giang', 'Cần Thơ'], ['97', 'Bắc Kạn', 'Thái Nguyên'],
  ['98', 'Bắc Giang', 'Bắc Ninh'], ['99', 'Bắc Ninh'],
];
const CENTRAL: readonly [string, string] = ['80', 'Central agencies (Traffic Police Dept.)'];

/** Series letters: I, J, O, Q, W are never used; R is reserved for trailers. Blue (state) plates use the first 11. */
export const VN_LETTERS = 'ABCDEFGHKLMNPSTUVXYZ';
export const VN_STATE_LETTERS = 'ABCDEFGHKLM';

const option = ([code, before, after]: readonly [string, string, string?]): FieldOption => ({
  value: code, label: after ? `${code} — ${before} (${after} since 2025)` : `${code} — ${before}`,
});

const REFS = {
  wiki: { title: 'Wikipedia — Vehicle registration plates of Vietnam', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Vietnam' },
  viwiki: { title: 'Wikipedia (vi) — Biển xe cơ giới Việt Nam', url: 'https://vi.wikipedia.org/wiki/Bi%E1%BB%83n_xe_c%C6%A1_gi%E1%BB%9Bi_Vi%E1%BB%87t_Nam' },
  c79: { title: 'Bộ Công an — Màu sắc, seri, ký hiệu biển số xe từ 01/01/2025 (Circular 79/2024/TT-BCA)', url: 'https://bocongan.gov.vn/chinh-sach-phap-luat/bai-viet/nhan-dien-mau-sac-seri-ky-hieu-bien-so-xe-cua-co-quan-to-chuc-ca-nhan-tu-01012025-d1-t1617' },
  merger: { title: 'Bộ Công an — biển số xe sau sáp nhập tỉnh (Circular 51/2025/TT-BCA)', url: 'https://bocongan.gov.vn/hoi-dap/chi-tiet-cau-hoi/914b9897-ac04-4a82-bb7c-d3282126f7ed?page=%2F' },
} as const;

const NOTE = 'Approximate reconstruction in Barlow Condensed, not the official plate typeface. Since August 2023 plates are tied to the owner\'s personal identification number (Circular 24/2023, continued by Circular 79/2024) — the printed format did not change.';
const REVIEW_YEAR = 2026;

const digits = (rng: Rng, n: number) => Array.from({ length: n }, () => rng.pick('0123456789')).join('');

function vnFormat(spec: {
  id: string;
  label: string;
  description: string;
  family: 'car' | 'motorcycle';
  /** Series regex source and generator. */
  series: { pattern: string; shape: string; make: (rng: Rng) => string };
  /** true → `123.45`, false → `1234`. */
  five: boolean;
  central?: boolean;
  design: Partial<VnDesign>;
  period?: readonly [number, number];
  status?: PlateStatus;
}): PlateFormat {
  const provinces = spec.central ? [...VN_PROVINCES, CENTRAL] : VN_PROVINCES;
  const seriesRe = new RegExp(`^${spec.series.shape}$`);
  const numberRe = spec.five ? /^\d{3}\.\d{2}$/ : /^\d{4}$/;
  const moto = spec.family === 'motorcycle';
  const num = spec.five ? '999.99' : '9999';
  return {
    id: spec.id,
    label: spec.label,
    description: `${spec.description} ${NOTE}`,
    family: spec.family,
    period: spec.period,
    status: spec.status,
    references: [REFS.c79, REFS.wiki, REFS.viwiki, REFS.merger],
    pattern: moto ? `99-${spec.series.pattern} ${num}` : `99${spec.series.pattern}-${num}`,
    design: spec.design,
    fields: [
      { key: 'province', label: 'Local code', options: provinces.map(option) },
      { key: 'series', label: 'Series', maxLength: 2, placeholder: spec.series.pattern },
      { key: 'number', label: 'Number', maxLength: spec.five ? 6 : 4, placeholder: num },
    ],
    generate: (rng) => {
      const n = digits(rng, spec.five ? 5 : 4);
      return { province: rng.pick(provinces)[0], series: spec.series.make(rng), number: spec.five ? `${n.slice(0, 3)}.${n.slice(3)}` : n };
    },
    validate: ({ province = '', series = '', number = '' }) =>
      !provinces.some(([c]) => c === province) ? 'Choose an allocated local code.'
        : !seriesRe.test(series) ? `Series should look like ${spec.series.pattern} (no I, J, O, Q, W)`
          : !numberRe.test(number) ? `Number should look like ${num}`
            : null,
    text: ({ province = '', series = '', number = '' }) => (moto ? `${province}-${series} ${number}` : `${province}${series}-${number}`),
  };
}

const L = `[${VN_LETTERS}]`;
const carSeries = { pattern: 'A', shape: L, make: (rng: Rng) => rng.pick(VN_LETTERS) };
const stateSeries = { pattern: 'A', shape: `[${VN_STATE_LETTERS}]`, make: (rng: Rng) => rng.pick(VN_STATE_LETTERS) };

export const vietnam: Region = {
  id: 'vn',
  name: 'Vietnam',
  code: 'VN',
  group: 'Asia',
  flag: '🇻🇳',
  template: 'vn',
  design: { layout: 'long', variant: 'white' },
  notes:
    'Two-digit local code, series letter(s), then a number. Colour shows use: white private/organisation, yellow commercial transport (since August 2020), blue state agencies. Military (red) and foreign/diplomatic (NG, NN, QT) plates are not included. ' + NOTE,
  families: [
    { id: 'car', label: 'Cars', summary: 'Long 520 × 110 mm or two-row 330 × 165 mm.' },
    { id: 'motorcycle', label: 'Motorcycles', summary: 'Two-row 190 × 140 mm.' },
  ],
  formats: [
    vnFormat({
      id: 'car-long', label: 'Car · long', family: 'car', series: carSeries, five: true, design: {},
      description: 'Private and non-commercial organisation cars: black on white, 520 × 110 mm, e.g. 30A-123.45.',
    }),
    vnFormat({
      id: 'car-short', label: 'Car · two rows', family: 'car', series: carSeries, five: true, design: { layout: 'short' },
      description: 'Two-row 330 × 165 mm plate: local code and series above, five-digit number below.',
    }),
    vnFormat({
      id: 'car-long-4', label: 'Car · long · 4-digit (older)', family: 'car', series: carSeries, five: false, design: {},
      description: 'Older four-digit numbers (e.g. 29A-1234), still in circulation. Introduction and end dates not verified.',
    }),
    vnFormat({
      id: 'commercial', label: 'Commercial transport (yellow)', family: 'car', series: carSeries, five: true, period: [2020, REVIEW_YEAR], design: { variant: 'yellow' },
      description: 'Taxis, buses, trucks and ride-hailing cars: black on yellow from 1 August 2020 (Circular 58/2020/TT-BCA).',
    }),
    vnFormat({
      id: 'commercial-short', label: 'Commercial · two rows (yellow)', family: 'car', series: carSeries, five: true, period: [2020, REVIEW_YEAR], design: { variant: 'yellow', layout: 'short' },
      description: 'Two-row 330 × 165 mm yellow plate.',
    }),
    vnFormat({
      id: 'state', label: 'State agency (blue)', family: 'car', series: stateSeries, five: true, central: true, design: { variant: 'blue' },
      description: 'Party and state agencies, public bodies: white on blue; series A–M (11 letters, Circular 79/2024).',
    }),
    vnFormat({
      id: 'moto', label: 'Motorcycle', family: 'motorcycle', five: true, design: { layout: 'moto' },
      series: { pattern: 'A9', shape: `${L}[1-9]`, make: (rng) => rng.pick(VN_LETTERS) + rng.int(1, 9) },
      description: 'White 190 × 140 mm plate: code and series (letter + digit 1–9) above, five-digit number below, e.g. 29-B1 / 123.45.',
    }),
    vnFormat({
      id: 'moto-two-letter', label: 'Motorcycle · two-letter series', family: 'motorcycle', five: true, design: { layout: 'moto' }, status: 'uncertain',
      series: { pattern: 'AA', shape: `${L}${L}`, make: (rng) => rng.pick(VN_LETTERS) + rng.pick(VN_LETTERS) },
      description: 'Circular 79/2024 describes white motorcycle series as two of the 20 letters (earlier used mainly for mopeds under 50 cc). How widely two-letter series are issued to larger motorcycles is not verified.',
    }),
    vnFormat({
      id: 'moto-state', label: 'Motorcycle · state agency (blue)', family: 'motorcycle', five: true, central: true, design: { layout: 'moto', variant: 'blue' },
      series: { pattern: 'A9', shape: `[${VN_STATE_LETTERS}][1-9]`, make: (rng) => rng.pick(VN_STATE_LETTERS) + rng.int(1, 9) },
      description: 'State agency motorcycles: white on blue, series A–M + digit 1–9.',
    }),
  ],
};
