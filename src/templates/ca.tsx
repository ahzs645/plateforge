/**
 * Canadian provincial / territorial 12×6″ plates. A richer sibling of the US
 * template: header + slogan labels, illustrated backgrounds, placed emblems,
 * an emblem drawn in place of the serial's `·`, and the polar-bear outline.
 * Artwork combines constructed geometry with supplied background imagery.
 */
import { useId, type ReactElement } from 'react';
import type { Parts, PlateTemplate } from '../core/types';
import { isLetteringType, letteringMetadata } from '../core/lettering';
import { buildLettering, letteringLayout, supportsLettering } from './lettering';
import { SvgScene } from './SvgScene';
import { NWT_SPECTACULAR_PROFILE, buildNwtSpectacularSerial } from './dies/nwt-spectacular';
import ntAuroraUrl from '../assets/nt-aurora.png';
import { CONDENSED, FONTS } from './fonts';
import { fit, measure, safeId } from './measure';
import {
  NWT_POLAR_BEAR_PATH, NWT_POLAR_BEAR_BORDER_PATH, NWT_POLAR_BEAR_HOLES,
  NWT_POLAR_BEAR_SLOTS, NWT_POLAR_BEAR_SOURCE,
} from './shapes/nwt-polar-bear';

export type CaFace = 'block' | 'sans' | 'serif' | 'script' | 'syllabics';
export type CaEmblem =
  | 'wild-rose' | 'bison' | 'maple-leaf' | 'crown' | 'trillium' | 'fleur-de-lis' | 'qc-flag' | 'galley'
  | 'pitcher-plant' | 'prospector' | 'inuksuk' | 'star' | 'canada-flag' | 'pei-crest' | 'ev' | 'wheat'
  | 'bluenose' | 'polar-bear' | 'diamond';
export type CaScene = 'moraine-lake' | 'prairie-river' | 'nb-bands' | 'klondike' | 'arctic-night' | 'nt-spectacular';

export interface CaLabel {
  text: string;
  x?: number;
  y: number;
  size: number;
  face?: CaFace;
  weight?: number;
  italic?: boolean;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  maxWidth?: number;
  /** Outline drawn under the fill, e.g. white around text on a photo-like scene. */
  halo?: string;
}

export interface CaPlaced {
  kind: CaEmblem;
  /** Centre of a `size`×`size` box. */
  x: number;
  y: number;
  size: number;
  color?: string;
  accent?: string;
  opacity?: number;
  flip?: boolean;
  /** Draw behind the lettering (watermark-style graphics). */
  back?: boolean;
}

export interface CaDesign {
  [key: string]: unknown;
  header?: string;
  headerFace?: CaFace;
  headerSize?: number;
  headerY?: number;
  headerX?: number;
  headerColor?: string;
  headerSpacing?: number;
  headerItalic?: boolean;
  headerWeight?: number;
  headerHalo?: string;
  headerWidth?: number;
  slogan?: string;
  sloganFace?: CaFace;
  sloganSize?: number;
  sloganY?: number;
  sloganX?: number;
  sloganColor?: string;
  sloganSpacing?: number;
  sloganItalic?: boolean;
  sloganWeight?: number;
  sloganHalo?: string;
  sloganWidth?: number;
  /** Extra fixed legends ("Friendly", "CANADA", syllabics, …). */
  labels?: CaLabel[];
  /** Serial ink. */
  text?: string;
  serialY?: number;
  serialX?: number;
  serialSize?: number;
  serialWidth?: number;
  serialSpacing?: number;
  serialHalo?: string;
  /** Drop-shadow suggesting embossing; off for flat screened serials. */
  embossed?: boolean;
  bg?: [string, string];
  scene?: CaScene;
  frame?: string;
  frameWidth?: number;
  emblems?: CaPlaced[];
  /** Emblem drawn wherever the serial contains `·`. */
  separator?: CaEmblem;
  separatorColor?: string;
  separatorAccent?: string;
  separatorSize?: number;
  shape?: 'rect' | 'polar-bear';
  /** Select the supplied-reference NWT reconstruction independently of other bear artwork. */
  bearProfile?: 'legacy' | 'nwt-reference';
  bearMounts?: 'round' | 'slotted';
  facing?: 'left' | 'right';
  holes?: 'four' | 'two' | 'none';
}

const W = 600;
const H = 300;
export const CA_SIZE = { width: W, height: H };
const SCRIPT = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';
const FACES: Record<CaFace, string> = {
  block: CONDENSED,
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  script: SCRIPT,
  syllabics: '"Euphemia UCAS", "Noto Sans Canadian Aboriginal", Gadugi, "Aboriginal Sans", sans-serif',
};
const DEFAULT_WEIGHT: Record<CaFace, number> = { block: 700, sans: 700, serif: 700, script: 400, syllabics: 700 };

