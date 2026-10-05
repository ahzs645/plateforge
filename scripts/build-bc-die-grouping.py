#!/usr/bin/env python3
"""Build an evidence-labelled, cross-class catalogue; never infer dies from year alone."""
import argparse,json,collections,shutil,re
from PIL import Image
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/bc-font-comparisons/die-grouping';DOC=ROOT/'docs/research/bc-die-grouping';OUT.mkdir(parents=True,exist_ok=True);DOC.mkdir(parents=True,exist_ok=True)
def read(p,fallback=None):
 p=Path(p);return json.loads(p.read_text()) if p.exists() else fallback
parser=argparse.ArgumentParser();parser.add_argument('--committed-inputs',action='store_true',help='Use only committed source/evidence snapshots, regardless of temporary review files.');args=parser.parse_args()
def source(temporary,committed):
 return read(DOC/committed) if args.committed_inputs else read(temporary,read(DOC/committed))
inventory=source('/tmp/bc-grouping-inventory.json','source-inventory.json');hist=source('/tmp/bc-group-historical-evidence.json','historical-evidence.json');modern=source('/tmp/bc-group-modern-evidence.json','modern-evidence.json');special=source('/tmp/bc-group-special-evidence.json','special-evidence.json');diagnostics=source('/tmp/bc-die-consistency-all.json','implementation-consistency.json')

profiles={p['id']:p for p in inventory['profiles']};historic={p['formatId']:p for p in hist.get('formatAssessments',[])};special_assign={p.get('formatId',p.get('id')):p for p in special.get('assignments',[])}
captures=read(OUT/'browser-selection.json',{});capture_map={x['id']:x for x in captures.get('formats',[])}
refresh=read(OUT/'browser-selection-refresh.json',{})
for x in refresh.get('formats',[]):capture_map[x['id']]=x
rules=[]
for x in hist.get('rules',[]):rules.append({**x,'origin':'historical source review','sourceUrls':[x['url']],'confidence':x.get('certainty','source context')})
for i,x in enumerate(modern.get('items',[])):
 rule={**x,'id':'modern-'+str(i),'origin':'modern source review','sourceUrls':[u for u in [x.get('source'),x.get('relatedSource')] if u]}
 corrected={'commercial-flag-2008','farm-truck-2025','trailer-utility-flag-2000','trailer-utility-2016'}
 if corrected.intersection(x.get('formatIds',[])):
  rule['implementationStatus']='Declared Waldale default corrected and browser/export verified.'
  rule.pop('currentConflict',None)
  rule['claim']=re.sub(r'Current[^.]*\.', '',rule['claim'])+' Implementation: declared sole-Waldale defaults now use the registered Waldale recipe.'
 rules.append(rule)
