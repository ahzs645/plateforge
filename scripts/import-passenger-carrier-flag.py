#!/usr/bin/env python3
"""Read static geometry from the supplied BC flag SVG; never execute SVG content."""
import hashlib,json,sys,xml.etree.ElementTree as E
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);svg=E.parse(source).getroot()
allowed_tags={'defs','clipPath','path','g'}
allowed_attrs={'id','d','fill','stroke-width','clip-path','transform'}
names={'stroke-width':'strokeWidth','clip-path':'clipPath'}
def convert(element):
    tag=element.tag.split('}')[-1]
    if tag not in allowed_tags or not set(element.attrib)<=allowed_attrs:
        raise ValueError('Changed SVG structure; inspect before importing')
    attrs={names.get(k,k):v for k,v in element.attrib.items()}
    if 'id' in attrs:attrs['id']='carrier-flag-'+attrs['id']
    if 'clipPath' in attrs:
        if not attrs['clipPath'].startswith('url(#'):raise ValueError('Only local clipping references are allowed')
        attrs['clipPath']=attrs['clipPath'].replace('url(#','url(#carrier-flag-')
    return {'tag':tag,'attrs':attrs,'children':[convert(c) for c in element]}
paths=list(svg.iter('{http://www.w3.org/2000/svg}path'))
if len(paths)!=15:raise ValueError('Expected the inspected 15-path BC flag')
drawing={'viewBox':[float(v) for v in svg.attrib['viewBox'].split()],
         'nodes':[convert(c) for c in svg]}
(root/'src/templates/bc/passenger-carrier-flag.json').write_text(json.dumps(drawing,indent=2)+'\n')
out=root/'docs/research/passenger-carrier-flag';out.mkdir(parents=True,exist_ok=True)
record={'date':'2026-10-05','fileName':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'viewBox':drawing['viewBox'],'paths':15,'sourcePage':'https://www.bcpl8s.ca/PassengerCarrier.html',
        'photographs':['https://www.bcpl8s.ca/images/MotorCarrier/2005-810301(XL).jpg',
                       'https://www.bcpl8s.ca/images/PassengerCarrier/2024-814298(XL).jpg'],
        'use':'carrier-passenger-2005 pale full-face background; source paths, fills, transforms and clipping retained. Artwork fitted inside the plate rim, with a 50% white wash to approximate screened printing.',
        'limits':'Plate fitting and average print colour are approximate. The halftone dots, sheeting, wear and embossing are not reproduced. This change does not certify the serial or legend font.'}
(out/'provenance.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'paths':15,'sourceSha256':record['sha256']}))
