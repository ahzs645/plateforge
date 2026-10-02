from pathlib import Path
import subprocess,zipfile,tempfile,json,hashlib,shutil
R=Path(__file__).resolve().parents[3];D=R/'docs/research/iraq-customizer';O=D/'output';delivery=R.parent/'iraq-customizer-delivery';O.mkdir(exist_ok=True)
source=[*sorted((R/'src/templates').glob('iraq-custom-*.ts')),*sorted((R/'src/ui').glob('*IraqCustomizer*')),*sorted((R/'src/ui').glob('IraqTimeline*')),*sorted((R/'src/ui').glob('IraqWorkspace*')),*sorted((R/'src/ui').glob('iraq-timeline*')),*sorted((R/'src/ui').glob('iraq-customizer*')),R/'scripts/build-iraq-customizer.mjs']
# Documentation/generated normalization input and licences are included; redundant grids and caches are not runtime dependencies.
for p in sorted(D.rglob('*')):
 if p.is_file() and not any(x in p.parts for x in ['output','__pycache__']) and p.suffix in ['.md','.json','.py','.mjs','.ts','.txt','.svg']:source.append(p)
source=list(dict.fromkeys(source));patch=O/'Iraq-Flat-Customizer.patch';sections=[subprocess.run(['git','diff','--','src/ui/App.tsx','src/regions/asia/iraq.ts'],cwd=R,check=True,text=True,capture_output=True).stdout]
for p in source:
 rel=p.relative_to(R);lines=p.read_text().splitlines();sections.append(f'diff --git a/{rel} b/{rel}\nnew file mode 100644\n--- /dev/null\n+++ b/{rel}\n@@ -0,0 +1,{len(lines)} @@\n'+''.join('+'+x+'\n' for x in lines))
patch.write_text(''.join(sections))
with tempfile.TemporaryDirectory(prefix='iraq-custom-patch-',dir='/tmp') as t:
 p=Path(t)/'src/ui';p.mkdir(parents=True);(p/'App.tsx').write_bytes(subprocess.run(['git','show','HEAD:src/ui/App.tsx'],cwd=R,check=True,capture_output=True).stdout);q=Path(t)/'src/regions/asia';q.mkdir(parents=True);(q/'iraq.ts').write_bytes(subprocess.run(['git','show','HEAD:src/regions/asia/iraq.ts'],cwd=R,check=True,capture_output=True).stdout);subprocess.run(['git','init','-q',t],check=True);subprocess.run(['git','-C',t,'apply','--check',str(patch)],check=True)
# Preserve the exact standalone app and its source-integrity manifest.
for name in ['iraq-customizer.html','iraq-customizer.manifest.json','offline-resource-check.json']:shutil.copy(delivery/name,O/name)
validation={'typecheck':'passed','full_tests':{'passed':1365,'skipped':2,'skips':'pre-existing'},'clean_baseline_tests':{'passed':1356,'skipped':0,'files':32},'production_build':'passed','independent_scene_ui_tests':85,'timeline_route_tests':10,'timeline_eras':6,'patch_baseline':'28150d7d4e2ba175e7795911e3bfd993b455825d','font_runtime_tests':12,'font_ttf_raster_comparisons':60,'editable_presets':38,'source_artwork_rows':39,'mapped_source_artworks':39,'evidence_only_source_artworks':0,'font_profiles':7,'glyphs':172,'whole_wordmarks':33,'canonical_ttf_subsets':7,'raster_preview_inspection':'all38presets and6editedexamples','browser_interactions':'not verified; permitted CUA localhost request returned ERR_BLOCKED_BY_CLIENT','browser_screenshots':'none claimed','actual_browser_download_completion':'unverified','patch_apply_check':'passed on full clean baseline; typecheck,1356tests,sitebuild,offlinebuild,38renders all passed','no_push':True}
(O/'validation.json').write_text(json.dumps(validation,indent=2))
files={}
def add(p,name):files[name]=p.read_bytes()
for p in source:add(p,'repo/'+str(p.relative_to(R)))
add(R/'src/ui/App.tsx','repo/src/ui/App.tsx')
add(R/'src/regions/asia/iraq.ts','repo/src/regions/asia/iraq.ts')
for p in (D/'fonts/ttf').glob('*.ttf'):add(p,'repo/'+str(p.relative_to(R)))
for p in [D/'fonts/flat-font-profiles.png',D/'fonts/flat-wordmark-profiles.png']:add(p,'proofs/'+p.name)
for name in ['iraq-customizer.html','iraq-customizer.manifest.json','offline-resource-check.json','Iraq-Customizer-Examples.png','Additional-Editable-Layouts.png','validation.json','Iraq-Flat-Customizer.patch']:add(O/name,name)
add(D/'README.md','README.md')
files['SHA256SUMS.json']=json.dumps({k:hashlib.sha256(v).hexdigest() for k,v in files.items()},indent=2).encode()
z=O/'Iraq-Flat-Customizer-Source-and-Fonts.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as a:
 for name,data in sorted(files.items()):a.writestr('Iraq-Flat-Customizer/'+name,data)
with zipfile.ZipFile(z) as a:assert a.testzip() is None
assert z.stat().st_size<15*1024*1024
print(json.dumps({'zip':str(z),'bytes':z.stat().st_size,'files':len(files),'patch_bytes':patch.stat().st_size,'offline_bytes':(O/'iraq-customizer.html').stat().st_size,'preview_bytes':(O/'Iraq-Customizer-Examples.png').stat().st_size}))
