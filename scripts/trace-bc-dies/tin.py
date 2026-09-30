"""1915–17 lithographed tin: average the serial and year digits per maker.
MacDonald Manufacturing made 1915 and 1916 up to No. 9,000; J.R. Tacey & Sons made the late-1916
over-run (Nos. 9,001–9,342) and 1917 (BCpl8s, Passenger 1915–1917)."""
import glob, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage
SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/tin'
exec(open('extract.py').read().split("acc = {}")[0].replace("SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'", "pass"))
acc = {}; used = {}
def maker(year, n): return 'macdonald' if year == 1915 or (year == 1916 and n <= 9000) else 'tacey'
def add(kind, ch, soft):
    h, w = soft.shape; nw = max(1, int(round(w * CAN / h)))
    g = np.asarray(Image.fromarray((soft * 255).astype(np.uint8)).resize((nw, CAN), Image.BILINEAR)).astype(float) / 255
    canvas = np.zeros((CAN, CAN * 2)); x0 = (CAN * 2 - nw) // 2
    if nw > CAN * 2: return
    canvas[:, x0:x0 + nw] = g
    a = acc.setdefault((kind, ch), [0, 0]); a[0] = a[0] + canvas; a[1] += 1
for year, serial, fn in best_photos(f'{SRC}/191[567]-*.jpg'):
    if not serial.isdigit(): continue
    im = load(fn)
    if im.shape[0] < 80 or im.shape[1] / im.shape[0] < 1.6: continue   # skip street photos
    im = trim(im); H, W, _ = im.shape
    inner = im[int(H*.08):int(H*.92), int(W*.25):int(W*.97)].reshape(-1, 3).astype(float)
    bg, ink, frac = two_colours(inner[::3]); v = ink - bg
    if np.linalg.norm(v) < 50: continue
    t = np.clip(((im.astype(float) - bg) @ v) / (v @ v), 0, 1); b = t > 0.5
    def comps(r0, r1, c0, c1, minh, maxh, minw=0.012):
        band = np.zeros_like(b); band[int(H*r0):int(H*r1), int(W*c0):int(W*c1)] = b[int(H*r0):int(H*r1), int(W*c0):int(W*c1)]
        lab, n = ndimage.label(band); out = []
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            hh = (sl[0].stop-sl[0].start)/H; ww = (sl[1].stop-sl[1].start)/W
            if minh <= hh <= maxh and minw <= ww < 0.2 and sl[1].start/W > 0.01 and sl[1].stop/W < 0.995: out.append((sl, i))
        return sorted(out, key=lambda o: o[0][1].start), lab
    mk = maker(year, int(serial))
    cs, lab = comps(0.03, 0.98, 0.22, 0.995, 0.5, 0.95)
    if len(cs) == len(serial):
        for ch, (sl, i) in zip(serial, cs): add(f'serial-{mk}', ch, t[sl] * ndimage.binary_dilation(lab[sl] == i, iterations=1))
        used[fn] = mk
    yc, lab2 = comps(0.55, 0.99, 0.01, 0.26, 0.12, 0.42, 0.01)
    if len(yc) == 4:
        for ch, (sl, i) in zip(str(year), yc): add(f'year-{mk}', ch, t[sl] * ndimage.binary_dilation(lab2[sl] == i, iterations=1))
os.makedirs('out', exist_ok=True)
counts = {}
for (kind, ch), (s, n) in acc.items():
    mean = s / n; cols = np.where(mean.max(0) > 0.25)[0]; mean = mean[:, cols.min():cols.max() + 1]
    Image.fromarray((255 - mean * 255).astype(np.uint8)).save(f'out/{kind}-{ch}.png')
    counts.setdefault(kind, {})[ch] = n
json.dump(counts, open('out/tin-counts.json', 'w'), indent=1)
print('plates used', len(used), {k: sum(1 for v in used.values() if v == k) for k in ('macdonald', 'tacey')})
for k, v in sorted(counts.items()): print(k, dict(sorted(v.items())))
