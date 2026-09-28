import { useId, type ReactNode } from 'react';
import type { Parts, PlateTemplate } from '../core/types';
import { isLetteringType, letteringMetadata } from '../core/lettering';
import { buildLettering, letteringLayout, supportsLettering } from './lettering';
import { SvgScene } from './SvgScene';
import { CONDENSED, FONTS } from './fonts';
import { fit, measure, safeId, type FontSpec } from './measure';
import { SCENES, type UsSceneId } from './us-scenes';

export type { UsSceneId } from './us-scenes';
export type UsTextStyle = 'block' | 'script' | 'serif' | 'sans' | 'italic';
/** Drawn in place of the separator glyph when a state opts in. `dot` is a drawn bullet, not the font's `·`. */
export type UsSeparator = 'dot' | 'star' | 'nv-outline' | 'ny-outline';

export interface UsBand {
  color: string;
  /** Default 64. */
  height?: number;
  /** Rise of the band's inner edge at the centre (arched top band / dipped bottom band). */
  curve?: number;
}

export interface UsDesign {
  [key: string]: unknown;
  header: string;
  slogan: string;
  headerStyle?: UsTextStyle;
  headerSize?: number;
  headerY?: number;
  /** Small line under the header, e.g. "Land of Lincoln". */
  subheader?: string;
  subheaderColor?: string;
  subheaderStyle?: UsTextStyle;
  /** Top → bottom background gradient; use the same colour twice for a solid (e.g. black) plate. */
  bg?: [string, string];
  text?: string;
  headerColor?: string;
  sloganColor?: string;
  sloganStyle?: UsTextStyle;
  sloganSize?: number;
  /** `top` puts the slogan directly under the header instead of at the bottom edge. */
  sloganPosition?: 'top' | 'bottom';
  sloganY?: number;
  /** Outline around slogan letters (e.g. NY "EXCELSIOR" gold on blue). */
  sloganStroke?: string;
  /** Solid band behind the header (top) or slogan (bottom). Kept for the original single-band states. */
  band?: string;
  bandPosition?: 'top' | 'bottom';
  /** Independent top and bottom bands; merged over `band`/`bandPosition`. */
  bands?: { top?: UsBand; bottom?: UsBand };
  /** Thin decorative stripe color. */
  accent?: string;
  /** Border colour, or `none`. */
  frame?: string;
  /** Opacity of the diagonal sheen (default 0.35; lower it on dark plates). */
  sheen?: number;
  /** Background artwork drawn from our own shapes. */
  scene?: UsSceneId;
  /** Large stacked marker at the right, e.g. Illinois EV "EL"; stripped from the end of the serial text. */
  marker?: string;
  markerColor?: string;
  /** Emblem drawn in the gap wherever `separatorChar` appears. Unset → the character is set as plain text. */
  separator?: UsSeparator;
  /** Character replaced by the emblem; default `·`. */
  separatorChar?: string;
  separatorColor?: string;
}

const W = 600;
const H = 300;
const SCRIPT = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';
const SERIF = '"Times New Roman", Times, Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIAL_Y = 214;
/** Barlow Condensed cap height as a share of the font size. */
const CAP = 0.7;

type Font = FontSpec & { style?: 'italic' };
function fontFor(style: UsTextStyle, size: number): Font {
  switch (style) {
    case 'script': return { family: SCRIPT, size, weight: 400 };
    case 'serif': return { family: SERIF, size, weight: 700, letterSpacing: 1 };
    case 'sans': return { family: SANS, size, weight: 700, letterSpacing: 0.5 };
    case 'italic': return { family: CONDENSED, size, weight: 700, letterSpacing: 1, style: 'italic' };
    default: return { family: CONDENSED, size, weight: 700, letterSpacing: size >= 40 ? 5 : 3 };
  }
}
const fontAttrs = (f: Font) => ({
  fontFamily: f.family, fontSize: f.size, fontWeight: f.weight, letterSpacing: f.letterSpacing ?? 0,
  ...(f.style ? { fontStyle: f.style } : {}),
});

