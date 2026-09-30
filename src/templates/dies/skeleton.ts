/**
 * Parametric monoline glyph skeletons for stamped plate dies.
 *
 * Embossed plate characters are close to constant-width strokes, so each glyph
 * is a set of centreline paths stroked once per run. A die profile chooses the
 * proportions and the diagnostic shapes (open or closed 4, flagged 1, flat-top
 * 3, straight or curved 7 …) observed in BCpl8s die comparisons. Cap height is
 * always 100 units; the baseline is y = 100.
 */

export type CurveStyle = 'stadium' | 'oval' | 'box';

export interface SkeletonParams {
  /** Advance of a standard digit/letter, in cap-height units (100). */
  width: number;
  /** Stroke weight in cap-height units. */
  stroke: number;
  /** Bowl construction: straight sides with round caps, ellipses, or rounded boxes. */
  curve: CurveStyle;
  /** Corner radius for `box` curves, cap-height units. */
  boxRadius?: number;
  /** Width multiplier for narrow glyphs (1, I) and for wide ones (M, W). */
  narrow?: number;
  wide?: number;
  /** Space between glyphs, cap-height units. */
  tracking: number;
  /** `short-flag`: a short, shallow wedge instead of the long diagonal flag (Waldale). */
  one?: 'plain' | 'flag' | 'flag-base' | 'short-flag';
  two?: 'curved' | 'angled';
  three?: 'round' | 'flat-top';
  four?: 'closed' | 'open';
  /** Short horizontal foot under the 4's stem (ACME). */
  fourFoot?: boolean;
  six?: 'curved' | 'straight';
  /** `bent`: the bar turns down early and the stem finishes near-vertical (Waldale). */
  seven?: 'straight' | 'curved' | 'bent';
  nine?: 'curved' | 'straight';
  zero?: 'plain' | 'narrow';
  /** Bowl construction for individual glyphs that differ from the rest (Waldale's straight-sided 0 and boxy P). */
  glyphCurve?: Readonly<Partial<Record<string, CurveStyle>>>;
  /** `flat`: the A's legs meet in a short flat top, with the bar lower. */
  a?: 'pointed' | 'flat';
  /** `spur`: a short projection to the left at the top of the J. */
  j?: 'plain' | 'spur';
  /** Middle junction height of B, 3, 8 etc. as a fraction of cap height (0.5 = centred). */
  waist?: number;
  /** Width of the dash separator, cap-height units, and its vertical position. */
  dash?: { width: number; y?: number; weight?: number };
  /** Shape of the raised centre dot (·): square punch (default) or round (1951 strip). */
  dot?: 'square' | 'round';
}

export interface SkeletonGlyph {
  advance: number;
  paths: string[];
  /** Stroke weight override for this glyph (e.g. a heavier dash). */
  stroke?: number;
  /** Line-cap override, e.g. round dots on a die that otherwise has square ends. */
  cap?: 'round';
}

const K = 0.5522847498307936;
const f = (v: number) => Math.round(v * 100) / 100;

interface Box { l: number; t: number; r: number; b: number }

/** Four clockwise quarter-segments from top-centre: right, bottom, left, back to top. */
function quarters(p: SkeletonParams, { l, t, r, b }: Box): string[] {
  const cx = (l + r) / 2, cy = (t + b) / 2, rx = (r - l) / 2, ry = (b - t) / 2;
  if (p.curve === 'oval') return [
    `C${f(cx + K * rx)} ${f(t)} ${f(r)} ${f(cy - K * ry)} ${f(r)} ${f(cy)}`,
    `C${f(r)} ${f(cy + K * ry)} ${f(cx + K * rx)} ${f(b)} ${f(cx)} ${f(b)}`,
    `C${f(cx - K * rx)} ${f(b)} ${f(l)} ${f(cy + K * ry)} ${f(l)} ${f(cy)}`,
    `C${f(l)} ${f(cy - K * ry)} ${f(cx - K * rx)} ${f(t)} ${f(cx)} ${f(t)}`,
  ];
  const rad = p.curve === 'box' ? Math.min(p.boxRadius ?? 8, rx, ry) : Math.min(rx, ry);
  const arc = (x: number, y: number) => `A${f(rad)} ${f(rad)} 0 0 1 ${f(x)} ${f(y)}`;
  return [
    `H${f(r - rad)} ${arc(r, t + rad)} V${f(cy)}`,
    `V${f(b - rad)} ${arc(r - rad, b)} H${f(cx)}`,
    `H${f(l + rad)} ${arc(l, b - rad)} V${f(cy)}`,
    `V${f(t + rad)} ${arc(l + rad, t)} H${f(cx)}`,
  ];
}
const loop = (p: SkeletonParams, box: Box) => `M${f((box.l + box.r) / 2)} ${f(box.t)} ${quarters(p, box).join(' ')} Z`;
/** Right-hand bowl from a stem at `from` (B, D, P, R, 3). */
const rightBowl = (p: SkeletonParams, box: Box, from: number) =>
  `M${f(from)} ${f(box.t)} H${f((box.l + box.r) / 2)} ${quarters(p, box).slice(0, 2).join(' ')} H${f(from)}`;