/**
 * Polar-bear outline (facing right) in the 600×300 plate box: the 1970 NWT
 * plate is 12″ at its widest and 6″ at its tallest. Our own drawing.
 */
export const POLAR_BEAR_PATH =
  'M30 150 C30 90 70 50 140 38 C220 24 330 26 400 34 C430 38 450 44 468 40 C482 26 500 14 522 12 ' +
  'C530 4 544 4 546 14 C566 18 584 32 592 48 C598 58 598 68 590 72 C580 76 566 76 556 82 ' +
  'C540 92 530 104 522 118 C512 136 508 160 510 184 C512 214 520 246 526 266 C530 282 526 292 510 292 ' +
  'L462 292 C452 292 450 282 458 276 C466 262 464 246 458 232 C420 240 330 242 256 234 ' +
  'C250 252 256 270 266 280 C274 290 268 294 254 294 L150 294 C110 292 66 270 44 232 C34 212 28 180 30 150 Z';

// Maple leaf: 11 points, symmetric about x = 50.
const LEAF_RIGHT = [[50, 4], [56, 16], [62, 13], [60, 34], [72, 22], [74, 28], [86, 26], [82, 40], [88, 43], [68, 58], [71, 66], [53, 63], [53, 86]];
const MAPLE_LEAF = 'M' + [...LEAF_RIGHT, ...LEAF_RIGHT.slice(1).reverse().map(([x, y]) => [100 - x, y])].map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';
const FLEUR = 'M50 8 C60 22 62 38 54 56 L46 56 C38 38 40 22 50 8 Z ' +
  'M55 56 C60 36 80 28 87 43 C91 53 83 62 74 58 C80 52 76 44 70 46 C64 48 60 53 59 60 Z ' +
  'M45 56 C40 36 20 28 13 43 C9 53 17 62 26 58 C20 52 24 44 30 46 C36 48 40 53 41 60 Z ' +
  'M34 57 H66 V64 H34 Z M46 64 L43 80 C47 78 49 81 50 90 C51 81 53 78 57 80 L54 64 Z';
const star = (cx: number, cy: number, r: number, inner = 0.42) =>
  'M' + Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' L') + ' Z';

