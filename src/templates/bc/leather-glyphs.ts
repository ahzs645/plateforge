/**
 * Original, manually constructed outline masters for the four supplied
 * BCpl8s pre-provincial specimens. Not outlines from an installed typeface,
 * not an autotrace, and not claimed to be recovered manufacturer's dies.
 * Nominal cap height: 100 design units. Unseen figures are extrapolations.
 */
export interface LeatherGlyph {
  d: string;
  width: number;
  mounts?: readonly (readonly [number, number])[];
  transform?: string;
}
const glyph = (width: number, d: string, mounts: LeatherGlyph['mounts'] = []): LeatherGlyph => ({ width, d, mounts });

const serifOne = glyph(49,
  'M6 100 L6 96 C21 95 24 87 24 77 L25 24 C19 31 11 40 0 43 L0 39 C14 30 23 16 28 0 L41 0 L40 79 C40 92 43 96 49 96 L49 100 Z', [[32, 9], [30, 88]]);
const classicalFour = glyph(69,
  'M39 0 L55 0 L53 61 L64 61 L69 69 L52 69 L52 83 C52 92 55 95 64 96 L64 100 L20 100 L20 96 C32 94 36 90 36 81 L37 69 L0 69 L0 61 Z M37 13 L8 61 L37 61 Z', [[46, 11], [45, 86]]);
const curledThree = glyph(65,
  'M10 7 C24 -3 46 -1 57 10 C72 25 61 42 41 49 C66 54 73 76 56 92 C39 109 9 100 3 84 C-1 74 3 64 12 63 C23 62 27 76 17 80 C16 90 28 98 38 91 C50 84 48 64 36 57 C30 53 23 51 16 52 L16 46 C33 46 44 38 45 24 C46 9 33 3 23 10 C17 14 17 20 21 22 C27 26 23 37 15 37 C3 37 -1 23 5 13 Z', [[50, 21], [12, 71]]);
const ornateTwo = glyph(51,
  'M7 10 C18 -5 42 -2 47 15 C56 43 27 60 14 78 C11 82 9 86 8 89 C22 74 33 96 38 83 C41 78 40 71 38 66 L41 65 C51 77 50 95 39 99 C27 104 15 88 8 92 L9 100 L4 100 C-2 86 2 73 15 58 C31 40 36 26 33 15 C30 4 18 5 12 14 C6 23 11 29 18 22 C17 35 7 43 3 31 C-1 23 1 16 7 10 Z', [[31, 13], [31, 85]]);
const wideTwo = glyph(76,
  'M8 12 C19 -3 46 -3 60 8 C78 22 77 45 58 57 C47 64 26 66 16 82 C34 71 48 97 61 86 C66 83 68 79 70 74 L74 76 C70 93 65 101 52 100 C37 100 23 89 13 92 L7 99 L3 98 C0 80 6 68 26 56 C40 48 53 38 52 24 C50 9 39 4 29 8 C19 12 17 21 24 24 C27 31 21 39 14 36 C2 34 -1 24 8 12 Z', [[62, 42], [40, 87]]);
const roundSix = glyph(50,
  'M26 0 C46 -1 54 19 45 32 C40 42 29 37 28 28 C27 24 29 21 31 22 C37 30 42 23 38 15 C34 7 25 7 20 17 C15 26 13 38 13 46 C35 32 51 48 50 72 C49 91 41 100 25 100 C6 100 0 82 0 60 C0 26 8 1 26 0 Z M24 51 C17 51 17 63 17 75 C17 88 18 94 24 94 C30 94 32 86 32 75 C32 61 31 51 24 51 Z', [[12, 14], [37, 79]]);
const roundEight = glyph(49,
  'M24 0 C41 0 49 9 49 24 C49 35 43 43 34 49 C45 55 49 65 49 78 C49 93 40 100 25 100 C9 100 0 92 0 78 C0 64 5 54 15 49 C5 43 0 34 0 23 C0 9 8 0 24 0 Z M24 7 C18 7 18 17 18 26 C18 37 19 44 24 44 C30 44 30 35 30 25 C30 15 30 7 24 7 Z M24 56 C18 56 18 67 18 79 C18 89 20 95 25 95 C31 95 32 88 32 77 C32 64 30 56 24 56 Z', [[12, 22], [38, 76]]);
const ornateFive = glyph(50,
  'M7 0 C17 9 30 9 44 5 L45 23 C34 27 22 18 12 20 L9 43 C24 30 44 40 49 61 C56 83 45 100 28 100 C9 102 0 89 2 73 C3 62 11 57 17 61 C25 66 23 79 16 80 C13 80 11 77 11 75 C8 93 24 100 31 86 C40 65 25 39 10 51 L4 58 L0 57 C6 39 10 12 7 0 Z', [[29, 9], [39, 83]]);
const tallOne = glyph(44,
  'M0 100 L0 96 C9 94 13 89 13 79 L13 12 C8 15 4 16 0 17 L0 11 C9 9 14 5 18 0 L33 0 L33 80 C33 91 37 95 44 96 L44 100 Z');
const tallFour = glyph(56,
  'M23 0 L39 0 L39 65 C45 63 50 59 51 56 L54 56 L54 82 L51 82 C49 75 44 71 39 71 L39 83 C39 92 42 96 50 97 L50 100 L18 100 L18 97 C28 95 30 90 30 81 L30 71 L0 71 L0 66 Z M24 8 L5 65 L30 65 L30 8 Z');
