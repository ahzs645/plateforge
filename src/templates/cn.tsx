import { useId } from 'react';
import type { PlateTemplate } from '../core/types';
import { CJK_STACK, CONDENSED, FONTS } from './fonts';
import { measure, safeId } from './measure';

export interface CnDesign {
  [key: string]: unknown;
  variant?: 'blue' | 'yellow' | 'black' | 'nev' | 'nevLarge';
  /** Paint the last character red (driving school 学). */
  accentLast?: boolean;
}

const VARIANTS = {
  blue: { bg: ['#2466d8', '#0d3f9f'], ink: '#ffffff', frame: '#ffffff', dot: true },
  yellow: { bg: ['#fbd02a', '#e9b40c'], ink: '#111111', frame: '#111111', dot: true },
  black: { bg: ['#262626', '#050505'], ink: '#ffffff', frame: '#ffffff', dot: true },
  nev: { bg: ['#f6fbf6', '#3fae55'], ink: '#111111', frame: null, dot: false },
  nevLarge: { bg: ['#f4d63b', '#44ad53'], ink: '#111111', frame: null, dot: false },
} as const;

const H = 140;
const isCjk = (ch: string) => ch.charCodeAt(0) > 0x2e80;

function CnPlate({ design, parts, text }: { design: CnDesign; parts: Record<string, string>; text: string }) {
  const id = safeId(useId());
  const variant = design.variant ?? 'blue';
  const v = VARIANTS[variant];
  const W = variant.startsWith('nev') ? 480 : 440;
  const chars = [...`${parts.province ?? ''}${parts.city ?? ''}${parts.serial ?? ''}`];

  // GA 36 layout: fixed-width glyph cells with a wider gap after the authority code.
  const margin = 15;
  const gap = chars.length > 7 ? 9 : 12;
  const dotGap = 34;
  const cell = (W - margin * 2 - dotGap - gap * (chars.length - 2)) / chars.length;
  const gapsBefore = (i: number) => (i <= 1 ? i * gap : (i - 1) * gap + dotGap);
  const xOf = (i: number) => margin + i * cell + gapsBefore(i) + cell / 2;
  const top = 25;
  const baseline = 115;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v.bg[0]} />
          <stop offset="1" stopColor={v.bg[1]} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} rx="12" fill={`url(#${id}bg)`} />
      {v.frame && <rect x="6" y="6" width={W - 12} height={H - 12} rx="8" fill="none" stroke={v.frame} strokeWidth="3" />}
      {[0.22, 0.78].map((p) => (
        <circle key={p} cx={W * p} cy="14" r="4.5" fill="#000" opacity="0.25" />
      ))}
      {chars.map((ch, i) => {
        const fill = design.accentLast && i === chars.length - 1 ? '#c8102e' : v.ink;
        if (isCjk(ch)) {
          return (
            <text key={i} transform={`translate(${xOf(i)} ${baseline - 6}) scale(1 1.55)`} textAnchor="middle" fontFamily={CJK_STACK} fontWeight="700" fontSize="52" fill={fill}>
              {ch}
            </text>
          );
        }
        const font = { family: CONDENSED, size: 100, weight: 600 };
        const w = measure(ch, font);
        return (
          <text
            key={i}
            transform={`translate(${xOf(i)} ${baseline}) scale(1 1.27)`}
            textAnchor="middle"
            fontFamily={font.family}
            fontWeight={font.weight}
            fontSize={font.size}
            fill={fill}
            {...(w > cell ? { textLength: cell, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
          >
            {ch}
          </text>
        );
      })}
      {v.dot && chars.length > 2 && (
        <circle cx={(xOf(1) + xOf(2)) / 2} cy={(top + baseline) / 2} r="5" fill={v.ink} />
      )}
      <rect width={W} height={H} rx="12" fill={`url(#${id}sheen)`} />
    </svg>
  );
}

export const cnTemplate: PlateTemplate<CnDesign> = {
  id: 'cn',
  name: 'China GA 36 (440×140 mm)',
  size: (d) => ({ width: d.variant?.startsWith('nev') ? 480 : 440, height: H }),
  render: ({ design, parts, text }) => <CnPlate design={design} parts={parts} text={text} />,
  fonts: [FONTS.barlow600],
};