/** Each emblem is drawn in a 100×100 box. */
function emblemArt(kind: CaEmblem, color: string, accent: string): ReactElement {
  switch (kind) {
    case 'wild-rose': return (
      <g>
        <path d="M50 58 C46 74 40 86 26 94" fill="none" stroke="#3f7d3a" strokeWidth="3" />
        <ellipse cx="30" cy="80" rx="11" ry="5" transform="rotate(-35 30 80)" fill="#3f7d3a" />
        <ellipse cx="68" cy="82" rx="11" ry="5" transform="rotate(30 68 82)" fill="#3f7d3a" />
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M50 50 C36 40 34 18 44 14 C48 12 50 16 50 18 C50 16 52 12 56 14 C66 18 64 40 50 50 Z"
            transform={`rotate(${a} 50 48)`} fill={color} stroke={accent === 'none' ? 'none' : '#fff'} strokeOpacity="0.5" strokeWidth="1" />
        ))}
        <circle cx="50" cy="48" r="8" fill="#f4c542" />
        {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx="50" cy="39" r="1.6" fill="#c9861b" transform={`rotate(${a} 50 48)`} />)}
      </g>
    );
    case 'bison': return (
      <g fill={color} stroke={color} strokeLinejoin="round">
        <path d="M12 62 C8 48 14 36 28 34 C40 32 50 30 58 22 C66 16 78 18 82 28 C90 32 94 42 92 52 C91 58 88 62 84 62 L82 72 L76 64 L75 82 L69 82 L67 66 C56 67 44 67 34 64 L32 82 L26 82 L24 64 C18 66 14 66 12 62 Z" />
        <path d="M82 28 C88 24 90 20 86 16" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M13 50 C6 54 6 60 9 66" fill="none" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
    case 'maple-leaf': return <path d={MAPLE_LEAF} fill={color} />;
    case 'crown': return (
      <g fill={color}>
        <path d="M18 68 L11 34 L32 50 L50 24 L68 50 L89 34 L82 68 Z" />
        <rect x="16" y="70" width="68" height="12" rx="2" />
        <circle cx="11" cy="31" r="5" /><circle cx="89" cy="31" r="5" /><circle cx="50" cy="20" r="5" />
        <path d="M47 4 H53 V9 H58 V14 H53 V17 H47 V14 H42 V9 H47 Z" />
        <circle cx="32" cy="76" r="2.4" fill="#fff" /><circle cx="50" cy="76" r="2.4" fill="#fff" /><circle cx="68" cy="76" r="2.4" fill="#fff" />
      </g>
    );
    case 'trillium': return (
      <g>
        {[60, 180, 300].map((a) => <ellipse key={a} cx="50" cy="24" rx="6" ry="20" transform={`rotate(${a} 50 52)`} fill={accent} />)}
        {[0, 120, 240].map((a) => (
          <path key={a} d="M50 52 C36 44 34 20 50 6 C66 20 64 44 50 52 Z" transform={`rotate(${a} 50 52)`}
            fill="#fff" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        ))}
        <circle cx="50" cy="52" r="6" fill="#f2c230" stroke={color} strokeWidth="1.5" />
      </g>
    );
    case 'fleur-de-lis': return <path d={FLEUR} fill={color} fillRule="nonzero" />;
    case 'qc-flag': return (
      <g>
        <rect x="4" y="4" width="92" height="92" rx="3" fill={color} />
        <g transform="translate(14 12) scale(0.72)"><path d={FLEUR} fill="#fff" /></g>
      </g>
    );
    case 'galley': return (
      <g>
        <path d="M50 14 V62" stroke={color} strokeWidth="3" />
        <path d="M34 20 Q50 16 66 20 L64 50 Q50 46 36 50 Z" fill={color} />
        <path d="M12 58 L88 58 C84 70 22 72 12 58 Z" fill={color} />
        <path d="M88 58 C94 50 94 42 88 38 M12 58 C6 50 8 44 14 40" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {[26, 38, 50, 62, 74].map((x) => <path key={x} d={`M${x} 66 L${x - 8} 80`} stroke={color} strokeWidth="2" />)}
        <path d="M8 86 Q17 80 26 86 T44 86 T62 86 T80 86 T98 86" fill="none" stroke={accent} strokeWidth="3" />
      </g>
    );
    case 'pitcher-plant': return (
      <g>
        <path d="M50 96 C48 80 54 66 50 44" fill="none" stroke="#4d7a36" strokeWidth="3" />
        <path d="M50 92 C38 90 28 78 30 64 C34 70 40 74 48 80 Z" fill="#6f8f3a" />
        <path d="M52 92 C64 90 74 78 72 64 C68 70 62 74 54 80 Z" fill="#6f8f3a" />
        <path d="M30 40 C30 20 70 20 70 40 C64 36 36 36 30 40 Z" fill={color} />
        {[34, 42, 50, 58, 66].map((x) => <ellipse key={x} cx={x} cy="46" rx="4" ry="8" fill={accent} />)}
        <circle cx="50" cy="32" r="5" fill="#f2c14e" />
        <circle cx="26" cy="22" r="6" fill={color} /><circle cx="74" cy="22" r="6" fill={color} />
        <path d="M26 28 C30 34 36 36 40 38 M74 28 C70 34 64 36 60 38" fill="none" stroke="#4d7a36" strokeWidth="2" />
      </g>
    );
    case 'prospector': return (
      <g strokeLinejoin="round">
        <path d="M30 60 L62 60 L66 82 L76 86 L76 92 L50 92 L46 74 L34 88 L22 92 L20 86 L30 80 Z" fill="#23407a" />
        <path d="M32 34 C36 30 56 30 60 34 L64 62 L28 62 Z" fill="#e0701f" stroke="#7a3510" strokeWidth="1.2" />
        <path d="M58 40 L80 56 L76 62 L56 50 Z" fill="#e0701f" stroke="#7a3510" strokeWidth="1.2" />
        <ellipse cx="80" cy="62" rx="16" ry="5" fill="#6b6b6b" stroke="#222" strokeWidth="1.5" />
        <ellipse cx="80" cy="60.5" rx="10" ry="2" fill="#f2c14e" />
        <circle cx="46" cy="22" r="8" fill="#e8b48a" />
        <path d="M38 22 C38 34 54 34 54 22 C52 28 40 28 38 22 Z" fill="#3b2412" />
        <ellipse cx="46" cy="13" rx="17" ry="3.5" fill="#6b3f1d" />
        <path d="M37 13 C37 3 55 3 55 13 Z" fill="#6b3f1d" />
      </g>
    );
    case 'inuksuk': return (
      <g fill={color} stroke={accent} strokeWidth="2" strokeLinejoin="round">
        <rect x="30" y="62" width="14" height="32" rx="2" />
        <rect x="56" y="62" width="14" height="32" rx="2" />
        <rect x="24" y="52" width="52" height="11" rx="2" />
        <rect x="36" y="38" width="28" height="14" rx="2" />
        <rect x="10" y="28" width="80" height="10" rx="2" />
        <rect x="40" y="8" width="20" height="19" rx="3" />
      </g>
    );
    case 'star': return <path d={star(50, 52, 46)} fill={color} />;
    case 'diamond': return <path d="M50 20 L80 50 L50 80 L20 50 Z" fill={color} />;
    case 'canada-flag': return (
      <g>
        <rect x="0" y="25" width="100" height="50" fill="#fff" stroke="#bbb" strokeWidth="0.8" />
        <rect x="0" y="25" width="25" height="50" fill="#d52b1e" /><rect x="75" y="25" width="25" height="50" fill="#d52b1e" />
        <g transform="translate(35 32) scale(0.3)"><path d={MAPLE_LEAF} fill="#d52b1e" /></g>
      </g>
    );
    case 'pei-crest': return (
      <g>
        <path d="M18 8 H82 V50 C82 74 64 88 50 95 C36 88 18 74 18 50 Z" fill="#fff" stroke={color} strokeWidth="3" />
        <path d="M18 8 H82 V30 H18 Z" fill="#d52b1e" />
        <path d="M34 22 C38 16 46 16 50 20 C54 16 62 16 66 22 C62 24 58 26 50 26 C42 26 38 24 34 22 Z" fill="#f2c14e" />
        <path d="M22 70 C36 64 64 64 78 70 L72 80 C62 88 38 88 28 80 Z" fill={color} />
        <rect x="60" y="52" width="5" height="16" fill="#6b3f1d" />
        <circle cx="62.5" cy="46" r="12" fill={color} />
        {[30, 39, 48].map((x) => <g key={x}><rect x={x - 1} y="60" width="2.5" height="8" fill="#6b3f1d" /><circle cx={x} cy="56" r="5" fill={color} /></g>)}
      </g>
    );
    case 'ev': return (
      <g fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="4" y="4" width="92" height="92" rx="10" fill="#fff" />
        <path d="M16 62 L20 48 C22 42 26 40 32 40 L60 40 C66 40 70 44 74 48 L84 52 C88 54 88 58 88 62 Z" fill={color} />
        <circle cx="32" cy="64" r="8" fill="#fff" /><circle cx="72" cy="64" r="8" fill="#fff" />
        <path d="M48 12 L38 30 H50 L42 36" strokeWidth="4" />
        <path d="M16 82 H44 M56 82 H84" strokeWidth="4" />
      </g>
    );
    case 'wheat': return (
      <g fill={color} stroke={color}>
        <path d="M50 98 C50 70 50 40 50 10" fill="none" strokeWidth="2.5" />
        {[16, 26, 36, 46, 56].map((y, i) => (
          <g key={y}>
            <ellipse cx="42" cy={y + 4} rx="4" ry="8" transform={`rotate(-28 42 ${y + 4})`} stroke="none" />
            <ellipse cx="58" cy={y + 4} rx="4" ry="8" transform={`rotate(28 58 ${y + 4})`} stroke="none" />
            {i < 3 && <path d={`M40 ${y - 2} L32 ${y - 16} M60 ${y - 2} L68 ${y - 16}`} fill="none" strokeWidth="1" />}
          </g>
        ))}
        <ellipse cx="50" cy="12" rx="3.5" ry="8" stroke="none" />
        <path d="M50 70 C40 66 30 70 22 80 C34 78 42 76 50 76 M50 82 C60 78 70 80 78 88 C66 88 58 86 50 88" fill="none" strokeWidth="2.5" />
      </g>
    );
    case 'bluenose': return (
      <g fill={color}>
        <path d="M6 70 L94 66 C90 76 80 80 60 80 L20 80 C12 78 8 74 6 70 Z" />
        <path d="M86 66 L99 56" stroke={color} strokeWidth="1.5" />
        <path d="M40 66 V8 M64 66 V6" stroke={color} strokeWidth="2" />
        <path d="M38 12 L38 64 L10 64 L16 18 Z" />
        <path d="M62 10 L62 64 L43 64 L45 16 Z" />
        <path d="M66 14 L97 56 L66 58 Z" />
      </g>
    );
    case 'polar-bear': return (
      <g transform="translate(0 25) scale(0.16667)">
        <path d={POLAR_BEAR_PATH} fill={color} stroke={accent} strokeWidth="6" />
      </g>
    );
  }
}

