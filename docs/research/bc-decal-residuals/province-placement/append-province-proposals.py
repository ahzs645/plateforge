#!/usr/bin/env python3
"""Append the reviewed smaller-province subset after the first 21 proposals."""
import copy
import json
import runpy
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BASE=ROOT.parent/'plateforge-decal-pass1'
path=HERE/'implementation-proposals.json'
data=json.loads(path.read_text())
records=json.loads((BASE/'src/regions/canada/bc-decal-typography.json').read_text())
metadata={r['id']:r for r in json.loads((ROOT/'public/bc-decal-corrections/render-metadata.json').read_text())['specimens']}
measurements={(r['id'],r['role']):r for r in json.loads((HERE/'primary-measurements/metrics.json').read_text())}
assert not any(p['id']=='2010'for p in data['proposals']), 'Already appended'

def target(key,role):
    r=measurements[key,role]
    if not r['extentAccepted']:
        raise ValueError(f'Rejected source mask cannot drive a production target: {key}/{role}')
    pw,ph=r['sourcePixels'];w=metadata[key]['after']['viewBox'][0];s=100/ph;o=(w-pw*s)/2;x1,y1,x2,y2=r['paintBox']
    return [x1*s+o,y1*s,x2*s+o,y2*s]

def entry(key,month,runs,findings,targets=None,layout=None,extras=None):
    data['proposals'].append({'id':key,'month':month,'runs':runs,'layout':layout or{},'findings':findings,
      'scope':'Fixed province alphabet/nominal size across the corroborated2010–13 subset; unobserved-month positions retained.'if month is None else 'Exact photographed '+month+' placement; merge with existing month variant roles/layout.',
      'evidenceUrls':[metadata[key]['source']]+(extras or[]),'targetPaintBoxes':targets or{},
      'alignment':'Uniform source height to 100 and horizontal frame-centre alignment; relative source width retained.',
      'uncertainty':'Approximate whole-line placement; source-specific photograph tilt and print spread remain visible. Historical typeface identity is unconfirmed.'})
    return data['proposals'][-1]

tall='province-tall-2010-reconstruction'
extra=['https://commons.wikimedia.org/wiki/File:ICBC_Aug_2012_Registration_Decal.png']
for key,cap in [('2010',.133),('2011',.13),('2012',.134),('2013',.13)]:
    base=[dict(r,profile=tall,cap=.13,width=(.25,.29)[i],tracking=0)for i,r in enumerate(records[key]['runs']['decal-legend'])]
    entry(key,None,{'decal-legend':base},'Use the independently authored 12-capital tall province subset supported by the large 2012 original and corroborated whole-word proportions in 2010–13.',extras=extra)
    # Preserve the established MAY2011/OCT2013 month/year/serial/barcode roles;
    # only the province runs are supplied to the merger.
    source=records[key].get('monthVariants',[{}])[-1].get('runs',{}).get('decal-legend',records[key]['runs']['decal-legend'])
    runs={'decal-legend':[dict(r,profile=tall,cap=cap,width=(.25,.29)[i],tracking=0)for i,r in enumerate(source)]}
    targets={'decal-legend:0':target(key,'british'),'decal-legend:1':target(key,'columbia')}
    layout={}
    if key=='2010':
        runs['decal-serial']=copy.deepcopy(records[key]['runs']['decal-serial']);targets['decal-serial:0']=target(key,'serial')
    if key in ['2010','2012']:
        # Eight-digit Code128C here has79 painted modules plus ten-module quiet
        # zones each side. Layout describes that full box; paint is verified.
        t=target(key,'barcode');w=metadata[key]['after']['viewBox'][0];module=(t[2]-t[0])/79
        layout={'barcode':{'x':(t[0]-10*module)/w,'y':t[1]/100,'width':module*99/w,'height':(t[3]-t[1])/100}}
        for role in ['month','year']:
            t=target(key,role)
            before=next(r for r in metadata[key]['after']['runs']if r['role']=='decal-'+role)
            assert before['fit']=='natural'
            assert all(s['accepted']for s in measurements[key,role]['thresholdSamples'])
            r=copy.deepcopy(records[key]['runs']['decal-'+role][0])
            r['cap']*= (t[3]-t[1])/(before['box'][3]-before['box'][1])
            runs['decal-'+role]=[r];targets['decal-'+role+':0']=t
    e=entry(key,metadata[key]['month'],runs,'Calibrate the province stack using accepted whole-line extents. Preserve all unrelated existing month roles. In2010/2012, uniformly reduce/place the date and restore the observed barcode gap; native date outlines remain unchanged.',targets,layout,extra)
    e['uncertainty']+=' Matching date height and placement does not eliminate the retained month/year shape-width residuals.'

# A larger independent APR photograph supports heavy native capitals in 2006;
# no other tiny-year family is automatically assigned the same face.
key='2006';base=[dict(r,profile='archivo-900-wdth75',cap=.067,width=.22,x=.63587)for r in records[key]['runs']['decal-legend']]
extra=['https://commons.wikimedia.org/wiki/File:ICBC_Apr_2006_Registration_Decal.png']
e=entry(key,None,{'decal-legend':base},'Use native Archivo 900 width 75 for the heavy province capitals supported by the 1855×715 APR photograph. Nominal cap follows its province/year height proportion. Move both lines 2.5 SVG units as a family clearance guard; rejected tiny MAY masks do not drive an exact translation.',extras=extra)
e['scope']='Province shape/nominal size for2006 only. Translate both lines +2.5 SVG units as a family clearance constraint for wide months; this is not a source-derived exact MAY translation. No neighbouring-year generalization.'
e['uncertainty']='The tiny MAY masks touch neighbouring paint/inspection boundaries and are rejected. The larger APR source supports native face weight and approximate size, not exact MAY coordinates or historical typeface identity.'
e['measurementBasis']='Actual-engine family collision guard: original COLUMBIA right edge166.531, year left edge170.122; +2.5 units leaves1.091 units to the year and removes the reported1.7701-unit MAR and1.2051-unit MAY overlaps without resizing type.'

# 2009: the line gap is clearer than the tiny lettering identity.
key='2009';runs=copy.deepcopy(records[key]['runs']['decal-legend'])
entry(key,'APR',{'decal-legend':runs},'Raise COLUMBIA to the compact observed line gap; retain the existing native face and cap. BRITISH remains visibly broad and is explicitly unresolved.',{'decal-legend:1':target(key,'columbia')})

for p in data['proposals']:
    for runs in p['runs'].values():
        for r in runs:
            for field in ['x','baseline','cap','width','tracking']:r[field]=round(r[field],6)
    for values in p['layout'].values():
        if isinstance(values,dict):
            for key in values:values[key]=round(values[key],6)
data['stage']='Province subset appended; actual-engine paint registration verification follows.'
normalize=runpy.run_path(str(HERE/'proposal-text.py'))['normalize']
path.write_text(json.dumps(normalize(data),indent=2)+'\n')
print(len(data['proposals']),'proposals')
