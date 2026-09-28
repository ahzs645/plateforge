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

export async function svgToPngBlob(svgText: string, width: number, height: number, scale = 3): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
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
