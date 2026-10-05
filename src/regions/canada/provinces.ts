/**
 * Canadian provinces and territories other than British Columbia: the current
 * general-issue passenger plate of each, plus documented variants (Alberta's
 * 2026 Moraine Lake base, Ontario green-vehicle and 2020 blue plates, Québec
 * electric plates, NWT/Nunavut polar-bear plates). Serial rules and colours
 * follow the Wikipedia plate articles; artwork includes simplified vectors and
 * the user-supplied background for the current NWT rendition.
 */
import { withLettering } from '../../core/lettering';
import { compilePattern } from '../../core/pattern';
import { numeric, type Rng } from '../../core/random';
import type { PlateFormat, PlateStatus, Region } from '../../core/types';
import type { CaDesign } from '../../templates/ca';

type Ref = { title: string; url: string };
const wiki = (place: string): Ref => ({
  title: `Wikipedia · Vehicle registration plates of ${place}`,
  url: `https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_${place.replace(/ /g, '_')}`,
});
const OVERVIEW: Ref = { title: 'Wikipedia · Canadian licence plate designs and serial formats', url: 'https://en.wikipedia.org/wiki/Canadian_licence_plate_designs_and_serial_formats' };
const ART_NOTE = 'Artwork is a simplified original vector drawing; colours and placement are approximate.';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const without = (drop: string) => [...ALPHABET].filter((c) => !drop.includes(c)).join('');

/**
 * Random letter block between two issued serials (inclusive), counting only
 * the jurisdiction's letters. `skipFirst` drops series reserved for other classes.
 */
export function series(letters: string, from: string, to: string, skipFirst = ''): (rng: Rng) => string {
  const n = letters.length;
  const index = (s: string) => [...s].reduce((acc, c) => {
    const i = letters.indexOf(c);
    if (i < 0) throw new Error(`"${s}" uses a letter outside ${letters}`);
    return acc * n + i;
  }, 0);
  const lo = index(from);
  const hi = index(to);
  return (rng) => {
    for (;;) {
      let v = rng.int(lo, hi);
      let s = '';
      for (let i = 0; i < from.length; i++) { s = letters[v % n] + s; v = Math.floor(v / n); }
      if (!skipFirst.includes(s[0])) return s;
    }
  };
}

interface Spec {
  id: string;
  label: string;
  /** Pattern DSL; `·` marks where the plate prints an emblem between groups. */
  pattern: string;
  /** Human-readable shape when the DSL uses classes. */
  display?: string;
  exclude?: string;
  hint?: string;
  /** Replaces the pattern check, e.g. for numbers without leading zeros. */
  check?: RegExp;
  example: string;
  generate?: (rng: Rng) => string;
  description: string;
  references: readonly Ref[];
  period?: readonly [number, number];
  status?: PlateStatus;
  design?: Partial<CaDesign>;
}

/**
 * A pattern-validated format. Where the plate prints an emblem between serial
 * groups, users may type `·`, a space or a dash there; the text is normalised
 * to `·` so the template can draw the emblem.
 */
function plate(spec: Spec): PlateFormat {
  const exact = compilePattern(spec.pattern, { exclude: spec.exclude });
  const loose = compilePattern(spec.pattern.replace('·', '{sep}'), { exclude: spec.exclude, sets: { sep: '· -' } });
  const sepAt = exact.tokens.findIndex((t) => t.kind === 'literal' && t.value === '·');
  const normalise = (s: string) => (sepAt >= 0 && s.length === exact.tokens.length ? `${s.slice(0, sepAt)}·${s.slice(sepAt + 1)}` : s);
  const shape = spec.display ?? spec.pattern;
  return withLettering({
    id: spec.id,
    label: spec.label,
    description: spec.description,
    references: spec.references,
    pattern: shape,
    period: spec.period,
    status: spec.status,
    design: spec.design,
    fields: [{ key: 'serial', label: 'Serial', maxLength: exact.tokens.length, placeholder: spec.example }],
    generate: (rng) => ({ serial: spec.generate ? spec.generate(rng) : exact.generate(rng) }),
    validate: ({ serial = '' }) => ((spec.check ? spec.check.test(serial) : loose.test(serial)) ? null : `Expected ${shape}${spec.hint ? ` (${spec.hint})` : ''}`),
    text: (parts) => normalise(parts.serial ?? ''),
  });
}

interface Jurisdiction {
  code: string;
  name: string;
  design: CaDesign;
  formats: PlateFormat[];
  notes: string;
}
const region = (j: Jurisdiction): Region => ({
  id: `ca-${j.code.toLowerCase()}`, name: j.name, code: j.code, group: 'North America', country: 'Canada', flag: '🇨🇦',
  template: 'ca', design: j.design, formats: j.formats, notes: j.notes,
});

const BLUE = '#1c3f94';

