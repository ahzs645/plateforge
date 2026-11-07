#!/usr/bin/env python3
"""Verify selected references and rebuild the online comparison.

Requires the same Python packages/Chromium as build-decal-glyph-analysis.py.
The official embedded JPEG is retained with PDF provenance, avoiding a PDF parser
requirement. Use --cached-crops for an explicitly scoped, offline local-crop audit.
"""
from pathlib import Path
import argparse,os,sys,json,hashlib,urllib.request,subprocess
from decal_audit_photos import load_crop_manifest,read_cached_crop,read_original_crop
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('work',nargs='?',default='/tmp/plateforge-decal-online-analysis')
parser.add_argument('--cached-crops',action='store_true',help='Use pinned local crop bytes; do not claim original image bytes were verified')
parser.add_argument('--baseline-root',type=Path,help='Separate clean complete baseline checkout; omit for current-only evidence')
parser.add_argument('--output',type=Path,help='Override the generated gallery directory')
parser.add_argument('--report-dir',type=Path,help='Override the generated analysis.json directory without changing inspection inputs')
mode=parser.add_mutually_exclusive_group()
mode.add_argument('--verify-only',action='store_true',help='Verify all photo/crop bindings without rendering or rewriting reports')
mode.add_argument('--render-only',action='store_true',help='Export actual current/baseline SVGs and input provenance without launching Chromium')
args=parser.parse_args()
WORK=Path(args.work).resolve()
(WORK/'photos').mkdir(parents=True,exist_ok=True)
references=json.loads((ROOT/'docs/research/decal-online-analysis/reference-manifest.json').read_text())
photo_mode='cached-crops' if args.cached_crops else os.environ.get('DECAL_ANALYSIS_PHOTO_MODE','original')
if photo_mode not in ['original','cached-crops']:parser.error('DECAL_ANALYSIS_PHOTO_MODE must be original or cached-crops')
crop_manifest=load_crop_manifest(ROOT) if photo_mode=='cached-crops' else None
verified=[]
for reference in references:
 if photo_mode=='cached-crops':
  photo,provenance=read_cached_crop(reference,ROOT,crop_manifest)
 else:
  path=ROOT/reference['photoFile']
  if not path.exists():
   path=WORK/'photos'/reference['photoFile']
   if not path.exists():
    path.parent.mkdir(parents=True,exist_ok=True)
    request=urllib.request.Request(reference['source'],headers={'User-Agent':'Plateforge-reference-review/2.0'})
    path.write_bytes(urllib.request.urlopen(request,timeout=60).read())
  photo,provenance=read_original_crop(reference,ROOT,WORK)
 verified.append({'id':reference['id'],'source':reference['source'],'cropPixels':list(photo.size),**provenance})
(WORK/'source-verification.json').write_text(json.dumps({'schema':'plateforge.decal-source-verification/v1','manifestSha256':hashlib.sha256((ROOT/'docs/research/decal-online-analysis/reference-manifest.json').read_bytes()).hexdigest(),'specimens':verified},indent=2)+'\n')
print(json.dumps({'verifiedSpecimens':len(references),'photoMode':photo_mode,'originalBytesVerified':photo_mode=='original'}),flush=True)
if args.verify_only:sys.exit(0)
env={**os.environ,'DECAL_ANALYSIS_DOC':'docs/research/decal-online-analysis','DECAL_ANALYSIS_OUT':str(args.output.resolve()) if args.output else os.environ.get('DECAL_ANALYSIS_OUT','public/bc-decal-online-review'),'DECAL_ANALYSIS_RENDERER':'scripts/render-decal-online-analysis.mjs','DECAL_ANALYSIS_PHOTO_MODE':photo_mode}
if args.baseline_root:env['DECAL_ANALYSIS_BASELINE_ROOT']=str(args.baseline_root.resolve())
if args.report_dir:env['DECAL_ANALYSIS_REPORT_DOC']=str(args.report_dir.resolve())
if args.render_only:
 subprocess.run(['node',str(ROOT/'scripts/render-decal-online-analysis.mjs'),str(WORK/'render-data.json')],cwd=ROOT,env=env,check=True)
 sys.exit(0)
subprocess.run([sys.executable,str(ROOT/'scripts/build-decal-glyph-analysis.py'),str(WORK)],cwd=ROOT,env=env,check=True)
