#!/usr/bin/env python3
"""Summarize occurrences without counting repeated digits as photographs."""
from pathlib import Path
import json,hashlib
from collections import Counter
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3]
inventory=json.loads((HERE/'source-inventory.json').read_text());sources={r['file']:r for r in inventory['sources']}
small=json.loads((HERE/'year-occurrence-metrics.json').read_text());large=json.loads((HERE/'enlarged-occurrence-metrics.json').read_text())
observations=[]
for r in small['records']:
 for o in r['occurrences']:observations.append({'source':r['sourceFile'],'role':'year','group':sources[r['sourceFile']]['printingGroup'],'glyph':o['character'],'height':o['paintedPixels'][1]})
for r in large:
 for o in r['occurrences']:observations.append({'source':r['sourceFile'],'role':r['role'],'group':'later modern 2019–2023','glyph':o['character'],'height':o['sourcePaintedPixels'][1]})
matrix=[]
for role,group in sorted({(o['role'],o['group'])for o in observations}):
 for char in '0123456789':
  occ=[o for o in observations if(o['role'],o['group'],o['glyph'])==(role,group,char)]
  if not occ:continue
  paths=sorted({o['source']for o in occ})
  matrix.append({'role':role,'printingGroup':group,'glyph':char,'occurrences':len(occ),'photographs':len(paths),'newToCanonicalCataloguePhotographs':sum(sources[p]['independentOfCanonicalCatalogue']for p in paths),'sourcePaintedHeightRange':[min(o['height']for o in occ),max(o['height']for o in occ)],'sources':paths})
coverage={'schema':'plateforge.modern-glyph-coverage/v1','downloadedFiles':inventory['downloadedFiles'],'uniqueDownloadedHashes':inventory['uniqueDownloadedHashes'],'canonicalDuplicateFiles':inventory['canonicalDuplicateFiles'],'newIndependentOfCanonicalCatalogueFiles':inventory['newIndependentOfCanonicalCatalogueFiles'],'acceptedSmallYearPhotographs':len(small['records']),'acceptedEnlargedPhotographs':len({r['id']for r in large}),'acceptedEnlargedRoleCrops':len(large),'rejectedSmallYearPhotographs':small['rejected'],'rejectedEnlargedRoleCrops':json.loads((HERE/'enlarged-rejections.json').read_text()),'yearOccurrences':sum(o['role']=='year'for o in observations),'controlOccurrences':sum(o['role']=='control'for o in observations),'matrix':matrix,'counting':'Photograph counts are per row and overlap across digits; do not sum them. A repeated digit adds an occurrence, not a new specimen. Seven downloaded catalogue originals duplicate canonical references, so 60 files are not 60 new specimens. Previous enlarged 2015/2017 evidence is retained in docs/research/bc-modern-numerals and is additional to this supplemental inventory.'}
(HERE/'glyph-coverage.json').write_text(json.dumps(coverage,indent=2)+'\n')
corrections=[]
for r in inventory['sources']:
 if r.get('captionOrFilenameMismatch'):corrections.append({'sourceId':r['id'],'kind':'source caption/filename mismatch','observedYear':r['observedYear'],'observedMonth':r['observedMonth'],'observedControl':r['observedControl'],'notes':r['captionOrFilenameNotes'],'sourceSha256':r['sourceSha256']})
 if r.get('auditInputCorrection'):corrections.append({'sourceId':r['id'],'kind':'preliminary audit transcription corrected','sourceSha256':r['sourceSha256'],**r['auditInputCorrection'],'effects':'Control comparison labels/masks regenerated; year-profile contours and retained control outlines unchanged.'})
(HERE/'input-corrections.json').write_text(json.dumps(corrections,indent=2)+'\n')
provenance={'stage':'Modern year-profile and original specimen-placement stage; separately reviewed month-role follow-ups are composed by the parent integration review.','followUpEvidence':['../lettering/modern-jul-review/proposal.json','../lettering/modern-jul-review/jan-review/proposals.json'],'productionProfiles':['bc-decal-print-modern-year-reconstruction','bc-decal-print-modern-late-year-reconstruction','bc-decal-print-modern-control-reconstruction'],'newProfileFile':'src/templates/dies/decal-modern-late-printing.json','newProfileSha256':hashlib.sha256((ROOT/'src/templates/dies/decal-modern-late-printing.json').read_bytes()).hexdigest(),'sourceInventorySha256':hashlib.sha256((HERE/'source-inventory.json').read_bytes()).hexdigest(),'authorship':'Independent smooth constructions in cap units; 2 retains the earlier authored contour but uses the later observed advance. No x-only font scaling, scan tracing, automatic contour fitting or synthetic ink stroke. Historical font and manufacturer identity unknown.','retainedInThisStageContours':['early year 0–9','all modern control contours','all modern month contours','all modern province contours'],'newLateProfileGlyphs':['0','1','2','3','9'],'application':'2019–2023 fixed years. 2018 retains the early profile because later replacement variants are not safely inferable from expiry month. Exact-month placement changes only for 2018 JAN, 2019 JAN, 2020 JAN, 2021 JUL, 2022 MAR.','shapeRegistration':'Each occurrence normalized uniformly to painted height and centered; its native width remains visible. No homography/perspective rectification. Threshold sensitivity ±8, minimum contrast 25, component count and clipping validated.','photoLicensing':'Commons originals and derivative crops/masks/figures: D5e58, CC BY-SA 4.0. BCpl8s catalogue images are credited research references; no reusable photo licence was located. Independently authored vector code is separate from photographic derivatives.'}
(HERE/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(json.dumps({k:v for k,v in coverage.items()if k not in ['matrix','counting']}))
