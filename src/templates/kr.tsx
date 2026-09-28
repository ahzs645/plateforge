import { useId, type ReactElement } from 'react';
import type { Parts, PlateTemplate } from '../core/types';
import { splitKrSerial } from '../regions/asia/korea';
import { CONDENSED, FONTS, KR_STACK } from './fonts';
import { measure, safeId } from './measure';

export interface KrDesign {
  [key: string]: unknown;
  /** long 520×110 · short 335×155 · stacked 520×110 with region at left · two-row 335×170. */
  layout?: 'long' | 'short' | 'stacked' | 'two-row';
  variant?: 'white' | 'yellow' | 'ev' | 'green';
  /** Left emblem band: 2020 hologram/taegeuk/KOR, or the eco-vehicle emblem. */
  band?: 'kor' | 'ev';
}

const SIZES = { long: [520, 110], stacked: [520, 110], short: [335, 155], 'two-row': [335, 170] } as const;
const VARIANTS = {
  white: { bg: ['#f4f4f6', '#e4e4ea'], ink: '#17141d' },
  yellow: { bg: ['#ffcb1f', '#f5b800'], ink: '#161616' },
  ev: { bg: ['#7fc2ee', '#dff1fb'], ink: '#111418' },
  green: { bg: ['#b7d84a', '#9cc433'], ink: '#111411' },
} as const;

const layoutOf = (design: KrDesign) => design.layout ?? 'long';

type Box = { x: number; y: number; w: number; h: number };

/** Barlow digit scaled so its cap height fills `h` and its advance roughly fills `w`. */
function digit(ch: string, b: Box, ink: string, key: string | number): ReactElement {
  const size = b.h / 0.7;
  const sx = Math.min(1.35, (b.w * 0.94) / measure('0', { family: CONDENSED, size, weight: 600 }));
  return (
    <text key={key} transform={`translate(${b.x + b.w / 2} ${b.y + b.h}) scale(${sx.toFixed(3)} 1)`} textAnchor="middle" fontFamily={CONDENSED} fontWeight="600" fontSize={size.toFixed(1)} fill={ink}>
      {ch}
    </text>
  );
}

/** Hangul syllable squeezed into its box (the official plate face is narrower than system gothics). */
function hangul(ch: string, b: Box, ink: string, key: string | number): ReactElement {
  // Gothic hangul ink spans ~0.81 em above and ~0.08 em below the baseline, ~0.84 em wide.
  const size = b.h / 0.89;
  const sx = b.w / (size * 0.86);
  return (
    <text key={key} transform={`translate(${b.x + b.w / 2} ${b.y + b.h * 0.91}) scale(${sx.toFixed(3)} 1)`} textAnchor="middle" fontFamily={KR_STACK} fontWeight="700" fontSize={size.toFixed(1)} fill={ink}>
      {ch}
    </text>
  );
}

