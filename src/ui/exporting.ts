import type { FontAsset, Plate } from '../core/types';

import { exportFontAliases } from './font-aliases';
import { fontFaceCss, fontHasCharacter, fontWeightRange } from '../core/font-contract';
import { availableFontAssets } from '../templates/fonts';
import { embeddedAssets } from './embedded-assets';
import { freezeTextStyles, inspectSvgTypography, svgTextRuns } from './font-inspection';
import { nextPaint, withFontTimeout } from './font-loading';

export interface SvgExportOptions {
  /** Explicitly permit nonportable OS fallback. Off by default; unsupported glyphs otherwise block export. */
  allowSystemFonts?: boolean;
  /** Font arrival can redraw the SVG. Read the current element after readiness, not a detached old one. */
  currentSvg?: () => SVGSVGElement | null | undefined;
  context?: Record<string, unknown>;
}

/** Portable bundled faces plus explicit notices for OS-dependent or unverified material. */
export async function serializeSvg(svg: SVGSVGElement, fonts: FontAsset[] = [], options: SvgExportOptions = {}): Promise<string> {
  const available = availableFontAssets(fonts);
  const doc = svg.ownerDocument;
  if (doc.fonts) {
    const requested = svgTextRuns(svg).map(async (run) => {
      // Force actual text (including Latin-ext), not just the browser's default Latin sample.
      await doc.fonts.load(`${run.style} ${run.weight} ${run.size} ${run.family}`, run.text);
    });
    await withFontTimeout(Promise.all(requested));
    await withFontTimeout(doc.fonts.ready);
    await nextPaint(doc);
  }
  const current = options.currentSvg ? options.currentSvg() : svg;
  if (!current) throw new Error('The plate changed while preparing the export; try again');
  const inspection = inspectSvgTypography(current, available);
  if (inspection.systemFamilies.length && !options.allowSystemFonts) throw new Error(`Portable export has unsupported or unbundled lettering: ${inspection.systemFamilies.join(', ')}`);
  const aliased = exportFontAliases(inspection.faces, available);
  // Fetch all selected faces before cloning. A 404/invalid font is an export error, not a fallback.
  const faces = await Promise.all(aliased.faces.map(async (font) => fontFaceCss(font, await embeddedAssets.get(font.url, 'font', font.sha256), 'block')));
  const clone = current.cloneNode(true) as SVGSVGElement;
  freezeTextStyles(current, clone);
  const sourceRuns = [...current.querySelectorAll<SVGElement>('text,tspan,textPath')];
  [...clone.querySelectorAll<SVGElement>('text,tspan,textPath')].forEach((run, i) => {
    const style = doc.defaultView!.getComputedStyle(sourceRuns[i]);
    run.style.fontFamily = aliased.familyFor(style.fontFamily, parseFloat(style.fontWeight) || 400, style.fontStyle);
  });
  await Promise.all([...clone.querySelectorAll('image')].map(async (image) => {
    const href = image.getAttribute('href') ?? image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (href && !href.startsWith('data:')) {
      const data = await embeddedAssets.get(new URL(href, doc.baseURI).href, 'image');
      image.setAttribute('href', data);
      image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }
  }));
  if (faces.length) {
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = faces.join(''); clone.insertBefore(style, clone.firstChild);
    // SVG image decoders can finish before fonts reached only through a long
    // fallback chain paint. Reference each embedded subset directly, before
    // the visible lettering. Opacity keeps layout/font loading active without
    // changing the artwork; display:none would skip that work.
    const preload = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    preload.setAttribute('data-role', 'font-preload');
    preload.setAttribute('aria-hidden', 'true');
    preload.setAttribute('pointer-events', 'none');
    preload.setAttribute('opacity', '0');
    const characters = [...new Set(svgTextRuns(current).flatMap((run) => [...run.text]))];
    for (const font of aliased.faces) {
      const sample = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      sample.setAttribute('font-family', font.family);
      sample.setAttribute('font-weight', String(fontWeightRange(font.weight)[0]));
      sample.setAttribute('font-style', font.style ?? 'normal');
      sample.setAttribute('font-size', '1');
      sample.textContent = characters.filter((char) => fontHasCharacter(font, char)).join('');
      preload.appendChild(sample);
    }
    style.after(preload);
  }
  const metadata = doc.createElementNS('http://www.w3.org/2000/svg', 'metadata');
  metadata.setAttribute('data-role', 'typography-export');
  metadata.textContent = JSON.stringify({ schema: 'plateforge.typography-export/v1',
    ...options.context,
    fonts: inspection.faces.map(({ id, family, weight, style, sourceVersion, sha256, license }) => ({ id, family, weight, style, sourceVersion, sha256, license })),
    fontAliases: aliased.metadata, liveTextRuns: inspection.liveRuns, systemFamilies: inspection.systemFamilies,
    outlineProfiles: inspection.profileIds, glyphKinds: inspection.glyphKinds, researchUnits: inspection.researchUnits, warnings: inspection.warnings,
    historicalAuthenticity: 'Not certified by export success; retain each profile’s source evidence and limitations.' });
  clone.appendChild(metadata);
  const { width, height } = current.viewBox.baseVal;
  if (![width, height].every((n) => Number.isFinite(n) && n > 0)) throw new RangeError('Invalid SVG dimensions');
  clone.setAttribute('width', `${width}`); clone.setAttribute('height', `${height}`);
  return new XMLSerializer().serializeToString(clone);
}

