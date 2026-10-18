// CI-only browser checks; comparison assets are local PNGs, never font binaries.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const out = 'test-results/typography';
await fs.mkdir(out, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'inherit' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4175/')).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  assert(ready, 'preview server did not start');
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/');
  for (const country of ['Iraq', 'Iran']) {
    await page.locator('.region-trigger').click();
    // The picker starts scoped to Canada when the selected plate is Canadian.
    await page.getByRole('button', { name: 'All countries', exact: true }).click();
    await page.getByLabel('Search regions').fill(country);
    await page.locator('#picker-list').getByRole('option', { name: new RegExp(country) }).click();
    const [report] = await Promise.all([
      context.waitForEvent('page'), page.getByRole('link', { name: 'Open reference-photo comparisons', exact: true }).click(),
    ]);
    report.on('pageerror', (e) => errors.push(e.message));
    await report.waitForLoadState();
    const sections = report.locator(`section[data-ref^="${country.toLowerCase()}-"]`);
    assert.equal(await sections.count(), country === 'Iran' ? 3 : 1);
    for (const section of await sections.all()) {
      for (const value of await section.locator('option').evaluateAll((xs) => xs.map((x) => x.value))) {
        await section.locator('select').selectOption(value);
        for (const image of await section.locator('img').all()) {
          await image.evaluate((im) => im.decode());
          assert.equal(await image.evaluate((im) => im.naturalWidth), 1040);
        }
      }
      await section.locator('input[type="range"]').focus();
      await section.locator('input[type="range"]').press('End');
      assert.equal(await section.locator('input').inputValue(), '100');
      assert.equal(await section.locator('.candidate').evaluate((im) => getComputedStyle(im).opacity), '1');
    }
    await page.screenshot({ path: `${out}/${country.toLowerCase()}-inspector.png`, fullPage: true });
    await report.screenshot({ path: `${out}/${country.toLowerCase()}-report.png`, fullPage: true });
    await report.close();
  }
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.getByRole('link', { name: 'Save the standalone comparison report' }).click(),
  ]);
  const file = path.resolve(out, 'comparison-offline.html');
  await download.saveAs(file);
  const html = await fs.readFile(file, 'utf8');
  assert(html.includes('data:image/png;base64,'));
  assert(!html.includes('@font-face') && !html.includes('data:font'));
  await context.setOffline(true);
  await page.goto(pathToFileURL(file).href);
  assert.equal(await page.locator('section[data-ref]').count(), 4);
  for (const section of await page.locator('section[data-ref]').all()) {
    for (const value of await section.locator('option').evaluateAll((xs) => xs.map((x) => x.value))) {
      await section.locator('select').selectOption(value);
      await section.locator('.candidate').evaluate((im) => im.decode());
      assert.equal(await section.locator('.candidate').evaluate((im) => im.naturalWidth), 1040);
      assert((await section.locator('.candidate').getAttribute('src')).startsWith('data:image/png;base64,'));
    }
  }
  await page.screenshot({ path: `${out}/offline-report.png`, fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Typography controls, all reference/candidate images, download and offline report passed.');
} finally {
  await browser?.close();
  server.kill();
}
