import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TypefaceReview } from './TypefaceReview';

describe('typography evidence controls', () => {
  for (const country of ['iraq', 'iran'] as const) {
    it(`${country}: offers reference, candidate and opacity controls without loading fonts`, () => {
      const html = renderToStaticMarkup(<TypefaceReview country={country} />);
      expect(html).toContain('id="typeface-reference"');
      expect(html).toContain('id="typeface-candidate"');
      expect(html).toContain('id="typeface-opacity"');
      expect(html).toContain(`${import.meta.env.BASE_URL}typography-review/index.html`);
      expect(html).toContain('offline.html');
      expect(html).toContain('do not change the generated plate');
      expect(html).not.toMatch(/\.ttf|\.woff|@font-face|data:font/);
    });
  }
  it('keeps the independent heh sample and exact fonts in the correct country', () => {
    const iran = renderToStaticMarkup(<TypefaceReview country="iran" />);
    const iraq = renderToStaticMarkup(<TypefaceReview country="iraq" />);
    expect(iran).toContain('contextual هـ');
    expect(iran).toContain('IR Plate');
    expect(iran).toContain('B Roya Bold');
    expect(iraq).toContain('Existing EuroPlate');
    expect(iraq).toContain('excluded from the score');
    expect(iraq).not.toContain('B Roya Bold');
  });
});
