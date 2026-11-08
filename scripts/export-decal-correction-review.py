#!/usr/bin/env python3
"""Package the reviewed gallery as a self-contained, offline analysis document.

Images and SVGs are copied byte-for-byte into data URLs. A requested overlay
download is composed in the browser from the original aligned PNGs. All 68
comparisons remain available without copying the entire repository.
"""
import argparse
import base64
import html
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]


def data_url(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Expected one viewer fragment: ' + old[:90])
    return text.replace(old, new, 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    gallery = ROOT / 'public/bc-decal-corrections'
    report = ROOT / 'docs/research/bc-decal-corrections'
    metadata = json.loads((gallery / 'render-metadata.json').read_text())
    validation = json.loads((report / 'validation.json').read_text())
    document = (gallery / 'index.html').read_text()
    assets = {}
    for row in metadata['specimens']:
        prefix = 'evidence/' + row['id'] + '/'
        for name in ('source-aligned.png', 'before-aligned.png', 'after-aligned.png'):
            assets[prefix + name] = data_url(gallery / (prefix + name), 'image/png')
        for name in ('before.svg', 'after.svg'):
            assets[prefix + name] = data_url(gallery / (prefix + name), 'image/svg+xml')

    overview = '''<section class="panel"><h2>Implemented corrections</h2>
<p><strong>25 catalogue variants affected · 31 visibly changed comparison pairs · all 68 references retained for review.</strong> Seven unaffected EXPO selections inherit the corrected profile with identical used contours. The ledger distinguishes 38 references under changed code, two evidence-only cases and 28 retained references.</p>
<div class="tablewrap"><table><thead><tr><th>Batch</th><th>Concrete changes</th></tr></thead><tbody>
<tr><td>1. Evidence</td><td>Corrected 1977, thick-border 1999 and January 2017 bindings; strict audit inputs; rejected invalid segmentation; complete clean baseline and verified crop hashes.</td></tr>
<tr><td>2. Geometry and ink</td><td>Dark 1984 control; concentric rounded double outlines; 1983 margin; 2004 composition; corrected the older renderer path that ignored barcode layout.</td></tr>
<tr><td>3. Lettering</td><td>Observed 1972 7/2; EXPO P/R/T/V repair; separate modern year/control profiles; exact MAY fitting; lighter 2008 AUG/08; 2011 placement and 2013 OCT reconstruction.</td></tr>
<tr><td>4. Verification</td><td>All nine family sheets inspected; all 572 selectable catalogue/month combinations pass paint bounds; application tests and build pass locally. Browser/export CI awaits publication authorization.</td></tr>
</tbody></table></div>
<h3>How to assess each correction</h3>
<ol><li><strong>Bind the exact specimen.</strong> Check year/variant, month, control, source pixels and crop hash.</li>
<li><strong>Isolate each printed role.</strong> Separate month, year, province, control, border and barcode before measuring.</li>
<li><strong>Compare shape at equal painted height.</strong> Preserve width; examine counters, stems, shoulders and repeated occurrences.</li>
<li><strong>Adjust supported spacing, then placement.</strong> Keep glyph contours, pair spacing, cap height, anchor and baseline as separate decisions. A maximum-width setting may shrink the whole word.</li>
<li><strong>Recheck the family and exports.</strong> Inspect adjacent months and all repeated glyphs; treat passing geometry tests as a functional check, not a photographic accuracy score.</li></ol>
<p><strong>Important findings:</strong> 2011 MAY already had a close shape, so it was moved rather than redrawn. Thick-border 1999 MAY still has about 7.6% excess width at equal height. Independent EXPO measurement supported retaining the supplied logo master.</p>
<p><strong>Remaining work:</strong> some older control/province placement, 1983 JUN proportions, 2004 fine detail, lower-confidence modern numerals, tiny province forms, and retained 2018–2022 positions remain approximate. Colours and physical edge treatment are not calibrated.</p>
<p><strong>Validation:</strong> 1,966 application tests passed in three disjoint runs without reducing sample counts; 28 focused audit checks passed; the production build and all 572 Inkscape paint-bound checks passed. The broad local test invocation encountered a killed worker, so the complete generated-format test file was re-run in two disjoint groups.</p>
<p class="note"><strong>Publication / browser status:</strong> Automatic approval rejected publishing the prepared branch and generated evidence assets to GitHub without explicit authorization. The four commits remain local, and no PR or deployment is claimed. Local Chromium is also blocked by its socket restriction. Browser/export tests are prepared but are not reported as executed.</p>
<p><a id="ledgerLink" download="BC_Decal_Correction_Ledger.csv">Download the complete case ledger</a>. Control values are exact strings, including leading zeroes. All comparisons below work offline.</p></section>'''
    figures = [
        ('Modern years and controls', ROOT / 'docs/research/bc-modern-numerals/shape-comparison.png',
         'Magenta is source-only ink, blue is model-only ink, and dark is overlap. Equal-height ratios describe width only. Source slope explains part of the remaining 2015 control-run discrepancy.'),
        ('Observed MAY construction and spacing', ROOT / 'docs/research/bc-modern-numerals/bordered-may-shapes.png',
         'The two references are assessed separately. The 1999 residual is retained rather than hidden by shrinking the complete word.'),
        ('Integrated 2008, 2011 and 2013', ROOT / 'docs/research/bc-late-two-digit-printing/integrated/comparison.png',
         'Actual integrated renderer output with the exact photographed controls. The model uses portable vector paths; source perspective and colour uncertainty remain visible.'),
    ]
    figures_html = '<section class="panel"><h2>Focused comparisons</h2>'
    for title, path, caption in figures:
        figures_html += '<details><summary>' + html.escape(title) + '</summary><img style="display:block;width:100%;height:auto;margin-top:16px" src="' + data_url(path, 'image/png') + '" alt="' + html.escape(title) + '"><p class="muted">' + html.escape(caption) + '</p></details>'
    figures_html += '</section>'
    document = replace_once(document, '<h1>Source, baseline and correction overlays</h1>', '<h1>BC decal corrections and overlay review</h1>' + overview + figures_html)
    payload = json.dumps(assets, separators=(',', ':'))
    document = replace_once(document, '<script id="data"', '<script id="assets" type="application/json">' + payload + '</script><script id="data"')
    document = replace_once(document, "function provenanceText(label,p)", "const assets=JSON.parse(document.getElementById('assets').textContent),asset=name=>assets[name]||name;\nfunction provenanceText(label,p)")
    document = replace_once(document, "$('sourceLayer').src=base+'source-aligned.png';", "$('sourceLayer').src=asset(base+'source-aligned.png');")
    document = replace_once(document, "$('modelLayer').src=base+$('capture').value+'-aligned.png';", "$('modelLayer').src=asset(base+$('capture').value+'-aligned.png');")
    document = replace_once(document, "$(key).src=base+key+'.png';", "$(key).src=asset(base+key+'-aligned.png');")
    document = replace_once(document, "$('beforeDownload').href=base+'before.svg';", "$('beforeDownload').href=asset(base+'before.svg');$('beforeDownload').download=r.id+'-before.svg';")
    document = replace_once(document, "$('afterDownload').href=base+'after.svg';", "$('afterDownload').href=asset(base+'after.svg');$('afterDownload').download=r.id+'-after.svg';")
    document = replace_once(document, "$('overlayDownload').href=base+'after-overlay.png';", "$('overlayDownload').href='#';")
    document = replace_once(document, 'href="render-metadata.json"', 'href="' + data_url(gallery / 'render-metadata.json', 'application/json') + '"')
    start = document.index('for(const sheet of data.contactSheets)')
    end = document.index('repopulate();', start) + len('repopulate();')
    document = document[:start] + '''for(const sheet of data.contactSheets){const button=document.createElement('button');button.textContent=sheet.title+' · '+sheet.specimens+' comparisons';button.onclick=()=>{$('family').value=sheet.family;repopulate();$('caseTitle').scrollIntoView({behavior:'smooth'});};$('sheets').append(button);}repopulate();
$('overlayDownload').onclick=async event=>{event.preventDefault();const r=rows[index],prefix='evidence/'+r.id+'/',source=new Image(),model=new Image();source.src=asset(prefix+'source-aligned.png');model.src=asset(prefix+'after-aligned.png');await Promise.all([source.decode(),model.decode()]);const canvas=document.createElement('canvas');[canvas.width,canvas.height]=r.alignment.canvasPixels;const context=canvas.getContext('2d');context.drawImage(source,0,0);context.globalAlpha=.5;context.drawImage(model,0,0);const link=document.createElement('a');link.href=canvas.toDataURL('image/png');link.download=r.id+'-after-overlay.png';link.click();};
''' + document[end:]
    document = document.replace('<h2>Family contact sheets</h2>', '<h2>Explore all nine families</h2>')
    ledger_url = data_url(report / 'case-ledger.csv', 'text/csv')
    document = replace_once(document, '<a id="ledgerLink" download=', '<a id="ledgerLink" href="' + ledger_url + '" download=')
    document = document.replace('<title>BC decal correction overlays</title>', '<title>BC decal corrections — implementation and overlays</title>')
    output = args.output / 'BC_Decal_Corrections_Review.html'
    output.write_text(document)
    shutil.copyfile(report / 'case-ledger.csv', args.output / 'BC_Decal_Correction_Ledger.csv')
    scripts = re.findall(r'<script>(.*?)</script>', document, re.S)
    if len(scripts) != 1:
        raise ValueError('Expected one executable viewer script')
    (args.output / 'viewer-syntax-check.js').write_text(scripts[0])
    print(json.dumps({'file': str(output), 'references': len(metadata['specimens']), 'embeddedAssets': len(assets),
                      'bytes': output.stat().st_size, 'browserStatus': validation['browserVerification']['status']}))


if __name__ == '__main__':
    main()