function Emblem({ p, defs }: { p: CaPlaced; defs?: { color?: string; accent?: string } }) {
  const color = p.color ?? defs?.color ?? '#1c3f94';
  const accent = p.accent ?? defs?.accent ?? '#3f7d3a';
  const s = p.size / 100;
  const flip = p.flip ? ` translate(100 0) scale(-1 1)` : '';
  return (
    <g data-emblem={p.kind} opacity={p.opacity} transform={`translate(${p.x - p.size / 2} ${p.y - p.size / 2}) scale(${s})${flip}`}>
      {emblemArt(p.kind, color, accent)}
    </g>
  );
}

function Label({ l, ink }: { l: CaLabel; ink: string }) {
  const face = l.face ?? 'block';
  const font = { family: FACES[face], size: l.size, weight: l.weight ?? DEFAULT_WEIGHT[face], letterSpacing: l.spacing ?? 0 };
  const sized = fit(l.text, font, l.maxWidth ?? 540);
  return (
    <text x={l.x ?? W / 2} y={l.y} textAnchor={l.anchor ?? 'middle'} fontFamily={font.family} fontSize={font.size}
      fontWeight={font.weight} fontStyle={l.italic ? 'italic' : undefined} letterSpacing={font.letterSpacing || undefined}
      fill={l.color ?? ink} stroke={l.halo} strokeWidth={l.halo ? l.size * 0.14 : undefined}
      strokeLinejoin={l.halo ? 'round' : undefined} paintOrder={l.halo ? 'stroke' : undefined} {...sized.attrs}>
      {l.text}
    </text>
  );
}

