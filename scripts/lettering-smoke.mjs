// CI-only browser check; does not add a runtime dependency or transmit plate data.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'inherit' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4173/')).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  assert(ready, 'preview server did not start');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('.region-trigger').click();
  await page.getByLabel('Search regions').fill('British Columbia');
  await page.getByRole('option', { name: /British Columbia/ }).click();
  assert.equal(await page.locator('.chip').count(), 25);
  await page.locator('.chip').filter({ hasText: /^1953$/ }).click();
  await page.locator('#field-serial').fill('33-638');
  await page.locator('#field-tabSerial').fill('148879');
  await page.locator('.lettering-comparison summary').click();
  assert.equal(await page.locator('.lettering-card').count(), 4);
  const meta = () => page.locator('.plate-preview metadata').evaluate((element) => JSON.parse(element.textContent));
  for (const type of ['semicircular', 'squarish', 'oval', 'hybrid']) {
    await page.locator('#field-lettering').selectOption(type);
    assert.equal(await page.locator(`.plate-preview [data-role="serial"][data-lettering="${type}"]`).count(), 1);
    const data = await meta();
    assert.equal(data.lettering.category, type);
    assert.equal(data.baseYear, 1952);
    assert.equal(data.parts.tabSerial, '148879');
  }
  await page.locator('#field-finish').selectOption('embossed');
  await page.locator('.readout button.primary').click();
  assert.equal(await page.locator('#field-lettering').inputValue(), 'hybrid');
  assert.equal(await page.locator('#field-finish').inputValue(), 'embossed');
  for (let i = 0; i < 25; i++) {
    await page.locator('.chip').nth(i).click();
    await page.locator('#field-lettering').selectOption('squarish');
    assert.equal(await page.locator('.plate-preview [data-role="serial"][data-lettering="squarish"]').count(), 1);
    assert(!await page.locator('.plate-preview').evaluate((element) => element.innerHTML.includes('NaN')));
  }
  const download = async (kind) => {
    const pending = page.waitForEvent('download');
    await page.locator('.export-section button').filter({ hasText: new RegExp(`^${kind}$`) }).click();
    const file = await pending;
    const chunks = [];
    for await (const chunk of await file.createReadStream()) chunks.push(chunk);
    return Buffer.concat(chunks);
  };
  const svg = (await download('SVG')).toString('utf8');
  assert(svg.includes('data-lettering="squarish"'));
  assert(await page.evaluate((text) => !new DOMParser().parseFromString(text, 'image/svg+xml').querySelector('parsererror'), svg));
  const png = await download('PNG');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert(png.length > 2000);
  // Default still exports the serial as live text.
  await page.locator('#field-lettering').selectOption('default');
  assert.equal(await page.locator('.plate-preview text[data-role="serial"]').count(), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4173/#/us-ca/standard');
  await page.locator('#field-lettering').selectOption('oval');
  assert.equal(await page.locator('.plate-preview [data-role="serial"][data-lettering="oval"]').count(), 1);
  assert.equal((await meta()).lettering.category, 'oval');
  assert.deepEqual(errors, []);
  console.log('PASS: main-app region picker; 25 BC presets; four type switches; persistent settings; default text; SVG and PNG downloads; mobile overflow; US rendering; no page errors.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
