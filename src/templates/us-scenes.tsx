/**
 * Simple background scenes for the US template, drawn from our own shapes on
 * the 600×300 plate grid. They suggest each plate's artwork; none is traced
 * from a photograph, a thumbnail or the issuing state's files.
 *
 * `under` sits above the background and below any bands; `over` sits above
 * the bands (e.g. a skyline inside a header bar). Both stay below the text.
 */
import type { ReactNode } from 'react';

export type UsSceneId =
  | 'az-clouds' | 'ga-peach' | 'ny-2001' | 'ny-2010' | 'ny-excelsior'
  | 'pr-garita' | 'il-skyline' | 'il-lincoln' | 'pa-keystone' | 'pa-liberty-bell';

export interface UsScene {
  under?: (id: string) => ReactNode;
  over?: (id: string) => ReactNode;
}

const cloud = (cx: number, cy: number, s: number) => (
  <g key={`${cx}-${cy}`} fill="#fff">
    <circle cx={cx - 0.55 * s} cy={cy + 0.1 * s} r={0.38 * s} />
    <circle cx={cx - 0.15 * s} cy={cy - 0.2 * s} r={0.5 * s} />
    <circle cx={cx + 0.35 * s} cy={cy - 0.1 * s} r={0.45 * s} />
    <circle cx={cx + 0.75 * s} cy={cy + 0.15 * s} r={0.32 * s} />
    <rect x={cx - 0.9 * s} y={cy + 0.05 * s} width={1.9 * s} height={0.42 * s} rx={0.2 * s} />
  </g>
);

/** Head-and-shoulders bust, bearded, facing right; centred on `cx`, top of head at `top`. */
const bust = (cx: number, top: number, s: number, fill: string, shade: string) => (
  <g transform={`translate(${cx} ${top}) scale(${s})`}>
    <path d="M-62 150 Q-58 104 -24 92 L24 92 Q58 104 62 150 Z" fill={fill} />
    <path d="M-10 90 L0 104 L10 90 Z" fill={shade} />
    <ellipse cx="0" cy="40" rx="27" ry="36" fill={fill} />
    <path d="M-27 40 Q-30 88 0 92 Q30 88 27 40 Q20 70 0 72 Q-20 70 -27 40 Z" fill={shade} />
    <path d="M-27 30 Q-24 2 0 2 Q26 2 28 26 Q14 12 -6 16 Q-20 18 -27 30 Z" fill={shade} />
  </g>
);

const buildings = (fill: string, rows: readonly (readonly [number, number, number])[], base: number) =>
  rows.map(([x, w, h]) => <rect key={x} x={x} y={base - h} width={w} height={h} fill={fill} />);

