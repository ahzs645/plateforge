import { useId } from 'react';
import type { PlateTemplate } from '../core/types';
import { CONDENSED, FONTS } from './fonts';
import { fit, safeId } from './measure';

export interface UsDesign {
  [key: string]: unknown;
  header: string;
  slogan: string;
  headerStyle?: 'block' | 'script';
  /** Top → bottom background gradient. */
  bg?: [string, string];
  text?: string;
  headerColor?: string;
  sloganColor?: string;
  /** Solid band behind the header (top) or slogan (bottom). */
  band?: string;
  bandPosition?: 'top' | 'bottom';
  /** Thin decorative stripe color. */
  accent?: string;
  frame?: string;
}

const W = 600;
const H = 300;
const SCRIPT = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';

function UsPlate({ design: d, text }: { design: UsDesign; text: string }) {
  const id = safeId(useId());
  const ink = d.text ?? '#1c2e6b';
  const [top, bottom] = d.bg ?? ['#ffffff', '#f1f3f6'];
  const headerColor = d.headerColor ?? ink;
  const sloganColor = d.sloganColor ?? ink;
  const script = d.headerStyle === 'script';

  const serialFont = { family: CONDENSED, size: 170, weight: 600, letterSpacing: 6 };
  const serial = fit(text, serialFont, 520);
  const headerFont = script
    ? { family: SCRIPT, size: 62, weight: 400 }
    : { family: CONDENSED, size: 46, weight: 700, letterSpacing: 5 };
  const header = fit(d.header, headerFont, 500);
  const slogan = fit(d.slogan, { family: CONDENSED, size: 26, weight: 600, letterSpacing: 3 }, 380);

  const holes = [
    [118, 30], [482, 30], [118, 270], [482, 270],
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.06" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect width={W} height={H} rx="22" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}clip)`}>
        <rect width={W} height={H} fill={`url(#${id}bg)`} />
        {d.band && (
          <rect y={d.bandPosition === 'bottom' ? 236 : 0} width={W} height="64" fill={d.band} />
        )}
        {d.accent && <rect y="72" width={W} height="7" fill={d.accent} opacity="0.85" />}
        <rect width={W} height={H} fill={`url(#${id}sheen)`} />
      </g>
      <rect x="7" y="7" width={W - 14} height={H - 14} rx="17" fill="none" stroke={d.frame ?? ink} strokeWidth="5" />
      {holes.map(([cx, cy]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="15" ry="7" fill="#000" opacity="0.22" />
      ))}

      <text
        x={W / 2}
        y={script ? 62 : 54}
        textAnchor="middle"
        fontFamily={headerFont.family}
        fontSize={headerFont.size}
        fontWeight={headerFont.weight}
        letterSpacing={'letterSpacing' in headerFont ? headerFont.letterSpacing : 0}
        fill={headerColor}
        {...header.attrs}
      >
        {d.header}
      </text>

      {/* Embossed serial: shadow, then face. */}
      {[
        { dx: 3, dy: 4, fill: '#000', opacity: 0.22 },
        { dx: 0, dy: 0, fill: ink, opacity: 1 },
      ].map((layer, i) => (
        <text
          key={i}
          x={W / 2 + layer.dx}
          y={214 + layer.dy}
          textAnchor="middle"
          fontFamily={serialFont.family}
          fontSize={serialFont.size}
          fontWeight={serialFont.weight}
          letterSpacing={serialFont.letterSpacing}
          fill={layer.fill}
          opacity={layer.opacity}
          {...serial.attrs}
        >
          {text}
        </text>
      ))}

      {d.slogan && (
        <text
          x={W / 2}
          y={278}
          textAnchor="middle"
          fontFamily={CONDENSED}
          fontSize="26"
          fontWeight="600"
          letterSpacing="3"
          fill={d.band && d.bandPosition === 'bottom' ? (d.sloganColor ?? '#fff') : sloganColor}
          {...slogan.attrs}
        >
          {d.slogan}
        </text>
      )}
    </svg>
  );
}

export const usTemplate: PlateTemplate<UsDesign> = {
  id: 'us',
  name: 'North American 12×6″',
  size: () => ({ width: W, height: H }),
  render: ({ design, text }) => <UsPlate design={design} text={text} />,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};
