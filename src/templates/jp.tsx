import { useId } from 'react';
import type { PlateTemplate } from '../core/types';
import { displayNumber } from '../regions/asia/japan';
import { CJK_STACK, CONDENSED, FONTS } from './fonts';
import { fit, measure, safeId } from './measure';

export interface JpDesign {
  [key: string]: unknown;
  bg?: string;
  text?: string;
}

const W = 330;
const H = 165;

function JpPlate({ design, parts, text }: { design: JpDesign; parts: Record<string, string>; text: string }) {
  const id = safeId(useId());
  const bg = design.bg ?? '#fbfbf5';
  const ink = design.text ?? '#0e5a2c';

  // Top row: office name + classification number, centered together.
  const officeFont = { family: CJK_STACK, size: 34, weight: 600 };
  const classFont = { family: CONDENSED, size: 40, weight: 600, letterSpacing: 2 };
  const office = fit(parts.office ?? '', officeFont, 120);
  const cls = parts.classNo ?? '';
  const wc = measure(cls, classFont);
  const topStart = W / 2 - (office.width + 14 + wc) / 2;

  // Bottom row: hiragana + 4-slot number with a middle separator slot.
  const slots = [...displayNumber(parts.number ?? '')];
  const slotW = [52, 52, 24, 52, 52];
  const numLeft = 86;
  const baseline = 151;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} rx="10" fill={bg} />
      <rect x="3" y="3" width={W - 6} height={H - 6} rx="8" fill="none" stroke={ink} strokeOpacity="0.35" strokeWidth="2" />
      {[64, 266].map((cx) => (
        <circle key={cx} cx={cx} cy="20" r="6" fill="#000" opacity="0.22" />
      ))}

      <text x={topStart} y="54" fontFamily={officeFont.family} fontWeight={officeFont.weight} fontSize={officeFont.size} fill={ink} {...office.attrs}>
        {parts.office}
      </text>
      <text x={topStart + office.width + 14} y="56" fontFamily={classFont.family} fontWeight={classFont.weight} fontSize={classFont.size} letterSpacing={classFont.letterSpacing} fill={ink}>
        {cls}
      </text>

      <text x="46" y="134" textAnchor="middle" fontFamily={CJK_STACK} fontWeight="600" fontSize="40" fill={ink}>
        {parts.kana}
      </text>

      {slots.map((ch, i) => {
        const x = numLeft + slotW.slice(0, i).reduce((a, b) => a + b, 0) + slotW[i] / 2;
        if (ch === '・') return <circle key={i} cx={x} cy={baseline - 34} r="7" fill={ink} />;
        if (ch === '-') return <rect key={i} x={x - 9} y={baseline - 40} width="18" height="9" fill={ink} />;
        if (ch === ' ') return null;
        return (
          <text key={i} transform={`translate(${x} ${baseline}) scale(1 1.02)`} textAnchor="middle" fontFamily={CONDENSED} fontWeight="600" fontSize="98" fill={ink}>
            {ch}
          </text>
        );
      })}
      <rect width={W} height={H} rx="10" fill={`url(#${id}sheen)`} />
    </svg>
  );
}

export const jpTemplate: PlateTemplate<JpDesign> = {
  id: 'jp',
  name: 'Japan medium 330×165 mm',
  size: () => ({ width: W, height: H }),
  render: ({ design, parts, text }) => <JpPlate design={design} parts={parts} text={text} />,
  fonts: [FONTS.barlow600],
};
