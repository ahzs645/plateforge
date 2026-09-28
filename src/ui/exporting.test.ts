import { describe, expect, it } from 'vitest';
import { teslaTarget } from './exporting';

describe('Tesla licence-plate export size', () => {
  it('keeps 2:1 North-American plates filling 400×200 exactly', () => {
    expect(teslaTarget(300, 150)).toEqual({ width: 400, height: 200, x: 0, y: 0, w: 400, h: 200 });
  });
  it('fits long European plates into 400×100, letterboxed and centred', () => {
    const t = teslaTarget(520, 110);
    expect([t.width, t.height, t.x, t.w]).toEqual([400, 100, 0, 400]);
    expect(t.h).toBeCloseTo(84.615, 3);
    expect(t.y).toBeCloseTo((100 - t.h) / 2, 9);
    expect(teslaTarget(300, 100).height).toBe(100);
    expect(teslaTarget(299, 100).height).toBe(200);
  });
  it('pillarboxes squarer and portrait plates inside 400×200', () => {
    expect(teslaTarget(200, 160)).toEqual({ width: 400, height: 200, x: 75, y: 0, w: 250, h: 200 });
    const tall = teslaTarget(80, 110);
    expect([tall.width, tall.height, tall.y, tall.h]).toEqual([400, 200, 0, 200]);
    expect(tall.w).toBeCloseTo(145.455, 3);
    expect(tall.x + tall.w / 2).toBeCloseTo(200, 9);
  });
  it('rejects empty sizes', () => {
    expect(() => teslaTarget(0, 100)).toThrow();
    expect(() => teslaTarget(100, Number.NaN)).toThrow();
  });
});
