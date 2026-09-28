import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatText } from '../../core/format';
import { withLettering } from '../../core/lettering';
import { createRng } from '../../core/random';
import { resolveDesign } from '../../core/registry';
import { buildTimeline } from '../../core/timeline';
import type { Parts } from '../../core/types';
import { usTemplate, type UsDesign } from '../../templates/us';
import { usRegions } from './index';

const region = (id: string) => usRegions.find((r) => r.id === id)!;
const format = (regionId: string, formatId: string) => withLettering(region(regionId).formats.find((f) => f.id === formatId)!);
function render(regionId: string, formatId: string, parts: Parts) {
  const r = region(regionId);
  const f = format(regionId, formatId);
  const design = resolveDesign(r, f) as UsDesign;
  return renderToStaticMarkup(usTemplate.render({ parts, design, text: formatText(f, parts) }));
}

describe('Puerto Rico', () => {
  const pr = region('us-pr');
  it('is a U.S. territory with its own flag', () => {
    expect(pr).toMatchObject({ country: 'United States', flag: '🇵🇷', countryFlag: '🇺🇸', template: 'us' });
  });
  it('generates the current ABC 123 series', () => {
    const rng = createRng('pr');
    for (let i = 0; i < 400; i++) {
      const serial = pr.formats[0].generate(rng).serial;
      expect(serial).toMatch(/^K[B-Y][A-Z] \d{3}$/);
      expect(serial >= 'KBV 001' && serial <= 'KYN 025').toBe(true);
    }
  });
  it('accepts the early dashed form and rejects other shapes', () => {
    const validate = pr.formats[0].validate!;
    expect(validate({ serial: 'KDA 123' })).toBeNull();
    expect(validate({ serial: 'ABC-123' })).toBeNull();
    expect(validate({ serial: 'AB 1234' })).not.toBeNull();
    expect(validate({ serial: 'ABC1234' })).not.toBeNull();
  });
});

describe('variants', () => {
  const cases: Array<[string, string, string[], string[]]> = [
    ['us-ca', 'black-yellow-1956', ['ABC 123'], ['1ABC234', '123 ABC']],
    ['us-ca', 'black-gold-1963', ['ZZZ 999'], ['ZZZ999']],
    ['us-ca', 'blue-gold-1970', ['123 ABC'], ['ABC 123']],
    ['us-ca', 'legacy-1960s', ['B001A0', 'L783N1'], ['B001AA', 'ABC 123']],
    ['us-ca', 'standard-2026', ['801BEZ1'], ['8BEZ801']],
    ['us-az', 'alternative-fuel', ['AF·1234', 'AF·123A', 'AF·12A3', 'AF12A3', 'AF·1A23', '1A23AF'], ['AF1234', 'AB·1234', 'AF·12345']],
    ['us-il', 'electric-vehicle', ['1 EL', '99999 EL', 'D1748 EL'], ['123456 EL', '12345', 'AB123 EL']],
    ['us-ny', 'standard', ['KDA-1000', 'MHT-1800'], ['KIA-1000', 'KDA1000']],
    ['us-ny', 'empire-state-2001', ['ACA-1000'], ['AOA-1000', 'ACA-100']],
    ['us-ny', 'empire-gold-2010', ['FAA-1000'], ['FAA 1000']],
    ['us-pa', 'visitpa-2004', ['GBA-0000', 'KLE-9999'], ['GAA-0000', 'GEB-1234']],
    ['us-pa', 'standard', ['KLF-0000'], ['KLF--0000']],
    ['us-pa', 'liberty-bell', ['MYR0200', 'NJS3686'], ['MYR-0200']],
  ];
  for (const [regionId, formatId, good, bad] of cases) {
    it(`${regionId}/${formatId}`, () => {
      const f = format(regionId, formatId);
      const rng = createRng(`${regionId}/${formatId}`);
      for (let i = 0; i < 200; i++) expect(f.validate!(f.generate(rng))).toBeNull();
      for (const serial of good) expect(f.validate!({ serial }), serial).toBeNull();
      for (const serial of bad) expect(f.validate!({ serial }), serial).not.toBeNull();
    });
  }

  it('dates every variant so the timeline shows them', () => {
    const order = (id: string) => buildTimeline(region(id))!.order.map((e) => e.format.id);
    expect(order('us-ca')).toEqual(['black-yellow-1956', 'black-gold-1963', 'blue-gold-1970', 'standard', 'legacy-1960s', 'standard-2026']);
    expect(order('us-ny')).toEqual(['empire-state-2001', 'empire-gold-2010', 'standard']);
    expect(order('us-pa')).toEqual(['visitpa-2004', 'standard', 'liberty-bell']);
    expect(order('us-il')).toEqual(['standard', 'electric-vehicle']);
    expect(order('us-az')).toEqual(['alternative-fuel', 'standard']);
  });

  it('keeps every region id and the standard format first', () => {
    expect(usRegions).toHaveLength(52);
    for (const r of usRegions) expect(r.formats[0].id).toBe('standard');
  });
});

