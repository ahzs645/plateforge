import type { FontAsset } from '../core/types';
import { fontFaceCss } from '../core/font-contract';
import { CORE_FONT_ASSETS } from './font-assets-core';
// FONT_ASSETS (every face, CJK included) lives in ./font-assets. This module imports only the core
// faces, so a bundle that never draws East Asian plates (src/embed/) does not emit the CJK subsets.
// Callers that need the whole catalogue (the PlateForge app, its exporter) pass FONT_ASSETS in.
export { CORE_FONT_ASSETS } from './font-assets-core';

const asset = (id: string): FontAsset => CORE_FONT_ASSETS.find((f) => f.id === id)!;
/** Compatibility names used by existing templates. Subsets/styles expand at export. */
export const FONTS = {
  barlow400: asset('barlow-400-normal-latin'),
  barlow500: asset('barlow-500-normal-latin'),
  barlow600: asset('barlow-600-normal-latin'),
  barlow700: asset('barlow-700-normal-latin'),
  barlow600Italic: asset('barlow-600-italic-latin'),
  barlow700Italic: asset('barlow-700-italic-latin'),
  euro: asset('euro'), uk: asset('uk'),
  antonio: asset('antonio-latin'), antonioExtended: asset('antonio-latin-ext'),
};

/** Custom/unregistered assets are retained; families in `catalogue` gain their real variants. */
export function expandFontAssets(declared: readonly FontAsset[], catalogue: readonly FontAsset[] = CORE_FONT_ASSETS): FontAsset[] {
  const families = new Set(declared.map((f) => f.family));
  const assets = [...catalogue.filter((f) => families.has(f.family)), ...declared];
  return [...new Map(assets.map((f) => [JSON.stringify([f.url, f.family, f.weight, f.style, f.unicodeRange]), f])).values()];
}

/** The catalogue plus any template-declared faces. Pass FONT_ASSETS for East Asian plates. */
export const availableFontAssets = (declared: readonly FontAsset[] = [], catalogue: readonly FontAsset[] = CORE_FONT_ASSETS): FontAsset[] =>
  expandFontAssets([...catalogue, ...declared], catalogue);

/** Declares the catalogue's @font-face rules once per document. Browsers fetch a face only when it is used. */
export function installPlateFonts(doc: Document = document, catalogue: readonly FontAsset[] = CORE_FONT_ASSETS): void {
  if (doc.getElementById('plateforge-font-faces')) return;
  const style = doc.createElement('style');
  style.id = 'plateforge-font-faces';
  style.textContent = catalogue.map((f) => fontFaceCss(f, f.url)).join('\n');
  doc.head.appendChild(style);
}

export { CN_STACK, JP_STACK, KR_STACK, SANS, SERIF, SCRIPT, SYLLABICS } from './portable-typefaces';
export { CN_STACK as CJK_STACK } from './portable-typefaces';
export const CONDENSED = '"Barlow Condensed", "Noto Sans", sans-serif';
export const BARLOW_CAP_HEIGHT = 0.7; // OS/2 capHeight 700 / unitsPerEm 1000, font version 1.408.
