import { useId } from 'react';
import type { PlateTemplate } from '../core/types';
import { CJK_STACK, CONDENSED, FONTS } from './fonts';
import { measure, safeId } from './measure';

export interface CnDesign {
  [key: string]: unknown;
  variant?: 'blue' | 'yellow' | 'black' | 'white' | 'nev' | 'nevLarge';
  /** 2 = the 440×220 two-row rear plate (large vehicles, trailers). */
  rows?: 1 | 2;
  /** Characters before the separator: 2 normally, 1 police, 3 embassy, 4 consulate. */
  separatorAfter?: number;
  /** Police rear plates use a dash instead of the dot. */
  separator?: 'dot' | 'dash';
  /** Character indices painted red; negative indices count from the end (警 = -1). */
  red?: readonly number[];
  /** Legacy alias for `red: [-1]`. */
  accentLast?: boolean;
  /** Large NEV rear plate: bolt slots 240 mm apart instead of 210 (GA 36-2018 fig. 8). */
  rearSlots?: boolean;
}

export interface Box { x: number; y: number; w: number; h: number }
export interface CnLayout {
  width: number;
  height: number;
  boxes: Box[];
  /** Centre of the separator dot/dash (absent on NEV plates, which carry the emblem instead). */
  separator?: { x: number; y: number; r: number };
  emblem?: { x: number; y: number };
  slots: { top: readonly number[]; bottom: readonly number[] };
}

const VARIANTS = {
  blue: { bg: ['#0a2c8f', '#001b7a'], ink: '#ffffff', frame: '#ffffff' },
  yellow: { bg: ['#ffc81a', '#f5ae00'], ink: '#111111', frame: '#111111' },
  black: { bg: ['#1f1f1f', '#050505'], ink: '#ffffff', frame: '#ffffff' },
  white: { bg: ['#ffffff', '#ececec'], ink: '#111111', frame: '#111111' },
  nev: { bg: ['#e4fef0', '#05d968'], ink: '#111111', frame: '#111111' },
  nevLarge: { bg: ['#feaa00', '#feaa00'], ink: '#111111', frame: '#111111' },
} as const;
const RED = '#d7141a';

/** Row of boxes with a wider gap after `split` characters. */
function row(x0: number, y: number, h: number, widths: number[], gap: number, splitGap: number, split: number): Box[] {
  let x = x0;
  return widths.map((w, i) => {
    if (i > 0) x += i === split ? splitGap : gap;
    const box = { x, y, w, h };
    x += w;
    return box;
  });
}

/** Character boxes, separator, emblem and bolt slots in millimetres, from the GA 36-2018 drawings (figs 1–8). */
export function cnLayout(design: CnDesign, count: number): CnLayout {
  const variant = design.variant ?? 'blue';
  if (design.rows === 2) {
    // Fig. 6: 80×60 province and authority on top, 65×110 serial boxes below at a 15 mm pitch gap.
    const n = Math.max(0, count - 2);
    const x0 = (440 - (n * 65 + (n - 1) * 15)) / 2;
    const bottom = Array.from({ length: n }, (_, i) => ({ x: x0 + i * 80, y: 90, w: 65, h: 110 }));
    return {
      width: 440, height: 220,
      boxes: [{ x: 110, y: 15, w: 80, h: 60 }, { x: 250, y: 15, w: 80, h: 60 }, ...bottom].slice(0, count),
      separator: { x: 220, y: 45, r: 5 },
      slots: { top: [92.5, 347.5], bottom: [107.5, 332.5] },
    };
  }
  if (variant === 'nev' || variant === 'nevLarge') {
    // Figs 7–8: 45 mm province, 43 mm for the rest, 9 mm gaps, 49 mm gap for the emblem.
    const boxes = row(15.5, 25, 90, Array.from({ length: count }, (_, i) => (i === 0 ? 45 : 43)), 9, 49, 2);
    const slots = design.rearSlots ? [112.5, 367.5] : [127.5, 352.5];
    return { width: 480, height: 140, boxes, emblem: { x: 15.5 + 45 + 9 + 43 + 24.5, y: 70 }, slots: { top: slots, bottom: slots } };
  }
  // Figs 1–5: 45×90 boxes, 12 mm gaps, 34 mm separator gap (12+10+12, police 10+14+10 or 9+16+9).
  const split = design.separatorAfter ?? 2;
  const boxes = row(split > 2 ? 15.5 : 15, 25, 90, Array(count).fill(45), 12, 34, split);
  const before = boxes[split - 1];
  const r = split === 1 && design.separator !== 'dash' ? 7 : 5;
  return {
    width: 440, height: 140, boxes,
    separator: before && split < count ? { x: before.x + before.w + 17, y: 70, r } : undefined,
    slots: { top: [107.5, 332.5], bottom: [107.5, 332.5] },
  };
}

const isCjk = (ch: string) => ch.charCodeAt(0) > 0x2e80;

