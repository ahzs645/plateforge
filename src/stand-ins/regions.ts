/**
 * Turns stand-in artwork into formats: state and provincial designs join their real region under a
 * "Stand-in artwork" family; themed and famous designs get a region of their own.
 */
import { compilePattern } from '../core/pattern';
import { formatText } from '../core/format';
import type { PlateFamily, PlateFormat, Region } from '../core/types';
import { CREDIT, isThemed, MARK, normalizeStandIn, STAND_INS, type StandIn } from './index';

export const STAND_IN_FAMILY: PlateFamily = {
  id: 'stand-in',
  label: 'Stand-in artwork',
  summary: 'Published raster artwork from Not a Tesla App, lettered in Antonio, used until an SVG reconstruction exists.',
};
/** Family given to a region's own formats when stand-ins are its first extra family. */
const SVG_FAMILY: PlateFamily = { id: 'svg', label: 'SVG plates' };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const THEMED_SERIAL = compilePattern('AAA·999');

/** Puts the plate's emblem where the serial's first group break is, as the source editor's button would. */
function withMark(p: StandIn, serial: string): string {
  if (!p.separator.available || serial.includes(MARK)) return serial;
  return serial.replace(/[ -]/, MARK);
}

function describe(p: StandIn): string {
  const size = `${p.artwork.width}×${p.artwork.height}`;
  return p.customizable
    ? `${p.name} as published by Not a Tesla App (${size} artwork), lettered in Antonio and auto-fitted the way their editor does. A stand-in until this design is rebuilt in SVG; ${p.separator.available ? `type ${MARK} where the emblem goes (up to ${p.separator.max})` : 'this plate has no emblem separator'}.`
    : `${p.name} as published by Not a Tesla App (${size}). The lettering is part of the artwork, so this design is not editable.`;
}

export function standInFormat(p: StandIn, serialSource?: PlateFormat): PlateFormat {
  const common = {
    id: `stand-in-${p.id}`,
    label: `${p.name}${p.customizable ? '' : ' (fixed artwork)'}`,
    description: describe(p),
    references: [{ title: `Not a Tesla App · ${p.name}`, url: p.sourceUrl }],
    family: STAND_IN_FAMILY.id,
    status: 'stand-in' as const,
    template: 'standin',
    design: { standIn: p.id },
  };
  if (!p.customizable) {
    return { ...common, fields: [], generate: () => ({}), validate: () => null, text: () => p.name };
  }
  const limit = p.text.maxLength + (p.separator.available ? p.separator.max : 0);
  return {
    ...common,
    pattern: `Up to ${p.text.maxLength} characters${p.separator.available ? `, plus ${MARK} for the emblem` : ''}`,
    fields: [{ key: 'serial', label: 'Serial', maxLength: limit, placeholder: 'YOUR TEXT' }],
    generate(rng) {
      const serial = serialSource ? formatText(serialSource, serialSource.generate(rng)) : THEMED_SERIAL.generate(rng);
      return { serial: normalizeStandIn(p, withMark(p, serial)) };
    },
    validate: ({ serial = '' }) => {
      if (!serial.trim()) return 'Enter some text';
      return normalizeStandIn(p, serial) === serial.toUpperCase().trim() ? null
        : `At most ${p.text.maxLength} characters${p.separator.available ? ` and ${p.separator.max} ${MARK}` : ''}`;
    },
    text: ({ serial = '' }) => normalizeStandIn(p, serial),
  };
}

export const THEMED_REGION_ID = 'themed';

/**
 * Adds every stand-in to the region it depicts (matched on country and region name, accents ignored).
 * Regions without families get an explicit "SVG plates" family first, so their own designs keep leading.
 */
export function withStandIns(regions: Region[], standIns: readonly StandIn[] = STAND_INS): Region[] {
  const byName = new Map(regions.map((r) => [`${fold(r.country ?? r.name)}/${fold(r.name)}`, r]));
  const extra = new Map<Region, PlateFormat[]>();
  const themed: PlateFormat[] = [];
  for (const p of standIns) {
    const region = !isThemed(p) && p.country && p.region ? byName.get(`${fold(p.country)}/${fold(p.region)}`) : undefined;
    if (!region) { themed.push(standInFormat(p)); continue; }
    const source = region.formats.find((f) => f.id === 'standard' && !f.status) ?? region.formats.find((f) => !f.status) ?? region.formats[0];
    extra.set(region, [...(extra.get(region) ?? []), standInFormat(p, source)]);
  }
  const out = regions.map((region) => {
    const formats = extra.get(region);
    if (!formats) return region;
    return {
      ...region,
      formats: [...region.formats, ...formats],
      families: [...(region.families?.length ? region.families : [SVG_FAMILY]), STAND_IN_FAMILY],
    };
  });
  if (themed.length) {
    out.push({
      id: THEMED_REGION_ID,
      name: 'Themed & famous plates',
      code: 'FX',
      group: 'Themed',
      country: 'Themed & famous plates',
      flag: '🎬',
      template: 'standin',
      design: {},
      families: [STAND_IN_FAMILY],
      formats: themed,
      notes: `Film, television and brand designs, plus designs without a matching region. ${CREDIT}`,
    });
  }
  return out;
}
