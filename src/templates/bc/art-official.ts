/**
 * Artwork for the B.C. official, amateur-radio and ceremonial plates: maple
 * leaves, crowns, arms and crests, and the event logos (APEC 1997, Expo 86,
 * the 1994 Royal Visit badge). All are simplified flat vectors drawn from the
 * BCpl8s photographs: recognisable at plate size, not official artwork.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { registerArtwork } from './art';
import {vancouverCentennialArtwork, VANCOUVER_CENTENNIAL_VIEWBOX} from './vancouver-centennial';
import { totemEmblemSymbol } from './totem-emblem';

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
  const stripes = Array.from({ length: 9 }, (_, i) => n('rect', { x: 0, y: 17 + i * 4.2, width: 120, height: 1.6, fill: '#8fb3dc' }));
  return [
    ...stripes,
    n('ellipse', { cx: 60, cy: 35, rx: 46, ry: 33, fill: '#1a64b0', stroke: WHITE, strokeWidth: 1 }),
    n('path', { d: 'M22 20 C30 10 44 8 50 16 C46 22 40 22 36 30 C30 34 24 30 22 20 Z', fill: '#6cbf3c' }),
    n('path', { d: 'M30 44 C36 40 44 42 44 50 C40 56 32 54 30 44 Z', fill: '#6cbf3c' }),
    n('path', { d: 'M70 8 C84 6 98 14 100 24 C92 28 86 26 84 34 C88 44 84 56 78 62 C74 54 76 44 72 38 C74 30 66 24 70 8 Z', fill: '#6cbf3c' }),
    ...[-30, -15, 0, 15, 30].map((dx) => n('ellipse', { cx: 60, cy: 35, rx: Math.abs(dx) * 1.5 || 0.1, ry: 33, fill: 'none', stroke: WHITE, strokeWidth: 0.6 })),
    ...[15, 25, 45, 55].map((y) => n('path', { d: `M${60 - 46 * Math.sqrt(1 - ((y - 35) / 33) ** 2)} ${y} H${60 + 46 * Math.sqrt(1 - ((y - 35) / 33) ** 2)}`, stroke: WHITE, strokeWidth: 0.6 })),
    n('path', { d: 'M14 35 H106', stroke: WHITE, strokeWidth: 0.6 }),
    n('text', { x: 60, y: 40.5, fill: WHITE, fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: 14, textAnchor: 'middle', letterSpacing: 1 }, 'APEC'),
  ];
}
/** The APEC sticker on the 1997 military CANADA plates, 70 × 60. */
function apecSticker(): SvgNode[] {
  return [
    n('rect', { width: 70, height: 60, fill: '#fbfbf8' }),
    place(4, 8, 62 / 120, ...apecGlobe()),
    n('text', { x: 35, y: 54, fill: '#333', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 7, textAnchor: 'middle' }, 'CANADA 1997'),
  ];
}
/** Federal "Canada's Year of Asia Pacific" mark, 40 × 36: jagged red leaf edge over teal swooshes. */
function yearOfAsiaPacific(): SvgNode[] {
  return [
    n('path', { d: 'M14 20 L18 10 L21 14 L24 4 L27 12 L31 8 L30 16 L37 14 L32 22', fill: 'none', stroke: '#d0202e', strokeWidth: 2.2, strokeLinejoin: 'miter' }),
    ...[0, 1, 2].map((i) => n('path', { d: `M3 ${24 + i * 4} Q14 ${16 + i * 4} 30 ${24 + i * 4}`, fill: 'none', stroke: '#2a8fa5', strokeWidth: 1.8 })),
  ];
}
/** B.C. "Pacific Gateway" welcome symbol, 36 × 44: a blue gate framing six coloured tiles. */
function pacificGateway(): SvgNode[] {
  const tiles: Array<[number, number, string]> = [[9, 10, '#f2c230'], [19, 10, '#3a73c0'], [9, 19, '#3f9a45'], [19, 19, '#4fa0d8'], [9, 28, '#1f8a8a'], [19, 28, '#d12f2f']];
  return [
    n('path', { d: 'M1 3 Q18 0 35 3 L34 8 H2 Z', fill: '#1d3f8f' }),
    n('rect', { x: 4, y: 8, width: 4, height: 36, fill: '#1d3f8f' }),
    n('rect', { x: 28, y: 8, width: 4, height: 36, fill: '#1d3f8f' }),
    ...tiles.map(([x, y, fill]) => n('rect', { x, y, width: 8.5, height: 8, fill })),
    leaf(21, 29.5, 5, WHITE),
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

/** 1994 Royal Visit badge, 100 × 100: yellow disc, red leaf points, crown and E II R cypher. */
function royalVisit1994(): SvgNode[] {
  return [
    leaf(-2, -2, 104, '#e2402e'),
    n('circle', { cx: 50, cy: 52, r: 38, fill: '#f6c21c' }),
    n('path', { d: 'M50 16 L56 34 L70 26 L64 44 L84 44 L64 58 L50 52 L36 58 L16 44 L36 44 L30 26 L44 34 Z', fill: '#ec8a2a', opacity: 0.65 }),
    place(38, 22, 0.4, ...crown('#d9302a', '#f6c21c')),
    n('text', { x: 50, y: 78, fill: '#d9302a', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 32, textAnchor: 'middle' }, 'E  R'),
    n('text', { x: 50, y: 70, fill: '#d9302a', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 11, textAnchor: 'middle' }, 'II'),
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

/** Die-cut polar-bear outline (NWT pavilion plates), 300 × 150: white field, blue embossed border. */
function polarBear(): SvgNode[] {
  const d = 'M14 58 C12 32 40 16 80 18 C120 14 170 10 214 18 C230 20 238 14 252 18 L262 26 C276 26 284 34 288 44 C294 52 290 60 278 58 L270 62 C262 72 250 72 246 80 C248 100 250 120 246 134 C244 142 236 144 226 144 L212 144 L208 124 L194 122 L192 140 C190 146 182 147 170 147 L160 147 L158 128 L108 130 L104 142 C100 147 92 148 80 148 L68 148 L70 128 L52 124 L46 142 C42 148 34 148 24 148 L14 148 C10 120 18 90 14 58 Z';
  return [n('path', { d, fill: '#fdfbf5' }), n('path', { d, fill: 'none', stroke: '#3262bc', strokeWidth: 3.5, transform: 'translate(150 83) scale(0.965) translate(-150 -83)' })];
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
registerArtwork('official-lg-crest', { viewBox: [100, 100], draw: lgCrest });
registerArtwork('official-apec', { viewBox: [120, 70], draw: apecGlobe });
registerArtwork('official-apec-sticker', { viewBox: [70, 60], draw: apecSticker });
registerArtwork('official-asia-pacific', { viewBox: [40, 36], draw: yearOfAsiaPacific });
registerArtwork('official-pacific-gateway', { viewBox: [36, 44], draw: pacificGateway });
registerArtwork('official-expo86', { viewBox: [225, 70], draw: expo86 });
registerArtwork('official-royal-visit-1994', { viewBox: [100, 100], draw: royalVisit1994 });
registerArtwork('official-victoria-seal', { viewBox: [40, 40], draw: victoriaSeal });
registerArtwork('official-polar-bear', { viewBox: [300, 150], draw: polarBear, aspect: 'stretch' });
registerArtwork('official-vancouver-100', { viewBox: VANCOUVER_CENTENNIAL_VIEWBOX, draw: vancouverCentennialArtwork });
registerArtwork('official-totem', { viewBox: [960, 925], draw: totem });
