/**
 * PlateForge as a component library, for sites that show plates without the PlateForge app around
 * them (PofBC's Plates view takes it as a git submodule, `vendor/plateforge`).
 *
 * This entry registers nothing on its own. Import a region entry first, e.g. `./bc` for British
 * Columbia, so a host bundles only the templates, region data and fonts it draws. Then:
 *
 *   setupPlates()                        once per page: @font-face rules and the research lettering
 *   <PlateView plate={…} />              any plate, through its template; redraws as fonts arrive
 *   samplePlate(region, format)          a stable seeded example for a thumbnail
 *   gallerySectionsFor / regionSections  the same family → era → design grouping PlateForge's gallery uses
 *   exportPlate(svg, plate, 'svg'|'png') a portable file with its fonts embedded
 *   plateforgeLink(region, format)       the same design in the full editor
 *
 * The host supplies its own chrome and CSS; PlateView renders a bare <div><svg/></div>.
 */
import { countryOf } from '../core/timeline';
import { gallerySectionsFor, type Section } from '../core/gallery';
import { templateFor } from '../core/registry';
import type { Plate, Region } from '../core/types';
import { installPlateFonts } from '../templates/fonts';
import { loadResearchDies, researchDiesEnabled, researchRegistryLoaded } from '../templates/dies/research-dies';
import { download, fileSafe, serializeSvg, svgToPngBlob } from '../ui/exporting';
import { nextPaint } from '../ui/font-loading';

export type { FieldDef, FieldOption, Parts, Plate, PlateEra, PlateFamily, PlateFormat, PlateGap, PlateStatus, Region } from '../core/types';
export type { Card, Section } from '../core/gallery';
export { gallerySectionsFor } from '../core/gallery';
export { generatePlate, getFormat, getRegion, getRegions, makePlate, templateFor } from '../core/registry';
export { createRng } from '../core/random';
export { buildTimeline, familyOf, formatPeriod, regionFamilies, statusBadge, stepTimeline } from '../core/timeline';
export { PlateView } from '../ui/PlateView';
export { useResearchDiesVersion } from '../ui/ResearchDiesToggle';
export { samplePlate } from '../ui/samples';
export { download, fileSafe };
export { researchDiesEnabled, setResearchDiesEnabled } from '../templates/dies/research-dies';

/** The deployed PlateForge editor. */
export const PLATEFORGE_URL = 'https://projects.ahmadjalil.com/plateforge/';

/** The design in the full PlateForge editor (`#/<region>/<format>`), or its gallery without a format. */
export const plateforgeLink = (region: Pick<Region, 'id'>, format?: { id: string }, base = PLATEFORGE_URL): string =>
  `${base}#/${format ? `${region.id}/${format.id}` : `gallery/${region.id}`}`;

let installed = false;
/** Declares the bundled faces (fetched only when used) and starts loading the B.C. research lettering. Idempotent. */
export function setupPlates(doc: Document = document): void {
  if (installed) return;
  installed = true;
  installPlateFonts(doc);
  void loadResearchDies();
}

/** One region's designs as gallery sections: per family, its eras in date order, then undated designs. */
export const regionSections = (region: Region, { family = '', query = '' }: { family?: string; query?: string } = {}): Section[] =>
  gallerySectionsFor({ country: countryOf(region), flag: region.flag, regions: [region] }, query, family);

/**
 * A portable SVG or PNG of a rendered plate, with its fonts embedded (fetched and checked against
 * their recorded SHA-256). Rejects an invalid serial, as PlateForge's own export does.
 */
export async function exportPlate(svg: SVGSVGElement, plate: Plate, kind: 'svg' | 'png', scale = 4): Promise<Blob> {
  const invalid = plate.format.validate?.(plate.parts);
  if (invalid) throw new Error(invalid);
  if (plate.region.id === 'ca-bc' && researchDiesEnabled() && !researchRegistryLoaded()) {
    await loadResearchDies();
    await nextPaint(svg.ownerDocument);
  }
  const text = await serializeSvg(svg, templateFor(plate.region, plate.format).fonts, {
    context: { region: plate.region.id, format: plate.format.id, ...(plate.region.id === 'ca-bc' ? { researchRequested: researchDiesEnabled() } : {}) },
  });
  if (kind === 'svg') return new Blob([text], { type: 'image/svg+xml' });
  const { width, height } = svg.viewBox.baseVal;
  return svgToPngBlob(text, width, height, scale);
}

/** A file name for an export, e.g. `BC-1953-AB-123.png`. */
export const exportName = (plate: Plate, kind: 'svg' | 'png'): string => `${plate.region.code}-${fileSafe(plate.format.id)}-${fileSafe(plate.text)}.${kind}`;
