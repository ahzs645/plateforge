/**
 * Bounded chronology for the reusable Iraq editor, reviewed 2026-10-02.
 * Sources: research/iraq-customizer/fixtures, iraq-complete/coverage and the
 * supplied Iraq catalogue. Dates describe families, never a specimen's manufacture.
 * Import IRAQ_TIMELINE_ENTRIES/ERAS for data-only consumers; filterIraqTimeline is pure.
 */
import { IRAQ_CUSTOM_CLASSES, IRAQ_CUSTOM_PRESETS, IRAQ_CUSTOM_SOURCE_COVERAGE } from './iraq-custom-data';
import type { IraqCustomPreset } from './iraq-custom-types';

export type IraqTimelineRegion = 'federal' | 'kurdistan';
export type IraqTimelineEvidence = 'photograph' | 'illustration' | 'text' | 'unsupported';
export type IraqTimelineConfidence = 'disputed' | 'reported' | 'provisional';
export interface IraqTimelineSource { id: string; label: string; url: string; dateLabel: string; note: string }
export interface IraqTimelineEra {
  id: string; label: string; period: string; sortYear: number; confidence: IraqTimelineConfidence;
  summary: string; dateNote: string; sources: IraqTimelineSource[];
}
export interface IraqTimelineEntry {
  presetId: string; label: string; eraId: string; region: IraqTimelineRegion; vehicleClass: string;
  evidence: IraqTimelineEvidence; evidenceNote: string; period: string; sourceArtworks: string[];
  sources: IraqTimelineSource[]; originalRecipe: boolean;
}
export interface IraqTimelineFilters { region: string; era: string; vehicleClass: string; evidence: string; query: string }
export const IRAQ_TIMELINE_DEFAULT_FILTERS: IraqTimelineFilters = { region: 'all', era: 'all', vehicleClass: 'all', evidence: 'all', query: '' };
export const IRAQ_TIMELINE_REGION_LABELS = { federal: 'Federal / earlier national systems', kurdistan: 'Kurdistan Region' };
export const IRAQ_TIMELINE_EVIDENCE_LABELS = { photograph: 'Matching photograph', illustration: 'Illustration only', text: 'Text only', unsupported: 'Unsupported arrangement' };
export const IRAQ_TIMELINE_CONFIDENCE_LABELS = { disputed: 'Dates disputed', reported: 'Reported chronology', provisional: 'Provisional dating' };
export const IRAQ_TIMELINE_CLASS_LABELS = Object.fromEntries(IRAQ_CUSTOM_CLASSES.map(item => [item.id, item.label]));
const wiki: IraqTimelineSource = { id: 'wiki', label: 'Wikipedia · Iraq registration plates', url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iraq', dateLabel: 'Reviewed 2 October 2026', note: 'Secondary layout chronology; user-created illustrations are not manufacturing specifications.' };
const olav: IraqTimelineSource = { id: 'olav', label: 'Olav’s plates · Iraq', url: 'https://www.olavsplates.com/iraq.html', dateLabel: 'Reviewed 2 October 2026', note: 'Collector chronology and photographed specimens; no complete official die inventory.' };
const mdm: IraqTimelineSource = { id: 'mdm', label: 'Matrículas del Mundo · Iraq', url: 'https://matriculasdelmundo.com/iraq.html', dateLabel: 'Reviewed 2 October 2026', note: 'Secondary chronology differs on the legacy and bilingual introduction years.' };
const rudaw: IraqTimelineSource = { id: 'rudaw', label: 'Rudaw · new KRG plates', url: 'https://www.rudawarabia.net/arabic/categories/kurdistan/1330174', dateLabel: 'Published 25 April 2022', note: 'Reports first new plates issued that day; general private conversions after Eid. This does not establish every class’s first issue date.' };
export const IRAQ_TIMELINE_ERAS: IraqTimelineEra[] = [
  { id: 'legacy', label: 'Divided Arabic plates', period: '1982 or 1988–2001 federal; to 2022 KRG', sortYear: 1982, confidence: 'disputed', summary: 'Serial above divided country/province panels. Angular Sulaymaniyah, rounded Erbil and utility lettering remain distinct source families.', dateNote: 'Olav / Matrículas del Mundo give 1982; Wikipedia gives 1988. Exact specimen manufacture dates and class-by-class adoption remain unresolved.', sources: [olav, mdm, wiki] },
  { id: 'side-2001', label: 'Side-stacked legends', period: 'Attributed family: 2001; succeeded around 2008 / 2010', sortYear: 2001, confidence: 'disputed', summary: 'Country and province at the left, serial to the right. Includes the photographed Anbar taxi and private/commercial illustration family.', dateNote: 'The taxi was photographed in 2009, which proves use at that time, not introduction in 2009. The succeeding bilingual rollout is variously dated 2008 and 2010.', sources: [wiki, mdm] },
  { id: 'bilingual', label: 'Bilingual federal system', period: '2008 or 2010–2024', sortYear: 2008, confidence: 'disputed', summary: 'Arabic-Indic and Latin lettering with class-coded layouts. Motorcycle, inspection temporary and ICTS retain their separate arrangements.', dateNote: 'Wikipedia uses 2008; Matrículas del Mundo uses 2010. Individual special-category dates are not established by these diagrams.', sources: [wiki, mdm] },
  { id: 'international', label: 'Erbil international illustration', period: '2021–2022 (source label)', sortYear: 2021, confidence: 'provisional', summary: 'A distinct Latin-letter international Erbil illustration, preceding the unified KRG family.', dateNote: '2021–2022 is the source illustration’s label, not a verified legal introduction or withdrawal date.', sources: [wiki] },
  { id: 'krg-modern', label: 'Unified Latin · Kurdistan', period: '25 April 2022 onward', sortYear: 2022, confidence: 'reported', summary: 'Governorate code, Latin letter and serial with IRQ/KR band. Long and compact private specimens are independently represented.', dateNote: 'Rudaw reports the first plates on 25 April 2022. The 2024 specimen dates are observation dates, not the start of this system.', sources: [rudaw, olav, wiki] },
  { id: 'federal-modern', label: 'Unified Latin · federal', period: 'June 2024 onward', sortYear: 2024, confidence: 'reported', summary: 'The federal IRQ-band family follows the modern code/letter/serial arrangement. Class illustrations do not prove identical dies to KRG.', dateNote: 'June 2024 is the reported federal rollout. Temporary is retained as an explicitly unsupported editing preset, not evidence of an issued arrangement.', sources: [wiki] },
];

const photoDates: Record<string, string> = {
  'iq-legacy-sulaymaniyah-3296': 'Photograph date / manufacture date unresolved',
  'iq-legacy-erbil-548306': 'Photograph date / manufacture date unresolved',
  'iq-2001-anbar-taxi': 'Photographed 1 November 2009',
  'iq-legacy-erbil-truck': 'Photographed 25 October 2015',
  'iq-legacy-erbil-motorcycle': 'Photographed 30 October 2015',
  'iq-modern-krg-long': 'Photographed 2024',
  'iq-modern-krg-compact': '2024 file: initial upload 8 August; replacement EXIF 14 September',
};
export const IRAQ_TIMELINE_ARTWORK_SOURCES: IraqTimelineSource[] = IRAQ_CUSTOM_SOURCE_COVERAGE.map(source => ({
  id: source.id, label: source.label, url: source.sourceUrl,
  dateLabel: photoDates[source.id] ?? 'Illustration; its upload date is not an issue date',
  note: source.note,
}));
function eraIdFor(preset: IraqCustomPreset): string {
  if (preset.kind === 'international') return 'international';
  if (preset.kind === 'modern' || preset.kind === 'modern-temporary') return preset.kr ? 'krg-modern' : 'federal-modern';
  if (preset.kind === 'side') return 'side-2001';
  if (['bilingual', 'short-bilingual', 'inspection-temporary', 'icts'].includes(preset.kind)) return 'bilingual';
  return 'legacy';
}
export const IRAQ_TIMELINE_ENTRIES: IraqTimelineEntry[] = IRAQ_CUSTOM_PRESETS.map((preset): IraqTimelineEntry => {
  const eraId = eraIdFor(preset);
  const era = IRAQ_TIMELINE_ERAS.find(item => item.id === eraId)!;
  // Include artwork aliases too: e.g. the 2001 commercial illustration opens the side layout.
  const sourceArtworks = [...new Set([...preset.sourceArtworks, ...IRAQ_CUSTOM_SOURCE_COVERAGE.filter(source => source.presetId === preset.id).map(source => source.id)])];
  const evidence: IraqTimelineEvidence = sourceArtworks.some(id => id.startsWith('iq-')) ? 'photograph'
    : sourceArtworks.length ? 'illustration' : preset.evidence.startsWith('text only') ? 'text' : 'unsupported';
  return {
    presetId: preset.id, label: preset.label, eraId, region: preset.kr ? 'kurdistan' : 'federal',
    vehicleClass: preset.defaults.vehicleClass, evidence, sourceArtworks,
    evidenceNote: evidence === 'photograph' ? 'A matching class/family photograph exists. It does not validate every editable character, colour, layout option or registration.'
      : evidence === 'illustration' ? 'User-created illustration evidence. Exact dies, dimensions, paint colours and class issue dates are not verified.'
      : evidence === 'text' ? 'Class named in secondary text; no matching inspected diagram or photograph in this inventory.'
      : 'No matching photograph or illustration supports this exact arrangement. Experimental editor preset only.',
    period: eraId === 'legacy' ? preset.kr ? '1982 or 1988–2022 family' : '1982 or 1988–2001 family' : era.period,
    sources: sourceArtworks.map(id => IRAQ_TIMELINE_ARTWORK_SOURCES.find(source => source.id === id)!).filter(Boolean),
    originalRecipe: preset.family === 'Existing Iraq recipes',
  };
}).sort((a, b) => IRAQ_TIMELINE_ERAS.findIndex(era => era.id === a.eraId) - IRAQ_TIMELINE_ERAS.findIndex(era => era.id === b.eraId));

export const IRAQ_TIMELINE_COUNTS = {
  presets: IRAQ_CUSTOM_PRESETS.length,
  sourceArtworks: IRAQ_CUSTOM_SOURCE_COVERAGE.length,
  originalRecipes: IRAQ_TIMELINE_ENTRIES.filter(entry => entry.originalRecipe).length,
  photographs: IRAQ_TIMELINE_ARTWORK_SOURCES.filter(source => source.id.startsWith('iq-')).length,
  illustrations: IRAQ_TIMELINE_ARTWORK_SOURCES.filter(source => source.id.startsWith('wiki-diagram-')).length,
};
export const IRAQ_TIMELINE_GAPS = [
  { period: '1930s–1961', label: 'Early systems', note: 'Retrospective and archive leads only. No verified plate pixels or editable presets in this bounded collection.', source: { label: 'Secondary early-plate archive', url: 'https://globallicenseplates.com/en/countries/iraq/old-plates' } },
  { period: '1970–1980', label: 'Regulation and specimen leads', note: 'An indexed 1970 regulation describes bilingual numerals. Original gazette and dated specimens still need verification; no early design is fabricated here.', source: { label: '1970 regulation transcription', url: 'https://wiki.dorar-aliraq.net/iraqilaws/law/6283.html' } },
];
/** Filters are intersected; empty/all values leave that dimension unrestricted. */
export function filterIraqTimeline(filters: Partial<IraqTimelineFilters> = {}): IraqTimelineEntry[] {
  const query = (filters.query ?? '').trim().toLocaleLowerCase();
  return IRAQ_TIMELINE_ENTRIES.filter(entry => {
    const matches = (value: string | undefined, actual: string) => !value || value === 'all' || value === actual;
    const era = IRAQ_TIMELINE_ERAS.find(item => item.id === entry.eraId)!;
    return matches(filters.region, entry.region) && matches(filters.era, entry.eraId)
      && matches(filters.vehicleClass, entry.vehicleClass) && matches(filters.evidence, entry.evidence)
      && (!query || `${entry.label} ${entry.period} ${era.label} ${entry.evidenceNote} ${entry.sources.map(source => source.label).join(' ')}`.toLocaleLowerCase().includes(query));
  });
}
