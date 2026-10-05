/**
 * Artwork for the B.C. specialty and consular plates: supplied photo backgrounds for
 * BC Parks, the 2010 Olympic and the Veteran plates, and the small
 * emblems (Olympic emblem, poppy, Memorial Cross, touring car, dogwood, logos).
 * Shapes and colours are read from BCpl8s photographs (hex values from
 * research/specialty.json); they are simplified reconstructions, not the
 * official image files.
 */
import parksKermodeUrl from '../../assets/bc-parks/kermode-bear.jpg';
import parksPorteauUrl from '../../assets/bc-parks/porteau-cove.jpg';
import parksPurcellUrl from '../../assets/bc-parks/purcell-mountains.jpg';
import olympicGaribaldiUrl from '../../assets/bc-olympic/garibaldi.jpg';
import veteranMemorialUrl from '../../assets/bc-veteran/war-memorial.jpg';
import veteranPoppyUrl from '../../assets/bc-veteran/poppy.png';
import memorialCrossUrl from '../../assets/bc-memorial/memorial-cross.webp';
import { node as n, type SvgNode } from '../svg-scene';
import { registerArtwork, type ArtMaster } from './art';
import { OLYMPIC_2010_BOX, OLYMPIC_2010_PATHS } from './olympic-emblem';
import { PERSONALIZED_BANNER, PERSONALIZED_BRITISH, PERSONALIZED_COLUMBIA, PERSONALIZED_DOGWOOD, PERSONALIZED_FRAME, PERSONALIZED_MOUNTAINS, PERSONALIZED_STRIPE } from './personalized-art';
import { PROTOTYPE_CAR, PROTOTYPE_CAR_BOX, VINTAGE_CAR, VINTAGE_CAR_BOX, type CarElement } from './vintage-cars';

const rect = (x: number, y: number, width: number, height: number, fill: string, extra: Record<string, string | number> = {}) =>
  n('rect', { x, y, width, height, fill, ...extra });

// ── BC Parks (2017): three photo backgrounds, 300 × 150 ─────────────────────

/** A supplied 2:1 photo covering a plate face of the given size (cropped, never distorted). It is a linked asset (kept out of the JS bundle); the SVG and PNG
 * exporters inline it as a data URI so downloads stay self-contained. */
const platePhoto = (href: string, part: string, width = 300, height = 150, align = 'xMidYMid'): ArtMaster => ({ viewBox: [width, height], aspect: 'stretch',
  draw: () => [n('image', { href, x: 0, y: 0, width, height, preserveAspectRatio: `${align} slice`, 'data-part': part })] });

/** Vancouver 2010 emblem (supplied vector) centred on its white panel, 36 × 52. */
function olympicEmblem(): SvgNode[] {
  const [w, h] = OLYMPIC_2010_BOX, pad = 2.5, k = (36 - 2 * pad) / w;
  return [
    rect(0, 0, 36, 52, '#ffffff', { rx: 2 }),
    n('g', { transform: `translate(${pad} ${((52 - h * k) / 2).toFixed(2)}) scale(${k.toFixed(5)})`, 'data-part': 'vancouver-2010' },
      ...OLYMPIC_2010_PATHS.map(([fill, d]) => n('path', { d, fill }))),
  ];
}

// ── Veteran (2004) and Memorial Cross (2016) ───────────────────────────────

/** Remembrance poppy (supplied raster with transparency), 480 × 445. */
const poppyImage: ArtMaster = { viewBox: [480, 445], draw: () => [n('image', { href: veteranPoppyUrl, x: 0, y: 0, width: 480, height: 445, 'data-part': 'poppy' })] };
/** Flag of Canada, 40 × 20, with a simplified eleven-point maple leaf. */
function canadaFlag(): SvgNode[] {
  const leaf = 'M20 3 L21.4 6 L23 5.4 L22.4 9.4 L25 7 L25.6 8.6 L28 8.2 L27 11 L28.4 11.8 L24.2 15 L24.6 16.4 L20.5 15.8 L20.5 18.5 L19.5 18.5 L19.5 15.8 L15.4 16.4 L15.8 15 L11.6 11.8 L13 11 L12 8.2 L14.4 8.6 L15 7 L17.6 9.4 L17 5.4 L18.6 6 Z';
  return [rect(0, 0, 40, 20, '#ffffff'), rect(0, 0, 10, 20, '#d52b1e'), rect(30, 0, 10, 20, '#d52b1e'), n('path', { d: leaf, fill: '#d52b1e' }),
    rect(0, 0, 40, 20, 'none', { stroke: '#b9b9b9', strokeWidth: 0.4 })];
}
/** Memorial Cross (supplied transparent image of the silver cross, suspension removed), 460 × 445. */
const memorialCrossImage: ArtMaster = { viewBox: [460, 445], draw: () => [n('image', { href: memorialCrossUrl, x: 0, y: 0, width: 460, height: 445, 'data-part': 'memorial-cross' })] };

// ── Collector, Antique, Personalized ───────────────────────────────────────

