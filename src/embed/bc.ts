/**
 * British Columbia for the embed: registers the B.C. template and region only — not the other
 * regions, the stand-in artwork, or the East Asian fonts — and returns the region.
 *
 *   import { BRITISH_COLUMBIA } from 'plateforge/bc'
 *   import { PlateView, regionSections, setupPlates } from 'plateforge'
 */
import { registerRegion, registerTemplate } from '../core/registry';
import type { Region } from '../core/types';
import { britishColumbia } from '../regions/canada';
import { bcTemplate } from '../templates/bc';

registerTemplate(bcTemplate);
registerRegion(britishColumbia);

/** Every B.C. design PlateForge draws: 16 families, 1901–2026. */
export const BRITISH_COLUMBIA: Region = britishColumbia;
