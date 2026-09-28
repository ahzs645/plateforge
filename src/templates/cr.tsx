import { useId } from 'react';
import type { Parts, PlateTemplate } from '../core/types';
import { CONDENSED, FONTS } from './fonts';
import { fit, safeId } from './measure';

/**
 * Costa Rica, drawn from our own geometry on a 12 × 6 in (600 × 300) canvas.
 *
 *   embossed  pre-2013 stamped plate: rounded rim in the class colour, bolt slots,
 *             "COSTA RICA" / "CENTROAMERICA", optional flag at top right.
 *   2013      flat Registro Nacional series: grey security strip on the left edge,
 *             thin class-coloured frame, "CENTROAMÉRICA", flag at top right.
 *
 * The class prefix is either drawn in a yellow side bar (`bar`), stacked in a
 * narrow column (`stack`), or run in with the serial (`inline`).
 */
export interface CrDesign {
  [key: string]: unknown;
  series?: 'embossed' | '2013';
  ink?: string;
  bg?: string;
  frame?: string;
  /** Fixed class prefix; a `prefix` part overrides it (taxi/bus province codes). */
  prefix?: string;
  prefixStyle?: 'bar' | 'stack' | 'inline' | 'none';
  wheelchair?: boolean;
  /** Smaller motorcycle plate (dimensions approximate). */
  compact?: boolean;
}

export const CR_BLUE = '#152d62';
export const CR_RED = '#ad180d';
export const CR_BLACK = '#161616';
const YELLOW = '#f6d51f';
const W = 600;
const H = 300;
const COMPACT = 0.6;

/** Flag of Costa Rica: blue, white, red (double), white, blue. */
function Flag({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const u = h / 6;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fff" />
      <rect x={x} y={y} width={w} height={u} fill="#002b7f" />
      <rect x={x} y={y + 2 * u} width={w} height={2 * u} fill="#ce1126" />
      <rect x={x} y={y + 5 * u} width={w} height={u} fill="#002b7f" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1" />
    </g>
  );
}

/** ISO 7001-style access symbol on a blue panel — our own stroke geometry in a 100-unit box. */
function Wheelchair({ x, y, size }: { x: number; y: number; size: number }) {
  const k = size / 100;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect width="100" height="100" rx="10" fill="#1d3fa6" />
      <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="40" cy="17" r="8" fill="#fff" stroke="none" />
        <path d="M40 31 V58 H64 L74 80 H84" strokeWidth="9" />
        <path d="M40 43 H60" strokeWidth="7" />
        <path d="M30 50 A24 24 0 1 0 66 74" strokeWidth="7" />
      </g>
    </g>
  );
}

