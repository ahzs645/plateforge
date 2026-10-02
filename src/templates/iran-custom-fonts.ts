/**
 * Source-honest Iran lettering. Portable SVG paths; no browser font dependency.
 * Generated font data uses real Persian Unicode, full OpenType shaping and licensed
 * sources. Historical completions distinguish observed contours from explicitly inferred numerals.
 * See docs/research/iran-customizer/fonts/README.md for source/rights and rebuild steps.
 */
import { IRAN_GENERATED_PROFILES, IRAN_GENERATED_WORDMARKS } from './iran-custom-font-data';

export type IranGlyphProvenance = 'observed' | 'inferred' | 'candidate' | 'fallback' | 'unsupported';
export type IranMissingPolicy = 'strict' | 'fallback';
export type IranFontProfileId = 'parastoo-candidate' | 'sahel-candidate' | 'naskh-candidate' | 'latin-candidate' | (string & {});
export interface IranInkBounds { x: number; y: number; width: number; height: number }
export interface IranGlyph {
  character: string; path: string; advance: number; bounds: IranInkBounds;
  provenance: IranGlyphProvenance; sourceId: string; note?: string; inference?: {method: string; basisCharacters: string[]; designNotes: string}; fillRule: 'evenodd' | 'nonzero';
}
export interface IranWordmarkOutline extends IranGlyph { wordmarkId: string; text: string; role?: string }
export interface IranGlyphRole { label?: string; capHeight: number; baseline: number; glyphs: Record<string, IranGlyph> }
export interface IranFontProfile {
  id: IranFontProfileId; label: string; coverage: string; provenance: IranGlyphProvenance;
  capHeight: number; baseline: number; glyphs: Record<string, IranGlyph>;
  wordmarks: Record<string, IranWordmarkOutline>; roles?: Record<string, IranGlyphRole>; script: 'persian' | 'latin';
  notes: string[]; rights: string; sourceUrl: string; sourceIds: string[]; license: string;
}
export interface IranWordmarkMetadata {
  id: string; label: string; text: string; kind: 'country' | 'city' | 'class' | 'free-zone'; note?: string;
}
export interface IranGlyphRun {
  markup: string; warnings: string[]; errors: string[]; bounds: IranInkBounds; advance: number;
  provenance: IranGlyphProvenance[]; sourceIds: string[];
}
export const IRAN_FONT_PROFILES = IRAN_GENERATED_PROFILES;
export const IRAN_WORDMARKS = IRAN_GENERATED_WORDMARKS;
export const IRAN_PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export const IRAN_FALLBACK_PROFILE: IranFontProfileId = 'parastoo-candidate';

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]!));
}
function n(value: number): string { return String(Math.round(value * 10000) / 10000); }
function assertArguments(x: number, baseline: number, height: number, tracking: number, policy: IranMissingPolicy): void {
  if (![x, baseline, height, tracking].every(Number.isFinite) || height <= 0) {
    throw new RangeError('Iran glyph coordinates and tracking must be finite; height must be positive');
  }
  if (policy !== 'strict' && policy !== 'fallback') throw new RangeError(`Unknown Iran missing-glyph policy: ${policy}`);
}
function getProfile(id: IranFontProfileId | string): IranFontProfile {
  const profile = Object.hasOwn(IRAN_FONT_PROFILES, id) ? IRAN_FONT_PROFILES[id as IranFontProfileId] : undefined;
  if (!profile) throw new RangeError(`Unknown Iran font profile: ${id}`);
  return profile;
}
function canonicalCharacter(profile: IranFontProfile, character: string): string {
  let digit = '0123456789'.indexOf(character);
  if (digit < 0) digit = '٠١٢٣٤٥٦٧٨٩'.indexOf(character);
  if (digit < 0) digit = IRAN_PERSIAN_DIGITS.indexOf(character);
  // Atomic هـ must never pass through indexOf('') or be treated as an isolated ه.
  if (character.length === 1 && digit >= 0) return (profile.script === 'latin' ? '0123456789' : IRAN_PERSIAN_DIGITS)[digit];
  return profile.script === 'latin' ? character.toUpperCase() : character;
}
function union(a: IranInkBounds | undefined, b: IranInkBounds): IranInkBounds {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
}
function box(label: string, x: number, baseline: number, height: number, designWidth = 64): Pick<IranGlyphRun, 'markup' | 'bounds' | 'advance'> {
  const width = designWidth * height / 100, stroke = Math.min(height * .022, width * .08);
  return {
    markup: `<g data-provenance="unsupported" aria-label="${escapeXml(label)}"><title>${escapeXml(label)}</title><rect x="${n(x + stroke / 2)}" y="${n(baseline - height + stroke / 2)}" width="${n(width - stroke)}" height="${n(height - stroke)}" fill="none" stroke="currentColor" stroke-width="${n(stroke)}"/><path d="M${n(x + width * .22)} ${n(baseline - height * .78)}L${n(x + width * .78)} ${n(baseline - height * .22)}M${n(x + width * .78)} ${n(baseline - height * .78)}L${n(x + width * .22)} ${n(baseline - height * .22)}" fill="none" stroke="currentColor" stroke-width="${n(stroke)}"/></g>`,
    bounds: { x, y: baseline - height, width, height }, advance: width + height * .08,
  };
}
function paint(glyph: IranGlyph, x: number, baseline: number, scale: number, provenance: IranGlyphProvenance): Pick<IranGlyphRun, 'markup' | 'bounds'> {
  return {
    markup: `<g transform="translate(${n(x)} ${n(baseline)}) scale(${n(scale)})" data-provenance="${provenance}" data-source="${escapeXml(glyph.sourceId)}" aria-label="${escapeXml(glyph.character)}"><title>${escapeXml(glyph.character)} · ${provenance}${glyph.note ? ` · ${escapeXml(glyph.note)}` : ''}</title><path fill-rule="${glyph.fillRule}" d="${glyph.path}"/></g>`,
    bounds: { x: x + glyph.bounds.x * scale, y: baseline + glyph.bounds.y * scale, width: glyph.bounds.width * scale, height: glyph.bounds.height * scale },
  };
}
function notices(profile: IranFontProfile): string[] {
  if (profile.provenance === 'candidate') return [`${profile.label}: a licensed typography candidate, not an authenticated Iranian plate die`];
  const warnings = [`${profile.label}: only listed source-guided glyphs, roles and complete words are supported`];
  if (profile.rights.startsWith('Private')) warnings.push('Historical source-photo reuse rights are unverified; private critical study only');
  else warnings.push(profile.rights);
  return warnings;
}
const unique = <T,>(items: T[]): T[] => [...new Set(items)];

