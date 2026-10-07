#!/usr/bin/env python3
"""Verify occurrence identity, uncertainty handling, report resources and mobile layout."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];p=json.load(open(root/'docs/research/decal-glyph-analysis/analysis.json'));keys=[]
for d in p['specimens']:
 for r in d['runs']:
  for c in r.get('occurrences',[]):
   keys.append((d['id'],r['role'],r['index'],c['textIndex']))
   if c['quality']=='tentative':assert not c['scores']
assert len(keys)==len(set(keys))==p['summary']['occurrences']
base=os.environ.get('DECAL_SITE','http://127.0.0.1:5176/plateforge/')+'bc-decal-glyph-review/'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];failed=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
 page.goto(base);assert page.locator('article').count()==55;page.locator('details').evaluate_all('els=>els.forEach(el=>el.open=true)');page.locator('img').evaluate_all('els=>els.forEach(el=>el.loading="eager")');page.wait_for_function('Array.from(document.images).every(im=>im.complete&&im.naturalWidth>0)');images=page.locator('img').count()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
 page.goto(base+'standalone.html');assert page.locator('article').count()==55;assert page.locator('img[src^="data:"]').count()==images
 assert not errors and not failed
 result={'specimens':55,'uniqueOccurrenceRecords':len(keys),'independentlySegmentedOccurrences':sum(c['quality']!='tentative' for d in p['specimens'] for r in d['runs'] for c in r.get('occurrences',[])),'loadedImages':images,'mobileWidth':390,'mobileOverflow':False,'portableEmbeddedImages':images,'errors':errors,'failedResources':failed};print(json.dumps(result));(root/'docs/research/decal-glyph-analysis/report-validation.json').write_text(json.dumps(result,indent=2)+'\n');b.close()
