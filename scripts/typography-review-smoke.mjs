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
    await page.getByLabel('Search regions').fill(country);
    await page.locator('#picker-list').getByRole('option', { name: new RegExp(country) }).click();
    const panel = page.getByRole('region', { name: 'Typography reference comparison' });
    await panel.locator('summary').click();
    assert.equal(await panel.locator('select').count(), 2);
    for (const index of country === 'Iran' ? ['0', '1', '2'] : ['0']) {
      await page.locator('#typeface-reference').selectOption(index);
      const values = await page.locator('#typeface-candidate option').evaluateAll((xs) => xs.map((x) => x.value));
      for (const value of values) {
        await page.locator('#typeface-candidate').selectOption(value);
        await panel.locator('img').first().scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('[aria-label="Typography reference comparison"] img')].every((im) => im.complete && im.naturalWidth === 1040));
      }
    }
    await page.locator('#typeface-opacity').focus();
    await page.locator('#typeface-opacity').press('End');
    assert.equal(await page.locator('#typeface-opacity').inputValue(), '100');
    await page.screenshot({ path: `${out}/${country.toLowerCase()}-inspector.png`, fullPage: true });
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