// ── Alberta ──────────────────────────────────────────────────────────────
const AB_LETTERS = without('AEIOQU');
const AB_RED = '#ac2026';
const AB_BLUE = '#2b5fb4';
const alberta = region({
  code: 'AB', name: 'Alberta',
  design: {
    header: 'Alberta', headerFace: 'sans', headerSize: 60, headerX: 262, headerY: 76, headerColor: AB_BLUE, headerSpacing: -1,
    emblems: [{ kind: 'wild-rose', x: 404, y: 50, size: 70, color: AB_RED }],
    text: AB_RED, serialY: 214, serialSpacing: 6,
    slogan: 'Wild Rose Country', sloganFace: 'sans', sloganWeight: 500, sloganSize: 30, sloganColor: AB_BLUE, sloganY: 282, sloganSpacing: 0,
  },
  notes: 'Alberta passenger plates: the 1983 “Wild Rose Country” base (seven-character serials since 2010) and the 2026 Moraine Lake “Strong and Free” base. Serials skip vowels and Q.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger · Wild Rose Country', pattern: 'AAA-9999', exclude: 'AEIOQU', hint: 'no vowels or Q', example: 'CKT-1800',
      generate: (rng) => `${series(AB_LETTERS, 'CKT', 'DBC')(rng)}-${numeric(rng, 0, 9999, 4)}`,
      description: `Red serial on reflective white; blue “Alberta” wordmark with the wild rose and “Wild Rose Country” below. The ABC-1234 format began at BBB-0000 in June 2010 (A, E, I, O, Q and U skipped); reflective sheeting returned at CKT-1800 in October 2021, reaching about DBC in 2026. ${ART_NOTE}`,
      references: [wiki('Alberta'), OVERVIEW], period: [2010, 2026],
    }),
    plate({
      id: 'moraine-lake-2026', label: 'Moraine Lake · Strong and Free (2026)', pattern: 'AAA·9999', display: 'AAA-9999', exclude: 'AEIOQU', hint: 'no vowels or Q', example: 'DBD·2026',
      generate: (rng) => `${series(AB_LETTERS, 'DBC', 'DDZ')(rng)}·${numeric(rng, 0, 9999, 4)}`,
      description: `The design chosen by public vote in November 2025: Moraine Lake scene with the motto “Strong and Free”, issued from mid-2026 alongside the 1983 base. Reports expect the ABC-1234 sequence to continue; the wild-rose separator, lettering colour and serial range here are unverified. ${ART_NOTE}`,
      references: [
        wiki('Alberta'),
        { title: 'Ponoka News · Government of Alberta reveals new licence plate (2025-11-21)', url: 'https://ponokanews.com/2025/11/21/government-of-alberta-reveals-new-licence-plate/' },
      ],
      period: [2026, 2026], status: 'uncertain',
      design: {
        scene: 'moraine-lake', header: 'Alberta', headerFace: 'script', headerSize: 70, headerX: 300, headerY: 66, headerColor: '#1a4b9f', headerHalo: '#ffffff',
        emblems: [], text: '#1a4b9f', serialHalo: '#ffffff', embossed: false, serialY: 204,
        separator: 'wild-rose', separatorColor: '#e0529c', separatorSize: 64,
        slogan: 'Strong and Free', sloganFace: 'sans', sloganSize: 32, sloganColor: '#1a4b9f', sloganHalo: '#ffffff', sloganY: 284,
      },
    }),
  ],
});

// ── Saskatchewan ─────────────────────────────────────────────────────────
const SK_GREEN = '#1c7a44';
const saskatchewan = region({
  code: 'SK', name: 'Saskatchewan',
  design: {
    header: 'Saskatchewan', headerFace: 'serif', headerWeight: 400, headerSize: 50, headerY: 62, headerColor: SK_GREEN,
    emblems: [{ kind: 'wheat', x: 300, y: 150, size: 230, color: SK_GREEN, opacity: 0.16, back: true }],
    text: SK_GREEN, serialY: 212,
    slogan: 'Land of Living Skies', sloganFace: 'serif', sloganItalic: true, sloganWeight: 400, sloganSize: 32, sloganSpacing: 0, sloganY: 282, sloganColor: SK_GREEN,
  },
  notes: 'Saskatchewan passenger plates since 2009: green on reflective white with a wheat graphic, “Land of Living Skies”. Only rear plates since 2004; no stickers since 2012.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: '999 AAA', exclude: 'O', hint: 'no letter O', example: '905 PIK',
      generate: (rng) => `${numeric(rng, 1, 999, 3)} ${series(without('O'), 'GYA', 'PIK')(rng)}`,
      description: `Green on reflective white with a screened wheat graphic; serif “Saskatchewan” above and “Land of Living Skies” below. Aluminum plates from early 2009, 001 GYA onward (about 905 PIK by July 2026); I, Q, U, V and 001–099 were added then. ${ART_NOTE}`,
      references: [wiki('Saskatchewan'), OVERVIEW], period: [2009, 2026],
    }),
  ],
});

