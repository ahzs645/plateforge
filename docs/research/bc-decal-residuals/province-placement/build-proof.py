#!/usr/bin/env python3
"""Create source/before/after and bounds-overlay proofs from actual SVG renders."""
import hashlib
import html
import json
from pathlib import Path

from PIL import Image,ImageDraw,ImageFont

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
OUT=HERE/'proof';OUT.mkdir(exist_ok=True)
RENDER=HERE/'rendered'
PROPOSALS=json.loads((HERE/'implementation-proposals.json').read_text())
INPUTS=json.loads((RENDER/'render-inputs.json').read_text())
BOUNDS={(r['id'],r['stage']):r for r in json.loads((RENDER/'paint-bounds.json').read_text())}
CASES=json.loads((HERE/'retained-case-decisions.json').read_text())['cases']
CASE={r['id']:r for r in CASES}
SOURCES=ROOT/'public/bc-decal-corrections/evidence'
METADATA={r['id']:r for r in json.loads((ROOT/'public/bc-decal-corrections/render-metadata.json').read_text())['specimens']}

def font(size):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size)

def place(board,file,x,y,w,h):
    im=Image.open(file).convert('RGBA');nw=round(im.width*h/im.height)
    if nw>w:raise ValueError('Proof would clip '+str(file))
    im=im.resize((nw,h),Image.Resampling.LANCZOS);board.paste(im,(round(x+(w-nw)/2),y),im)

GROUPS=[('annual',['1971','1974','1975','1976','1978']),('earlier-panels',['1980','1981','1982','1985','1987','1988']),
 ('bordered-a',['1989','1990','1991','1992','1993','1994']),('bordered-b',['1995','1996','1996-pink','1997','1998']),
 ('later',['2005','2006','2007','2009','2010','2012'])]

def contact(name,keys):
    pw=430;lh=170;board=Image.new('RGB',(1450,100+lh*len(keys)),'#f5f7fa');d=ImageDraw.Draw(board)
    d.text((20,15),'BC decal secondary printing · '+name.replace('-',' '),font=font(25),fill='#12223a')
    for i,label in enumerate(['FIRST-PASS BEFORE','PINNED PHOTOGRAPH','INTEGRATED AFTER']):d.text((130+i*pw,60),label,font=font(17),fill='#43546d')
    for row,key in enumerate(keys):
        y=100+row*lh;r=CASE[key];d.text((20,y+18),key,font=font(20),fill='#142238');d.text((20,y+47),r['month']or'annual',font=font(15),fill='#43546d')
        for col,file in enumerate([RENDER/key/'before.png',SOURCES/key/'source.png',RENDER/key/'after.png']):place(board,file,120+col*pw,y+8,pw-12,112)
        d.text((130,y+129),'Exact control: '+(r['control']or'absent')+' · '+r['secondPassDecision'],font=font(14),fill='#43546d')
        d.line((20,y+lh-8,1430,y+lh-8),fill='#dce2ea',width=1)
    file=OUT/(name+'.png');board.save(file,optimize=True);return file.name

