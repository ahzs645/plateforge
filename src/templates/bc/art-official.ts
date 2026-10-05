/**
 * Artwork for the B.C. official, amateur-radio and ceremonial plates: maple
 * leaves, crowns, arms and crests, and the event logos (APEC 1997, Expo 86,
 * the 1994 Royal Visit badge). Supplied vector reconstructions are used where
 * available; other marks are simplified geometry based on BCpl8s photographs.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { registerArtwork } from './art';
import {vancouverCentennialArtwork, VANCOUVER_CENTENNIAL_VIEWBOX} from './vancouver-centennial';
import { totemEmblemSymbol } from './totem-emblem';
import { NWT_POLAR_BEAR_PATH, NWT_POLAR_BEAR_BORDER_PATH } from '../shapes/nwt-polar-bear';
import royalCanadaArmsUrl from './assets/royal-canada-arms.png';
import {apecGlobeArtwork, APEC_GLOBE_VIEWBOX} from './apec-globe';
import {asiaPacificArtwork, ASIA_PACIFIC_VIEWBOX, pacificGatewayArtwork, PACIFIC_GATEWAY_VIEWBOX, royal1994Artwork, ROYAL_1994_VIEWBOX} from './supplied-event-emblems';
import {suppliedGovernorCrest, suppliedEdwardCrown, solidGovernorArms} from './supplied-governor-artwork';
import {CREST_BOX} from './crest';

const GOLD = '#c9a646', RED = '#c8202e', BLUE = '#1f3f8f', WHITE = '#ffffff';

/** 11-point maple leaf in a 40 × 40 box. */
const LEAF = 'M20 1 L23 8 L27 6 L25.5 16 L31 10 L33 14 L38.5 12.5 L35.5 20 L37.5 22 L29 28.5 L30.5 32 L21 30.5 L21 39 L19 39 L19 30.5 L9.5 32 L11 28.5 L2.5 22 L4.5 20 L1.5 12.5 L7 14 L9 10 L14.5 16 L13 6 L17 8 Z';
const leaf = (x: number, y: number, size: number, fill: string, extra: Record<string, string | number> = {}): SvgNode =>
  n('path', { d: LEAF, fill, transform: `translate(${x} ${y}) scale(${size / 40})`, ...extra });

/** St Edward's crown in a 60 × 50 box: jewelled band, rim crosses and fleurs, two dipped arches, orb and cross. */
function crown(fill: string, jewel = RED): SvgNode[] {
  const shade = { fill: 'none', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 0.8 };
  return [
    n('path', { d: 'M13 36 C12 26 20 21 30 23 C40 21 48 26 47 36 Z', fill, opacity: 0.85 }),
    n('path', { d: 'M10 37 C8 22 20 12 30 21 C40 12 52 22 50 37', fill: 'none', stroke: fill, strokeWidth: 4.5, strokeLinecap: 'round' }),
    n('path', { d: 'M10 37 C8 22 20 12 30 21 C40 12 52 22 50 37', ...shade }),
    ...[10, 30, 50].map((x) => n('path', { d: `M${x - 3} 36 h6 v-3 h-2 v-2 h-2 v2 h-2 Z`, fill })),
    ...[20, 40].map((x) => n('path', { d: `M${x} 30 C${x - 3} 32 ${x - 3} 35 ${x} 36 C${x + 3} 35 ${x + 3} 32 ${x} 30 Z`, fill })),
    n('rect', { x: 8, y: 36, width: 44, height: 10, rx: 1.5, fill }),
    n('rect', { x: 8, y: 36, width: 44, height: 10, rx: 1.5, ...shade }),
    n('circle', { cx: 30, cy: 14, r: 4, fill }),
    n('rect', { x: 29, y: 2, width: 2, height: 9, fill }),
    n('rect', { x: 26.5, y: 4.5, width: 7, height: 2, fill }),
    ...[16, 30, 44].map((cx) => n('circle', { cx, cy: 41, r: 2, fill: jewel })),
    ...[23, 37].map((cx) => n('rect', { x: cx - 1.6, y: 39.4, width: 3.2, height: 3.2, fill: jewel, transform: `rotate(45 ${cx} 41)` })),
  ];
}

