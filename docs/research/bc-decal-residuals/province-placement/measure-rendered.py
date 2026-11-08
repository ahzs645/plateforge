#!/usr/bin/env python3
"""Actual Inkscape paint bounds and a translation-only proposal calibration."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

HERE=Path(__file__).resolve().parent
OUT=HERE/'rendered'

def one(file):
    tree=ET.parse(file);root=tree.getroot();counts={};roles=[]
    for node in root.iter():
        role=node.get('data-role')
        if role and (node.get('aria-label')is not None or role=='decal-control-panel'):
            index=counts.get(role,0);counts[role]=index+1;identifier='measure-'+role+'-'+str(index)
            node.set('id',identifier);roles.append({'role':role,'index':index,'text':node.get('aria-label'),'fit':node.get('data-fit'),'profile':node.get('data-die'),'queryId':identifier})
    query=file.with_name(file.stem+'-query.svg');tree.write(query,encoding='unicode')
    result=subprocess.run(['inkscape',str(query),'--query-all'],capture_output=True,text=True,check=True,timeout=30)
    boxes={}
    for line in result.stdout.splitlines():
        parts=line.split(',')
        if len(parts)==5:
            x,y,w,h=map(float,parts[1:]);boxes[parts[0]]=[x,y,x+w,y+h]
    for role in roles:role['box']=boxes.get(role['queryId'])
    subprocess.run(['inkscape',str(file),'--export-height=300','--export-filename='+str(file.with_suffix('.png'))],capture_output=True,check=True,timeout=30)
    query.unlink()
    return {'id':file.parent.name,'stage':file.stem,'runs':roles,'svgSha256':hashlib.sha256(file.read_bytes()).hexdigest()}

def main():
    files=sorted(p for p in OUT.glob('*/*.svg')if p.stem in ['before','after'])
    with ThreadPoolExecutor(max_workers=3)as pool:records=list(pool.map(one,files))
    (OUT/'paint-bounds.json').write_text(json.dumps(records,indent=2)+'\n')
    if '--calibrate' in sys.argv:
        path=HERE/'implementation-proposals.json';data=json.loads(path.read_text());meta={r['id']:r for r in records if r['stage']=='after'}
        rootmeta={r['id']:r for r in json.loads((HERE.parents[3]/'public/bc-decal-corrections/render-metadata.json').read_text())['specimens']}
        for p in data['proposals']:
            for key,target in p['targetPaintBoxes'].items():
                role,index=key.split(':');index=int(index);row=next(r for r in meta[p['id']]['runs']if r['role']==role and r['index']==index)
                box=row['box'];r=p['runs'][role][index];w=rootmeta[p['id']]['after']['viewBox'][0]
                # Translate actual painted centre and bottom. Do not fit shape
                # width by scaling it independently of height.
                r['x']=round(r['x']+(target[0]+target[2]-box[0]-box[2])/2/w,6)
                r['baseline']=round(r['baseline']+(target[3]-box[3])/100,6)
        data['stage']='Translation calibrated from actual Inkscape painted bounds; final verification follows.'
        path.write_text(json.dumps(data,indent=2)+'\n')
    print(len(records),'SVG bounds measured')

if __name__=='__main__':main()
