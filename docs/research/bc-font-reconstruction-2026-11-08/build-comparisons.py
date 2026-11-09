"""Build source / previous / current comparisons from actual renderer output.
Run render.mjs first. Dependencies: Python 3, Pillow, numpy.
Each photograph and each repeated occurrence is retained separately. Shape
panels uniformly match centre/height, with no independent width stretching.
Plate placement uses a single shell-corner homography and the original serial
transforms. U/Z placement is withheld because their corners are obscured.
"""
from pathlib import Path
from PIL import Image
import base64
import hashlib
import html
import io
import json
import numpy as np

STUDY = Path('docs/research/bc-font-reconstruction-2026-11-08')
OUT = Path('public/bc-font-reconstruction')
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'source-plates').mkdir(exist_ok=True)
ledger = json.loads((STUDY / 'sources.json').read_text())
rendered = {r['id']: r for r in json.loads((STUDY / 'rendered.json').read_text())['records']}
esc = html.escape
COLORS = {'previous-production': '#db710a', 'previous-research': '#c32f69', 'current-research': '#008b9a'}
MODES = [('previous-production', 'Previous production'), ('previous-research', 'Previous research'), ('current-research', 'Current research mode')]
WIDTH, HEIGHT, PANEL, PAINT_H, TOP = 800, 278, 200, 180, 61

def data_uri(im, fmt='PNG'):
    b = io.BytesIO()
    im.save(b, format=fmt)
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(b.getvalue()).decode()

def homography(src, dst):
    a, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        a += [[x, y, 1, 0, 0, 0, -u*x, -u*y], [0, 0, 0, x, y, 1, -v*x, -v*y]]
        b += [u, v]
    return np.append(np.linalg.solve(a, b), 1).reshape(3, 3)

def point(matrix, x, y):
    result = matrix @ [x, y, 1]
    return result[:2] / result[2]

def mapped_box(matrix, bounds):
    x0, y0, x1, y1 = bounds
    points = np.array([point(matrix, x, y) for x, y in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]])
    return [float(points[:,0].min()),float(points[:,1].min()),float(points[:,0].max()),float(points[:,1].max())]

def rectify(im, corners):
    matrix = homography(corners, [[0,0],[1200,0],[1200,600],[0,600]])
    inverse = np.linalg.inv(matrix)
    inverse /= inverse[2,2]
    return im.transform((1200,600), Image.Transform.PERSPECTIVE, tuple(inverse.flatten()[:8]), resample=Image.Resampling.BICUBIC), matrix