/** Shield of British Columbia in a 40 × 48 box: Union chief with a crown, sun setting over wavy bars. */
function bcShield(): SvgNode[] {
  const waves = [0, 1, 2].map((i) => {
    const y = 30 + i * 5, inset = 1 + i * 3.4;
    const pts = Array.from({ length: 21 }, (_, k) => { const x = inset + ((40 - 2 * inset) * k) / 20; return `${x.toFixed(2)} ${(y + 1.1 * Math.sin(x * 0.9)).toFixed(2)}`; });
    return n('path', { d: `M${pts.join(' L')}`, fill: 'none', stroke: BLUE, strokeWidth: 2.2 });
  });
  return [
    n('path', { d: 'M0 0 H40 V26 C40 38 31 44 20 48 C9 44 0 38 0 26 Z', fill: WHITE, stroke: GOLD, strokeWidth: 1.2 }),
    n('rect', { width: 40, height: 16, fill: BLUE }),
    n('path', { d: 'M0 0 L40 16 M40 0 L0 16', stroke: WHITE, strokeWidth: 3 }),
    n('path', { d: 'M0 0 L40 16 M40 0 L0 16', stroke: RED, strokeWidth: 1.1 }),
    n('path', { d: 'M20 0 V16 M0 8 H40', stroke: WHITE, strokeWidth: 5 }),
    n('path', { d: 'M20 0 V16 M0 8 H40', stroke: RED, strokeWidth: 2.8 }),
    n('path', { d: 'M17 9.5 l0.8 -3 1.4 1.2 0.8 -2 0.8 2 1.4 -1.2 0.8 3 Z', fill: GOLD }),
    ...Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI * (0.1 + (0.8 * i) / 8);
      return n('path', { d: `M${20 - Math.cos(a) * 6} ${26 - Math.sin(a) * 6} L${20 - Math.cos(a) * 9.5} ${26 - Math.sin(a) * 9.5}`, stroke: GOLD, strokeWidth: 1.1 });
    }),
    n('path', { d: 'M14.5 26 A5.5 5.5 0 0 1 25.5 26 Z', fill: GOLD }),
    ...waves,
    n('path', { d: 'M0 0 H40 V26 C40 38 31 44 20 48 C9 44 0 38 0 26 Z', fill: 'none', stroke: GOLD, strokeWidth: 1.2 }),
  ];
}
const place = (x: number, y: number, scale: number, ...children: SvgNode[]): SvgNode => n('g', { transform: `translate(${x} ${y}) scale(${scale})` }, ...children);

/** Lieutenant Governor's crest, 100 × 100: gold-rimmed blue disc, ten gold leaves, shield and crown. */
function lgCrest(): SvgNode[] {
  // Ten leaves round the sides and foot; the crown takes the top.
  const leaves = Array.from({ length: 10 }, (_, i) => {
    const a = ((-48 + (276 * i) / 9) * Math.PI) / 180;
    return leaf(50 + Math.cos(a) * 37 - 5, 51 + Math.sin(a) * 37 - 5, 10, GOLD);
  });
  return [
    n('circle', { cx: 50, cy: 50, r: 49, fill: '#b9a46a' }),
    n('circle', { cx: 50, cy: 50, r: 46, fill: '#2f307a' }),
    ...leaves,
    place(35, 32, 0.75, ...bcShield()),
    place(39, 14, 0.37, ...crown('#d9b84a')),
  ];
}

