"""Per-sample digit features by year, to test whether 1940–54 splits into die eras."""
import glob, os, re, json, collections
import numpy as np
from PIL import Image
from scipy import ndimage
exec(open('extract.py').read().split("acc = {}")[0])
rows = []
N = 48  # normalised glyph bitmap size
for fn in sorted(glob.glob('.cache/plates/19[45]?-*.jpg')):
    m = re.match(r'(\d{4})-([0-9A-Z]+)\.jpg', os.path.basename(fn))
    year, serial = int(m.group(1)), m.group(2)
    if year > 1954 or set(serial) == {'0'}: continue
    im = np.asarray(Image.open(fn).convert('RGB'))
    if im.shape[0] < 90: continue
    im = trim(im); H, W, _ = im.shape
    inner = im[int(H*.08):int(H*.92), int(W*.03):int(W*.97)].reshape(-1, 3).astype(float)
    bg, ink, frac = two_colours(inner[::3]); v = ink - bg
    if np.linalg.norm(v) < 60: continue
    t = np.clip(((im.astype(float) - bg) @ v) / (v @ v), 0, 1); b = t > 0.5
    band = np.zeros_like(b); band[int(H*.06):int(H*.74), int(W*.015):int(W*.905)] = b[int(H*.06):int(H*.74), int(W*.015):int(W*.905)]
    lab, n = ndimage.label(band)
    cs = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        hh = (sl[0].stop-sl[0].start)/H; ww = (sl[1].stop-sl[1].start)/W; x0 = sl[1].start/W
        if x0 < 0.022 or sl[1].stop/W > 0.992 or (hh > 0.28 and (ww < 0.018 or ww/hh < 0.08)): continue
        if 0.3 <= hh <= 0.75 and ww < 0.2 and (lab[sl] == i).sum() > 20: cs.append((sl, i))
    cs.sort(key=lambda c: c[0][1].start)
    if len(cs) != len(serial): continue
    for ch, (sl, i) in zip(serial, cs):
        if not ch.isdigit(): continue
        g = (lab[sl] == i)
        h, w = g.shape
        # Aspect uses plate-relative mm: plate height is 137–140 mm in every year.
        norm = np.asarray(Image.fromarray((g*255).astype(np.uint8)).resize((N, N), Image.BILINEAR)) > 127
        rows.append({'year': year, 'ch': ch, 'aspect': w / h, 'height': h / H, 'fill': float(g.mean()), 'bmp': norm})
print('digit samples', len(rows))
by_year = collections.defaultdict(list)
for r in rows: by_year[r['year']].append(r)
print('year  n  aspect(W/H)  fill  cap/plate-height')
for y in sorted(by_year):
    rs = by_year[y]
    print(y, len(rs), '%.3f' % np.median([r['aspect'] for r in rs if r['ch'] != '1']), '%.3f' % np.median([r['fill'] for r in rs]), '%.3f' % np.median([r['height'] for r in rs]))
# Shape: per digit, correlate each sample with the per-era mean (leave-one-out) -> which era mean fits best?
eras = {'1940-48': range(1940, 1949), '1949-51': range(1949, 1952), '1952-54': range(1952, 1955)}
era_of = lambda y: next(k for k, r in eras.items() if y in r)
means = {}
for d in '0123456789':
    for e in eras:
        s = [r['bmp'].astype(float) for r in rows if r['ch'] == d and era_of(r['year']) == e]
        if len(s) >= 3: means[(d, e)] = (np.sum(s, 0), len(s))
conf = collections.Counter()
for r in rows:
    e0 = era_of(r['year']); best = None
    for e in eras:
        if (r['ch'], e) not in means: continue
        s, n = means[(r['ch'], e)]
        if e == e0: s, n = s - r['bmp'], n - 1
        if n < 2: continue
        mu = s / n
        score = -np.abs(mu - r['bmp']).mean()
        if best is None or score > best[0]: best = (score, e)
    if best: conf[(e0, best[1])] += 1
print('\nnearest-era-mean classification (rows = actual era, cols = best-matching era mean)')
print('actual     ', '  '.join(eras))
for e in eras:
    tot = sum(conf[(e, f)] for f in eras)
    print(e, '   ', '  '.join('%7s' % f"{conf[(e, f)]}/{tot}" for f in eras))
