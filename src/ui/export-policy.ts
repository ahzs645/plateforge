import type { Plate } from '../core/types';
import { resolveDesign, templateFor } from '../core/registry';
import { iraqCustomStateFromParts, renderIraqCustom } from '../templates/iraq-custom-scene';
import { IRAQ_FONT_PROFILES } from '../templates/iraq-custom-fonts';
import { iranStateForPlate } from '../templates/iran-region-bridge';
import { renderIranCustom } from '../templates/iran-custom-scene';
import { IRAN_FONT_PROFILES } from '../templates/iran-custom-fonts';

export interface PlateExportReview { errors: string[]; notices: string[]; rights: 'unreviewed' | 'private-study' | 'profile-labelled' }
/** One preflight for desktop, mobile and programmatic exports; warnings are not validity errors. */
export function reviewPlateExport(plate: Plate): PlateExportReview {
  const result: PlateExportReview = { errors: [], notices: [], rights: 'unreviewed' };
  const validation = plate.format.validate?.(plate.parts);
  if (validation) result.errors.push(validation);
  const design = resolveDesign(plate.region, plate.format);
  const template = templateFor(plate.region, plate.format).id;
  if (template === 'iq-flat') {
    const state = iraqCustomStateFromParts(String(design.presetId ?? plate.format.id), plate.parts);
    const scene = renderIraqCustom(state);
    result.errors.push(...scene.errors); result.notices.push(...scene.warnings);
    const profile = Object.values(IRAQ_FONT_PROFILES).find((p) => p.id === state.fontProfile);
    if (profile) {
      result.notices.push(profile.rights);
      result.rights = profile.rights.startsWith('Private') ? 'private-study' : 'profile-labelled';
    }
  } else if (template === 'ir') {
    const state = iranStateForPlate(design, plate.parts);
    if (state) {
      const scene = renderIranCustom(state), profile = IRAN_FONT_PROFILES[state.fontProfile];
      result.errors.push(...scene.errors); result.notices.push(...scene.warnings);
      if (profile) {
        result.notices.push(profile.rights);
        result.rights = profile.rights.startsWith('Private') ? 'private-study' : 'profile-labelled';
      }
    }
  }
  result.errors = [...new Set(result.errors)]; result.notices = [...new Set(result.notices)];
  return result;
}
