import { compilePattern } from '../../core/pattern';
import type { Rng } from '../../core/random';
import type { FieldDef, FieldOption, Parts, PlateFormat, PlateStatus, Region } from '../../core/types';
import { BR_USES, type MercosurDesign } from '../../templates/mercosur';

const REVIEW_YEAR = 2026; // End of researched coverage, NOT a withdrawal date.
const GROUP = 'South America';

const REF = {
  mercosur: { title: 'Wikipedia — Vehicle registration plates of the Mercosur', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_the_Mercosur' },
  patente: { title: 'Wikipedia (es) — Patente Única del Mercosur', url: 'https://es.wikipedia.org/wiki/Patente_%C3%9Anica_del_Mercosur' },
  brWiki: { title: 'Wikipedia — Vehicle registration plates of Brazil', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Brazil' },
  br780: { title: 'CONTRAN Resolução nº 780/2019 (Annex I: PIV specification; Annex II: conversion table)', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao7802019.pdf' },
  br729: { title: 'CONTRAN Resolução nº 729/2018 (consolidated)', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao7292018consolidada.pdf' },
  br748: { title: 'ONSV (2018) — Brasão e bandeira nas placas padrão Mercosul deixam de ser obrigatórios', url: 'https://www.onsv.org.br/comunicacao/materias/brasao-e-bandeira-nas-placas-padrao-mercosul-deixam-de-ser-obrigatorios' },
  br887: { title: 'CONTRAN Resolução nº 887/2021 (collector plates, black background)', url: 'https://www.legisweb.com.br/legislacao/?id=424889' },
  br231: { title: 'CONTRAN Resolução nº 231/2007 (consolidated): grey-plate dimensions, colours, tarjeta', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/cons231.pdf' },
  arWiki: { title: 'Wikipedia — Vehicle registration plates of Argentina', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Argentina' },
  arEs: { title: 'Wikipedia (es) — Matrículas automovilísticas de Argentina', url: 'https://es.wikipedia.org/wiki/Matr%C3%ADculas_automovil%C3%ADsticas_de_Argentina' },
  arMoto: { title: 'Infobae (16 Mar 2016) — Cómo será la nueva patente del Mercosur (moto: A12 over 3BCD)', url: 'https://www.infobae.com/2016/03/16/1797317-como-sera-la-nueva-patente-del-mercosur-que-entrara-vigencia-abril/' },
  arGov: { title: 'Casa Rosada — Ya rige la nueva patente del Mercosur', url: 'https://www.casarosada.gob.ar/gobierno-informa/35898-ya-rige-la-nueva-patente-del-mercosur' },
  ar1995: { title: 'Diario Vial PERVA — Matrículas automovilísticas de Argentina (1995 plate: 294 × 129 mm)', url: 'https://padresenruta.blogspot.com/2015/10/matriculas-automovilisticas-de.html' },
  uyWiki: { title: 'Wikipedia — Vehicle registration plates of Uruguay', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Uruguay' },
  uyEs: { title: 'Wikipedia (es) — Matrículas automovilísticas de Uruguay', url: 'https://es.wikipedia.org/wiki/Matr%C3%ADculas_automovil%C3%ADsticas_de_Uruguay' },
  uyMdm: { title: 'Matrículas del Mundo — Uruguay (special-class codes and colours)', url: 'https://matriculasdelmundo.com/en/uruguay.html' },
  pyWiki: { title: 'Wikipedia — Vehicle registration plates of Paraguay', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Paraguay' },
  pyHoy: { title: 'Diario HOY — Nuevas chapas Mercosur rigen desde julio', url: 'https://www.hoy.com.py/nacionales/nuevas-chapas-mercosur-rigen-desde-julio-vehiculos-0-km-y-recien-importados-los-primeros-en-usarlas' },
} as const;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const pickN = (rng: Rng, set: string, n: number) => Array.from({ length: n }, () => rng.pick(set)).join('');

interface Spec {
  id: string;
  label: string;
  family: 'car' | 'motorcycle' | 'historic';
  pattern: string;
  description: string;
  references: readonly { title: string; url: string }[];
  design: MercosurDesign;
  period?: readonly [number, number];
  status?: PlateStatus;
  /** Serial generator; defaults to the pattern. */
  serial?: (rng: Rng) => string;
  /** Extra check after the pattern matches. */
  check?: (serial: string) => string | null;
  /** Extra select fields and their generators. */
  extra?: readonly { field: FieldDef & { options: readonly FieldOption[] }; pick?: (rng: Rng) => string }[];
  /** Free-text field (municipality) with a generator. */
  city?: (rng: Rng, parts: Parts) => string;
}

function plate(spec: Spec): PlateFormat {
  const compiled = compilePattern(spec.pattern);
  const extra = spec.extra ?? [];
  return {
    id: spec.id, label: spec.label, family: spec.family, pattern: spec.pattern, description: spec.description,
    references: spec.references, design: spec.design,
    ...(spec.period ? { period: spec.period } : {}),
    ...(spec.status ? { status: spec.status } : {}),
    fields: [
      { key: 'serial', label: 'Serial', maxLength: compiled.tokens.length },
      ...extra.map((e) => e.field),
      ...(spec.city ? [{ key: 'city', label: 'Municipality', maxLength: 24 }] : []),
    ],
    generate: (rng) => {
      const parts: Parts = { serial: spec.serial ? spec.serial(rng) : compiled.generate(rng) };
      for (const e of extra) parts[e.field.key] = e.pick ? e.pick(rng) : rng.pick(e.field.options).value;
      if (spec.city) parts.city = spec.city(rng, parts);
      return parts;
    },
    validate: (p) => {
      const serial = p.serial ?? '';
      if (!compiled.test(serial)) return `Serial should look like ${spec.pattern}`;
      for (const e of extra) if (!e.field.options.some((o) => o.value === p[e.field.key])) return `Choose a ${e.field.label.toLowerCase()}.`;
      return spec.check?.(serial) ?? null;
    },
  };
}

// ─── Brazil ─────────────────────────────────────────────────────────────────

/** Federative units with their capitals (used as the default municipality on grey-plate tarjetas). */
export const BR_UFS = [
  ['AC', 'ACRE', 'RIO BRANCO'], ['AL', 'ALAGOAS', 'MACEIO'], ['AP', 'AMAPA', 'MACAPA'], ['AM', 'AMAZONAS', 'MANAUS'],
  ['BA', 'BAHIA', 'SALVADOR'], ['CE', 'CEARA', 'FORTALEZA'], ['DF', 'DISTRITO FEDERAL', 'BRASILIA'], ['ES', 'ESPIRITO SANTO', 'VITORIA'],
  ['GO', 'GOIAS', 'GOIANIA'], ['MA', 'MARANHAO', 'SAO LUIS'], ['MT', 'MATO GROSSO', 'CUIABA'], ['MS', 'MATO GROSSO DO SUL', 'CAMPO GRANDE'],
  ['MG', 'MINAS GERAIS', 'BELO HORIZONTE'], ['PA', 'PARA', 'BELEM'], ['PB', 'PARAIBA', 'JOAO PESSOA'], ['PR', 'PARANA', 'CURITIBA'],
  ['PE', 'PERNAMBUCO', 'RECIFE'], ['PI', 'PIAUI', 'TERESINA'], ['RJ', 'RIO DE JANEIRO', 'RIO DE JANEIRO'], ['RN', 'RIO GRANDE DO NORTE', 'NATAL'],
  ['RS', 'RIO GRANDE DO SUL', 'PORTO ALEGRE'], ['RO', 'RONDONIA', 'PORTO VELHO'], ['RR', 'RORAIMA', 'BOA VISTA'], ['SC', 'SANTA CATARINA', 'FLORIANOPOLIS'],
  ['SP', 'SAO PAULO', 'SAO PAULO'], ['SE', 'SERGIPE', 'ARACAJU'], ['TO', 'TOCANTINS', 'PALMAS'],
] as const;
const UF_FIELD = { key: 'uf', label: 'State (UF)', preserveOnGenerate: true, options: BR_UFS.map(([uf, name]) => ({ value: uf, label: `${uf} — ${name}` })) };
const capitalOf = (_: Rng, p: Parts) => BR_UFS.find(([uf]) => uf === p.uf)?.[2] ?? '';

/**
 * Res. 780/2019 Annex II: an old LLL-NNNN plate converts to LLLNLNN by replacing
 * the second digit with a letter (0→A … 9→J).
 */
export function brToMercosur(old: string): string | null {
  const m = /^([A-Z]{3})-?(\d)(\d)(\d{2})$/.exec(old);
  return m ? `${m[1]}${m[2]}${'ABCDEFGHIJ'[Number(m[3])]}${m[4]}` : null;
}

const BR_MERCOSUR = 'AAA9A99';
const S_BR: readonly [number, number] = [2018, REVIEW_YEAR];
const NOTE_BR = 'Characters are FE-Schrift in the specification; drawn here in EuroPlate. The 2D code square is decorative and encodes nothing; the emblem and flag are simplified.';

const brCar = BR_USES.map((use) => plate({
  id: `mercosur-${use.id}`, label: `Mercosur · ${use.label}`, family: 'car', period: S_BR, pattern: BR_MERCOSUR,
  description: `White plate with ${use.colour} characters (Pantone ${use.pantone}; Res. 780/2019 Tables III and VI). The micro-inscription MERCOSUR BRASIL MERCOSUL runs inside the characters. ${NOTE_BR}`,
  references: [REF.br780, REF.brWiki], design: { ink: use.ink, inscription: use.inscription },
}));

const BRAZIL_CAR: PlateFormat[] = [
  ...brCar,
  plate({
    id: 'mercosur-collector-national', label: 'Mercosur · Collector (national only, black)', family: 'car', period: [2022, REVIEW_YEAR], status: 'uncertain', pattern: BR_MERCOSUR,
    description: 'From June 2022 (Res. 887/2021) collector vehicles restricted to national circulation may use a non-retroreflective black plate keeping the blue band, without the MERCOSUR BRASIL MERCOSUL inscription. White characters follow secondary sources; the exact character colour is not confirmed here.',
    references: [REF.br887, REF.brWiki], design: { ink: '#e8e8e4', bg: '#141414' },
  }),
  plate({
    id: 'mercosur-2018-marks', label: 'Mercosur 2018 · with state & municipal marks', family: 'car', period: [2018, 2018], status: 'uncertain', pattern: BR_MERCOSUR,
    extra: [{ field: UF_FIELD, pick: () => 'RJ' }],
    description: 'First Brazilian issue (Rio de Janeiro from 11 September 2018) under Res. 729/2018 carried the state flag and municipal coat of arms. Res. 748/2018 (December 2018) dropped them; plates already issued stayed valid. The marks are abstract placeholders and their exact placement is not verified.',
    references: [REF.br729, REF.br748, REF.brWiki], design: { ink: '#111111', inscription: '#3a3d39', marks: true },
  }),
];

const BRAZIL_MOTO: PlateFormat[] = [
  plate({
    id: 'mercosur-motorcycle', label: 'Mercosur · Motorcycle (two rows)', family: 'motorcycle', period: S_BR, pattern: BR_MERCOSUR,
    extra: [{ field: { key: 'use', label: 'Use (character colour)', preserveOnGenerate: true, options: BR_USES.map((u) => ({ value: u.id, label: u.label })) }, pick: () => 'particular' }],
    description: `200 × 170 mm with a 196 × 30 mm band and 53 mm characters (Res. 780/2019 Tables I–II, §2.4.1.2); three letters above, NLNN below. Character colour follows the selected use. ${NOTE_BR}`,
    references: [REF.br780, REF.brWiki], design: { moto: true, split: 3 },
  }),
];

const GREY = '#a9adb0';
const grey = (id: string, label: string, bg: string, ink: string, tarjeta: 'municipal' | readonly FieldOption[], status?: PlateStatus, note = '') => plate({
  id: `grey-${id}`, label: `Grey series · ${label}`, family: 'historic', period: [1990, 2020], status, pattern: 'AAA-9999',
  ...(tarjeta === 'municipal'
    ? { extra: [{ field: UF_FIELD }], city: capitalOf }
    : { extra: [{ field: { key: 'tarjeta', label: 'Tarjeta', options: tarjeta } }] }),
  description: `${bg === GREY ? 'Grey' : 'Coloured'} 400 × 130 mm plate, three letters and four digits (63 mm Mandatory lettering, spaced here by the Res. 231/2007 width table and drawn in UKNumberPlate) under a riveted tarjeta. Colours per Res. 231/2007; earlier years assumed the same. Replaced state by state by the Mercosur plate, September 2018 – January 2020. ${note}`.trim(),
  references: [REF.br231, REF.brWiki], design: { series: 'br-grey', bg, ink },
});
const OFFICIAL_TARJETA = [{ value: 'BRASIL', label: 'BRASIL — federal' }, ...BR_UFS.map(([, name]) => ({ value: name, label: `${name} — state` }))];
const DIPLOMATIC_TARJETA = [
  { value: 'CMD', label: 'CMD — head of diplomatic mission' }, { value: 'CD', label: 'CD — diplomatic corps' }, { value: 'CC', label: 'CC — consular corps' },
  { value: 'OI', label: 'OI — international organisation' }, { value: 'ADM', label: 'ADM — career administrative staff' },
];

const BRAZIL_GREY: PlateFormat[] = [
  grey('particular', 'Private (grey)', GREY, '#141414', 'municipal', undefined, 'The tarjeta shows the UF and the municipality of registration.'),
  grey('aluguel', 'Hire (red)', '#b3161c', '#f7f7f4', 'municipal', undefined, 'Taxis, buses, trucks for hire.'),
  grey('aprendizagem', 'Driving school', '#f4f4f0', '#b3161c', 'municipal'),
  grey('experiencia', 'Test / manufacturer (green)', '#1f7a3a', '#f7f7f4', 'municipal'),
  grey('colecao', 'Collector (black)', '#161616', GREY, 'municipal'),
  grey('oficial', 'Official (white)', '#f4f4f0', '#141414', OFFICIAL_TARJETA, undefined, 'Federal plates read BRASIL on the tarjeta, state plates the state name; municipal official plates (UF + municipality) are not modelled.'),
  grey('diplomatico', 'Diplomatic & consular (blue)', '#1f4f9e', '#f7f7f4', DIPLOMATIC_TARJETA, undefined, 'The tarjeta carries CMD, CD, CC, OI or ADM instead of the municipality.'),
  grey('representacao', 'Representation (black & gold)', '#161616', '#caa24a', OFFICIAL_TARJETA, 'uncertain', 'Res. 231 exempts these plates from the municipal tarjeta but does not say what they show; BRASIL / state name is assumed.'),
  plate({
    id: 'grey-motorcycle', label: 'Grey series · Motorcycle', family: 'historic', period: [1990, 2011], pattern: 'AAA-9999',
    extra: [{ field: UF_FIELD }], city: capitalOf,
    description: '187 × 136 mm, 42 mm characters: letters above, digits below, tarjeta on top (Res. 231/2007 Annex 3). Motorcycles registered from 1 January 2012 use a 200 × 170 mm plate with 53 mm characters (Res. 372/2011), not drawn here.',
    references: [REF.br231, REF.brWiki], design: { series: 'br-grey', moto: true, bg: GREY, ink: '#141414' },
  }),
];

export const brazil: Region = {
  id: 'br', name: 'Brazil', code: 'BR', flag: '🇧🇷', group: GROUP, template: 'mercosur', design: { country: 'br', qr: true, sign: 'BR' },
  notes: 'Mercosur plates (CONTRAN Res. 729/2018, 780/2019) since September 2018; the grey RENAVAM series (1990–2020) is under Historic. Validation checks the documented shape, not whether a registration exists. Timeline end 2026 means researched through 2026.',
  families: [
    { id: 'car', label: 'Mercosur cars', summary: 'One format per use class; the class sets the character colour.' },
    { id: 'motorcycle', label: 'Mercosur motorcycles' },
    { id: 'historic', label: 'Earlier series', summary: 'The grey RENAVAM series: three letters, four digits, UF and municipality tarjeta.' },
  ],
  eras: [
    { id: 'mercosur-2018', label: 'Mercosur', period: S_BR, family: 'car', summary: 'Rio de Janeiro from September 2018; every state by January 2020.' },
    { id: 'grey-1990', label: 'Grey series', period: [1990, 2020], family: 'historic', summary: 'National RENAVAM register; colours by use class (Res. 231/2007).' },
  ],
  gaps: [
    { id: 'yellow-1969', label: 'Two letters + four digits (1969–1990)', period: [1969, 1989], family: 'historic', note: 'State-run registers, AB-1234 on yellow private plates; colours and layouts not yet reconstructed.', sources: [REF.brWiki] },
  ],
  formats: [...BRAZIL_CAR, ...BRAZIL_MOTO, ...BRAZIL_GREY],
};

// ─── Argentina ──────────────────────────────────────────────────────────────

const S_AR: readonly [number, number] = [2016, REVIEW_YEAR];
/** Series issued so far start AA…AG (AD was reached in July 2018); generation stays in that range. */
const arSeries = (rng: Rng) => `A${rng.pick('ABCDEFG')}`;

export const argentina: Region = {
  id: 'ar', name: 'Argentina', code: 'RA', flag: '🇦🇷', group: GROUP, template: 'mercosur', design: { country: 'ar' },
  notes: 'DNRPA registrations. Mercosur plates since 1 April 2016; the 1995–2016 black plate is under Historic. Timeline end 2026 means researched through 2026.',
  families: [
    { id: 'car', label: 'Mercosur cars' },
    { id: 'motorcycle', label: 'Mercosur motorcycles' },
    { id: 'historic', label: 'Earlier series' },
  ],
  gaps: [
    { id: 'provincial-1964', label: 'Province letter + digits (1964–1994)', period: [1964, 1994], family: 'historic', note: 'One letter for the province (B Buenos Aires, C Capital Federal, X Córdoba …) and up to seven digits, white on black; not yet reconstructed.', sources: [REF.arEs] },
  ],
  formats: [
    plate({
      id: 'mercosur', label: 'Mercosur · AA 123 BC', family: 'car', period: S_AR, pattern: 'AA 999 AA',
      serial: (rng) => `${arSeries(rng)} ${pickN(rng, '0123456789', 3)} ${pickN(rng, LETTERS, 2)}`,
      description: 'Two letters, three digits, two letters in black on white, black frame (from 1 April 2016). Generation stays in the AA–AG series actually reached; any letters validate. Band reads REPUBLICA ARGENTINA.',
      references: [REF.arWiki, REF.arGov, REF.mercosur], design: {},
    }),
    plate({
      id: 'mercosur-motorcycle', label: 'Mercosur · Motorcycle A12 / 3BCD', family: 'motorcycle', period: S_AR, pattern: 'A999AAA',
      description: 'One letter, three digits, three letters on two rows: letter and two digits above, one digit and three letters below. Drawn at the Brazilian 200 × 170 mm motorcycle size; the Argentine dimensions are not verified.',
      references: [REF.arMoto, REF.arWiki, REF.patente], design: { moto: true, split: 3 }, status: 'uncertain',
    }),
    plate({
      id: 'black-1995', label: '1995 series · ABC 123', family: 'historic', period: [1995, 2016], pattern: 'AAA 999',
      description: '294 × 129 mm aluminium plate: satin-black centre band with white characters (about 32 × 67 mm) between white reflective strips, ARGENTINA in light blue at the top. Lettering is Barlow Condensed, not the official die.',
      references: [REF.arWiki, REF.arEs, REF.ar1995], design: { series: 'ar-1995' },
    }),
  ],
};

// ─── Uruguay ────────────────────────────────────────────────────────────────

/** First letter of a Uruguayan Mercosur plate: the issuing department (Ñ unused). */
export const UY_DEPARTMENTS = [
  ['A', 'Canelones'], ['B', 'Maldonado'], ['C', 'Rocha'], ['D', 'Treinta y Tres'], ['E', 'Cerro Largo'], ['F', 'Rivera'],
  ['G', 'Artigas'], ['H', 'Salto'], ['I', 'Paysandú'], ['J', 'Río Negro'], ['K', 'Soriano'], ['L', 'Colonia'],
  ['M', 'San José'], ['N', 'Flores'], ['O', 'Florida'], ['P', 'Lavalleja'], ['Q', 'Durazno'], ['R', 'Tacuarembó'], ['S', 'Montevideo'],
] as const;
const UY_LETTERS = UY_DEPARTMENTS.map(([l]) => l).join('');
export const uyDepartment = (serial: string) => UY_DEPARTMENTS.find(([l]) => l === serial[0])?.[1];
const checkDepartment = (serial: string) => (uyDepartment(serial) ? null : `First letter must be a department code (${UY_LETTERS[0]}–${UY_LETTERS.at(-1)}).`);

/** Special-use codes (second and third letters) and their frame colours. */
export const UY_CLASSES = [
  { value: 'OF', label: 'OF — official', frame: '#1d4fa0' },
  { value: 'TX', label: 'TX — taxi', frame: '#1f7a3a' },
  { value: 'AM', label: 'AM — ambulance', frame: '#1f7a3a' },
  { value: 'TC', label: 'TC — public transport', frame: '#1f7a3a' },
  { value: 'ES', label: 'ES — school transport', frame: '#1f7a3a' },
  { value: 'TU', label: 'TU — tourism', frame: '#1f7a3a' },
  { value: 'AL', label: 'AL — rental', frame: '#c21d24' },
  { value: 'RE', label: 'RE — remise', frame: '#c21d24' },
  { value: 'TP', label: 'TP — heavy transport', frame: '#c21d24' },
  { value: 'ME', label: 'ME — physician', frame: '#111111' },
  { value: 'DI', label: 'DI — disabled person', frame: '#111111' },
] as const;

const S_UY: readonly [number, number] = [2015, REVIEW_YEAR];
const uySerial = (rng: Rng, digits: number) => `${rng.pick(UY_LETTERS)}${pickN(rng, LETTERS, 2)} ${pickN(rng, '0123456789', digits)}`;
const uySpecial: PlateFormat = {
  id: 'mercosur-special', label: 'Mercosur · Special use (class code)', family: 'car', period: S_UY, status: 'uncertain', pattern: 'Department + class code + 9999',
  description: 'Special-use plates put a class code (OF official, TX taxi, AL rental …) after the department letter, with a class-coloured frame. Codes and frame colours come from secondary sources and are not verified against SUCIVE rules.',
  references: [REF.uyWiki, REF.uyMdm], design: { frameByClass: Object.fromEntries(UY_CLASSES.map((c) => [c.value, c.frame])) },
  fields: [
    { key: 'dept', label: 'Department', options: UY_DEPARTMENTS.map(([l, name]) => ({ value: l, label: `${l} — ${name}` })) },
    { key: 'class', label: 'Class', preserveOnGenerate: true, options: UY_CLASSES.map(({ value, label }) => ({ value, label })) },
    { key: 'serial', label: 'Number', maxLength: 4, placeholder: '1234' },
  ],
  generate: (rng) => ({ dept: rng.pick(UY_LETTERS), class: rng.pick(UY_CLASSES).value, serial: pickN(rng, '0123456789', 4) }),
  validate: (p) =>
    !uyDepartment(p.dept ?? '') ? 'Choose a department.'
    : !UY_CLASSES.some((c) => c.value === p.class) ? 'Choose a class code.'
    : /^\d{4}$/.test(p.serial ?? '') ? null : 'Number is four digits.',
  text: (p) => `${p.dept}${p.class} ${p.serial}`,
};

export const uruguay: Region = {
  id: 'uy', name: 'Uruguay', code: 'ROU', flag: '🇺🇾', group: GROUP, template: 'mercosur', design: { country: 'uy' },
  notes: 'SUCIVE plates. Mercosur plates since March 2015 (Maldonado from January 2019); the first letter is the department. Timeline end 2026 means researched through 2026.',
  families: [
    { id: 'car', label: 'Mercosur cars' },
    { id: 'motorcycle', label: 'Mercosur motorcycles' },
  ],
  eras: [{ id: 'mercosur-2015', label: 'Mercosur', period: S_UY, family: 'car' }],
  gaps: [
    { id: 'departmental-2001', label: 'Departmental plates before Mercosur', period: [2001, 2014], family: 'car', note: 'ABC 1234 with departmental arms on 450 × 150 mm plates (Maldonado and Salto differed); not yet reconstructed.', sources: [REF.uyEs, REF.uyMdm] },
  ],
  formats: [
    plate({
      id: 'mercosur', label: 'Mercosur · SAB 1234', family: 'car', period: S_UY, pattern: 'AAA 9999', serial: (rng) => uySerial(rng, 4), check: checkDepartment,
      description: 'Three letters and four digits, black on white. The first letter is the department (S Montevideo, A Canelones, B Maldonado …); the next two are issued by the department. Band reads URUGUAY.',
      references: [REF.uyWiki, REF.uyEs, REF.mercosur], design: {},
    }),
    uySpecial,
    plate({
      id: 'mercosur-motorcycle', label: 'Mercosur · Motorcycle SAB / 123', family: 'motorcycle', period: S_UY, status: 'uncertain', pattern: 'AAA 999',
      serial: (rng) => uySerial(rng, 3), check: checkDepartment,
      description: 'Three letters and three digits with the department letter first. Drawn on two rows at 200 × 170 mm; the Uruguayan layout and size are not verified.',
      references: [REF.uyWiki, REF.uyEs], design: { moto: true, split: 3 },
    }),
  ],
};

// ─── Paraguay ───────────────────────────────────────────────────────────────

const S_PY: readonly [number, number] = [2019, REVIEW_YEAR];

export const paraguay: Region = {
  id: 'py', name: 'Paraguay', code: 'PY', flag: '🇵🇾', group: GROUP, template: 'mercosur', design: { country: 'py' },
  notes: 'Mercosur plates since 1 July 2019 (new and newly imported vehicles first). Timeline end 2026 means researched through 2026.',
  families: [
    { id: 'car', label: 'Mercosur cars' },
    { id: 'motorcycle', label: 'Mercosur motorcycles' },
  ],
  gaps: [
    { id: 'national-2000', label: 'National series ABC 123 (2000–2019)', period: [2000, 2018], family: 'car', note: 'Three letters, three digits (motorcycles 123 ABC) on 320 × 150 mm plates; not yet reconstructed.', sources: [REF.pyWiki] },
  ],
  formats: [
    plate({
      id: 'mercosur', label: 'Mercosur · ABCD 123', family: 'car', period: S_PY, pattern: 'AAAA 999',
      description: 'Four letters and three digits, FE-Schrift black on white (drawn in EuroPlate). The band legend PARAGUAY is assumed; class colours planned in the common rules are not used.',
      references: [REF.pyWiki, REF.pyHoy, REF.patente], design: {},
    }),
    plate({
      id: 'mercosur-motorcycle', label: 'Mercosur · Motorcycle 123 / ABCD', family: 'motorcycle', period: S_PY, status: 'uncertain', pattern: '999 AAAA',
      description: 'Three digits and four letters (the car order reversed). Drawn on two rows at 200 × 170 mm; the Paraguayan layout is not verified.',
      references: [REF.pyWiki, REF.patente], design: { moto: true, split: 3 },
    }),
  ],
};

export const mercosurRegions = [brazil, argentina, uruguay, paraguay];
