import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { coverageMatches, parseCoverageManifest } from './coverage';
import { britishColumbia } from '../regions/canada';

const manifest = parseCoverageManifest(JSON.parse(readFileSync('public/data/reference-library/bc-coverage.json', 'utf8')));

describe('B.C. coverage manifest', () => {
  it('validates and keeps its topic count', () => {
    expect(manifest.records).toHaveLength(manifest.counts.inventoryRecords);
    expect(manifest.records).toHaveLength(67);
  });
  it('lists exactly the presets the registry actually has', () => {
    const listed = Object.values(manifest.registeredPresets).flat().sort();
    expect(listed).toEqual(britishColumbia.formats.map((f) => f.id).sort());
    expect(manifest.counts.registeredPresets).toBe(britishColumbia.formats.length);
  });
  it('filters by text, group and status', () => {
    const parks = manifest.records.filter((r) => coverageMatches(r, 'kermode'));
    expect(parks.map((r) => r.id)).toContain('bc-parks');
    expect(manifest.records.filter((r) => coverageMatches(r, '', 'Passenger')).map((r) => r.id)).toEqual(['passenger']);
    expect(manifest.records.filter((r) => coverageMatches(r, '', '', 'implemented')).map((r) => r.id)).toContain('passenger');
    for (const r of manifest.records) for (const id of r.formats ?? []) if (!id.startsWith('(')) expect(britishColumbia.formats.some((f) => f.id === id), `${r.id} → ${id}`).toBe(true);
  });
  it('rejects malformed data', () => {
    expect(() => parseCoverageManifest({ schemaVersion: 1 })).toThrow();
    const bad = structuredClone(JSON.parse(readFileSync('public/data/reference-library/bc-coverage.json', 'utf8')));
    bad.records[0].sourceUrl = 'javascript:alert(1)';
    expect(() => parseCoverageManifest(bad)).toThrow();
  });
});
