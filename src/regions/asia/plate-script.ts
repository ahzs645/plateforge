/** Script handling shared by Iraq and Iran. Never reverse a serial to implement RTL. */
import type { Rng } from '../../core/random';
export type DigitScript = 'latin' | 'arabic' | 'persian';
const DIGITS: Record<DigitScript, string> = {
  latin: '0123456789', arabic: '٠١٢٣٤٥٦٧٨٩', persian: '۰۱۲۳۴۵۶۷۸۹',
};
/** Preserve length/leading zeros; reject non-digits in validators, not by deleting them here. */
export function asciiDigits(value = ''): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => String(ch.charCodeAt(0) - (ch <= '٩' ? 0x660 : 0x6f0)));
}
export function displayDigits(value: string, script: DigitScript): string {
  return asciiDigits(value).replace(/[0-9]/g, (ch) => DIGITS[script][Number(ch)]);
}
export function randomDigits(rng: Rng, length: number, allowZero = true): string {
  return Array.from({ length }, () => String(rng.int(allowZero ? 0 : 1, 9))).join('');
}
export function normalizeLetter(value = ''): string {
  return value.normalize('NFKC').replace(/[ـ\u200c\u200d\ufe0e\ufe0f]/g, '').replace(/ك/g, 'ک').replace(/[يى]/g, 'ی');
}
export function isDigits(value: string | undefined, min: number, max = min, allowZero = true): boolean {
  const text = asciiDigits(value ?? '');
  return text.length >= min && text.length <= max && (allowZero ? /^[0-9]+$/ : /^[1-9]+$/).test(text);
}
