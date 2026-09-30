import json
import numpy as np
from PIL import Image
from scipy import ndimage
import sys
REF = sys.argv[1] if len(sys.argv) > 1 else '.cache/ref'
# Reuse the colour and trimming helpers from extract.py (without running its photo loop).
exec(open('extract.py').read().split("acc = {}")[0])
acc = {}
for fn in ['1953-Tab.jpg', '1953-148879.jpg', '1953-349016.jpg', '1953-217791.jpg', '1954-Tab.jpg', '1954-306142.jpg', '1954-351154.jpg', '1954-351016.jpg']:
    yy = fn[2:4]
    im = np.asarray(Image.open(f'{REF}/{fn}').convert('RGB')).astype(float); H, W, _ = im.shape
    reg = im[int(H * .08):int(H * .42), int(W * .06):int(W * .9)]
    bg, ink, frac = two_colours(reg.reshape(-1, 3)[::2])
    v = ink - bg; t = np.clip(((im - bg) @ v) / (v @ v), 0, 1)
    band = np.zeros((H, W), bool); band[int(H * .08):int(H * .42), int(W * .06):int(W * .9)] = (t > 0.5)[int(H * .08):int(H * .42), int(W * .06):int(W * .9)]
    lab, n = ndimage.label(band)
    cs = [(sl, i) for i, sl in enumerate(ndimage.find_objects(lab), 1) if 0.15 < (sl[0].stop - sl[0].start) / H < 0.3 and (sl[1].stop - sl[1].start) / W > 0.1]
    cs.sort(key=lambda c: c[0][1].start)
    print(fn, len(cs), 'ink frac %.2f' % frac)
    if len(cs) != 2: continue
    for ch, (sl, i) in zip(yy, cs):
        soft = t[sl] * ndimage.binary_dilation(lab[sl] == i, iterations=1)
        h, w = soft.shape; nw = max(1, int(round(w * CAN / h)))
        g = np.asarray(Image.fromarray((soft * 255).astype(np.uint8)).resize((nw, CAN), Image.BILINEAR)).astype(float) / 255
        canvas = np.zeros((CAN, CAN * 2)); x0 = (CAN * 2 - nw) // 2; canvas[:, x0:x0 + nw] = g
        a = acc.setdefault(ch, [0, 0]); a[0] = a[0] + canvas; a[1] += 1
for ch, (s, n) in acc.items():
    mean = s / n; cols = np.where(mean.max(0) > 0.25)[0]; mean = mean[:, cols.min():cols.max() + 1]
    Image.fromarray((255 - mean * 255).astype(np.uint8)).save(f'out/tab-all-{ch}.png')
json.dump({c: n for c, (s, n) in acc.items()}, open('out/tab-counts.json', 'w'))
print({c: n for c, (s, n) in acc.items()})
