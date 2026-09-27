import { makePlate } from '../core/registry';
import { createRng } from '../core/random';
import type { Plate, PlateFormat, Region } from '../core/types';

const cache = new Map<string, Plate>();

/** A stable, seeded example plate for thumbnails; the same format always shows the same serial. */
export function samplePlate(region: Region, format: PlateFormat): Plate {
  const key = `${region.id}/${format.id}`;
  let plate = cache.get(key);
  if (!plate) {
    plate = makePlate(region, format, format.generate(createRng(key)));
    cache.set(key, plate);
  }
  return plate;
}
