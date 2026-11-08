#!/usr/bin/env python3
"""Validate pinned original evidence offline; --fetch retrieves missing files.

The inventory is the explicit reviewed URL/hash/input contract. No gallery
rescan, automatic retries, parallel requests or alternate-host fallback occurs.
HTTP 429 stops immediately and reports Retry-After for the operator to honor.
"""
from pathlib import Path
import argparse,hashlib,io,json,urllib.request,urllib.error
from PIL import Image
HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--fetch',action='store_true',help='Sequentially fetch only missing pinned originals; existing files are never replaced.')
args=parser.parse_args();inventory=json.loads((HERE/'source-inventory.json').read_text());verified=[]
for record in inventory['sources']:
 path=HERE/record['file']
 if path.exists():data=path.read_bytes()
 elif args.fetch:
  request=urllib.request.Request(record['source'],headers={'User-Agent':'PlateForgeDecalResearch/1.0 (public reference audit; https://github.com/ahzs645/plateforge)'})
  try:
   with urllib.request.urlopen(request,timeout=30)as response:data=response.read()
  except urllib.error.HTTPError as error:
   interval=error.headers.get('Retry-After','unspecified')
   raise SystemExit(f'HTTP {error.code}: stopped at {record["source"]}; Retry-After={interval}. Honor that interval before a later manual invocation. No retry attempted.')
 else:raise SystemExit(f'Missing pinned original: {path}. Use --fetch only when network retrieval is appropriate.')
 digest=hashlib.sha256(data).hexdigest()
 if digest!=record['sourceSha256']:raise SystemExit(f'Original hash mismatch: {record["id"]}; refused to overwrite or silently update evidence.')
 with Image.open(io.BytesIO(data))as image:
  image.load()
  if list(image.size)!=record['sourcePixels']:raise SystemExit(f'Original dimensions differ: {record["id"]}')
 if not path.exists():path.parent.mkdir(exist_ok=True);path.write_bytes(data)
 verified.append(record['id'])
print(json.dumps({'verifiedOriginalFiles':len(verified),'downloadedFilesInLedger':inventory['downloadedFiles'],'canonicalDuplicateFiles':inventory['canonicalDuplicateFiles'],'networkRequested':args.fetch}))
