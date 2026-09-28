import { useId, type ReactElement } from 'react';
import type { Parts, PlateTemplate } from '../core/types';
import { CONDENSED, FONTS } from './fonts';
import { fit, safeId } from './measure';

/**
 * Mercosur-region plates, drawn in millimetres from our own geometry.
 *
 *   mercosur  common plate (GMC Res. 33/14): 400 × 130 car / 200 × 170 motorcycle,
 *             white with a 30 mm Pantone 286 band (emblem left, country centre, flag
 *             right). Brazilian specifics follow CONTRAN Res. 780/2019: equidistant
 *             FE-Schrift characters (EuroPlate here), 2D code top-left, BR bottom-left,
 *             class-coloured characters with a MERCOSUR BRASIL MERCOSUL micro-inscription.
 *   br-grey   Brazilian 1990–2020 plate (CONTRAN Res. 231/2007): coloured sheet with a
 *             riveted tarjeta carrying UF and municipality; Mandatory lettering
 *             (UKNumberPlate here) spaced by the resolution's character-width table.
 *   ar-1995   Argentine 1995–2016 plate: 294 × 129, black centre band between white
 *             reflective strips, ARGENTINA in light blue on the top strip.
 *
 * Emblem, flags and the 2D code are simplified drawings, not the official artwork.
 */
export type MercosurCountry = 'br' | 'ar' | 'uy' | 'py';

export interface MercosurDesign {
  [key: string]: unknown;
  country?: MercosurCountry;
  series?: 'mercosur' | 'br-grey' | 'ar-1995';
  moto?: boolean;
  /** Character (and frame) colour. */
  ink?: string;
  bg?: string;
  /** Frame colour when it differs from the characters. */
  frame?: string;
  /** Frame colour keyed by the `class` part (Uruguayan special-use codes). */
  frameByClass?: Record<string, string>;
  /** Characters in the top row of a two-row plate. */
  split?: number;
  /** Colour of the micro-inscription inside the characters; omitted = none. */
  inscription?: string;
  /** Decorative 2D-code square below the band (Brazil). */
  qr?: boolean;
  /** International sign printed bottom-left, e.g. BR. */
  sign?: string;
  /** Early Brazilian (Res. 729/2018) state-flag and municipal-arms marks, abstracted. */
  marks?: boolean;
  /** Tarjeta text colour and background on br-grey plates; default = plate colours. */
  tarjeta?: string;
}

/**
 * Brazilian Mercosur use classes: character colour (Res. 780/2019 Table III) and the
 * colour of the micro-inscription inside the characters (Table VI). Hex values are
 * approximations of the Pantone references.
 */
export const BR_USES = [
  { id: 'particular', label: 'Private (particular)', colour: 'black', ink: '#111111', inscription: '#3a3d39', pantone: 'black / 447C' },
  { id: 'commercial', label: 'Commercial — hire & driving school', colour: 'red', ink: '#c8102e', inscription: '#a6192e', pantone: '186C / 187C' },
  { id: 'official', label: 'Official & representation', colour: 'blue', ink: '#0033a0', inscription: '#002d72', pantone: '286C / 288C' },
  { id: 'diplomatic', label: 'Diplomatic & consular', colour: 'gold', ink: '#d9a300', inscription: '#b87c00', pantone: '130C / 131C' },
  { id: 'special', label: 'Special — test & manufacturer', colour: 'green', ink: '#007a53', inscription: '#006747', pantone: '341C / 342C' },
  { id: 'collector', label: 'Collector', colour: 'silver-grey', ink: '#8a8d8f', inscription: '#6e6259', pantone: 'silver grey / Warm Grey 11C' },
] as const;
export type BrUse = (typeof BR_USES)[number]['id'];

export const MERCOSUR_BLUE = '#0033a0'; // Pantone 286
const MERCOSUR_GREEN = '#009a44'; // Pantone 347
const EURO = `EuroPlate, ${CONDENSED}`;
const MANDATORY = `UKNumberPlate, ${CONDENSED}`;
/** Res. 780/2019 §2.2.3: wording hot-stamped inside Brazilian characters. */
const INSCRIPTION = 'MERCOSUR BRASIL MERCOSUL';

