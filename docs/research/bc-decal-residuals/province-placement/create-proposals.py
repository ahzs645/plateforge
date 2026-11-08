#!/usr/bin/env python3
"""Build explicit, mergeable production proposals from inspected source extents.

Coordinates use uniform source height and horizontal frame-centre alignment.
No source is stretched horizontally. The subsequent actual SVG pass supplies
paint bounds and adjusts translation only; supplied font shapes remain native.
"""
import copy
import json
import runpy
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BASE=ROOT.parent/'plateforge-decal-pass1'
TYPO=json.loads((BASE/'src/regions/canada/bc-decal-typography.json').read_text())
META={r['id']:r for r in json.loads((ROOT/'public/bc-decal-corrections/render-metadata.json').read_text())['specimens']}
MEASURE={(r['id'],r['role']):r for r in json.loads((HERE/'primary-measurements/metrics.json').read_text())}
PROPOSALS=[]

def target(key,role):
    r=MEASURE[key,role]
    if not r['extentAccepted']:
        raise ValueError(f'Rejected source mask cannot drive a production target: {key}/{role}')
    pw,ph=r['sourcePixels'];w=META[key]['after']['viewBox'][0]
    s=100/ph;o=(w-pw*s)/2
    x1,y1,x2,y2=r['paintBox']
    return [x1*s+o,y1*s,x2*s+o,y2*s]

def add(key,month,runs,findings,layout=None,targets=None,extra_sources=None):
    record={'id':key,'month':month,'runs':runs,'layout':layout or {},'findings':findings,
      'scope':'Base role shape/size; province text is fixed.' if month is None and META[key]['month'] else 'Annual specimen' if month is None else 'Placement calibrated only to the photographed '+month+' specimen; not a claim of a historical month-specific printing design.',
      'evidenceUrls':[META[key]['source']]+(extra_sources or []),'targetPaintBoxes':targets or {},
      'alignment':'Uniform source height to 100; horizontal frame centre aligned. Relative source width retained.',
      'uncertainty':'Small pinned province lines support approximate whole-line extent/placement, not individual glyph contour scores. Native candidate or authored limited alphabet is not a historical typeface identification.'}
    PROPOSALS.append(record)
    return record

def adjusted(key,role,index=0,**changes):
    r=copy.deepcopy(TYPO[key]['runs'][role][index]);r.update(changes);return r

def translation(key,role,source_role,index=0):
    r=adjusted(key,role,index);b=next(x['box'] for x in META[key]['after']['runs']if x['role']==role and x['index']==index);t=target(key,source_role);w=META[key]['after']['viewBox'][0]
    r['x']+=((t[0]+t[2]-b[0]-b[2])/2)/w;r['baseline']+=(t[3]-b[3])/100
    return r,t

# Annual controls: uniform cap-size correction plus observed inter-digit spaces.
# Panel coordinates describe the inspected rectangle, not photo material edges.
PANELS={'1971':[5,51,110,84],'1974':[14,42,130,72],'1975':[24,43,142,76],'1976':[14,60,142,92]}
CONTROLS={'1971':(.15075,22.8),'1974':(.15759,11.7),'1975':(.16744,8.65),'1976':(.17086,12.5)}
for key,(cap,tracking) in CONTROLS.items():
    r=adjusted(key,'decal-serial',cap=cap,tracking=tracking,width=.8)
    t=target(key,'serial');pw,ph=MEASURE[key,'serial']['sourcePixels'];w=META[key]['after']['viewBox'][0];s=100/ph;o=(w-pw*s)/2
    x1,y1,x2,y2=PANELS[key];layout={'controlPanel':{'x':(x1*s+o)/w,'y':y1*s/100,'width':(x2-x1)*s/w,'height':(y2-y1)*s/100}}
    add(key,None,{'decal-serial':[r]},'Reduce oversized control paint uniformly, preserve its native narrow digit outlines, and fit the independently measured panel. Tracking follows the observed separation; fine digit contours remain approximate.',layout,{'decal-serial:0':t})

# 1975's province lines clearly sit farther right than the previous reconstruction.
entry=next(p for p in PROPOSALS if p['id']=='1975')
entry['runs']['decal-legend']=[adjusted('1975','decal-legend',i,x=.077,baseline=(.216,.386)[i],cap=.124,width=.66)for i in range(2)]
entry['runs']['decal-legend'][1]['tracking']=-1.8
entry['targetPaintBoxes'].update({'decal-legend:0':target('1975','british'),'decal-legend:1':target('1975','columbia')})
year_target=target('1975','year')
year_before=next(r['box']for r in META['1975']['after']['runs']if r['role']=='decal-year')
entry['runs']['decal-year']=[adjusted('1975','decal-year',cap=.34*(year_target[3]-year_target[1])/(year_before[3]-year_before[1]))]
entry['targetPaintBoxes']['decal-year:0']=year_target
entry['findings']+=' Reposition the two province lines, tighten COLUMBIA tracking and reduce/translate 75 uniformly to restore the observed gap. No year contour is changed and no glyph is horizontally scaled.'