/** Emblems in their own unit box; `rel` is the drawn height as a share of the serial cap height. */
const EMBLEMS: Record<UsSeparator, { w: number; h: number; rel: number; draw: (fill: string) => ReactNode }> = {
  dot: { w: 10, h: 10, rel: 0.15, draw: (fill) => <circle cx="5" cy="5" r="5" fill={fill} /> },
  star: {
    w: 100, h: 95, rel: 0.34,
    draw: (fill) => <path d="M50 0 L61.8 36.3 H100 L69.1 58.8 L80.9 95 L50 72.6 L19.1 95 L30.9 58.8 L0 36.3 H38.2 Z" fill={fill} />,
  },
  // Simplified outlines drawn for this project, not traced from maps or plate artwork.
  'nv-outline': { w: 100, h: 140, rel: 0.5, draw: (fill) => <path d="M0 0 H100 V112 L94 116 L92 140 L0 50 Z" fill={fill} /> },
  'ny-outline': {
    w: 100, h: 78, rel: 0.4,
    draw: (fill) => <path d="M0 42 L10 32 L10 26 L26 20 L40 14 L50 2 L74 0 L78 50 L80 60 L100 64 L98 68 L80 74 L72 70 L70 64 L60 58 H2 Z" fill={fill} />,
  },
};

interface SerialRun { text: string; x: number; attrs: Record<string, unknown> }
interface Gap { cx: number; scale: number }
/** Splits `text` at `sep`, measures each run and a fixed emblem gap, then squeezes the whole row to `maxWidth`. */
function separatedLayout(text: string, sep: string, font: FontSpec, maxWidth: number, center: number, emblem: typeof EMBLEMS[UsSeparator]) {
  const runs = text.split(sep);
  const ls = font.letterSpacing ?? 0;
  const natural = runs.map((run) => measure(run, font));
  const emblemH = font.size * CAP * emblem.rel;
  const gapW = (emblemH * emblem.w) / emblem.h + font.size * 0.14;
  const visual = natural.reduce((sum, w) => sum + Math.max(0, w - ls), 0) + gapW * (runs.length - 1);
  const k = Math.min(1, maxWidth / visual);
  let x = center - (visual * k) / 2;
  const out: SerialRun[] = [];
  const gaps: Gap[] = [];
  runs.forEach((run, i) => {
    if (run) out.push({ text: run, x, attrs: k < 1 ? { textLength: natural[i] * k, lengthAdjust: 'spacingAndGlyphs' } : {} });
    x += Math.max(0, natural[i] - ls) * k;
    if (i < runs.length - 1) { gaps.push({ cx: x + (gapW * k) / 2, scale: k }); x += gapW * k; }
  });
  return { runs: out, gaps, emblemH };
}

/** Procedural glyphs are 86 units tall; a separator slot is 28 units plus 8 either side, so cap the emblem at 36 wide. */
const vectorEmblemHeight = (kind: UsSeparator) => Math.min(86 * EMBLEMS[kind].rel, (36 * EMBLEMS[kind].h) / EMBLEMS[kind].w);

function Emblem({ kind, cx, cy, height, fill, role }: { kind: UsSeparator; cx: number; cy: number; height: number; fill: string; role: string }) {
  const e = EMBLEMS[kind];
  const s = height / e.h;
  return (
    <g data-role={role} data-separator={kind} transform={`translate(${cx - (e.w * s) / 2} ${cy - height / 2}) scale(${s})`}>
      {e.draw(fill)}
    </g>
  );
}

function bandShape(pos: 'top' | 'bottom', b: UsBand): ReactNode {
  const h = b.height ?? 64;
  if (!b.curve) return <rect y={pos === 'top' ? 0 : H - h} width={W} height={h} fill={b.color} />;
  const d = pos === 'top'
    ? `M0 0 H${W} V${h} Q${W / 2} ${h - 2 * b.curve} 0 ${h} Z`
    : `M0 ${H} H${W} V${H - h} Q${W / 2} ${H - h + 2 * b.curve} 0 ${H - h} Z`;
  return <path d={d} fill={b.color} />;
}

