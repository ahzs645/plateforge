/** Build a genuinely offline editor from the exact React UI and live scene engine used by PlateForge.
 * Usage: node scripts/build-iran-customizer.mjs [output.html]
 * No photographs, network fonts, static SVG substitutions, or alternate rendering implementation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.cwd(), process.argv[2] ?? 'preview/iran-customizer.html');
const result = await build({
  root,
  configFile: false,
  logLevel: 'warn',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    write: false,
    minify: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    lib: { entry: path.join(root, 'src/ui/iran-customizer-main.tsx'), name: 'PlateForgeIranCustomizer', formats: ['iife'] },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
const scripts = outputs.filter((item) => item.type === 'chunk').map((item) => item.code).join('\n');
const styles = outputs.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css')).map((item) => String(item.source)).join('\n');
const unexpectedAssets = outputs.filter((item) => item.type === 'asset' && !item.fileName.endsWith('.css'));
if (unexpectedAssets.length) throw new Error(`Offline bundle has unembedded assets: ${unexpectedAssets.map((item) => item.fileName).join(', ')}`);
if (!scripts || !styles) throw new Error('Offline build did not produce both JavaScript and CSS.');
// Evidence and licence links are ordinary metadata, not remote font dependencies.
if (/@font-face|url\s*\(/i.test(styles) || /(?:fetch|importScripts)\s*\(|new\s+(?:FontFace|WebSocket)\s*\(/.test(scripts)) throw new Error('Unexpected restricted or external font dependency in offline bundle.');
const fontLicenses = [
  { name: 'Parastoo Bold', filename: 'Parastoo-LICENSE.txt', url: 'https://github.com/rastikerdar/parastoo-font' },
  { name: 'Sahel Bold', filename: 'Sahel-LICENSE.txt', url: 'https://github.com/rastikerdar/sahel-font' },
  { name: 'Noto Naskh Arabic Bold', filename: 'Noto-Naskh-Arabic-LICENSE.txt', url: 'https://github.com/notofonts/arabic' },
  { name: 'Noto Sans Regular', filename: 'NotoSans-COPYRIGHT.txt', url: 'https://github.com/notofonts/noto-fonts' },
  { name: 'Liberation Sans Regular and Bold', filename: 'Liberation-COPYRIGHT.txt', url: 'https://github.com/liberationfonts/liberation-fonts' },
  { name: 'GL-Nummernschild Eng', filename: 'GL-LICENSE.txt', url: 'https://github.com/Gutenberg-Labo/GL-Nummernschild/tree/c108a385ad67eab0e4e7cc9e1f5c3b9072bdbbd2' },
].map(license => ({ ...license, file: `docs/research/iran-customizer/fonts/source/${license.filename}` }));
const escapeHtml = text => text.replace(/[&<>"]/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[value]));
const licenseAppendix = `<footer class="offline-notices"><details><summary>Font licences and source-study rights</summary><p>Licensed typefaces are candidates, not authenticated Iranian manufacturing dies. Historical source-guided subsets have unspecified source-image redistribution rights and are included only for private critical study; their notices remain separate from the open-font licences.</p>${fontLicenses.map(license => `<details><summary>${license.name}</summary><p><a href="${license.url}" target="_blank" rel="noreferrer">Upstream source ↗</a></p><pre>${escapeHtml(fs.readFileSync(path.join(root, license.file), 'utf8'))}</pre></details>`).join('')}</details></footer>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src blob: data:; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'"><title>PlateForge · Iran customizer</title>
<style>html{background:#f6f7f5;color:#1b2c2a}body{margin:0}#root{max-width:1400px;margin:0 auto;padding:30px 34px 60px}@media(max-width:650px){#root{padding:22px 16px 40px}}.offline-notices{max-width:1332px;margin:0 auto;padding:0 34px 40px;font:12px/1.6 system-ui,sans-serif}.offline-notices details{margin:14px 0}.offline-notices summary{cursor:pointer;font-weight:650}.offline-notices pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 ui-monospace,monospace}.offline-notices a{color:#356b53}${styles.replace(/<\/style/gi, '<\\/style')}</style>
</head><body><div id="root"></div>${licenseAppendix}<noscript>This interactive customizer requires JavaScript. Open this file in a browser with JavaScript enabled.</noscript><script>${scripts.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
if (Buffer.byteLength(html) >= 15 * 1024 * 1024) throw new Error('Offline bundle exceeds the 15 MiB limit.');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
const sourceFiles = [
  'src/ui/IranWorkspace.tsx', 'src/ui/IranTimeline.tsx', 'src/ui/iran-timeline.css',
  'src/ui/IranFontCoverage.tsx',
  'src/ui/IranCustomizer.tsx', 'src/ui/iran-customizer.css', 'src/ui/iran-customizer-main.tsx',
  'src/ui/exporting.ts', 'src/templates/iran-custom-scene.ts', 'src/templates/iran-custom-fonts.ts',
  'src/templates/iran-source-layouts.ts', 'src/templates/iran-number-generation.ts',
  'src/templates/iran-custom-artwork.ts', 'src/templates/iran-custom-font-data.ts',
  'src/regions/asia/iran-data.ts',
  'src/templates/iran-custom-data.ts', 'src/templates/iran-custom-evidence.ts', 'src/templates/iran-custom-types.ts',
  'scripts/build-iran-customizer.mjs',
  ...fontLicenses.map(license => license.file),
];
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const manifest = {
  output: path.basename(out), bytes: Buffer.byteLength(html), sha256: sha256(html),
  implementation: 'Same React component and live scene/font modules as #/iran-customizer',
  offline: true,
  sources: sourceFiles.map((filename) => ({ file: filename, sha256: sha256(fs.readFileSync(path.join(root, filename))) })),
};
fs.writeFileSync(out.replace(/\.html?$/i, '') + '.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${out} (${manifest.bytes.toLocaleString()} bytes; SHA-256 ${manifest.sha256})`);
