import assert from 'node:assert/strict';

/** The exact reference selections shared by browser checks and the SSR preflight. */
export function decalApplicationCases(references, formats) {
  const dates = references.map(row => {
    const hosts = formats.filter(format => format.region === 'ca-bc' && format.decalIds.includes(row.catalogueId));
    const host = hosts.find(format => format.format === '2001-flag')
      ?? hosts.find(format => format.format === '1985-flag') ?? hosts[0];
    assert.ok(host, 'No application format offers decal ' + row.catalogueId);
    return {region: 'ca-bc', format: host.format,
      parts: {decal: row.catalogueId, decalMonth: row.month ?? 'JAN', decalSerial: row.control ?? ''},
      expectedDecal: {control: row.control, month: row.month}, specimen: 'renewal-' + row.id};
  });
  const recent = dates.find(row => row.parts.decal === '2023');
  assert.ok(recent, 'The canonical reference set must include the 2023 selection');
  dates.push({region: 'ca-bc', format: recent.format,
    parts: {decal: '2023', decalMonth: 'MAY', decalSerial: '00001234'},
    expectedDecal: {control: '00001234', month: 'MAY'}, specimen: 'renewal-leading-zero-control'});
  return dates;
}