for x in special.get('findings',[]):rules.append({**x,'origin':'special / small-format source review'})
maker_map={'bc-early-1940':'Oakalla Prison Plate Shop','bc-tacey-1936':'Oakalla Prison Plate Shop','bc-straight-1928':'Tacey / Oakalla (run-dependent)','bc-block-1918':'J.R. Tacey & Sons','bc-porcelain-1913':'McClary Manufacturing','bc-porcelain-1914':'McClary Manufacturing'}
records=[]
for f in inventory['formats']:
 id=f['id'];d=f['serialDie'];p=profiles.get(d,{});serial=f['sampleParts'].get('serial','');physical=f.get('physicalMm');has_serial=bool(serial);notes=[];findings=[];assignment='Comparison candidate';h=historic.get(id)
 for x in rules:
  explicit=id in x.get('formatIds',[])
  broad=not x.get('formatIds') and f['type'] in x.get('plateClasses',[]) and d in x.get('family','')
  if explicit or broad:findings.append(x['id'])
 if h:notes.append(h['certainty']);notes.extend(h.get('exceptions',[]) if isinstance(h.get('exceptions'),list) else [])
 for x in special.get('findings',[]):
  if id in x.get('formatIds',[]):notes.append(x['claim']);notes.append(x.get('limits',''));assignment=x['confidence']
 if findings and assignment=='Comparison candidate':assignment='Source context / attributed production family'
 if f['type']=='passenger' and not findings:assignment='Source-era context; cross-class tooling unconfirmed'
 if f['type']=='passenger' and f['period'] and f['period'][0]<1913:
  category='owner-made / private issue';group='owner-private-early';label='Owner-made / private early lettering';maker='Owner / private manufacture unresolved';assignment='Owner-made proxy or uncertain private issue';notes.append('No provincial factory or uniform die alphabet is established. A later named recipe profile must not confer its production era on these owner-made reconstructions.')
 elif not has_serial:
  category='fixed artwork / inscription';component=next((x['die'] for x in f['legendDies'] if x.get('die')), 'individual-artwork');group='artwork-'+component;label=p.get('label',d);label='Fixed artwork / '+profiles.get(component,{}).get('label',component);assignment='Separate inscription / artwork';maker=profiles.get(component,{}).get('maker') or 'Not a numbered manufactured die assignment'
 elif f['type']=='bicycle' or (f['type']=='municipal' and not id.startswith(('municipal-prov','municipal-exempt'))):
  category='local / small tooling';group='local-'+f['type'];label='Local '+f['type']+' lettering · maker/tooling unresolved';maker='Local maker; many bicycle sources name George Hewitt Co.';assignment='Unresolved local tooling';notes.append('Generic model alphabet is a visual proxy. The same year or profile does not place a local issue in the provincial passenger die era.')
 elif id in ('events-expo86-nwt','events-expo86-stencil'):
  category='independent event lettering';group='event-nwt' if id.endswith('nwt') else 'event-stencil';label='NWT souvenir · independent territory tooling' if id.endswith('nwt') else 'Expo stencil · origin unknown';maker='Manufacturer unresolved; not assigned from the B.C. model profile';assignment='Separate territorial tooling / stencil art';notes.append('An Expo date or a B.C. catalogue entry does not establish B.C. passenger dies. NWT smaller-stacked and normal-number specimens coexist; the stencil version is flat artwork.')
 elif 'defence-pcmr' in id or id in ('official-defence-esquimalt','official-defence-comox'):
  category='independent military / painted lettering';group='local-military-'+id;label='Independent local military lettering · '+f['label'];maker='Local military / manufacturer unresolved';assignment='Source uncertainty / representative photograph support'
 elif 'defence-canada' in id or 'apec-military' in id:
  category='federal tooling';group='federal-canada';label='Federal CANADA plates · separate tooling';maker='Federal production';assignment='Separate federal context';notes.append('The recipe’s B.C. profile is an implementation proxy, not a B.C. manufacturer attribution.')
 elif id.startswith('trailer-') and f['period'] and f['period'][0]<=1948:
  category='early trailer small tooling';group='early-trailer-monogram' if f['period'][0]<1923 else 'early-trailer-upright';label='Early trailer monogram BC · 1921–22' if f['period'][0]<1923 else 'Early trailer upright rounded small tooling · 1923–48';maker='Tacey / Oakalla context; dedicated small reconstruction';assignment='Source context / representative photograph support';notes.append('BC, date, reduced T/TR and large serial are separate components. This comparison cohort is not a claim of identical passenger tooling.')
 else:
  small=(physical and physical['width']<245) or f['type']=='motorcycle' or (f.get('serialCapMm') and f['serialCapMm']<40)
  category='small / compact tooling' if small else 'full-size serial tooling';group=d+('-small' if small else '-full');label=p.get('label',d)+(' · small / compact' if small else ' · full-size');maker=p.get('maker') or maker_map.get(d) or 'Not established from profile alone'
  if f['status'] not in ('issued','official-sample'):notes.append('Non-issued example: design/date alone does not establish registration production tooling.')
  if f['type'] in ('samples','events'):assignment='Sample / special issue; provenance needs separate review'
 if id in ('commercial-flag-2008','farm-truck-2025','trailer-utility-flag-2000','trailer-utility-2016') and d=='bc-waldale':notes.append('Corrected declared single-option default: the registered recipe now uses Waldale instead of an inherited Astrographic default. Historical production still follows its class-specific run, not the base-design date.')
 if id=='trailer-utility-flag-2000':notes.append('The base spans overlapping Astrographic 2000–04 and Waldale 2002–16 manufacture. A declared Waldale model choice does not assign the entire base period to Waldale; exact serial transition is unresolved.')
 if id=='industrial-logging-1984':notes.append('Source proposes Hi-Signs from visual die evidence; ACME default remains a research assignment to review. This is an estimate, not an exact serial transition.')
 consistency=next((x for x in diagnostics.get('comparisons',[]) if x['format']==id and x['profile']==d),None)
 capture=capture_map.get(id,{})
 records.append({'id':id,'label':f['label'],'type':f['type'],'period':f['period'],'status':f['status'],'profile':d,'profileLabel':p.get('label',d),'maker':maker,'group':group,'groupLabel':label,'toolingVariant':category,'assignment':assignment,'physicalMm':physical,'serialCapMm':f['serialCapMm'],'sampleSerial':capture.get('serial',serial),'sources':f['sources'],'evidenceRules':findings,'notes':list(dict.fromkeys(n for n in notes if n)),'components':f['legendDies'],'sharedPassengerMasters':f['sharedPassengerMasters'],'productionDateInferred':False,'identicalPhysicalToolingConfirmed':False,'browserSelected':capture.get('selected',False),'previewCaptured':capture.get('previewCaptured',False),'consistency':({k:consistency[k] for k in ['passengerReference','effectiveResearchContext','explicitSharedMapping','matchingCharacters','differingCharacters'] if k in consistency} if consistency else None)})
