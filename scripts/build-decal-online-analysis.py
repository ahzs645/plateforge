#!/usr/bin/env python3
"""Download SHA-verified selected references and rebuild the online comparison.

Requires the same Python packages/Chromium as build-decal-glyph-analysis.py.
The official embedded JPEG is retained with PDF provenance, avoiding a PDF parser
requirement. All other images are fetched from their credited public source URL.
"""
from pathlib import Path
import os,sys,json,hashlib,urllib.request,subprocess
ROOT=Path(__file__).resolve().parents[1]
WORK=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/plateforge-decal-online-analysis')
(WORK/'photos').mkdir(parents=True,exist_ok=True)
for reference in json.loads((ROOT/'docs/research/decal-online-analysis/reference-manifest.json').read_text()):
 path=ROOT/reference['photoFile']
 if not path.exists():
  path=WORK/'photos'/reference['photoFile']
  if not path.exists():
   request=urllib.request.Request(reference['source'],headers={'User-Agent':'Plateforge-reference-review/1.0'})
   path.write_bytes(urllib.request.urlopen(request,timeout=60).read())
 if hashlib.sha256(path.read_bytes()).hexdigest()!=reference['sourceSha256']:raise RuntimeError('Changed source: '+reference['id'])
env={**os.environ,'DECAL_ANALYSIS_DOC':'docs/research/decal-online-analysis','DECAL_ANALYSIS_OUT':'public/bc-decal-online-review','DECAL_ANALYSIS_RENDERER':'scripts/render-decal-online-analysis.mjs'}
subprocess.run([sys.executable,str(ROOT/'scripts/build-decal-glyph-analysis.py'),str(WORK)],cwd=ROOT,env=env,check=True)