export const SCENES: Record<UsSceneId, UsScene> = {
  'az-clouds': { under: () => [cloud(372, 150, 125), cloud(112, 200, 82), cloud(512, 250, 58)] },

  'ga-peach': {
    under: (id) => (
      <g>
        <defs>
          <radialGradient id={`${id}peach`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#ffd3a4" />
            <stop offset="0.55" stopColor="#f59a62" />
            <stop offset="1" stopColor="#d8633c" />
          </radialGradient>
        </defs>
        <path d="M300 118 C262 112 242 146 248 176 C254 206 282 216 300 210 C318 216 346 206 352 176 C358 146 338 112 300 118 Z" fill={`url(#${id}peach)`} />
        <path d="M301 122 C292 146 294 184 300 208" stroke="#c4532e" strokeWidth="2.5" fill="none" opacity="0.55" />
        <path d="M301 120 L306 102" stroke="#6b4a2b" strokeWidth="4" strokeLinecap="round" />
        <path d="M305 106 C316 84 344 80 362 90 C348 108 326 114 305 106 Z" fill="#3f8f4a" />
      </g>
    ),
  },

  // 2001–2010: a sky bar with mountains and falls at the left and the city at the right.
  'ny-2001': {
    over: (id) => (
      <g>
        <defs>
          <linearGradient id={`${id}nysky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c3d3ec" />
            <stop offset="0.6" stopColor="#3a4f8f" />
            <stop offset="1" stopColor="#1b2656" />
          </linearGradient>
        </defs>
        <rect width="600" height="74" fill={`url(#${id}nysky)`} />
        <path d="M0 74 V36 L28 26 L52 40 L82 22 L118 46 L150 48 L176 74 Z" fill="#1b2656" />
        <rect x="64" y="46" width="34" height="28" fill="#e2eaf6" />
        {[70, 78, 86, 93].map((x) => <line key={x} x1={x} y1="48" x2={x} y2="74" stroke="#9fb4d8" strokeWidth="1.5" />)}
        {buildings('#1b2656', [[468, 16, 22], [486, 12, 34], [500, 18, 26], [520, 14, 42], [536, 10, 30], [548, 14, 56], [564, 18, 34], [584, 16, 24]], 74)}
        <line x1="555" y1="18" x2="555" y2="4" stroke="#1b2656" strokeWidth="3" />
      </g>
    ),
  },

  'ny-2010': {
    over: () => <path d="M0 80 Q300 52 600 80" stroke="#e8a93a" strokeWidth="3" fill="none" />,
  },

  // 2020 Excelsior: gold/blue rules either side of the name; falls, woods and city along the bottom.
  'ny-excelsior': {
    under: () => (
      <g>
        <path d="M0 300 V262 Q80 244 170 258 Q300 240 430 256 Q520 244 600 258 V300 Z" fill="#d7e7f6" />
        <rect x="16" y="236" width="44" height="62" fill="#3b78c2" />
        {[22, 30, 38, 46, 54].map((x) => <line key={x} x1={x} y1="238" x2={x} y2="298" stroke="#eaf3fb" strokeWidth="2" />)}
        {[66, 82, 98, 114, 130].map((x, i) => (
          <path key={x} d={`M${x - 9} 294 L${x} ${256 - (i % 2) * 10} L${x + 9} 294 Z`} fill="#1d3b78" />
        ))}
        <rect x="428" y="270" width="16" height="24" fill="#1d3b78" />
        <path d="M432 270 L434 248 L440 248 L442 270 Z" fill="#1d3b78" />
        <line x1="440" y1="250" x2="446" y2="232" stroke="#1d3b78" strokeWidth="3" />
        <circle cx="437" cy="245" r="4" fill="#1d3b78" />
        {buildings('#1d3b78', [[458, 12, 22], [472, 14, 34], [488, 10, 26], [500, 16, 44], [518, 12, 30], [532, 14, 38], [548, 12, 24]], 294)}
        <line x1="508" y1="250" x2="508" y2="226" stroke="#1d3b78" strokeWidth="2" />
        <path d="M574 294 L577 262 H583 L586 294 Z" fill="#1d3b78" />
      </g>
    ),
    over: () => (
      <g>
        <rect x="16" y="34" width="132" height="6" fill="#f0b323" />
        <rect x="16" y="43" width="132" height="2.5" fill="#1d3b78" />
        <rect x="452" y="34" width="132" height="6" fill="#f0b323" />
        <rect x="452" y="43" width="132" height="2.5" fill="#1d3b78" />
      </g>
    ),
  },

  // A garita (sentry box) on a stretch of wall, in outline.
  'pr-garita': {
    under: () => (
      <g transform="translate(36 22) scale(0.88)" fill="#f3e8da" stroke="#c49c6e" strokeWidth="3" strokeLinejoin="round" opacity="0.55">
        <rect x="300" y="128" width="112" height="118" />
        {[151, 174, 197, 220].map((y) => <line key={y} x1="300" y1={y} x2="412" y2={y} />)}
        {[128, 151, 174, 197, 220].map((y, row) => [0, 1, 2].map((c) => {
          const x = 318 + c * 36 + (row % 2) * 18;
          return x < 410 ? <line key={`${y}-${c}`} x1={x} y1={y} x2={x} y2={y + 23} /> : null;
        }))}
        <path d="M258 206 H318 L302 240 H274 Z" />
        <rect x="262" y="96" width="52" height="110" />
        <line x1="262" y1="104" x2="314" y2="104" />
        <path d="M258 96 Q288 48 318 96 Z" />
        <line x1="288" y1="60" x2="288" y2="46" />
        <circle cx="288" cy="42" r="5" />
        <rect x="282" y="122" width="10" height="34" rx="4" fill="#c49c6e" />
      </g>
    ),
  },

  // 2017 base: gradient sky over a white Chicago–Springfield skyline, Lincoln at the far left.
  'il-skyline': {
    under: () => (
      <g>
        <g fill="#fff">
          {buildings('#fff', [[140, 44, 118], [240, 46, 108], [290, 36, 142], [330, 40, 96], [452, 40, 64], [566, 40, 86]], 252)}
          <rect x="190" y="72" width="46" height="180" />
          <rect x="198" y="56" width="30" height="18" />
          <path d="M372 252 V204 L394 186 L416 204 V252 Z" />
          <path d="M424 252 L432 184 L440 252 Z" />
          <rect x="502" y="142" width="58" height="110" />
          <path d="M498 144 Q531 78 564 144 Z" />
          <rect x="525" y="84" width="12" height="20" />
          <rect x="0" y="252" width="600" height="48" />
        </g>
        <g stroke="#fff" strokeWidth="3" fill="none">
          <line x1="206" y1="56" x2="206" y2="22" />
          <line x1="220" y1="56" x2="220" y2="30" />
          <circle cx="432" cy="178" r="12" />
          <line x1="420" y1="178" x2="444" y2="178" />
          <line x1="432" y1="166" x2="432" y2="190" />
          <line x1="531" y1="84" x2="531" y2="62" />
        </g>
        {bust(58, 104, 1.3, '#c9cdd3', '#a9aeb6')}
      </g>
    ),
  },

  'il-lincoln': { under: () => bust(290, 112, 1.05, '#dde0e5', '#c6cad1') },

  // 2017 base: the state outline at the top left of the navy bar (position approximate).
  'pa-keystone': {
    over: () => (
      <path transform="translate(24 16) scale(0.5)" d="M0 10 L10 0 H96 L90 14 L100 30 L92 44 L96 56 H0 Z"
        fill="none" stroke="#f2b705" strokeWidth="6" strokeLinejoin="round" />
    ),
  },

  'pa-liberty-bell': {
    under: () => (
      <g fill="#d9d6c8" stroke="#aaa699" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="262" y="76" width="76" height="14" rx="5" />
        <rect x="292" y="90" width="16" height="14" />
        <path d="M276 104 Q300 96 324 104 Q334 110 336 150 Q338 200 356 226 Q362 236 350 242 H250 Q238 236 244 226 Q262 200 264 150 Q266 110 276 104 Z" />
        <path d="M246 228 H354" fill="none" />
        <path d="M292 150 L298 170 L291 192 L300 212 L295 240" fill="none" stroke="#8a877c" strokeWidth="3" />
        <circle cx="300" cy="252" r="8" />
      </g>
    ),
  },
};
