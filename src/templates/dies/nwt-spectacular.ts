import {buildDieText, dieGlyph, type DieProfile, type DieRun, type DieTextProps} from './engine';
import {node, type SvgNode} from '../svg-scene';

/** Intended blue paint body; the pale shoulder is a separate rendering layer. */
export const NWT_SPECTACULAR_PROFILE: DieProfile = {
  id: 'nwt-spectacular',
  label: 'NWT Spectacular · condensed serial reconstruction',
  params: {width: 48, stroke: 12, curve: 'box', boxRadius: 23, tracking: 19,
    narrow: 1, wide: 1, one: 'flag', two: 'curved', three: 'round', four: 'closed',
    six: 'curved', seven: 'straight', nine: 'curved', a: 'flat'},
  overrides: {
    N: {advance: 48, fill: true, paths: [
      'M1 0 H13 L35 68 V0 H47 V100 H35 L13 32 V100 H1 Z',
    ]},
    W: {advance: 48, fill: true, paths: [
      'M1.5 0 H12.5 L15 55 L24 22.5 L33 55 L35.5 0 H46.5 L43.5 100 H31 L24 75 L17 100 H4.5 Z',
    ]},
    T: {advance: 48, fill: true, paths: [
      'M1 0 H47 V12 H30 V100 H18 V12 H1 Z',
    ]},
    '1': {advance: 48, fill: true, paths: [
      'M20 0 H30 V100 H18 V19 H12 V7 Q17 5 20 0 Z',
    ]},
    '2': {advance: 48, fill: true, paths: [
      'M1 28 C1 9 12 0 24 0 C36 0 44 9 44 24 C44 35 36 43 28 53 C20 63 16 76 13 88 H47 V100 H1 C2 72 10 54 23 36 C29 27 34 22 32 17 C30 13 27 12 23 12 C17 12 14 18 14 28 Z',
    ]},
    '3': {advance: 48, fill: true, paths: [
      'M 2.34,22.0 C 3.28,7.0 12.68,0.0 23.96,0.0 C 38.06,0.0 44.64,10.0 44.64,27.0 C 44.64,36.0 42.76,41.0 38.06,47.0 C 43.7,52.0 46.52,61.0 46.52,73.0 C 46.52,90.0 38.06,100.0 23.02,100.0 C 8.92,100.0 1.4,88.0 1.4,74.0 L 13.62,74.0 C 13.62,82.0 16.44,89.0 23.02,89.0 C 30.54,89.0 34.3,83.0 34.3,73.0 C 34.3,60.0 30.54,55.0 20.2,55.0 L 20.2,42.0 C 29.6,42.0 32.42,37.0 32.42,26.0 C 32.42,17.0 29.6,12.0 23.96,12.0 C 18.32,12.0 14.56,16.0 14.56,24.0 L 2.34,22.0 Z',
    ]},
  },
  evidence: {
    status: 'research-candidate',
    specimens: [{title: 'NWT Gazette · May 2013 plate illustration, page 47',
      url: 'https://www.justice.gov.nt.ca/fr/fichiers/gazette-des-tno/2013/05_2.pdf#page=47'}],
    notes: 'Observed N/W/T/1/2/3 reconstructed as smooth intended paint bodies from the official NWT123 illustration. N has deep diagonal counter notches; W has a high center peak and short bottom notch; 2 retains its long curved diagonal and square foot; 3 has unequal curved bowls and a projecting middle bar. The main blue body is separate from its pale outlined shoulder. Fixed 48-unit advances include the narrow painted 1; tracking is 19 cap units. Other digits remain compatible heavy condensed constructions without independent photographic verification. This does not identify a commercial font or certify every physical die.',
  },
};


/** Same paint construction for all layers, including stroked unobserved digits. */
export function buildNwtSpectacularSerial(props: Omit<DieTextProps, 'profile'>): DieRun {
  const paint = buildDieText({...props, profile: NWT_SPECTACULAR_PROFILE});
  const shoulder = (color: string, extra: number, layer: string): SvgNode => {
    const copy = (item: SvgNode | string): SvgNode | string => {
      if (typeof item === 'string') return item;
      const character = item.attrs['data-character'];
      const glyph = character === undefined ? undefined : dieGlyph(NWT_SPECTACULAR_PROFILE, String(character));
      return {
        ...item,
        attrs: {...item.attrs, ...(glyph ? {
          fill: glyph.fill ? color : 'none', stroke: color,
          strokeWidth: glyph.fill ? extra : (glyph.stroke ?? NWT_SPECTACULAR_PROFILE.params.stroke) + extra,
          fillRule: 'evenodd', strokeLinejoin: 'miter',
        } : {})},
        children: item.children.filter(child => typeof child === 'string' || child.tag !== 'title').map(copy),
      };
    };
    const copied = copy(paint.node) as SvgNode;
    copied.attrs = {...copied.attrs, 'data-role': `${props.role}-${layer}`, 'data-layer': layer,
      role: 'presentation', 'aria-hidden': 'true'};
    delete copied.attrs['aria-label'];
    return copied;
  };
  return {...paint, node: node('g', {'data-role': 'nwt-spectacular-lettering'},
    shoulder('#64777c', 3.5, 'outer-shoulder'), shoulder('#e1e7e5', 2, 'pale-shoulder'), paint.node)};
}
