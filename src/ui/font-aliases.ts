import type { FontAsset } from '../core/types';
import { matchingFontFaces, splitFontFamilies } from '../core/font-contract';

/**
 * SVG-as-image engines can collapse separately embedded CJK subsets which share
 * an internal font family. Give every physical face a private CSS alias, then
 * recreate the source's exact style/weight/subset fallback order for each run.
 * Font bytes, internal names, Unicode coverage and native glyphs stay unchanged.
 */
export function exportFontAliases(selected: readonly FontAsset[], available: readonly FontAsset[]) {
  const aliases = new Map(selected.map((font, i) => [font, `PlateForgeExportFace${i}`]));
  const faces = selected.map((font) => ({ ...font, family: aliases.get(font)! }));
  function familyFor(family: string, weight: number, style: string): string {
    return splitFontFamilies(family).flatMap((name) => {
      // CSS's last matching declaration wins when subset ranges overlap.
      const active = matchingFontFaces(available, name, weight, style).reverse();
      const found = active.filter((font) => aliases.has(font));
      return found.length ? found.map((font) => JSON.stringify(aliases.get(font)))
        : [/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(name) ? name : JSON.stringify(name)];
    }).join(', ');
  }
  return { faces, familyFor, metadata: selected.map((font) => ({ alias: aliases.get(font), id: font.id, family: font.family })) };
}
