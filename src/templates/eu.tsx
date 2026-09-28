import { useId, type ReactNode } from 'react';
import type { PlateTemplate } from '../core/types';
import { CONDENSED, FONTS } from './fonts';
import { fit, measure, safeId } from './measure';

/**
 * Plate outline. `standard` is the one-line 520×110 plate; the others are the
 * two-row sizes of the Czech type catalogue (MD ČR "Typy tabulek s registrační
 * značkou"): 340×200, 280×200, 320×160, motorcycle 200×160, moped 80×110.
 */
export type EuSize = 'standard' | 'truck' | 'van' | 'square' | 'moto' | 'moped';

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
  /** Registration seals in the first gap: `true` = German/Austrian seals, `cz` = Czech sticker fields. */
  seals?: boolean | 'cz';
  /** Top/bottom stripe color (Austria). */
  stripes?: string;
  /** Plate size; defaults to `standard` (520×110, one line). */
  size?: EuSize;
  /** Part whose value (an `EuSize`) overrides `size`, e.g. a layout select. */
  sizeKey?: string;
  /** Characters in the top row when a two-row text has no space. */
  split?: number;
}

const W = 520;
const H = 110;
const BAND = 46;

interface RowLayout {
  w: number;
  h: number;
  /** EU band in the top-left corner, spanning the top row; omitted = no band (mopeds). */
  band?: { w: number; h: number };
  font: number;
  baselines: readonly [number, number];
  /** Sticker fields stacked to the right of the top row, and their radius. */
  seals: number;
  sealR: number;
  split: number;
}

// Proportions measured from the Ministry of Transport type drawings (types 103–119).
const ROWS: Record<Exclude<EuSize, 'standard'>, RowLayout> = {
  truck: { w: 340, h: 200, band: { w: 42, h: 90 }, font: 94, baselines: [96, 187], seals: 2, sealR: 17, split: 3 },
  van: { w: 280, h: 200, band: { w: 42, h: 90 }, font: 94, baselines: [96, 187], seals: 2, sealR: 17, split: 3 },
  square: { w: 320, h: 160, band: { w: 42, h: 86 }, font: 68, baselines: [75, 144], seals: 2, sealR: 13, split: 3 },
  moto: { w: 200, h: 160, band: { w: 38, h: 80 }, font: 66, baselines: [74, 149], seals: 1, sealR: 19, split: 2 },
  moped: { w: 80, h: 110, font: 40, baselines: [49, 97], seals: 0, sealR: 0, split: 2 },
};

export function euSize(d: EuDesign, parts?: Record<string, string>): EuSize {
  const s = (d.sizeKey && parts?.[d.sizeKey]) || d.size;
  return s && s in ROWS ? (s as EuSize) : 'standard';
}

function Stars({ cx, cy, r = 14 }: { cx: number; cy: number; r?: number }) {
  const star = (x: number, y: number, rr0: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? rr0 * 0.4 : rr0;
      return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  return (
    <g fill="#ffcc00">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI / 6) * i;
        return <polygon key={i} points={star(cx + r * Math.sin(a), cy - r * Math.cos(a), (r * 3.4) / 14)} />;
      })}
    </g>
  );
}

/** Czech sticker field: an embossed double ring (since 2015 only the upper one carries the STK sticker). */
function CzSeal({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g fill="none" stroke="#8d969f">
      <circle cx={cx} cy={cy} r={r} fill="#f3f5f7" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={r - 2.4} strokeWidth="0.7" />
    </g>
  );
}

function Frame({ w, h, border, bg, children }: { w: number; h: number; border?: string; bg: string; children: ReactNode }) {
  const id = safeId(useId());
  return (
    <>
      <defs>
        <clipPath id={`${id}clip`}>
          <rect x="2" y="2" width={w - 4} height={h - 4} rx="9" />
        </clipPath>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.07" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} rx="11" fill={border ?? '#111'} />
      <g clipPath={`url(#${id}clip)`}>
        <rect width={w} height={h} fill={bg} />
        {children}
        <rect width={w} height={h} fill={`url(#${id}sheen)`} />
      </g>
    </>
  );
}

function plateFont(d: EuDesign) {
  return {
    family: d.font === 'uk' ? `UKNumberPlate, ${CONDENSED}` : `EuroPlate, ${CONDENSED}`,
    size: d.font === 'uk' ? 84 : 86,
    weight: 400,
  };
}