async function withSvgImage(svgText: string, use: (img: HTMLImageElement) => Promise<Blob>): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return await use(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const canvasToPng = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) =>
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'));

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return [canvas, ctx];
}

export function svgToPngBlob(svgText: string, width: number, height: number, scale = 3): Promise<Blob> {
  return withSvgImage(svgText, (img) => {
    const [canvas, ctx] = makeCanvas(width * scale, height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvasToPng(canvas);
  });
}

export interface TeslaTarget {
  width: 400;
  height: 100 | 200;
  /** Where the plate lands inside the target, aspect preserved; the rest stays transparent. */
  x: number; y: number; w: number; h: number;
}

/** Tesla's custom licence-plate image: 400×200 for North-American-shaped plates, 400×100 for long
 * (≥3:1, e.g. European) plates. The plate is fitted inside and centred, never stretched. */
export function teslaTarget(width: number, height: number): TeslaTarget {
  if (![width, height].every((n) => Number.isFinite(n) && n > 0)) throw new RangeError('Plate size must be positive.');
  const target = { width: 400, height: width / height >= 3 ? 100 : 200 } as const;
  const scale = Math.min(target.width / width, target.height / height);
  const w = width * scale, h = height * scale;
  return { ...target, x: (target.width - w) / 2, y: (target.height - h) / 2, w, h };
}

export type ExportKind = 'png' | 'svg' | 'tesla';
export const TESLA_HINT = 'Copy to a LicensePlate folder on your Tesla’s USB drive';

/** Renders at several times the fitted size, halves with high-quality smoothing, then draws into exactly 400×N. */
export function svgToTeslaPngBlob(svgText: string, width: number, height: number, oversample = 4): Promise<Blob> {
  const t = teslaTarget(width, height);
  return withSvgImage(svgText, (img) => {
    let [source, ctx] = makeCanvas(t.w * oversample, t.h * oversample);
    ctx.drawImage(img, 0, 0, source.width, source.height);
    while (source.width > t.w * 2) {
      const [half, halfCtx] = makeCanvas(source.width / 2, source.height / 2);
      halfCtx.drawImage(source, 0, 0, half.width, half.height);
      source = half;
    }
    const [out, outCtx] = makeCanvas(t.width, t.height);
    outCtx.drawImage(source, t.x, t.y, t.w, t.h);
    return canvasToPng(out);
  });
}

export function download(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const fileSafe = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'plate';

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function batchToCsv(plates: Plate[]): string {
  const partKeys = [...new Set(plates.flatMap((p) => Object.keys(p.parts)))];
  const header = ['region', 'region_code', 'format', 'text', ...partKeys];
  const rows = plates.map((p) => [p.region.name, p.region.code, p.format.id, p.text, ...partKeys.map((k) => p.parts[k] ?? '')]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

export function batchToJson(plates: Plate[]): string {
  return JSON.stringify(
    plates.map((p) => ({ region: p.region.id, format: p.format.id, text: p.text, parts: p.parts })),
    null,
    2,
  );
}
