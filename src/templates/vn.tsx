import { useId } from 'react';
import type { Parts, PlateTemplate } from '../core/types';
import { CONDENSED, FONTS } from './fonts';
import { fit, safeId } from './measure';

export interface VnDesign {
  [key: string]: unknown;
  /** long 520×110 · short two-row 330×165 · moto two-row 190×140. */
  layout?: 'long' | 'short' | 'moto';
  variant?: 'white' | 'yellow' | 'blue';
}

const SIZES = { long: [520, 110], short: [330, 165], moto: [190, 140] } as const;
const VARIANTS = {
  white: { bg: ['#f7f7f5', '#e6e6e2'], ink: '#141414' },
  yellow: { bg: ['#ffd52e', '#f2bd0c'], ink: '#141414' },
  blue: { bg: ['#1f5bb8', '#123f8c'], ink: '#f7f7f7' },
} as const;

const layoutOf = (design: VnDesign) => design.layout ?? 'long';

/** Barlow Condensed cap height is ~0.7 em; size so digits stand `h` tall, squeezed into `maxW` if needed. */
function Line({ text, cx, bottom, h, maxW, ink }: { text: string; cx: number; bottom: number; h: number; maxW: number; ink: string }) {
  const font = { family: CONDENSED, size: h / 0.7, weight: 600, letterSpacing: h * 0.04 };
  const f = fit(text, font, maxW);
  return (
    <text x={cx} y={bottom} textAnchor="middle" fontFamily={font.family} fontWeight={font.weight} fontSize={font.size.toFixed(1)} letterSpacing={font.letterSpacing.toFixed(1)} fill={ink} {...f.attrs}>
      {text}
    </text>
  );
}

function VnPlate({ design, parts, text }: { design: VnDesign; parts: Parts; text: string }) {
  const id = safeId(useId());
  const layout = layoutOf(design);
  const [W, H] = SIZES[layout];
  const v = VARIANTS[design.variant ?? 'white'];
  const { province = '', series = '', number = '' } = parts;
  const stroke = layout === 'moto' ? 3 : 4;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v.bg[0]} />
          <stop offset="1" stopColor={v.bg[1]} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} rx="9" fill={`url(#${id}bg)`} />
      {/* Pressed raised rim, painted in the character colour. */}
      <rect x={stroke + 2} y={stroke + 2} width={W - 2 * stroke - 4} height={H - 2 * stroke - 4} rx="7" fill="none" stroke={v.ink} strokeWidth={stroke} />
      {layout === 'long' && <Line text={`${province}${series}-${number}`} cx={W / 2} bottom={90} h={70} maxW={W - 64} ink={v.ink} />}
      {layout === 'short' && (
        <>
          <Line text={`${province}${series}`} cx={W / 2} bottom={76} h={56} maxW={W - 80} ink={v.ink} />
          <Line text={number} cx={W / 2} bottom={147} h={56} maxW={W - 50} ink={v.ink} />
        </>
      )}
      {layout === 'moto' && (
        <>
          <Line text={`${province}-${series}`} cx={W / 2} bottom={63} h={45} maxW={W - 40} ink={v.ink} />
          <Line text={number} cx={W / 2} bottom={124} h={45} maxW={W - 30} ink={v.ink} />
        </>
      )}
      <rect width={W} height={H} rx="9" fill={`url(#${id}sheen)`} />
    </svg>
  );
}

export const vnTemplate: PlateTemplate<VnDesign> = {
  id: 'vn',
  name: 'Vietnam (520×110 · 330×165 · 190×140 mm)',
  size: (design) => {
    const [width, height] = SIZES[layoutOf(design)];
    return { width, height };
  },
  render: ({ design, parts, text }) => <VnPlate design={design} parts={parts} text={text} />,
  fonts: [FONTS.barlow600],
};