function EuPlate({ design: d, text, parts }: { design: EuDesign; text: string; parts: Record<string, string> }) {
  const bg = d.bg ?? '#ffffff';
  const ink = d.text ?? '#111111';
  const band = d.band ?? 'eu';
  const left = band === 'none' ? 12 : BAND + 8;
  const right = d.rightBand ? W - BAND - 8 : W - 12;
  const center = (left + right) / 2;
  const maxWidth = right - left - 8;
  const font = plateFont(d);
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
        {d.seals === 'cz' ? (
          <>
            <CzSeal cx={sealX} cy={36} r={16 * Math.max(scale, 0.8)} />
            <CzSeal cx={sealX} cy={74} r={16 * Math.max(scale, 0.8)} />
          </>
        ) : (
          <>
            <circle cx={sealX} cy={36} r={13 * Math.max(scale, 0.8)} fill="#e9eef3" stroke="#5a6b7c" strokeWidth="1.5" />
            <circle cx={sealX} cy={36} r={8} fill="#c7a746" opacity="0.8" />
            <circle cx={sealX} cy={74} r={13 * Math.max(scale, 0.8)} fill="#dbe6ef" stroke="#5a6b7c" strokeWidth="1.5" />
            <circle cx={sealX} cy={74} r={6} fill="#8aa0b6" />
          </>
        )}
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
      <Frame w={W} h={H} border={d.border} bg={bg}>
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
      </Frame>
    </svg>
  );
}

/** Splits "5A2 3456" at the first space, else after `split` characters. */
export function euRows(text: string, split: number): [string, string] {
  const cut = text.indexOf(' ');
  return cut >= 0 ? [text.slice(0, cut), text.slice(cut + 1).trim()] : [text.slice(0, split), text.slice(split)];
}

/** Two-row plates: EU band in the top-left corner beside the top row, sticker fields to its right. */
function TwoRowPlate({ design: d, text, layout: l }: { design: EuDesign; text: string; layout: RowLayout }) {
  const ink = d.text ?? '#111111';
  const band = d.band === 'none' ? undefined : l.band;
  const [top, bottom] = euRows(text, d.split ?? l.split);
  const font = { ...plateFont(d), size: l.font };
  const pad = 8;

  // Top row: text + sticker column, centered in the space right of the band.
  const sealR = l.sealR;
  const seals = d.seals ? l.seals : 0;
  const sealBlock = seals ? 10 + sealR * 2 : 0;
  const x0 = (band ? band.w : 0) + pad;
  const x1 = l.w - pad;
  const topFit = fit(top, font, x1 - x0 - sealBlock);
  const topStart = (x0 + x1 - topFit.width - sealBlock) / 2;
  const sealX = topStart + topFit.width + 10 + sealR;
  const rowTop = l.baselines[0] - l.font * 0.8;
  const sealYs = seals === 1 ? [rowTop + l.font * 0.4] : [rowTop + sealR + 2, l.baselines[0] - sealR - 2];
  const bottomFit = fit(bottom, font, l.w - pad * 2);
  const code = d.bandCode ?? '';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${l.w} ${l.h}`} role="img" aria-label={text}>
      <Frame w={l.w} h={l.h} border={d.border} bg={d.bg ?? '#ffffff'}>
        {band && (
          <g>
            <rect x="0" y="0" width={band.w} height={band.h} fill={d.bandColor ?? '#003399'} />
            {d.band !== 'national' && <Stars cx={band.w / 2 + 1} cy={band.h * 0.34} r={band.w * 0.3} />}
            <text
              x={band.w / 2 + 1}
              y={d.band === 'national' ? band.h * 0.62 : band.h * 0.87}
              textAnchor="middle"
              fontFamily={`EuroPlate, ${CONDENSED}`}
              fontSize={band.w * (code.length > 2 ? 0.43 : 0.6)}
              fill="#fff"
            >
              {code}
            </text>
          </g>
        )}
        <text x={topStart} y={l.baselines[0]} fontFamily={font.family} fontSize={font.size} fill={ink} {...topFit.attrs}>
          {top}
        </text>
        {sealYs.slice(0, seals).map((y) => (
          <CzSeal key={y} cx={sealX} cy={y} r={sealR} />
        ))}
        <text x={l.w / 2} y={l.baselines[1]} textAnchor="middle" fontFamily={font.family} fontSize={font.size} fill={ink} {...bottomFit.attrs}>
          {bottom}
        </text>
      </Frame>
    </svg>
  );
}

export const euTemplate: PlateTemplate<EuDesign> = {
  id: 'eu',
  name: 'European 520×110 mm',
  size: (design, parts) => {
    const s = euSize(design, parts);
    return s === 'standard' ? { width: W, height: H } : { width: ROWS[s].w, height: ROWS[s].h };
  },
  render: ({ design, text, parts }) => {
    const s = euSize(design, parts);
    return s === 'standard'
      ? <EuPlate design={design} text={text} parts={parts} />
      : <TwoRowPlate design={design} text={text} layout={ROWS[s]} />;
  },
  fonts: [FONTS.euro, FONTS.uk, FONTS.barlow600],
};
