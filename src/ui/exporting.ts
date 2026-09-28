import type { FontAsset, Plate } from '../core/types';

const assetCache = new Map<string, Promise<string>>();

function toDataUrl(url: string): Promise<string> {
  let p = assetCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      );
    assetCache.set(url, p);
  }
  return p;
}

/** Serializes a rendered plate <svg>, inlining its fonts and linked images (e.g. photo backgrounds) so it renders
 * identically anywhere, including when drawn to a canvas for PNG export, where external images never load. */
export async function serializeSvg(svg: SVGSVGElement, fonts: FontAsset[] = []): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  await Promise.all([...clone.querySelectorAll('image')].map(async (image) => {
    const href = image.getAttribute('href');
    if (href && !href.startsWith('data:')) image.setAttribute('href', await toDataUrl(new URL(href, document.baseURI).href));
  }));
  const faces = await Promise.all(
    fonts.map(async (f) => {
      const data = await toDataUrl(f.url);
      return `@font-face{font-family:"${f.family}";src:url(${data}) format("${f.format ?? 'woff2'}");font-weight:${f.weight ?? 400};}`;
    }),
  );
  if (faces.length) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = faces.join('');
    clone.insertBefore(style, clone.firstChild);
  }
  const { width, height } = svg.viewBox.baseVal;
  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);
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
  if (!(width > 0 && height > 0)) throw new RangeError('Plate size must be positive.');
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
