"""Date stamps, 1924–39: each year's two date digits were struck with their own small dies, not the serial's.
1924–35 put the date at the right of the serial ("-24" … "-35"); 1936–39 stack the two digits at the far right.
Writes out/date-<year>-<digit>.png averages, out/date-counts.json and out/dates-chart.png (the sharpest real crop
of each year's date, like the BCpl8s die charts)."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/dates'
exec(open('extract.py').read().split("acc = {}")[0].replace("SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'", "pass"))
acc, crops, used = {}, {}, {}
for year, serial, fn in best_photos(f'{SRC}/19[23]?-*.jpg'):
    if not 1924 <= year <= 1939: continue
    yy = str(year)[2:]; stacked = year >= 1936
    full = np.asarray(Image.open(fn).convert('RGB'))
    im = load(fn, 1600); im = trim(im); k = full.shape[1] / im.shape[1]
    H, W, _ = im.shape
    if W / H < 1.7: continue   # street and document photos
    inner = im[int(H*.1):int(H*.9), int(W*.05):int(W*.95)].reshape(-1, 3).astype(float)
    bg, ink, _ = two_colours(inner[::3]); v = ink - bg
    if np.linalg.norm(v) < 50: continue
    t = np.clip(((im.astype(float) - bg) @ v) / (v @ v), 0, 1); b = t > 0.5
    r0, r1, c0, c1 = (0.06, 0.8, 0.86, 0.985) if stacked else (0.06, 0.78, 0.74, 0.985)
    band = np.zeros_like(b); band[int(H*r0):int(H*r1), int(W*c0):int(W*c1)] = b[int(H*r0):int(H*r1), int(W*c0):int(W*c1)]
    lab, n = ndimage.label(band); cs = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        hh = (sl[0].stop - sl[0].start) / H; ww = (sl[1].stop - sl[1].start) / W
        # Date digits are small (about 0.12–0.33 of the plate height); serial digits and rims are taller, dashes shorter.
        aspect = (sl[1].stop - sl[1].start) / (sl[0].stop - sl[0].start)
        # …and at least a quarter as wide as tall in pixels, which drops rim and bolt-hole fragments.
        if 0.11 <= hh <= 0.36 and 0.008 <= ww <= 0.12 and aspect >= 0.25 and sl[1].stop / W < 0.99: cs.append((sl, i))
    cs.sort(key=(lambda c: c[0][0].start) if stacked else (lambda c: c[0][1].start))
    # Keep only a matched pair: the two date digits share a height, and (side-by-side dates) sit right of the serial.
    if not stacked: cs = [c for c in cs if c[0][1].start / W >= 0.79]
    if len(cs) != 2: continue
    h1, h2 = (c[0][0].stop - c[0][0].start for c in cs)
    if not 0.8 <= h1 / h2 <= 1.25: continue
    # Side-by-side dates sit level with each other, around mid-height (rim fragments hug the top edge).
    if not stacked:
        tops = [c[0][0].start / H for c in cs]; mids = [(c[0][0].start + c[0][0].stop) / 2 / H for c in cs]
        if abs(tops[0] - tops[1]) > 0.06 or not all(0.2 <= m <= 0.65 for m in mids): continue
    used[fn] = year
    for ch, (sl, i) in zip(yy, cs):
        mask = lab[sl] == i
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        px, py = int((y1 - y0) * 0.08), int((y1 - y0) * 0.1)
        score = (y1 - y0) * k
        box = [int(max(0, x0 - px) * k), int(max(0, y0 - py) * k), int(min(W, x1 + px) * k), int(min(H, y1 + py) * k)]
        key = (year, ch)
        if key not in crops or score > crops[key][0]: crops[key] = (score, Image.fromarray(full).crop(box), f'{serial[:-3]}-{serial[-3:]}' if len(serial) > 3 else serial)
        soft = t[sl] * ndimage.binary_dilation(mask, iterations=1)
        h, w = soft.shape; nw = max(1, int(round(w * CAN / h)))
        g = np.asarray(Image.fromarray((soft * 255).astype(np.uint8)).resize((nw, CAN), Image.BILINEAR)).astype(float) / 255
        canvas = np.zeros((CAN, CAN * 2)); xo = (CAN * 2 - nw) // 2; canvas[:, xo:xo + nw] = g
        a = acc.setdefault(key, [0, 0]); a[0] = a[0] + canvas; a[1] += 1
os.makedirs('out', exist_ok=True)
counts = {}
for (year, ch), (s, n) in acc.items():
    mean = s / n; cols = np.where(mean.max(0) > 0.25)[0]; mean = mean[:, cols.min():cols.max() + 1]
    Image.fromarray((255 - mean * 255).astype(np.uint8)).save(f'out/date-{year}-{ch}.png')
    counts.setdefault(str(year), {})[ch] = n
json.dump(counts, open('out/date-counts.json', 'w'), indent=1, sort_keys=True)
print('plates used per year', {y: sum(1 for v in used.values() if v == y) for y in range(1924, 1940)})
# Chart: one row of tiles, each year's two digits side by side.
TH = 150; font = ImageFont.load_default(size=15); title = ImageFont.load_default(size=26)
years = [y for y in range(1924, 1940)]
tiles = []
for y in years:
    pair = []
    for ch in str(y)[2:]:
        c = crops.get((y, ch))
        pair.append(c[1].resize((max(1, round(c[1].width * TH / c[1].height)), TH), Image.LANCZOS) if c else Image.new('RGB', (60, TH), (225, 225, 225)))
    tiles.append((y, pair))
per_row = 8; gap = 14; top = 52; lab_h = 28
rows = [tiles[i:i + per_row] for i in range(0, len(tiles), per_row)]
W = max(sum(sum(im.width for im in p) + 4 + gap for _, p in r) for r in rows) + gap
chart = Image.new('RGB', (W, top + len(rows) * (TH + lab_h + 10)), 'white'); d = ImageDraw.Draw(chart)
d.rectangle([0, 0, W, top - 12], fill=(238, 238, 238))
d.text((W // 2, (top - 12) // 2), 'British Columbia date stamps, 1924-1939', fill=(20, 45, 90), anchor='mm', font=title)
for r, row in enumerate(rows):
    x = gap; y0 = top + r * (TH + lab_h + 10)
    for year, pair in row:
        x0 = x
        for im in pair: chart.paste(im, (x, y0)); x += im.width + 4
        d.text(((x0 + x) // 2, y0 + TH + 14), str(year), fill=(80, 80, 80), anchor='mm', font=font)
        x += gap
chart.save('out/dates-chart.png')
print('counts', json.dumps(counts))
