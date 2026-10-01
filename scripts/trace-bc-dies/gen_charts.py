"""Write series configs for the die-type charts of the 1915–17 tin plates (one per maker) and the 1940–54 bases.
Their averages come from tin.py and extract.py; these configs only add BCpl8s-style 0–9 charts."""
import json
exec(open('extract.py').read().split("acc = {}")[0].replace("SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'", "pass"))
def lab(year, serial): return f'{year} ' + (f'{serial[:-3]}-{serial[-3:]}' if len(serial) > 3 else serial)
tin = {'macdonald': [], 'tacey': []}
for year, serial, fn in best_photos('.cache/tin/191[567]-*.jpg'):
    if not serial.isdigit(): continue
    mk = 'macdonald' if year == 1915 or (year == 1916 and int(serial) <= 9000) else 'tacey'
    tin[mk].append({'file': fn, 'text': serial, 'label': lab(year, serial)})
CONFIGS = {
  'tin-macdonald': ('1915-16 British Columbia Die Types (0-9) · MacDonald Manufacturing', tin['macdonald'], [0.03, 0.98, 0.22, 0.995], [0.5, 0.95]),
  'tin-tacey': ('1916-17 British Columbia Die Types (0-9) · J.R. Tacey & Sons', tin['tacey'], [0.03, 0.98, 0.22, 0.995], [0.5, 0.95]),
  'early-1940': ('1940-54 British Columbia Die Types (0-9) · Oakalla rounded',
    [{'file': fn, 'text': s, 'label': lab(y, s)} for y, s, fn in best_photos('.cache/plates/19[45]?-*.jpg') if y <= 1954 and s.isdigit() and set(s) != {'0'}],
    [0.06, 0.74, 0.015, 0.905], [0.3, 0.75]),
}
for name, (title, photos, band, height) in CONFIGS.items():
    cfg = {'name': name, 'title': title, 'band': band, 'height': height, 'photos': photos, 'chartOnly': True}
    # MacDonald photos are untrimmed: keep off the rim and the thin panel edges.
    if name == 'tin-macdonald': cfg['serial'] = {'ratio': 0.1, 'maxRight': 0.99}; cfg['pin'] = {'9': '1916 9'}
    json.dump(cfg, open(f'series/{name}.json', 'w'), indent=1, ensure_ascii=False)
    print(name, len(photos), 'photos')
