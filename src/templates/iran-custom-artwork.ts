/**
 * Flat, hand-authored illustrations of the public artwork visible in the supplied
 * Iran references. These are visual studies, not official logo masters, certified
 * tracings or security features. No photograph, complete plate or remote image is
 * embedded. See docs/research/iran-customizer/artwork.md for the inspected sources.
 */
export interface IranArtworkResult { markup: string; warnings: string[] }
export type IranZoneArtworkId = 'anzali' | 'aras' | 'arvand' | 'kish' | 'maku' | 'chabahar' | 'qeshm';

interface ArtworkMaster {
  label: string;
  width: number;
  height: number;
  sourceUrl: string;
  /** `ink` changes coloured/outline marks; white separators remain white. */
  draw: (ink?: string) => string;
}

const wiki = (hash: string, name: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${hash}/Pelake_MAT_${name}.png/250px-Pelake_MAT_${name}.png`;
const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;

/** All seven distinct pre-2017 zone drawings; the names and serials belong to the scene. */
const ZONES: Record<IranZoneArtworkId, ArtworkMaster> = {
  anzali: {
    label: 'Anzali', width: 120, height: 86,
    sourceUrl: wiki('d/d5', 'Anzali'),
    draw: ink => [
      // A gold central form between separate dark-blue and cyan wave ribbons.
      path('M27 34C31 22 45 17 58 23L102 42V57C102 72 92 79 80 75L27 57Z', ink ?? '#ffbf00'),
      path('M26 28C33 5 51 6 66 12L91 23C102 28 111 28 119 21C114 32 104 38 93 34L59 20C45 15 35 17 26 28Z', ink ?? '#002975', 'stroke="#ffffff" stroke-width="0.7" stroke-linejoin="round"'),
      path('M1 74C9 55 24 53 40 60L73 74C86 80 95 78 105 73C97 85 85 88 72 83L37 68C21 61 12 65 1 74Z', ink ?? '#00a5df', 'stroke="#ffffff" stroke-width="0.7" stroke-linejoin="round"'),
    ].join(''),
  },
  aras: {
    label: 'Aras', width: 100, height: 100,
    sourceUrl: wiki('c/cf', 'Aras'),
    draw: ink => [
      // The triangle is genuinely divided by an open blue-background sweep.
      path('M49 2L75 52C55 46 39 45 25 46Z', ink ?? '#087c48'),
      path('M22 58C43 55 66 59 83 65L98 98H2Z', ink ?? '#087c48'),
      path('M6 52C34 45 70 52 96 65C64 55 40 51 6 53Z', ink ?? '#f4cd00'),
    ].join(''),
  },
  arvand: {
    label: 'Arvand', width: 100, height: 92,
    sourceUrl: wiki('3/3c', 'Arvand'),
    draw: ink => [
      path('M1 1H62L37 27V91H1Z', ink ?? '#009ace'),
      path('M62 1H99V91H37L62 65Z', ink ?? '#f3442e'),
      path('M37 27L62 1V65L37 91Z', '#ffffff'),
    ].join(''),
  },
  kish: {
    label: 'Kish', width: 100, height: 100,
    sourceUrl: wiki('6/66', 'Kish'),
    draw: ink => [
      // Open spiral and broad wave gap are negative space, not blue paint.
      path('M2 58C0 26 21 2 49 2C69 2 85 11 94 26C76 18 63 29 63 43C63 56 75 60 83 54C87 50 90 43 88 36C99 44 98 62 87 67C75 73 61 64 46 61C28 56 13 52 2 58Z', ink ?? '#ffffff'),
      path('M7 70C22 62 37 66 55 71C72 76 87 81 98 58C96 82 76 99 51 99C31 99 15 88 7 70Z', ink ?? '#ffffff'),
    ].join(''),
  },
  maku: {
    label: 'Maku', width: 110, height: 104,
    sourceUrl: wiki('2/2f', 'MAKU'),
    draw: ink => [
      // Circular field, a gold lower lobe, and the tapering, winding white route.
      path('M95 15C104 24 108 30 101 39C92 49 91 48 91 57C91 82 73 102 48 102C22 102 2 82 2 55C2 28 23 7 49 7C67 7 73 15 82 10L110 1C99 6 92 10 95 15Z', ink ?? '#064376'),
      path('M3 49C33 46 68 43 76 31C79 26 75 22 78 16C83 7 94 4 108 2C90 10 85 15 90 22C96 31 84 41 68 47C49 55 23 61 3 63Z', ink ?? '#f6a400'),
      path('M21 88C45 77 73 64 92 48C96 76 77 102 49 102C37 102 28 97 21 88Z', ink ?? '#f6a400'),
      path('M3 60C30 55 66 48 83 34C91 27 84 22 85 17C86 9 98 4 109 2C97 8 91 13 94 18C102 27 92 39 76 47C53 60 26 66 5 73Z', '#ffffff'),
    ].join(''),
  },
  chabahar: {
    label: 'Chabahar', width: 70, height: 110,
    sourceUrl: wiki('2/2c', 'Chabahar'),
    draw: ink => `<g fill="none" stroke="${ink ?? '#ffffff'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">` + [
      // Inspected small line emblem: tall curved sail, inset loop and two water lines.
      '<path d="M42 3C23 11 10 40 12 64C13 77 23 85 36 84C50 84 59 75 59 61V48H34C27 51 21 57 21 65C21 73 28 77 36 76C46 75 43 65 37 59L28 51C32 42 37 36 46 34Z"/>',
      '<path d="M14 82C7 82 4 85 5 91C18 86 27 95 39 93C48 93 52 87 61 88C66 88 68 91 68 95L58 96"/>',
      '<path d="M5 93L4 106C12 100 20 104 31 105C43 107 54 102 59 98C47 97 42 102 31 99C20 96 13 93 5 98"/>',
      '</g>',
    ].join(''),
  },
  qeshm: {
    label: 'Qeshm', width: 100, height: 100,
    sourceUrl: wiki('8/89', 'Qeshm'),
    draw: ink => [
      // Orange disk split into caps around two blue waves, with open white seams.
      path('M5 32C12 12 30 1 50 1C71 1 89 14 96 32Z', ink ?? '#ff3d00'),
      path('M4 68H96C89 88 72 100 50 100C28 100 12 88 4 68Z', ink ?? '#ff3d00'),
      path('M2 39C13 42 17 34 29 36C42 39 45 42 55 38C65 34 71 35 80 38C86 40 94 39 98 39L99 49C88 51 82 48 75 46C64 43 60 47 50 49C40 52 34 45 23 46C15 47 10 50 1 49Z', ink ?? '#001eca'),
      path('M1 54C12 55 17 50 26 50C37 50 40 56 50 54C62 51 66 49 77 52C86 55 91 56 99 54L97 63C87 65 81 61 74 60C63 58 58 63 50 64C39 64 34 58 24 59C15 60 9 63 3 61Z', ink ?? '#001eca'),
    ].join(''),
  },
};

export const IRAN_ZONE_ARTWORK_SOURCES = Object.freeze(Object.entries(ZONES).map(([id, master]) => ({
  id: id as IranZoneArtworkId, label: master.label, url: master.sourceUrl,
  status: 'reference-study' as const,
})));

const n = (value: number) => String(Number(value.toFixed(6)));
function validBox(x: number, y: number, width: number, height: number): boolean {
  return [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0;
}
function place(markup: string, naturalWidth: number, naturalHeight: number, x: number, y: number, width: number, height: number): string {
  const scale = Math.min(width / naturalWidth, height / naturalHeight);
  return `<g transform="translate(${n(x + (width - naturalWidth * scale) / 2)} ${n(y + (height - naturalHeight * scale) / 2)}) scale(${n(scale)})">${markup}</g>`;
}

/**
 * Uniformly fit one zone's emblem in the supplied box. By default, retain source
 * colours. Optional ink is an explicit colour customization; white separators
 * stay white and unpainted gaps stay transparent. Unknown IDs render no emblem.
 */
export function renderIranZoneEmblem(zoneId: string, x: number, y: number, width: number, height: number, ink?: string): IranArtworkResult {
  const id = zoneId.trim().toLowerCase();
  if (!Object.hasOwn(ZONES, id)) return { markup: '', warnings: ['No source-guided emblem is available for this free zone; no generic replacement was drawn.'] };
  if (!validBox(x, y, width, height)) return { markup: '', warnings: ['The free-zone emblem needs a finite, positive drawing box.'] };
  const master = ZONES[id as IranZoneArtworkId];
  const warnings = [`${master.label} emblem: hand-authored outline approximation of the Wikipedia plate diagram, not a certified logo master. Source artwork rights are separate.`];
  const safeInk = ink === undefined ? undefined : /^(?:#[\da-f]{3}|#[\da-f]{6}|currentColor)$/i.test(ink) ? ink : undefined;
  if (ink !== undefined && safeInk === undefined) warnings.push('Invalid emblem ink was ignored; the reference-study palette was retained.');
  else if (safeInk !== undefined) warnings.push('Emblem ink is a user colour customization, not the reference palette.');
  return {
    markup: `<g data-role="free-zone-emblem" data-zone="${id}" data-artwork-provenance="source-guided-approximation"><title>${master.label} free-zone emblem, visual approximation</title>${place(master.draw(safeInk), master.width, master.height, x, y, width, height)}</g>`,
    warnings,
  };
}

export const IRAN_HISTORIC_ARTWORK_SOURCE = {
  label: 'Historic-vehicle plate diagram with Bagh-e Melli photograph',
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Pelak_melie_tarikhi.png/250px-Pelak_melie_tarikhi.png',
  status: 'reference-study' as const,
};

/**
 * The reference's inset photograph was inspected at its actual pixel resolution.
 * This deliberately simplified facade is original flat geometry: stepped central
 * tower, three portals, paired columns and blue/tan architectural accents. Fine
 * tilework, lettering, heraldry and photographic scene detail are not invented.
 */
const HISTORIC_FACADE = [
  '<rect width="180" height="130" fill="#c8dce8"/>',
  // Receding side wings and a flat ground line, without photographic textures.
  path('M0 63H13V54H27V63H41V52H57V70H125V57H140V60H157V44H173V49H180V130H0Z', '#c7b08d'),
  path('M0 70H23V75H53V70H126V74H156V62H180V130H0Z', '#a79070'),
  // Main facade: two flanking bays and raised centre.
  path('M13 76H60V62H66V28H116V62H123V76H167V129H13Z', '#c6b18c'),
  path('M65 30H117V37H65Z M60 64H122V70H60Z M10 75H169V81H10Z', '#6f7775'),
  path('M69 24H113V29H69Z M74 17H110V24H74Z M90 10H94V18H90Z', '#b4a990'),
  path('M77 18H83V22H77Z M87 18H93V22H87Z M98 18H105V22H98Z', '#444e51'),
  // Upper, narrow central window and pilasters.
  path('M84 60V43C84 38 90 35 91 34C93 36 99 39 99 43V60Z', '#737b7a'),
  path('M89 60V44C89 41 91 39 92 39C94 41 95 43 95 45V60Z', '#b7d0d7'),
  path('M72 36H78V64H72Z M105 36H111V64H105Z', '#e0c59b'),
  path('M80 38H83V62H80Z M100 38H103V62H100Z', '#8a907e'),
  // Three arched doorways. The centre is wider and higher, as in the source.
  path('M69 128V93C69 83 78 77 91 72C104 77 114 83 114 93V128Z', '#4c514d'),
  path('M74 128V94C74 86 81 81 91 77C101 82 109 86 109 94V128Z', '#c1ac87'),
  path('M78 128V96C78 90 84 84 91 82C98 85 105 90 105 96V128Z', '#515655'),
  path('M79 103H104V126H79Z', '#c7d6d2'),
  path('M79 120H104V128H79Z', '#54756b'),
  path('M79 98H104V102H79Z', '#d5c4a5'),
  path('M24 129V100C24 94 30 90 34 88C40 91 45 95 45 100V129Z M135 129V100C135 94 141 90 146 88C151 91 157 95 157 100V129Z', '#4d534f'),
  path('M28 129V102C28 98 32 94 35 94C38 96 41 99 41 102V129Z M139 129V102C139 98 143 94 146 94C149 96 153 99 153 102V129Z', '#696858'),
  // Long columns and cornices stay legible at the plate's small inset size.
  path('M14 82H20V129H14Z M50 82H56V129H50Z M61 71H67V129H61Z M116 71H122V129H116Z M127 82H133V129H127Z M161 82H167V129H161Z', '#e4c797'),
  path('M20 83H23V128H20Z M56 82H59V128H56Z M123 81H126V128H123Z M158 83H161V128H158Z', '#777567'),
  path('M26 84H46V87H26Z M136 84H156V87H136Z M67 65H115V68H67Z', '#58878b'),
  path('M0 128H180V130H0Z', '#748477'),
].join('');

export function renderIranHistoricArtwork(x: number, y: number, width: number, height: number): IranArtworkResult {
  if (!validBox(x, y, width, height)) return { markup: '', warnings: ['The historic-vehicle illustration needs a finite, positive drawing box.'] };
  return {
    markup: `<g data-role="historic-vehicle-artwork" data-artwork="bagh-e-melli" data-artwork-provenance="source-guided-approximation"><title>Bagh-e Melli gateway, simplified flat reference study</title>${place(HISTORIC_FACADE, 180, 130, x, y, width, height)}</g>`,
    warnings: ['Bagh-e Melli artwork: simplified flat illustration guided by the small photograph in the Wikipedia historic-vehicle plate diagram. Architectural details and colours are approximate; this is not the original photograph or an official artwork master. Source artwork rights are separate.'],
  };
}
