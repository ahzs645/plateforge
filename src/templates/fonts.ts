import barlow600 from '@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2?url';
import barlow700 from '@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2?url';
import antonio from '../assets/fonts/Antonio-latin.woff2?url';
import euroPlate from '../assets/fonts/EuroPlate.ttf?url';
import ukPlate from '../assets/fonts/UKNumberPlate.ttf?url';
import type { FontAsset } from '../core/types';

/** Plate fonts. On screen they come from index.css; on export they are inlined as data URLs. */
export const FONTS = {
  barlow600: { family: 'Barlow Condensed', url: barlow600, weight: 600, format: 'woff2' },
  barlow700: { family: 'Barlow Condensed', url: barlow700, weight: 700, format: 'woff2' },
  euro: { family: 'EuroPlate', url: euroPlate, format: 'truetype' },
  uk: { family: 'UKNumberPlate', url: ukPlate, format: 'truetype' },
  /** Variable (400–700), SIL OFL; the stand-in artwork's lettering. */
  antonio: { family: 'Antonio', url: antonio, weight: '400 700', format: 'woff2' },
} satisfies Record<string, FontAsset>;

/** CJK text relies on system fonts (these are available to SVG images, so PNG export still works). */
export const CJK_STACK = '"PingFang SC", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans CJK SC", "Noto Sans JP", "Microsoft YaHei", "Yu Gothic", sans-serif';
/** Korean hangul via system fonts; kept apart from CJK_STACK so Chinese/Japanese rendering is unchanged. */
export const KR_STACK = '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Nanum Gothic", sans-serif';
export const CONDENSED = '"Barlow Condensed", "Arial Narrow", sans-serif';
