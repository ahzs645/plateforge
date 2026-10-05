import {describe, expect, it} from 'vitest';
import {dieGlyph, dieSupports} from './engine';
import {COMMERCIAL_1952_LEGEND, COMMERCIAL_1952_SERIAL, COMMERCIAL_1952_YEAR} from './commercial-1952';

describe('commercial 1952 source-specific reconstruction', () => {
  it('uses broader heavy rounded legend shapes while preserving narrow I', () => {
    expect(dieSupports(COMMERCIAL_1952_LEGEND, 'BRITISH COLUMBIA')).toBe(true);
    expect(dieGlyph(COMMERCIAL_1952_LEGEND, 'B')?.advance).toBe(68);
    expect(dieGlyph(COMMERCIAL_1952_LEGEND, 'I')!.advance).toBeLessThan(30);
    expect(dieGlyph(COMMERCIAL_1952_LEGEND, 'M')!.advance).toBeGreaterThan(90);
    expect(COMMERCIAL_1952_LEGEND.params.stroke).toBe(22);
  });
  it('supports observed serials and keeps the date distinct from the renewal-tab year', () => {
    expect(dieSupports(COMMERCIAL_1952_SERIAL, 'C29·419')).toBe(true);
    expect(dieSupports(COMMERCIAL_1952_SERIAL, 'CA1·940')).toBe(true);
    expect(dieGlyph(COMMERCIAL_1952_SERIAL, 'C')?.fill).toBe(true);
    expect(dieSupports(COMMERCIAL_1952_YEAR, '52')).toBe(true);
    expect(COMMERCIAL_1952_YEAR.params.stroke).toBe(21.5);
    expect(dieGlyph(COMMERCIAL_1952_YEAR, '5')?.cap).toBe('round');
  });
});
