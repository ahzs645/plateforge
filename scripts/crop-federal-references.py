#!/usr/bin/env python3
"""Build credited plate thumbnails from inventoried source boxes, not rectified traces."""
import argparse,hashlib,json,urllib.request
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--cache',default='/tmp/plateforge-federal-sources');args=parser.parse_args()
cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
out=root/'public/federal-reference-review/photos';out.mkdir(parents=True,exist_ok=True)
ledger=json.loads((root/'docs/research/canada-federal/inventory.json').read_text())
expected={x['image']:x['sha256'] for x in ledger['sourceImageHashes']}
for ref in ledger['references']:
 filename=ref['image'].rsplit('/',1)[1];source=cache/filename
 if not source.exists():
  request=urllib.request.Request(ref['image'],headers={'User-Agent':'PlateForge source research'})
  with urllib.request.urlopen(request,timeout=30) as response:source.write_bytes(response.read())
 if hashlib.sha256(source.read_bytes()).hexdigest()!=expected[filename]:raise SystemExit(f'Source changed: {filename}; inspect it and update the ledger before rebuilding.')
 with Image.open(source) as image:
  crop=image.crop(tuple(ref['box'])).convert('RGB');crop.thumbnail((600,350));crop.save(out/(ref['id']+'.jpg'),quality=93)
print(f'{len(ledger["references"])} credited photographic thumbnails; no perspective/contour normalization applied.')
