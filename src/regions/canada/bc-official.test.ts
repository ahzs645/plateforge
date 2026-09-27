import { describe, expect, it } from 'vitest';
import { BC_OFFICIAL_ERAS, BC_OFFICIAL_FAMILIES, BC_OFFICIAL_FORMATS } from './bc-official';

const fmt = (id: string) => BC_OFFICIAL_FORMATS.find((f) => f.id === id)!;
const ok = (id: string, serial: string, extra: Record<string, string> = {}) => fmt(id).validate?.({ serial, ...extra }) ?? null;

describe('B.C. official grammars', () => {
  it('ham call signs follow the base', () => {
    expect(ok('ham-radio-1963', 'VE7BK')).toBeNull();
    expect(ok('ham-radio-1963', 'VA7BK')).not.toBeNull();
    expect(ok('ham-radio-1968', 'VE7-SV')).toBeNull();
    expect(ok('ham-radio-1969', 'VE7 CF')).toBeNull();
    expect(ok('ham-radio-2014-flag', 'VA7BMJ')).toBeNull();
  });
  it('class prefixes use the documented ranges', () => {
    expect(ok('official-doctor-1931', '19-126')).toBeNull();
    expect(ok('official-doctor-pn-1940', 'PN-576')).not.toBeNull();
    expect(ok('official-parks-1927', '27-861')).toBeNull();
    expect(ok('official-parks-1927', '27-700')).not.toBeNull();
    expect(ok('official-parks-1936', 'CF-472')).toBeNull();
    expect(ok('official-defence-1941', 'N1-916')).toBeNull();
    expect(ok('official-defence-1941', 'ND-76J')).toBeNull();
    expect(ok('events-royal-1987', 'ROYAL20')).toBeNull();
    expect(ok('events-royal-1987', 'ROYAL21')).not.toBeNull();
  });
  it('every format belongs to a declared family and era', () => {
    const families = new Set(BC_OFFICIAL_FAMILIES.map((f) => f.id));
    const eras = new Map(BC_OFFICIAL_ERAS.map((e) => [e.id, e.family]));
    for (const f of BC_OFFICIAL_FORMATS) {
      expect(families.has(f.family!)).toBe(true);
      expect(eras.get(f.era!)).toBe(f.family);
    }
  });
});
