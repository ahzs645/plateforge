import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random';
import { BC_SPECIALTY_ERAS, BC_SPECIALTY_FAMILIES, BC_SPECIALTY_FORMATS } from './bc-specialty';
import { britishColumbia } from './index';

const byId = (id: string) => BC_SPECIALTY_FORMATS.find((f) => f.id === id)!;
const check = (id: string, serial: string) => { const f = byId(id); return f.validate?.({ ...f.generate(createRng(id)), serial }) ?? null; };

describe('B.C. specialty and consular plates', () => {
  it('uses only its own families and eras, with region-unique ids', () => {
    const families = new Set(BC_SPECIALTY_FAMILIES.map((f) => f.id));
    expect([...families]).toEqual(['specialty', 'consular']);
    const eras = new Map(BC_SPECIALTY_ERAS.map((e) => [e.id, e.family]));
    for (const f of BC_SPECIALTY_FORMATS) {
      expect(families.has(f.family!)).toBe(true);
      expect(eras.get(f.era!)).toBe(f.family);
    }
    const ids = britishColumbia.formats.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('accepts the photographed serials', () => {
    const seen: Record<string, string[]> = {
      'parks-kermode': ['PA875S', 'PJ711K', 'RL001A'], 'parks-purcell': ['PK730J', 'RS969V', 'R000AA'], 'parks-porteau': ['PW769E', 'RH111M', 'S266AA'],
      'olympic-passenger': ['005-MAA', '371-MJE'], 'olympic-truck': ['AA-0969'], 'olympic-farm': ['G9-0039', 'G9-0116'], 'olympic-trailer': ['0034-3U'],
      'olympic-motorcycle': ['V2-5660'], 'olympic-utility': ['UYM-51G'],
      'veteran-passenger': ['002VAR', '433VBD'], 'veteran-passenger-dual': ['731VBN', '132VCA'], 'veteran-truck': ['6989LV'], 'veteran-motorcycle': ['V00263'],
      'memorial-passenger': ['MC112R'], 'memorial-truck': ['MC1000'], 'memorial-keepsake': ['MC000R'],
      'collector-passenger': ['B00-195', 'B55-228'], 'collector-passenger-dual': ['B31-865', '0M1-138'], 'collector-multi': ['B6-0565'],
      'collector-motorcycle': ['B8-0764', '0P-1186'], 'collector-motorcycle-multi': ['B7-5024'],
      'antique-1966': ['524', '88', '7'], 'antique-1975': ['1036', '9535'], 'antique-motorcycle': ['BC 5', 'BC 136', 'BC 630'],
      'personalized-waldale': ['BCPL8S', 'OL-PAPA', 'ALL4ME'], 'personalized-sample': ['SAMPLE'], 'personalized-motorcycle-prototype': ['123678'],
      'consular-1967': ['554', '622'], 'consular-1973': ['252', '500'], 'consular-1979': ['004', '851'], 'consular-flag': ['178', 'A02', 'D17'],
      'consular-red': ['DL-000A', 'CS-008A', 'SR-001A'],
    };
    for (const [id, serials] of Object.entries(seen)) for (const serial of serials) expect(check(id, serial), `${id} ${serial}`).toBeNull();
  });

  it('rejects serials outside the documented blocks', () => {
    const bad: [string, string][] = [['parks-kermode', 'PK730J'], ['olympic-truck', 'AL-0000'], ['consular-1979', '500'], ['personalized-waldale', 'TOOLONG'],
      ['consular-red', 'XX-000A'], ['personalized-sample', 'SOMPLE'], ['antique-1966', '100']];
    for (const [id, serial] of bad) expect(check(id, serial), `${id} ${serial}`).not.toBeNull();
  });
});
