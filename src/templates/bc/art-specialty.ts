/**
 * Artwork for the B.C. specialty and consular plates: flat vector stand-ins for
 * the photo-printed BC Parks, Olympic and Veteran backgrounds and the small
 * emblems (Olympic emblem, poppy, Memorial Cross, touring car, dogwood, logos).
 * Shapes and colours are read from BCpl8s photographs (hex values from
 * research/specialty.json); they are simplified reconstructions, not the
 * official image files.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { registerArtwork } from './art';
import { PROTOTYPE_CAR, PROTOTYPE_CAR_BOX, VINTAGE_CAR, VINTAGE_CAR_BOX, type CarElement } from './vintage-cars';

type Pt = readonly [number, number];
const poly = (pts: readonly Pt[], fill: string, extra: Record<string, string | number> = {}) =>
  n('path', { d: `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} Z`, fill, ...extra });
const rect = (x: number, y: number, width: number, height: number, fill: string, extra: Record<string, string | number> = {}) =>
  n('rect', { x, y, width, height, fill, ...extra });
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra: Record<string, string | number> = {}) =>
  n('ellipse', { cx, cy, rx, ry, fill, ...extra });
/** Deterministic scatter (no Math.random: renders must be stable). */
const scatter = (count: number, seed: number, box: [number, number, number, number]): Pt[] =>
  Array.from({ length: count }, (_, i) => {
    const a = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453, b = Math.sin((i + 1) * 39.3468 + seed * 11.135) * 24634.6345;
    return [+(box[0] + (a - Math.floor(a)) * box[2]).toFixed(1), +(box[1] + (b - Math.floor(b)) * box[3]).toFixed(1)] as const;
  });

// ── BC Parks (2017): three photo backgrounds, 300 × 150 ─────────────────────

