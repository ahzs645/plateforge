#!/usr/bin/env python3
"""Record actual panel/control paint, including the unlabelled1980 baseline box."""
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

HERE=Path(__file__).resolve().parent
BOUNDS={(r['id'],r['stage']):r for r in json.loads((HERE/'rendered/paint-bounds.json').read_text())}
MEASURE={(r['id'],r['role']):r for r in json.loads((HERE/'primary-measurements/metrics.json').read_text())}
PANELS={'1971':[5,51,110,84],'1974':[14,42,130,72],'1975':[24,43,142,76],'1976':[14,60,142,92],'1980':[117,44,188,67]}

def box(rows,role):return next(r['box']for r in rows if r['role']==role)

def baseline_1980_panel():
    file=HERE/'rendered/1980/before.svg';tree=ET.parse(file)
    nodes=[n for n in tree.getroot().iter()if n.tag.endswith('rect')and n.get('fill')=='none'and n.get('stroke')]
    assert len(nodes)==1,'The manual baseline selector must be unique'
    nodes[0].set('id','baseline-panel-query')
    temporary=file.with_name('before-panel-query.svg');tree.write(temporary,encoding='unicode')
    result=subprocess.run(['inkscape',str(temporary),'--query-all'],capture_output=True,text=True,check=True,timeout=30)
    temporary.unlink()
    line=next(line for line in result.stdout.splitlines()if line.startswith('baseline-panel-query,'))
    x,y,w,h=map(float,line.split(',')[1:]);return [x,y,x+w,y+h]

records=[]
for key,manual in PANELS.items():
    before=BOUNDS[key,'before']['runs'];after=BOUNDS[key,'after']['runs']
    control=box(after,'decal-serial');frame=box(after,'decal-control-panel');stroke=.7 if key=='1980'else .8
    prior=baseline_1980_panel()if key=='1980'else box(before,'decal-control-panel')
    source=MEASURE[key,'serial']
    records.append({'id':key,'sourcePanelBoxPixelsManual':manual,'sourcePanelBoundaryUncertaintyPixels':1,
      'sourceControlBoxPixels':source['paintBox']if source['extentAccepted']else None,'sourceControlMaskAccepted':source['extentAccepted'],
      'beforePanelPaintBox':prior,'afterPanelPaintBox':frame,'beforeControlPaintBox':box(before,'decal-serial'),'afterControlPaintBox':control,
      'controlClearanceInsidePanelStroke':{'left':control[0]-frame[0]-stroke,'top':control[1]-frame[1]-stroke,'right':frame[2]-control[2]-stroke,'bottom':frame[3]-control[3]-stroke},
      'baselinePanelMethod':'Actual Inkscape bounds; unique unfilled stroke rectangle in 1980 is queried with a temporary id only.'if key=='1980'else'Actual Inkscape query of labelled panel.',
      'meaning':'Actual SVG paint boxes include stroke. Source panel brackets are manual approximate evidence, not accepted masks or calibrated physical edges. Rejected control masks are excluded.'})
(HERE/'proof/panel-measurements.json').write_text(json.dumps(records,indent=2)+'\n')
print('Five panel/control comparisons; minimum inside-stroke clearance',min(min(r['controlClearanceInsidePanelStroke'].values())for r in records))