// ── Manitoba ─────────────────────────────────────────────────────────────
const MB_LETTERS = without('IOQ');
const MB_INK = '#1d3a7a';
const mbFormat = (id: string, label: string, from: string, to: string, period: readonly [number, number], extra: string, design?: Partial<CaDesign>, skip = 'CJ') => plate({
  id, label, pattern: 'AAA 999', exclude: 'IOQ', hint: 'no I, O or Q', example: `${to} 101`,
  generate: (rng) => `${series(MB_LETTERS, from, to, skip)(rng)} ${numeric(rng, 101, 999, 3)}`,
  description: `Embossed dark-blue serial on reflective white with a river scene, trees either side and wheat along the bottom; bison at top right and “Friendly Manitoba” above. ${extra} ${ART_NOTE}`,
  references: [wiki('Manitoba'), OVERVIEW], period, design,
});
const manitoba = region({
  code: 'MB', name: 'Manitoba',
  design: {
    scene: 'prairie-river',
    header: 'Manitoba', headerFace: 'serif', headerSize: 50, headerX: 374, headerY: 60, headerColor: MB_INK,
    labels: [{ text: 'Friendly', x: 246, y: 58, size: 40, face: 'script', anchor: 'end', color: MB_INK }],
    emblems: [{ kind: 'bison', x: 540, y: 44, size: 56, color: '#111' }],
    text: MB_INK, serialY: 206,
  },
  notes: 'Manitoba’s “Friendly Manitoba” river-scene base, introduced June 1997; the bison turned black in late 2012. C series are commercial and J series the bilingual “Bienvenue” option.',
  formats: [
    mbFormat('standard', 'Standard passenger', 'GLX', 'MCX', [2012, 2026], 'Late-2012 revision with a black bison: GLX 101 onward (about MCX 825 by May 2026); I, O and Q are not used.'),
    mbFormat('bienvenue', 'Bienvenue (bilingual option)', 'JBA', 'JCF', [2013, 2026], 'Optional bilingual version from February 2013 with “Bienvenue” centred at the bottom: JBA 101 onward.',
      { slogan: 'Bienvenue', sloganFace: 'serif', sloganSize: 28, sloganColor: MB_INK, sloganHalo: '#ffffff', sloganY: 288, sloganSpacing: 1 }, ''),
    mbFormat('standard-1997', '1997 base (blue bison)', 'AAA', 'GLW', [1997, 2012], 'Original 1997 version with a blue bison, AAA 101 to GLW 999; ALPCA “Plate of the Year” for 1997.',
      { emblems: [{ kind: 'bison', x: 540, y: 44, size: 56, color: '#2a55b0' }] }),
  ],
});

