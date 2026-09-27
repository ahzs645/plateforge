import type { Region } from '../core/types';
export interface ReferenceLink { url: string; label: string }
export interface ReferenceImage extends ReferenceLink {
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  kind: 'layout' | 'unclassified-reference';
}
export interface PageRecord {
  id: string; source: string; url: string; title: string; headings: string[];
  category: string; yearHints: number[]; reviewStatus: string;
  imageCount: number; candidateImageCount: number; galleryCount: number; documentCount: number;
}
export interface ReferencePage extends Omit<PageRecord, 'imageCount' | 'candidateImageCount' | 'galleryCount' | 'documentCount'> {
  images: ReferenceImage[]; galleries: ReferenceLink[]; documents: ReferenceLink[];
}
export interface CoverageReport {
  source: string; complete: boolean; indexed?: number; manualReferences?: number; scope: string;
  failures: { url: string; reason: string }[]; remaining: string[];
}
export interface ReferenceIndex {
  schemaVersion: 2; importedAt: string; scope: string;
  sites: { id: string; name: string; root: string; credit: string }[];
  totals: { pages: number; uniqueImageReferences: number; imageOccurrences: number; browserVerifiedArticleLinks: number };
  reports: CoverageReport[]; pages: PageRecord[];
}
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');
const count = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
export const isReferenceId = (value: string): boolean => /^[a-f0-9]{16}$/.test(value);
export function safeWebUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
/** Only raster images on the named research sites can be embedded. */
export function safePreviewUrl(value: unknown): value is string {
  if (!safeWebUrl(value)) return false;
  const u = new URL(value);
  return u.protocol === 'https:' && ['www.bcpl8s.ca', 'bcpl8s.ca', 'www.leewardpro.com', 'leewardpro.com'].includes(u.hostname)
    && /\.(?:jpe?g|png|gif|webp)$/i.test(u.pathname);
}
function commonPage(p: unknown): boolean {
  return record(p) && typeof p.id === 'string' && isReferenceId(p.id) && safeWebUrl(p.url)
    && typeof p.title === 'string' && typeof p.source === 'string' && typeof p.category === 'string'
    && typeof p.reviewStatus === 'string' && strings(p.headings)
    && Array.isArray(p.yearHints) && p.yearHints.every(count);
}
export function parseReferenceIndex(value: unknown): ReferenceIndex {
  if (!record(value) || value.schemaVersion !== 2 || typeof value.importedAt !== 'string' || typeof value.scope !== 'string'
    || !Array.isArray(value.pages) || !value.pages.every((p) => commonPage(p) && record(p) && ['imageCount', 'candidateImageCount', 'galleryCount', 'documentCount'].every((key) => count(p[key])))
    || !Array.isArray(value.sites) || !value.sites.every((s) => record(s) && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.credit === 'string' && safeWebUrl(s.root))
    || !Array.isArray(value.reports) || !value.reports.every((r) => record(r) && typeof r.source === 'string' && typeof r.complete === 'boolean' && typeof r.scope === 'string' && strings(r.remaining)
      && Array.isArray(r.failures) && r.failures.every((f) => record(f) && typeof f.reason === 'string' && safeWebUrl(f.url)))
    || !record(value.totals) || !['pages', 'uniqueImageReferences', 'imageOccurrences', 'browserVerifiedArticleLinks'].every((key) => count((value.totals as Record<string, unknown>)[key]))) {
    throw new Error('The reference index has an unsupported or invalid schema.');
  }
  const index = value as unknown as ReferenceIndex;
  if (new Set(index.pages.map((p) => p.id)).size !== index.pages.length || index.totals.pages !== index.pages.length) throw new Error('Reference index counts or identifiers are inconsistent.');
  return index;
}
export function parseReferencePage(value: unknown, expectedId: string): ReferencePage {
  const links = (v: unknown) => Array.isArray(v) && v.every((l) => record(l) && safeWebUrl(l.url) && typeof l.label === 'string');
  if (!commonPage(value) || !record(value) || value.id !== expectedId || !links(value.documents) || !links(value.galleries)
    || !Array.isArray(value.images) || !value.images.every((i) => record(i) && safeWebUrl(i.url) && safeWebUrl(i.thumbnailUrl) && typeof i.label === 'string'
      && ['layout', 'unclassified-reference'].includes(String(i.kind)) && (i.width === null || count(i.width)) && (i.height === null || count(i.height)))) throw new Error('The reference page is invalid or does not match the selected record.');
  return value as unknown as ReferencePage;
}
export function pageMatches(page: PageRecord, query: string, source = '', category = '', year = ''): boolean {
  if (source && source !== page.source || category && category !== page.category) return false;
  if (year) {
    if (!/^\d{4}$/.test(year)) return false;
    const n = Number(year), dates = page.yearHints;
    if (!dates.length || n < dates[0] || n > dates[dates.length - 1]) return false;
  }
  const haystack = `${page.title} ${page.url} ${page.category} ${page.headings.join(' ')}`.toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every((word) => haystack.includes(word));
}
/** A page-to-recipe association, NOT a claim that any individual photograph was recreated. */
export function editorsForPage(url: string, regions: Region[]) {
  if (!url.includes('bcpl8s.ca/')) return [];
  return regions.flatMap((r) => r.formats.filter((f) => f.references?.some((s) => s.url === url))
    .map((f) => ({ regionId: r.id, formatId: f.id, label: `${r.name} · ${f.label}` })));
}
export function pageSlice<T>(items: readonly T[], page: number, size = 24): T[] {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1) throw new RangeError('Invalid pagination.');
  return items.slice(page * size, (page + 1) * size);
}
