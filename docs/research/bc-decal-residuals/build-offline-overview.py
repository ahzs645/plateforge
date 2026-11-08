"""Build the self-contained report narrative from the authored local Markdown.

The small renderer below handles only the headings, tables, paragraphs, lists
and code fences used by these three authored documents. Images are embedded by
the parent report exporter through its explicit figure configuration.
"""
import base64
import html
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def inline(text):
    text = html.escape(text)
    def link(match):
        label, target = match.groups()
        if target.startswith(('https://', 'http://')):
            return '<a href="' + target + '" target="_blank" rel="noopener">' + label + '</a>'
        targets = {'case-ledger.csv': 'ledgerLink', 'validation.json': 'validation-download',
                   'METHOD.md': 'method-details', 'modern/source-ledger.csv': 'modern-source-ledger',
                   'province-placement/retained-case-decisions.csv': 'retained-28',
                   '../../../public/bc-decal-residuals/index.html': 'caseTitle'}
        return '<a href="#' + targets[target] + '">' + label + '</a>' if target in targets else label
    text = re.sub(r'(?<!!)\[([^\]]+)\]\(([^)]+)\)', link, text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)


def markdown(path):
    lines = path.read_text().splitlines()
    output, index = [], 0
    while index < len(lines):
        line = lines[index]
        if not line.strip() or line.startswith('!['):
            index += 1
            continue
        if line.startswith('```'):
            index += 1
            code = []
            while index < len(lines) and not lines[index].startswith('```'):
                code.append(lines[index]); index += 1
            output.append('<pre><code>' + html.escape('\n'.join(code)) + '</code></pre>')
            index += 1
            continue
        heading = re.match(r'^(#{1,6}) (.*)', line)
        if heading:
            level = min(len(heading[1]) + 1, 6)
            output.append(f'<h{level}>' + inline(heading[2]) + f'</h{level}>')
            index += 1
            continue
        if line.startswith('|'):
            table = []
            while index < len(lines) and lines[index].startswith('|'):
                cells = [cell.strip() for cell in lines[index].strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', cell.replace(' ', '')) for cell in cells):
                    table.append(cells)
                index += 1
            output.append('<div class="tablewrap"><table><thead><tr>' + ''.join('<th>' + inline(cell) + '</th>' for cell in table[0]) + '</tr></thead><tbody>')
            for row in table[1:]:
                output.append('<tr>' + ''.join('<td>' + inline(cell) + '</td>' for cell in row) + '</tr>')
            output.append('</tbody></table></div>')
            continue
        item = re.match(r'^(?:([-*])|\d+\.) (.*)', line)
        if item:
            tag = 'ul' if item[1] else 'ol'; output.append('<' + tag + '>')
            while index < len(lines):
                item = re.match(r'^(?:([-*])|\d+\.) (.*)', lines[index])
                if not item: break
                output.append('<li>' + inline(item[2]) + '</li>'); index += 1
            output.append('</' + tag + '>')
            continue
        paragraph = []
        while index < len(lines) and lines[index].strip() and not lines[index].startswith(('#', '|', '```', '![')):
            if re.match(r'^(?:[-*]|\d+\.) ', lines[index]): break
            paragraph.append(lines[index]); index += 1
        output.append('<p>' + inline(' '.join(paragraph)) + '</p>')
    return '\n'.join(output)


def download(identifier, title, relative, mime='application/json'):
    path = HERE / relative
    value = base64.b64encode(path.read_bytes()).decode('ascii')
    return '<li><a id="' + identifier + '" download="' + path.name + '" href="data:' + mime + ';base64,' + value + '">' + html.escape(title) + '</a></li>'


overview = '''<section class="panel"><h2>Second-pass results</h2>
<p><strong>38 catalogue variants updated · 23 of the 28 previously retained references now have bounded corrections · all 68 references remain reviewable.</strong></p>
<p>The report compares the complete first-pass implementation with the revised renderer. The 1999 MAY and 1983 JUN proportions improve substantially; 2004 receives a broader year; later modern years, selected month spacing, province lettering, older controls and substrate silhouettes receive separate evidence-based corrections.</p>
<p>Open the findings or method below, then use the family selector, Before/After capture selector, opacity slider and blink control. The images, SVG downloads, metadata and ledgers are embedded. Original-source links remain available for attribution.</p>
<p class="note"><strong>Verification:</strong> all 1,969 application tests, the production build, 572 family paint-bound checks and 69 exact application selections pass. Browser interaction/export checks remain unexecuted because of the environment restriction. This is a local implementation; no GitHub publication or deployment is claimed.</p>
<p><a id="ledgerLink" download="BC_Decal_Correction_Ledger.csv">Download the complete 68-case ledger</a>. Controls preserve their exact text, including leading zeroes.</p>
<details><summary>Read the complete findings and implementation decisions</summary>''' + markdown(HERE / 'README.md') + '''</details>
<details id="method-details"><summary>Walk through the font, spacing, width and placement method</summary>''' + markdown(HERE / 'METHOD.md') + '''</details>
<details><summary>Evidence inventories, validation and source credits</summary><p>Detailed reproducible scripts and all research crops accompany the repository bundle. These key inventories are also embedded here:</p><ul>'''
overview += download('validation-download', 'Final validation and provenance', 'validation.json')
overview += download('modern-source-ledger', 'Modern source ledger: all 60 original files', 'modern/source-ledger.csv', 'text/csv')
overview += download('retained-28', 'Individual decisions for the 28 retained references', 'province-placement/retained-case-decisions.csv', 'text/csv')
overview += download('lettering-sources', 'Focused lettering source provenance', 'lettering/source-provenance.json')
overview += download('modern-corrections', 'Supplemental input correction log', 'modern/input-corrections.json')
overview += download('integration-corrections', 'Family-check failures and their resolved corrections', 'integration-corrections.json')
overview += '</ul>' + markdown(HERE / 'province-placement/source-credits.md')
overview += '''<p>Additional source attribution: enlarged modern 2020–2022 photographs by D5e58, CC BY-SA 4.0; the focused July 1983 and January 1999 photographs by Jerry Woody, CC BY-SA 2.0. Source-derived crops, masks and overlays retain those credits and licences. Original BCpl8s photographs retain their respective source rights. The independently authored vector constructions are documented separately.</p></details></section>'''
(HERE / 'offline-overview.html').write_text(overview)

figures = [
    ('1983 JUN, 1999 MAY and 2004 year construction', 'lettering/shape-comparison.png', 'Original BCpl8s crops and equal-painted-height overlays. Magenta is source-only ink, blue model-only ink, and dark their overlap. Widths are preserved; ratios are not accuracy scores.'),
    ('Later modern year shapes and advances', 'modern/late-year-candidate-summary.png', 'Actual registered profiles compared at equal painted height. The repeated photographs support a separate later printing group; fine 3/9 details remain limited.'),
    ('Modern JAN: measured pair gaps, retained contours', 'lettering/modern-jul-review/jan-review/before-after.png', 'Native font substitution was rejected on the A counter and J/N proportions. Exact JAN variants receive observed spacing and uniform registration; residual letter shapes remain visible.'),
    ('2021 JUL: native Anton and observed pair spacing', 'lettering/modern-jul-review/before-after.png', 'Three existing JUL photographs corroborate the direction of the change. Production scope is exact 2021 JUL. The native L foot remains short and the J hook slightly high.'),
    ('Wide 1981–1982 province capitals', 'province-placement/proof/1981-oct-shape-proof.png', 'Larger 1981 OCT photograph by Jerry Woody, CC BY-SA 2.0. The independently authored fixed-word alphabet is limited to twelve observed capitals; fine print spread remains approximate.'),
    ('Tall 2010–2013 province capitals', 'province-placement/proof/2012-aug-shape-proof.png', 'Larger 2012 AUG photograph by PartColumbia, CC BY-SA 4.0. Original photo tilt remains; the remaining whole-word width difference is not hidden by horizontal scaling.'),
    ('1990 control placement: complete composition', 'province-placement/proof/1990-proof.png', 'The exact JAN control moves down and slightly left. Source, before/after and painted bounds are retained together; this does not establish the position of every other month.'),
    ('Photographic colour variation and the retained palette', 'material/colour-observations.png', 'Explicit substrate patches from the enlarged 2015 and November 2017 BCpl8s photographs. Pixel colours vary within each source; these are decoded photographic values, not calibrated physical colour specifications.'),
]
configuration = {'title': 'BC decal corrections — second overlay review',
                 'overviewFile': str((HERE / 'offline-overview.html').relative_to(ROOT)),
                 'figures': [{'title': title, 'path': str((HERE / relative).relative_to(ROOT)), 'caption': caption}
                             for title, relative, caption in figures]}
(HERE / 'offline-configuration.json').write_text(json.dumps(configuration, indent=2) + '\n')
print(json.dumps({'overviewBytes': len(overview.encode()), 'figures': len(figures)}))
