"""Median layout of the 1924–39 annual plates, per die family: where the serial, the legend and the date sit
(fractions of the trimmed plate width/height), from the same photos series.py uses."""
import json, sys, statistics as st
import numpy as np
from PIL import Image
from scipy import ndimage
exec(open('extract.py').read().split("acc = {}")[0].replace("SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'", "pass"))
def comps(b, H, W, r0, r1, c0, c1, minh, maxh, minw=0.012, ratio=0.06):
    band = np.zeros_like(b); band[int(H*r0):int(H*r1), int(W*c0):int(W*c1)] = b[int(H*r0):int(H*r1), int(W*c0):int(W*c1)]
    lab, n = ndimage.label(band); out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        hh = (sl[0].stop - sl[0].start) / H; ww = (sl[1].stop - sl[1].start) / W
        if minh <= hh <= maxh and minw <= ww < 0.2 and ww / hh >= ratio and sl[1].start / W > 0.03: out.append(sl)
    return sorted(out, key=lambda s: s[1].start)
for name in sys.argv[1:]:
    cfg = json.load(open(f'series/{name}.json')); r0, r1, c0, c1 = cfg['band']
    rows = {}
    for item in cfg['photos']:
        im = trim(load(item['file'], 1200)); H, W, _ = im.shape
        if W / H < 1.7: continue
        inner = im[int(H*.1):int(H*.9), int(W*.05):int(W*.95)].reshape(-1, 3).astype(float)
        bg, ink, _ = two_colours(inner[::3]); v = ink - bg
        t = np.clip(((im.astype(float) - bg) @ v) / (v @ v), 0, 1); b = t > 0.5
        s = comps(b, H, W, r0, r1, c0, c1, 0.3, 0.8)
        leg = comps(b, H, W, 0.7, 0.98, 0.02, 0.98, 0.08, 0.3, 0.003, 0.015)
        if len(s) != len(item['text']) or len(leg) != 15: continue
        r = rows.setdefault(len(item['text']), [])
        r.append({'aspect': W / H, 'sx0': s[0][1].start / W, 'sx1': s[-1][1].stop / W, 'stop': min(x[0].start for x in s) / H, 'sbot': max(x[0].stop for x in s) / H,
                  'lx0': leg[0][1].start / W, 'lx1': leg[-1][1].stop / W, 'ltop': min(x[0].start for x in leg) / H, 'lbot': max(x[0].stop for x in leg) / H})
    print('==', name)
    for n, rs in sorted(rows.items()):
        med = {k: round(st.median(r[k] for r in rs), 3) for k in rs[0]}
        print(f'  {n} chars ({len(rs)} plates):', med)
