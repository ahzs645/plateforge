import json, numpy as np, os
from PIL import Image
from scipy import ndimage
import sys
REF = sys.argv[1] if len(sys.argv) > 1 else '.cache/ref'
# Reuse the colour and trimming helpers from extract.py (without running its photo loop).
exec(open('extract.py').read().split("acc = {}")[0])
acc = {}
text = 'BRITISH51COLUMBIA'
srcs = [('1951-Tab(long).jpg', (0, 1)), ('1951-Tab(short).jpg', (0, 1)), ('1951Strip.jpg', (0, 1)), ('1951-217639.jpg', (0.69, 0.95))]
for fn, (y0, y1) in srcs:
    im = np.asarray(Image.open(f'{REF}/{fn}').convert('RGB')).astype(float)
    H0 = im.shape[0]; im = im[int(H0 * y0):int(H0 * y1)]
    H, W, _ = im.shape
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    blue = (b - r)
    # Soft ink: how far the pixel leans blue, scaled between face and ink levels.
    lo, hi = np.percentile(blue, 40), np.percentile(blue, 97)
    t = np.clip((blue - lo) / (hi - lo), 0, 1)
    lab, n = ndimage.label(t > 0.5)
    cs = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        hh = (sl[0].stop - sl[0].start) / H; ww = (sl[1].stop - sl[1].start) / W
        if 0.3 < hh < 0.8 and ww < 0.1 and sl[1].start / W > 0.02 and sl[1].stop / W < 0.99: cs.append((sl, i))
    cs.sort(key=lambda c: c[0][1].start)
    print(fn, len(cs))
    if len(cs) != len(text): continue
    for ch, (sl, i) in zip(text, cs):
        soft = t[sl] * ndimage.binary_dilation(lab[sl] == i, iterations=1)
        h, w = soft.shape; s = CAN / h; nw = max(1, int(round(w * s)))
        gimg = np.asarray(Image.fromarray((soft * 255).astype(np.uint8)).resize((nw, CAN), Image.BILINEAR)).astype(float) / 255
        canvas = np.zeros((CAN, CAN * 2)); x0 = (CAN * 2 - nw) // 2; canvas[:, x0:x0 + nw] = gimg
        a = acc.setdefault(ch, [0, 0]); a[0] = a[0] + canvas; a[1] += 1
for ch, (s, n) in acc.items():
    mean = s / n; cols = np.where(mean.max(0) > 0.25)[0]; mean = mean[:, cols.min():cols.max() + 1]
    Image.fromarray((255 - mean * 255).astype(np.uint8)).save(f'out/strip-all-{ch}.png')
json.dump({c: n for c, (s, n) in acc.items()}, open('out/strip-counts.json', 'w'))
print({c: n for c, (s, n) in acc.items()})
