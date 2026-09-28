import type { PlateTemplate } from '../core/types';
import { getStandIn, layoutStandIn, normalizeStandIn, type Metrics, type StandIn } from '../stand-ins';
import { FONTS } from './fonts';
import { inkExtent, measure } from './measure';

export interface StandInDesign {
  [key: string]: unknown;
  /** Id of the stand-in artwork in `src/stand-ins/manifest.json`. */
  standIn?: string;
}

const metricsFor = (p: StandIn): Metrics => {
  const font = (size: number) => ({ family: p.text.font, size, weight: p.text.weight });
  return { width: (ch, size) => measure(ch, font(size)), ink: (text, size) => inkExtent(text, font(size)) };
};

/** Published artwork with the serial set over it, one glyph at a time so spacing and centring match the source. */
function StandInPlate({ plate: p, text }: { plate: StandIn; text: string }) {
  const { width: W, height: H } = p.artwork;
  const layout = layoutStandIn(p, normalizeStandIn(p, text), metricsFor(p));
  const t = p.text, s = p.separator;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={p.customizable ? text : p.name}>
      <metadata>{JSON.stringify({ standIn: p.id, source: p.sourceUrl, serial: text })}</metadata>
      <image href={p.artwork.url} width={W} height={H} preserveAspectRatio="none" />
      {layout?.glyphs.map((g, i) => {
        if (!g.mark) {
          return (
            <text
              key={i} x={g.x} y={layout.baseline} fontFamily={t.font} fontWeight={t.weight} fontSize={layout.size} fill={t.color}
              {...(t.outline ? { stroke: t.outline.color, strokeWidth: layout.outlineWidth, strokeLinejoin: 'round' as const, paintOrder: 'stroke' } : {})}
            >
              {g.char}
            </text>
          );
        }
        const y = layout.middle - layout.mark.height / 2;
        if (!s.url || !s.bounds || !s.imageWidth || !s.imageHeight) {
          return <circle key={i} cx={g.x + g.width / 2} cy={layout.middle} r={g.width / 2} fill={t.color} data-role="separator" />;
        }
        // the separator file is a whole transparent plate; the viewBox crops it to the emblem
        const [bx, by, bw, bh] = s.bounds;
        return (
          <svg key={i} x={g.x} y={y} width={g.width} height={layout.mark.height} viewBox={`${bx} ${by} ${bw} ${bh}`} preserveAspectRatio="none" data-role="separator">
            <image href={s.url} width={s.imageWidth} height={s.imageHeight} preserveAspectRatio="none" />
          </svg>
        );
      })}
    </svg>
  );
}

export const standInTemplate: PlateTemplate<StandInDesign> = {
  id: 'standin',
  name: 'Stand-in artwork (raster)',
  size: (d) => {
    const p = getStandIn(d.standIn);
    return p ? { width: p.artwork.width, height: p.artwork.height } : { width: 600, height: 300 };
  },
  render: ({ design, text }) => {
    const p = getStandIn(design.standIn);
    if (!p) return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" role="img" aria-label="Missing stand-in artwork"><rect width="600" height="300" fill="#ddd" /></svg>;
    return <StandInPlate plate={p} text={text} />;
  },
  fonts: [FONTS.antonio],
};