const COUNTRY: Record<MercosurCountry, { name: string; word: string }> = {
  br: { name: 'BRASIL', word: 'MERCOSUL' },
  ar: { name: 'REPUBLICA ARGENTINA', word: 'MERCOSUR' },
  uy: { name: 'URUGUAY', word: 'MERCOSUR' },
  py: { name: 'PARAGUAY', word: 'MERCOSUR' },
};

/** Plate outline in mm. */
export function mercosurSize(d: MercosurDesign): { width: number; height: number } {
  if (d.series === 'ar-1995') return { width: 294, height: 129 };
  if (d.series === 'br-grey') return d.moto ? { width: 187, height: 136 } : { width: 400, height: 130 };
  return d.moto ? { width: 200, height: 170 } : { width: 400, height: 130 };
}

function star(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Our own Southern Cross motif: four stars and a small fifth over a green horizon, wordmark below. */
function Emblem({ x, y, w, h, word }: { x: number; y: number; w: number; h: number; word: string }) {
  const k = w / 32;
  return (
    <g transform={`translate(${x} ${y}) scale(${k} ${h / 22})`}>
      <path d="M2 14.5 Q15 6.5 30 12.5" fill="none" stroke={MERCOSUR_GREEN} strokeWidth="2.2" strokeLinecap="round" />
      <g fill="#fff">
        <polygon points={star(16.5, 2.6, 2.3)} />
        <polygon points={star(11.2, 6.6, 2.1)} />
        <polygon points={star(21.4, 6.2, 2)} />
        <polygon points={star(15.8, 11, 2.4)} />
        <polygon points={star(19.6, 9.3, 1.1)} />
      </g>
      <text x="16" y="20.8" textAnchor="middle" fontFamily={CONDENSED} fontWeight="700" fontSize="5.4" letterSpacing="0.35" fill="#fff">{word}</text>
    </g>
  );
}

/** Simplified national flags (proportions only; no arms, stars or mottoes). */
function Flag({ country, x, y, w, h }: { country: MercosurCountry; x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  let body: ReactElement;
  if (country === 'br') {
    body = (
      <>
        <rect x={x} y={y} width={w} height={h} fill="#009c3b" />
        <polygon points={`${x + w * 0.09},${cy} ${cx},${y + h * 0.11} ${x + w * 0.91},${cy} ${cx},${y + h * 0.89}`} fill="#ffdf00" />
        <circle cx={cx} cy={cy} r={h * 0.25} fill="#002776" />
        <path d={`M${cx - h * 0.25} ${cy - h * 0.02} Q${cx} ${cy - h * 0.12} ${cx + h * 0.25} ${cy + h * 0.06}`} fill="none" stroke="#fff" strokeWidth={h * 0.05} />
      </>
    );
  } else if (country === 'ar') {
    body = (
      <>
        <rect x={x} y={y} width={w} height={h} fill="#74acdf" />
        <rect x={x} y={y + h / 3} width={w} height={h / 3} fill="#fff" />
        <circle cx={cx} cy={cy} r={h * 0.11} fill="#f6b40e" />
      </>
    );
  } else if (country === 'uy') {
    const s = h / 9;
    body = (
      <>
        <rect x={x} y={y} width={w} height={h} fill="#fff" />
        {[1, 3, 5, 7].map((i) => <rect key={i} x={x} y={y + i * s} width={w} height={s} fill="#0038a8" />)}
        <rect x={x} y={y} width={s * 5} height={s * 5} fill="#fff" />
        <circle cx={x + s * 2.5} cy={y + s * 2.5} r={s * 1.3} fill="#fcd116" />
      </>
    );
  } else {
    body = (
      <>
        <rect x={x} y={y} width={w} height={h} fill="#fff" />
        <rect x={x} y={y} width={w} height={h / 3} fill="#d52b1e" />
        <rect x={x} y={y + (2 * h) / 3} width={w} height={h / 3} fill="#0038a8" />
        <circle cx={cx} cy={cy} r={h * 0.13} fill="none" stroke="#2b6b2b" strokeWidth={h * 0.04} />
      </>
    );
  }
  return (
    <g>
      <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx="2" fill="#fff" />
      {body}
    </g>
  );
}

/** A decorative 2D-code square: finder corners and a fixed dot field. It encodes nothing. */
function CodeMark({ x, y, size }: { x: number; y: number; size: number }) {
  const n = 21;
  const u = size / n;
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={x + fx * u} y={y + fy * u} width={7 * u} height={7 * u} fill="#222" />
      <rect x={x + (fx + 1) * u} y={y + (fy + 1) * u} width={5 * u} height={5 * u} fill="#fff" />
      <rect x={x + (fx + 2) * u} y={y + (fy + 2) * u} width={3 * u} height={3 * u} fill="#222" />
    </g>
  );
  const dots: ReactElement[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const inFinder = (r < 8 && c < 8) || (r < 8 && c > n - 9) || (r > n - 9 && c < 8);
    if (!inFinder && (r * 7 + c * 3 + ((r * c) % 5)) % 3 === 0) dots.push(<rect key={`${r}-${c}`} x={x + c * u} y={y + r * u} width={u} height={u} fill="#222" />);
  }
  return (
    <g opacity="0.85">
      <rect x={x - u} y={y - u} width={size + 2 * u} height={size + 2 * u} fill="#fff" />
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
      {dots}
    </g>
  );
}

/** Abstract state flag and municipal shield (Res. 729/2018 plates issued before Res. 748/2018). */
function StateMarks({ x, y, uf }: { x: number; y: number; uf: string }) {
  return (
    <g>
      <rect x={x} y={y} width="20" height="14" rx="1" fill="#e9eef7" stroke="#555" strokeWidth="0.5" />
      <path d={`M${x} ${y + 14} L${x + 20} ${y}`} stroke="#2f6fb5" strokeWidth="3" />
      <path d={`M${x + 3} ${y + 20} h14 v8 q0 7 -7 10 q-7 -3 -7 -10 z`} fill="#f1e7c4" stroke="#8a6d2a" strokeWidth="0.8" />
      <path d={`M${x + 6} ${y + 24} h8 M${x + 10} ${y + 22} v12`} stroke="#8a6d2a" strokeWidth="0.8" />
      <text x={x + 10} y={y + 47} textAnchor="middle" fontFamily={CONDENSED} fontWeight="700" fontSize="8" fill="#222">{uf}</text>
    </g>
  );
}

/** Splits a serial into rows: explicit `split` for two-row plates, else one row. */
function rows(serial: string, d: MercosurDesign): string[] {
  const compact = serial.replace(/[\s-]/g, '');
  return d.moto && d.split ? [compact.slice(0, d.split), compact.slice(d.split)] : [serial];
}

/** Equidistant character slots; a space opens a wider gap. */
function Slots({ text, cx, baseline, pitch, gap, size, family, fill }: {
  text: string; cx: number; baseline: number; pitch: number; gap: number; size: number; family: string; fill: string;
}) {
  const chars = [...text];
  const width = chars.reduce((w, ch) => w + (ch === ' ' ? gap : pitch), 0);
  let x = cx - width / 2;
  return (
    <g fill={fill} fontFamily={family} fontSize={size} textAnchor="middle">
      {chars.map((ch, i) => {
        const at = x;
        x += ch === ' ' ? gap : pitch;
        return ch === ' ' ? null : <text key={i} x={at + pitch / 2} y={baseline}>{ch}</text>;
      })}
    </g>
  );
}

function MercosurPlate({ d, parts, text }: { d: MercosurDesign; parts: Parts; text: string }) {
  const id = safeId(useId());
  const country = d.country ?? 'br';
  const { width: W, height: H } = mercosurSize(d);
  const moto = !!d.moto;
  const use = parts.use ? BR_USES.find((u) => u.id === parts.use) : undefined;
  const ink = use?.ink ?? d.ink ?? '#111';
  const inscription = use?.inscription ?? d.inscription;
  const bg = d.bg ?? '#fff';
  const frame = d.frameByClass?.[parts.class ?? ''] ?? d.frame ?? ink;
  const info = COUNTRY[country];
  const inset = moto ? 2 : 5;
  const band = { x: inset, y: moto ? 3 : 5, w: W - 2 * inset, h: 30 };
  const emblem = moto ? { w: 25, h: 20, x: 6 } : { w: 32, h: 22, x: 15 };
  const flag = moto ? { w: 23, h: 16 } : { w: 28, h: 20 };
  const flagX = W - inset - (moto ? 4 : 5) - flag.w;
  const titleFont = { family: CONDENSED, size: moto ? 14 : 19, weight: 700, letterSpacing: moto ? 0.8 : 1.6 };
  const title = fit(info.name, titleFont, flagX - (emblem.x + emblem.w) - 10);
  const fill = inscription ? `url(#${id}ins)` : ink;
  // The formatted text, so composed formats (Uruguayan class codes) render like plain serials.
  const lines = rows(text, d);
  // Characters: 65 mm (car) / 53 mm (motorcycle) cap height; EuroPlate caps are ~0.713 em.
  const size = moto ? 74 : 91;
  const pitch = moto ? 38 : 46;
  const baselines = moto ? [96, 159] : [112.5];
  const watermarkY = moto ? 100 : 80;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <defs>
        {inscription && (
          <pattern id={`${id}ins`} width="44" height="8" patternUnits="userSpaceOnUse">
            <rect width="44" height="8" fill={ink} />
            <g fontFamily={CONDENSED} fontWeight="600" fontSize="3" fill={inscription}>
              <text x="0" y="3.2">{INSCRIPTION}</text>
              <text x="-22" y="7.2">{INSCRIPTION}</text>
              <text x="22" y="7.2">{INSCRIPTION}</text>
            </g>
          </pattern>
        )}
        <clipPath id={`${id}clip`}><rect width={W} height={H} rx={moto ? 7 : 8} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}clip)`}>
        <rect width={W} height={H} fill={bg} />
        {/* Security print: sine waves and circular watermarks every 72 mm (GMC 33/14, Res. 780 §3.4). */}
        <g fill="none" stroke={bg === '#fff' ? '#7f95c4' : '#555'} strokeWidth="0.35" opacity="0.35">
          {[0, 1, 2].map((i) => (
            <path key={i} d={Array.from({ length: Math.ceil(W / 6) + 1 }, (_, s) => `${s ? 'L' : 'M'}${s * 6} ${(watermarkY + 18 + i * 4 + Math.sin(s * 0.55 + i) * 5).toFixed(2)}`).join(' ')} />
          ))}
          {Array.from({ length: Math.ceil(W / 72) }, (_, i) => <circle key={i} cx={36 + i * 72} cy={watermarkY - 8} r="13" opacity="0.5" />)}
        </g>
        <path
          d={`M${band.x} ${band.y + band.h} V${band.y + 4} Q${band.x} ${band.y} ${band.x + 4} ${band.y} H${band.x + band.w - 4} Q${band.x + band.w} ${band.y} ${band.x + band.w} ${band.y + 4} V${band.y + band.h} Z`}
          fill={MERCOSUR_BLUE}
        />
        <Emblem x={emblem.x} y={band.y + (band.h - emblem.h) / 2} w={emblem.w} h={emblem.h} word={info.word} />
        <text
          x={(emblem.x + emblem.w + flagX) / 2}
          y={band.y + band.h / 2 + titleFont.size * 0.35}
          textAnchor="middle"
          fontFamily={CONDENSED}
          fontWeight={titleFont.weight}
          fontSize={titleFont.size}
          letterSpacing={titleFont.letterSpacing}
          fill="#fff"
          {...title.attrs}
        >
          {info.name}
        </text>
        <Flag country={country} x={flagX} y={band.y + (band.h - flag.h) / 2} w={flag.w} h={flag.h} />

        {d.qr && <CodeMark x={moto ? 6 : 9} y={moto ? 40 : 40} size={moto ? 17 : 19} />}
        {d.sign && (
          <text x={moto ? 14.5 : 18.5} y={moto ? 94 : 122} textAnchor="middle" fontFamily={CONDENSED} fontWeight="700" fontSize={moto ? 10 : 12} fill={bg === '#fff' ? '#111' : '#eee'}>
            {d.sign}
          </text>
        )}
        {d.marks && !moto && <StateMarks x={368} y={40} uf={parts.uf ?? ''} />}

        {lines.map((line, i) => (
          <Slots key={i} text={line} cx={W / 2} baseline={baselines[i] ?? baselines[0]} pitch={pitch} gap={moto ? 14 : 18} size={size} family={EURO} fill={fill} />
        ))}
      </g>
      <rect x="1.6" y="1.6" width={W - 3.2} height={H - 3.2} rx={moto ? 6 : 7} fill="none" stroke={frame} strokeWidth="1.6" />
    </svg>
  );
}

/** Res. 231/2007 Annex character widths (mm) for the car (63 mm) and motorcycle (42 mm) plates. */
const WIDTHS_CAR: Record<string, number> = {
  A: 54, B: 44, C: 44, D: 43, E: 40, F: 40, G: 45, H: 45, I: 10, J: 36, K: 49, L: 40, M: 54, N: 47, O: 45, P: 44, Q: 51, R: 46, S: 46,
  T: 44, U: 45, V: 49, W: 49, X: 49, Y: 47, Z: 40, 1: 18, 2: 36, 3: 37, 4: 40, 5: 36, 6: 36, 7: 36, 8: 38, 9: 36, 0: 36,
};
const WIDTHS_MOTO: Record<string, number> = {
  A: 36, B: 30, C: 30, D: 30, E: 27, F: 27, G: 30, H: 30, I: 6, J: 25, K: 33, L: 27, M: 36, N: 32, O: 30, P: 30, Q: 35, R: 31, S: 31,
  T: 30, U: 30, V: 33, W: 33, X: 33, Y: 32, Z: 27, 1: 12, 2: 24, 3: 25, 4: 27, 5: 24, 6: 24, 7: 24, 8: 26, 9: 24, 0: 24,
};

/** Characters laid out on the resolution's width table, centred on `cx`; `-` becomes a bar. */
function Mandatory({ text, cx, baseline, cap, widths, gap, fill }: {
  text: string; cx: number; baseline: number; cap: number; widths: Record<string, number>; gap: number; fill: string;
}) {
  const dash = cap * 0.26;
  // UKNumberPlate is monospaced (ink about 0.435 em, I/1 bars about 0.122 em) and narrower than
  // Mandatory: widen each glyph towards its table width, capped so stems stay plausible.
  const size = cap / 0.684;
  const stretch = (ch: string, w: number) => (ch === 'I' || ch === '1' ? 1 : Math.min(1.2, Math.max(0.9, w / (0.435 * size)))).toFixed(3);
  const slot = (ch: string) => (ch === '-' ? dash + gap : (widths[ch] ?? cap * 0.6));
  const chars = [...text];
  const total = chars.reduce((w, ch) => w + slot(ch), 0) + gap * (chars.length - 1);
  let x = cx - total / 2;
  return (
    <g fill={fill} fontFamily={MANDATORY} fontSize={size} textAnchor="middle">
      {chars.map((ch, i) => {
        const w = slot(ch);
        const at = x;
        x += w + gap;
        return ch === '-'
          ? <rect key={i} x={at + gap / 2} y={baseline - cap / 2 - cap * 0.065} width={dash} height={cap * 0.13} />
          : <text key={i} transform={`translate(${at + w / 2} ${baseline}) scale(${stretch(ch, w)} 1)`}>{ch}</text>;
      })}
    </g>
  );
}

function GreyPlate({ d, parts, text }: { d: MercosurDesign; parts: Parts; text: string }) {
  const { width: W, height: H } = mercosurSize(d);
  const moto = !!d.moto;
  const ink = d.ink ?? '#111';
  const bg = d.bg ?? '#a9adb0';
  const serial = parts.serial ?? '';
  const tarjeta = parts.tarjeta ?? [parts.uf, parts.city].filter(Boolean).join(' - ');
  const tj = moto ? { x: 22, y: 6, w: W - 44, h: 18 } : { x: 60, y: 7, w: 280, h: 24 };
  const tjFont = { family: MANDATORY, size: moto ? 11 : 15, letterSpacing: moto ? 0.6 : 1.4 };
  const tjFit = fit(tarjeta, tjFont, tj.w - (moto ? 20 : 34));
  const [top, bottom] = moto ? [serial.slice(0, 3), serial.replace('-', '').slice(3)] : [serial, ''];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <rect width={W} height={H} rx="6" fill={bg} />
      <rect x="1.8" y="1.8" width={W - 3.6} height={H - 3.6} rx="5" fill="none" stroke={ink} strokeWidth="2.6" />
      {/* Removable tarjeta, riveted at both ends. */}
      <rect x={tj.x} y={tj.y} width={tj.w} height={tj.h} rx="2" fill={d.tarjeta ?? bg} stroke={ink} strokeOpacity="0.55" strokeWidth="0.8" />
      {[tj.x + 6, tj.x + tj.w - 6].map((cx) => <circle key={cx} cx={cx} cy={tj.y + tj.h / 2} r={moto ? 2 : 2.6} fill="#6d7174" stroke="#3d4043" strokeWidth="0.5" />)}
      <text
        x={W / 2} y={tj.y + tj.h / 2 + tjFont.size * 0.34} textAnchor="middle" fontFamily={tjFont.family} fontSize={tjFont.size}
        letterSpacing={tjFont.letterSpacing} fill={ink} {...tjFit.attrs}
      >
        {tarjeta}
      </text>
      {moto ? (
        <>
          <Mandatory text={top} cx={W / 2} baseline={74} cap={42} widths={WIDTHS_MOTO} gap={5} fill={ink} />
          <Mandatory text={bottom} cx={W / 2} baseline={126} cap={42} widths={WIDTHS_MOTO} gap={5} fill={ink} />
        </>
      ) : (
        <Mandatory text={serial} cx={W / 2} baseline={115} cap={63} widths={WIDTHS_CAR} gap={6} fill={ink} />
      )}
    </svg>
  );
}

function ArgentinaPlate({ parts, text }: { parts: Parts; text: string }) {
  const W = 294;
  const H = 129;
  const serialFont = { family: CONDENSED, size: 92, weight: 600, letterSpacing: 2 };
  const serial = parts.serial ?? '';
  const serialFit = fit(serial, serialFont, 262);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <rect width={W} height={H} rx="9" fill="#f4f5f2" />
      <rect x="1.2" y="1.2" width={W - 2.4} height={H - 2.4} rx="8" fill="none" stroke="#b9bcbf" strokeWidth="1.2" />
      {/* Black centre band between the white reflective strips. */}
      <rect x="5" y="24" width={W - 10} height="82" rx="3" fill="#161616" />
      <text x={W / 2} y="18.5" textAnchor="middle" fontFamily={CONDENSED} fontWeight="700" fontSize="17" letterSpacing="7" fill="#4f9fd9">ARGENTINA</text>
      {[40, W - 40].map((cx) => <rect key={cx} x={cx - 12} y="111" width="24" height="10" rx="2" fill="none" stroke="#c9ccce" strokeWidth="0.8" />)}
      <text
        x={W / 2} y="98" textAnchor="middle" fontFamily={serialFont.family} fontWeight={serialFont.weight} fontSize={serialFont.size}
        letterSpacing={serialFont.letterSpacing} fill="#f5f5f2" {...serialFit.attrs}
      >
        {serial}
      </text>
    </svg>
  );
}

export const mercosurTemplate: PlateTemplate<MercosurDesign> = {
  id: 'mercosur',
  name: 'Mercosur & predecessors (mm)',
  size: (d) => mercosurSize(d),
  render: ({ design, parts, text }) =>
    design.series === 'br-grey' ? <GreyPlate d={design} parts={parts} text={text} />
    : design.series === 'ar-1995' ? <ArgentinaPlate parts={parts} text={text} />
    : <MercosurPlate d={design} parts={parts} text={text} />,
  fonts: [FONTS.euro, FONTS.uk, FONTS.barlow600, FONTS.barlow700],
};
