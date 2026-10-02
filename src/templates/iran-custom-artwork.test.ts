import { describe, expect, it } from 'vitest';
import {
  IRAN_HISTORIC_ARTWORK_SOURCE,
  IRAN_ZONE_ARTWORK_SOURCES,
  renderIranHistoricArtwork,
  renderIranZoneEmblem,
} from './iran-custom-artwork';

describe('Iran source-guided flat artwork', () => {
  it('provides seven genuinely different zone masters, with explicit source-study provenance', () => {
    expect(IRAN_ZONE_ARTWORK_SOURCES.map(x => x.id).sort()).toEqual(['anzali', 'aras', 'arvand', 'chabahar', 'kish', 'maku', 'qeshm']);
    const geometry = IRAN_ZONE_ARTWORK_SOURCES.map(source => {
      const result = renderIranZoneEmblem(source.id, 10, 20, 90, 75);
      expect(result.markup).toContain(`data-zone="${source.id}"`);
      expect(result.markup).toContain('data-artwork-provenance="source-guided-approximation"');
      expect(result.warnings.join(' ')).toMatch(/outline approximation.*not a certified logo master/);
      expect(source.url).toMatch(/^https:\/\/thumb\.wikimedia\.org\//);
      expect(source.status).toBe('reference-study');
      return [...result.markup.matchAll(/d="([ML][^"]*)"/g)].map(match => match[1]).join('|');
    });
    expect(geometry.every(Boolean)).toBe(true);
    expect(new Set(geometry).size).toBe(7);
  });

  it('keeps default landmark palettes and distinguishing source details', () => {
    expect(renderIranZoneEmblem('anzali', 0, 0, 120, 86).markup).toContain('#00a5df');
    expect(renderIranZoneEmblem('aras', 0, 0, 100, 100).markup).toContain('#087c48');
    const arvand = renderIranZoneEmblem('arvand', 0, 0, 100, 92).markup;
    expect(arvand).toContain('#009ace');
    expect(arvand).toContain('#f3442e');
    expect(arvand).toContain('#ffffff');
    expect(renderIranZoneEmblem('kish', 0, 0, 100, 100).markup).toContain('#ffffff');
    expect(renderIranZoneEmblem('maku', 0, 0, 110, 104).markup).toContain('#f6a400');
    expect(renderIranZoneEmblem('chabahar', 0, 0, 70, 110).markup).toContain('fill="none" stroke="#ffffff"');
    const qeshm = renderIranZoneEmblem('qeshm', 0, 0, 100, 100).markup;
    expect(qeshm).toContain('#ff3d00');
    expect(qeshm).toContain('#001eca');
  });

  it('fits complete masters uniformly and deterministically', () => {
    const tall = renderIranZoneEmblem('ARAS', 10, 20, 100, 200);
    expect(tall.markup).toContain('transform="translate(10 70) scale(1)"');
    expect(tall).toEqual(renderIranZoneEmblem(' aras ', 10, 20, 100, 200));
    expect(renderIranHistoricArtwork(10, 20, 360, 360).markup).toContain('transform="translate(10 70) scale(2)"');
  });

  it('never substitutes a generic emblem or lets a malicious zone ID enter SVG', () => {
    for (const id of ['unknown', '__proto__', 'constructor', '"><script>alert(1)</script>']) {
      const result = renderIranZoneEmblem(id, 0, 0, 100, 100);
      expect(result.markup).toBe('');
      expect(result.warnings.join(' ')).toContain('no generic replacement');
    }
  });

  it('rejects invalid coordinates and dimensions without NaN/Infinity output', () => {
    const boxes = [
      [NaN, 0, 100, 100], [0, Infinity, 100, 100], [0, 0, 0, 100],
      [0, 0, -1, 100], [0, 0, 100, -1], [0, 0, 100, Infinity],
    ];
    for (const [x, y, width, height] of boxes) {
      expect(renderIranZoneEmblem('kish', x, y, width, height).markup).toBe('');
      expect(renderIranHistoricArtwork(x, y, width, height).markup).toBe('');
    }
  });

  it('allows labelled safe ink customization and ignores untrusted paint values', () => {
    const custom = renderIranZoneEmblem('arvand', 0, 0, 100, 100, '#123456');
    expect(custom.markup).toContain('fill="#123456"');
    expect(custom.markup).toContain('fill="#ffffff"');
    expect(custom.warnings.join(' ')).toContain('user colour customization');
    for (const ink of ['url(https://example.com/paint.svg)', '"/><script>bad()</script>', 'red;filter:url(x)']) {
      const result = renderIranZoneEmblem('maku', 0, 0, 100, 100, ink);
      expect(result.markup).not.toContain(ink);
      expect(result.markup).toContain('#f6a400');
      expect(result.warnings.join(' ')).toContain('Invalid emblem ink');
    }
  });

  it('keeps all output self-contained, font-independent and free of copied raster/security artwork', () => {
    const outputs = IRAN_ZONE_ARTWORK_SOURCES.map(x => renderIranZoneEmblem(x.id, 0, 0, 150, 150));
    outputs.push(renderIranHistoricArtwork(0, 0, 180, 130));
    for (const result of outputs) {
      expect(result.markup).not.toMatch(/<(?:image|text|filter|script|foreignObject|pattern|linearGradient|radialGradient)\b/);
      expect(result.markup).not.toMatch(/(?:href|font-family|filter|mask|clip-path)=|data:image|https?:\/\//);
      expect(result.markup).not.toMatch(/NaN|Infinity|undefined/);
      expect(result.warnings.join(' ')).toContain('Source artwork rights are separate');
    }
  });

  it('identifies the inspected historic facade source and honestly labels its simplified reconstruction', () => {
    const result = renderIranHistoricArtwork(5, 7, 180, 130);
    expect(result.markup).toContain('data-artwork="bagh-e-melli"');
    expect(result.markup).toContain('simplified flat reference study');
    expect(result.warnings.join(' ')).toMatch(/small photograph.*Architectural details and colours are approximate/);
    expect(IRAN_HISTORIC_ARTWORK_SOURCE.url).toContain('Pelak_melie_tarikhi.png');
  });
});