function Scene({ kind, id }: { kind: CaScene; id: string }) {
  switch (kind) {
    case 'moraine-lake': {
      const peaks: [number, number][] = [[30, 112], [78, 84], [122, 66], [168, 88], [206, 58], [246, 80], [288, 52], [330, 76], [368, 60], [410, 86], [452, 72], [500, 100], [556, 118]];
      const ridge = `M0 150 ${peaks.map(([x, y]) => `L${x} ${y} L${x + 20} ${y + 26}`).join(' ')} L600 136 L600 196 L0 196 Z`;
      const trees = (x0: number, n: number, base: number, h: number) => Array.from({ length: n }, (_, i) => {
        const x = x0 + i * 13 + ((i * 7) % 5);
        const hh = h * (0.7 + ((i * 37) % 10) / 30);
        return `M${x} ${base} L${x + 6} ${base - hh} L${x + 12} ${base} Z`;
      }).join(' ');
      return (
        <g data-scene={kind}>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fa8dc" /><stop offset="1" stopColor="#dcebf7" /></linearGradient>
            <linearGradient id={`${id}lake`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#55c3cf" /><stop offset="1" stopColor="#1d8aa6" /></linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${id}sky)`} />
          <path d={ridge} fill="#a7b6c6" />
          {peaks.map(([x, y]) => <path key={x} d={`M${x - 11} ${y + 16} L${x} ${y} L${x + 14} ${y + 18} L${x + 6} ${y + 14} L${x} ${y + 20} Z`} fill="#fff" opacity="0.9" />)}
          <path d="M0 118 L70 150 L150 196 L0 196 Z" fill="#6f8579" />
          <path d="M600 128 L530 160 L470 196 L600 196 Z" fill="#6f8579" />
          <path d={trees(0, 46, 200, 18)} fill="#2f5a3c" />
          <path d={trees(470, 10, 210, 150) + ' ' + trees(12, 4, 210, 90)} fill="#244a31" />
          <rect y="198" width={W} height="102" fill={`url(#${id}lake)`} />
          <path d="M0 214 H600 M40 232 H300 M320 250 H560" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
        </g>
      );
    }
    case 'prairie-river': {
      const trees = (x0: number, dir: 1 | -1) => Array.from({ length: 9 }, (_, i) => {
        const x = x0 + dir * i * 13;
        const base = 250 - i * 3;
        const h = 70 + ((i * 29) % 40) + (8 - i) * 10;
        return `M${x - 9} ${base} L${x} ${base - h} L${x + 9} ${base} Z`;
      }).join(' ');
      return (
        <g data-scene={kind}>
          <path d="M0 150 C40 170 70 210 120 226 L0 250 Z M600 140 C560 170 520 210 470 228 L600 250 Z" fill="#8fc9b8" />
          <path d={trees(8, 1) + ' ' + trees(592, -1)} fill="#2b8f73" />
          <path d="M0 238 C120 214 480 214 600 236 L600 262 C460 250 140 250 0 262 Z" fill="#6fb6e3" />
          <path d="M150 244 C240 236 360 236 450 244" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" fill="none" />
          <rect y="258" width={W} height="42" fill="#e8b847" />
          <path d={Array.from({ length: 60 }, (_, i) => `M${i * 10 + 3} 300 L${i * 10 + 6} ${262 + ((i * 7) % 12)}`).join(' ')} stroke="#b9831d" strokeWidth="2" />
        </g>
      );
    }
    case 'nb-bands':
      return (
        <g data-scene={kind}>
          <defs><linearGradient id={`${id}nbsky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d8fd6" /><stop offset="1" stopColor="#bfe0f6" /></linearGradient></defs>
          <path d="M0 0 H600 V58 Q300 18 0 58 Z" fill={`url(#${id}nbsky)`} />
          <path d="M0 58 Q300 18 600 58 L600 72 Q300 32 0 72 Z" fill="#f3b61f" />
          <path d="M0 72 Q300 32 600 72 L600 78 Q300 40 0 78 Z" fill="#f7d774" />
        </g>
      );
    case 'klondike':
      return (
        <g data-scene={kind}>
          <path d="M22 26 H180 M22 32 H180 M420 26 H578 M420 32 H578" stroke="#c8102e" strokeWidth="2" />
          <rect y="236" width={W} height="42" fill="#2a78c2" />
          <path d="M0 232 H600 M0 282 H600" stroke="#2a78c2" strokeWidth="2" />
        </g>
      );
    case 'arctic-night': {
      const stars = Array.from({ length: 25 }, (_, i) => [40 + ((i * 97) % 520), 18 + ((i * 53) % 110)] as const);
      return (
        <g data-scene={kind}>
          <defs>
            <linearGradient id={`${id}night`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5d4aa6" /><stop offset="0.45" stopColor="#8fb2e2" /><stop offset="1" stopColor="#eef4fb" /></linearGradient>
            <linearGradient id={`${id}aurora`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6cf0b0" /><stop offset="1" stopColor="#d58cf0" /></linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${id}night)`} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${-20 + i * 30} ${70 + i * 18} C120 ${-10 + i * 20} 260 ${120 - i * 12} 420 ${40 + i * 16} C500 ${10 + i * 10} 560 ${30 + i * 8} 620 ${10 + i * 22}`}
              fill="none" stroke={`url(#${id}aurora)`} strokeWidth={22 - i * 5} strokeOpacity={0.55 - i * 0.1} strokeLinecap="round" />
          ))}
          {stars.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 5 ? 1.6 : 2.6} fill="#fff" />)}
          <path d="M0 250 C150 236 300 246 420 238 C500 234 560 240 600 236 V300 H0 Z" fill="#fff" />
        </g>
      );
    }
    case 'nt-spectacular':
      return (
        <g data-scene={kind}>
          <defs>
            <image id={`${id}nt-aurora`} href={ntAuroraUrl} width={W} height={H} preserveAspectRatio="xMidYMid slice"
              data-source="user-supplied-aurora-over-arctic-wilderness" />
          </defs>
          {/* Reuse the original sky above the shifted scene; the bear clears the neck cutout. */}
          <use href={`#${id}nt-aurora`} />
          <use href={`#${id}nt-aurora`} y="22" />
        </g>
      );
  }
}