def detailed(key):
    source=Image.open(SOURCES/key/'source.png').convert('RGB');meta=METADATA[key];w=meta['after']['viewBox'][0]
    pane=760;h=210;board=Image.new('RGB',(3*pane+40,650),'#f7f8fb');d=ImageDraw.Draw(board)
    d.text((20,15),key+' · source / first-pass / integrated correction',font=font(26),fill='#142238')
    d.text((20,52),'Uniform frame height and horizontal centre; original relative width retained. Source '+str(source.width)+'×'+str(source.height)+' pixels.',font=font(17),fill='#43546d')
    for col,(label,file) in enumerate([('FIRST-PASS BEFORE',RENDER/key/'before.png'),('PINNED SOURCE',SOURCES/key/'source.png'),('INTEGRATED AFTER',RENDER/key/'after.png')]):
        d.text((20+col*pane,89),label,font=font(17),fill='#43546d');place(board,file,20+col*pane,120,pane-15,h)
    # Bounds drawn on the source preserve its photograph; they are not invented
    # pixel silhouettes or a score of tiny glyph contours.
    frame_w=max(w,source.width*100/source.height);scale=2.2;overlay_w=round(frame_w*scale);overlay_h=220
    ox=round((board.width-overlay_w)/2);oy=405
    im=source.resize((round(source.width*overlay_h/source.height),overlay_h),Image.Resampling.LANCZOS)
    faded=Image.blend(im,Image.new('RGB',im.size,'white'),.25);board.paste(faded,(ox+(overlay_w-im.width)//2,oy))
    def rect(box,colour):
        a=[ox+(box[0]+(frame_w-w)/2)*scale,oy+box[1]*scale,ox+(box[2]+(frame_w-w)/2)*scale,oy+box[3]*scale]
        d.rectangle(a,outline=colour,width=2)
    selected={key2:target for p in PROPOSALS['proposals']if p['id']==key for key2,target in p['targetPaintBoxes'].items()}
    plotted=set(selected)
    if not plotted:
        plotted={role+':'+str(i)for p in PROPOSALS['proposals']if p['id']==key for role,runs in p['runs'].items()for i in range(len(runs))}
    if not plotted and key=='2004':plotted={'decal-legend:0','decal-legend:1'}
    for stage,colour in [('before','#f59e0b'),('after','#d21f91')]:
        for run in BOUNDS[key,stage]['runs']:
            if run['role']+':'+str(run['index'])in plotted:rect(run['box'],colour)
    for target in selected.values():rect(target,'#009ca5')
    caption='Actual painted bounds: before (orange) · accepted source extent (cyan) · after (magenta). Tiny lines remain approximate extent diagnostics.'
    if not selected:caption='Actual model paint: before (orange) · after (magenta). No accepted tiny-province source target is asserted; source bounds are deliberately omitted.'
    d.text((20,358),caption,font=font(18),fill='#43546d')
    file=OUT/(key+'-proof.png');board.save(file,optimize=True);return file.name

def metrics():
    rows=[]
    for proposal in PROPOSALS['proposals']:
        key=proposal['id'];meta=METADATA[key]
        for spec,target in proposal['targetPaintBoxes'].items():
            role,index=spec.split(':');index=int(index)
            before=next(r for r in BOUNDS[key,'before']['runs']if r['role']==role and r['index']==index)
            after=next(r for r in BOUNDS[key,'after']['runs']if r['role']==role and r['index']==index)
            b=before['box'];a=after['box'];s=target
            rows.append({'id':key,'month':meta['month'],'control':meta['control'],'role':role,'index':index,
              'sourceApproximateBox':s,'beforePaintBox':b,'afterPaintBox':a,'afterFit':after['fit'],
              'centreErrorBefore':((b[0]+b[2])-(s[0]+s[2]))/2,'centreErrorAfter':((a[0]+a[2])-(s[0]+s[2]))/2,
              'bottomErrorBefore':b[3]-s[3],'bottomErrorAfter':a[3]-s[3],
              'meaning':'SVG units in a height 100 frame. Model bounds are actual Inkscape painted extents; photographic bounds remain approximate. A tiny-line extent is not a glyph contour score.'})
    (OUT/'measurement-table.json').write_text(json.dumps({'provenance':INPUTS['provenance'],'mode':INPUTS['candidateScope'],'rows':rows},indent=2)+'\n')
    return rows

def main():
    if 'unmodified integrated current checkout'not in INPUTS['candidateScope']:raise ValueError('Final proof requires --integrated render, not in-memory candidate records')
    ids={r['id']for r in CASES};assert len(ids)==28 and all((key,'after')in BOUNDS for key in ids)
    contacts=[contact(name,keys)for name,keys in GROUPS]
    detailed_files=[detailed(key)for key in ['1975','1981','1987','1990','1991','1992','2006','2010','2012','2004']]
    rows=metrics()
    source_hashes={key:hashlib.sha256((SOURCES/key/'source.png').read_bytes()).hexdigest()for key in sorted(ids|{'2004','2011','2013'})}
    index={'sourceHashes':source_hashes,'contactSheets':contacts,'detailFigures':detailed_files,'measuredRoleOccurrences':len(rows),'provenance':INPUTS['provenance']}
    (OUT/'index.json').write_text(json.dumps(index,indent=2)+'\n')
    cards=''.join('<h2>'+html.escape(name.replace('.png','').replace('-',' '))+'</h2><a href="'+name+'"><img src="'+name+'" alt="'+name+'"></a>'for name in contacts+detailed_files)
    (OUT/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>BC decal secondary-printing proof</title><style>body{max-width:1450px;margin:35px auto;padding:0 22px;background:#f7f8fb;color:#142238;font:17px system-ui;line-height:1.55}img{max-width:100%;border:1px solid #dce2ea}h2{margin-top:45px}a{color:#145e9c}</style><h1>BC decal province and placement proof</h1><p>Every first-pass retained reference is included. Before: complete clean first-pass checkout. After: unmodified integrated current checkout. The original source is shown separately; resizing is uniform and preserves relative width.</p><p>Small province lines are approximate whole-line evidence, not exact glyph traces. See <a href="../retained-case-decisions.csv">all 28 case decisions</a>, <a href="measurement-table.json">actual paint measurements</a>, and <a href="../source-manifest.json">source credits</a>.</p>'+cards+'</html>')
    print('Proof complete:',len(contacts),'contact sheets;',len(detailed_files),'detail figures;',len(rows),'measured role occurrences')

if __name__=='__main__':main()
