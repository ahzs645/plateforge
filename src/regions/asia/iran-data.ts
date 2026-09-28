/** Country-level allocation snapshot, not a live registration database or county resolver. */
export const IRAN_SOURCES = [
  { title: 'Iran: class / serial / allocation tables (Wikipedia; secondary, checked 2026-09-27)', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iran' },
];
export const IRAN_PRIVATE_LETTERS = ['ب', 'ج', 'د', 'س', 'ص', 'ط', 'ق', 'ل', 'م', 'ن', 'و', 'ه', 'ی'] as const;
/** Code 32 is explicitly shared. County/letter/history exceptions must not be collapsed to one province. */
const GROUPS: [string, string][] = [
  ['Tehran city', '10 11 20 22 33 40 44 50 55 60 66 77 88 99'],
  ['Tehran / Alborz', '21 30 38 68 78'], ['Razavi Khorasan', '12 32 36 42 74'],
  ['Isfahan', '13 23 43 53 67'], ['Fars', '63 73 83 93'], ['Mazandaran', '62 72 82 92'],
  ['Khuzestan', '14 24 34'], ['Gilan', '46 56 76'], ['Kermanshah', '19 29'],
  ['Lorestan', '31 41'], ['North Khorasan (legacy exceptions for 32/42)', '26 32 42'],
  ['South Khorasan (legacy exceptions for 32/42)', '32 42 52'], ['Bushehr', '48 58'],
  ['Chaharmahal and Bakhtiari', '71 81'], ['Qazvin', '79 89'], ['Zanjan', '87 97'], ['Ardabil', '91'],
  ['East Azerbaijan', '15 25 35'], ['West Azerbaijan', '17 27 37'], ['Sistan and Baluchestan', '85 95'],
  ['Yazd (64 also has the Tabas exception)', '54 64'], ['Semnan', '86 96'], ['Kerman', '45 65 75'],
  ['Kohgiluyeh and Boyer-Ahmad', '49'], ['Qom', '16'], ['Kurdistan', '51 61'], ['Ilam', '98'],
  ['Golestan', '59 69'], ['Hormozgan', '84 94'], ['Markazi', '47 57'], ['Hamadan', '18 28'],
];
const codeMap = new Map<string, string[]>();
for (const [province, codes] of GROUPS) for (const code of codes.split(' ')) {
  codeMap.set(code, [...(codeMap.get(code) ?? []), province]);
}
export const IRAN_CODES = [...codeMap].sort(([a], [b]) => a.localeCompare(b)).map(([value, provinces]) => ({
  value, label: `${value} — ${provinces.join(' / ')}`, provinces,
}));
/** Each range skips ALL numbers containing zero, including internal zeros (499 -> 511). */
export const IRAN_MOTORCYCLE_RANGES: readonly [number, number, string][] = [
  [111,143,'Tehran city'], [319,324,'Tehran / Alborz'], [371,377,'West Azerbaijan'], [391,398,'East Azerbaijan'],
  [442,443,'Ardabil'], [461,462,'Kurdistan'], [479,482,'Zanjan'], [498,511,'Hamadan'],
  [514,517,'Kermanshah'], [523,525,'Qazvin'], [531,537,'Markazi'], [538,543,'Lorestan'],
  [547,547,'Ilam'], [555,555,'Chaharmahal and Bakhtiari'], [563,569,'Khuzestan'],
  [571,571,'Kohgiluyeh and Boyer-Ahmad'], [578,583,'Gilan'], [586,589,'Mazandaran'],
  [596,597,'Golestan'], [611,615,'Qom'], [618,635,'Isfahan'], [637,643,'Yazd'], [687,698,'Fars'],
  [751,754,'Semnan'], [761,778,'Razavi Khorasan'], [785,786,'North Khorasan'], [791,792,'South Khorasan'],
  [812,817,'Kerman'], [819,823,'Sistan and Baluchestan'], [827,831,'Bushehr'], [835,839,'Hormozgan'], [851,851,'Khuzestan'],
];
export const IRAN_MOTORCYCLE_CODES = IRAN_MOTORCYCLE_RANGES.flatMap(([from, to, province]) =>
  Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
    .filter((value) => !value.includes('0')).map((value) => ({ value, label: `${value} — ${province}` })),
);
export const IRAN_FREE_ZONES = ['Anzali', 'Aras', 'Arvand', 'Kish', 'Maku', 'Chabahar', 'Qeshm'] as const;