// ── Ontario ──────────────────────────────────────────────────────────────
const ON_EXCLUDE = 'GIOQU';
const ON_LETTERS = without(ON_EXCLUDE);
const ON_GREEN = '#12804a';
const onRefs = [wiki('Ontario'), OVERVIEW];
const ontario = region({
  code: 'ON', name: 'Ontario',
  design: {
    header: 'ONTARIO', headerFace: 'serif', headerWeight: 400, headerSize: 54, headerY: 62, headerSpacing: 2, headerColor: BLUE,
    text: BLUE, serialY: 206, separator: 'crown', separatorSize: 58, frame: BLUE, frameWidth: 3,
    slogan: 'YOURS TO DISCOVER', sloganFace: 'serif', sloganWeight: 400, sloganSize: 26, sloganSpacing: 3, sloganY: 278,
  },
  notes: 'Ontario’s blue-on-white base with the screened crown between the letter and number groups (1997–, reissued 2020 after the blue “A Place to Grow” plate was withdrawn), French-slogan and green-vehicle versions.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger · Yours to Discover', pattern: 'AAAA·999', display: 'ABCD 123', exclude: ON_EXCLUDE, hint: 'no G, I, O, Q or U', example: 'DLPH·458',
      generate: (rng) => `${series(ON_LETTERS, 'CPAA', 'DLPH')(rng)}·${numeric(rng, 1, 999, 3)}`,
      description: `Blue on reflective white with a screened crown separator, “ONTARIO” above and “YOURS TO DISCOVER” below. ABCD-123 since 1997 (AAAA-001 to CLZZ-999, then CPAA-001 on; about DLPH-458 by June 2026). ${ART_NOTE}`,
      references: onRefs, period: [1997, 2026],
    }),
    plate({
      id: 'french', label: 'Tant à découvrir (French slogan)', pattern: 'FAAA·999', display: 'FBCD 123', exclude: ON_EXCLUDE, hint: 'F series, no G, I, O, Q or U', example: 'FAAA·001',
      generate: (rng) => `F${series(ON_LETTERS, 'AAA', 'ABF')(rng)}·${numeric(rng, 1, 999, 3)}`,
      description: `Alternative issue since 2008 with “TANT À DÉCOUVRIR”; the F series has been used exclusively since April 2019 (FAAA-001 to about FABF-787 by November 2025). ${ART_NOTE}`,
      references: onRefs, period: [2008, 2026], design: { slogan: 'TANT À DÉCOUVRIR' },
    }),
    plate({
      id: 'green-vehicle', label: 'Green vehicle', pattern: 'G[VW]AA·999', display: 'GVAB 123', exclude: ON_EXCLUDE, hint: 'GV or GW prefix', example: 'GVAH·823',
      generate: (rng) => `${series(ON_LETTERS, 'VAA', 'WAS')(rng).replace(/^/, 'G')}·${numeric(rng, 1, 999, 3)}`,
      description: `For plug-in hybrid, battery-electric and hydrogen vehicles since 2010: green on white with a white-trillium separator and “GREEN VEHICLE” in place of the slogan (GVAA-001 to about GWAS-853 by April 2026). The small crown at lower right is from reference renderings and unverified. ${ART_NOTE}`,
      references: [...onRefs, { title: 'Ontario Ministry of Transportation · Green licence plate program', url: 'http://www.mto.gov.on.ca/english/vehicles/electric/green-licence-plate.shtml' }],
      period: [2010, 2026],
      design: {
        text: ON_GREEN, headerColor: ON_GREEN, sloganColor: ON_GREEN, frame: ON_GREEN, separator: 'trillium', separatorColor: ON_GREEN, separatorAccent: ON_GREEN, separatorSize: 64,
        slogan: 'GREEN VEHICLE', sloganWeight: 700, sloganSpacing: 1, emblems: [{ kind: 'crown', x: 548, y: 262, size: 34, color: ON_GREEN }],
      },
    }),
    plate({
      id: 'green-vehicle-french', label: 'Véhicule écologique', pattern: 'VEAA·999', display: 'VEAB 123', exclude: ON_EXCLUDE, hint: 'VE prefix', example: 'VEAA·132',
      generate: (rng) => `VE${series(ON_LETTERS, 'AA', 'AC')(rng)}·${numeric(rng, 1, 999, 3)}`,
      description: `French green-vehicle plate, “VÉHICULE ÉCOLOGIQUE” (VEAA-001 to about VEAC-452 by September 2025). ${ART_NOTE}`,
      references: onRefs, period: [2010, 2026],
      design: {
        text: ON_GREEN, headerColor: ON_GREEN, sloganColor: ON_GREEN, frame: ON_GREEN, separator: 'trillium', separatorColor: ON_GREEN, separatorAccent: ON_GREEN, separatorSize: 64,
        slogan: 'VÉHICULE ÉCOLOGIQUE', sloganWeight: 700, sloganSpacing: 1, emblems: [{ kind: 'crown', x: 548, y: 262, size: 34, color: ON_GREEN }],
      },
    }),
    plate({
      id: 'a-place-to-grow-2020', label: 'A Place to Grow (2020, withdrawn)', pattern: 'CMAA·999', display: 'ABCD 123', exclude: ON_EXCLUDE, hint: 'CM series', example: 'CMAA·001',
      generate: (rng) => `CM${series(ON_LETTERS, 'AA', 'MZ')(rng)}·${numeric(rng, 1, 999, 3)}`,
      description: `Flat two-tone blue plate with white lettering, a stylized white-trillium separator and a crown at lower right, issued from February 2020 (CMAA-001 to about CMMZ-349) and scrapped on May 6, 2020 after complaints about night-time legibility. ${ART_NOTE}`,
      references: onRefs, period: [2020, 2020],
      design: {
        bg: ['#3a7bd5', '#153f8a'], header: 'Ontario', headerFace: 'sans', headerWeight: 600, headerSpacing: 1, headerColor: '#ffffff', text: '#ffffff', embossed: false, frame: undefined,
        separator: 'trillium', separatorColor: '#ffffff', separatorAccent: '#ffffff', separatorSize: 60,
        slogan: 'A PLACE TO GROW', sloganFace: 'sans', sloganColor: '#ffffff', emblems: [{ kind: 'crown', x: 548, y: 262, size: 34, color: '#ffffff' }],
      },
    }),
  ],
});

