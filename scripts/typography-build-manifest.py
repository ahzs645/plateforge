#!/usr/bin/env python3
"""Rebuild versioned face descriptors from the actual, unmodified input files.

Requires: Python 3.10+, fonttools==4.61.1 and brotli; run after npm ci.
No font software is copied or altered. Output is metadata, source imports and notices.
The --check mode verifies byte-for-byte reproducibility without writing outputs.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
NOTICE_DIR = 'public/data/typography/licenses'
OUT = 'docs/research/typography-consistency'
STYLES = {
    'noto-sans-sc': ['700.css'], 'noto-sans-jp': ['600.css'], 'noto-sans-kr': ['700.css'],
    'noto-sans-canadian-aboriginal': ['700.css'], 'pinyon-script': ['400.css'],
    'noto-sans': ['400.css', '700.css', '400-italic.css', '700-italic.css'],
    'noto-serif': ['400.css', '700.css', '400-italic.css', '700-italic.css'],
    'barlow-condensed': [f'{weight}{suffix}.css' for weight in (400, 500, 600, 700) for suffix in ('', '-italic')],
}

def encoded(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()

def compact_ranges(points: list[int]) -> str:
    points = sorted(set(points))
    if not points: raise ValueError('A declared face must have a nonempty Unicode cmap')
    start = end = points[0]; result = []
    for point in points[1:]:
        if point == end + 1: end = point
        else: result.append((start, end)); start = end = point
    result.append((start, end))
    return ','.join(f'U+{a:X}' + (f'-{b:X}' if a != b else '') for a, b in result)

def unicode_bounds(value: str) -> list[tuple[int, int]]:
    ranges = []
    for raw in value.split(','):
        token = raw.strip().upper().removeprefix('U+')
        if '?' in token: bounds = int(token.replace('?', '0'), 16), int(token.replace('?', 'F'), 16)
        else:
            parts = token.split('-'); bounds = int(parts[0], 16), int(parts[-1], 16)
        if not 0 <= bounds[0] <= bounds[1] <= 0x10ffff: raise ValueError(raw)
        ranges.append(bounds)
    return ranges

def inspect(path: Path) -> dict:
    with TTFont(path) as font:
        row = {'path': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
               'bytes': path.stat().st_size, 'names': {str(i): sorted({n.toUnicode() for n in font['name'].names if n.nameID == i})
                for i in (0,1,2,3,4,5,6,8,9,11,13,14,16,17)},
               'unitsPerEm': font['head'].unitsPerEm, 'glyphCount': len(font.getGlyphOrder()),
               'codepoints': sorted((font.getBestCmap() or {}).keys())}
        if 'OS/2' in font:
            o = font['OS/2']; row.update(fsType=o.fsType, weightClass=o.usWeightClass, widthClass=o.usWidthClass, capHeight=getattr(o,'sCapHeight',None))
        if 'fvar' in font:
            row['axes'] = [{'tag': a.axisTag, 'min': a.minValue, 'default': a.defaultValue, 'max': a.maxValue} for a in font['fvar'].axes]
        return row

def build() -> dict[str, bytes]:
    outputs: dict[str, bytes] = {}; manifest = {}; metadata = {}
    pins = json.loads((ROOT/'scripts/typography-package-pins.json').read_text())
    pins.update({'@fontsource/barlow-condensed': '5.3.0', '@fontsource-variable/inter': '5.3.0'})
    project = json.loads((ROOT/'package.json').read_text())
    for package, version in pins.items():
        if project['dependencies'].get(package) != version: raise ValueError(f'Unpinned project dependency: {package}')
        actual = json.loads((ROOT/'node_modules'/package/'package.json').read_text())['version']
        if actual != version: raise ValueError(f'Wrong installed package: {package}: {actual} != {version}')
    def add(identity: str, path: Path, family: str, weight: int|str, style: str, licence: dict, css_range: str|None=None, package: str|None=None):
        key = path.relative_to(ROOT).as_posix()
        if key not in metadata: metadata[key] = inspect(path)
        row = metadata[key]; points = row['codepoints']
        if css_range:
            allowed = unicode_bounds(css_range); points = [p for p in points if any(a <= p <= b for a,b in allowed)]
        if not points: return
        if identity in manifest: raise ValueError(f'Duplicate face ID {identity}')
        face = {'id': identity, 'family': family, 'path': key, 'weight': weight, 'style': style,
                'format': 'woff2' if path.suffix == '.woff2' else 'truetype', 'unicodeRange': compact_ranges(points),
                'sourceVersion': '; '.join(row['names']['5']), 'sha256': row['sha256'], 'license': licence,
                'capHeightRatio': row['capHeight']/row['unitsPerEm'] if row.get('capHeight') else None}
        if package: face['package'] = {'name': package, 'version': pins[package]}
        if family not in ('EuroPlate','UKNumberPlate','Antonio','Barlow Condensed'):
            face['purpose'] = 'Portable general-purpose substitute; not an identified manufacturing plate alphabet'
        manifest[identity] = face
    ofl = lambda url: {'label':'SIL Open Font License 1.1','status':'open','sourceUrl':url}
    for subset in ['latin-ext','latin']:
        add('antonio-'+subset, ROOT/f'src/assets/fonts/Antonio-{subset}.woff2','Antonio','400 700','normal',ofl('https://github.com/google/fonts/tree/main/ofl/antonio'))
    add('euro', ROOT/'src/assets/fonts/EuroPlate.ttf','EuroPlate',400,'normal',
        {'label':'Publisher documents private use; public deployment permission unverified','status':'unverified','sourceUrl':'https://www.andyhoppe.com/design/fonts/euro-plate-font/'})
    add('uk', ROOT/'src/assets/fonts/UKNumberPlate.ttf','UKNumberPlate',400,'normal',
        {'label':'No deployment licence embedded in the inspected file','status':'unverified','sourceUrl':'https://www.dafont.com/uk-number-plate.font'})
    for name, styles in sorted(STYLES.items()):
        package = '@fontsource/'+name; directory = ROOT/'node_modules'/package
        licence = directory/'LICENSE'
        if not licence.is_file() or 'SIL OPEN FONT LICENSE' not in licence.read_text().upper(): raise ValueError(f'Missing OFL notice: {name}')
        outputs[f'{NOTICE_DIR}/{name}.txt'] = licence.read_bytes()
        for css_name in styles:
            css = (directory/css_name).read_text()
            for block in re.findall(r'@font-face\s*\{([^}]+)\}',css):
                match = re.search(r'url\([\'"]?(?:\./)?(files/[^)\'"]+\.woff2)[\'"]?\)',block)
                if not match: raise ValueError(f'No WOFF2 source: {name}/{css_name}')
                path = directory/match[1]
                def descriptor(key: str, default: str='') -> str:
                    found = re.search(re.escape(key)+r':\s*([^;]+)',block)
                    return found[1].strip().strip('\'"') if found else default
                family, weight, style = descriptor('font-family'), descriptor('font-weight'), descriptor('font-style','normal')
                identity = path.stem
                if name == 'barlow-condensed':
                    subset = path.stem.removeprefix('barlow-condensed-').removesuffix(f'-{weight}-{style}')
                    identity = f'barlow-{weight}-{style}-{subset}'
                add(identity,path,family,int(weight) if weight.isdigit() else weight,style,
                    ofl('https://fontsource.org/fonts/'+name),descriptor('unicode-range') or None,package)
    manifest = dict(sorted(manifest.items()))
    outputs['src/templates/font-manifest.json'] = encoded(manifest)
    lines = ["// Generated by scripts/typography-build-manifest.py; do not edit.", "import type { FontAsset } from '../core/types';", "import manifestData from './font-manifest.json';"]
    entries = []
    for i,(identity,face) in enumerate(manifest.items()):
        path = face['path']; specifier = path.removeprefix('node_modules/') if path.startswith('node_modules/') else '../../'+path
        lines.append(f'import asset{i} from {json.dumps(specifier+"?url")};')
        entries.append(f'  {{ ...manifest[{json.dumps(identity)}], url: asset{i} }},')
    lines += ["const manifest = manifestData as Record<string, Omit<FontAsset, 'url'>>;", 'export const FONT_ASSETS: readonly FontAsset[] = [',*entries,'];','']
    outputs['src/templates/font-assets.ts'] = '\n'.join(lines).encode()
    paths = {ROOT/p for p in subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0') if p}
    paths.update((ROOT/'node_modules/@fontsource/barlow-condensed/files').glob('*.woff2'))
    paths.update((ROOT/'node_modules/@fontsource-variable/inter/files').glob('*.woff2'))
    for path in sorted(paths):
        if path.is_file() and path.suffix.lower() in {'.ttf','.otf','.woff','.woff2'}:
            key=path.relative_to(ROOT).as_posix()
            if key not in metadata: metadata[key]=inspect(path)
    selected = set(face['path'] for face in manifest.values())
    new_prefixes = tuple('node_modules/'+p+'/' for p in pins if p!='@fontsource/barlow-condensed' and p!='@fontsource-variable/inter')
    method = 'fontTools 4.61.1; actual original font bytes, SHA-256, names and cmaps. fsType is not a redistribution licence. No historical authenticity inferred.'
    outputs[f'{OUT}/font-inventory.json'] = encoded({'schema':'plateforge.font-inventory/v1','method':method,'fonts':[v for k,v in sorted(metadata.items()) if not k.startswith(new_prefixes)]})
    outputs[f'{OUT}/portable-font-inventory.json'] = encoded({'schema':'plateforge.font-inventory/v1','method':method,'packages':pins,'fonts':[v for k,v in sorted(metadata.items()) if k in selected and k.startswith(new_prefixes)]})
    outputs[f'{NOTICE_DIR}/antonio.txt'] = (ROOT/'src/assets/fonts/Antonio-OFL.txt').read_bytes()
    outputs[f'{NOTICE_DIR}/inter.txt'] = (ROOT/'node_modules/@fontsource-variable/inter/LICENSE').read_bytes()
    return outputs

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    outputs=build();wrong=[]
    for relative,data in outputs.items():
        path=ROOT/relative
        if args.check:
            if not path.exists() or path.read_bytes()!=data: wrong.append(relative)
        else:
            path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    if wrong: raise SystemExit('Generated typography files differ:\n'+'\n'.join(wrong))
    print(('Verified' if args.check else 'Generated')+f' {len(outputs)} deterministic metadata/notice files; no font software copied.')
