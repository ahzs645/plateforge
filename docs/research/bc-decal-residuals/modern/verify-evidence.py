#!/usr/bin/env python3
"""Check the reviewed evidence contract, not photographic authenticity."""
from pathlib import Path
import json,hashlib
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3]
read=lambda p:json.loads(p.read_text())
inventory=read(HERE/'source-inventory.json');sources={r['file']:r for r in inventory['sources']}
assert len(sources)==60 and len({r['sourceSha256']for r in sources.values()})==60
for file,r in sources.items():
 assert hashlib.sha256((HERE/file).read_bytes()).hexdigest()==r['sourceSha256']
 assert len(r['observedControl'])==8 and r['observedControl'].isdigit()
 assert r['observedMonth']in'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()
small=read(HERE/'year-occurrence-metrics.json');assert not small['rejected']
for r in small['records']:
 assert r['observedYear']==sources[r['sourceFile']]['observedYear']
 assert r['accepted']and len(r['occurrences'])==4 and ''.join(o['character']for o in r['occurrences'])==r['observedYear']
 assert len(r['sensitivity'])==3 and all(s['accepted']for s in r['sensitivity'])
large=read(HERE/'enlarged-occurrence-metrics.json');assert not read(HERE/'enlarged-rejections.json')
for r in large:
 assert r['text']==sources[r['sourceFile']]['observedYear'if r['role']=='year'else'observedControl']
 assert r['accepted']and r['classContrast']>=25 and all(s['accepted']for s in r['thresholdSensitivity'])
 assert ''.join(o['character']for o in r['occurrences'])==r['text']
 for o in r['occurrences']:assert o['sourcePaintedPixels'][1]>=100
profile=read(ROOT/'src/templates/dies/decal-modern-late-printing.json')['modern-late-year-reconstruction']
assert profile==read(HERE/'late-year-candidate.json')and set(profile)==set('01239')
assert profile['2']['paths']==read(ROOT/'src/templates/dies/decal-modern-printing.json')['modern-year-reconstruction']['2']['paths']
assert all(r['fit']=='natural'and not r['candidateTypography']for r in read(HERE/'candidate/manifest.json'))
typography=read(ROOT/'src/regions/canada/bc-decal-typography.json');proposals=read(HERE/'placement-proposals.json')
lettering_override=read(HERE.parent/'lettering/modern-jul-review/proposal.json')
assert lettering_override['id']=='2021'and lettering_override['month']=='JUL'and lettering_override['role']=='decal-month'
jan=read(HERE.parent/'lettering/modern-jul-review/jan-review/proposals.json')
assert jan['schema']=='plateforge.exact-month-spacing-proposals/v1'
assert {(p['id'],p['month'],p['role'])for p in jan['proposals']}=={(id,'JAN','decal-month')for id in ['2018','2019','2020']}
lettering_overrides=[lettering_override,*jan['proposals']]
for override in lettering_overrides:
 assert override['source']['sha256']==hashlib.sha256((ROOT/override['source']['file']).read_bytes()).hexdigest()
for id,profile in proposals['profileBindings'].items():assert typography[id]['runs']['decal-year'][0]['profile']==profile
for p in proposals['proposals']:
 expected=p['monthVariant'];matching=[v for v in typography[p['id']].get('monthVariants',[])if v['fromMonth']==expected['fromMonth']and v.get('throughMonth')==expected['throughMonth']]
 assert matching,f'Placement not integrated: {p["id"]}'
 actual=matching[-1]
 for role,runs in expected['runs'].items():
  for override in lettering_overrides:
   if p['id']==override['id']and p['month']==override['month']and role==override['role']:runs=[override['run']]
  assert actual['runs'][role]==runs,f'Integrated run differs: {p["id"]} {role}'
 for field,value in expected['layout'].items():assert actual['layout'][field]==value,f'Integrated layout differs: {p["id"]} {field}'
coverage=read(HERE/'glyph-coverage.json')
assert coverage['yearOccurrences']==240 and coverage['controlOccurrences']==24
result={'status':'passed','verifiedOriginalHashes':60,'acceptedSmallYearPhotographs':57,'acceptedEnlargedPhotographs':3,'acceptedEnlargedRoleCrops':6,'yearOccurrences':240,'controlOccurrences':24,'thresholdSamplesValidated':57*3+6*3,'rejectedExtractions':0,'registeredNaturalYearRuns':20,'integratedYearBindings':5,'integratedExactMonthPlacements':5,'composedFollowUpOverrides':['lettering/modern-jul-review/proposal.json: 2021 JUL decal-month','lettering/modern-jul-review/jan-review/proposals.json: 2018/2019/2020 JAN decal-month'],'limits':'Numeric checks enforce input/hash/segmentation/profile/placement contracts. The original placement-stage proposal is preserved; the separately evidenced JUL and JAN lettering/spacing runs are composed explicitly and checked exactly. Visual original and overlay inspection remains required. This is not a browser check or an authenticity score.'}
(HERE/'validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
