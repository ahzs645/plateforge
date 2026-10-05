#!/usr/bin/env node
/** Build editable assets from manually authored control geometry. No image input. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { reference, cutSections, borderSections, holes, slots } from './nwt-polar-bear/geometry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetDir = path.join(root, 'public/shapes/nwt-polar-bear');
const modulePath = path.join(root, 'src/templates/shapes/nwt-polar-bear.ts');
const f = n => Number(n.toFixed(3));
const transform = (x, y, bounds = reference.primaryBounds) => [
  f((x - bounds[0]) * reference.canvas[0] / bounds[2]),
  f((y - bounds[1]) * reference.canvas[1] / bounds[3]),
];
function normalize(sections) {
  return sections.map(section => ({ ...section, commands: section.commands.map(([op, ...xy]) => {
    const result = [op];
    for (let i = 0; i < xy.length; i += 2) result.push(...transform(xy[i], xy[i + 1]));
    return result;
  }) }));
}
const cut = normalize(cutSections);
const border = normalize(borderSections);
const asPath = sections => sections.flatMap(s => s.commands.map(([op, ...xy]) => `${op}${xy.join(' ')}`)).join(' ');
const cutPath = asPath(cut);
const borderPath = asPath(border);
const roundHoles = holes.map(h => {
  const [cx, cy] = transform(h.cx, h.cy);
  // Keep circles circular on the normalized canvas. Scale from the x axis.
  return { cx, cy, r: f(h.r * reference.canvas[0] / reference.primaryBounds[2]) };
});
const slotHoles = slots.map(h => {
  const [cx, cy] = transform(h.cx, h.cy, reference.secondaryBounds);
  return { cx, cy, width: f(h.width * 600 / reference.secondaryBounds[2]),
    height: f(h.height * 300 / reference.secondaryBounds[3]), rx: f(h.rx * 300 / reference.secondaryBounds[3]) };
});
const circleSubpath = h => `M${f(h.cx - h.r)} ${h.cy} a${h.r} ${h.r} 0 1 0 ${f(h.r * 2)} 0 a${h.r} ${h.r} 0 1 0 ${f(-h.r * 2)} 0 Z`;
const piercedPath = `${cutPath} ${roundHoles.map(circleSubpath).join(' ')}`;
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const svg = (title, body) => `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 600 300" width="1200" height="600" role="img" aria-labelledby="title desc">\n  <title id="title">${title}</title>\n  <desc id="desc">${reference.method} Primary reference: ${reference.primary}. ${reference.status} Canvas: 600 by 300 normalized units.</desc>\n  <metadata>${escape(JSON.stringify(reference))}</metadata>\n${body}\n</svg>\n`;
const holeElements = roundHoles.map((h, i) => `    <circle id="mount-${i + 1}" cx="${h.cx}" cy="${h.cy}" r="${h.r}"/>`).join('\n');
const technical = svg('Northwest Territories polar bear — editable outline and trim',
  `  <g id="cut-outline" fill="none" stroke="#233f51" stroke-width="0.65" stroke-linejoin="round">\n    <path id="cut-edge" d="${cutPath}"/>\n  </g>\n  <g id="inset-border" fill="none" stroke="#1d5873" stroke-width="2.4" stroke-linejoin="round">\n    <path id="border-centerline" d="${borderPath}"/>\n  </g>\n  <g id="mounting-holes" fill="none" stroke="#607483" stroke-width="0.65">\n${holeElements}\n  </g>`);
const filled = svg('Northwest Territories polar bear — silhouette', `  <path id="nwt-polar-bear-cut" d="${cutPath}" fill="#111827"/>`);
const pierced = svg('Northwest Territories polar bear — silhouette with mounting holes', `  <path id="nwt-polar-bear-pierced" d="${piercedPath}" fill="#111827" fill-rule="evenodd"/>`);
const source = { ...reference, cutCommands: cut.flatMap(s => s.commands).length,
  borderCommands: border.flatMap(s => s.commands).length };
const ts = `/**\n * Generated from manually authored Bezier geometry.\n * Edit scripts/nwt-polar-bear/geometry.mjs, then run node scripts/build-nwt-polar-bear.mjs.\n * Primary: ${reference.primary}. 600x300 is a normalized artwork canvas.\n * ${reference.status}\n */\nexport const NWT_POLAR_BEAR_PATH = ${JSON.stringify(cutPath)};\n\n/** Independently constructed inset trim; never use as the cut/clipping outline. */\nexport const NWT_POLAR_BEAR_BORDER_PATH = ${JSON.stringify(borderPath)};\n\nexport const NWT_POLAR_BEAR_HOLES = ${JSON.stringify(roundHoles, null, 2)} as const;\n\n/** Slot geometry observed in the older white Explore reference. */\nexport const NWT_POLAR_BEAR_SLOTS = ${JSON.stringify(slotHoles, null, 2)} as const;\n\nexport const NWT_POLAR_BEAR_SOURCE = ${JSON.stringify(source, null, 2)} as const;\n`;
await mkdir(assetDir, { recursive: true });
await mkdir(path.dirname(modulePath), { recursive: true });
await writeFile(modulePath, ts);
for (const [name, content] of [
  ['nwt-polar-bear.svg', filled],
  ['nwt-polar-bear-outline.svg', technical],
  ['nwt-polar-bear-with-holes.svg', pierced],
  ['nwt-polar-bear-geometry.json', JSON.stringify({ ...source, cut, border, holes: roundHoles, slots: slotHoles }, null, 2) + '\n'],
]) await writeFile(path.join(assetDir, name), content);
console.log(JSON.stringify({ modulePath, assetDir, cutCommands: source.cutCommands, borderCommands: source.borderCommands }, null, 2));
