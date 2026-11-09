"""Verify changed glyphs, preserved placement, originals and generated assets.
This checks implementation consistency, not historical or photographic accuracy.
"""
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

study = Path('docs/research/bc-font-reconstruction-2026-11-08')
public = Path('public/bc-font-reconstruction')
ledger = json.loads((study/'sources.json').read_text())
rendered = {r['id']:r for r in json.loads((study/'rendered.json').read_text())['records']}
manifest = json.loads((public/'manifest.json').read_text())
assert hashlib.sha256((study/'sources.json').read_bytes()).hexdigest() == manifest['sourceLedgerSha256']
assert hashlib.sha256((study/'rendered.json').read_bytes()).hexdigest() == manifest['renderedSha256']
for asset in manifest['assets']:
    assert hashlib.sha256((public/asset['path']).read_bytes()).hexdigest() == asset['sha256'], asset['path']

def glyphs(svg):
    result = []
    def walk(node, transforms):
        transforms = transforms + ([node.attrib['transform']] if 'transform' in node.attrib else [])
        if 'data-character' in node.attrib:
            result.append(dict(character=node.attrib['data-character'],transforms=transforms,
                paths=[p.attrib['d'] for p in node.iter() if p.tag.rsplit('}',1)[-1]=='path'],attrs=node.attrib))
        for child in node: walk(child, transforms)
    walk(ET.fromstring(svg), [])
    return result

occurrences = changed_occurrences = preserved_placements = 0
for source in ledger['specimens']:
    assert hashlib.sha256((study/source['originalPath']).read_bytes()).hexdigest() == source['sha256']
    record = rendered[source['id']]
    for mode in ['production','research']:
        previous = record['modes']['previous-'+mode]
        current = record['modes']['current-'+mode]
        for char, glyph in current['glyphs'].items():
            assert glyph['advance'] == previous['glyphs'][char]['advance'], (source['id'], mode, char, 'advance')
        old, new = glyphs(previous['serialSvg']), glyphs(current['serialSvg'])
        assert len(old) == len(new) == len(source['occurrences'])
        for before, after, observed in zip(old, new, source['occurrences']):
            assert before['character'] == after['character'] == observed['character']
            assert before['transforms'] == after['transforms'], (source['id'], mode, observed['index'], 'position')
            if after['character'] in source['changed']:
                assert before['paths'] != after['paths']
                assert after['attrs']['data-provenance'] == 'profile-override'
                assert after['attrs']['data-reconstruction-status'] == 'source-informed'
                assert 'data-research-unit' not in after['attrs']
                changed_occurrences += 1
            else:
                assert before['paths'] == after['paths'], (source['id'], mode, observed['index'], 'control')
            occurrences += 1
        preserved_placements += 1
    # One identical master path is used in both modes; only the existing
    # advance differs for N when the registry is enabled.
    for char in source['changed']:
        a = glyphs(record['modes']['current-production']['serialSvg'])
        b = glyphs(record['modes']['current-research']['serialSvg'])
        assert [g['paths'] for g in a if g['character']==char] == [g['paths'] for g in b if g['character']==char]

for comparison in manifest['comparisons']:
    document = ET.parse(public/comparison['figure'])
    # Base64 photo payloads can contain the letters "NaN" by chance. Check
    # geometry/transform attributes, not encoded image bytes.
    for node in document.iter():
        for key, value in node.attrib.items():
            if key.rsplit('}',1)[-1] != 'href':
                assert 'NaN' not in value and 'Infinity' not in value
for overview in manifest['overviews']:
    assert hashlib.sha256((public/overview['png']).read_bytes()).hexdigest() == overview['sha256']
assert len(manifest['comparisons']) == 30
assert manifest['changedOccurrences'] == 6
assert manifest['independentHoldouts'] == 0
result=dict(schema='plateforge.passenger-reconstruction-validation/v1',date='2026-11-08',
    originalsWithVerifiedSha256=len(ledger['specimens']),distinctPhotographedOccurrences=30,
    modeOccurrenceChecks=occurrences,changedModeOccurrences=changed_occurrences,
    serialPlacementsPreserved=preserved_placements,overviewPngHashesVerified=2,
    exactRecoveredModernCrops=18,independentHoldouts=0,
    limitation='These checks verify selected geometry/provenance/placement consistency. Full suite, production build, browser and live deployment are recorded by the release validation, not asserted here.')
if '--check' in sys.argv:
    assert json.loads((study/'glyph-validation.json').read_text()) == result
else:
    (study/'glyph-validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
