/** Artwork for unissued prototype designs (BCpl8s Prototype page), drawn as simple flat vectors. */
import { node as n, type SvgNode } from '../svg-scene';
import { registerArtwork } from './art';

/** Soft mountain and tree silhouettes of the 1980 “Super, Natural” proposal, 300 × 150. */
function superNatural(): SvgNode[] {
  return [
    n('path', { d: 'M0 30 L30 18 L55 28 L85 12 L120 26 L150 16 L185 27 L215 14 L250 25 L280 17 L300 24 V0 H0 Z', fill: '#bfd9c9' }),
    ...[18, 40, 262, 284].map((x) => n('path', { d: `M${x} 34 l6 -16 l6 16 Z M${x + 5} 34 v4`, fill: '#5f9a78', stroke: '#5f9a78', strokeWidth: 1 })),
    n('path', { d: 'M0 128 Q40 118 80 126 T160 124 T240 126 T300 122 V150 H0 Z', fill: '#bfd9c9' }),
  ];
}
/** Large dogwood (provincial flower) behind the serial of the DOGWOOD proposal, 100 × 100. */
function dogwood(): SvgNode[] {
  const petal = (r: number) => n('path', { d: 'M50 50 C38 30 40 8 50 4 C60 8 62 30 50 50 Z', fill: '#f5c542', transform: `rotate(${r} 50 50)` });
  return [petal(0), petal(90), petal(180), petal(270), n('circle', { cx: 50, cy: 50, r: 7, fill: '#8a9a3a' })];
}
/** Whale tail rising from water (“A NEW BC” proposal), 100 × 50. */
function whaleTail(): SvgNode[] {
  return [
    n('path', { d: 'M50 38 C48 30 44 22 30 16 C22 13 12 14 6 10 C14 22 30 26 44 26 C47 30 48 34 48 38 Z M50 38 C52 30 56 22 70 16 C78 13 88 14 94 10 C86 22 70 26 56 26 C53 30 52 34 52 38 Z', fill: '#1f2a33' }),
    n('path', { d: 'M8 42 Q30 36 50 40 T92 42 V46 Q70 44 50 45 T8 46 Z', fill: '#9fb8c8' }),
  ];
}

registerArtwork('proto-super-natural', { viewBox: [300, 150], draw: superNatural, aspect: 'stretch' });
registerArtwork('proto-dogwood', { viewBox: [100, 100], draw: dogwood });
registerArtwork('proto-whale-tail', { viewBox: [100, 50], draw: whaleTail });
