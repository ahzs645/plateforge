import type { FontAsset } from '../core/types';
import { fontHasCharacter, fontWeightRange, matchingFontFaces, splitFontFamilies } from '../core/font-contract';

export interface SvgTextRun { element: SVGElement; text: string; family: string; size: string; weight: number; style: string }
export function svgTextRuns(svg: SVGSVGElement): SvgTextRun[] {
  const view = svg.ownerDocument.defaultView;
  return [...svg.querySelectorAll<SVGElement>('text, tspan, textPath')].flatMap((element) => {
    const text = [...element.childNodes].filter((child) => child.nodeType === 3).map((child) => child.textContent ?? '').join('');
    if (!text) return [];
    const css = view?.getComputedStyle(element);
    return [{ element, text, family: css?.fontFamily || element.getAttribute('font-family') || 'sans-serif',
      size: css?.fontSize || element.getAttribute('font-size') || '16px',
      weight: Number(css?.fontWeight || element.getAttribute('font-weight') || 400),
      style: css?.fontStyle || element.getAttribute('font-style') || 'normal' }];
  });
}
export interface SvgTypographyInspection {
  faces: FontAsset[];
  warnings: string[];
  liveRuns: number;
  systemFamilies: string[];
  glyphKinds: Record<string, number>;
  researchUnits: string[];
  profileIds: string[];
}
/** Inspect declared cmaps, not an unsupported claim to identify the browser's actual system face. */
export function inspectSvgTypography(svg: SVGSVGElement, fonts: readonly FontAsset[]): SvgTypographyInspection {
  const selected = new Set<FontAsset>(), warnings = new Set<string>(), systems = new Set<string>();
  const runs = svgTextRuns(svg);
  for (const run of runs) {
    const families = splitFontFamilies(run.family);
    if (!fonts.some((f) => f.family.toLowerCase() === families[0]?.toLowerCase())) {
      systems.add(run.family);
      warnings.add(`System font dependent: ${run.family}. Identical lettering on another device is not guaranteed.`);
    }
    const remaining = new Set([...run.text].filter((c) => !/\s/u.test(c)));
    for (const [familyIndex, family] of families.entries()) {
      const matching = matchingFontFaces(fonts, family, run.weight, run.style);
      for (const face of [...matching].reverse()) {
        const covered = [...remaining].filter((c) => fontHasCharacter(face, c));
        if (!covered.length) continue;
        selected.add(face); covered.forEach((c) => remaining.delete(c));
        if (familyIndex && !systems.has(run.family)) warnings.add(`Mixed-family fallback: ${covered.join('')} uses ${family} coverage rather than ${families[0]}.`);
        const [lo, hi] = fontWeightRange(face.weight);
        if (run.weight < lo || run.weight > hi) warnings.add(`Weight substitution: ${family} requests ${run.weight}, matched ${face.weight ?? 400}.`);
        if ((face.style ?? 'normal') !== run.style) warnings.add(`Style substitution: ${family} requests ${run.style}, available face is ${face.style ?? 'normal'}.`);
        if (!face.unicodeRange) warnings.add(`Unverified character coverage: ${face.family}.`);
      }
      if (!remaining.size) break;
    }
    if (remaining.size && !systems.has(run.family)) { warnings.add(`Unbundled fallback glyphs in ${families[0]}: ${[...remaining].join('')}.`); systems.add(run.family); }
  }
  for (const face of selected) if (face.license?.status !== 'open') warnings.add(`${face.family}: ${face.license?.label ?? 'Deployment permission not recorded'}.`);
  const kinds: Record<string, number> = {};
  for (const g of svg.querySelectorAll('[data-provenance]')) {
    const kind = g.getAttribute('data-provenance')!; kinds[kind] = (kinds[kind] ?? 0) + 1;
  }
  const units = [...new Set([...svg.querySelectorAll('[data-research-unit]')].map((g) => g.getAttribute('data-research-unit')!))];
  const profileIds = [...new Set([...svg.querySelectorAll('[data-die]')].map((g) => g.getAttribute('data-die')!))];
  return { profileIds, faces: fonts.filter((font) => selected.has(font)), warnings: [...warnings], liveRuns: runs.length, systemFamilies: [...systems], glyphKinds: kinds, researchUnits: units };
}

/** Preserve inherited host CSS typography in the standalone document without converting curves. */
export function freezeTextStyles(source: SVGSVGElement, clone: SVGSVGElement): void {
  const view = source.ownerDocument.defaultView;
  if (!view) return;
  const originals = source.querySelectorAll<SVGElement>('text, tspan, textPath');
  const copies = clone.querySelectorAll<SVGElement>('text, tspan, textPath');
  const properties = ['font-family','font-size','font-style','font-weight','font-stretch','font-variant','letter-spacing','word-spacing','direction','unicode-bidi','text-anchor'];
  originals.forEach((node, i) => {
    const style = view.getComputedStyle(node);
    for (const property of properties) {
      const value = style.getPropertyValue(property);
      if (value) copies[i].style.setProperty(property, value);
    }
  });
}