function CrPlate({ design: d, parts, text }: { design: CrDesign; parts: Parts; text: string }) {
  const id = safeId(useId());
  const flat = (d.series ?? '2013') === '2013';
  const k = d.compact ? COMPACT : 1;
  const ink = d.ink ?? CR_BLUE;
  const frame = d.frame ?? ink;
  const bg = d.bg ?? '#fbfbf8';
  const prefix = parts.prefix ?? d.prefix ?? '';
  const style = prefix ? (d.prefixStyle ?? 'inline') : 'none';
  const showFlag = flat || parts.flag !== 'none';
  const code = parts.code ?? '';
  const serial = style === 'inline' ? `${prefix}${parts.serial ?? ''}` : (parts.serial ?? '');

  // Horizontal bands: security strip → yellow bar → content → flag margin.
  const barX = flat ? 28 : 34;
  const barW = flat ? 70 : 62;
  const left = style === 'bar' ? barX + barW + 16 : flat ? 40 : 30;
  const right = flat ? 572 : 574;
  const serialFont = { family: CONDENSED, size: flat ? 182 : 178, weight: 600, letterSpacing: flat ? 2 : 6 };
  const baseline = flat ? 220 : 224;

  // Inline row: [stacked prefix] [stacked code ·] [wheelchair] serial — centred as one group.
  const chairSize = 118;
  const lead = (style === 'stack' ? 78 : 0) + (code ? 92 : 0) + (d.wheelchair ? chairSize + 20 : 0);
  const serialFit = fit(serial, serialFont, right - left - lead);
  let x = left + (lead ? Math.max(0, (right - left - lead - serialFit.width) / 2) : 0);
  const stackAt = x + 26;
  if (style === 'stack') x += 78;
  const codeAt = x + 20;
  const dotAt = x + 60;
  if (code) x += 92;
  const chairAt = x + 6;
  if (d.wheelchair) x += chairSize + 20;
  const serialX = lead ? x + serialFit.width / 2 : left + (right - left) / 2;

  const titleFont = { family: CONDENSED, size: flat ? 34 : 44, weight: 700, letterSpacing: flat ? 2 : 6 };
  const footFont = { family: CONDENSED, size: flat ? 34 : 50, weight: 700, letterSpacing: flat ? 2 : 3 };
  const footer = flat ? 'CENTROAMÉRICA' : 'CENTROAMERICA';
  const textCentre = flat ? (left + 520) / 2 + (style === 'bar' ? 0 : 10) : (left + 520) / 2;
  const footFit = fit(footer, footFont, 420);

  const letters = [...prefix];
  const barLetter = letters.length > 2 ? 66 : 76;
  const stackLetter = 66;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W * k} ${H * k}`} role="img" aria-label={text}>
      <g transform={k === 1 ? undefined : `scale(${k})`}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg} stopOpacity={flat ? 1 : 0.92} />
        </linearGradient>
        <linearGradient id={`${id}holo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9aeb4" />
          <stop offset="0.35" stopColor="#c9c3d8" />
          <stop offset="0.6" stopColor="#bcd6cc" />
          <stop offset="1" stopColor="#9da2a8" />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.07" />
        </linearGradient>
        <filter id={`${id}emboss`} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="0.8" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect width={W} height={H} rx={flat ? 12 : 22} fill={flat ? '#fff' : '#e9ebe8'} />
      <rect x="4" y="4" width={W - 8} height={H - 8} rx={flat ? 9 : 19} fill={`url(#${id}bg)`} />
      {flat ? (
        <>
          <rect x="7" y="7" width={W - 14} height={H - 14} rx="5" fill="none" stroke={frame} strokeWidth="6" />
          <rect x="10" y="10" width="16" height={H - 20} fill={`url(#${id}holo)`} />
        </>
      ) : (
        <>
          <rect x="8" y="8" width={W - 16} height={H - 16} rx="16" fill="none" stroke={frame} strokeWidth="9" />
          <rect x="15" y="15" width={W - 30} height={H - 30} rx="11" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />
          {/* Bolt slots and the top-left mounting hole. */}
          {[[92, 22], [446, 22]].map(([sx, sy]) => (
            <rect key={sx} x={sx} y={sy} width="58" height="11" rx="5.5" fill="#2a2a2a" opacity="0.85" />
          ))}
          <circle cx="50" cy="28" r="7" fill="#8a8a80" stroke="#5a5a52" strokeWidth="2" />
        </>
      )}

      {style === 'bar' && (
        <g>
          <rect x={barX} y={flat ? 10 : 16} width={barW} height={flat ? H - 20 : H - 32} fill={YELLOW} />
          <rect x={barX + barW + 3} y={flat ? 14 : 56} width="5" height={flat ? H - 28 : 196} fill={ink} />
          {letters.map((ch, i) => (
            <text
              key={i}
              x={barX + barW / 2}
              y={150 + (i - (letters.length - 1) / 2) * barLetter * 1.02 + barLetter * 0.36}
              textAnchor="middle"
              fontFamily={CONDENSED}
              fontWeight="600"
              fontSize={barLetter}
              fill={ink}
            >
              {ch}
            </text>
          ))}
        </g>
      )}

      <g fill={ink} fontFamily={CONDENSED} filter={flat ? undefined : `url(#${id}emboss)`}>
        <text x={textCentre} y={flat ? 48 : 68} textAnchor="middle" fontWeight={titleFont.weight} fontSize={titleFont.size} letterSpacing={titleFont.letterSpacing}>
          COSTA RICA
        </text>
        <text x={textCentre} y={flat ? 283 : 284} textAnchor="middle" fontWeight={footFont.weight} fontSize={footFont.size} letterSpacing={footFont.letterSpacing} {...footFit.attrs}>
          {footer}
        </text>

        {style === 'stack' &&
          letters.map((ch, i) => (
            <text key={i} x={stackAt} y={150 + (i - (letters.length - 1) / 2) * stackLetter * 0.98 + stackLetter * 0.36} textAnchor="middle" fontWeight="600" fontSize={stackLetter}>
              {ch}
            </text>
          ))}
        {code &&
          [...code].map((ch, i) => (
            <text key={i} x={codeAt} y={150 + (i - (code.length - 1) / 2) * stackLetter * 0.98 + stackLetter * 0.36} textAnchor="middle" fontWeight="600" fontSize={stackLetter}>
              {ch}
            </text>
          ))}
        {code && <circle cx={dotAt} cy="160" r="6" />}

        <text
          x={serialX}
          y={baseline}
          textAnchor="middle"
          fontWeight={serialFont.weight}
          fontSize={serialFont.size}
          letterSpacing={serialFont.letterSpacing}
          {...serialFit.attrs}
        >
          {serial}
        </text>
      </g>

      {d.wheelchair && <Wheelchair x={chairAt} y={150 - chairSize / 2 + 6} size={chairSize} />}
      {showFlag && <Flag x={flat ? 518 : 514} y={flat ? 20 : 24} w={flat ? 50 : 56} h={flat ? 30 : 30} />}
      {!flat && <rect width={W} height={H} rx="22" fill={`url(#${id}sheen)`} />}
      </g>
    </svg>
  );
}

export const crTemplate: PlateTemplate<CrDesign> = {
  id: 'cr',
  name: 'Costa Rica 12 × 6 in',
  size: (d) => (d.compact ? { width: W * COMPACT, height: H * COMPACT } : { width: W, height: H }),
  render: ({ design, parts, text }) => <CrPlate design={design} parts={parts} text={text} />,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};

