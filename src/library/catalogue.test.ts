import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { editorsForPage, isReferenceId, pageMatches, pageSlice, parseReferenceIndex, parseReferencePage, safePreviewUrl, safeWebUrl } from './catalogue';
import { LEEWARD_JURISDICTIONS } from './leeward';
import { britishColumbia } from '../regions/canada';

const ROOT = 'public/data/reference-library/';
const read = (file: string): unknown => JSON.parse(readFileSync(ROOT + file, 'utf8'));
const index = parseReferenceIndex(read('index.json'));
const chapter = index.pages.find((p) => p.url.endsWith('/Passenger-1964-1969.html'))!;

describe('sharded reference catalogue', () => {
  it('validates every page shard, count and unique image URL without fetching remote images', () => {
    const urls = new Set<string>();
    let occurrences = 0;
    for (const item of index.pages) {
      const detail = parseReferencePage(read(`pages/${item.id}.json`), item.id);
      expect(detail.url).toBe(item.url);
      expect(detail.images.length).toBe(item.imageCount);
      expect(detail.galleries.length).toBe(item.galleryCount);
      expect(detail.documents.length).toBe(item.documentCount);
      occurrences += detail.images.length;
      detail.images.forEach((image) => urls.add(image.url));
    }
    expect(index.pages.length).toBe(index.totals.pages);
    expect(urls.size).toBe(index.totals.uniqueImageReferences);
    expect(occurrences).toBe(index.totals.imageOccurrences);
    expect(index.pages.filter((p) => p.source === 'bcpl8s').length).toBe(320);
  });
  it('includes all twenty linked B.C. passenger-history chapters', () => {
    const periods = ['1904-1912', '1913-1914', '1915-1917', '1918-1923', '1924-1929', '1930', '1931-1935', '1936-1939', '1940-1948', '1949-1951', '1952-1954', '1955-1963', '1964-1969', '1970-1972', '1973-1978', '1979-1985', '1985-2001', '2001-2014', '2014-2025', '2025'];
    for (const period of periods) expect(index.pages.some((p) => p.url === `https://www.bcpl8s.ca/Passenger-${period}.html`)).toBe(true);
  });
  it('retains missing pages as gaps instead of pretending the site is complete', () => {
    const bc = index.reports.find((r) => r.source === 'bcpl8s')!;
    expect(bc.complete).toBe(false);
    expect(bc.failures).toHaveLength(30);
    expect(bc.remaining).toEqual([]);
    expect(index.reports.find((r) => r.source === 'leeward')!.complete).toBe(false);
  });
  it('keeps source-page associations distinct from individual image reconstructions', () => {
    const regions = [britishColumbia];
    expect(editorsForPage(chapter.url, regions)).toHaveLength(7);
    expect(editorsForPage('https://www.bcpl8s.ca/Passenger-1940-1948.html', regions)).toHaveLength(9);
    expect(editorsForPage('https://www.bcpl8s.ca/Motorcycle.htm', regions)).toEqual([]);
    expect(editorsForPage('https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html', regions)).toEqual([]);
  });
  it('filters page metadata without pretending to know individual photograph dates', () => {
    expect(pageMatches(chapter, 'passenger 1964', 'bcpl8s', 'Passenger bases', '1967')).toBe(true);
    expect(pageMatches(chapter, '', '', '', '1970')).toBe(false);
    expect(pageMatches(chapter, '', '', '', '19')).toBe(false);
    expect(pageMatches(chapter, 'motorcycle')).toBe(false);
    expect(pageMatches(chapter, '', 'leeward')).toBe(false);
    expect(pageMatches({ ...chapter, yearHints: [] }, '', '', '', '1967')).toBe(false);
  });
  it('bounds pagination without mutating records', () => {
    const all = Array.from({ length: 51 }, (_, i) => i);
    expect(pageSlice(all, 0)).toHaveLength(24);
    expect(pageSlice(all, 1)[0]).toBe(24);
    expect(pageSlice(all, 2)).toEqual([48, 49, 50]);
    expect(all).toHaveLength(51);
    expect(() => pageSlice(all, -1)).toThrow();
    expect(() => pageSlice(all, 0, 0)).toThrow();
  });
  it('accepts safe source links but only embeds allowlisted HTTPS raster images', () => {
    expect(safeWebUrl('https://www.bcpl8s.ca/Passenger.html')).toBe(true);
    expect(safeWebUrl('http://www.15q.net/ca.html')).toBe(true);
    for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@www.bcpl8s.ca/x', '//example.com/x', 'not a url']) expect(safeWebUrl(url)).toBe(false);
    expect(safePreviewUrl('https://www.bcpl8s.ca/Passenger/1964.jpg')).toBe(true);
    for (const url of ['https://www.bcpl8s.ca/x.svg', 'http://www.bcpl8s.ca/x.jpg', 'https://www.bcpl8s.ca.attacker.test/x.jpg', 'https://example.com/x.png']) expect(safePreviewUrl(url)).toBe(false);
  });
  it('rejects invalid versions, duplicate ids, mismatched details and path traversal', () => {
    expect(() => parseReferenceIndex({ ...index, schemaVersion: 99 })).toThrow();
    expect(() => parseReferenceIndex({ ...index, pages: [...index.pages, index.pages[0]] })).toThrow();
    expect(() => parseReferenceIndex({ ...index, totals: { ...index.totals, pages: -1 } })).toThrow();
    const detail = read(`pages/${chapter.id}.json`);
    expect(() => parseReferencePage(detail, '0000000000000000')).toThrow();
    for (const id of ['../index', 'hello', 'A'.repeat(16), '']) expect(isReferenceId(id)).toBe(false);
    expect(isReferenceId(chapter.id)).toBe(true);
  });
});

describe('dated Leeward classification, not current plate specifications', () => {
  it('contains the complete seventy-entry jurisdiction summary without duplicate identifiers', () => {
    expect(LEEWARD_JURISDICTIONS).toHaveLength(70);
    expect(new Set(LEEWARD_JURISDICTIONS.map((r) => r.id)).size).toBe(70);
    expect(LEEWARD_JURISDICTIONS.filter((r) => r.group === 'United States')).toHaveLength(51);
    expect(LEEWARD_JURISDICTIONS.filter((r) => r.group === 'Canada')).toHaveLength(13);
    expect(LEEWARD_JURISDICTIONS.every((r) => r.sourceDate === '2011-02')).toBe(true);
  });
  it('preserves exceptions and aggregate entries instead of inventing jurisdiction renderers', () => {
    expect(LEEWARD_JURISDICTIONS.find((r) => r.id === 'us-va')!.category).toBe('serif');
    expect(LEEWARD_JURISDICTIONS.find((r) => r.id === 'ca-bc')!.category).toBe('semicircular');
    expect(LEEWARD_JURISDICTIONS.find((r) => r.id === 'mx-survey')!.regionId).toBeUndefined();
    expect(LEEWARD_JURISDICTIONS.find((r) => r.id === 'survey-cz')!.note).toContain('Historical');
  });
});
