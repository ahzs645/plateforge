#!/usr/bin/env python3
"""One explicit second-pass decision for each of the 28 first-pass retained cases."""
import csv
import json
import runpy
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
DECISIONS={
'1971':('corrected','Reduce and space the control; move and widen its panel to the observed footprint.','COLUMBIA is clipped at the left photo edge; province glyph contours and emblem/ink appearance remain approximate.'),
'1974':('corrected','Reduce control cap/spacing and calibrate the outlined control panel.','Province and PASSENGER native candidates remain wider than the photograph; the small source does not settle exact capital outlines.'),
'1975':('corrected','Correct control panel/print; reposition the province lines; reduce and move75 uniformly to restore the photographed gap.','Native province/year/control contours remain visual candidates; colour and material are not established.'),
'1976':('corrected','Reduce the oversized control uniformly, refine its spacing, and fit its observed panel.','Small province and class lettering retain native candidates; the source flower is not an exact manufacturing trace.'),
'1978':('retained-with-limits','Retain the present year, vertical class layout, and spaced control after inspection.','B/C shapes and control proportions still differ; the old specimen and small crop do not justify claiming exact contours.'),
'1980':('corrected','Move only the independently inspected MAR unfilled panel; retain the first-pass control position.','The automated control mask touches the box/inspection boundary and is rejected. Control width/weight and exact registration remain unresolved; the diagonal scratch is excluded.'),
'1981':('corrected','Use an independent wide12-capital province profile; calibrate the photographed JUN stack.','Large OCT source supports form/spacing, but fine print spread and the tiny JUN line height remain uncertain; other-month placement is retained.'),
'1982':('corrected','Use the corroborated wide province profile and calibrate the photographed JAN stack.','The larger JUL image is blurrier than 1981; exact fine curves and non-JAN placement remain provisional.'),
'1985':('corrected','Use native Archivo 900 width 75 for the heavier province line and calibrate the JUL line size/location.','Large FEB corroborates the heavy candidate; precise historical font identity and non-JUL positioning remain unconfirmed.'),
'1987':('corrected','Use the heavy native province candidate; correct FEB line size/location and translate its control.','The control still has width/shape differences. Province contours are a visual candidate, not a verified historical typeface.'),
'1988':('corrected','Increase and reposition the DEC province stack while retaining its separate native face.','The larger FEB photo shows different small-letter proportions from 1987; blur prevents replacing the alphabet confidently.'),
'1989':('corrected','Translate the observed APR control up and right.','Other months retain their positions; JUL corroboration shows specimen placement variation, and tiny province letters remain approximate.'),
'1990':('corrected','Lower the JAN control substantially and shift its painted centre slightly left.','An independent JAN specimen also places the control low; this does not establish identical registration for every month/serial.'),
'1991':('corrected','Move the JUN control down and right to its observed painted centre.','The larger JAN specimen places its control much higher, so the JUN adjustment is deliberately month-scoped.'),
'1992':('corrected','Move the OCT control down and left.','The independent DEC photograph is retained as corroboration, not substituted for the pinned OCT control; province contours remain approximate.'),
'1993':('corrected','Move the OCT control down and left without resizing its native glyphs.','A separate JAN specimen confirms that registration can vary; do not extrapolate the OCT position to the full year.'),
'1994':('retained-with-limits','Retain the control position, whose displacement is about 1–2 source pixels.','The large scratch crosses the date; no scratched contour is copied. Province lettering and exact native candidate identity remain uncertain.'),
'1995':('corrected','Lower the observed NOV control and recenter it slightly.','Native control/province shapes remain approximate; this is a specimen registration correction only.'),
'1996':('corrected','Move the MAR control right while preserving its vertical position within source precision.','The black and pink variants are separate evidence cases; no colour or month generalization is inferred.'),
'1996-pink':('retained-with-limits','Retain the pink NOV variant separately; measured registration differences are small enough to be source-sensitive.','No black-variant position is copied across; exact province/ink contours and colour remain unresolved.'),
'1997':('retained-with-limits','Retain the NOV control position after its whole-line comparison.','The remaining vertical difference is roughly1–2 source pixels; finer province curves need a clearer independent specimen.'),
'1998':('retained-with-limits','Retain the AUG case; keep its decision separate from the independently corrected MAY lettering.','Minor control registration and tiny province lettering remain approximate; a MAY fitting change is not applied indiscriminately.'),
'2005':('retained-with-limits','Retain the small province candidate and control after inspecting their whole-line footprint.','The pinned province is about 5–7 pixels high. No per-glyph score or new alphabet is inferred from that blur.'),
'2006':('corrected','Use the heavier native province candidate and nominal size supported by the large APR original; move the stack2.5 SVG units right to clear wide month runs.','The shift is a family collision guard, not exact specimen registration. Tiny MAY masks are rejected; no per-glyph score is inferred. Historical font identity and print spread remain unconfirmed.'),
'2007':('retained-with-limits','Retain the current province candidate and control pending an enlarged corroborating specimen.','Province segmentation is unstable at about 5–7 pixels high and near adjacent year paint; invalid masks are retained as rejections.'),
'2009':('corrected','Raise the APR COLUMBIA line to restore the compact observed two-line stack.','BRITISH remains too broad as a candidate; its small source cannot establish a new alphabet. Physical edge decisions belong to the central pass.'),
'2010':('corrected','Use the independent tall province subset; calibrate JAN stack/control and barcode; uniformly scale/place the date to preserve the observed gap.','JAN and10 retain native shape-width residuals after height/position correction. The large 2012 original supplies province forms; surface/colour and historical font identity remain uncertain.'),
'2012':('corrected','Use the tall province subset; correct NOV stack/barcode; uniformly scale/place the date to preserve the photographed clear gap.','NOV remains about 8% narrow at equal height and 12 has a smaller width residual. The larger AUG province source has slight tilt; no exact historical font is claimed.'),
}

