import { describe, expect, it } from 'vitest';
import { BC_MUNICIPAL_FORMATS } from './bc-municipal';

const format = (id: string) => BC_MUNICIPAL_FORMATS.find((f) => f.id === id)!;
const ok = (id: string, serial: string) => expect(format(id).validate?.({ serial }), `${id} ${serial}`).toBeNull();
const bad = (id: string, serial: string) => expect(format(id).validate?.({ serial }), `${id} ${serial}`).not.toBeNull();

describe('B.C. municipal and bicycle grammars', () => {
  it('accepts documented examples', () => {
    for (const s of ['9495', '17193', '757', '87']) ok('municipal-prov-1963', s);
    ok('municipal-prov-1979', '019426');
    for (const s of ['022-205', '059-761', '075-475']) ok('municipal-prov-1983', s);
    for (const s of ['2277', '84365']) ok('municipal-exempt-1963', s);
    ok('municipal-city-victoria', 'CAB 111');
    ok('municipal-vancouver-taxi-1956', 'D 489');
    for (const s of ['00']) { ok('municipal-city-trail', s); ok('municipal-city-chilliwack', s); }
    ok('municipal-city-powell-river', '000');
    for (const s of ['K220', 'P251', 'S127', '096C']) ok('bicycle-vancouver-1940s', s);
  });
  it('rejects out-of-format serials', () => {
    bad('municipal-prov-1983', '022205');
    bad('municipal-city-victoria', 'CAB111');
    bad('bicycle-vancouver-1940s', 'KK20');
  });
  it('uses unique ids within the two families', () => {
    expect(new Set(BC_MUNICIPAL_FORMATS.map((f) => f.id)).size).toBe(BC_MUNICIPAL_FORMATS.length);
    expect(BC_MUNICIPAL_FORMATS.every((f) => f.family === 'municipal' || f.family === 'bicycle')).toBe(true);
  });
});