/** Collector plates' filled wave, 20 × 8, with the sheared ends visible on B00~000. */
function tilde(): SvgNode[] {
  return [n('path', { d: 'M0 3 C4 -.3 7 -.2 10 1.3 C14 3.3 17 3.5 20 .8 V5.3 C17 7.7 14 7.6 10 5.8 C6 4.1 3 4 0 7 Z',
    fill: 'currentColor', 'data-part': 'collector-wave' })];
}
/** VINTAGE plate touring car (flat silhouette, facing right) in currentColor; the hub style changed between 1961 and 2500. */
function vintageCar(hubs: keyof typeof VINTAGE_CAR): () => SvgNode[] {
  const [x, y] = VINTAGE_CAR_BOX;
  return () => [n('g', { transform: `translate(${-x} ${-y})`, fill: 'currentColor', fillRule: 'evenodd' }, ...VINTAGE_CAR[hubs].map((d) => n('path', { d })))];
}
/** The detailed three-quarter touring car of the Prototype 91 plate. */
function prototypeCar(): SvgNode[] {
  // The data keeps SVG attribute names; the scene contract (and React) wants camelCase.
  const camel = (attrs: Record<string, string>) => Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v]));
  const build = ([tag, attrs, kids = []]: CarElement): SvgNode => n(tag, camel(attrs), ...kids.map(build));
  return PROTOTYPE_CAR.map(build);
}
/** Mountain-ocean graphic of the personalized base in the supplied artwork's 1774 × 887 frame: toothed mountain
 * band (open snow-capped peak) above, scalloped ocean banner with a white stripe below. Only the colours vary. */
function personalizedGraphic(mountain: string, ocean: string, mirrored: boolean): () => SvgNode[] {
  const [w] = PERSONALIZED_FRAME;
  return () => [
    n('path', { d: PERSONALIZED_MOUNTAINS, fill: mountain, fillRule: 'evenodd', ...(mirrored ? { transform: `translate(${w} 0) scale(-1 1)` } : {}), 'data-part': 'mountains' }),
    n('path', { d: PERSONALIZED_BANNER, fill: ocean, 'data-part': 'ocean' }),
    n('path', { d: PERSONALIZED_STRIPE, fill: '#ffffff', 'data-part': 'ocean-stripe' }),
  ];
}
/** A banner piece (dogwood or word) in currentColor, cropped to its own box. */
function personalizedPiece(piece: { box: readonly number[]; d: string; origin?: readonly number[] }): ArtMaster {
  const [x0, y0, x1, y1] = piece.box, [ox, oy] = piece.origin ?? [0, 0];
  return { viewBox: [x1 - x0, y1 - y0], draw: () => [n('path', { d: piece.d, transform: `translate(${ox - x0} ${oy - y0})`, fill: 'currentColor', fillRule: 'evenodd' })] };
}

registerArtwork('bc-parks-kermode', platePhoto(parksKermodeUrl, 'kermode-bear-meadow'));
registerArtwork('bc-parks-purcell', platePhoto(parksPurcellUrl, 'purcell-mountains'));
registerArtwork('bc-parks-porteau', platePhoto(parksPorteauUrl, 'porteau-cove'));
// Mount Garibaldi (2010 Olympic plates): one photo, a master per plate size so the small plate crops rather than squashes.
registerArtwork('bc-olympic-garibaldi', platePhoto(olympicGaribaldiUrl, 'garibaldi'));
registerArtwork('bc-olympic-garibaldi-small', platePhoto(olympicGaribaldiUrl, 'garibaldi', 203, 127));
registerArtwork('bc-olympic-emblem', { viewBox: [36, 52], draw: olympicEmblem });
// National War Memorial (Veteran plates): the small plate crops from the left so the statue is kept.
registerArtwork('bc-veteran-memorial', platePhoto(veteranMemorialUrl, 'war-memorial'));
registerArtwork('bc-veteran-memorial-small', platePhoto(veteranMemorialUrl, 'war-memorial', 203, 127, 'xMinYMid'));
registerArtwork('bc-poppy', poppyImage);
registerArtwork('canada-flag', { viewBox: [40, 20], draw: canadaFlag });
registerArtwork('bc-memorial-cross', memorialCrossImage);
registerArtwork('bc-collector-tilde', { viewBox: [20, 8], draw: tilde, aspect: 'stretch' });
registerArtwork('bc-vintage-car-solid-hubs', { viewBox: [VINTAGE_CAR_BOX[2], VINTAGE_CAR_BOX[3]], draw: vintageCar('solidHubs') });
registerArtwork('bc-vintage-car-open-hubs', { viewBox: [VINTAGE_CAR_BOX[2], VINTAGE_CAR_BOX[3]], draw: vintageCar('openHubs') });
registerArtwork('bc-vintage-car-prototype', { viewBox: [PROTOTYPE_CAR_BOX[2], PROTOTYPE_CAR_BOX[3]], draw: prototypeCar });
registerArtwork('bc-personalized-dogwood', personalizedPiece(PERSONALIZED_DOGWOOD));
registerArtwork('bc-personalized-british', personalizedPiece(PERSONALIZED_BRITISH));
registerArtwork('bc-personalized-columbia', personalizedPiece(PERSONALIZED_COLUMBIA));
/** Personalized graphic colourways, sampled from BCpl8s photos: the mountains stay 3M 708 teal-green throughout;
 * the ocean is near-black navy on Acme and Astrographic plates and passenger blue on Waldale plates. */
export const PERSONALIZED_GRAPHICS = {
  acme: ['#0b725e', '#141c28', false], astro: ['#0a8573', '#141d33', false], reversed: ['#0a8573', '#141d33', true],
  waldale: ['#0e8a82', '#0a45a0', false], sample: ['#1a1a1a', '#1a1a1a', false],
} as const;
for (const [key, [mountain, ocean, mirrored]] of Object.entries(PERSONALIZED_GRAPHICS)) {
  registerArtwork(`bc-personalized-${key}`, { viewBox: [...PERSONALIZED_FRAME], draw: personalizedGraphic(mountain, ocean, mirrored), aspect: 'stretch' });
}