/** Returns the skeleton for one character, or null when the profile has no such glyph. */
export function skeletonGlyph(char: string, params: SkeletonParams): SkeletonGlyph | null {
  const curve = params.glyphCurve?.[char];
  const p = curve ? { ...params, curve } : params;
  const w = p.width, s = p.stroke, h = s / 2;
  const L = h, R = w - h, T = h, B = 100 - h, MX = w / 2;
  const waist = 100 * (p.waist ?? 0.5);
  const full: Box = { l: L, t: T, r: R, b: B };
  const g = (paths: string[], advance = w): SkeletonGlyph => ({ advance, paths });
  const narrowW = w * (p.narrow ?? 0.62);
  const wideW = w * (p.wide ?? 1.18);
  switch (char) {
    // ── Digits ──────────────────────────────────────────────────────────
    case '0': {
      const inset = p.zero === 'narrow' ? w * 0.06 : 0;
      return g([loop(p, { l: L + inset, t: T, r: R - inset, b: B })]);
    }
    case '1': {
      const x = p.one === 'plain' ? narrowW / 2 : narrowW * 0.62;
      // One path so the flag joins the stem instead of capping past it.
      const paths = [p.one === 'plain' ? `M${f(x)} ${f(T)} V${f(B)}`
        : p.one === 'short-flag' ? `M${f(x - 7)} ${f(T + 6)} L${f(x)} ${f(T)} V${f(B)}`
        : `M${f(h + 1)} ${f(T + 18)} L${f(x)} ${f(T)} V${f(B)}`];
      if (p.one === 'flag-base') paths.push(`M${f(h)} ${f(B)} H${f(narrowW - h)}`);
      return g(paths, narrowW);
    }
    case '2':
      return g([p.two === 'angled'
        ? `M${f(L)} ${f(T + 22)} Q${f(L)} ${f(T)} ${f(MX)} ${f(T)} Q${f(R)} ${f(T)} ${f(R)} ${f(T + 24)} Q${f(R)} ${f(waist - 4)} ${f(R - w * 0.1)} ${f(waist + 4)} L${f(L)} ${f(B)} H${f(R)}`
        : `M${f(L)} ${f(T + 18)} C${f(L)} ${f(T - 4)} ${f(R)} ${f(T - 4)} ${f(R)} ${f(T + 26)} C${f(R)} ${f(waist + 6)} ${f(L)} ${f(B - 22)} ${f(L)} ${f(B)} H${f(R)}`]);
    case '3':
      return p.three === 'flat-top'
        ? g([`M${f(L)} ${f(T)} H${f(R)} L${f(MX)} ${f(waist - 4)}`, rightBowl(p, { l: L, t: waist - 4, r: R, b: B }, L + w * 0.12)])
        : g([rightBowl(p, { l: L, t: T, r: R - w * 0.04, b: waist }, L + w * 0.12), rightBowl(p, { l: L, t: waist, r: R, b: B }, L + w * 0.12)]);
    case '4': {
      const stem = R - w * 0.2, bar = 68;
      const foot = p.fourFoot ? [`M${f(stem - w * 0.16)} ${f(B)} H${f(Math.min(R, stem + w * 0.16))}`] : [];
      return g([...(p.four === 'open'
        ? [`M${f(L + w * 0.08)} ${f(T)} L${f(L)} ${f(bar)} H${f(R)}`, `M${f(stem)} ${f(T + 18)} V${f(B)}`]
        : [`M${f(stem)} ${f(B)} V${f(T)} L${f(L)} ${f(bar)} H${f(R)}`]), ...foot]);
    }
    case '5': {
      const bowl = quarters(p, { l: L, t: 42, r: R, b: B });
      return g([`M${f(R)} ${f(T)} H${f(L + 2)} L${f(L)} ${f(46)} H${f(MX)} ${bowl.slice(0, 2).join(' ')} H${f(L + w * 0.18)} Q${f(L)} ${f(B)} ${f(L)} ${f(B - 12)}`]);
    }
    case '6': {
      const bowl: Box = { l: L, t: 42, r: R, b: B };
      return g([loop(p, bowl), p.six === 'straight'
        ? `M${f(L)} ${f(71)} V${f(T + 22)} Q${f(L)} ${f(T)} ${f(MX)} ${f(T)} H${f(R - 4)}`
        : `M${f(L)} ${f(71)} C${f(L - 2)} ${f(34)} ${f(MX - 4)} ${f(T + 4)} ${f(R - 6)} ${f(T)}`]);
    }
    case '7':
      return g([p.seven === 'curved'
        ? `M${f(L)} ${f(T)} H${f(R)} C${f(R - w * 0.08)} ${f(38)} ${f(MX - 2)} ${f(62)} ${f(MX - 4)} ${f(B)}`
        : p.seven === 'bent'
          ? `M${f(L)} ${f(T)} H${f(R)} C${f(MX + 4.5)} ${f(30)} ${f(MX - 3.5)} ${f(57)} ${f(MX - 3.5)} ${f(B)}`
          : `M${f(L)} ${f(T)} H${f(R)} L${f(L + w * 0.28)} ${f(B)}`]);
    case '8':
      return g([loop(p, { l: L + w * 0.05, t: T, r: R - w * 0.05, b: waist }), loop(p, { l: L, t: waist, r: R, b: B })]);
    case '9': {
      const bowl: Box = { l: L, t: T, r: R, b: 58 };
      return g([loop(p, bowl), p.nine === 'straight'
        ? `M${f(R)} ${f(29)} V${f(B - 22)} Q${f(R)} ${f(B)} ${f(MX)} ${f(B)} H${f(L + 4)}`
        : `M${f(R)} ${f(29)} C${f(R + 2)} ${f(66)} ${f(MX + 4)} ${f(B - 4)} ${f(L + 6)} ${f(B)}`]);
    }
    // ── Letters ─────────────────────────────────────────────────────────
    case 'A': {
      if (p.a !== 'flat') return g([`M${f(L)} ${f(B)} L${f(MX)} ${f(T)} L${f(R)} ${f(B)}`, `M${f(L + w * 0.17)} ${f(66)} H${f(R - w * 0.17)}`]);
      // The bar sits lower, at 70; its square caps end on the legs' centrelines.
      const top = w * 0.06, bar = 70, inset = (MX - top - L) * (B - bar) / (B - T) + h;
      return g([`M${f(L)} ${f(B)} L${f(MX - top)} ${f(T)} H${f(MX + top)} L${f(R)} ${f(B)}`, `M${f(L + inset)} ${f(bar)} H${f(R - inset)}`]);
    }
    case 'B': return g([`M${f(L)} ${f(B)} V${f(T)}`, rightBowl(p, { l: L, t: T, r: R - w * 0.05, b: waist }, L), rightBowl(p, { l: L, t: waist, r: R, b: B }, L)]);
    case 'C': return g([openBowl(p, full)]);
    case 'D': return g([`M${f(L)} ${f(B)} V${f(T)}`, rightBowl(p, full, L)]);
    case 'E': return g([`M${f(R)} ${f(T)} H${f(L)} V${f(B)} H${f(R)}`, `M${f(L)} ${f(waist)} H${f(R - w * 0.14)}`]);
    case 'F': return g([`M${f(R)} ${f(T)} H${f(L)} V${f(B)}`, `M${f(L)} ${f(waist)} H${f(R - w * 0.14)}`]);
    case 'G': return g([skeletonGlyph('C', p)!.paths[0], `M${f(R)} ${f(B - 20)} V${f(56)} H${f(MX + 2)}`]);
    case 'H': return g([`M${f(L)} ${f(T)} V${f(B)}`, `M${f(R)} ${f(T)} V${f(B)}`, `M${f(L)} ${f(waist)} H${f(R)}`]);
    case 'I': return g([`M${f(narrowW / 2)} ${f(T)} V${f(B)}`], narrowW);
    // The spur is a separate subpath so the stem keeps its square top corner.
    case 'J': return g([`${p.j === 'spur' ? `M${f(R - s * 0.35)} ${f(T)} H${f(R)} ` : ''}M${f(R)} ${f(T)} V${f(B - 24)} Q${f(R)} ${f(B)} ${f(MX)} ${f(B)} Q${f(L)} ${f(B)} ${f(L)} ${f(B - 24)}`]);
    case 'K': return g([`M${f(L)} ${f(T)} V${f(B)}`, `M${f(R)} ${f(T)} L${f(L)} ${f(62)}`, `M${f(L + w * 0.3)} ${f(46)} L${f(R)} ${f(B)}`]);
    case 'L': return g([`M${f(L)} ${f(T)} V${f(B)} H${f(R)}`]);
    case 'M': {
      const r2 = wideW - h;
      return g([`M${f(L)} ${f(B)} V${f(T)} L${f(wideW / 2)} ${f(64)} L${f(r2)} ${f(T)} V${f(B)}`], wideW);
    }
    case 'N': return g([`M${f(L)} ${f(B)} V${f(T)} L${f(R)} ${f(B)} V${f(T)}`]);
    case 'O': return g([loop(p, full)]);
    case 'P': return g([`M${f(L)} ${f(B)} V${f(T)}`, rightBowl(p, { l: L, t: T, r: R, b: waist + 4 }, L)]);
    case 'Q': return g([loop(p, full), `M${f(MX + 4)} ${f(72)} L${f(R + 1)} ${f(B + 2)}`]);
    // The leg starts inside the bowl's lower stroke so its square cap can't poke into the counter.
    case 'R': return g([`M${f(L)} ${f(B)} V${f(T)}`, rightBowl(p, { l: L, t: T, r: R, b: waist + 2 }, L), `M${f(MX - h)} ${f(waist + 2)} H${f(MX)} L${f(R)} ${f(B)}`]);
    case 'S': return g([p.curve === 'box'
      ? `M${f(R)} ${f(T + 14)} V${f(T + (p.boxRadius ?? 8))} Q${f(R)} ${f(T)} ${f(R - 8)} ${f(T)} H${f(L + 8)} Q${f(L)} ${f(T)} ${f(L)} ${f(T + 8)} V${f(waist - 8)} Q${f(L)} ${f(waist)} ${f(L + 8)} ${f(waist)} H${f(R - 8)} Q${f(R)} ${f(waist)} ${f(R)} ${f(waist + 8)} V${f(B - 8)} Q${f(R)} ${f(B)} ${f(R - 8)} ${f(B)} H${f(L + 8)} Q${f(L)} ${f(B)} ${f(L)} ${f(B - 8)} V${f(B - 14)}`
      : `M${f(R)} ${f(T + 16)} C${f(R)} ${f(T - 4)} ${f(L)} ${f(T - 4)} ${f(L)} ${f(T + 24)} C${f(L)} ${f(waist - 2)} ${f(R)} ${f(waist - 4)} ${f(R)} ${f(B - 24)} C${f(R)} ${f(B + 4)} ${f(L)} ${f(B + 4)} ${f(L)} ${f(B - 16)}`]);
    case 'T': return g([`M${f(h)} ${f(T)} H${f(w - h)}`, `M${f(MX)} ${f(T)} V${f(B)}`]);
    case 'U': return g([`M${f(L)} ${f(T)} ${cup(p, full)} V${f(T)}`]);
    case 'V': return g([`M${f(L)} ${f(T)} L${f(MX)} ${f(B)} L${f(R)} ${f(T)}`]);
    case 'W': {
      const r2 = wideW - h;
      return g([`M${f(L)} ${f(T)} L${f(wideW * 0.27)} ${f(B)} L${f(wideW / 2)} ${f(34)} L${f(wideW * 0.73)} ${f(B)} L${f(r2)} ${f(T)}`], wideW);
    }
    case 'X': return g([`M${f(L)} ${f(T)} L${f(R)} ${f(B)}`, `M${f(R)} ${f(T)} L${f(L)} ${f(B)}`]);
    case 'Y': return g([`M${f(L)} ${f(T)} L${f(MX)} ${f(waist)} L${f(R)} ${f(T)}`, `M${f(MX)} ${f(waist)} V${f(B)}`]);
    case 'Z': return g([`M${f(L)} ${f(T)} H${f(R)} L${f(L)} ${f(B)} H${f(R)}`]);
    // ── Separators ──────────────────────────────────────────────────────
    case '-': {
      const d = p.dash ?? { width: w * 0.42 };
      return { advance: d.width + s, paths: [`M${f(h)} ${f(d.y ?? 52)} H${f(d.width + h)}`], ...(d.weight ? { stroke: d.weight } : {}) };
    }
    case '·': return p.dot === 'round'
      ? { advance: s * 1.9, paths: [`M${f(s * 0.95)} ${f(52)} h0.01`], stroke: f(s * 1.25), cap: 'round' }
      : g([`M${f(s * 0.8)} ${f(52)} h0.01`], s * 1.6);
    // Long raised bar used in front of four-digit numbers (1933–39).
    case '‒': return g([`M${f(h)} ${f(p.dash?.y ?? 52)} H${f(w * 0.9)}`], w * 0.9 + h);
    case '.': return g([`M${f(s * 0.8)} ${f(B)} h0.01`], s * 1.6);
    case '&': return null;
    case ' ': return g([], w * 0.45);
    default: return null;
  }
}

