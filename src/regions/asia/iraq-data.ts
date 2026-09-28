/** Research snapshot: 2026-09-27. See docs/iraq-iran.md for conflicts and fidelity limits. */
export const IRAQ_SOURCES = [
  { title: 'Iraq: formats, classes and governorate-code table (Wikipedia; secondary)', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iraq' },
  { title: 'Rudaw: Erbil traffic spokesperson / KRG instructions, 25 April 2022', url: 'https://www.rudawarabia.net/arabic/kurdistan/250420224' },
  { title: 'Alsumaria: federal rollout, 2 June 2024', url: 'https://www.alsumaria.tv/news/localnews/490157/رموز-بدل-أسماء-المحافظات-اللوحات-المرورية-الجديدة-تهوي-بـالمميز' },
];
export const IRAQ_GOVERNORATES = [
  ['11', 'Baghdad', 'بغداد'], ['12', 'Nineveh', 'نينوى'], ['13', 'Maysan', 'ميسان'],
  ['14', 'Basra', 'البصرة'], ['15', 'Al Anbar', 'الانبار'], ['16', 'Al-Qadisiyyah', 'القادسية'],
  ['17', 'Muthanna', 'المثنى'], ['18', 'Babil', 'بابل'], ['19', 'Karbala', 'كربلاء'],
  ['20', 'Diyala', 'ديالى'], ['21', 'Sulaymaniyah', 'السليمانية'], ['22', 'Erbil', 'اربيل'],
  ['23', 'Halabja', 'حلبجة'], ['24', 'Duhok', 'دهوك'], ['25', 'Kirkuk', 'كركوك'],
  ['26', 'Saladin', 'صلاح الدين'], ['27', 'Dhi Qar', 'ذي قار'], ['28', 'Najaf', 'النجف'], ['29', 'Wasit', 'واسط'],
].map(([code, name, arabic]) => ({ code, name, arabic, kr: ['21', '22', '23', '24'].includes(code) }));
/** Latin values preserve the documented Iraqi transliteration (J, E, W), not a guessed alphabet. */
export const IRAQ_LETTERS = [
  ['A', 'ا'], ['B', 'ب'], ['J', 'ج'], ['D', 'د'], ['R', 'ر'], ['S', 'س'], ['T', 'ط'],
  ['F', 'ف'], ['K', 'ك'], ['M', 'م'], ['N', 'ن'], ['H', 'هـ'], ['E', 'ى'],
  ['Q', 'ق'], ['L', 'ل'], ['W', 'و'], ['Z', 'ز'],
].map(([latin, arabic]) => ({ latin, arabic }));
/** Approximate screen colours, NOT official colour specifications. Modern colour is on the strip. */
export const IRAQ_CLASSES = [
  { id: 'private', label: 'Private', arabic: 'خصوصي', colour: '#f8f8f3', ink: '#151515' },
  { id: 'hire', label: 'Taxi / bus / for hire', arabic: 'اجرة', colour: '#ba242b', ink: '#ffffff' },
  { id: 'government', label: 'Government', arabic: 'حكومية', colour: '#2366ac', ink: '#ffffff' },
  { id: 'commercial', label: 'Commercial / goods', arabic: 'حمل', colour: '#f1cb31', ink: '#151515' },
  { id: 'agricultural', label: 'Agricultural', arabic: 'زراعي', colour: '#247447', ink: '#ffffff' },
] as const;
export function iraqGovernorate(code: string) {
  return IRAQ_GOVERNORATES.find((g) => g.code === code);
}