def svg_document(body, width=WIDTH, height=HEIGHT, title=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{esc(title)}"><title>{esc(title)}</title>{body}</svg>'

def shape_panel(specimen, occurrence, original, rectified, matrix):
    use_rectified = specimen['shapeSpace'] == 'rectified plate plane'
    if use_rectified:
        cb = mapped_box(matrix, occurrence['cropBounds'])
        cb = [int(np.floor(cb[0])),int(np.floor(cb[1])),int(np.ceil(cb[2])),int(np.ceil(cb[3]))]
        pb = mapped_box(matrix, occurrence['paintBounds'])
        crop = rectified.crop(cb)
        source_height = pb[3]-pb[1]
        source_xc = (pb[0]+pb[2])/2-cb[0]
        source_top = pb[1]-cb[1]
    else:
        cb = occurrence['cropBounds']
        crop = original.crop(cb)
        alignment = occurrence['alignmentInCrop']
        source_height = alignment['height']
        source_xc = alignment['xCenter']
        source_top = alignment['yTop']
    scale = PAINT_H/source_height
    photo_x = PANEL/2-source_xc*scale
    photo_y = TOP-source_top*scale
    char = occurrence['character']
    label = f"{specimen['serial']} · {char} · occurrence {occurrence['index']}"
    body = f'<rect width="800" height="278" fill="#f3f7f8"/><text x="12" y="19" fill="#203e50" font-family="sans-serif" font-size="14">{esc(label)}</text>'
    png = data_uri(crop)
    photo_id = f'crop-{specimen["id"]}-{occurrence["index"]}'
    # Reuse the exact source pixels in every panel without embedding four
    # identical payloads. The IDs also remain unique in the overview sheets.
    body += f'<defs><image id="{photo_id}" href="{png}" x="{photo_x:.6f}" y="{photo_y:.6f}" width="{crop.width*scale:.6f}" height="{crop.height*scale:.6f}"/></defs>'
    for i, (mode, name) in enumerate([('source','Source crop')]+MODES):
        x = i*PANEL
        body += f'<g transform="translate({x} 0)"><rect x="1" y="30" width="198" height="246" fill="#fff"/><text x="9" y="47" fill="#203e50" font-family="sans-serif" font-size="12">{name}</text>'
        body += f'<use href="#{photo_id}"/>'
        if mode != 'source':
            glyph = rendered[specimen['id']]['modes'][mode]['glyphs'][char]
            x0,y0,x1,y1 = glyph['bounds']
            k = PAINT_H/(y1-y0)
            dx = PANEL/2-((x0+x1)/2)*k
            dy = TOP-y0*k
            geometry = glyph['node'].replace('#000000', COLORS[mode])
            body += f'<g transform="translate({dx:.6f} {dy:.6f}) scale({k:.6f})" opacity=".46">{geometry}</g>'
        body += '</g>'
    filename = f"{specimen['id']}-{occurrence['index']:02d}-{char}-shape.svg"
    (OUT / filename).write_text(svg_document(body, title=label+'; source and uniform-height vector overlays'))
    return filename, body

def placement(specimen, image, mode):
    serial = rendered[specimen['id']]['modes'][mode]['serialSvg']
    serial = serial.replace('#000000', COLORS[mode])
    # JPEG remains portable in both browsers and librsvg-based raster exports;
    # embedded WebP is not decoded by every SVG renderer.
    body = f'<image href="{data_uri(image, "JPEG")}" width="1200" height="600"/><g opacity=".52">{serial}</g>'
    filename = f"{specimen['id']}-{mode}-placement.svg"
    (OUT / filename).write_text(svg_document(body, 1200, 600, specimen['serial']+'; actual '+mode+' serial placement over rectified photograph'))
    return filename

sections = []
contact = {'modern': [], 'n': []}
comparison_records = []
for specimen in ledger['specimens']:
    original_file = STUDY / specimen['originalPath']
    assert hashlib.sha256(original_file.read_bytes()).hexdigest() == specimen['sha256']
    original = Image.open(original_file).convert('RGB')
    snapshot = original.copy()
    snapshot.thumbnail((1200, 600), Image.Resampling.LANCZOS)
    snapshot_name = f"source-plates/{specimen['id']}.webp"
    snapshot.save(OUT / snapshot_name, quality=88)
    rectified = matrix = None
    if specimen['corners']:
        rectified, matrix = rectify(original, specimen['corners'])
        rectified.save(OUT / f"source-plates/{specimen['id']}-rectified.webp", quality=88)
    panels = []
    for occurrence in specimen['occurrences']:
        filename, body = shape_panel(specimen, occurrence, original, rectified, matrix)
        panels.append(f'<figure><img loading="lazy" src="{filename}" alt="{esc(specimen["serial"])} occurrence {occurrence["index"]}: {occurrence["character"]}; source, previous production/research, current overlay"/><figcaption>{occurrence["character"]} · occurrence {occurrence["index"]} · {esc(specimen["shapeSpace"])} · uniform height and centre; original width retained</figcaption></figure>')
        if occurrence['character'] in specimen['changed']:
            contact['modern' if specimen['id'].startswith('modern') else 'n'].append(body)
        comparison_records.append(dict(specimen=specimen['id'],occurrence=occurrence['index'],character=occurrence['character'],shapeSpace=specimen['shapeSpace'],figure=filename,changed=occurrence['character'] in specimen['changed']))
    placement_html = f'<p>{esc(specimen["placementNote"])}</p>'
    if rectified:
        placement_html += f'<figure><img loading="lazy" src="source-plates/{specimen["id"]}-rectified.webp" alt="{esc(specimen["serial"])} rectified reference photograph"/><figcaption>One shell-corner mapping, 2:1 plane. No glyph-position fitting.</figcaption></figure>'
        for mode,name in MODES:
            filename = placement(specimen, rectified, mode)
            placement_html += f'<figure><img loading="lazy" src="{filename}" alt="{esc(specimen["serial"])} {name} placement overlay"/><figcaption>{name}: original renderer positions retained; separator artwork omitted from comparison ink only.</figcaption></figure>'
    state = 'Exact U/Y/Z path recovered from report SVG; implementation/scoping re-established and tested.' if specimen['id'].startswith('modern') else 'New N path recreated November 8; earlier N vector coordinates were unavailable.'
    sections.append(f'''<section id="{specimen['id']}"><h2>{esc(specimen['serial'])} <small>{esc(specimen['profile'])}</small></h2>
<p>{esc(state)} These photographs are construction inputs; no independent holdout is available.</p>
<figure class="source"><a href="{esc(specimen['sourceUrl'])}"><img src="{snapshot_name}" alt="Original credited {esc(specimen['serial'])} photograph, display copy"/></a><figcaption><a href="{esc(specimen['sourceUrl'])}">Original credited photograph</a> · {specimen['dimensions'][0]} × {specimen['dimensions'][1]} px · BCpl8s.ca / Christopher John Garrish and credited contributors</figcaption></figure>
<p class="hash">Original SHA-256: <code>{specimen['sha256']}</code> · matches the recovered report.</p>
<details><summary>All six individual occurrences · shape comparison</summary>{''.join(panels)}</details>
<details><summary>Whole-serial placement and registration limits</summary>{placement_html}</details></section>''')

for key, bodies in contact.items():
    combined=''.join(f'<g transform="translate(0 {i*HEIGHT})">{body}</g>' for i,body in enumerate(bodies))
    (OUT / f'{key}-overview.svg').write_text(svg_document(combined, WIDTH, len(bodies)*HEIGHT, f'{key}: every changed occurrence, source / previous / current'))

summary = dict(schema='plateforge.passenger-reconstruction-comparisons/v1',generated='2026-11-08',specimens=5,occurrences=len(comparison_records),changedOccurrences=sum(r['changed'] for r in comparison_records),independentHoldouts=0,sourceHashesVerified=True,shapeAlignment='uniform actual ink-height and centre; width is never fitted independently',placementAlignment='single physical-shell homography where corners are sufficiently visible; otherwise withheld',comparisons=comparison_records)
(OUT/'manifest.json').write_text(json.dumps(summary,indent=2)+'\n')
(STUDY/'comparisons.json').write_text(json.dumps(summary,indent=2)+'\n')

css='''*{box-sizing:border-box}body{margin:0;background:#eef4f5;color:#183747;font:16px/1.55 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:32px 24px 70px}h1{font-size:clamp(28px,4vw,43px);line-height:1.12;margin:15px 0}h2{font-size:24px;line-height:1.25}h2 small{display:block;font:14px/1.7 ui-monospace,monospace;color:#506a79}a{color:#006c7a}nav{display:flex;gap:20px;flex-wrap:wrap}header,section{background:white;border:1px solid #cbdcde;border-radius:12px;padding:25px;margin:24px 0}p{max-width:85ch}figure{margin:20px 0;background:#f4f8f8;border-radius:6px;overflow:hidden}figure img{display:block;max-width:100%;height:auto;margin:auto}figcaption{font-size:13px;color:#4d6573;padding:9px 12px}.source img{max-height:460px}.hash{font-size:12px;overflow-wrap:anywhere}details{border-top:1px solid #ccdadd;margin-top:20px;padding-top:14px}summary{cursor:pointer;font-weight:700}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #d7e2e4;padding:10px;text-align:left;vertical-align:top}.stats{display:flex;gap:20px;flex-wrap:wrap;font-weight:700;color:#006a77}.notice{border-left:4px solid #c17e13;padding:7px 15px;background:#fff7e7}.legend{font-size:14px}.orange{color:#b86209}.magenta{color:#b52d63}.teal{color:#007b87}code{font:12px ui-monospace,monospace}@media(max-width:600px){main{padding:16px 10px}header,section{padding:17px}table{font-size:12px}th,td{padding:7px}.stats{gap:12px}}'''
page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BC passenger glyph reconstruction · November 8</title><style>{css}</style></head><body><main>
<nav><a href="../bc-font-audit/">Grouped review queue</a><a href="../bc-font-comparisons/die-grouping/">Category catalogue</a><a href="../bc-font-reconstruction-archive/">Recovered November 7 report</a></nav>
<header><p>PLATEFORGE · SOURCE COMPARISONS · 2026-11-08</p><h1>Passenger U, Y, Z and rounded N joins</h1><p>Three recovered vector paths and two newly recreated masters, each compared with the credited source photograph and the preceding application geometry.</p><p class="stats"><span>5 masters</span><span>5 source plates</span><span>30 character occurrences</span><span>0 independent holdouts</span></p>
<p class="notice">The original commits and implementation modules were unavailable. U/Y/Z path coordinates were recovered exactly from the report's embedded SVGs. The N paths are new November 8 recreations informed by the original photos; they are not asserted to reproduce the lost N coordinates. All original-photo hashes match the report.</p>
<table><thead><tr><th>Master</th><th>Application scope</th><th>Evidence and uncertainty</th></tr></thead><tbody><tr><td>U / Y / Z</td><td>Ordinary 2025 passenger, Waldale</td><td>One small photograph per letter; U/Z perspective remains unresolved. Exact recovered path does not establish historical tooling.</td></tr><tr><td>Astrographic 3 N</td><td>Ordinary 1985 passenger, selected type 3</td><td>One N in NJB-300. New clean curved inner joins; 45.938-unit outer width retained from prior research master.</td></tr><tr><td>Classic 4 N</td><td>Ordinary 1985 and selected 2001 passenger Classic</td><td>Both Ns from NPN-030 retained. New wider/lighter master; 49.062-unit outer width retained. The 2001 application has no additional N specimen here.</td></tr></tbody></table>
<p>Every changed glyph retains its preceding advance in the active production/research mode. Digit and neighbouring-letter paths are unchanged. Other plate classes retain their previous geometry even when their serials borrow a passenger research pool.</p>
<p class="legend"><span class="orange">Orange: previous production</span> · <span class="magenta">Magenta: previous research</span> · <span class="teal">Teal: current research mode</span>. Shape panels match actual ink height and centre uniformly. Width differences remain visible. Placement panels use one whole-plate transform; no per-character adjustment.</p></header>
<section><h2>The changed occurrences</h2><p>The six panels include all three photographed Ns. The modern image-plane comparisons preserve unresolved foreshortening; both N photographs are rectified using visible shell edges. Changes target intended bowl/fork/join construction, not paint chips, embossing highlights or wear.</p><figure><img src="modern-overview.svg" alt="U Y Z source and previous/current overlays"/><figcaption><a href="modern-overview.png">Open the U/Y/Z comparison as a 1200-pixel PNG</a></figcaption></figure><figure><img src="n-overview.svg" alt="Three N occurrences with source and previous/current overlays"/><figcaption><a href="n-overview.png">Open the N comparison as a 1200-pixel PNG</a></figcaption></figure></section>
{''.join(sections)}
<section><h2>What remains open</h2><p>Independent U/Y/Z and N specimens are still needed. These changes do not settle the Astrographic 3 waist and terminals, 6/9 terminals, K joins, overall cap height or block spacing, and do not validate entire alphabets. The previous six-family report remains available as an explicitly dated archive.</p><p>Source photos: BCpl8s.ca / Christopher John Garrish and credited contributors. Original owners retain their rights. Source URLs, hashes, crop rectangles, inferred corners, recovery evidence and reproducible generators are recorded in the repository study directory.</p><p><a href="manifest.json">Fresh comparison inventory</a> · <a href="../bc-font-reconstruction-archive/">Archived evidence and previous findings</a></p></section></main></body></html>'''
(OUT/'index.html').write_text(page)
summary['sourceLedgerSha256'] = hashlib.sha256((STUDY/'sources.json').read_bytes()).hexdigest()
summary['renderedSha256'] = hashlib.sha256((STUDY/'rendered.json').read_bytes()).hexdigest()
summary['assets'] = [dict(path=str(path.relative_to(OUT)), sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    for path in sorted(OUT.rglob('*')) if path.is_file() and path.suffix in ['.svg','.webp','.html']]
(OUT/'manifest.json').write_text(json.dumps(summary,indent=2)+'\n')
(STUDY/'comparisons.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k not in ['comparisons','assets']}))
