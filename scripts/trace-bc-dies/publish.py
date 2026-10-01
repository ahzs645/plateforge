"""Copy the research outputs into docs/research/bc-lettering/ so they live in the repository.

Usage: python3 publish.py   (after run.sh, gen_charts.py + series.py for the chart-only series, and dates.py)
- charts/: the BCpl8s-style "Die Types (0-9)" charts, one real photo crop per digit (JPEG).
- averages/: one sheet per die, showing each averaged character with its sample count (what vectorize.py traced).
- data/: the sample counts and the photo list behind every series.
The overlay comparisons are written by compare.cjs and the BCpl8s excerpts by survey.py."""
import glob, json, os, shutil
from PIL import Image, ImageDraw, ImageFont

DOCS = '../../docs/research/bc-lettering'
for d in ('charts', 'averages', 'data'): os.makedirs(f'{DOCS}/{d}', exist_ok=True)
font = ImageFont.load_default(size=16); big = ImageFont.load_default(size=24)

CHARTS = ['tin-macdonald', 'tin-tacey', 'slant-1924', 'straight-1928', 'thompson-1930', 'slim-1936', 'early-1940', 'dates']
for name in CHARTS:
    Image.open(f'out/{name}-chart.png').convert('RGB').save(f'{DOCS}/charts/{name}.jpg', quality=85, optimize=True)

def counts(path, *keys):
    c = json.load(open(path))
    for k in keys: c = c[k]
    return {ch: (v['n'] if isinstance(v, dict) else v) for ch, v in c.items()}
summary = 'out/summary.json'
SHEETS = [  # file, title, bitmap prefix, characters, sample counts
    ('1915-16-macdonald', '1915-16 MacDonald Manufacturing: serial', 'serial-macdonald', '0123456789', counts('out/tin-counts.json', 'serial-macdonald')),
    ('1916-17-tacey', '1916-17 J.R. Tacey & Sons: serial', 'serial-tacey', '0123456789', counts('out/tin-counts.json', 'serial-tacey')),
    ('1924-slanted-serial', '1924-27, 1931-32 slanted dies: serial', 'slant-1924-serial', '0123456789', counts('out/slant-1924-counts.json', 'serial')),
    ('1924-slanted-legend', '1924-27, 1931-32 slanted dies: legend', 'slant-1924-legend', 'BRITSHCOLUMA', counts('out/slant-1924-counts.json', 'legend')),
    ('1928-straight-serial', '1928-29, 1933-35 straight dies: serial', 'straight-1928-serial', '0123456789', counts('out/straight-1928-counts.json', 'serial')),
    ('1928-straight-legend', '1928-29, 1933-35 straight dies: legend', 'straight-1928-legend', 'BRITSHCOLUMA', counts('out/straight-1928-counts.json', 'legend')),
    ('1930-thompson-serial', '1930 Thompson dies: serial (no 8 photographed)', 'thompson-1930-serial', '0123456789', counts('out/thompson-1930-counts.json', 'serial')),
    ('1930-thompson-legend', '1930 Thompson dies: legend', 'thompson-1930-legend', 'BRITSHCOLUMA', counts('out/thompson-1930-counts.json', 'legend')),
    ('1936-slimline-serial', '1936-39 slimline dies: serial', 'slim-1936-serial', '0123456789', counts('out/slim-1936-counts.json', 'serial')),
    ('1936-slimline-legend', '1936-39 slimline dies: legend', 'slim-1936-legend', 'BRITSHCOLUMA', counts('out/slim-1936-counts.json', 'legend')),
    ('1940-54-serial', '1940-54 rounded dies: serial', 'serial-all', '0123456789ABDEFHJKNPRSTUWY', counts(summary, 'summary', 'serial', 'all')),
    ('1940-54-legend', '1940-54 rounded dies: legend', 'legend-all', 'BRITSHCOLUMA', counts(summary, 'summary', 'legend', 'all')),
    ('1940-51-year', '1940-51 stacked year', 'year-all', '0123456789', counts(summary, 'summary', 'year', 'all')),
    ('1952-year', '1952 base: 52', 'year52-all', '52', counts(summary, 'summary', 'year52', 'all')),
    ('1951-strip', '1951 renewal strip', 'strip-all', 'BRITSHCOLUMA51', counts('out/strip-counts.json')),
    ('1953-54-tab', '1953/54 renewal tab year', 'tab-all', '345', counts('out/tab-counts.json')),
]
dates = json.load(open('out/date-counts.json'))
for year, d in dates.items():
    SHEETS.append((f'date-{year}', f'{year} date stamp', f'date-{year}', ''.join(sorted(d)), d))

TH = 128
def sheet(title, prefix, chars, n):
    tiles = []
    for ch in chars:
        f = f'out/{prefix}-{ch}.png'
        if not os.path.exists(f): continue
        im = Image.open(f).convert('L'); im = im.resize((max(1, round(im.width * TH / im.height)), TH), Image.LANCZOS)
        tiles.append((ch, im))
    W = max(400, sum(im.width + 16 for _, im in tiles) + 16)
    out = Image.new('L', (W, TH + 78), 255); d = ImageDraw.Draw(out)
    d.text((12, 8), title, fill=40, font=big)
    x = 16
    for ch, im in tiles:
        out.paste(im, (x, 44)); d.text((x + im.width // 2, 44 + TH + 16), f'{ch} · {n.get(ch, 0)}', fill=110, anchor='mm', font=font)
        x += im.width + 16
    return out
for file, title, prefix, chars, n in SHEETS:
    sheet(title, prefix, chars, n).save(f'{DOCS}/averages/{file}.png', optimize=True)

# Data: counts and each series' photo list (file names on BCpl8s, the text read from them).
for f in ['tin-counts.json', 'strip-counts.json', 'tab-counts.json', 'date-counts.json'] + [os.path.basename(p) for p in glob.glob('out/*-19[0-9][0-9]-counts.json')]:
    shutil.copy(f'out/{f}', f'{DOCS}/data/{f}')
json.dump(json.load(open(summary))['summary'], open(f'{DOCS}/data/1940-54-counts.json', 'w'), indent=1)
photos = {}
for p in sorted(glob.glob('series/*.json')):
    cfg = json.load(open(p))
    if 'photos' in cfg: photos[cfg['name']] = [{'photo': os.path.basename(i['file']), 'reads': i['text']} for i in cfg['photos']]
json.dump(photos, open(f'{DOCS}/data/series-photos.json', 'w'), indent=1)
print('published', len(CHARTS), 'charts and', len(SHEETS), 'average sheets to', DOCS)