// ── Québec ───────────────────────────────────────────────────────────────
const QC_EXCLUDE = 'IOU';
const QC_GREEN = '#17803d';
const qcRefs = [wiki('Quebec'), OVERVIEW];
const qcBlurb = 'Rear plate only; blue on reflective white with a border line, the Québec flag’s fleur-de-lis box beside “Québec” and “Je me souviens” below.';
const quebec = region({
  code: 'QC', name: 'Québec',
  design: {
    header: 'Québec', headerFace: 'sans', headerWeight: 500, headerSize: 54, headerX: 330, headerY: 66, headerColor: BLUE,
    emblems: [{ kind: 'qc-flag', x: 208, y: 48, size: 42, color: BLUE }],
    text: BLUE, serialY: 208, frame: BLUE, frameWidth: 7,
    slogan: 'Je me souviens', sloganFace: 'sans', sloganWeight: 500, sloganSize: 36, sloganSpacing: 0, sloganY: 276,
  },
  notes: 'Québec passenger plates (rear only since 1979). Letters I, O and U are not used; the current ABC 12D format dates from September 2023.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: 'AAA 99A', display: 'ABC 12D', exclude: QC_EXCLUDE, hint: 'no I, O or U', example: 'BXX 05A',
      generate: (rng) => `${series(without(QC_EXCLUDE), 'AAA', 'BXX')(rng)} ${numeric(rng, 1, 99, 2)}${rng.pick(without(QC_EXCLUDE))}`,
      description: `${qcBlurb} ABC 12D since about September 15, 2023 (AAA 01A to about BXX 05A by August 2026); the source notes that B, D, Q and S are not used as “first letters” in this format, which is ambiguous and not enforced here. ${ART_NOTE}`,
      references: qcRefs, period: [2023, 2026],
    }),
    plate({
      id: 'electric', label: 'Electric vehicle (green)', pattern: 'A99 VAA', display: 'A12 VBC', exclude: QC_EXCLUDE, hint: 'V in the fifth position', example: 'B12 VEA',
      description: `Green on reflective white with an electric-vehicle pictogram at lower left, for hybrid and all-electric vehicles since 2011. Passenger serials began at B12 VEA and continued as C12 VAB; the full issued range is not documented. ${ART_NOTE}`,
      references: [...qcRefs, { title: 'SAAQ · Registering an electric, plug-in hybrid or hydrogen vehicle', url: 'https://saaq.gouv.qc.ca/immatriculation/immatriculer-vehicule/vehicule-electrique-hybride-hydrogene' }],
      period: [2011, 2026],
      design: {
        text: QC_GREEN, headerColor: QC_GREEN, sloganColor: QC_GREEN, frame: QC_GREEN,
        emblems: [{ kind: 'qc-flag', x: 208, y: 48, size: 42, color: QC_GREEN }, { kind: 'ev', x: 56, y: 256, size: 44, color: QC_GREEN }],
      },
    }),
    plate({
      id: '12a-2022', label: '12A BCD (2022–23)', pattern: '99A AAA', display: '12A BCD', exclude: QC_EXCLUDE, hint: 'no I, O or U', example: '99R AHH',
      description: `${qcBlurb} Short-lived 12A BCD series (01A AAA to about 99R AHH), dropped in September 2023 because too many letter combinations were inappropriate. ${ART_NOTE}`,
      references: qcRefs, period: [2022, 2023],
    }),
    plate({
      id: 'b12-2009', label: 'B12 CDE (2009–22)', pattern: '[BDEGHJKMNPQSWXYZ]99 AAA', display: 'B12 CDE', exclude: QC_EXCLUDE, hint: 'first letter not A, C, F, L, R, T or V', example: 'M45 KFB',
      description: `${qcBlurb} Letter-number-number block from September 2009 to December 2022 (B01 AAA to Z99 ZZZ); A, C, F, L, R, T and V were not used as first letters. ${ART_NOTE}`,
      references: qcRefs, period: [2009, 2022],
    }),
    plate({
      id: '123-abc-1996', label: '123 ABC (1996–2009)', pattern: '999 AAA', exclude: QC_EXCLUDE, hint: 'no I, O or U', example: '574 PAB',
      description: `${qcBlurb} Numbers-first series from 1996 to September 2009 (001 AAA to 999 ZZZ). ${ART_NOTE}`,
      references: qcRefs, period: [1996, 2009],
    }),
  ],
});

// ── New Brunswick ────────────────────────────────────────────────────────
const NB_RED = '#c8102e';
const NB_GREEN = '#1f6b3a';
const newBrunswick = region({
  code: 'NB', name: 'New Brunswick',
  design: {
    scene: 'nb-bands',
    emblems: [{ kind: 'galley', x: 300, y: 30, size: 44, color: NB_RED, accent: '#2a78c2' }],
    labels: [
      { text: 'New', x: 270, y: 50, size: 20, face: 'serif', weight: 600, anchor: 'end', color: NB_GREEN },
      { text: 'Nouveau', x: 330, y: 50, size: 20, face: 'serif', weight: 600, anchor: 'start', color: NB_GREEN },
      { text: 'C A N A D A', y: 100, size: 13, face: 'serif', weight: 600, color: NB_GREEN, spacing: 3 },
    ],
    header: 'Brunswick', headerFace: 'serif', headerSize: 40, headerY: 84, headerColor: NB_GREEN, headerSpacing: 0,
    text: NB_RED, serialY: 232, serialSize: 140,
  },
  notes: 'New Brunswick’s 2009 base: red serial below curved gold and sky-blue bands carrying the provincial galley wordmark. Only rear plates since July 2019. C, D, F, H, L, P, S and T series belong to other classes.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: 'AAA 999', example: 'KFR 200',
      generate: (rng) => `${series(ALPHABET, 'JEA', 'KFR')(rng)} ${numeric(rng, 0, 999, 3)}`,
      description: `Embossed red serial on reflective white; the galley wordmark (“New”, “Nouveau”, “Brunswick”, “CANADA”) sits on the bands; no slogan since 2011. JEA 000 to about KFR 200 by November 2024. Letter exclusions are not documented, so any letters are accepted. ${ART_NOTE}`,
      references: [wiki('New Brunswick'), OVERVIEW], period: [2011, 2026],
    }),
    plate({
      id: 'be-in-this-place-2009', label: 'Be… in this place (2009–11)', pattern: 'AAA 999', example: 'GYK 945',
      generate: (rng) => `${series(ALPHABET, 'GXA', 'JDZ', 'H')(rng)} ${numeric(rng, 0, 999, 3)}`,
      description: `The same base with the bilingual slogan “Be… in this place · Être… ici on le peut” in green along the bottom (GXA 000 to JDZ 999). ${ART_NOTE}`,
      references: [wiki('New Brunswick')], period: [2009, 2011],
      design: { slogan: 'Be… in this place  ·  Être… ici on le peut', sloganFace: 'serif', sloganSize: 22, sloganSpacing: 0, sloganColor: NB_GREEN, sloganY: 284 },
    }),
  ],
});

