"""Trace the averaged glyph bitmaps into filled outlines in die units (cap height 100, baseline y = 100)."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage
import potrace

def trace(png, thresh=0.5, sigma=2.0):
    a = 1 - np.asarray(Image.open(png).convert('L')).astype(float) / 255   # 1 = ink
    a = ndimage.gaussian_filter(a, sigma)
    ink = a > thresh
    # Shave averaging flares (emboss highlights at the glyph ends) without eroding the strokes.
    yy, xx = np.mgrid[-4:5, -4:5]
    ink = ndimage.binary_opening(ink, structure=(xx ** 2 + yy ** 2) <= 16)
    ink = ndimage.binary_closing(ink, structure=(xx ** 2 + yy ** 2) <= 9)
    # Keep the main shapes only (averaging ghosts from neighbours are faint and small).
    lab, n = ndimage.label(ink)
    if n > 1:
        sizes = ndimage.sum(ink, lab, range(1, n + 1))
        ink = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * 0.06])
    # Fill pinholes left by wear and highlights; real counters (B, O, A…) are far larger.
    holes = ndimage.binary_fill_holes(ink) & ~ink
    hl, hn = ndimage.label(holes)
    if hn:
        hs = ndimage.sum(holes, hl, range(1, hn + 1))
        ink |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s < ink.sum() * 0.015])
    rows = np.where(ink.any(1))[0]; cols = np.where(ink.any(0))[0]
    ink = ink[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
    h, w = ink.shape
    k = 100 / h
    # potracer fills the False pixels, so trace the inverse, padded so the glyph never touches the edge.
    padded = np.pad(ink, 4)
    path = potrace.Bitmap(~padded).trace(turdsize=40, alphamax=1.15, opticurve=True, opttolerance=0.6)
    f = lambda p: f'{(p.x - 4) * k:.1f} {(p.y - 4) * k:.1f}'
    d = []
    for curve in path:
        d.append(f'M{f(curve.start_point)}')
        for seg in curve.segments:
            d.append(f'L{f(seg.c)} L{f(seg.end_point)}' if seg.is_corner else f'C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}')
        d.append('Z')
    return {'advance': round(w * k, 1), 'd': ' '.join(d)}

sets = json.loads(sys.argv[1])
out = {}
for name, spec in sets.items():
    prefix, chars, *rest = spec
    out[name] = {c: trace(f'out/{prefix}-{"dot" if c == "·" else c}.png', sigma=rest[0] if rest else 2.0) for c in chars}
json.dump(out, open("out/traced.json", "w"), indent=1)
for name, g in out.items(): print(name, {c: v['advance'] for c, v in g.items()})
