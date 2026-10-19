import type { FontAsset } from '../core/types';
import { fontFaceCss } from '../core/font-contract';
import { FONT_ASSETS } from './font-assets';
export { FONT_ASSETS } from './font-assets';

const asset = (id: string): FontAsset => FONT_ASSETS.find((f) => f.id === id)!;
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

/** Custom/unregistered assets are retained; built-in families gain their real variants. */
export function expandFontAssets(declared: readonly FontAsset[]): FontAsset[] {
  const families = new Set(declared.map((f) => f.family));
  const assets = [...FONT_ASSETS.filter((f) => families.has(f.family)), ...declared];
  return [...new Map(assets.map((f) => [JSON.stringify([f.url, f.family, f.weight, f.style, f.unicodeRange]), f])).values()];
}

export const availableFontAssets = (declared: readonly FontAsset[] = []): FontAsset[] => expandFontAssets([...FONT_ASSETS, ...declared]);

export function installPlateFonts(doc: Document = document): void {
  if (doc.getElementById('plateforge-font-faces')) return;
  const style = doc.createElement('style');
  style.id = 'plateforge-font-faces';
  style.textContent = FONT_ASSETS.map((f) => fontFaceCss(f, f.url)).join('\n');
  doc.head.appendChild(style);
}

export { CN_STACK, JP_STACK, KR_STACK, SANS, SERIF, SCRIPT, SYLLABICS } from './portable-typefaces';
export { CN_STACK as CJK_STACK } from './portable-typefaces';
export const CONDENSED = '"Barlow Condensed", "Noto Sans", sans-serif';
export const BARLOW_CAP_HEIGHT = 0.7; // OS/2 capHeight 700 / unitsPerEm 1000, font version 1.408.
