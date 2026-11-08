#!/usr/bin/env python3
"""Build clean specimen constructions; never rescale a font's x coordinates.

Coordinates are hand-authored in a 100-unit painted-height system. See the
provenance ledger for observed versus constructed parts of the alphabet.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

# Smooth optical constructions from the photographed printed ink. Do not copy
# dirt, scan grain, isolated threshold pixels, or the photograph's slight tilt.
YEAR = {
    '0': (47.5, 'M22 0 C38 0 44 14 44 50 C44 86 38 100 22 100 C6 100 0 86 0 50 C0 14 6 0 22 0 Z M22 16 C17 16 17 27 17 50 C17 73 17 84 22 84 C27 84 27 73 27 50 C27 27 27 16 22 16 Z'),
    '1': (38.5, 'M17 0 H30 V100 H12.5 V32 H0 V17 C8 17 14 12 17 0 Z'),
    '2': (47, 'M0 34 C0 10 6 0 22 0 C37 0 44 9 44 29 C44 46 34 59 20 80 H44 V100 H0 C0 78 5 65 18 49 C24 41 27 35 27 27 C27 20 25 16 22 16 C18 16 17 20 17 34 Z'),
    '3': (48, 'M1 28 C1 9 7 0 22 0 C37 0 44 9 44 26 C44 37 40 43 34 47 C42 51 45 59 45 72 C45 91 37 100 22 100 C7 100 0 90 0 71 V65 H17 V72 C17 81 18 85 22 85 C26 85 28 80 28 71 C28 61 25 57 18 57 H14 V41 H18 C24 41 27 37 27 28 C27 19 25 16 22 16 C18 16 17 20 17 28 V33 H1 Z'),
    '4': (49, 'M22 0 H40 V63 H46 V82 H40 V100 H23 V82 H0 V64 Z M23 27 L10 63 H23 Z'),
    '5': (48, 'M3 0 H43 V18 H18 L17 34 C21 29 24 28 28 28 C40 28 44.5 40 44.5 65 C44.5 89 38 100 22 100 C7 100 0 90 0 70 V66 H17 V75 C17 83 19 85 22 85 C26 85 27 80 27 67 C27 53 26 47 22 47 C19 47 17 49 17 55 H1 Z'),
    '6': (48.5, 'M43 27 H26 C26 18 25 15 21 15 C16 15 16 26 16 43 C20 36 24 33 29 33 C40 33 45 44 45 64 C45 90 38 100 22 100 C6 100 0 87 0 50 C0 15 6 0 22 0 C36 0 42 7 43 27 Z M22 51 C18 51 16 57 16 68 C16 80 18 85 22 85 C26 85 28 81 28 68 C28 56 26 51 22 51 Z'),
    '7': (47.5, 'M0 0 H44 V20 C36 41 30 67 27 100 H9 C12 69 18 43 26 20 H0 Z'),
    '8': (48.5, 'M22 0 C37 0 44 9 44 27 C44 38 40 44 34 48 C42 52 45 60 45 74 C45 91 37 100 22 100 C6 100 0 91 0 74 C0 60 4 53 12 48 C4 44 1 37 1 27 C1 9 8 0 22 0 Z M22 16 C18 16 17 20 17 28 C17 36 18 40 22 40 C26 40 28 37 28 28 C28 20 26 16 22 16 Z M22 57 C17 57 16 62 16 72 C16 82 18 85 22 85 C27 85 28 82 28 72 C28 61 27 57 22 57 Z'),
    '9': (48.5, 'M2 73 H19 C19 82 20 85 24 85 C29 85 29 74 29 57 C25 64 21 67 16 67 C5 67 0 56 0 36 C0 10 7 0 23 0 C39 0 45 13 45 50 C45 85 39 100 23 100 C9 100 3 93 2 73 Z M23 49 C27 49 29 43 29 32 C29 20 27 15 23 15 C19 15 17 19 17 32 C17 44 19 49 23 49 Z'),
}

# Reuse native Nimbus Sans Narrow Bold outlines and their tabular advances.
# Only 1 is reconstructed: the photographs show a diagonal flag, with the
# vertical stem at the same pitch as the other numerals, rather than a curved
# shoulder ending in a horizontal shelf.
base = json.loads((ROOT / 'src/templates/dies/decal-printing.json').read_text())['control-bold']
control = {c: base[c] for c in '0123456789'}
control['1'] = {
    'advance': base['1']['advance'], 'fill': True,
    'paths': ['M39 1.114 H46 V100 H30 V27 L8 43 V26 C20 19 31 10 39 1.114 Z'],
}
profiles = {
    'modern-year-reconstruction': {c: {'advance': advance, 'fill': True, 'paths': [path]} for c, (advance, path) in YEAR.items()},
    'modern-control-reconstruction': control,
}
target = ROOT / 'src/templates/dies/decal-modern-printing.json'
target.write_text(json.dumps(profiles, indent=2) + '\n')
print(target.relative_to(ROOT))