/** Royal Arms of Canada as on the 1951 tour plate, 100 × 90: crown, lion, unicorn, shield, scroll. */
function canadaArms(): SvgNode[] {
  const gold = { fill: '#d0b25c', stroke: '#6b5520', strokeWidth: 0.6 };
  return [
    place(38, 0, 0.4, ...crown('#d7b95a')),
    n('path', { d: 'M40 22 C40 17 60 17 60 22 Z', ...gold }),
    // Lion (gold, left) and unicorn (white, right).
    n('path', { d: 'M34 66 C22 60 16 46 20 34 C18 30 20 24 26 24 C31 24 33 29 31 33 C36 38 37 50 35 58 Z', ...gold }),
    n('path', { d: 'M66 66 C78 60 84 46 80 34 C83 30 82 24 76 23 L80 14 L74 22 C69 23 67 29 69 33 C64 38 63 50 65 58 Z', fill: '#f3f0e6', stroke: '#6b5520', strokeWidth: 0.6 }),
    // Shield: quartered (England, Scotland, Ireland, France) over Canadian leaves.
    n('path', { d: 'M36 24 H64 V50 C64 60 56 66 50 68 C44 66 36 60 36 50 Z', fill: '#f3f0e6', stroke: '#6b5520', strokeWidth: 0.8 }),
    n('rect', { x: 36, y: 24, width: 14, height: 13, fill: '#b3202a' }),
    n('rect', { x: 50, y: 24, width: 14, height: 13, fill: '#d6b650' }),
    n('rect', { x: 36, y: 37, width: 14, height: 13, fill: '#1f4f9a' }),
    n('rect', { x: 50, y: 37, width: 14, height: 13, fill: '#1f4f9a' }),
    leaf(44.5, 52, 11, '#b3202a'),
    n('path', { d: 'M24 72 Q50 82 76 72 L78 78 Q50 88 22 78 Z', fill: '#1f3a6a', stroke: '#d0b25c', strokeWidth: 0.8 }),
  ];
}

/** APEC 1997 globe, 120 × 70: blue oval with green continents, white grid and lettering, pinstripe wings. */
function apecGlobe(): SvgNode[] {
  return apecGlobeArtwork();
}
/** The APEC sticker on the 1997 military CANADA plates, 70 × 60. */
function apecSticker(): SvgNode[] {
  return [
    n('rect', { width: 70, height: 60, fill: '#fbfbf8' }),
    place(4, 8, 62 / APEC_GLOBE_VIEWBOX[0], ...apecGlobe()),
    n('text', { x: 35, y: 54, fill: '#333', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 7, textAnchor: 'middle' }, 'CANADA 1997'),
  ];
}
/** Expo 86 wordmark, 225 × 70, heavy geometric letters in currentColor. */
function expo86(): SvgNode[] {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 14, strokeLinejoin: 'round' as const };
  return [
    n('path', { d: 'M31 7 H8 V63 H31 M8 35 H27', ...s }),
    n('path', { d: 'M39 7 L71 63 M71 7 L39 63', ...s, strokeLinecap: 'butt' }),
    n('path', { d: 'M82 66 V7 H94 A14 14 0 0 1 94 35 H82', ...s }),
    n('circle', { cx: 135, cy: 35, r: 24, ...s }),
    n('circle', { cx: 181, cy: 20, r: 10, ...s, strokeWidth: 11 }),
    n('circle', { cx: 181, cy: 48, r: 14, ...s, strokeWidth: 12 }),
    n('circle', { cx: 207, cy: 48, r: 14, ...s, strokeWidth: 12 }),
    n('path', { d: 'M193 46 C193 22 205 8 222 8', ...s, strokeWidth: 12 }),
  ];
}