/** Kermode meadow: blurred olive forest above, yellow-green grass with wildflowers below. */
function parksMeadow(): SvgNode[] {
  return [
    rect(0, 0, 300, 150, '#8fb040'),
    n('path', { d: 'M0 0 H300 V66 C260 72 220 60 180 68 C140 74 100 62 60 70 C35 74 15 68 0 70 Z', fill: '#777442' }),
    ...scatter(14, 1, [0, 0, 300, 55]).map(([x, y], i) => ellipse(x, y, 14 + (i % 4) * 4, 9 + (i % 3) * 3, i % 3 ? '#6a6934' : '#a7a060', { opacity: 0.8 })),
    // Pale birch trunks in the blurred forest.
    ...[168, 178, 190].map((x, i) => rect(x, 0, 3 - i * 0.5, 60 - i * 6, '#c9c28c', { opacity: 0.7 })),
    n('path', { d: 'M0 88 C60 80 140 92 210 84 C250 80 280 86 300 84 V104 C230 110 150 98 80 106 C40 110 15 104 0 108 Z', fill: '#a4c45d', opacity: 0.8 }),
    n('path', { d: 'M0 118 C20 112 40 122 60 150 H0 Z', fill: '#525634' }),
    ...scatter(46, 2, [60, 108, 240, 40]).map(([x, y]) => n('circle', { cx: x, cy: y, r: 1.1, fill: '#e4d364' })),
  ];
}
/** The Kermode ("spirit") bear Molly: cream head and chest, facing the viewer. 60 × 120; head centre at (30, 30). */
function kermodeBear(): SvgNode[] {
  const eye = '#3a2a20';
  return [
    n('path', { d: 'M0 120 C0 92 4 64 14 44 H46 C56 64 60 92 60 120 Z', fill: '#cba77d' }),
    n('path', { d: 'M0 120 C0 92 4 64 14 44 H20 C14 70 10 96 12 120 Z', fill: '#b08a5c' }),
    n('path', { d: 'M20 56 C24 80 36 80 40 56 Z', fill: '#d8c8a8' }),
    n('circle', { cx: 14, cy: 13, r: 6.5, fill: '#cba77d' }), n('circle', { cx: 46, cy: 13, r: 6.5, fill: '#cba77d' }),
    n('circle', { cx: 14, cy: 13, r: 3, fill: '#9c7a52' }), n('circle', { cx: 46, cy: 13, r: 3, fill: '#9c7a52' }),
    ellipse(30, 31, 18, 21, '#d8c8a8'),
    ellipse(17, 36, 5, 10, '#cba77d', { opacity: 0.8 }), ellipse(43, 36, 5, 10, '#cba77d', { opacity: 0.8 }),
    ellipse(30, 42, 8.5, 7, '#eadfc6'),
    n('circle', { cx: 23, cy: 28, r: 2, fill: eye }), n('circle', { cx: 37, cy: 28, r: 2, fill: eye }),
    ellipse(30, 39, 4.2, 3, eye),
    n('path', { d: 'M30 42 V45 M26.5 46 Q30 48.5 33.5 46', stroke: eye, strokeWidth: 0.9, fill: 'none', strokeLinecap: 'round' }),
  ];
}
/** Purcell Mountains: jagged snow peaks with dark-blue shadow faces under a pink-to-peach sky. */
function parksPurcell(): SvgNode[] {
  const peaks: Pt[] = [[0, 70], [8, 60], [14, 64], [22, 48], [28, 55], [36, 44], [44, 58], [52, 52], [62, 70], [74, 66], [86, 84], [100, 80], [112, 92], [130, 88], [146, 94], [166, 86], [184, 92], [198, 80], [210, 84], [222, 70], [232, 76], [244, 64], [256, 72], [268, 62], [280, 70], [292, 66], [300, 70], [300, 150], [0, 150]];
  const shade = (pts: Pt[], fill: string) => poly(pts, fill);
  return [
    rect(0, 0, 300, 150, '#dea486'),
    rect(0, 0, 300, 34, '#ddb2bb'), rect(0, 34, 300, 22, '#e1aa9f'),
    poly([[150, 96], [190, 70], [230, 58], [270, 52], [300, 58], [300, 100]], '#b9a4c4'),
    poly(peaks, '#e8ecf6'),
    // Shadow facets on the left faces of each peak.
    shade([[22, 48], [10, 76], [4, 96], [18, 88], [20, 70]], '#1e428a'),
    shade([[36, 44], [26, 64], [22, 90], [34, 80], [34, 60]], '#2664a3'),
    shade([[52, 52], [44, 70], [40, 94], [52, 78]], '#1e428a'),
    shade([[8, 60], [0, 72], [0, 100], [6, 80]], '#2664a3'),
    shade([[74, 66], [64, 86], [60, 104], [74, 90]], '#2664a3'),
    shade([[166, 86], [154, 104], [164, 108]], '#2664a3'),
    shade([[222, 70], [210, 94], [206, 112], [220, 96]], '#1e428a'),
    shade([[244, 64], [234, 86], [232, 104], [244, 90]], '#2664a3'),
    shade([[268, 62], [258, 84], [256, 100], [268, 86]], '#1e428a'),
    shade([[292, 66], [284, 84], [290, 96]], '#2664a3'),
    n('path', { d: 'M0 118 C60 108 120 124 180 114 C230 106 270 118 300 112 V150 H0 Z', fill: '#c8d4ea' }),
  ];
}
/** Porteau Cove at sunset: blue-to-cream sky, sunlit wooded headland at left, mauve hills, golden water. */
function parksPorteau(): SvgNode[] {
  // Sky: bands stepping diagonally from blue (upper left) to cream (right) stand in for the gradient.
  const sky = ['#5a95c9', '#7aa8cf', '#9dbcd4', '#bfcfd6', '#d8d9d4'].map((fill, i) => poly([[0, 0], [150 + i * 45, 0], [0, 40 + i * 22]], fill)).reverse();
  const canopy: [number, number, number][] = [[6, 50, 14], [22, 44, 13], [38, 46, 12], [52, 52, 12], [66, 60, 11], [80, 70, 10], [94, 80, 9], [106, 92, 8], [12, 70, 14], [34, 68, 14], [56, 74, 12], [76, 86, 10], [92, 96, 8]];
  return [
    rect(0, 0, 300, 150, '#e9dfd6'), ...sky,
    n('circle', { cx: 280, cy: 72, r: 34, fill: '#efe8c8', opacity: 0.9 }),
    n('path', { d: 'M96 110 C120 88 150 78 180 84 C200 76 230 68 262 82 C280 78 292 82 300 86 V110 Z', fill: '#cfab91' }),
    n('path', { d: 'M130 110 C160 98 196 96 222 102 C246 96 272 100 292 106 V112 H130 Z', fill: '#b09080' }),
    poly([[282, 112], [288, 88], [300, 84], [300, 114]], '#4a3a28'),
    // Sunlit wooded headland at left, sloping down to the water.
    n('path', { d: 'M0 112 V60 L120 112 Z', fill: '#6f6a1c' }),
    ...canopy.map(([cx, cy, r], i) => n('circle', { cx, cy, r, fill: i % 3 === 1 ? '#c2b640' : '#a0a030' })),
    ...[[10, 38], [28, 33], [46, 36], [64, 46]].map(([x, y]) => poly([[x - 4, y + 13], [x, y], [x + 4, y + 13]], '#7c8420')),
    n('path', { d: 'M0 106 C40 102 90 104 124 112 H0 Z', fill: '#5a5418' }),
    rect(0, 111, 300, 39, '#c1a683'),
    ...[[130, 118, 170], [180, 126, 120], [200, 136, 100], [60, 130, 60], [220, 114, 80]].map(([x, y, w]) => rect(x, y, w, 2.2, '#ebe299', { opacity: 0.85 })),
    rect(174, 113, 20, 1.6, '#4a3a28'),
  ];
}

