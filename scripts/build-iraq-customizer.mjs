/** Build a genuinely offline editor from the exact React UI and live scene engine used by PlateForge.
 * Usage: node scripts/build-iraq-customizer.mjs [output.html]
 * No photographs, network fonts, static SVG substitutions, or alternate rendering implementation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.cwd(), process.argv[2] ?? 'preview/iraq-customizer.html');
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
    lib: { entry: path.join(root, 'src/ui/iraq-customizer-main.tsx'), name: 'PlateForgeIraqCustomizer', formats: ['iife'] },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
const scripts = outputs.filter((item) => item.type === 'chunk').map((item) => item.code).join('\n');
const styles = outputs.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css')).map((item) => String(item.source)).join('\n');
const unexpectedAssets = outputs.filter((item) => item.type === 'asset' && !item.fileName.endsWith('.css'));
if (unexpectedAssets.length) throw new Error(`Offline bundle has unembedded assets: ${unexpectedAssets.map((item) => item.fileName).join(', ')}`);
if (!scripts || !styles) throw new Error('Offline build did not produce both JavaScript and CSS.');
if (/IRPlate|EuroPlate|@font-face|https?:\/\/[^\s"']+\.(?:ttf|woff2?)/i.test(styles + scripts)) throw new Error('Unexpected restricted or external font dependency in offline bundle.');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>PlateForge · Iraq customizer</title>
<style>html{background:#f6f7f5;color:#1b2c2a}body{margin:0}#root{max-width:1400px;margin:0 auto;padding:30px 34px 60px}@media(max-width:650px){#root{padding:22px 16px 40px}}${styles.replace(/<\/style/gi, '<\\/style')}</style>
</head><body><div id="root"></div><noscript>This interactive customizer requires JavaScript. Open this file in a browser with JavaScript enabled.</noscript><script>${scripts.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
const sourceFiles = [
  'src/ui/IraqCustomizer.tsx', 'src/ui/iraq-customizer.css', 'src/ui/iraq-customizer-main.tsx',
  'src/ui/exporting.ts', 'src/templates/iraq-custom-scene.ts', 'src/templates/iraq-custom-fonts.ts',
  'src/templates/iraq-custom-data.ts', 'src/templates/iraq-custom-types.ts', 'src/regions/asia/iraq-data.ts',
  'scripts/build-iraq-customizer.mjs',
];
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const manifest = {
  output: path.basename(out), bytes: Buffer.byteLength(html), sha256: sha256(html),
  implementation: 'Same React component and live scene/font modules as #/iraq-customizer',
  offline: true,
  sources: sourceFiles.map((filename) => ({ file: filename, sha256: sha256(fs.readFileSync(path.join(root, filename))) })),
};
fs.writeFileSync(out.replace(/\.html?$/i, '') + '.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${out} (${manifest.bytes.toLocaleString()} bytes; SHA-256 ${manifest.sha256})`);
