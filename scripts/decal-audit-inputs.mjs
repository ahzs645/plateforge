/** Strict specimen inputs for research renders. The editor keeps its own defaults. */
const MONTHS = new Set(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']);

export function auditDecalArt(decal, reference, decalArt) {
  const fail = message => { throw new Error(`Invalid audit input for ${reference.id}: ${message}`); };
  for (const field of ['month', 'control']) {
    if (!Object.hasOwn(reference, field)) fail(`${field} must be explicitly supplied (null means unobserved/absent)`);
  }
  if (decal.year >= 1980 ? !MONTHS.has(reference.month) : reference.month !== null) {
    fail(decal.year >= 1980 ? 'month must be a photographed three-letter month; no JAN fallback is permitted' : 'annual decal month must be null');
  }
  if (reference.control !== null && (typeof reference.control !== 'string' || !decal.digits || !new RegExp(`^\\d{${decal.digits}}$`).test(reference.control))) {
    fail(`control must be exactly ${decal.digits} digits as a string, or null; received ${JSON.stringify(reference.control)}`);
  }
  if (reference.day != null && (typeof reference.day !== 'string' || !/^(?:0?[1-9]|[12]\d|3[01])$/.test(reference.day))) {
    fail('day must be a transcribed day string or null');
  }
  const art = {...decalArt(decal, {decalMonth: reference.month ?? undefined, decalSerial: reference.control ?? undefined})};
  if (reference.control === null) delete art.serial;
  else if (art.serial !== reference.control) fail(`renderer substituted control ${JSON.stringify(art.serial)}`);
  if (reference.month === null) delete art.month;
  else if (art.month !== reference.month) fail(`renderer substituted month ${JSON.stringify(art.month)}`);
  // A pseudo-random editor day is not a transcription of a photographed sticker.
  if (reference.day == null) delete art.day;
  else art.day = reference.day;
  return art;
}

/** Carry the actual profile's paint treatment into diagnostic glyph rasters. */
export function auditPrintingProfiles(profiles) {
  return Object.fromEntries(profiles.map(profile => [profile.id.replace('bc-decal-print-', ''),
    Object.fromEntries(Object.entries(profile.overrides ?? {}).map(([char, glyph]) => [char, {
      ...glyph,
      ...(glyph.fill ? {filledStroke: profile.filledStroke ?? 0} : {stroke: glyph.stroke ?? profile.params.stroke}),
    }])),
  ]));
}

/** Check printed scene characters as well as the art input; labels alone are insufficient. */
export function verifyAuditScene(scene, reference) {
  const elements = [];
  const visit = node => {
    if (typeof node === 'string') return;
    elements.push(node);
    for (const child of node.children ?? []) visit(child);
  };
  visit(scene);
  const printed = {};
  for (const [field, role] of [['month', 'decal-month'], ['control', 'decal-serial']]) {
    const runs = elements.filter(node => node.attrs?.['data-role'] === role && node.attrs?.['data-die']);
    const expected = reference[field] === null ? [] : [reference[field]];
    const labels = runs.map(node => node.attrs['aria-label']);
    if (JSON.stringify(labels) !== JSON.stringify(expected)) throw new Error(`Printed ${field} differs from explicit audit input for ${reference.id}`);
    for (const run of runs) {
      const chars = [];
      const collect = node => {
        if (typeof node === 'string') return;
        if (node.attrs?.['data-character']) chars.push(node.attrs['data-character']);
        for (const child of node.children ?? []) collect(child);
      };
      collect(run);
      if (chars.join('') !== run.attrs['aria-label']) throw new Error(`Printed glyphs differ from ${field} label for ${reference.id}`);
    }
    printed[field] = labels[0] ?? null;
  }
  for (const node of elements.filter(node => node.attrs?.['data-role'] === 'decal-barcode')) {
    if (node.attrs['data-control'] !== reference.control) throw new Error(`Barcode control differs from audit input for ${reference.id}`);
  }
  return printed;
}