type Segment = { text: string; x: number; width: number };

/** Splits the serial at `·` and lays the groups out around separator emblems. */
function layoutSerial(text: string, sep: number, measureGroup: (s: string) => number, maxWidth: number, centerX: number) {
  const groups = text.split('·');
  const natural = groups.map(measureGroup);
  const total = natural.reduce((a, b) => a + b, 0) + sep * (groups.length - 1);
  const scale = Math.min(1, maxWidth / Math.max(1, total));
  let cursor = centerX - (total * scale) / 2;
  const segments: Segment[] = [];
  const separators: number[] = [];
  groups.forEach((g, i) => {
    if (i) { separators.push(cursor + (sep * scale) / 2); cursor += sep * scale; }
    segments.push({ text: g, x: cursor, width: natural[i] * scale });
    cursor += natural[i] * scale;
  });
  return { segments, separators, scale, squeezed: scale < 1 };
}

function CaPlate({ design: d, text, parts }: { design: CaDesign; text: string; parts: Parts }) {
  const id = safeId(useId());
  const ink = d.text ?? '#1c3f94';
  const [top, bottom] = d.bg ?? ['#ffffff', '#f2f4f7'];
  const bear = d.shape === 'polar-bear';
  const nwt = bear && d.bearProfile === 'nwt-reference';
  const bearPath = nwt ? NWT_POLAR_BEAR_PATH : POLAR_BEAR_PATH;
  const bearBorderPath = nwt ? NWT_POLAR_BEAR_BORDER_PATH : POLAR_BEAR_PATH;
  const flipBear = bear && d.facing === 'left' ? `translate(${W} 0) scale(-1 1)` : undefined;
  const vectorType = isLetteringType(parts.lettering) && supportsLettering(text) ? parts.lettering : null;
  const spectacular = nwt && d.scene === 'nt-spectacular' && !vectorType;
  const embossed = d.embossed ?? true;

  const serialSize = d.serialSize ?? 150;
  const serialY = d.serialY ?? 208;
  const serialX = d.serialX ?? W / 2;
  const serialWidth = d.serialWidth ?? 520;
  const serialFont = { family: CONDENSED, size: serialSize, weight: 600, letterSpacing: d.serialSpacing ?? 5 };
  const hasSeparator = !!d.separator && text.includes('·');
  const sepSize = d.separatorSize ?? serialSize * 0.5;
  const sepGap = sepSize + serialSize * 0.12;
  // Vector lettering is laid out in its own 100-unit glyph box.
  const vectorHeight = serialSize * 0.73;
  const layout = hasSeparator
    ? layoutSerial(text, sepGap, vectorType
      ? (s) => letteringLayout(s || ' ', vectorHeight, 1e6).renderedWidth
      : (s) => measure(s, serialFont), serialWidth, serialX)
    : null;
  const plain = fit(text, serialFont, serialWidth);

  const labels: CaLabel[] = [
    ...(d.header ? [{ text: d.header, x: d.headerX, y: d.headerY ?? 58, size: d.headerSize ?? 46, face: d.headerFace, weight: d.headerWeight,
      italic: d.headerItalic, color: d.headerColor, spacing: d.headerSpacing ?? ((d.headerFace ?? 'block') === 'block' ? 4 : 0), halo: d.headerHalo, maxWidth: d.headerWidth } as CaLabel] : []),
    ...(d.slogan ? [{ text: d.slogan, x: d.sloganX, y: d.sloganY ?? 278, size: d.sloganSize ?? 26, face: d.sloganFace, weight: d.sloganWeight,
      italic: d.sloganItalic, color: d.sloganColor, spacing: d.sloganSpacing ?? 2, halo: d.sloganHalo, maxWidth: d.sloganWidth } as CaLabel] : []),
    ...(d.labels ?? []),
  ];
  const emblems = d.emblems ?? [];
  const holes = d.holes ?? (nwt ? 'four' : bear ? 'two' : 'four');
  const holeList = holes === 'none' ? [] : holes === 'two' ? (bear ? [[135, 54], [445, 54]] : [[125, 30], [475, 30]]) : [[125, 30], [475, 30], [125, 270], [475, 270]];
  const includeMount = (cy: number) => holes !== 'none' && (holes !== 'two' || cy < H / 2);
  const outline = bear
    ? <path d={bearPath} transform={flipBear} />
    : <rect width={W} height={H} rx="22" />;

  const serialLayers = [
    ...(embossed ? [{ dx: 3, dy: 4, fill: '#000', opacity: 0.22, halo: undefined as string | undefined }] : []),
    { dx: 0, dy: 0, fill: ink, opacity: 1, halo: d.serialHalo },
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text} data-shape={bear ? 'polar-bear' : 'rect'} data-shape-profile={nwt ? 'nwt-reference' : undefined}>
      <metadata>{JSON.stringify({ serial: text, parts, lettering: {
        ...(spectacular ? {id: NWT_SPECTACULAR_PROFILE.id, evidence: NWT_SPECTACULAR_PROFILE.evidence} : letteringMetadata(vectorType ?? 'default')), requested: parts.lettering ?? 'default',
        fallback: isLetteringType(parts.lettering) && !vectorType,
      }, ...(nwt ? { shape: { profile: 'nwt-reference', mounts: d.bearMounts ?? 'round', source: NWT_POLAR_BEAR_SOURCE } } : {}) })}</metadata>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.06" />
        </linearGradient>
        <clipPath id={`${id}clip`}>{outline}</clipPath>
        {nwt && <mask id={`${id}body`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} style={{ maskType: 'luminance' }} data-role="plate-cutouts">
          <g transform={flipBear}>
            <path d={NWT_POLAR_BEAR_PATH} fill="#fff" />
            {d.bearMounts === 'slotted'
              ? NWT_POLAR_BEAR_SLOTS.filter(({ cy }) => includeMount(cy)).map(({ cx, cy, width, height, rx }) => (
                <rect key={`${cx}-${cy}`} x={cx - width / 2} y={cy - height / 2} width={width} height={height} rx={rx} fill="#000" data-role="mounting-hole" />
              ))
              : NWT_POLAR_BEAR_HOLES.filter(({ cy }) => includeMount(cy)).map(({ cx, cy, r }) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#000" data-role="mounting-hole" />
              ))}
          </g>
        </mask>}
      </defs>
      <g mask={nwt ? `url(#${id}body)` : undefined}>
        <g clipPath={`url(#${id}clip)`}>
          <rect width={W} height={H} fill={`url(#${id}bg)`} />
          {d.scene && <Scene kind={d.scene} id={id} />}
          {emblems.filter((p) => p.back).map((p, i) => <Emblem key={`b${i}`} p={p} />)}
          {d.scene !== 'nt-spectacular' && <rect width={W} height={H} fill={`url(#${id}sheen)`} />}
        </g>
        {d.frame && (bear
          ? <path d={bearBorderPath} transform={flipBear} fill="none" stroke={d.frame} strokeWidth={d.frameWidth ?? 6} strokeLinejoin="round" data-role={nwt ? 'inset-border' : undefined} />
          : <rect x="7" y="7" width={W - 14} height={H - 14} rx="17" fill="none" stroke={d.frame} strokeWidth={d.frameWidth ?? 5} />)}
        {!nwt && holeList.map(([cx, cy]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="14" ry="6.5" fill="#000" opacity="0.2" />)}

        {labels.map((l, i) => <Label key={i} l={l} ink={ink} />)}
        {nwt && d.scene === 'nt-spectacular' && <rect x="370" y="29" width="73" height="49" fill="none" stroke="#919898" strokeWidth="0.7" data-role="validation-decal-well" />}
        {emblems.filter((p) => !p.back).map((p, i) => <Emblem key={`f${i}`} p={p} />)}

        <g data-role="serial-group">
          {spectacular ? <>
            <SvgScene node={buildNwtSpectacularSerial({text, x: serialX, baseline: serialY, capHeight: vectorHeight, maxWidth: serialWidth, ink, role: 'serial'}).node} />
          </> : serialLayers.map((layer, i) => {
            const role = i === serialLayers.length - 1 ? 'serial' : 'serial-shadow';
            if (layout) {
              return (
                <g key={i} opacity={layer.opacity}>
                  {layout.segments.map((seg, j) => vectorType ? (
                    seg.text ? <SvgScene key={j} node={buildLettering({ text: seg.text, type: vectorType, centerX: seg.x + seg.width / 2 + layer.dx,
                      baseline: serialY + layer.dy, height: vectorHeight * layout.scale, maxWidth: 1e6, ink: layer.fill, role })} /> : null
                  ) : (
                    <text key={j} x={seg.x + layer.dx} y={serialY + layer.dy} textAnchor="start" fontFamily={serialFont.family}
                      fontSize={serialFont.size} fontWeight={serialFont.weight} letterSpacing={serialFont.letterSpacing} fill={layer.fill}
                      stroke={layer.halo} strokeWidth={layer.halo ? 6 : undefined} paintOrder={layer.halo ? 'stroke' : undefined}
                      {...(layout.squeezed && seg.text ? { textLength: seg.width, lengthAdjust: 'spacingAndGlyphs' as const } : {})}>
                      {seg.text}
                    </text>
                  ))}
                </g>
              );
            }
            return vectorType ? (
              <g key={i} opacity={layer.opacity}>
                <SvgScene node={buildLettering({ text, type: vectorType, centerX: serialX + layer.dx, baseline: serialY + layer.dy,
                  height: vectorHeight, maxWidth: serialWidth, ink: layer.fill, role })} />
              </g>
            ) : (
              <text key={i} x={serialX + layer.dx} y={serialY + layer.dy} textAnchor="middle" fontFamily={serialFont.family}
                fontSize={serialFont.size} fontWeight={serialFont.weight} letterSpacing={serialFont.letterSpacing} fill={layer.fill}
                opacity={layer.opacity} stroke={layer.halo} strokeWidth={layer.halo ? 6 : undefined} paintOrder={layer.halo ? 'stroke' : undefined}
                {...plain.attrs}>
                {text}
              </text>
            );
          })}
          {layout?.separators.map((x, i) => (
            <g key={`sep${i}`} data-role="serial-separator">
              <Emblem p={{ kind: d.separator!, x, y: serialY - serialSize * 0.36, size: sepSize * layout.scale, color: d.separatorColor ?? ink, accent: d.separatorAccent }} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export const caTemplate: PlateTemplate<CaDesign> = {
  id: 'ca',
  name: 'Canadian provincial 12×6″',
  size: () => CA_SIZE,
  render: ({ design, text, parts }) => <CaPlate design={design} text={text} parts={parts} />,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};
