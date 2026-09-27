/**
 * Text measurement for SVG layout. Uses a canvas when available (exact widths
 * with the real plate fonts) and falls back to an average-advance estimate.
 */
let ctx: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (ctx === undefined) {
    ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  }
  return ctx;
}

export interface FontSpec {
  family: string;
  size: number;
  weight?: number | string;
  letterSpacing?: number;
}

export function measure(text: string, font: FontSpec): number {
  const spacing = (font.letterSpacing ?? 0) * text.length;
  const c = context();
  if (!c) return text.length * font.size * 0.55 + spacing;
  c.font = `${font.weight ?? 400} ${font.size}px ${font.family}`;
  return c.measureText(text).width + spacing;
}

/**
 * Attributes that squeeze text into `maxWidth` if (and only if) it would
 * overflow. Spread onto an SVG <text>.
 */
export function fit(text: string, font: FontSpec, maxWidth: number) {
  const natural = measure(text, font);
  return natural > maxWidth
    ? { width: maxWidth, attrs: { textLength: maxWidth, lengthAdjust: 'spacingAndGlyphs' as const } }
    : { width: natural, attrs: {} };
}

/** A DOM-safe id derived from React's useId(). */
export const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');