const ovalEight = glyph(56,
  'M28 0 C60 0 62 34 37 48 C66 60 61 100 29 100 C-2 100 -11 62 18 49 C-8 35 -1 0 28 0 Z M23 4 C10 4 5 13 5 25 C5 39 13 46 25 46 C43 45 43 6 23 4 Z M24 53 C10 55 5 64 5 76 C5 91 13 96 27 96 C46 96 46 60 24 53 Z');
const ovalNine = glyph(54,
  'M27 0 C52 0 58 24 53 55 C49 83 43 100 22 100 C5 100 -1 88 2 77 C4 69 12 66 16 73 C20 81 15 88 11 85 C10 95 23 99 32 87 C37 78 39 65 39 55 C20 68 -1 51 0 29 C0 11 10 0 27 0 Z M25 5 C10 5 4 16 4 30 C4 44 13 52 25 52 C42 52 44 7 25 5 Z');
const ovalZero = glyph(55,
  'M27 0 C47 0 55 17 55 50 C55 83 46 100 27 100 C8 100 0 81 0 50 C0 18 8 0 27 0 Z M27 5 C13 5 14 29 14 50 C14 76 14 95 27 95 C42 95 41 73 41 50 C41 26 41 5 27 5 Z');
const serifSeven = glyph(57,
  'M0 0 L57 0 L57 7 C35 38 26 68 24 100 L9 100 C12 62 30 34 48 14 L13 14 C7 14 4 17 3 25 L0 25 Z');
const serifFive = glyph(58,
  'M9 0 L55 0 L52 13 L14 13 L11 42 C40 26 60 44 58 69 C57 90 42 100 25 100 C9 100 0 91 0 79 C0 72 6 68 12 71 C20 74 19 84 11 86 C17 99 37 96 41 78 C48 51 24 37 8 52 L3 50 Z');
const serifTwo = glyph(62,
  'M1 23 C2 8 11 0 28 0 C48 0 61 11 61 28 C61 51 31 60 10 84 L42 84 C51 84 55 79 58 70 L61 70 L56 100 L0 100 L0 94 C10 75 43 49 44 29 C46 10 30 3 19 9 C10 13 10 20 16 23 C22 28 18 37 10 37 C3 37 0 31 1 23 Z');
const serifSix: LeatherGlyph = { ...ovalNine, transform: 'translate(54 100) rotate(180)' };
const roundNine: LeatherGlyph = { ...roundSix, transform: 'translate(50 100) rotate(180)' };
const roundZero = glyph(49,
  'M24 0 C42 0 49 14 49 50 C49 85 42 100 24 100 C7 100 0 83 0 50 C0 15 7 0 24 0 Z M24 7 C17 7 17 26 17 50 C17 76 17 94 24 94 C32 94 32 75 32 50 C32 23 31 7 24 7 Z');

export const SERIF_B = glyph(87,
  'M2 0 L44 0 C85 0 88 34 58 43 C96 47 96 100 45 100 L0 100 L0 95 C11 94 13 90 13 81 L13 18 C13 8 10 6 2 5 Z M29 7 L29 40 L42 40 C67 40 68 7 42 7 Z M29 47 L29 92 L45 92 C77 92 78 47 45 47 Z', [[21, 9], [65, 88]]);
export const SERIF_C = glyph(89,
  'M87 9 L72 30 L67 14 C40 3 10 21 10 51 C10 83 44 104 80 78 L85 83 C60 108 17 108 4 78 C-8 49 4 12 31 3 C51 -4 73 1 87 9 Z', [[49, 9], [26, 90]]);
export const BLOCK_B = glyph(62,
  'M0 0 L49 0 L62 12 L62 41 L54 49 L62 57 L62 88 L49 100 L0 100 Z M13 13 L13 42 L46 42 L46 13 Z M13 57 L13 87 L46 87 L46 57 Z', [[29, 8], [30, 92]]);
export const BLOCK_C = glyph(61,
  'M12 0 L49 0 L61 12 L61 30 L46 30 L46 13 L13 13 L13 87 L46 87 L46 68 L61 68 L61 88 L49 100 L12 100 L0 87 L0 13 Z', [[31, 8], [31, 92]]);

const classic: Record<string, LeatherGlyph> = {
  '0': ovalZero, '1': serifOne, '2': serifTwo, '3': curledThree, '4': classicalFour,
  '5': serifFive, '6': serifSix, '7': serifSeven, '8': ovalEight, '9': ovalNine,
};
const ornate: Record<string, LeatherGlyph> = {
  ...classic, '0': roundZero, '2': ornateTwo, '5': ornateFive,
  '6': roundSix, '8': roundEight, '9': roundNine,
};
export const LEATHER_GLYPHS: Readonly<Record<string, Readonly<Record<string, LeatherGlyph>>>> = {
  '1143': classic,
  '2685': ornate,
  '3432': { ...classic, '2': wideTwo },
  '4189': { ...classic, '1': tallOne, '4': tallFour, '8': ovalEight, '9': ovalNine },
};
export const OBSERVED_DIGITS: Readonly<Record<string, string>> = {
  '1143': '134', '2685': '2568', '3432': '234', '4189': '1489',
};