# Wide, rounded-square province artwork corroborated by larger 1981 and1982 photos.
wide_sources=['https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_October_1981.jpg','https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_July_1982.jpg']
for key,cap in [('1981',.125),('1982',.118)]:
    base=[adjusted(key,'decal-legend',i,profile='province-wide-1981-reconstruction',tracking=0,width=(.35,.43)[i])for i in range(2)]
    add(key,None,{'decal-legend':base},'Use a limited independently authored wide province alphabet supported by larger 1981/82 photographs; keep unobserved-month placements unchanged.',extra_sources=wide_sources)
    runs=[dict(r,cap=cap)for r in base]
    add(key,META[key]['month'],{'decal-legend':runs},'Calibrate the two fixed province words to their pinned whole-line extents; retain uncertainty in the 8–9 pixel source. The larger photographs, not this tiny crop, support the capital forms.',targets={'decal-legend:0':target(key,'british'),'decal-legend:1':target(key,'columbia')},extra_sources=wide_sources)

# Heavy native lettering: compare weight and diagnostic forms as well as width.
for key,cap,source in [('1985',.100,'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_February_1985.jpg'),('1987',.130,'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_February_1987.jpg')]:
    words=1 if key=='1985'else 2
    base=[adjusted(key,'decal-legend',i,profile='archivo-900-wdth75',width=(.49 if words==1 else .35),tracking=(2 if words==1 else 12))for i in range(words)]
    add(key,None,{'decal-legend':base},'Choose native Archivo 900 at its width 75 design axis for the visibly heavy small capitals. This is a visual candidate, not historical font identification.',extra_sources=[source])
    targets={'decal-legend:0':target(key,'province'if words==1 else'british')}
    if words==2:targets['decal-legend:1']=target(key,'columbia')
    runs={'decal-legend':[dict(r,cap=cap)for r in base]}
    if key=='1987':
        serial,t=translation(key,'decal-serial','serial');runs['decal-serial']=[serial];targets['decal-serial:0']=t
    add(key,META[key]['month'],runs,'Resize and place the province words at observed whole-line extent, retaining native glyph proportions. The observed control is translated separately.',targets=targets,extra_sources=[source])

# 1988 has a different smaller province stack. Do not force the heavier1987 face.
add('1988','DEC',{'decal-legend':[adjusted('1988','decal-legend',i,cap=.095,width=.26)for i in range(2)]},'Retain the approximate province face; correct the clearly undersized/raised DEC stack only. Its blur prevents a confident new contour construction.',targets={'decal-legend:0':target('1988','british'),'decal-legend:1':target('1988','columbia')})

# Exact-month control registration. Exclude movements within about 1–2 source pixels.
for key in ['1989','1990','1991','1992','1993','1995','1996']:
    r,t=translation(key,'decal-serial','serial')
    add(key,META[key]['month'],{'decal-serial':[r]},'Correct the observed control location by translation only. Native glyph shape, cap height and spacing are preserved; other months keep their established placement.',targets={'decal-serial:0':t},extra_sources=([f'https://commons.wikimedia.org/wiki/File:British_Columbia_Sticker_Decal_January_{key}.jpg']if key in ['1990','1991']else[]))

# The 1980 control mask remains rejected. Only the independently inspected
# outer frame is moved; an empty runs object preserves the original printing.
p=add('1980','MAR',{},'Reposition only the independently inspected unfilled control panel. Retain the first-pass control printing: its mask touches the frame/inspection boundary and is rejected.',
      {'controlPanel':{'x':.457576,'y':.586667,'width':.286869,'height':.306667}})
p['measurementBasis']='Manual outer-frame bracket [117,44,188,67] in the 255×75 source, with approximately one-pixel uncertainty. No serial mask or serial target is accepted.'

# Width limits are ceilings rather than targets. Final translation is measured
# on rendered ink, so native side bearings and overshoots are not guessed.
for proposal in PROPOSALS:
    for runs in proposal['runs'].values():
        for r in runs:
            for field in ['x','baseline','cap','width','tracking']:
                r[field]=round(r[field],6)
    if proposal['layout']:
        for values in proposal['layout'].values():
            for field in values:values[field]=round(values[field],6)
normalize=runpy.run_path(str(HERE/'proposal-text.py'))['normalize']
(HERE/'implementation-proposals.json').write_text(json.dumps(normalize({'schema':'plateforge.bc-decal-residual-proposals/v1','baselineCommit':'24689246670c25f91e0d1676a0647f053dbca68e','stage':'candidate; actual render/translation check follows','proposals':PROPOSALS}),indent=2)+'\n')
print(len(PROPOSALS),'explicit proposals')
