/** Self-contained so Playwright or a browser review page can run the same extractor. */
export default async function extractAuditRuns() {
  const root = document.querySelector('svg');
  const inverse = root.getCTM().inverse(), counts = {}, runs = [], scale = 4;
  const viewWidth = root.viewBox.baseVal.width, viewHeight = root.viewBox.baseVal.height;
  const width = Math.ceil(viewWidth * scale), height = Math.ceil(viewHeight * scale);
  const offsetX = (width - viewWidth * scale) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  const raster = async (copy, matrix) => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewWidth} ${viewHeight}"><g transform="matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})">${copy.outerHTML}</g></svg>`;
    const image = new Image();
    image.src = 'data:image/svg+xml;base64,' + btoa(source);
    await image.decode();
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
  };
  const paintedBox = () => {
    const pixels = context.getImageData(0, 0, width, height).data;
    let left = width, top = height, right = -1, bottom = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > 127) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    return right < 0 ? null : [(left - offsetX) / scale, top / scale, (right + 1 - offsetX) / scale, (bottom + 1) / scale];
  };
  for (const element of root.querySelectorAll('[data-die]')) {
    const role = element.getAttribute('data-role'), index = counts[role] ?? 0;
    counts[role] = index + 1;
    const chars = [...element.querySelectorAll('[data-character]')].map((glyph, index) => {
      const b = glyph.getBBox(), matrix = inverse.multiply(glyph.getCTM());
      const points = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
      return {index, char: glyph.getAttribute('data-character'), geometryBox: [Math.min(...points.map(p => p.x)), Math.min(...points.map(p => p.y)), Math.max(...points.map(p => p.x)), Math.max(...points.map(p => p.y))]};
    });
    const copy = element.cloneNode(true);
    copy.removeAttribute('transform');
    for (const attribute of ['fill', 'stroke']) for (const element of [copy, ...copy.querySelectorAll(`[${attribute}]`)]) {
      const value = element.getAttribute(attribute);
      if (value && value !== 'none' && value !== 'transparent') element.setAttribute(attribute, 'black');
    }
    const matrix = inverse.multiply(element.getCTM());
    await raster(copy, matrix);
    const png = canvas.toDataURL().split(',')[1];
    const glyphCopies = [...copy.querySelectorAll('[data-character]')];
    for (let selected = 0; selected < glyphCopies.length; selected++) {
      glyphCopies.forEach((glyph, index) => { glyph.style.display = index === selected ? '' : 'none'; });
      await raster(copy, matrix);
      chars[selected].inkBox = paintedBox();
      chars[selected].inkClipped = chars[selected].inkBox !== null &&
        (chars[selected].inkBox[0] <= 0 || chars[selected].inkBox[1] <= 0 || chars[selected].inkBox[2] >= viewWidth || chars[selected].inkBox[3] >= viewHeight);
    }
    runs.push({role, index, text: element.getAttribute('aria-label'), profile: element.getAttribute('data-die').replace('bc-decal-print-', ''),
      chars, png, viewWidth, inkBoundsMethod: 'Isolated actual glyph alpha > 127 at 4 pixels per SVG unit, including fill and stroke; getBBox is recorded separately as geometry only', inkBoundsResolution: 1 / scale});
  }
  return runs;
}