/** Counter-clockwise quarters from top-centre: to left, to bottom, to right, back to top. */
function ccwQuarters(p: SkeletonParams, { l, t, r, b }: Box): string[] {
  const cx = (l + r) / 2, cy = (t + b) / 2, rx = (r - l) / 2, ry = (b - t) / 2;
  if (p.curve === 'oval') return [
    `C${f(cx - K * rx)} ${f(t)} ${f(l)} ${f(cy - K * ry)} ${f(l)} ${f(cy)}`,
    `C${f(l)} ${f(cy + K * ry)} ${f(cx - K * rx)} ${f(b)} ${f(cx)} ${f(b)}`,
  ];
  const rad = p.curve === 'box' ? Math.min(p.boxRadius ?? 8, rx, ry) : Math.min(rx, ry);
  return [
    `H${f(l + rad)} A${f(rad)} ${f(rad)} 0 0 0 ${f(l)} ${f(t + rad)} V${f(cy)}`,
    `V${f(b - rad)} A${f(rad)} ${f(rad)} 0 0 0 ${f(l + rad)} ${f(b)} H${f(cx)}`,
  ];
}
/** C-shaped bowl with terminals on the right (C, G). */
function openBowl(p: SkeletonParams, box: Box): string {
  const { t, r, b } = box, cx = (box.l + r) / 2;
  const term = Math.min(20, (b - t) * 0.22);
  const [toLeft, toBottom] = ccwQuarters(p, box);
  if (p.curve === 'box') {
    const rad = Math.min(p.boxRadius ?? 8, (r - box.l) / 2);
    return `M${f(r)} ${f(t + term)} V${f(t + rad)} A${f(rad)} ${f(rad)} 0 0 0 ${f(r - rad)} ${f(t)} H${f(cx)} ${toLeft} ${toBottom} H${f(r - rad)} A${f(rad)} ${f(rad)} 0 0 0 ${f(r)} ${f(b - rad)} V${f(b - term)}`;
  }
  return `M${f(r)} ${f(t + term)} Q${f(r)} ${f(t)} ${f(cx)} ${f(t)} ${toLeft} ${toBottom} Q${f(r)} ${f(b)} ${f(r)} ${f(b - term)}`;
}
/** U-shaped bottom: from the left side at the current point, round the base, up to the right side. */
function cup(p: SkeletonParams, { l, r, b }: Box): string {
  const cx = (l + r) / 2, rx = (r - l) / 2;
  if (p.curve === 'box') {
    const rad = Math.min(p.boxRadius ?? 8, rx);
    return `V${f(b - rad)} A${f(rad)} ${f(rad)} 0 0 0 ${f(l + rad)} ${f(b)} H${f(r - rad)} A${f(rad)} ${f(rad)} 0 0 0 ${f(r)} ${f(b - rad)}`;
  }
  if (p.curve === 'oval') {
    const ry = rx * 1.15;
    return `V${f(b - ry)} C${f(l)} ${f(b - ry + K * ry)} ${f(cx - K * rx)} ${f(b)} ${f(cx)} ${f(b)} C${f(cx + K * rx)} ${f(b)} ${f(r)} ${f(b - ry + K * ry)} ${f(r)} ${f(b - ry)}`;
  }
  return `V${f(b - rx)} A${f(rx)} ${f(rx)} 0 0 0 ${f(r)} ${f(b - rx)}`;
}
