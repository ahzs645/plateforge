"""Average labelled glyphs from BCpl8s 1940–54 passenger photos and trace them to outlines.
Photos are references only; nothing here is bundled. Output: per-character mean bitmaps + traced SVG paths."""
import glob, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'
OUT = 'out'; os.makedirs(OUT, exist_ok=True)
CAN = 256  # canvas height (cap) for averaging
eras = {'1940-48': range(1940, 1949), '1949-51': range(1949, 1952), '1952-54': range(1952, 1955)}

def two_colours(px):
    # 2-means on RGB
    c = np.array([px.min(0), px.max(0)], float)
    for _ in range(12):
        d = ((px[:, None, :] - c[None]) ** 2).sum(2)
        lab = d.argmin(1)
        for k in range(2):
            if (lab == k).any(): c[k] = px[lab == k].mean(0)
    frac = [(lab == k).mean() for k in range(2)]
    ink = int(np.argmin(frac))
    return c[1 - ink], c[ink], min(frac)

def trim(im):
    """Drop a uniform photo background around the plate (white/grey margins)."""
    a = im.astype(float); h, w, _ = a.shape
    frame = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(frame, 0)
    diff = np.abs(a - bg).sum(2) > 60
    rows = np.where(diff.mean(1) > 0.5)[0]; cols = np.where(diff.mean(0) > 0.5)[0]
    if len(rows) < h * 0.6 or len(cols) < w * 0.6: return im
    return im[rows.min():rows.max() + 1, cols.min():cols.max() + 1]


NAME = re.compile(r'(\d{4})-([0-9A-Z]+?)(?:\(XL\)\d?|XL)?\.jpg$')
def best_photos(pattern):
    """One file per plate (year, serial): the largest copy, usually the linked "(XL)" photo."""
    best = {}
    for fn in glob.glob(pattern):
        m = NAME.match(os.path.basename(fn))
        if not m: continue
        key = (int(m.group(1)), m.group(2))
        size = Image.open(fn).size
        if key not in best or size[0] > best[key][1][0]: best[key] = (fn, size)
    return sorted((k[0], k[1], v[0]) for k, v in best.items())
def load(fn, max_w=1200):
    im = Image.open(fn).convert('RGB')
    if im.width > max_w: im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    return np.asarray(im)

acc = {}   # (set, era, char) -> [sum, count, widths]
log = []
def add(kind, era, ch, soft):
    h, w = soft.shape
    s = CAN / h
    nw = max(1, int(round(w * s)))
    g = np.asarray(Image.fromarray((soft * 255).astype(np.uint8)).resize((nw, CAN), Image.BILINEAR)).astype(float) / 255
    W = CAN * 2
    canvas = np.zeros((CAN, W)); x0 = (W - nw) // 2
    if nw > W: return
    canvas[:, x0:x0 + nw] = g
    for e in (era, 'all'):
        k = (kind, e, ch)
        if k not in acc: acc[k] = [np.zeros_like(canvas), 0, []]
        acc[k][0] += canvas; acc[k][1] += 1; acc[k][2].append(w / h)

for year, serial, fn in best_photos(f'{SRC}/19[45]?-*.jpg'):
    if year > 1954 or set(serial) == {'0'}: continue
    era = next(k for k, r in eras.items() if year in r)
    im = load(fn)
    if im.shape[0] < 90: continue
    im = trim(im); H, W, _ = im.shape
    inner = im[int(H * .08):int(H * .92), int(W * .03):int(W * .97)].reshape(-1, 3).astype(float)
    bg, ink, frac = two_colours(inner[::3])
    v = ink - bg
    if np.linalg.norm(v) < 60: log.append((fn, 'low contrast')); continue
    t = np.clip(((im.astype(float) - bg) @ v) / (v @ v), 0, 1)
    binary = t > 0.5
    # Serial band.
    def comps(r0, r1, c0, c1, minh, maxh):
        band = np.zeros_like(binary); band[int(H * r0):int(H * r1), int(W * c0):int(W * c1)] = binary[int(H * r0):int(H * r1), int(W * c0):int(W * c1)]
        lab, n = ndimage.label(band)
        out = []
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            hh = (sl[0].stop - sl[0].start) / H; ww = (sl[1].stop - sl[1].start) / W
            x0 = sl[1].start / W
            # Skip rim slivers along the plate edge (thin, hugging the left or right border).
            if x0 < 0.022 or sl[1].stop / W > 0.992 or (hh > 0.28 and (ww < 0.018 or ww / hh < 0.08)): continue
            if minh <= hh <= maxh and ww < 0.2 and (lab[sl] == i).sum() > 20: out.append((sl, i))
        return sorted(out, key=lambda o: o[0][1].start), lab
    serial_comps, lab = comps(0.06, 0.74, 0.015, 0.905, 0.30, 0.75)
    if len(serial_comps) == len(serial):
        for ch, (sl, i) in zip(serial, serial_comps):
            mask = ndimage.binary_dilation(lab[sl] == i, iterations=1)
            add('serial', era, ch, t[sl] * mask)
        log.append((fn, 'serial ok'))
    else:
        log.append((fn, f'serial {len(serial_comps)} != {len(serial)}'))
    # Stacked year at the right of 1940–51 bases (1951 keeps its 1950 base): two digits, top then bottom.
    if year <= 1951:
        yy = str(1950 if year == 1951 else year)[2:]
        yc, lab3 = comps(0.06, 0.74, 0.88, 0.998, 0.14, 0.34)
        yc = [c for c in yc if c[0][1].start / W > 0.88]
        if len(yc) == 2:
            for ch, (sl, i) in zip(yy, sorted(yc, key=lambda c: c[0][0].start)):
                add('year', era, ch, t[sl] * ndimage.binary_dilation(lab3[sl] == i, iterations=1))
    # 52 at the top right of the 1952 base (1953/54 photos show a tab there instead).
    if year == 1952:
        yc, lab4 = comps(0.04, 0.45, 0.74, 0.985, 0.14, 0.36)
        if len(yc) == 2:
            for ch, (sl, i) in zip('52', yc):
                add('year52', era, ch, t[sl] * ndimage.binary_dilation(lab4[sl] == i, iterations=1))
    legend = 'BRITISHCOLUMBIA'
    leg, lab2 = comps(0.66, 0.97, 0.015, 0.985 if year < 1952 else 0.76, 0.08, 0.26)
    if len(leg) == len(legend):
        for ch, (sl, i) in zip(legend, leg):
            mask = ndimage.binary_dilation(lab2[sl] == i, iterations=1)
            add('legend', era, ch, t[sl] * mask)

summary = {}
for (kind, era, ch), (s, n, ws) in sorted(acc.items()):
    mean = s / n
    cols = np.where(mean.max(0) > 0.25)[0]
    mean = mean[:, cols.min():cols.max() + 1] if len(cols) else mean
    Image.fromarray((255 - mean * 255).astype(np.uint8)).save(f'{OUT}/{kind}-{era}-{"dot" if ch == "·" else ch}.png')
    summary.setdefault(kind, {}).setdefault(era, {})[ch] = {'n': n, 'aspect': float(np.median(ws))}
json.dump({'summary': summary, 'log': log}, open(f'{OUT}/summary.json', 'w'), indent=1)
ok = sum(1 for _, s in log if s == 'serial ok')
print('photos used for serial:', ok, 'of', len(log))
for kind in summary:
    for era in summary[kind]:
        print(kind, era, ' '.join(f"{c}:{d['n']}" for c, d in sorted(summary[kind][era].items())))