/**
 * Render serial digits and isolated series letters left-to-right with native advances.
 * ASCII and Arabic-Indic numeral input is normalized to actual Persian glyphs except
 * in the explicitly Latin profile. height means the shared numeral cap-height, not
 * the individual ink height (small zero and natural overshoots stay small/natural).
 * Tracking is in final SVG units. هـ is an atomic HarfBuzz-shaped plate token.
 * Recognized complete word text is routed to renderIranWordmark; other adjacent
 * Arabic letters are blocked, never deceptively rendered as unjoined words.
 */
export function renderIranGlyphRun(profileId: IranFontProfileId | string, text: string, x: number, baseline: number, height: number, tracking = 0, policy: IranMissingPolicy = 'strict', role?: string): IranGlyphRun {
  assertArguments(x, baseline, height, tracking, policy);
  const profile = getProfile(profileId);
  const knownWord = !role && /[\u0600-\u06FF]/u.test(text) ? Object.values(IRAN_WORDMARKS).find((word) => word.text === text) : undefined;
  const selectedGlyphs = role ? profile.roles?.[role]?.glyphs ?? {} : profile.glyphs;
  const selectedLabel = role ? `${profile.label} / ${role} role` : profile.label;
  if (knownWord) return renderIranWordmark(profileId, knownWord.id, x, baseline, height, policy);
  // Reject arbitrary joined-language strings rather than presenting disconnected letters as shaped Persian.
  const arabicText = text.replaceAll('هـ', '\uFFFC');
  if (/[\u0620-\u063F\u0641-\u064A\u066E-\u06D3]{2,}/u.test(arabicText)) {
    const error = 'Unrecognized joined Persian text: select a supported complete wordmark or separate isolated series letters with spaces';
    return { ...box(error, x, baseline, height, 140), warnings: notices(profile), errors: [error], provenance: ['unsupported'], sourceIds: [] };
  }
  const warnings = notices(profile), errors: string[] = [], provenance: IranGlyphProvenance[] = [], sourceIds: string[] = [];
  const tokens = text.match(/هـ|[\s\S]/gu) ?? [];
  let markup = '', penX = x, bounds: IranInkBounds | undefined;
  tokens.forEach((character, index) => {
    if (/^\s$/u.test(character)) { penX += height * .34; if (index < tokens.length - 1) penX += tracking; return; }
    const canonical = canonicalCharacter(profile, character);
    let glyph = selectedGlyphs[canonical], origin = glyph?.provenance;
    if (!glyph && policy === 'fallback') {
      // Latin characters have a separate licensed fallback; Persian never borrows Iraqi digit maps.
      const fallback = IRAN_FONT_PROFILES[profile.script === 'latin' || /^[A-Za-z]$/u.test(character) ? 'latin-candidate' : IRAN_FALLBACK_PROFILE];
      glyph = fallback.glyphs[canonicalCharacter(fallback, character)];
      if (glyph) { origin = 'fallback'; warnings.push(`“${character}” is absent from ${selectedLabel}; explicit fallback uses ${fallback.label}`); }
    }
    if (glyph && origin) {
      const scale = height / 100, rendered = paint(glyph, penX, baseline, scale, origin);
      markup += rendered.markup; bounds = union(bounds, rendered.bounds); penX += glyph.advance * scale;
      provenance.push(origin); sourceIds.push(glyph.sourceId);
      if (glyph.note && (origin === 'observed' || origin === 'inferred')) warnings.push(glyph.note);
      if (origin === 'inferred') warnings.push(`${canonical}: stylistically inferred completion; this numeral is not observed in the cited specimen`);
    } else {
      const error = `Unsupported “${character}” in ${selectedLabel}; crossed box shown and export blocked`;
      const rendered = box(error, penX, baseline, height);
      markup += rendered.markup; bounds = union(bounds, rendered.bounds); penX += rendered.advance;
      errors.push(error); provenance.push('unsupported');
    }
    if (index < tokens.length - 1) penX += tracking;
  });
  return { markup, warnings: unique(warnings), errors: unique(errors), bounds: bounds ?? { x, y: baseline, width: 0, height: 0 }, advance: penX - x, provenance, sourceIds: unique(sourceIds) };
}

