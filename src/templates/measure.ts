/** SVG text measurement. Font selection mirrors rendering; estimates are SSR-only. */
let ctx: CanvasRenderingContext2D | null | undefined;
function context(): CanvasRenderingContext2D | null {
  if (ctx === undefined) ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  return ctx;
}
export interface FontSpec {
  family: string;
  size: number;
  weight?: number | string;
  style?: 'normal' | 'italic' | 'oblique';
  letterSpacing?: number;
}
export function canvasFont(font: FontSpec): string {
  if (!(Number.isFinite(font.size) && font.size > 0) || !font.family.trim()) throw new RangeError('Font size must be positive and finite, with a family');
  return `${font.style ?? 'normal'} ${font.weight ?? 400} ${font.size}px ${font.family}`;
}
function prepared(font: FontSpec): CanvasRenderingContext2D | null {
  const css = canvasFont(font), c = context();
  if (c) {
    c.font = css;
    // Tracking is accounted for once below, not inherited from a prior measurement.
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    if ('wordSpacing' in c) c.wordSpacing = '0px';
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
  return c;
}
export function measure(text: string, font: FontSpec): number {
  const tracking = font.letterSpacing ?? 0;
  if (!Number.isFinite(tracking)) throw new RangeError('Letter spacing must be finite');
  // Keep the existing SVG advance convention (including final tracking). Ink bounds are separate.
  const count = [...text].length, spacing = tracking * count, c = prepared(font);
  return (c ? c.measureText(text).width : count * font.size * 0.55) + spacing;
}
export function inkExtent(text: string, font: FontSpec): { ascent: number; descent: number } {
  const c = prepared(font);
  if (!text) return { ascent: 0, descent: 0 };
  if (!c) return { ascent: font.size * 0.72, descent: 0 };
  const m = c.measureText(text);
  return { ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
}
/** Existing live-text fitting is intentionally retained, not relabelled as native die geometry. */
export function fit(text: string, font: FontSpec, maxWidth: number) {
  if (!(Number.isFinite(maxWidth) && maxWidth > 0)) throw new RangeError('Text slot width must be positive and finite');
  const natural = measure(text, font);
  return natural > maxWidth
    ? { width: maxWidth, attrs: { textLength: maxWidth, lengthAdjust: 'spacingAndGlyphs' as const } }
    : { width: natural, attrs: {} };
}
export const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');
