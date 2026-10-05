import type { Parts, PlateFormat } from '../core/types';
import { BC_DECALS, decalId, type BcDecal } from '../regions/canada/bc-decals';

/** Imported passenger renewal references; other provinces need their own catalogue. */
export function provinceDecals(regionId: string): readonly BcDecal[] {
  return regionId === 'ca-bc' ? BC_DECALS : [];
}

export function canApplyDecal(format: PlateFormat, decal: BcDecal): boolean {
  return !!format.fields.find(field => field.key === 'decal')?.options?.some(option => option.value === decalId(decal));
}

/** Keep the current serial, month, dies and finish when applying a gallery choice. */
export function applyDecal(format: PlateFormat, parts: Parts, decal: BcDecal): Parts {
  return canApplyDecal(format, decal) ? { ...parts, decal: decalId(decal) } : parts;
}

export function filterProvinceDecals(regionId: string, format: PlateFormat, query: string, compatibleOnly: boolean): BcDecal[] {
  const text = query.trim().toLowerCase();
  return provinceDecals(regionId).filter(decal => (!compatibleOnly || canApplyDecal(format, decal))
    && `${decal.year} ${decal.variant ?? ''} ${decal.style} ${decal.colours}`.toLowerCase().includes(text))
    .sort((a, b) => a.year - b.year);
}
