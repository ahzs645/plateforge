#!/usr/bin/env node
/**
 * Imports a Not a Tesla App plate-library snapshot (plates.json + assets/<id>/…) as stand-in artwork.
 *
 *   node scripts/import-stand-ins.mjs "<path to plate-library>"
 *
 * Replaces src/stand-ins/manifest.json and src/stand-ins/assets/ wholesale, so rerunning with a newer
 * snapshot (or an empty one) is the whole refresh/removal procedure. Only the background and separator
 * images are kept; thumbnails, the preview app and the snapshot's renderer are not needed here.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const src = process.argv[2] && resolve(process.argv[2]);
if (!src || !existsSync(join(src, 'plates.json'))) {
  console.error('Usage: node scripts/import-stand-ins.mjs <plate-library directory containing plates.json>');
  process.exit(1);
}

const library = JSON.parse(readFileSync(join(src, 'plates.json'), 'utf8'));
if (library.schemaVersion !== 1 || !Array.isArray(library.plates)) throw new Error('Unsupported plate-library schema');

const out = resolve('src/stand-ins');
rmSync(join(out, 'assets'), { recursive: true, force: true });

const copy = (asset, id) => {
  const file = `${id}/${basename(asset.path)}`;
  mkdirSync(join(out, 'assets', id), { recursive: true });
  copyFileSync(join(src, asset.path), join(out, 'assets', file));
  return file;
};

const plates = library.plates.map((p) => {
  const sep = p.separatorAsset;
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    region: p.region,
    category: p.category,
    customizable: p.customizable,
    sourceUrl: p.sourceUrl,
    artwork: { file: copy(p.artwork, p.id), width: p.artwork.width, height: p.artwork.height, sha256: p.artwork.sha256 },
    separator: {
      available: p.separator.available,
      space: p.separator.space,
      gap: p.separator.gap,
      height: p.separator.height,
      max: p.separator.max,
      ...(sep ? { file: copy(sep, p.id), imageWidth: sep.width, imageHeight: sep.height, bounds: p.separator.crop ?? sep.alphaBounds } : {}),
    },
    text: p.text,
  };
});

writeFileSync(join(out, 'manifest.json'), `${JSON.stringify({
  source: library.source,
  capturedDate: library.capturedDate,
  credit: 'Artwork and text settings from Not a Tesla App (notateslaapp.com); rights remain with their owners.',
  plates,
}, null, 1)}\n`);
console.log(`Imported ${plates.length} stand-ins (${plates.filter((p) => p.customizable).length} editable) into ${out}`);