// ── 2010 Olympic base: Mount Garibaldi, the B.C. logo and the Vancouver 2010 emblem ──

/** Mount Garibaldi under a blue sky, 300 × 150. */
function garibaldi(): SvgNode[] {
  const ridge: Pt[] = [[0, 68], [30, 60], [60, 54], [90, 50], [112, 58], [140, 60], [170, 50], [196, 38], [214, 30], [226, 24], [240, 32], [262, 44], [282, 52], [300, 58], [300, 150], [0, 150]];
  return [
    rect(0, 0, 300, 150, '#53a7d5'), rect(0, 0, 300, 30, '#1193c8'), rect(0, 30, 300, 16, '#2f9dd0'),
    poly(ridge, '#e5e8ec'),
    poly([[90, 50], [70, 76], [60, 100], [80, 90], [96, 70]], '#97bbe1'),
    poly([[226, 24], [206, 52], [196, 80], [212, 72], [222, 50]], '#738ba9'),
    poly([[214, 30], [196, 38], [170, 50], [160, 70], [186, 60], [204, 52]], '#97bbe1'),
    poly([[262, 44], [248, 70], [256, 90], [266, 64]], '#97bbe1'),
    poly([[30, 60], [16, 84], [26, 96], [34, 76]], '#97bbe1'),
    poly([[140, 60], [124, 88], [134, 100], [146, 76]], '#b8cde6'),
    n('path', { d: 'M0 112 C70 100 140 118 210 106 C250 100 280 106 300 104 V150 H0 Z', fill: '#f2f4f7' }),
  ];
}
/** Vancouver 2010 emblem on its white panel: the Ilanaaq inukshuk, "vancouver 2010" and the rings, 36 × 52. */
function olympicEmblem(): SvgNode[] {
  const ring = (cx: number, cy: number, stroke: string) => n('circle', { cx, cy, r: 3, fill: 'none', stroke, strokeWidth: 0.8 });
  return [
    rect(0, 0, 36, 52, '#ffffff', { rx: 2 }),
    // Inukshuk: head, arm slab, torso, and two legs joined by an arch.
    rect(15, 4, 6, 5, '#2e9b48', { rx: 0.6 }),
    n('path', { d: 'M5 11 L31 9.5 L32 13.5 L6 15 Z', fill: '#1976d2' }),
    rect(12, 16, 12, 5, '#00a7c8', { rx: 0.6 }),
    n('path', { d: 'M10 22 H26 V33 H21 V27.5 A3 3 0 0 0 15 27.5 V33 H10 Z', fill: '#e53935' }),
    rect(10, 29, 5, 4, '#fbc02d'),
    n('text', { x: 18, y: 38.5, fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif', fontSize: 3.4, fill: '#3a3a3a', textAnchor: 'middle', textLength: 28, lengthAdjust: 'spacing' }, 'vancouver 2010'),
    ring(11, 43.5, '#0081c8'), ring(18, 43.5, '#000000'), ring(25, 43.5, '#ee334e'), ring(14.5, 46.5, '#fcb131'), ring(21.5, 46.5, '#00a651'),
  ];
}

// ── Veteran (2004) and Memorial Cross (2016) ───────────────────────────────

/** National War Memorial figures: helmeted soldiers in dark bronze on a pale stone base, 60 × 130. */
function warMemorial(): SvgNode[] {
  const bronze = '#0e1817', mid = '#2c3a3a';
  const helmet = (cx: number, cy: number) => n('g', {}, n('path', { d: `M${cx - 9} ${cy} Q${cx} ${cy - 10} ${cx + 9} ${cy} Z`, fill: bronze }), n('path', { d: `M${cx - 5} ${cy - 3} Q${cx} ${cy - 7} ${cx + 4} ${cy - 4}`, stroke: '#6d7b7a', strokeWidth: 1, fill: 'none' }));
  return [
    // Rear figure with a raised rifle.
    n('path', { d: 'M6 128 V40 C6 30 12 24 20 26 C24 34 22 48 24 60 L20 128 Z', fill: mid }),
    rect(9, 6, 2.2, 36, mid, { transform: 'rotate(-12 10 24)' }),
    helmet(16, 26),
    // Middle figure.
    n('path', { d: 'M16 128 L18 50 C18 36 26 30 34 32 C42 36 40 52 42 70 L38 128 Z', fill: bronze }),
    helmet(31, 30), ellipse(31, 34, 5, 5.5, mid),
    // Front figure striding right.
    n('path', { d: 'M30 128 L34 88 C32 70 34 48 40 42 C48 38 54 44 54 56 C56 70 52 84 50 92 L56 124 L50 126 L44 100 L40 128 Z', fill: bronze }),
    helmet(46, 38), ellipse(46, 42, 4.6, 5, mid),
    n('path', { d: 'M40 58 C48 62 54 70 58 76', stroke: mid, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' }),
    // Stone base.
    n('path', { d: 'M0 122 C20 118 44 120 62 126 V130 H0 Z', fill: '#d9dcd8' }),
  ];
}
/** Remembrance poppy: four rounded red petals and a black centre, 20 × 20. */
function poppy(): SvgNode[] {
  return [
    ...[[7, 6.5], [13.5, 6], [14, 13.5], [6.5, 13.5]].map(([cx, cy]) => n('circle', { cx, cy, r: 5.6, fill: '#ea1702' })),
    n('circle', { cx: 10, cy: 10, r: 3.2, fill: '#111111' }),
  ];
}
/** Flag of Canada, 40 × 20, with a simplified eleven-point maple leaf. */
function canadaFlag(): SvgNode[] {
  const leaf = 'M20 3 L21.4 6 L23 5.4 L22.4 9.4 L25 7 L25.6 8.6 L28 8.2 L27 11 L28.4 11.8 L24.2 15 L24.6 16.4 L20.5 15.8 L20.5 18.5 L19.5 18.5 L19.5 15.8 L15.4 16.4 L15.8 15 L11.6 11.8 L13 11 L12 8.2 L14.4 8.6 L15 7 L17.6 9.4 L17 5.4 L18.6 6 Z';
  return [rect(0, 0, 40, 20, '#ffffff'), rect(0, 0, 10, 20, '#d52b1e'), rect(30, 0, 10, 20, '#d52b1e'), n('path', { d: leaf, fill: '#d52b1e' }),
    rect(0, 0, 40, 20, 'none', { stroke: '#b9b9b9', strokeWidth: 0.4 })];
}
/** Memorial Cross: a silver cross with flared arms over a laurel ring, crown above and a central ER cypher, 60 × 80. */
function memorialCross(): SvgNode[] {
  const silver = '#9c988c', light = '#c4c0b4', dark = '#4e4b44';
  const edge = { stroke: dark, strokeWidth: 0.9, strokeLinejoin: 'round' as const };
  return [
    n('circle', { cx: 30, cy: 46, r: 17, fill: 'none', stroke: silver, strokeWidth: 4.5 }),
    n('circle', { cx: 30, cy: 46, r: 17, fill: 'none', stroke: dark, strokeWidth: 0.6, strokeDasharray: '2 1.6' }),
    // Cross pattée: four flared arms meeting at the centre.
    n('path', { d: 'M21 13 H39 L35 41 L56 37 V55 L35 51 L39 79 H21 L25 51 L4 55 V37 L25 41 Z', fill: silver, ...edge }),
    n('path', { d: 'M24 16 H30 V76 H24 Z M7 40 H30 V46 H7 Z', fill: light, opacity: 0.7 }),
    rect(24, 41, 12, 10, light, { stroke: dark, strokeWidth: 0.7 }),
    n('text', { x: 30, y: 48.6, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 6, fill: dark, textAnchor: 'middle' }, 'ER'),
    // Crown on the upper arm.
    n('path', { d: 'M24 13 L23 5 L26.5 8 L30 3 L33.5 8 L37 5 L36 13 Z', fill: light, ...edge }),
  ];
}

// ── Collector, Antique, Personalized ───────────────────────────────────────

/** Collector plates' wavy separator, 20 × 8, drawn in currentColor. */
function tilde(): SvgNode[] {
  return [n('path', { d: 'M1.5 5.2 C4 1.4 7.5 1.6 10 4 S16 6.6 18.5 2.8', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' })];
}
/** VINTAGE plate touring car (flat silhouette, facing right) in currentColor; the hub style changed between 1961 and 2500. */
function vintageCar(hubs: keyof typeof VINTAGE_CAR): () => SvgNode[] {
  const [x, y] = VINTAGE_CAR_BOX;
  return () => [n('g', { transform: `translate(${-x} ${-y})`, fill: 'currentColor', fillRule: 'evenodd' }, ...VINTAGE_CAR[hubs].map((d) => n('path', { d })))];
}
/** The detailed three-quarter touring car of the Prototype 91 plate. */
function prototypeCar(): SvgNode[] {
  const build = ([tag, attrs, kids = []]: CarElement): SvgNode => n(tag, attrs, ...kids.map(build));
  return PROTOTYPE_CAR.map(build);
}
/** Pacific dogwood outline (personalized plates' ocean band), 20 × 20, white. */
function dogwood(): SvgNode[] {
  const petal = (deg: number) => n('path', { d: 'M10 10 C6 7 6 2 9 1.4 L10 3 L11 1.4 C14 2 14 7 10 10 Z', fill: 'none', stroke: '#ffffff', strokeWidth: 1.1, strokeLinejoin: 'round', transform: `rotate(${deg} 10 10)` });
  return [...[0, 90, 180, 270].map(petal), ...[[9.2, 9.2], [10.8, 9.2], [9.2, 10.8], [10.8, 10.8], [10, 10]].map(([cx, cy]) => n('circle', { cx, cy, r: 0.8, fill: '#ffffff' }))];
}
/** Mountain-ocean graphic of the personalized base, 300 × 150: toothed mountain band above, wavy ocean band below. */
function personalizedGraphic(mountain: string, ocean: string, mirrored: boolean): () => SvgNode[] {
  return () => {
    const teeth: Pt[] = [[4, 5], [296, 5], [296, 30], [288, 20], [280, 38], [272, 22], [262, 34], [252, 24], [244, 42], [234, 26], [224, 36], [214, 22], [204, 40], [194, 26], [184, 34], [174, 24], [164, 44], [154, 28], [144, 36], [134, 24], [124, 40], [114, 26], [104, 34], [94, 22], [84, 42], [74, 28], [64, 36], [54, 24], [44, 40], [34, 26], [24, 34], [14, 22], [4, 36]];
    const snow: Pt[] = [[62, 20], [70, 8], [76, 13], [84, 4], [94, 15], [104, 9], [116, 20]];
    const waves = Array.from({ length: 6 }, () => "q24.33 -7 48.67 0").join(' ');
    return [
      n('g', mirrored ? { transform: 'translate(300 0) scale(-1 1)' } : {},
        poly(teeth, mountain),
        poly([...snow, [116, 22], [62, 22]], '#ffffff'),
        n('path', { d: `M${snow.map(([x, y]) => `${x} ${y}`).join(' L')}`, fill: 'none', stroke: '#8a9aa0', strokeWidth: 0.7, strokeLinejoin: 'round' })),
      n('path', { d: `M4 114 ${waves} V146 H4 Z`, fill: ocean }),
      n('path', { d: `M4 108 ${waves}`, fill: 'none', stroke: ocean, strokeWidth: 1.4 }),
    ];
  };
}

registerArtwork('bc-parks-meadow', { viewBox: [300, 150], draw: parksMeadow, aspect: 'stretch' });
registerArtwork('bc-parks-kermode-bear', { viewBox: [60, 120], draw: kermodeBear });
registerArtwork('bc-parks-purcell', { viewBox: [300, 150], draw: parksPurcell, aspect: 'stretch' });
registerArtwork('bc-parks-porteau', { viewBox: [300, 150], draw: parksPorteau, aspect: 'stretch' });
registerArtwork('bc-olympic-garibaldi', { viewBox: [300, 150], draw: garibaldi, aspect: 'stretch' });
registerArtwork('bc-olympic-emblem', { viewBox: [36, 52], draw: olympicEmblem });
registerArtwork('bc-war-memorial', { viewBox: [60, 130], draw: warMemorial });
registerArtwork('bc-poppy', { viewBox: [20, 20], draw: poppy });
registerArtwork('canada-flag', { viewBox: [40, 20], draw: canadaFlag });
registerArtwork('bc-memorial-cross', { viewBox: [60, 80], draw: memorialCross });
registerArtwork('bc-collector-tilde', { viewBox: [20, 8], draw: tilde, aspect: 'stretch' });
registerArtwork('bc-vintage-car-solid-hubs', { viewBox: [VINTAGE_CAR_BOX[2], VINTAGE_CAR_BOX[3]], draw: vintageCar('solidHubs') });
registerArtwork('bc-vintage-car-open-hubs', { viewBox: [VINTAGE_CAR_BOX[2], VINTAGE_CAR_BOX[3]], draw: vintageCar('openHubs') });
registerArtwork('bc-vintage-car-prototype', { viewBox: [PROTOTYPE_CAR_BOX[2], PROTOTYPE_CAR_BOX[3]], draw: prototypeCar });
registerArtwork('bc-dogwood', { viewBox: [20, 20], draw: dogwood });
/** Personalized graphic colourways: plate maker eras and the black-printed SAMPLE. */
export const PERSONALIZED_GRAPHICS = {
  acme: ['#2a7a60', '#10192a', false], astro: ['#31b9a5', '#1c2a55', false], reversed: ['#31b9a5', '#1c2a55', true],
  waldale: ['#3aa39a', '#2b56b0', false], sample: ['#1a1a1a', '#1a1a1a', false],
} as const;
for (const [key, [mountain, ocean, mirrored]] of Object.entries(PERSONALIZED_GRAPHICS)) {
  registerArtwork(`bc-personalized-${key}`, { viewBox: [300, 150], draw: personalizedGraphic(mountain, ocean, mirrored), aspect: 'stretch' });
}