function taegeuk(cx: number, cy: number, r: number): ReactElement {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0047a0" />
      <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}A${r / 2} ${r / 2} 0 0 1 ${cx} ${cy}A${r / 2} ${r / 2} 0 0 0 ${cx - r} ${cy}Z`} fill="#cd2e3a" />
    </g>
  );
}

/** One row of class digits, hangul and serial laid out on a unit grid; returns glyph boxes. */
function row(cls: string, h: string, num: string, area: { x0: number; x1: number; y: number; ch: number; hh: number }, u: { d: number; h: number; gl: number; gr: number }) {
  const units = (cls.length + num.length) * u.d + u.h + u.gl + u.gr;
  const k = Math.min(1, (area.x1 - area.x0) / units);
  let x = area.x0 + ((area.x1 - area.x0) - units * k) / 2;
  const out: Array<{ ch: string; kind: 'd' | 'h'; box: Box }> = [];
  for (const c of cls) { out.push({ ch: c, kind: 'd', box: { x, y: area.y, w: u.d * k, h: area.ch } }); x += u.d * k; }
  x += u.gl * k;
  out.push({ ch: h, kind: 'h', box: { x, y: area.y + area.ch - area.hh, w: u.h * k, h: area.hh } });
  x += (u.h + u.gr) * k;
  for (const c of num) { out.push({ ch: c, kind: 'd', box: { x, y: area.y, w: u.d * k, h: area.ch } }); x += u.d * k; }
  return out;
}

function KrPlate({ design, parts, text }: { design: KrDesign; parts: Parts; text: string }) {
  const id = safeId(useId());
  const layout = layoutOf(design);
  const [W, H] = SIZES[layout];
  const v = VARIANTS[design.variant ?? 'white'];
  const { cls, hangul: h, number } = splitKrSerial(parts.serial ?? '');
  const region = [...(parts.region ?? '')];
  const band = layout === 'long' ? design.band : undefined;

  const glyphs: ReactElement[] = [];
  const draw = (list: ReturnType<typeof row>) =>
    list.forEach((g, i) => glyphs.push(g.kind === 'h' ? hangul(g.ch, g.box, v.ink, `r${i}`) : digit(g.ch, g.box, v.ink, `r${i}`)));

  if (layout === 'long') {
    // 2006 plate: digits 56 wide, hangul 60, 36 mm gap after the hangul, 83 mm tall; 8-char plates shrink to fit.
    draw(row(cls, h, number, { x0: band ? 54 : 22, x1: band ? 506 : 498, y: 13, ch: 83, hh: 83 }, { d: 56, h: 60, gl: 0, gr: 36 }));
  } else if (layout === 'short') {
    draw(row(cls, h, number, { x0: 8, x1: 327, y: 45, ch: 83, hh: 70 }, { d: 45, h: 49, gl: 2, gr: 2 }));
  } else if (layout === 'stacked') {
    region.slice(0, 2).forEach((c, i) => glyphs.push(hangul(c, { x: 25, y: 13 + i * 42, w: 60, h: 40 }, v.ink, `g${i}`)));
    [...cls].forEach((c, i) => glyphs.push(digit(c, { x: 85 + i * 56, y: 13, w: 56, h: 83 }, v.ink, `c${i}`)));
    glyphs.push(hangul(h, { x: 197, y: 13, w: 60, h: 83 }, v.ink, 'h'));
    [...number].forEach((c, i) => glyphs.push(digit(c, { x: 273 + i * 56, y: 13, w: 56, h: 83 }, v.ink, `n${i}`)));
  } else {
    region.slice(0, 2).forEach((c, i) => glyphs.push(hangul(c, { x: 76 + i * 44, y: 8, w: 44, h: 60 }, v.ink, `g${i}`)));
    [...cls].forEach((c, i) => glyphs.push(digit(c, { x: 172 + i * 44, y: 8, w: 44, h: 60 }, v.ink, `c${i}`)));
    glyphs.push(hangul(h, { x: 8, y: 82, w: 64, h: 62 }, v.ink, 'h'));
    [...number].forEach((c, i) => glyphs.push(digit(c, { x: 72 + i * 64, y: 72, w: 64, h: 90 }, v.ink, `n${i}`)));
  }

  const bolts: Array<[number, number]> =
    layout === 'long' || layout === 'stacked' ? [[13, H / 2], [W - 13, H / 2]]
      : layout === 'short' ? [[62, 22], [W - 62, 22]]
        : [[40, 30], [W - 40, 30]];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2={design.variant === 'ev' ? 1 : 0} y2={design.variant === 'ev' ? 0 : 1}>
          <stop offset="0" stopColor={v.bg[0]} />
          <stop offset="1" stopColor={v.bg[1]} />
        </linearGradient>
        <linearGradient id={`${id}holo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb7f0" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#c9dcf7" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6f9be0" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} rx="8" fill={`url(#${id}bg)`} />
      <rect x="3" y="3" width={W - 6} height={H - 6} rx="6" fill="none" stroke={v.ink} strokeWidth="2.5" />
      {band === 'kor' && (
        <g>
          <rect x="7" y="7" width="38" height={H - 14} rx="3" fill={`url(#${id}holo)`} />
          {taegeuk(26, 34, 11)}
          <text x="26" y="86" textAnchor="middle" fontFamily={CONDENSED} fontWeight="700" fontSize="15" fill="#1d4f9a">KOR</text>
        </g>
      )}
      {band === 'ev' && (
        <g>
          {taegeuk(28, 36, 12)}
          <path d="M14 78h28l-3-8h-22zM18 70l4-7h14l4 7" fill="none" stroke="#1d4f9a" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="20" cy="80" r="3" fill="#1d4f9a" />
          <circle cx="36" cy="80" r="3" fill="#1d4f9a" />
        </g>
      )}
      {bolts.map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="4.5" fill="#000" opacity="0.18" />)}
      {glyphs}
      <rect width={W} height={H} rx="8" fill={`url(#${id}sheen)`} />
    </svg>
  );
}

export const krTemplate: PlateTemplate<KrDesign> = {
  id: 'kr',
  name: 'South Korea (520×110 · 335×155 · 335×170 mm)',
  size: (design) => {
    const [width, height] = SIZES[layoutOf(design)];
    return { width, height };
  },
  render: ({ design, parts, text }) => <KrPlate design={design} parts={parts} text={text} />,
  fonts: [FONTS.barlow600],
};
