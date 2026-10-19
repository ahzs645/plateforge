import { splitFontFamilies } from '../core/font-contract';

/** Only general-purpose proxies are substituted. Named die/outlined wordmark masters are untouched. */
export const CN_STACK = '"Noto Sans SC", sans-serif';
export const JP_STACK = '"Noto Sans JP", sans-serif';
export const KR_STACK = '"Noto Sans KR", sans-serif';
export const SANS = '"Noto Sans", sans-serif';
export const SERIF = '"Noto Serif", serif';
export const SCRIPT = '"Pinyon Script", cursive';
export const SYLLABICS = '"Noto Sans Canadian Aboriginal", sans-serif';
const PROXIES: Record<string, string> = {
  'georgia': SERIF, 'times new roman': SERIF, 'times': SERIF, 'serif': SERIF,
  'helvetica neue': SANS, 'helvetica': SANS, 'arial': SANS, 'sans-serif': SANS,
  'snell roundhand': SCRIPT, 'brush script mt': SCRIPT, 'segoe script': SCRIPT, 'cursive': SCRIPT,
  'euphemia ucas': SYLLABICS, 'gadugi': SYLLABICS, 'aboriginal sans': SYLLABICS,
};
export function portableFamily(family: string): string {
  return PROXIES[splitFontFamilies(family)[0]?.toLowerCase()] ?? family;
}
