import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const base = 'http://127.0.0.1:4174/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'inherit' });
let browser, page;
await mkdir('test-results/reference-library', { recursive: true });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  assert(ready, 'preview server did not start');
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], remoteImages = [];
  page.on('pageerror', (error) => { errors.push(error.message); console.error('PAGE ERROR', error.message); });
  // Test external-preview privacy and error handling without loading third-party photos.
  await page.route(/^https:\/\/(www\.)?(bcpl8s\.ca|leewardpro\.com)\//, async (route) => {
    remoteImages.push(route.request().url());
    await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Intentional preview failure fixture' });
  });
  await page.goto(`${base}#/library`);
  await page.getByRole('heading', { name: 'Plate designs, specimens and lettering' }).waitFor();
  await page.locator('.reference-page-card').first().waitFor();
  assert(await page.getByRole('tab', { name: 'Library', exact: true }).first().getAttribute('aria-selected') === 'true');
  assert.equal(remoteImages.length, 0);
  await page.screenshot({ path: 'test-results/reference-library/library-desktop.png', fullPage: false });
  await page.getByLabel('Search source pages').fill('1964-1969');
  await page.waitForFunction(() => document.querySelectorAll('.reference-page-card').length === 1);
  await page.getByRole('button', { name: 'Browse references', exact: true }).click();
  await page.locator('.reference-image-card').first().waitFor();
  const imageCount = await page.locator('.reference-image-card').count();
  assert(imageCount > 0 && imageCount <= 24);
  assert.equal(remoteImages.length, 0, 'external images must not load before consent');
  await page.getByLabel('Show externally hosted images').check();
  await page.waitForFunction(() => document.querySelector('.reference-image-stage')?.textContent.includes('Preview unavailable'));
  assert(remoteImages.length > 0 && remoteImages.length <= 24, 'only the current page may load previews');
  await page.getByLabel('Show externally hosted images').uncheck();
  await page.getByRole('button', { name: 'British Columbia · 1968', exact: true }).click();
  await page.locator('#field-serial').fill('123-456');
  assert.equal(await page.locator('.chip').count(), 41);
  const metadata = await page.locator('.plate-preview metadata').evaluate((e) => JSON.parse(e.textContent));
  assert.equal(metadata.baseYear, 1968);
  assert.equal(metadata.accuracy.dies, 'proxy or category illustration');
  await page.screenshot({ path: 'test-results/reference-library/bc-1968-editor.png', fullPage: false });
  await page.locator('.chip').filter({ hasText: /^1979 base · AAA block$/ }).click();
  await page.locator('#field-serial').fill('ABC-123');
  await page.screenshot({ path: 'test-results/reference-library/bc-1979-editor.png', fullPage: false });
  await page.goto(`${base}#/library`);
  await page.getByRole('button', { name: 'Lettering catalogue (70)', exact: true }).click();
  assert.equal(await page.locator('.reference-font-card').count(), 70);
  await page.getByLabel('Find a lettering jurisdiction').fill('Virginia');
  await page.getByLabel('Filter lettering category').selectOption('serif');
  await page.waitForFunction(() => document.querySelectorAll('.reference-font-card').length === 1);
  assert.equal(await page.locator('[data-jurisdiction="us-va"] .reference-serif').count(), 1);
  await page.getByLabel('Find a lettering jurisdiction').fill('British Columbia');
  await page.getByLabel('Filter lettering category').selectOption('');
  await page.waitForFunction(() => document.querySelectorAll('.reference-font-card').length === 1);
  await page.screenshot({ path: 'test-results/reference-library/lettering-catalogue.png', fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: 'test-results/reference-library/library-mobile.png', fullPage: false });
  // A broken index must be surfaced as an error with a working retry, not an empty library.
  await page.goto(`${base}#/us-ca/standard`);
  await page.route('**/data/reference-library/index.json', (route) => route.fulfill({ status: 503, body: 'Test outage' }));
  await page.goto(`${base}#/library`);
  await page.getByRole('alert').filter({ hasText: /503/ }).waitFor();
  await page.unroute('**/data/reference-library/index.json');
  await page.getByRole('button', { name: 'Retry metadata request', exact: true }).click();
  await page.locator('.reference-page-card').first().waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: library route and tabs; real snapshot and page shards; filters; 24-item pagination; opt-in image privacy and error fallback; source-to-editor links; 70 dated classifications; serif exception; mobile width; failed-index retry; no page errors. External images were mocked, not verified.');
} catch (error) {
  if (page) await page.screenshot({ path: 'test-results/reference-library/failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
