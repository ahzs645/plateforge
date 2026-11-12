#!/usr/bin/env python3
"""Create the downloadable card package; repository source stays in Git."""
import argparse
import base64
import json
import shutil
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public/stationery/grace-mccarthy'
EVIDENCE = ROOT / 'docs/research/grace-mccarthy-card'
parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', type=Path, required=True)
args = parser.parse_args()
out = args.output_dir.resolve()
out.mkdir(parents=True, exist_ok=True)
model = json.loads((PUBLIC / 'model.json').read_text())

copies = {
    PUBLIC / 'card-editable.svg': 'grace-mccarthy-card-editable.svg',
    PUBLIC / 'card-outlined.svg': 'grace-mccarthy-card-outlined.svg',
    PUBLIC / 'card-preview.png': 'grace-mccarthy-card.png',
    PUBLIC / 'index.html': 'grace-mccarthy-card-editor.html',
    EVIDENCE / 'font-study-comparison.png': 'grace-mccarthy-font-comparison.png',
    EVIDENCE / 'font-study-overlays.png': 'grace-mccarthy-font-overlays.png',
}
for source, name in copies.items():
    shutil.copyfile(source, out / name)

font_files = []
for font in model['fonts']:
    directory = font['id']
    metadata = {k: v for k, v in font.items() if k not in {'ttfBase64', 'runs'}}
    font_files.extend([
        (f'fonts/{directory}/{font["filename"]}', base64.b64decode(font['ttfBase64'])),
        (f'fonts/{directory}/OFL.txt', font['license'].encode()),
        (f'fonts/{directory}/provenance.json', (json.dumps(metadata, ensure_ascii=False, indent=2) + '\n').encode()),
    ])
with ZipFile(out / 'plateforge-card-fonts.zip', 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in font_files:
        archive.writestr(name, data)

project = {
    'schemaVersion': 1, 'sourceId': model['sourceId'], 'paper': model['artboard']['paper'],
    'transparent': False, 'pngWidth': 3600,
    'crest': {k: model['crest'][k] for k in ['x', 'y', 'height', 'color']},
    'lines': [{k: line.get(k, model['defaultFontId'] if k == 'fontId' else None)
               for k in ['id', 'text', 'color', 'x', 'y', 'capHeight', 'fontId']}
              for line in model['lines']],
}
project['crest']['visible'] = True

instructions = '''GRACE M. MCCARTHY CALLING-CARD RECONSTRUCTION

Open grace-mccarthy-card-editor.html in a current browser to edit the seven text
lines, change typefaces/colours, reposition the arms, compare with the source,
and export SVG/PNG. It contains its own fonts and reference image and needs no
server or network. Save a JSON project to keep edits after closing the page.

For Illustrator, Inkscape or another vector editor:
- grace-mccarthy-card-editable.svg contains seven editable text objects.
  Install the three PlateForge Card Script study TTFs from fonts/ if your editor
  ignores embedded web fonts. The other seven fonts are comparison choices.
- grace-mccarthy-card-outlined.svg contains vector paths and needs no font
  installation. Its reference lettering is edited as shapes.

The screenshot does not establish the original physical card size. The canvas
is 1800 x 1038 in measured source proportions; scale it to your intended use.

RECONSTRUCTION LIMITS
The fonts are source-informed studies derived from the open Pinyon family.
They are not authenticated original fonts. The three cuts are fitting choices
for name, titles and footer, not evidence of three historical typefaces.
The telephone overlap improves; name aggregate overlap remains essentially
unchanged/slightly worse. See comparisons and RECONSTRUCTION.md for details.
The supplied coat of arms is a different engraving from the card and is kept
at its own natural proportions. Original colours/date/print size are unverified.

All font licences and source provenance are included. The original screenshot
and SVG fragment remain user-provided evidence, separate from font licensing.

The static vector exports have been rendered and compared in Inkscape. The
offline editor received syntax and code review; interactive browser acceptance
could not be completed in the build environment. See evidence/validation.json.

Project: https://github.com/ahzs645/plateforge
'''
(out / 'README.txt').write_text(instructions)
package = out / 'Grace_McCarthy_Card_Recreation.zip'
with ZipFile(package, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    archive.writestr('README.txt', instructions)
    reconstruction = (EVIDENCE / 'README.md').read_text()
    for source, target in {
        '../../../public/stationery/grace-mccarthy/index.html': 'grace-mccarthy-card-editor.html',
        '../../../public/stationery/grace-mccarthy/card-editable.svg': 'grace-mccarthy-card-editable.svg',
        '../../../public/stationery/grace-mccarthy/card-outlined.svg': 'grace-mccarthy-card-outlined.svg',
        '../../../public/stationery/grace-mccarthy/card-preview.png': 'grace-mccarthy-card.png',
        '../../../public/stationery/grace-mccarthy/model.json': 'evidence/model.json',
        'font-study-comparison.png': 'grace-mccarthy-font-comparison.png',
        'font-study-overlays.png': 'grace-mccarthy-font-overlays.png',
    }.items():
        reconstruction = reconstruction.replace('](' + source + ')', '](' + target + ')')
    for name in ['geometry.json', 'font-study.json', 'validation.json', 'editor-validation.json', 'reference-layout.json']:
        reconstruction = reconstruction.replace('](' + name + ')', '](evidence/' + name + ')')
    archive.writestr('RECONSTRUCTION.md', reconstruction)
    for name in copies.values():
        archive.write(out / name, name)
    archive.writestr('grace-mccarthy-card-project.json', json.dumps(project, ensure_ascii=False, indent=2) + '\n')
    for name, data in font_files:
        archive.writestr(name, data)
    for name in ['geometry.json', 'reference-layout.json', 'font-study.json', 'validation.json', 'editor-validation.json',
                 'source-card.png', 'supplied-arms-fragment.txt']:
        archive.write(EVIDENCE / name, 'evidence/' + name)
    archive.write(PUBLIC / 'reference.png', 'evidence/rectified-reference.png')
    archive.write(PUBLIC / 'model.json', 'evidence/model.json')
with ZipFile(package) as archive:
    if archive.testzip() is not None:
        raise RuntimeError('ZIP integrity check failed')
    count = len(archive.infolist())
print(json.dumps({'package': str(package), 'bytes': package.stat().st_size,
                  'entries': count, 'fonts': len(model['fonts']), 'textLines': len(model['lines'])}))
