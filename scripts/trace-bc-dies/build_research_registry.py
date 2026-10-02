"""Compile the source-led review catalog into the app's research-die registry.

Every active glyph-bearing research unit (not superseded, not represented by a
narrower subset, not a complete wordmark asset) is bound to the B.C. formats it
applies to and to the production die (or proxy typeface) it stands in for:

  - units listing applicableFormatIds bind to exactly those formats;
  - otherwise to formats whose period overlaps the unit's years and that use the
    unit's comparison baseline die, or, with no baseline, to passenger formats of
    those years on the die playing the same role (serial / legend / date / decal).

Within one format and die, units are ordered best first: explicit format, year
inside the format's period, matching role, review-ready. The renderer takes each
character from the first unit that observed it and falls back to the production
glyph otherwise. Nothing here certifies historical fidelity.

  python3 scripts/trace-bc-dies/build_research_registry.py [REVIEW_PACKAGE_DIR]

REVIEW_PACKAGE_DIR holds catalog.json and format-role-inventory.json; it defaults
to the extracted review folder (see docs/bc-research-dies.md).
"""
from pathlib import Path
import json, re, sys

R = Path(__file__).resolve().parents[2]
DEFAULT = Path.home() / 'Desktop/research/docs/research/bc-lettering/review-package'
src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
OUT = R / 'src/templates/dies/research-registry.json'
catalog = json.loads((src / 'catalog.json').read_text())
inventory = json.loads((src / 'format-role-inventory.json').read_text())


def role_class(role: str) -> str:
    r = role.lower()
    if r.startswith('decal') or 'renewal' in r: return 'decal'
    if 'serial' in r or r.startswith('stack') or r in ('trailer', 'floater'): return 'serial'
    if re.search(r'year|date|month|day|expiry|century|base', r): return 'date'
    return 'legend'


def baseline_key(b: str) -> str:
    # Proxy typefaces appear both bare and with a font: prefix.
    b = b.removeprefix('font:')
    return 'font:' + b if ',' in b or '"' in b else b


formats = {f['formatId']: f for f in inventory['formats']}
FAMILIES = {f['family'] for f in inventory['formats']}


def family_fit(unit_id: str, f: dict) -> int:
    # Several plate classes can share one format's dies; prefer the unit traced from this class.
    words = set(re.split(r'[^a-z0-9]+', unit_id.lower()))
    if f['family'] in words or (not f['formatId'].isdigit() and f['formatId'].lower() in unit_id.lower()): return 1
    return -1 if words & (FAMILIES - {f['family']}) else 0


GENERIC = {'bc', 'legend', 'year', 'font', 'serial', 'date', 'tab', 'strip'}


def die_fit(unit_id: str, key: str) -> int:
    # Prefer the unit from the production die's own maker or series (e.g. hisigns over acme on a Hi-Signs base).
    tokens = {t for t in re.split(r'[^a-z0-9]+', key.lower()) if t and not t.isdigit() and t not in GENERIC}
    return 1 if tokens & set(re.split(r'[^a-z0-9]+', unit_id.lower())) else 0


uses = {}  # formatId -> key -> role classes rendered with it
for f in inventory['formats']:
    u = uses.setdefault(f['formatId'], {})
    for d in f['dieRoles']: u.setdefault(d['profile'], set()).add(role_class(d['role']))
    for t in f['textRoles']:
        for fam in t['fontFamilies']: u.setdefault(baseline_key(fam), set()).add(role_class(t['role']))

units = [x for x in catalog['units'] if x.get('glyphs') and not x.get('assetPath') and not x.get('kind')
         and not x.get('representedBy') and not x.get('supersededBy')]
glyph_index, glyphs, out_units, bindings = {}, [], {}, {}
for x in units:
    years, rc = set(x['years']), role_class(x['role'])
    baselines = [baseline_key(b) for b in x.get('comparisonBaselineProfiles') or []]
    explicit = [fid for fid in x.get('applicableFormatIds') or [] if fid in formats]
    overlaps = lambda f: any(f['period'][0] <= y <= f['period'][1] for y in years)
    if explicit: targets = explicit
    elif baselines: targets = [fid for fid, f in formats.items() if overlaps(f) and any(b in uses[fid] for b in baselines)]
    else: targets = [fid for fid, f in formats.items() if overlaps(f) and f['family'] == 'passenger']
    bound = False
    for fid in targets:
        f = formats[fid]
        keys = baselines or [k for k, rcs in uses[fid].items() if rc in rcs and not k.startswith('font:')]
        for k in keys:
            score = (4 if explicit else 0) + (2 if overlaps(f) else 0) + (1 if rc in uses[fid].get(k, ()) else 0) + (1 if x.get('reviewReadyCandidate') else 0) + family_fit(x['id'], f) + die_fit(x['id'], k)
            bindings.setdefault(fid, {}).setdefault(k, []).append((score, len(x['glyphs']), x['id']))
            bound = True
    if not bound: continue
    g = {}
    for ch, gl in sorted(x['glyphs'].items()):
        key = json.dumps([gl['advance'], gl['paths']])
        if key not in glyph_index: glyph_index[key] = len(glyphs); glyphs.append([gl['advance'], *gl['paths']])
        g[ch] = glyph_index[key]
    out_units[x['id']] = {'role': x['role'], 'title': x['title'], 'reviewReady': bool(x.get('reviewReadyCandidate')), 'glyphs': g}

out = {
    'note': 'Generated by scripts/trace-bc-dies/build_research_registry.py from the source-led review catalog. Unvalidated research candidates; not historical certification.',
    'catalogBaselineCommit': catalog.get('baselineCommit'),
    'glyphs': glyphs,
    'units': out_units,
    'bindings': {fid: {k: [uid for _, _, uid in sorted(v, key=lambda t: (-t[0], -t[1], t[2]))] for k, v in sorted(keys.items())}
                 for fid, keys in sorted(bindings.items())},
}
OUT.write_text(json.dumps(out, separators=(',', ':')) + '\n')
pairs = sum(len(v) for v in out['bindings'].values())
print(f'{len(out_units)} of {len(units)} active units bound across {len(out["bindings"])} formats ({pairs} format/die pairs); '
      f'{len(glyphs)} unique glyphs; {OUT.stat().st_size / 1e6:.1f} MB -> {OUT.relative_to(R)}')