def main():
    original=list(csv.DictReader((ROOT.parent/'plateforge-decal-pass1/docs/research/bc-decal-corrections/case-ledger.csv').open()))
    retained=[r for r in original if r['status']=='retained'];assert len(retained)==28
    assert {r['id']for r in retained}==set(DECISIONS)
    measurements=json.loads((HERE/'primary-measurements/metrics.json').read_text())
    rows=[]
    for r in retained:
        state,decision,remaining=DECISIONS[r['id']]
        source_rows=[m for m in measurements if m['id']==r['id']]
        rows.append({'id':r['id'],'catalogueId':r['catalogueId'],'month':r['month'],'control':r['control'],
          'firstPassStatus':'retained','secondPassDecision':state,'decision':decision,'remaining':remaining,
          'source':r['source'],'sourceStatus':r['sourceStatus'],'sourceQuality':r['sourceQuality'],
          'acceptedExtentRoles':'; '.join(m['role']for m in source_rows if m['extentAccepted']),
          'rejectedExtentRoles':'; '.join(m['role']for m in source_rows if not m['extentAccepted']),
          'evidenceLimit':'Tiny lines support approximate whole-line placement only. No rejected segmentation enters an accepted extent range; colour/material/font identity are not established.',
          'reviewedOn':'2026-11-07'})
        if r['id']not in ['1975','2010','2012']:
            rows[-1]['remaining']+=' Main month/year proportions remain first-pass candidates where this pass changed only secondary printing or placement.'
    normalize=runpy.run_path(str(HERE/'proposal-text.py'))['normalize'];rows=normalize(rows)
    (HERE/'retained-case-decisions.json').write_text(json.dumps({'count':28,'scope':'Every first-pass retained reference, individually reviewed. Corrected means a bounded supported change; it does not mean finished or exact.','cases':rows},indent=2)+'\n')
    with (HERE/'retained-case-decisions.csv').open('w',newline='')as out:
        writer=csv.DictWriter(out,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    print('28 retained-reference decisions written')

if __name__=='__main__':main()
