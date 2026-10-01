// Overlay PlateForge's B.C. plates on BCpl8s photographs: photo | ours | ours at 50% over the photo.
// Usage: node compare.cjs [comparisons.json] [output dir]   (needs `npm run dev` at APP, default http://127.0.0.1:5173,
// and Playwright; the photos come from .cache/, see fetch.sh). Each case is "photo|route|serial[|tabSerial[|field=value…]]".
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path');
const APP = process.env.APP || 'http://127.0.0.1:5173';
const [config = 'comparisons.json', outDir = '../../docs/research/bc-lettering/comparisons'] = process.argv.slice(2);
const find = (name) => {
  for (const dir of fs.readdirSync('.cache')) {
    const f = path.join('.cache', dir, name);
    if (fs.existsSync(f)) return f;
  }
  throw new Error(`photo not cached: ${name} (run fetch.sh)`);
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  fs.mkdirSync(outDir, { recursive: true });
  const only = process.env.ONLY;   // render just this comparison
  for (const { name, width = 560, cases } of JSON.parse(fs.readFileSync(config, 'utf8')).filter((c) => !only || c.name === only)) {
    const rows = [];
    for (const c of cases) {
      const [photo, route, serial, tab, ...sets] = c.split('|');
      await p.goto(`${APP}/#/${route}`); await p.waitForTimeout(900);
      if (serial) await p.fill('#field-serial', serial);
      if (tab) await p.fill('#field-tabSerial', tab).catch(() => {});
      for (const kv of sets) { const [k, v] = kv.split('='); await p.selectOption('#field-' + k, v); }
      await p.waitForTimeout(150);
      // Drop the root's own width/height so the drawing fills each column.
      const svg = (await p.$eval('.plate-preview svg', (s) => s.outerHTML)).replace(/^<svg([^>]*?)\s(width|height)="[^"]*"/, '<svg$1').replace(/^<svg([^>]*?)\s(width|height)="[^"]*"/, '<svg$1');
      rows.push({ label: `${photo.replace(/\.jpg$/, '')} · #/${route}`, img: 'data:image/jpeg;base64,' + fs.readFileSync(find(photo)).toString('base64'), svg });
    }
    // Every copy gets its own ids, or later plates would pick up the first plate's masks and symbols.
    let copy = 0;
    const fill = (svg, h) => {
      const k = `c${copy++}-`;
      return svg.replace(/\bid="([^"]+)"/g, `id="${k}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${k}$1)`).replace(/href="#([^"]+)"/g, `href="#${k}$1"`)
        .replace('<svg', `<svg style="width:100%;height:${h};display:block" preserveAspectRatio="none"`);
    };
    const html = `<html><body style="margin:0;background:#888;font:14px sans-serif">${rows.map((r) => `
      <div style="display:flex;gap:10px;padding:10px;align-items:flex-start">
        <div style="flex:none"><div>${r.label}</div><img src="${r.img}" style="width:${width}px;display:block"></div>
        <div style="flex:none"><div>PlateForge</div><div style="width:${width}px;overflow:hidden">${fill(r.svg, 'auto')}</div></div>
        <div style="flex:none"><div>overlay (PlateForge at 50%)</div><div style="position:relative;width:${width}px"><img src="${r.img}" style="width:${width}px;display:block">
          <div style="position:absolute;inset:0;opacity:.5">${fill(r.svg, '100%')}</div></div></div>
      </div>`).join('')}</body></html>`;
    const tmp = path.resolve('out', 'compare.html');
    fs.mkdirSync('out', { recursive: true }); fs.writeFileSync(tmp, html);
    await p.setViewportSize({ width: width * 3 + 60, height: 60 });
    await p.goto('file://' + tmp); await p.waitForTimeout(500);
    const out = path.join(outDir, `${name}.jpg`);
    await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 82 });
    console.log('wrote', out);
  }
  await b.close();
})();
