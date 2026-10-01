"""Die-type chart and traced die for one plate series from a handful of labelled photos.

Usage: python3 series.py series/1930.json
The JSON names the photos (with the text each shows), the band holding the serial and the output names.
"chartOnly": true skips the averages, for series whose dies are averaged elsewhere (tin.py, extract.py).
Writes out/<name>-chart.png (the sharpest real crop of each digit, like BCpl8s's "Die Types (0-9)" charts)
and out/<name>-<char>.png averages for vectorize.py."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
exec(open('extract.py').read().split("acc = {}")[0].replace("SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'", "pass"))

cfg = json.load(open(sys.argv[1]))
name = cfg['name']
# The serial (text per photo) and optional fixed-text sets such as the legend, each with its own band.
SETS = [{'kind': 'serial', 'band': cfg['band'], 'height': cfg.get('height', [0.3, 0.8]), **cfg.get('serial', {})}] + cfg.get('extra', [])
os.makedirs('out', exist_ok=True)
crops, acc = {}, {}
def label(item):
    return item.get('label') or (item['text'][:-3] + '-' + item['text'][-3:] if len(item['text']) > 3 else item['text'])
# Fetch any photo not cached yet (references only; the cache is git-ignored).
import time, urllib.request
for item in cfg['photos']:
    if not os.path.exists(item['file']) and item.get('url'):
        os.makedirs(os.path.dirname(item['file']), exist_ok=True)
        req = urllib.request.Request(item['url'], headers={'User-Agent': 'PlateForge die research (https://github.com/ahzs645/plateforge)'})
        open(item['file'], 'wb').write(urllib.request.urlopen(req, timeout=30).read()); time.sleep(0.3)
for item, spec in [(item, spec) for item in cfg['photos'] for spec in SETS]:
    fn = item['file']; kind = spec['kind']; text = item['text'] if kind == 'serial' else spec['text']
    r0, r1, c0, c1 = spec['band']; minh, maxh = spec['height']
    full = np.asarray(Image.open(fn).convert('RGB'))
    im = load(fn, 1600); k = full.shape[1] / im.shape[1]
    H, W, _ = im.shape
    inner = im[int(H * .1):int(H * .9), int(W * .05):int(W * .95)].reshape(-1, 3).astype(float)
    bg, ink, _ = two_colours(inner[::3]); v = ink - bg
    t = np.clip(((im.astype(float) - bg) @ v) / (v @ v), 0, 1); b = t > 0.5
    band = np.zeros_like(b); band[int(H*r0):int(H*r1), int(W*c0):int(W*c1)] = b[int(H*r0):int(H*r1), int(W*c0):int(W*c1)]
    lab, n = ndimage.label(band)
    cs = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        hh = (sl[0].stop - sl[0].start) / H; ww = (sl[1].stop - sl[1].start) / W
        # Skip rim slivers hugging the left edge and anything too thin to be a figure.
        if minh <= hh <= maxh and spec.get('minw', 0.012) <= ww < 0.2 and ww / hh >= spec.get('ratio', 0.06) and sl[1].start / W > 0.03 and sl[1].stop / W <= spec.get('maxRight', 1.0): cs.append((sl, i))
    cs.sort(key=lambda c: c[0][1].start)
    print(os.path.basename(fn), kind, text, 'found', len(cs))
    if len(cs) != len(text): continue
    for ch, (sl, i) in zip(text, cs):
        mask = lab[sl] == i
        # Sharpness: contrast between ink and ground inside the box, times resolution.
        score = (sl[0].stop - sl[0].start) * k * float(np.abs(t[sl][mask].mean() - t[sl][~mask].mean()) if (~mask).any() else 1)
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        px, py = int((y1 - y0) * 0.04), int((y1 - y0) * 0.08)
        box = [int(max(0, x0 - px) * k), int(max(0, y0 - py) * k), int(min(W, x1 + px) * k), int(min(H, y1 + py) * k)]
        # "pin" names the photo to show for a digit when the sharpest crop is a poor example (cut off, obscured).
        if cfg.get('pin', {}).get(ch) == label(item): score = float('inf')
        if kind == 'serial' and (ch not in crops or score > crops[ch][0]): crops[ch] = (score, Image.fromarray(full).crop(box), label(item))
        soft = t[sl] * ndimage.binary_dilation(mask, iterations=1)
        h, w = soft.shape; nw = max(1, int(round(w * CAN / h)))
        g = np.asarray(Image.fromarray((soft * 255).astype(np.uint8)).resize((nw, CAN), Image.BILINEAR)).astype(float) / 255
        canvas = np.zeros((CAN, CAN * 2)); xo = (CAN * 2 - nw) // 2; canvas[:, xo:xo + nw] = g
        a = acc.setdefault((kind, ch), [0, 0]); a[0] = a[0] + canvas; a[1] += 1
counts = {}
for (kind, ch), (s, n) in ([] if cfg.get('chartOnly') else acc.items()):
    mean = s / n; cols = np.where(mean.max(0) > 0.25)[0]; mean = mean[:, cols.min():cols.max() + 1]
    Image.fromarray((255 - mean * 255).astype(np.uint8)).save(f'out/{name}-{kind}-{ch}.png'); counts.setdefault(kind, {})[ch] = n
if not cfg.get('chartOnly'): json.dump(counts, open(f'out/{name}-counts.json', 'w'), indent=1)

# Chart: one real crop per digit, all the same height, with the photo it came from underneath.
TH = 300; tiles = []
font = ImageFont.load_default(size=15)
for ch in '0123456789':
    if ch in crops:
        im = crops[ch][1]; im = im.resize((max(1, round(im.width * TH / im.height)), TH), Image.LANCZOS)
    else:
        im = Image.new('RGB', (150, TH), (225, 225, 225)); d = ImageDraw.Draw(im)
        d.text((75, TH // 2), f'{ch}\nnot\nphotographed', fill=(110, 110, 110), anchor='mm', align='center', font=font)
    tiles.append((ch, im))
gap, top, bottom = 10, 56, 40
W = sum(im.width for _, im in tiles) + gap * (len(tiles) + 1)
chart = Image.new('RGB', (W, top + TH + bottom), 'white'); d = ImageDraw.Draw(chart)
d.rectangle([0, 0, W, top - 12], fill=(238, 238, 238))
title = ImageFont.load_default(size=28)
d.text((W // 2, (top - 12) // 2), cfg['title'], fill=(20, 45, 90), anchor='mm', font=title)
x = gap
for ch, im in tiles:
    chart.paste(im, (x, top))
    if ch in crops: d.text((x + im.width // 2, top + TH + 18), crops[ch][2].replace('.jpg', ''), fill=(120, 120, 120), anchor='mm', font=font)
    x += im.width + gap
chart.save(f'out/{name}-chart.png')
print('chart digits:', ''.join(c for c in '0123456789' if c in crops), '| samples:', counts)