// ── Nova Scotia ──────────────────────────────────────────────────────────
const novaScotia = region({
  code: 'NS', name: 'Nova Scotia',
  design: {
    header: 'NOVA SCOTIA', headerFace: 'sans', headerSize: 42, headerY: 60, headerSpacing: 1, headerColor: BLUE,
    emblems: [{ kind: 'bluenose', x: 300, y: 150, size: 210, color: '#8fbbe3', opacity: 0.55, back: true }],
    text: BLUE, serialY: 212,
    slogan: 'CANADA’S OCEAN PLAYGROUND', sloganFace: 'sans', sloganSize: 22, sloganSpacing: 2, sloganY: 280,
  },
  notes: 'Nova Scotia’s 1989 Bluenose base, simplified in 2011 (no border lines, narrower dies). Letters I, O and Q are not used.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: 'AAA 999', exclude: 'IOQ', hint: 'no I, O or Q', example: 'HTH 021',
      generate: (rng) => `${series(without('IOQ'), 'FAE', 'HTH')(rng)} ${numeric(rng, 1, 999, 3)}`,
      description: `Embossed blue serial on reflective white with a light-blue Bluenose schooner behind it, “NOVA SCOTIA” above and “CANADA’S OCEAN PLAYGROUND” below. The 2011 revision runs FAE 001 to about HTH 021 (May 2026). ${ART_NOTE}`,
      references: [wiki('Nova Scotia'), OVERVIEW], period: [2011, 2026],
    }),
  ],
});

// ── Prince Edward Island ─────────────────────────────────────────────────
const PE_GREEN = '#1d7a3e';
const peiRefs = [wiki('Prince Edward Island'), OVERVIEW, { title: 'Government of PEI · Province unveils new license plates (2022-11-16)', url: 'https://www.princeedwardisland.ca/en/news/province-unveils-new-license-plates' }];
const peiBlurb = 'Green on white with the provincial crest between the number and letter groups, “CANADA” along the bottom and a small national flag at lower left. Issued ranges are not documented; letters are generated without I, O and Q as an assumption.';
const princeEdwardIsland = region({
  code: 'PE', name: 'Prince Edward Island',
  design: {
    header: 'PRINCE EDWARD ISLAND', headerFace: 'block', headerWeight: 600, headerSize: 38, headerY: 58, headerSpacing: 5, headerColor: PE_GREEN,
    text: PE_GREEN, serialY: 208, separator: 'pei-crest', separatorColor: PE_GREEN, separatorSize: 62,
    slogan: 'CANADA', sloganFace: 'block', sloganWeight: 600, sloganSize: 40, sloganSpacing: 10, sloganY: 282, sloganColor: PE_GREEN,
    emblems: [{ kind: 'canada-flag', x: 72, y: 264, size: 48 }],
  },
  notes: 'Prince Edward Island’s November 2022 base in English and French versions.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: '999·AAA', display: '123 ABC', exclude: 'IOQ', example: '123·ABC',
      description: `${peiBlurb} ${ART_NOTE}`, references: peiRefs, period: [2022, 2026],
    }),
    plate({
      id: 'french', label: 'Île-du-Prince-Édouard (French)', pattern: '999·AAA', display: '123 ABC', exclude: 'IOQ', example: '123·ABC',
      description: `Francophone alternative with “ÎLE-DU-PRINCE-ÉDOUARD” at the top. ${peiBlurb} ${ART_NOTE}`,
      references: peiRefs, period: [2022, 2026], design: { header: 'ÎLE-DU-PRINCE-ÉDOUARD', headerSpacing: 3 },
    }),
  ],
});

// ── Newfoundland and Labrador ────────────────────────────────────────────
const NL_EXCLUDE = 'IQUY';
const nlWordmark = (color: string): Partial<CaDesign> => ({
  labels: [
    { text: 'Newfoundland', y: 262, size: 24, face: 'serif', weight: 600, color },
    { text: 'Labrador', y: 288, size: 24, face: 'serif', weight: 600, color },
  ],
});
const newfoundland = region({
  code: 'NL', name: 'Newfoundland and Labrador',
  design: {
    emblems: [{ kind: 'pitcher-plant', x: 300, y: 222, size: 44, color: '#b3261e', accent: '#e0703a' }],
    ...nlWordmark(BLUE),
    text: BLUE, serialY: 192, serialSize: 140,
  },
  notes: 'Newfoundland and Labrador’s pitcher-plant wordmark base (2007–). Letters I, Q, U and Y have not been used since 1985.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: 'AAA 999', exclude: NL_EXCLUDE, hint: 'no I, Q, U or Y', example: 'JXH 941',
      generate: (rng) => `${series(without(NL_EXCLUDE), 'JWZ', 'JXP')(rng)} ${numeric(rng, 1, 999, 3)}`,
      description: `Embossed blue serial on white with the pitcher-plant wordmark at the bottom; the November 2025 printing sets the province name in black (JWZ 001 to about JXP 001 by April 2026). ${ART_NOTE}`,
      references: [wiki('Newfoundland and Labrador'), OVERVIEW], period: [2025, 2026], design: nlWordmark('#111111'),
    }),
    plate({
      id: 'pitcher-plant-2007', label: 'Pitcher plant (2007–25)', pattern: 'AAA 999', exclude: NL_EXCLUDE, hint: 'no I, Q, U or Y', example: 'HMV 001',
      generate: (rng) => `${series(without(NL_EXCLUDE), 'HMV', 'JWX')(rng)} ${numeric(rng, 1, 999, 3)}`,
      description: `Original printing with the wordmark in blue, April 2007 to November 2025 (HMV 001 onward, interrupted in 2022 by the Come Home Year plate). ${ART_NOTE}`,
      references: [wiki('Newfoundland and Labrador')], period: [2007, 2025],
    }),
  ],
});