function Glyph({ ch, box, fill }: { ch: string; box: Box; fill: string }) {
  const cx = box.x + box.w / 2;
  if (isCjk(ch)) {
    // System CJK faces: ideograph ink ≈ 0.95 em tall, reaching ~0.07 em below the baseline.
    const sx = box.w / 92;
    const sy = box.h / 95;
    return (
      <text transform={`translate(${cx} ${box.y + box.h - 7 * sy}) scale(${sx} ${sy})`} textAnchor="middle" fontFamily={CJK_STACK} fontWeight="700" fontSize="100" fill={fill}>
        {ch}
      </text>
    );
  }
  // Barlow Condensed digits are ~0.75 em tall and digits 0.47 em wide: stretch to the box, squeeze wide letters.
  const font = { family: CONDENSED, size: 100, weight: 600 };
  const sx = Math.min(box.w / (measure(ch, font) || 47), box.w / 47);
  return (
    <text transform={`translate(${cx} ${box.y + box.h}) scale(${sx} ${box.h / 75})`} textAnchor="middle" fontFamily={font.family} fontWeight={font.weight} fontSize={font.size} fill={fill}>
      {ch}
    </text>
  );
}

/** Our own simplified new-energy roundel: four colour bands and a plug silhouette. */
function Emblem({ x, y, id }: { x: number; y: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={`${id}em`}>
        <circle r="11.5" />
      </clipPath>
      <circle r="13" fill="#ffffff" stroke="#1a1a1a" strokeWidth="1.4" />
      <g clipPath={`url(#${id}em)`}>
        {['#1e6fd9', '#e53935', '#f7b500', '#2e9d44'].map((c, i) => (
          <rect key={c} x="-12" y={-12 + i * 6} width="10" height="6" fill={c} />
        ))}
      </g>
      <path d="M-1 -7.5h4.5a7.5 7.5 0 0 1 0 15H-1z" fill="#1a1a1a" />
      <rect x="9" y="-5" width="4" height="2.4" rx="0.6" fill="#1a1a1a" />
      <rect x="9" y="2.6" width="4" height="2.4" rx="0.6" fill="#1a1a1a" />
    </g>
  );
}

function CnPlate({ design, parts, text }: { design: CnDesign; parts: Record<string, string>; text: string }) {
  const id = safeId(useId());
  const variant = design.variant ?? 'blue';
  const v = VARIANTS[variant];
  const chars = [...`${parts.province ?? ''}${parts.city ?? ''}${parts.org ?? ''}${parts.serial ?? ''}`];
  const L = cnLayout(design, chars.length);
  const { width: W, height: H } = L;
  const nev = variant === 'nev' || variant === 'nevLarge';
  const red = new Set((design.red ?? (design.accentLast ? [-1] : [])).map((i) => (i < 0 ? chars.length + i : i)));
  const inset = nev ? 3 : 2.25;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v.bg[0]} />
          <stop offset={variant === 'nev' ? 0.2 : 0} stopColor={v.bg[0]} />
          <stop offset="1" stopColor={v.bg[1]} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} rx="10" fill={`url(#${id}bg)`} />
      {variant === 'nevLarge' && L.emblem && (
        // Hard yellow/green split just after the authority code (GA 36-2018 fig. B.4).
        <rect x={L.emblem.x} y="7" width={W - L.emblem.x - 7} height={H - 14} rx="6" fill="#13d76d" />
      )}
      <rect x={inset} y={inset} width={W - inset * 2} height={H - inset * 2} rx={10 - inset} fill="none" stroke={v.frame} strokeWidth={nev ? 2 : 1.5} />
      {[...L.slots.top.map((x) => [x, 12.5]), ...L.slots.bottom.map((x) => [x, H - 13])].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 7.5} y={y - 4} width="15" height="8" rx="4" fill="#f4f4f4" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
      ))}
      {chars.map((ch, i) => L.boxes[i] && <Glyph key={i} ch={ch} box={L.boxes[i]} fill={red.has(i) ? RED : v.ink} />)}
      {L.separator &&
        (design.separator === 'dash' ? (
          <rect x={L.separator.x - 8} y={L.separator.y - 3} width="16" height="6" rx="1" fill={v.ink} />
        ) : (
          <circle cx={L.separator.x} cy={L.separator.y} r={L.separator.r} fill={v.ink} />
        ))}
      {L.emblem && <Emblem x={L.emblem.x} y={L.emblem.y} id={id} />}
      <rect width={W} height={H} rx="10" fill={`url(#${id}sheen)`} />
    </svg>
  );
}

export const cnTemplate: PlateTemplate<CnDesign> = {
  id: 'cn',
  name: 'China GA 36-2018 (440×140 / 480×140 / 440×220 mm)',
  size: (d) => ({ width: d.variant === 'nev' || d.variant === 'nevLarge' ? 480 : 440, height: d.rows === 2 ? 220 : 140 }),
  render: ({ design, parts, text }) => <CnPlate design={design} parts={parts} text={text} />,
  fonts: [FONTS.barlow600],
};