/**
 * A wordmark is one complete pre-shaped outline. height is total ink height and
 * baseline is its bottom edge. Never split it into a fake PUA alphabet, stretch it
 * horizontally, or change internal tracking. Its caller may uniformly scale it.
 */
export function renderIranWordmark(profileId: IranFontProfileId | string, wordmarkId: string, x: number, baseline: number, height: number, policy: IranMissingPolicy = 'strict'): IranGlyphRun {
  assertArguments(x, baseline, height, 0, policy);
  const profile = getProfile(profileId), metadata = Object.hasOwn(IRAN_WORDMARKS, wordmarkId) ? IRAN_WORDMARKS[wordmarkId] : undefined;
  let word = Object.hasOwn(profile.wordmarks, wordmarkId) ? profile.wordmarks[wordmarkId] : undefined, origin = word?.provenance;
  const warnings = notices(profile);
  if (!word && metadata && policy === 'fallback') {
    const fallback = IRAN_FONT_PROFILES[/^[\x20-\x7E]+$/.test(metadata.text) ? 'latin-sans-candidate' : IRAN_FALLBACK_PROFILE];
    word = fallback.wordmarks[wordmarkId]; origin = 'fallback';
    warnings.push(`${metadata.label} is not supported in ${profile.label}; explicit fallback uses a complete ${fallback.script === 'persian' ? 'HarfBuzz-shaped Persian' : 'Latin outline'} wordmark from ${fallback.label}`);
  }
  if (!word || !origin) {
    const error = `Unsupported wordmark “${metadata?.label ?? wordmarkId}” in ${profile.label}; crossed box shown and export blocked`;
    return { ...box(error, x, baseline, height, 140), warnings: unique(warnings), errors: [error], provenance: ['unsupported'], sourceIds: [] };
  }
  if (word.note) warnings.push(word.note);
  if (metadata?.note) warnings.push(metadata.note);
  const scale = height / 100;
  return { ...paint(word, x, baseline, scale, origin), advance: word.advance * scale, warnings: unique(warnings), errors: [], provenance: [origin], sourceIds: [word.sourceId] };
}

/** Render an observed role-specific alphabet (for example a small year tab) without borrowing the main serial glyphs. */
export function renderIranRoleGlyphRun(profileId: IranFontProfileId | string, role: string, text: string, x: number, baseline: number, height: number, tracking = 0, policy: IranMissingPolicy = 'strict'): IranGlyphRun {
  return renderIranGlyphRun(profileId, text, x, baseline, height, tracking, policy, role);
}