describe('US template', () => {
  it('renders every format in every lettering mode without broken values', () => {
    for (const r of usRegions) {
      for (const raw of r.formats) {
        const f = withLettering(raw);
        const parts = f.generate(createRng(`${r.id}/${f.id}`));
        for (const lettering of ['default', 'oval']) {
          const svg = render(r.id, f.id, { ...parts, lettering });
          expect(svg).toContain('viewBox="0 0 600 300"');
          expect(svg, `${r.id}/${f.id}`).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    }
  });

  it('draws the Nevada state outline in place of the dot', () => {
    const svg = render('us-nv', 'standard', { serial: '123·A45', lettering: 'default' });
    expect(svg.match(/data-role="separator"/g)).toHaveLength(1);
    expect(svg).toContain('data-separator="nv-outline"');
    expect(svg).not.toMatch(/>[^<]*·[^<]*<\/text>/);
    expect(svg).toContain('>123</text>');
    expect(svg).toContain('>A45</text>');
  });

  it('draws the New York outline in place of the dash, also for vector lettering', () => {
    for (const lettering of ['default', 'squarish']) {
      const svg = render('us-ny', 'standard', { serial: 'KDA-1234', lettering });
      expect(svg.match(/data-role="separator"/g)).toHaveLength(1);
      expect(svg).toContain('data-separator="ny-outline"');
    }
  });

  it('squeezes a long separated serial into the plate instead of overflowing', () => {
    const svg = render('us-nv', 'standard', { serial: 'WWWWW·WWW', lettering: 'default' });
    expect(svg).toContain('lengthAdjust="spacingAndGlyphs"');
  });

  it('leaves states without a separator option untouched', () => {
    const ct = render('us-ct', 'standard', { serial: 'AB·12345', lettering: 'default' });
    expect(ct).not.toContain('data-role="separator"');
    expect(ct).toContain('AB·12345</text>');
    const tx = render('us-tx', 'standard', { serial: 'BBB-1234', lettering: 'default' });
    expect(tx).not.toMatch(/data-role="(separator|scene|marker)"/);
  });

  it('sets the Illinois EV marker apart from the serial', () => {
    const svg = render('us-il', 'electric-vehicle', { serial: '12345 EL', lettering: 'default' });
    expect(svg).toMatch(/data-role="marker"[^>]*>EL<\/text>/);
    expect(svg).toContain('>12345</text>');
    expect(svg).toContain('aria-label="12345 EL"');
  });

  it('draws both bands and a scene for the 2001 New York plate', () => {
    const svg = render('us-ny', 'empire-state-2001', { serial: 'ACA-1000', lettering: 'default' });
    expect(svg).toContain('data-role="scene-over"');
    expect(svg).toContain('THE EMPIRE STATE');
    expect(svg).toContain('y="256"'); // bottom band: 300 − 44
  });
});