// ── Yukon ────────────────────────────────────────────────────────────────
const YT_RED = '#c8102e';
const yukon = region({
  code: 'YT', name: 'Yukon',
  design: {
    scene: 'klondike',
    header: 'The Klondike', headerFace: 'serif', headerSize: 34, headerY: 40, headerColor: YT_RED, headerSpacing: 0,
    emblems: [
      { kind: 'diamond', x: 194, y: 29, size: 14, color: YT_RED }, { kind: 'diamond', x: 406, y: 29, size: 14, color: YT_RED },
      { kind: 'prospector', x: 88, y: 146, size: 150 },
    ],
    text: '#111111', serialX: 350, serialWidth: 400, serialY: 206, serialSize: 150, frame: '#111111', frameWidth: 6,
    slogan: 'Yukon', sloganFace: 'serif', sloganItalic: true, sloganSize: 60, sloganSpacing: 0, sloganY: 280, sloganColor: YT_RED, sloganHalo: '#ffffff',
  },
  notes: 'Yukon’s 1990 base: black serial with the screened prospector, “The Klondike” above and red “Yukon” on a sky-blue band.',
  formats: [
    plate({
      id: 'standard', label: 'Standard passenger', pattern: '[ABEHJKLMNOPRSTVWXZ]AA99', display: 'ABC12', exclude: 'IQUY', hint: 'no I, Q, U or Y; first letter not C, D, F or G', example: 'KAA04',
      generate: (rng) => `${series(without('IQUY'), 'AAA', 'KAA', 'CDFG')(rng)}${numeric(rng, 1, 99, 2)}`,
      description: `Black on reflective white with a border line, prospector panning for gold at left, “The Klondike” at top and red “Yukon” on a sky-blue band. Serials run AAA01 to about KAA04 (July 2026); I, Q, U and Y are unused and C, D, F and G are not first letters. ${ART_NOTE}`,
      references: [wiki('Yukon'), OVERVIEW], period: [1990, 2026],
    }),
  ],
});

// ── Northwest Territories ────────────────────────────────────────────────
const bear: Partial<CaDesign> = {
  shape: 'polar-bear', text: BLUE, frame: BLUE, frameWidth: 7, serialX: 282, serialWidth: 400, serialSize: 116, serialY: 190,
  headerFace: 'block', headerSize: 38, headerX: 280, headerY: 88, headerSpacing: 4, headerColor: BLUE, headerWidth: 400,
  slogan: 'NORTHWEST TERRITORIES', sloganFace: 'block', sloganSize: 32, sloganX: 280, sloganY: 226, sloganSpacing: 4, sloganColor: BLUE, sloganWidth: 420,
};
const ntRefs = [
  wiki('the Northwest Territories'), OVERVIEW,
  { title: 'GNWT Gazette · May 2013, plate specimen p. 173 (PDF p. 47)', url: 'https://www.justice.gov.nt.ca/fr/fichiers/gazette-des-tno/2013/05_2.pdf#page=47' },
  { title: 'Spectacular NWT · The story behind our iconic polar bear plates', url: 'https://spectacularnwt.com/story/the-story-behind-our-beloved-iconic-polar-bear-plates/' },
];
const northwestTerritories = region({
  code: 'NT', name: 'Northwest Territories',
  design: {
    ...bear, bearProfile: 'nwt-reference', bearMounts: 'round', frameWidth: 2.4,
    text: '#174f6b', frame: '#174f6b', serialX: 257, serialY: 195.5, serialSize: 145.2, serialWidth: 410,
    sloganX: 258, sloganY: 230, sloganSize: 36, sloganWidth: 371, sloganSpacing: 2.8, sloganColor: '#174f6b',
    header: 'SPECTACULAR', headerX: 220.5, headerY: 78, headerSize: 46, headerWidth: 252, headerSpacing: 1.2, headerColor: '#174f6b', scene: 'nt-spectacular',
  },
  notes: 'The polar-bear-shaped plate (1970–, a registered trademark of the GNWT): the 1986 “Explore Canada’s Arctic” blue-on-white bear and the 2010 “Spectacular” update. Only rear plates since 1993.',
  formats: [
    plate({
      id: 'standard', label: 'Polar bear · Spectacular (2010)', pattern: '999999', display: '123456', example: '331758',
      generate: (rng) => String(rng.int(300000, 379999)),
      description: `Aluminum bear-shaped plate with the slogan “Spectacular”, rolled out July 1, 2010 (300000 to about 378949 by November 2024). The supplied Pale aurora over a rocky ridge artwork is positioned to align the left trees and right bear with the official design illustration. Colours and artwork remain approximate. ${ART_NOTE}`,
      references: ntRefs, period: [2010, 2026], status: 'uncertain',
    }),
    plate({
      id: 'explore-1986', label: 'Polar bear · Explore Canada’s Arctic (1986–2010)', pattern: '999999', display: '1–999999, no leading zero', example: '125419',
      check: /^[1-9]\d{0,5}$/, generate: (rng) => String(rng.int(1, 126000)),
      description: `Steel bear-shaped plate, blue on white, “EXPLORE CANADA’S ARCTIC” above the serial and “NORTHWEST TERRITORIES” below (1 to about 126000). ${ART_NOTE}`,
      references: ntRefs, period: [1986, 2010], design: {
        header: 'EXPLORE CANADA’S ARCTIC', headerSize: 38, headerSpacing: 3, headerX: 260, headerY: 74, headerWidth: 450,
        scene: undefined, bg: ['#ffffff', '#f4f6f9'], bearMounts: 'slotted', frameWidth: 3,
      },
    }),
  ],
});

