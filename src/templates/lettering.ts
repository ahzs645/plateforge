import { isLetteringType, LETTERING_TYPES, type CurveType, type LetteringType } from '../core/lettering';
import { node as n, type SvgNode } from './svg-scene';

/** Original centreline drawings, NOT traced/digitized from a font or photograph.
 * Coordinates are deliberately shared: stems, bowls, caps, spacing and weight.
 * The hybrid is one illustrative combination, not every possible mixed die. */
const K = 0.5522847498307936;
const L = 7, R = 49, T = 7, B = 93, MID = 28;
export const GLYPH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const supportsLettering = (text: string): boolean => /^[A-Z0-9 .·-]*$/.test(text);
export function curveFor(type: LetteringType, char: string): CurveType {
  const profile = LETTERING_TYPES.find((entry) => entry.id === type)!;
  return /[0-9]/.test(char) ? profile.numbers : profile.letters;
}

/** Quadrants run clockwise from top-centre to right, bottom, left, top. */
function quadrants(kind: CurveType, l: number, t: number, r: number, b: number): string[] {
  const cx = (l + r) / 2, cy = (t + b) / 2, rx = (r - l) / 2, ry = (b - t) / 2;
  if (kind === 'oval') return [
    `C${cx + K * rx} ${t} ${r} ${cy - K * ry} ${r} ${cy}`,
    `C${r} ${cy + K * ry} ${cx + K * rx} ${b} ${cx} ${b}`,
    `C${cx - K * rx} ${b} ${l} ${cy + K * ry} ${l} ${cy}`,
    `C${l} ${cy - K * ry} ${cx - K * rx} ${t} ${cx} ${t}`,
  ];
  const radius = kind === 'squarish' ? Math.min(6, rx, ry) : Math.min(rx, ry);
  return [
    `H${r - radius} A${radius} ${radius} 0 0 1 ${r} ${t + radius} V${cy}`,
    `V${b - radius} A${radius} ${radius} 0 0 1 ${r - radius} ${b} H${cx}`,
    `H${l + radius} A${radius} ${radius} 0 0 1 ${l} ${b - radius} V${cy}`,
    `V${t + radius} A${radius} ${radius} 0 0 1 ${l + radius} ${t} H${cx}`,
  ];
}
function loop(kind: CurveType, l: number, t: number, r: number, b: number): string {
  return `M${(l + r) / 2} ${t} ${quadrants(kind, l, t, r, b).join(' ')} Z`;
}
function rightBowl(kind: CurveType, t: number, b: number, l = L): string {
  return `M${l} ${t} H${MID} ${quadrants(kind, L, t, R, b).slice(0, 2).join(' ')} H${l}`;
}
function cCurve(kind: CurveType, t = T, b = B): string {
  // A 270-degree open bowl plus short independent terminals.
  const q = quadrants(kind, L, t, R, b);
  return `M${R} ${b - 13} Q${R} ${b} ${MID} ${b} ${q[2]} ${q[3]} Q${R} ${t} ${R} ${t + 13}`;
}
/** A glyph is a set of centreline paths. Strokes are applied once to the run. */
export function glyphPaths(char: string, type: LetteringType): string[] {
  const kind = curveFor(type, char);
  const oval = kind === 'oval';
  switch (char) {
    case '0': return [loop(kind, L + 2, T, R - 2, B)];
    case 'O': return [loop(kind, L, T, R, B)];
    case 'Q': return [loop(kind, L, T, R, B), 'M32 72 L51 94'];
    case 'C': return [cCurve(kind)];
    case 'G': return [cCurve(kind), 'M49 80 V53 H30'];
    case 'D': return [`M${L} ${B} V${T}`, rightBowl(kind, T, B)];
    case 'B': return [`M${L} ${B} V${T}`, rightBowl(kind, T, 49), rightBowl(kind, 49, B)];
    case 'P': return [`M${L} ${B} V${T}`, rightBowl(kind, T, 51)];
    case 'R': return [`M${L} ${B} V${T}`, rightBowl(kind, T, 51), 'M28 51 L49 93'];
    case 'S': return [kind === 'squarish'
      ? 'M49 19 V13 Q49 7 43 7 H13 Q7 7 7 13 V42 Q7 49 14 49 H42 Q49 49 49 56 V87 Q49 93 43 93 H13 Q7 93 7 87 V81'
      : 'M49 20 C49 1 7 1 7 28 C7 49 21 45 28 50 C35 55 49 52 49 73 C49 101 7 101 7 80'];
    case '1': return ['M16 23 L29 7 V93 M13 93 H45'];
    case '2': return [kind === 'squarish'
      ? 'M7 22 V13 Q7 7 13 7 H43 Q49 7 49 13 V35 Q49 41 42 48 L7 86 V93 H49'
      : `M7 27 C7 ${oval ? -1 : 0} 49 ${oval ? -1 : 0} 49 27 C49 41 38 49 28 61 L7 87 V93 H49`];
    case '3': return [rightBowl(kind, T, 49, 11), rightBowl(kind, 49, B, 11)];
    case '4': return ['M39 93 V7 L7 66 H50'];
    case '5': return [`M49 7 H7 V49 H28 ${quadrants(kind, L, 49, R, B).slice(0, 3).join(' ')}`];
    case '6': return [loop(kind, L, 46, R, B), oval ? 'M7 69 C5 37 30 15 45 7' : 'M7 69 V28 Q7 7 28 7 H40'];
    case '7': return ['M7 7 H49 L16 93'];
    case '8': return [loop(kind, L + 2, T, R - 2, 49), loop(kind, L, 49, R, B)];
    case '9': return [loop(kind, L, T, R, 54), oval ? 'M49 30 C51 60 27 85 12 93' : 'M49 30 V72 Q49 93 28 93 H16'];
    case 'A': return ['M6 93 L28 7 L50 93 M15 62 H41'];
    case 'E': return ['M49 7 H7 V93 H49 M7 49 H40'];
    case 'F': return ['M49 7 H7 V93 M7 49 H40'];
    case 'H': return ['M7 7 V93 M49 7 V93 M7 49 H49'];
    case 'I': return ['M12 7 H44 M28 7 V93 M12 93 H44'];
    case 'J': return [`M49 7 V72 Q49 93 28 93 Q7 93 7 72 M27 7 H49`];
    case 'K': return ['M7 7 V93 M49 7 L7 54 M26 34 L49 93'];
    case 'L': return ['M7 7 V93 H49'];
    case 'M': return ['M7 93 V7 L28 52 L49 7 V93'];
    case 'N': return ['M7 93 V7 L49 93 V7'];
    case 'T': return ['M5 7 H51 M28 7 V93'];
    case 'U': return [`M7 7 V72 Q7 93 28 93 Q49 93 49 72 V7`];
    case 'V': return ['M6 7 L28 93 L50 7'];
    case 'W': return ['M5 7 L14 93 L28 49 L42 93 L51 7'];
    case 'X': return ['M7 7 L49 93 M49 7 L7 93'];
    case 'Y': return ['M7 7 L28 48 L49 7 M28 48 V93'];
    case 'Z': return ['M7 7 H49 L7 93 H49'];
    case '-': return ['M6 49 H22'];
    case '.': case '·': return [char === '.' ? 'M12 89 H13' : 'M12 49 H13'];
    case ' ': return [];
    default: throw new RangeError(`Unsupported procedural glyph: ${char}`);
  }
}
export interface LetteringProps {
  text: string;
  type: LetteringType;
  centerX: number;
  baseline: number;
  height: number;
  maxWidth: number;
  ink: string;
  role?: string;
}
export function letteringLayout(text: string, height: number, maxWidth: number) {
  if (!Number.isFinite(height) || !Number.isFinite(maxWidth) || height <= 0 || maxWidth <= 0) throw new RangeError('Lettering dimensions must be positive and finite.');
  const widths = [...text].map((char) => /[ .·-]/.test(char) ? 28 : 56);
  const width = widths.reduce((sum, advance) => sum + advance, 0) + Math.max(0, widths.length - 1) * 8;
  const scale = Math.min(height / 100, maxWidth / Math.max(1, width));
  return { widths, width, scale, renderedWidth: width * scale, renderedHeight: 100 * scale };
}
/** Reject unsupported text; adapters use their existing live-text fallback. */
export function buildLettering(p: LetteringProps): SvgNode {
  if (!isLetteringType(p.type) || !supportsLettering(p.text)) throw new RangeError('Unsupported lettering profile or characters.');
  const layout = letteringLayout(p.text, p.height, p.maxWidth);
  let cursor = 0;
  const glyphs = [...p.text].map((char, index) => {
    const glyph = n('g', { transform: `translate(${cursor} 0)`, 'data-character': char, 'data-curve': curveFor(p.type, char) },
      ...glyphPaths(char, p.type).map((d) => n('path', { d })));
    cursor += layout.widths[index] + 8;
    return glyph;
  });
  return n('g', { 'data-role': p.role ?? 'serial', 'data-lettering': p.type, 'data-accuracy': 'category-inspired', role: 'img', 'aria-label': p.text },
    n('title', {}, p.text),
    n('g', { transform: `translate(${p.centerX - layout.renderedWidth / 2} ${p.baseline - layout.renderedHeight}) scale(${layout.scale})`,
      fill: 'none', stroke: p.ink, strokeWidth: 9, strokeLinecap: 'square', strokeLinejoin: 'round' }, ...glyphs),
  );
}
