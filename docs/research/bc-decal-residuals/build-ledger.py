import csv,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
REPORT=ROOT/'docs/research/bc-decal-residuals'
old=list(csv.DictReader((ROOT/'docs/research/bc-decal-corrections/case-ledger.csv').open()))
refs={r['id']:r for r in json.loads((ROOT/'docs/research/decal-online-analysis/reference-manifest.json').read_text())}
current=json.loads((ROOT/'src/regions/canada/bc-decal-typography.json').read_text())
base=json.loads((ROOT.parent/'plateforge-decal-pass1/src/regions/canada/bc-decal-typography.json').read_text())
retained={r['id']:r for r in json.loads((REPORT/'province-placement/retained-case-decisions.json').read_text())['cases']}
material={r['catalogueId']:r for r in json.loads((REPORT/'material/substrate-decisions.json').read_text())['decisions']}

def semantic(r):
 return {'runs':r['runs'],'layout':r.get('layout'), 'variants':[{'from':v['fromMonth'],'through':v.get('throughMonth',12),'runs':v['runs'],'layout':v.get('layout')}for v in r.get('monthVariants',[])]}
changed={key for key in current if semantic(current[key])!=semantic(base[key])}
extra={
 '1974':'The separately stacked year digits remain approximate.',
 '1978':'The separate B/C and vertical PASS/COMM constructions still need clearer evidence.',
 '1980':'MAR/80 proportions and the long province line remain approximate.',
 '1981':'The retained year candidate still differs in weight and spacing.',
 '1982':'The broad year candidate still differs in proportion and weight.',
 '1985':'Month/year spacing and the faint control remain approximate.',
 '1987':'Month/year widths remain approximate.',
 '1988':'Panel boundaries and the 88 proportions remain approximate.',
 '1989':'Month width and the central province candidate remain approximate.',
 '1990':'JAN/90 and control weight remain approximate despite corrected registration.',
 '1991':'The 91 contours and province spacing remain approximate.',
 '1992':'OCT/92 contours remain approximate.',
 '1993':'Native month/year widths remain approximate.',
 '1994':'OCT/94 proportions remain approximate.',
 '1995':'NOV/95 contours and weight remain approximate.',
 '1996':'MAR/96 proportions remain approximate.',
 '1996-pink':'NOV and year proportions remain approximate.',
 '1997':'NOV/97 proportions remain approximate.',
 '1998':'AUG proportions remain approximate; this is separate from Type II MAY.',
 '2005':'JAN/05 contours remain approximate.',
 '2006':'MAY/06 contours and control baseline/weight remain approximate; the province translation is a family clearance constraint.',
 '2007':'JAN/07 contours remain approximate.',
 '2009':'APR/09 and barcode/control registration retain first-pass differences.',
 '2010':'JAN/10 contours are retained native candidates despite improved cap/placement.',
 '2012':'NOV/12 contours are retained candidates despite improved cap/placement.'
}
latest={
 '1983':('Reconstructed only J/U/N for exact JUN; retained the improved margin and natural fitting.','Equal-height width is now about 0.2% broad, but small unrectified photographs limit fine contours. The faint control remains tentative and excluded from glyph scoring.'),
 '1999':('Separate thick-border 1999 MAY reconstruction with corroborated M/A, authored advances and AY spacing; preserves 1998 Type II.','The primary width now matches closely; threshold variation is about -1.1% to +1.2%. Y has one small source, fine contours remain provisional, and other months retain prior candidates.'),
 '2004':('Broadened the fixed 04 from six photographs; calibrated MAR and added a small non-MAR year clearance translation. Corrected the rounded substrate silhouette.','The primary 04 is about 2.3% narrow; six-source range is about -2.3% to +0.2%. Tiny 5–6 px province masks fail separation/clearance checks and are retained as rejected evidence. Province contours are unchanged; source aspect and physical material remain uncertain.'),
 '2008':('Corrected the approximate rounded substrate silhouette; retained the first-pass native AUG/08 lettering.','A aperture, G terminal, 0 bowl and tiny province width remain approximate. Other month candidates are retained; blurred/cropped edges lower confidence in the radius.'),
 '2011':('Added the limited tall province profile and calibrated the MAY province stack; preserved first-pass month/year/control/barcode. Corrected the square substrate.','The province construction has residual width/print-spread differences; COLUMBIA has a rejected low-threshold trial and its accepted primary extent is approximate. Fine control contours and other-month placement remain provisional.'),
 '2013':('Added the limited tall province profile and calibrated the OCT stack; preserved first-pass OCT/year/control/barcode. Corrected the square substrate.','Small-source and province contour/width differences remain. Other month forms retain their prior candidates.'),
 '2014':('Corroborated the retained year 4 across nine photographs and corrected the square substrate silhouette.','No enlarged year 4 was obtained; fine edges/counter shape remain limited by 53–56 px sources. Tiny vertical province forms and specimen placement remain approximate.'),
 '2015':('Corrected the square substrate silhouette and retained the earlier enlarged-source year/control calibration.','The existing source control slope limits width interpretation. Small province forms, colour and physical dimensions remain uncertain.'),
 '2016':('Corroborated the retained year 6 across eleven photographs and corrected the square substrate silhouette.','No enlarged year 6 was obtained; fine details remain limited by 56–60 px sources. Small province forms and exact specimen registration remain approximate.'),
 '2018':('Retained the corroborated early year profile; corrected exact JAN role/column/footer placement and observed AN spacing.','JAN remains about 5.1% narrow at equal height; A remains narrow. Five early 8 examples support retention; six later 2018 specimens show a distinct unmodeled group. Tiny vertical province contours and other-month placement remain approximate.'),
 '2019':('Used the separate later-year profile and authored advances; corrected exact JAN role/footer placement and JA/AN spacing.','JAN remains about 4.5% narrow; A remains narrow and N broad. Year 9 has eleven small examples but no enlarged example. Small province contours and other-month positions remain approximate.'),
 '2020':('Used the later-year profile; corrected exact JAN role/footer placement and observed JA/AN spacing. Enlarged APR year/control evidence was independently checked.','JAN remains about 2.1% narrow with A/N contour differences. The canonical 00000000 photograph is qualified layout evidence, not proof of normal issuance. Small province contours remain approximate.'),
 '2021':('Used the later-year profile; corrected exact JUL role/footer placement and native Anton JUL with supported JU/UL spacing.','JUL width improves from about 23.0% narrow to 4.3% narrow. Its native L foot is about 15–17% short and J hook slightly high. Small province forms and other-month positions remain approximate.'),
 '2022':('Used the later-year profile; corrected exact MAR role/footer and province-column placement while keeping a visible year right margin.','The source frame is about 4.7% broader; the year deliberately remains about four authored units left of the frame-centred source target. Small province contours and other-month placement remain approximate.'),
 '2023':('Used the later-year 0/1/2/3/9 profile and authored advances within the retained MAR composition.','Year 3 has only one 46 px occurrence. Coarse width/openings improve, but its fine contour remains provisional. Small province forms and colour remain approximate.')
}
rows=[];dispositions={}
for before in old:
 row=before.copy();key=row['id'];cat=row['catalogueId']
 row['firstPassStatus']=before['status'];row['firstPassImplemented']=before['implemented']
 row['status']='updated' if cat in changed else 'reviewed-retained'
 row['implemented']='Retained the first-pass implementation after the complete family review.'
 row['remaining']=before['remaining'];row['reviewedOn']='2026-11-07'
 row['evidence']='README.md; METHOD.md; public/bc-decal-residuals/evidence/'+key
 if key in retained:
  r=retained[key];row['implemented']=r['decision'];row['remaining']=r['remaining'].replace(' Main month/year proportions remain first-pass candidates where this pass changed only secondary printing or placement.','')+' '+extra.get(key,'')
  row['evidence']+='; province-placement/retained-case-decisions.json'
  if key in material:
   edge=material[key];row['implemented']+=' '+('Use an approximate rounded substrate silhouette.'if edge['modelRadiusHeightFraction']else'Use the observed square substrate silhouette.')
 if key in latest:
  row['implemented'],row['remaining']=latest[key]
 if key.startswith('1986'):
  row['implemented']='Retained the first-pass EXPO month reconstruction and supplied logo; all twelve months remain in the regenerated gallery.'
  row['remaining']='Fine print weight and photographic variation remain uncertain. No new EXPO artwork change in this pass.'
 if key in ['2017','2017-jul','2017-nov']:
  row['implemented']='Retained the first-pass early/later 2017 placement and June/July corner boundary; rechecked exact inputs in the regenerated family.'
  row['remaining']='Fine early numeral and vertical province contours remain approximate. The July reference is an official illustration, not an issued photograph; colour is uncalibrated.'
 if key in ['1999-white','2000','2001','2002','2003']:
  row['implemented']='Retained the first-pass independent concentric outline radii and lettering; regenerated the comparison.'
  row['remaining']='Radii, existing lettering and exact physical edge/material properties remain approximate.'
 for field in ['implemented','remaining']:
  for a,b in {'move75':'move 75','wide12':'wide twelve','than1981':'than 1981','than1987':'than 1987','about1':'about 1','roughly1':'roughly 1','about5':'about 5','large2012':'large 2012','Archivo900':'Archivo 900','width75':'width 75'}.items():row[field]=row[field].replace(a,b)
 row['remaining']=row['remaining'].strip()
 assert row['control']==(refs[key]['control'] or '')
 assert row['month']==(refs[key]['month'] or '')
 dispositions[key]={'Status':row['status'],'Implemented in this pass':row['implemented'],'Remaining':row['remaining'],'First-pass status':row['firstPassStatus']}
 rows.append(row)
fields=list(old[0])+['firstPassStatus','firstPassImplemented','evidence']
with (REPORT/'case-ledger.csv').open('w',newline='')as handle:
 writer=csv.DictWriter(handle,fieldnames=fields,lineterminator='\n');writer.writeheader();writer.writerows(rows)
(REPORT/'case-dispositions.json').write_text(json.dumps(dispositions,indent=2)+'\n')
summary={'references':len(rows),'changedCatalogueVariants':len(changed),'changedReferenceCases':sum(r['status']=='updated'for r in rows),'reviewedRetainedCases':sum(r['status']=='reviewed-retained'for r in rows),'firstPassRetainedReferences':len(retained),'formerlyRetainedNowChanged':sum(r['firstPassStatus']=='retained'and r['status']=='updated'for r in rows),'formerlyRetainedStillUnchanged':[r['id']for r in rows if r['firstPassStatus']=='retained'and r['status']!='updated'],'changedIds':sorted(changed)}
(REPORT/'coverage-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