// ── Nunavut ──────────────────────────────────────────────────────────────
const nuRefs = [wiki('Nunavut'), OVERVIEW];
const nunavut = region({
  code: 'NU', name: 'Nunavut',
  design: {
    ...bear, facing: 'left', frame: '#f2c230', frameWidth: 9, scene: undefined, slogan: undefined,
    serialX: 318, serialY: 208, serialSize: 124,
    header: 'Nunavut', headerFace: 'sans', headerSize: 42, headerSpacing: 0, headerX: 256, headerY: 92, headerWidth: 160,
    labels: [{ text: 'ᓄᓇᕗᑦ', x: 346, y: 92, size: 36, face: 'syllabics', anchor: 'start', color: BLUE, maxWidth: 120 }],
    emblems: [{ kind: 'star', x: 505, y: 72, size: 28, color: BLUE }],
    separator: 'inuksuk', separatorColor: BLUE, separatorAccent: BLUE, separatorSize: 70,
  },
  notes: 'Nunavut returned to the polar-bear shape in August 2025 (bear facing left, yellow border). The 2012–2025 rectangular night-scene plate is also included.',
  formats: [
    plate({
      id: 'standard', label: 'Polar bear (2025)', pattern: '999·999', display: '123 456', example: '017·363',
      generate: (rng) => `017·${numeric(rng, 300, 499, 3)}`,
      description: `Bear-shaped plate from August 2025: embossed blue serial with an inuksuk separating the number groups, yellow border line, blue star at top right and “Nunavut” with ᓄᓇᕗᑦ at the top (about 017 300 to 017 363 by September 2025). Described only in secondary sources; layout approximate. ${ART_NOTE}`,
      references: [...nuRefs, { title: 'Nunatsiaq News · Polar bear licence plates coming back to Nunavut (2024-11-08)', url: 'https://nunatsiaq.com/stories/article/polar-bear-licence-plates-coming-back-to-nunavut/' }],
      period: [2025, 2026], status: 'uncertain',
    }),
    plate({
      id: 'night-scene-2012', label: 'Night scene (2012–25)', pattern: '999 999', display: '123 456', example: '017 300',
      generate: (rng) => `0${numeric(rng, 0, 17, 2)} ${numeric(rng, 1, 999, 3)}`,
      description: `Rectangular contest-winning design by Ron Froese, July 2012: screened black serial over a night scene with a polar bear, an inuksuk, three bands of northern lights (the three regions) and 25 stars (the communities); “Nunavut” and ᓄᓇᕗᑦ at the bottom (000 001 to about 017 300). ${ART_NOTE}`,
      references: nuRefs, period: [2012, 2025],
      design: {
        shape: 'rect', scene: 'arctic-night', frame: undefined, header: undefined, separator: undefined, embossed: false,
        text: '#111111', serialX: 388, serialY: 190, serialSize: 116, serialWidth: 300, serialHalo: '#ffffff', holes: 'four',
        emblems: [
          { kind: 'polar-bear', x: 118, y: 222, size: 220, color: '#ffffff', accent: '#8a94a6', back: true },
          { kind: 'inuksuk', x: 566, y: 226, size: 70, color: '#4a4a55', accent: '#2a2a33', back: true },
        ],
        labels: [
          { text: 'Nunavut', x: 392, y: 284, size: 32, face: 'serif', anchor: 'end', color: '#111111' },
          { text: 'ᓄᓇᕗᑦ', x: 406, y: 284, size: 28, face: 'syllabics', anchor: 'start', color: '#111111' },
        ],
      },
    }),
  ],
});

/** Registration order follows the usual west-to-east listing, territories last. */
export const canadianProvinces: Region[] = [
  alberta, saskatchewan, manitoba, ontario, quebec, newBrunswick, novaScotia, princeEdwardIsland, newfoundland,
  yukon, northwestTerritories, nunavut,
];
