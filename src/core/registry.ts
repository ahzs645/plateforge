/**
 * Central registry. Built-in regions/templates are registered in
 * `src/regions/index.ts` and `src/templates/index.ts`; third-party code can call
 * `registerRegion` / `registerTemplate` the same way.
 */
import { formatText } from './format';
import { createRng, type Rng } from './random';
import type { Design, Parts, Plate, PlateFormat, PlateTemplate, Region } from './types';

const regions = new Map<string, Region>();
const templates = new Map<string, PlateTemplate<any>>();

export function registerRegion(...list: Region[]): void {
  for (const region of list) {
    if (!region.formats.length) throw new Error(`Region ${region.id} has no formats`);
    regions.set(region.id, region);
  }
}

export function registerTemplate<D extends Design>(template: PlateTemplate<D>): void {
  templates.set(template.id, template);
}

export const getRegions = (): Region[] => [...regions.values()];
export const getRegion = (id: string): Region | undefined => regions.get(id);

export function getTemplate(id: string): PlateTemplate<any> {
  const t = templates.get(id);
  if (!t) throw new Error(`Unknown template "${id}"`);
  return t;
}

/** The template a plate is drawn with: the format's own, else its region's. */
export const templateFor = (region: Region, format: PlateFormat): PlateTemplate<any> => getTemplate(format.template ?? region.template);

export function getFormat(region: Region, formatId?: string): PlateFormat {
  return region.formats.find((f) => f.id === formatId) ?? region.formats[0];
}

/** Region design ← format design ← user overrides. */
export function resolveDesign(region: Region, format: PlateFormat, overrides?: Design): Design {
  return { ...region.design, ...format.design, ...overrides };
}

export function makePlate(region: Region, format: PlateFormat, parts: Parts): Plate {
  return { region, format, parts, text: formatText(format, parts) };
}

export function generatePlate(region: Region, format: PlateFormat, rng: Rng = createRng()): Plate {
  return makePlate(region, format, format.generate(rng));
}

/** Generates `count` plates. With `regionPool`, each plate uses a random region/format from the pool. */
export function generateBatch(
  count: number,
  seed: string,
  source: { region: Region; format: PlateFormat } | { regionPool: Region[] },
): Plate[] {
  const rng = createRng(seed || undefined);
  return Array.from({ length: count }, () => {
    if ('regionPool' in source) {
      const region = rng.pick(source.regionPool);
      return generatePlate(region, rng.pick(region.formats), rng);
    }
    return generatePlate(source.region, source.format, rng);
  });
}
