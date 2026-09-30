"""Write series configs for the 1924–39 annual plates, one per serial die family (BCpl8s, Passenger 1924–1939):
Tacey's slanted dies (1924–27, and again at Oakalla 1931–32), the straight dies (1928–29, 1933–35) and the
slimline plates (1936–39: the slanted design, with identical replacement dies from 1938). 1930 is series/1930.json."""
import glob, json, os, re
exec(open('extract.py').read().split("acc = {}")[0].replace("SRC = sys.argv[1] if len(sys.argv) > 1 else '.cache/plates'", "pass"))
FAMILIES = {
  'slant-1924': ('1924-27 & 1931-32 British Columbia Die Types (0-9) · Tacey slanted', [1924, 1925, 1926, 1927, 1931, 1932], [0.04, 0.8, 0.02, 0.83]),
  'straight-1928': ('1928-29 & 1933-35 British Columbia Die Types (0-9) · Tacey straight', [1928, 1929, 1933, 1934, 1935], [0.04, 0.8, 0.02, 0.83]),
  'slim-1936': ('1936-39 British Columbia Die Types (0-9) · slimline', [1936, 1937, 1938, 1939], [0.04, 0.8, 0.02, 0.9]),
}
for name, (title, years, band) in FAMILIES.items():
    photos = []
    for year, serial, fn in best_photos('.cache/dates/19[23]?-*.jpg'):
        if year not in years or set(serial) == {'0'}: continue   # all-zero samples and other provinces' specimens
        photos.append({'file': fn, 'text': serial, 'label': f'{year} ' + (f'{serial[:-3]}-{serial[-3:]}' if len(serial) > 3 else serial)})
    cfg = {'name': name, 'title': title, 'band': band, 'height': [0.3, 0.8], 'photos': photos,
           'extra': [{'kind': 'legend', 'text': 'BRITISHCOLUMBIA', 'band': [0.7, 0.98, 0.02, 0.98], 'height': [0.08, 0.3], 'minw': 0.003, 'ratio': 0.015}]}
    json.dump(cfg, open(f'series/{name}.json', 'w'), indent=1, ensure_ascii=False)
    print(name, len(photos), 'photos')
