import { useId, type ReactNode } from 'react';
import type { PlateTemplate } from '../core/types';
import { CONDENSED, FONTS } from './fonts';
import { fit, measure, safeId } from './measure';

export interface EuDesign {
  [key: string]: unknown;
  bg?: string;
  text?: string;
  border?: string;
  /** `eu` = blue band with stars, `national` = colored band with code only, `none`. */
  band?: 'eu' | 'national' | 'none';
  bandColor?: string;
  bandCode?: string;
  /** Right-hand band color (France, Italy, Portugal). */
  rightBand?: string;
  /** Part shown in the right band. */
  rightBandKey?: string;
  font?: 'euro' | 'uk';
  /** Draw registration seals in the first gap (Germany, Austria). */
  seals?: boolean;
  /** Top/bottom stripe color (Austria). */
  stripes?: string;
}

const W = 520;
const H = 110;
const BAND = 46;

function Stars({ cx, cy }: { cx: number; cy: number }) {
  const star = (x: number, y: number, r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.4 : r;
      return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  return (
    <g fill="#ffcc00">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI / 6) * i;
        return <polygon key={i} points={star(cx + 14 * Math.sin(a), cy - 14 * Math.cos(a), 3.4)} />;
      })}
    </g>
  );
}

function EuPlate({ design: d, text, parts }: { design: EuDesign; text: string; parts: Record<string, string> }) {
  const id = safeId(useId());
  const bg = d.bg ?? '#ffffff';
  const ink = d.text ?? '#111111';
  const band = d.band ?? 'eu';
  const left = band === 'none' ? 12 : BAND + 8;
  const right = d.rightBand ? W - BAND - 8 : W - 12;
  const center = (left + right) / 2;
  const maxWidth = right - left - 8;
  const font = {
    family: d.font === 'uk' ? `UKNumberPlate, ${CONDENSED}` : `EuroPlate, ${CONDENSED}`,
    size: d.font === 'uk' ? 84 : 86,
    weight: 400,
  };
  const baseline = d.font === 'uk' ? 86 : 88;

  let serial: ReactNode;
  if (d.seals && text.includes(' ')) {
    // "M AB 1234" → "M" ⦿ "AB 1234"
    const cut = text.indexOf(' ');
    const [a, b] = [text.slice(0, cut), text.slice(cut + 1)];
    const gap = 48;
    const wa = measure(a, font);
    const wb = measure(b, font);
    const scale = Math.min(1, maxWidth / (wa + gap + wb));
    const start = center - ((wa + gap + wb) * scale) / 2;
    const sealX = start + (wa + gap / 2) * scale;
    serial = (
      <>
        <text x={start} y={baseline} fontFamily={font.family} fontSize={font.size} fill={ink} textLength={wa * scale} lengthAdjust="spacingAndGlyphs">
          {a}
        </text>
        <circle cx={sealX} cy={36} r={13 * Math.max(scale, 0.8)} fill="#e9eef3" stroke="#5a6b7c" strokeWidth="1.5" />
        <circle cx={sealX} cy={36} r={8} fill="#c7a746" opacity="0.8" />
        <circle cx={sealX} cy={74} r={13 * Math.max(scale, 0.8)} fill="#dbe6ef" stroke="#5a6b7c" strokeWidth="1.5" />
        <circle cx={sealX} cy={74} r={6} fill="#8aa0b6" />
        <text x={start + (wa + gap) * scale} y={baseline} fontFamily={font.family} fontSize={font.size} fill={ink} textLength={wb * scale} lengthAdjust="spacingAndGlyphs">
          {b}
        </text>
      </>
    );
  } else {
    const f = fit(text, font, maxWidth);
    serial = (
      <text x={center} y={baseline} textAnchor="middle" fontFamily={font.family} fontSize={font.size} fill={ink} {...f.attrs}>
        {text}
      </text>
    );
  }

  const rightText = d.rightBandKey ? (parts[d.rightBandKey] ?? '') : '';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <clipPath id={`${id}clip`}>
          <rect x="2" y="2" width={W - 4} height={H - 4} rx="9" />
        </clipPath>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.07" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="11" fill={d.border ?? '#111'} />
      <g clipPath={`url(#${id}clip)`}>
        <rect width={W} height={H} fill={bg} />
        {d.stripes && (
          <>
            <rect x={left - 4} y="2" width={right - left + 8} height="9" fill={d.stripes} />
            <rect x={left - 4} y={H - 11} width={right - left + 8} height="9" fill={d.stripes} />
          </>
        )}
        {band !== 'none' && (
          <g>
            <rect x="0" y="0" width={BAND} height={H} fill={d.bandColor ?? '#003399'} />
            {band === 'eu' && <Stars cx={BAND / 2 + 1} cy={34} />}
            <text
              x={BAND / 2 + 1}
              y={band === 'eu' ? 90 : 68}
              textAnchor="middle"
              fontFamily={`EuroPlate, ${CONDENSED}`}
              fontSize={d.bandCode && d.bandCode.length > 2 ? 20 : 28}
              fill="#fff"
            >
              {d.bandCode}
            </text>
          </g>
        )}
        {d.rightBand && (
          <g>
            <rect x={W - BAND} y="0" width={BAND} height={H} fill={d.rightBand} />
            {rightText && (
              <text x={W - BAND / 2} y="90" textAnchor="middle" fontFamily={`EuroPlate, ${CONDENSED}`} fontSize="26" fill="#fff">
                {rightText}
              </text>
            )}
          </g>
        )}
        {serial}
        <rect width={W} height={H} fill={`url(#${id}sheen)`} />
      </g>
    </svg>
  );
}

export const euTemplate: PlateTemplate<EuDesign> = {
  id: 'eu',
  name: 'European 520×110 mm',
  size: () => ({ width: W, height: H }),
  render: ({ design, text, parts }) => <EuPlate design={design} text={text} parts={parts} />,
  fonts: [FONTS.euro, FONTS.uk, FONTS.barlow600],
};