function UsPlate({ design: d, text, parts }: { design: UsDesign; text: string; parts: Parts }) {
  const id = safeId(useId());
  const ink = d.text ?? '#1c2e6b';
  const [top, bottom] = d.bg ?? ['#ffffff', '#f1f3f6'];
  const headerColor = d.headerColor ?? ink;
  const scene = d.scene ? SCENES[d.scene] : undefined;
  const bands: { top?: UsBand; bottom?: UsBand } = {
    ...(d.band ? { [d.bandPosition === 'bottom' ? 'bottom' : 'top']: { color: d.band } } : {}),
    ...d.bands,
  };

  // Marker (IL "EL") takes the right edge; the serial is centred in what remains.
  const marker = d.marker && text.endsWith(d.marker) ? d.marker : undefined;
  const serialText = marker ? text.slice(0, -marker.length).trimEnd() : text;
  const markerFont: FontSpec = { family: CONDENSED, size: 200, weight: 500, letterSpacing: 2 };
  // Set taller than the serial and condensed a further 20%, like the stacked suffix on the plate.
  const markerW = marker ? measure(marker, markerFont) * 0.8 : 0;
  const serialRight = marker ? W - 64 - markerW : W - 40;
  const serialCenter = (40 + serialRight) / 2;
  const serialMax = serialRight - 40;

  const vectorType = isLetteringType(parts.lettering) && supportsLettering(serialText) ? parts.lettering : null;
  const sepChar = d.separatorChar ?? '·';
  const separator = d.separator && serialText.includes(sepChar) ? d.separator : undefined;

  const serialFont = { family: CONDENSED, size: 170, weight: 600, letterSpacing: 6 };
  const serial = fit(serialText, serialFont, serialMax);
  const split = separator && !vectorType
    ? separatedLayout(serialText, sepChar, serialFont, serialMax, serialCenter, EMBLEMS[separator]) : null;

  const headerStyle = d.headerStyle ?? 'block';
  const headerFont = fontFor(headerStyle, d.headerSize ?? ({ script: 62, serif: 52, sans: 44 } as Record<string, number>)[headerStyle] ?? 46);
  const header = fit(d.header, headerFont, 500);
  const headerY = d.headerY ?? (headerStyle === 'script' ? 62 : 54);
  const subFont = fontFor(d.subheaderStyle ?? 'serif', 18);
  const sloganFont: Font = d.sloganStyle && d.sloganStyle !== 'block'
    ? fontFor(d.sloganStyle, d.sloganSize ?? 26)
    : { family: CONDENSED, size: d.sloganSize ?? 26, weight: 600, letterSpacing: 3 };
  const slogan = fit(d.slogan, sloganFont, 380);
  const sloganTop = d.sloganPosition === 'top';
  const sloganY = d.sloganY ?? (sloganTop ? headerY + 30 : 278);
  const onBottomBand = !sloganTop && !!bands.bottom && (bands.bottom.height ?? 64) >= 36;
  const sloganFill = onBottomBand ? (d.sloganColor ?? '#fff') : (d.sloganColor ?? ink);

  const holes = [
    [118, 30], [482, 30], [118, 270], [482, 270],
  ];

  const layers = [
    { dx: 3, dy: 4, fill: '#000', opacity: 0.22 },
    { dx: 0, dy: 0, fill: ink, opacity: 1 },
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text}>
      <metadata>{JSON.stringify({ serial: text, parts, lettering: {
        ...letteringMetadata(vectorType ?? 'default'), requested: parts.lettering ?? 'default',
        fallback: isLetteringType(parts.lettering) && !vectorType,
      } })}</metadata>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={d.sheen ?? 0.35} />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.06" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect width={W} height={H} rx="22" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}clip)`}>
        <rect width={W} height={H} fill={`url(#${id}bg)`} />
        {scene?.under && <g data-role="scene" data-scene={d.scene}>{scene.under(id)}</g>}
        {bands.top && bandShape('top', bands.top)}
        {bands.bottom && bandShape('bottom', bands.bottom)}
        {scene?.over && <g data-role="scene-over">{scene.over(id)}</g>}
        {d.accent && <rect y="72" width={W} height="7" fill={d.accent} opacity="0.85" />}
        <rect width={W} height={H} fill={`url(#${id}sheen)`} />
      </g>
      {d.frame !== 'none' && (
        <rect x="7" y="7" width={W - 14} height={H - 14} rx="17" fill="none" stroke={d.frame ?? ink} strokeWidth="5" />
      )}
      {holes.map(([cx, cy]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="15" ry="7" fill="#000" opacity="0.22" />
      ))}

      <text x={W / 2} y={headerY} textAnchor="middle" {...fontAttrs(headerFont)} fill={headerColor} {...header.attrs}>
        {d.header}
      </text>
      {d.subheader && (
        <text x={W / 2} y={headerY + 20} textAnchor="middle" {...fontAttrs(subFont)} fill={d.subheaderColor ?? headerColor}
          {...fit(d.subheader, subFont, 380).attrs}>
          {d.subheader}
        </text>
      )}

      {/* Both layers use the same geometry; headers/slogans retain their fonts. */}
      {layers.map((layer, i) => {
        const role = i === 0 ? 'separator-shadow' : 'separator';
        if (vectorType) {
          const letters = separator ? serialText.split(sepChar).join(' ') : serialText;
          const layout = letteringLayout(letters, 124, serialMax);
          let cursor = 0;
          const centres: number[] = [];
          [...serialText].forEach((ch, j) => { if (separator && ch === sepChar) centres.push(cursor + layout.widths[j] / 2); cursor += layout.widths[j] + 8; });
          const left = serialCenter + layer.dx - layout.renderedWidth / 2;
          const cy = SERIAL_Y + layer.dy - layout.renderedHeight / 2;
          return (
            <g key={i} opacity={layer.opacity}>
              <SvgScene node={buildLettering({ text: letters, type: vectorType,
                centerX: serialCenter + layer.dx, baseline: SERIAL_Y + layer.dy,
                height: 124, maxWidth: serialMax, ink: layer.fill, role: i === 0 ? 'serial-shadow' : 'serial' })} />
              {centres.map((c, j) => (
                <Emblem key={j} kind={separator!} cx={left + c * layout.scale} cy={cy}
                  height={vectorEmblemHeight(separator!) * layout.scale}
                  fill={i === 0 ? layer.fill : (d.separatorColor ?? layer.fill)} role={role} />
              ))}
            </g>
          );
        }
        if (split) {
          return (
            <g key={i} opacity={layer.opacity}>
              {split.runs.map((run, j) => (
                <text key={j} x={run.x + layer.dx} y={SERIAL_Y + layer.dy} {...fontAttrs(serialFont)} fill={layer.fill} {...run.attrs}>
                  {run.text}
                </text>
              ))}
              {split.gaps.map((gap, j) => (
                <Emblem key={`g${j}`} kind={separator!} cx={gap.cx + layer.dx} cy={SERIAL_Y + layer.dy - (serialFont.size * CAP) / 2}
                  height={split.emblemH * gap.scale} fill={i === 0 ? layer.fill : (d.separatorColor ?? layer.fill)} role={role} />
              ))}
            </g>
          );
        }
        return (
          <text
            key={i}
            x={serialCenter + layer.dx}
            y={SERIAL_Y + layer.dy}
            textAnchor="middle"
            fontFamily={serialFont.family}
            fontSize={serialFont.size}
            fontWeight={serialFont.weight}
            letterSpacing={serialFont.letterSpacing}
            fill={layer.fill}
            opacity={layer.opacity}
            {...serial.attrs}
          >
            {serialText}
          </text>
        );
      })}

      {marker && (
        <text data-role="marker" x={W - 36} y={236} textAnchor="end" {...fontAttrs(markerFont)} fill={d.markerColor ?? ink}
          textLength={markerW} lengthAdjust="spacingAndGlyphs">
          {marker}
        </text>
      )}

      {d.slogan && (
        <text
          x={W / 2}
          y={sloganY}
          textAnchor="middle"
          {...fontAttrs(sloganFont)}
          fill={sloganFill}
          {...(d.sloganStroke ? { stroke: d.sloganStroke, strokeWidth: 1.5, paintOrder: 'stroke' } : {})}
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
  render: ({ design, text, parts }) => <UsPlate design={design} text={text} parts={parts} />,
  fonts: [FONTS.barlow600, FONTS.barlow700],
};