/** City of Victoria seal on the 1913 hired-vehicle porcelain, 40 × 40, line art in currentColor. */
function victoriaSeal(): SvgNode[] {
  const line = { fill: 'none', stroke: 'currentColor' };
  return [
    n('circle', { cx: 20, cy: 20, r: 19, ...line, strokeWidth: 1.4 }),
    n('circle', { cx: 20, cy: 20, r: 13, ...line, strokeWidth: 0.8 }),
    ...Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return n('circle', { cx: 20 + Math.cos(a) * 16, cy: 20 + Math.sin(a) * 16, r: 0.8, fill: 'currentColor' }); }),
    n('path', { d: 'M14 12 H26 V21 C26 26 22 28 20 29 C18 28 14 26 14 21 Z', ...line, strokeWidth: 1 }),
    n('path', { d: 'M14 17 H26 M20 12 V29', ...line, strokeWidth: 0.7 }),
  ];
}

/** Shared NWT reconstruction: independent cut silhouette and inset border. */
function polarBear(): SvgNode[] {
  return [n('path', { d: NWT_POLAR_BEAR_PATH, fill: '#fdfbf5', 'data-role': 'cut-silhouette' }),
    n('path', { d: NWT_POLAR_BEAR_BORDER_PATH, fill: 'none', stroke: '#3262bc', strokeWidth: 3, 'data-role': 'inset-border' })];
}

/** Vancouver centennial "100" mark, 180 × 90: outline 1 and 00 with a green skyline and blue water lines. */
/** Totem-and-leaf emblem of the 1952 base (the shared passenger master, wrapped as artwork). */
function totem(): SvgNode[] {
  const symbol = totemEmblemSymbol('official-totem-art');
  return [n('g', { transform: 'translate(-20 -10)' }, ...symbol.children as SvgNode[])];
}

registerArtwork('official-maple-leaf', { viewBox: [40, 40], draw: () => [leaf(0, 0, 40, '#d52b1e')] });
registerArtwork('official-crown', { viewBox: [60, 50], draw: () => crown('#d4b04a', '#9a1b20') });
registerArtwork('official-canada-arms', { viewBox: [100, 90], draw: canadaArms });
registerArtwork('royal-canada-arms-supplied', { viewBox: [1096, 1435], accuracy: 'supplied-image',
  draw: () => [n('image', {href: royalCanadaArmsUrl, width: 1096, height: 1435, preserveAspectRatio: 'xMidYMid meet', 'data-source': 'user-supplied-isolated-canadian-coat-of-arms'})] });
registerArtwork('official-lg-crest', { viewBox: [100, 100], draw: lgCrest });
registerArtwork('official-lg-crest-supplied', {viewBox: [150, 150], draw: suppliedGovernorCrest});
registerArtwork('official-lg-arms-solid', {viewBox: [CREST_BOX[0], CREST_BOX[1]], draw: solidGovernorArms, aspect: 'stretch'});
registerArtwork('official-edward-crown-supplied', {viewBox: [170.69903, 150.46991], draw: suppliedEdwardCrown});
registerArtwork('official-apec', { viewBox: APEC_GLOBE_VIEWBOX, draw: apecGlobe });
registerArtwork('official-apec-sticker', { viewBox: [70, 60], draw: apecSticker });
registerArtwork('official-asia-pacific', { viewBox: ASIA_PACIFIC_VIEWBOX, draw: asiaPacificArtwork });
registerArtwork('official-pacific-gateway', { viewBox: PACIFIC_GATEWAY_VIEWBOX, draw: pacificGatewayArtwork });
registerArtwork('official-expo86', { viewBox: [225, 70], draw: expo86 });
registerArtwork('official-royal-visit-1994', { viewBox: ROYAL_1994_VIEWBOX, draw: royal1994Artwork });
registerArtwork('official-victoria-seal', { viewBox: [40, 40], draw: victoriaSeal });
registerArtwork('official-polar-bear', { viewBox: [600, 300], draw: polarBear });
registerArtwork('official-vancouver-100', { viewBox: VANCOUVER_CENTENNIAL_VIEWBOX, draw: vancouverCentennialArtwork });
registerArtwork('official-totem', { viewBox: [960, 925], draw: totem });
