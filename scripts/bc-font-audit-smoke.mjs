/** Production UI checks for selected B.C. die families and the offline evidence report. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(path.resolve(process.env.TYPOGRAPHY_BROWSER_DEPS ?? 'package.json'));
const { chromium, firefox, webkit } = require('playwright');
const { PNG } = require('pngjs');
const browserName = process.env.TYPOGRAPHY_BROWSER ?? 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
assert(browserType, 'Unknown browser');
const output = path.resolve(`typography-evidence/bc-font-audit-${browserName}`);
await mkdir(output, { recursive: true });
const dist = path.resolve('dist');
await readFile(path.join(dist, 'bc-font-audit/index.html'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/plateforge/')) { response.writeHead(404).end(); return; }
    let relative = decodeURIComponent(pathname.slice('/plateforge/'.length));
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) { response.writeHead(403).end(); return; }
    const bytes = await readFile(file);
    response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    response.end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const base = `http://127.0.0.1:${server.address().port}/plateforge/`;
const result = { browser: browserName, checks: [], errors: [] };
let browser;
async function check(name, action) {
  try { result.checks.push({ name, status: 'passed', ...await action() }); }
  catch (error) { result.checks.push({ name, status: 'failed', error: String(error) }); result.errors.push({ name, error: String(error) }); }
}
function inspectSerial(svg) {
  return [...svg.querySelectorAll('[data-role="serial"] [data-character]')].map(glyph => ({
    character: glyph.getAttribute('data-character'),
    unit: glyph.getAttribute('data-research-unit'),
    provenance: glyph.getAttribute('data-provenance'),
    die: glyph.closest('[data-die]')?.getAttribute('data-die'),
    paths: [...glyph.querySelectorAll('path')].map(p => p.getAttribute('d')),
  }));
}
const cases = [
  ...[1, 2, 3, 4].map(type => ({ format: '1985-flag', die: `bc-astro-${type}`, serial: 'LAA-067', unit: `research-bc-astro-${type}-` })),
  { format: '1985-flag', die: 'bc-waldale', serial: 'KRL-067', unit: 'research-bc-waldale-trial-run-1998-1999' },
  { format: '2001-flag', die: 'bc-astro-4', serial: '067-LAA', unit: 'research-bc-astro-4-' },
  { format: '2001-flag', die: 'bc-waldale', serial: '067-SJF', unit: 'research-bc-waldale-passenger-' },
  { format: '2025-flag', serial: 'A12-3UY', unit: 'research-bc-waldale-passenger-', fallback: 'UY' },
  { format: '2025-flag', serial: 'A12-3UZ', unit: 'research-bc-waldale-passenger-', fallback: 'UZ' },
];
try {
  browser = await browserType.launch({ headless: true });
  result.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push({ name: 'pageerror', error: String(error) }));
  page.setDefaultTimeout(15000);
  for (const item of cases) await check(`${item.format} ${item.die ?? 'default'} ${item.serial}`, async () => {
    await page.goto(`${base}#/ca-bc/${item.format}`);
    await page.locator('.plate-preview svg').waitFor();
    await page.getByRole('checkbox', { name: 'Research lettering', exact: true }).check();
    await page.locator('.research-dies-note').filter({ hasText: 'Unvalidated research candidates' }).waitFor();
    if (item.die) await page.locator('#field-die').selectOption(item.die);
    await page.locator('#field-serial').fill(item.serial);
    await page.evaluate(() => document.fonts.ready);
    const svg = page.locator('.plate-preview svg');
    const glyphs = await svg.evaluate(inspectSerial);
    assert.equal(glyphs.map(g => g.character).join(''), item.serial.replace('-', ''));
    assert(glyphs.some(g => g.unit), 'Expected observed research glyphs');
    assert(glyphs.filter(g => g.unit).every(g => g.unit.startsWith(item.unit)), 'Selected family borrowed another family');
    if (item.die) assert(glyphs.every(g => g.die === item.die));
    for (const char of item.fallback ?? '') {
      const occurrences = glyphs.filter(g => g.character === char);
      assert(occurrences.length > 0);
      assert(occurrences.every(g => !g.unit && g.provenance === 'constructed'), `${char} must retain disclosed constructed fallback`);
    }
    const download = page.waitForEvent('download');
    await page.locator('.export-section').getByRole('button', { name: 'SVG', exact: true }).click();
    const file = await download;
    const exported = await readFile(await file.path(), 'utf8');
    const exportedGlyphs = await page.evaluate(({ source, inspect }) => {
      const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      if (parsed.querySelector('parsererror')) throw Error('Exported SVG is malformed');
      return Function(`return (${inspect})`)()(parsed.documentElement);
    }, { source: exported, inspect: inspectSerial.toString() });
    assert.deepEqual(exportedGlyphs, glyphs, 'Exported outlines/provenance differ from preview');
    const name = `${item.format}-${item.die ?? 'default'}-${item.serial}`;
    await writeFile(path.join(output, name + '.svg'), exported);
    await svg.screenshot({ path: path.join(output, name + '.png') });
    await file.delete();
    return { format: item.format, die: item.die ?? 'default', serial: item.serial, glyphs };
  });
  await check('PNG and Tesla downloads retain a visible serial', async () => {
    const images = [];
    for (const kind of ['PNG', 'Tesla']) {
      const download = page.waitForEvent('download');
      await page.locator('.export-section').getByRole('button', { name: kind, exact: true }).click();
      const file = await download, bytes = await readFile(await file.path());
      const image = PNG.sync.read(bytes);
      assert(image.width > 0 && image.height > 0);
      let blue = 0;
      for (let y = Math.floor(image.height * .33); y < image.height * .75; y++) {
        for (let x = Math.floor(image.width * .06); x < image.width * .94; x++) {
          const p = (y * image.width + x) * 4;
          if (image.data[p + 3] > 200 && image.data[p + 2] > image.data[p] + 30 && image.data[p] < 110) blue++;
        }
      }
      assert(blue > image.width * image.height * .015, `${kind} has too little serial ink`);
      await writeFile(path.join(output, `${kind.toLowerCase()}-2025-UZ.png`), bytes);
      images.push({ kind, width: image.width, height: image.height, serialInkPixels: blue });
      await file.delete();
    }
    return { images };
  });
  await check('research toggle switches to production and back', async () => {
    const toggle = page.getByRole('checkbox', { name: 'Research lettering', exact: true });
    await toggle.uncheck();
    assert.equal(await page.locator('.plate-preview [data-research-unit]').count(), 0);
    await toggle.check();
    await page.locator('.plate-preview [data-research-unit]').first().waitFor();
    assert.equal(await page.locator('#field-serial').inputValue(), 'A12-3UZ');
    assert.equal(await page.getByRole('link', { name: 'Review B.C. font families and glyph evidence' }).getAttribute('href'), '/plateforge/bc-font-audit/');
    return { serialPreserved: true };
  });
  const report = await context.newPage();
  report.on('pageerror', error => result.errors.push({ name: 'report pageerror', error: String(error) }));
  await check('report filters and per-character evidence', async () => {
    await report.goto(base + 'bc-font-audit/');
    const data = await report.locator('#audit-data').textContent();
    assert(JSON.parse(data));
    assert.equal(await report.locator('#focus .card').count(), 13);
    assert(await report.locator('.strip svg').count() >= 13);
    await report.locator('#search').fill('2025-flag');
    const matches = await report.locator('#rows details[data-case]:visible').count();
    assert(matches > 0 && matches < 20);
    await report.locator('#rows details[data-case]:visible').first().locator('summary').click();
    assert(await report.locator('#rows details[open]').count() > 0);
    await report.locator('#reset').click();
    await report.locator('#kind').selectOption('focus');
    assert.equal(await report.locator('#rows details[data-case]:visible').count(), 13);
    await report.locator('#reset').click();
    await report.evaluate(() => scrollTo(0, 0));
    await report.screenshot({ path: path.join(output, 'report-desktop.png') });
    return { focusCases: 13, filteredMatches: matches };
  });
  await check('report and application fit a phone viewport', async () => {
    await report.setViewportSize({ width: 390, height: 844 });
    assert(await report.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await report.screenshot({ path: path.join(output, 'report-mobile.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    return { width: 390 };
  });
  await check('before/after review shows all four corrected choices on a phone', async () => {
    const link = report.locator('a[href="before-after.html"]');
    assert.equal(await link.count(), 1);
    await link.click();
    assert.equal(await report.locator('.comparison').count(), 4);
    assert.equal(await report.locator('.comparison .strip svg').count(), 8);
    assert(await report.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await report.screenshot({ path: path.join(output, 'before-after-mobile.png') });
    return { correctedChoices: 4, strips: 8 };
  });
  await check('standalone report works without network', async () => {
    // Block HTTP(S) explicitly. WebKit's emulated offline mode can reject a
    // file:// navigation before it reads a self-contained local document.
    const offline = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const networkRequests = [];
    await offline.route(/^https?:\/\//, route => {
      networkRequests.push(route.request().url());
      return route.abort();
    });
    try {
      const filePage = await offline.newPage();
      filePage.on('pageerror', error => result.errors.push({ name: 'offline pageerror', error: String(error) }));
      await filePage.goto(pathToFileURL(path.join(dist, 'bc-font-audit/index.html')).href);
      assert.equal(await filePage.locator('#focus .card').count(), 13);
      await filePage.locator('#search').fill('1985-flag');
      assert(await filePage.locator('#rows details[data-case]:visible').count() > 0);
      assert(await filePage.locator('.tiles .tile svg').count() > 0);
      await filePage.locator('a[href="before-after.html"]').click();
      assert.equal(await filePage.locator('.comparison').count(), 4);
      assert.deepEqual(networkRequests, [], 'Standalone reports attempted network requests');
      return { networkRequired: false, blockedTransports: ['http', 'https'], networkRequests: 0 };
    } finally { await offline.close(); }
  });
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await writeFile(path.join(output, 'results.json'), JSON.stringify(result, null, 2) + '\n');
}
console.log(JSON.stringify({ browser: browserName, passed: result.checks.filter(c => c.status === 'passed').length, failed: result.checks.filter(c => c.status === 'failed'), errors: result.errors }, null, 2));
if (result.errors.length) process.exitCode = 1;