for f in records:
 related=[x for x in records if x['id']!=f['id'] and x['type']!=f['type'] and x['group']==f['group']]
 related.sort(key=lambda x:(x['type']!='passenger',abs((x['period'] or [0])[0]-(f['period'] or [0])[0]),x['id']))
 seen=set();f['related']=[]
 for x in related:
  if x['type'] not in seen:seen.add(x['type']);f['related'].append({'id':x['id'],'label':x['label'],'type':x['type'],'basis':'Same model family and physical tooling bucket; source attribution/identity must be checked separately.'})
  if len(f['related'])==4:break
 if not f['related']:
  peers=[x for x in records if x['id']!=f['id'] and x['group']==f['group']]
  peers.sort(key=lambda x:abs((x['period'] or [0])[0]-(f['period'] or [0])[0]))
  f['related']=[{'id':x['id'],'label':x['label'],'type':x['type'],'basis':'Same comparison group across other designs/periods; manufacture date and physical die identity remain independent.'} for x in peers[:4]]
 if f['group']=='early-trailer-upright':f['related'] += [{'id':'motorcycle-1923','label':'Motorcycle early BC layout','type':'motorcycle','basis':'Source explicitly compares early trailer and motorcycle design/serial arrangements; exact physical dies not certified.'}] if any(x['id']=='motorcycle-1923' for x in records) else []
previous=read(OUT/'catalogue.json',{});previous_photos={x['source']:x for x in previous.get('photographs',[])}
# Source-directed candidates take precedence over mere named-profile neighbours.
aliases={'ham-flag':'ham-radio-1986-flag','prorated-flag':'carrier-prorate-flag-1985'}
record_by_id={x['id']:x for x in records}
for f in records:
 explicit=[]
 for rule in special.get('findings',[]):
  if f['id'] not in rule.get('formatIds',[]):continue
  for candidate in rule.get('similarityCandidates',[]):
   cid=aliases.get(candidate,candidate);x=record_by_id.get(cid)
   if x and cid!=f['id'] and cid not in {r['id']for r in explicit}:
    explicit.append({'id':cid,'label':x['label'],'type':x['type'],'basis':'Source-directed design / manufacturer comparison. '+rule.get('limits','Exact alphabet and physical tool identity remain unconfirmed.')})
 if explicit:f['related']=(explicit+[r for r in f['related'] if r['id'] not in {x['id']for x in explicit}])[:4]
photos=[]
raw_photos=[*hist.get('visualComparisons',[]),*special.get('representativePhotographs',[])]
for photo in modern.get('referencePhotographs',[]):
 observations=[x['observation'] for x in modern.get('visualComparisons',[]) if photo['id'] in x.get('photoIds',[])]
 raw_photos.append({'source':photo['sourceURL'],'localPath':photo['path'],'title':photo['title'],'finding':' '.join(observations),'method':'Original photograph visually inspected in a cross-class contact sheet; no perspective registration or all-glyph outline validation.'})
seen_sources=set()
for x in raw_photos:
 source=x.get('source',x.get('sourceUrl',x.get('sourceURL',x.get('sourceImageUrl',x.get('url')))));file=x.get('localPath',x.get('file'))
 if not source or source in seen_sources:continue
 seen_sources.add(source);name=source.rsplit('/',1)[-1];possible=[Path(file)] if file else []
 possible += [Path('/tmp/bc-group-historical-sources')/name,Path('/tmp/bc-modern-grouping-photos')/name,Path('/tmp/bc-group-special-photos')/name]
 found=next((p for p in possible if p.exists()),None);target=previous_photos.get(source,{}).get('localImage')
 if found:
  (OUT/'sources').mkdir(exist_ok=True);target='sources/'+found.stem+'.webp';im=Image.open(found).convert('RGB');im.thumbnail((800,450));im.save(OUT/target,'WEBP',quality=91)
 photos.append({**x,'source':source,'localImage':target})
bytype=collections.Counter(x['type'] for x in records);groups=collections.defaultdict(list)
for x in records:groups[x['group']].append(x)
report={'title':'B.C. cross-class die and production catalogue','method':'Every current preset was selected in a browser; current reproduction captures are checked separately from representative photographed source comparisons. Grouping uses declared serial profiles and physical tooling buckets, then source rules and explicit exceptions. It does not infer manufacture from a photograph/decal year, certify every glyph, or prove identical physical tools.','coverage':{'presets':len(records),'types':len(bytype),'browserSelected':sum(x['browserSelected'] for x in records),'previews':sum(x['previewCaptured'] for x in records),'byType':dict(bytype),'comparisonGroups':len(groups),'representativePhotographs':len(photos)},'records':records,'groups':[{'id':k,'label':v[0]['groupLabel'],'count':len(v),'types':sorted(set(x['type'] for x in v))} for k,v in groups.items()],'evidenceRules':rules,'photographs':photos,'diagnosticMethod':diagnostics.get('method',''),'sourceLimitations':['Same factory can use multiple alphabets and sizes.','Serials, province legends, slogans, dates and renewal pieces are independent components.','Model outline equality or difference is an implementation diagnostic, not a historical accuracy score.','Source text and a representative photograph do not verify an entire alphabet.']}
(DOC/'source-inventory.json').write_text(json.dumps(inventory,indent=2)+'\n')
(OUT/'catalogue.json').write_text(json.dumps(report,indent=2)+'\n');(DOC/'catalogue.json').write_text(json.dumps(report,indent=2)+'\n')
for name,data in [('historical-evidence',hist),('modern-evidence',modern),('special-evidence',special),('implementation-consistency',diagnostics)]:
 (DOC/(name+'.json')).write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps(report['coverage']))
