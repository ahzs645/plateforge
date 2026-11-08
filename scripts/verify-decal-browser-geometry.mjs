/** Browser-only approximate bounds/text checks. Inkscape paint evidence is separate. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import extractAuditRuns from './decal-audit-browser.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const BOUNDS_TOLERANCE=.5, COLLISION_TOLERANCE=.6;
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

export function validateFixtureCoverage(fixtures,catalogueIds) {
  assert.equal(catalogueIds.length,55,'Expected the 55-variant decal catalogue');
  assert.equal(fixtures.length,572,'Expected all 572 catalogue/month fixtures');
  const keys=fixtures.map(fixture=>fixture.id+'/'+fixture.month);
  assert.equal(new Set(keys).size,keys.length,'Duplicate decal/month fixtures');
  const expected=catalogueIds.flatMap(id=>(Number(id.slice(0,4))>=1980?MONTHS:['JAN']).map(month=>id+'/'+month));
  assert.deepEqual([...keys].sort(),expected.sort(),'Missing or unexpected catalogue/month coverage');
  return {renderings:fixtures.length,catalogueVariants:catalogueIds.length};
}

/** Decode actual SVG bars, rather than trusting a data-control label. */
export function decodeBarcodeRects(rectangles,patterns) {
  if (!rectangles.length) throw new Error('Barcode has no bars');
  const bars=[...rectangles].sort((a,b)=>a.x-b.x),unit=Math.min(...bars.map(bar=>bar.width));
  if (!(unit>0) || !Number.isFinite(unit)) throw new Error('Invalid barcode module width');
  const widths=[];
  const modules=value=>{
    const count=Math.round(value/unit);
    if (count<1 || count>4 || Math.abs(value/unit-count)>.04) throw new Error('Barcode bars/gaps do not form integral Code128 modules');
    return count;
  };
  bars.forEach((bar,index)=>{
    widths.push(modules(bar.width));
    if(index+1<bars.length)widths.push(modules(bars[index+1].x-bar.x-bar.width));
  });
  if (widths.length<19 || (widths.length-7)%6) throw new Error('Invalid Code128 symbol length');
  const lookup=new Map(patterns.map((pattern,index)=>[pattern.join(','),index])),codes=[];
  for(let offset=0;offset<widths.length-7;offset+=6)codes.push(lookup.get(widths.slice(offset,offset+6).join(',')));
  codes.push(lookup.get(widths.slice(-7).join(',')));
  if(codes.some(code=>code===undefined) || codes[0]!==105 || codes.at(-1)!==106)throw new Error('Barcode is not a complete Code128 C sequence');
  const data=codes.slice(1,-2);
  if(data.some(code=>code>99))throw new Error('Unexpected Code128 control/function code');
  const check=(codes[0]+data.reduce((sum,code,index)=>sum+code*(index+1),0))%103;
  if(check!==codes.at(-2))throw new Error('Code128 checksum mismatch');
  return {control:data.map(code=>String(code).padStart(2,'0')).join(''),codes,moduleWidth:unit};
}

/** Self-contained function passed to Playwright; no raster paint claim is made. */
export function measureFixture() {
  const svg=document.querySelector('svg');
  if(!svg)throw new Error('Fixture SVG missing');
  const inverse=svg.getCTM().inverse(),counts={};
  const bounds=element=>{
    const b=element.getBBox(),matrix=inverse.multiply(element.getCTM());
    const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
    const geometryBox=[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))];
    const declared=Number(element.getAttribute('data-ink-padding')??0);
    const x=declared*(Math.abs(matrix.a)+Math.abs(matrix.c)),y=declared*(Math.abs(matrix.b)+Math.abs(matrix.d));
    return {geometryBox,box:[geometryBox[0]-x,geometryBox[1]-y,geometryBox[2]+x,geometryBox[3]+y],padding:{declared,x,y}};
  };
  const runs=[...svg.querySelectorAll('[data-die]')].map(element=>{
    const role=element.getAttribute('data-role'),index=counts[role]??0;counts[role]=index+1;
    const chars=[...element.querySelectorAll('[data-character]')].map((glyph,index)=>{
      const box=glyph.getBBox();
      return {index,char:glyph.getAttribute('data-character'),hasGeometry:box.width>0&&box.height>0&&[...glyph.querySelectorAll('path')].some(path=>path.getAttribute('d')?.trim())};
    });
    return {role,index,text:element.getAttribute('aria-label'),profile:element.getAttribute('data-die'),fit:element.getAttribute('data-fit'),
      filledStroke:Number(element.getAttribute('data-filled-stroke')??0),chars,...bounds(element)};
  });
  const barcodes=[...svg.querySelectorAll('[data-role="decal-barcode"]')].map(element=>({role:'decal-barcode',control:element.getAttribute('data-control'),encoding:element.getAttribute('data-encoding'),
    ...bounds(element),rectangles:[...element.querySelectorAll('rect')].map(rect=>{const box=bounds(rect).geometryBox;return {x:box[0],y:box[1],width:box[2]-box[0],height:box[3]-box[1]};})}));
  return {width:svg.viewBox.baseVal.width,height:svg.viewBox.baseVal.height,runs,barcodes,expoLogoCount:svg.querySelectorAll('[data-role="decal-expo-logo"]').length};
}

export function checkFixtureMetrics(fixture,metrics,specimen,patterns) {
  const reasons=[],year=Number(fixture.id.slice(0,4));
  const fail=(code,detail)=>reasons.push({code,...detail});
  const byRole=role=>metrics.runs.filter(run=>run.role===role);
  if(![metrics.width,metrics.height].every(value=>Number.isFinite(value)&&value>0))fail('invalid-canvas',{width:metrics.width,height:metrics.height});
  const expectedYear=year>=2014?String(year):String(year%100).padStart(2,'0');
  if(fixture.year!==expectedYear)fail('fixture-year',{expected:expectedYear,actual:fixture.year});
  if(specimen.control!==null && fixture.control!==specimen.control)fail('input-control-substitution',{expected:specimen.control,actual:fixture.control});
  if(year===1970 && fixture.control!==null)fail('unexpected-1970-control',{actual:fixture.control});
  const expectedMonths=year>=1980?[fixture.month]:[];
  if(JSON.stringify(byRole('decal-month').map(run=>run.text))!==JSON.stringify(expectedMonths))fail('printed-month',{expected:expectedMonths,actual:byRole('decal-month').map(run=>run.text)});
  const expectedControls=fixture.control===null?[]:[fixture.control];
  if(JSON.stringify(byRole('decal-serial').map(run=>run.text))!==JSON.stringify(expectedControls))fail('printed-control',{expected:expectedControls,actual:byRole('decal-serial').map(run=>run.text)});
  if(year===1986) {
    if(byRole('decal-year').length || metrics.expoLogoCount!==1)fail('expo-artwork-year',{yearRuns:byRole('decal-year').length,expoLogoCount:metrics.expoLogoCount});
  } else if(byRole('decal-year').map(run=>run.text).join('')!==expectedYear)fail('printed-year',{expected:expectedYear,actual:byRole('decal-year').map(run=>run.text)});
  for(const run of metrics.runs) {
    if(run.chars.map(char=>char.char).join('')!==run.text)fail('glyph-text',{role:run.role,index:run.index,label:run.text,glyphs:run.chars.map(char=>char.char).join('')});
    const empty=run.chars.filter(char=>!/^\s$/.test(char.char)&&!char.hasGeometry);
    if(empty.length)fail('missing-glyph-geometry',{role:run.role,index:run.index,characters:empty});
    if(!['natural','reduced'].includes(run.fit))fail('missing-fit-state',{role:run.role,index:run.index,fit:run.fit});
    if(run.filledStroke>0 && !(run.padding.declared>0))fail('missing-declared-stroke-padding',{role:run.role,index:run.index});
  }
  const geometries=[...metrics.runs,...metrics.barcodes.map((barcode,index)=>({...barcode,index,text:barcode.control}))];
  for(const run of geometries) {
    const [left,top,right,bottom]=run.box;
    if(!run.box.every(Number.isFinite) || left< -BOUNDS_TOLERANCE || top< -BOUNDS_TOLERANCE || right>metrics.width+BOUNDS_TOLERANCE || bottom>metrics.height+BOUNDS_TOLERANCE || right<=left || bottom<=top)fail('approximate-bounds',{role:run.role,index:run.index,box:run.box});
  }
  for(let i=0;i<geometries.length;i++)for(const b of geometries.slice(i+1)) {
    const a=geometries[i],dx=Math.min(a.box[2],b.box[2])-Math.max(a.box[0],b.box[0]),dy=Math.min(a.box[3],b.box[3])-Math.max(a.box[1],b.box[1]);
    if(dx>COLLISION_TOLERANCE && dy>COLLISION_TOLERANCE)fail('approximate-run-collision',{a:{role:a.role,index:a.index,text:a.text},b:{role:b.role,index:b.index,text:b.text},dx,dy});
  }
  if(fixture.month==='MAY' && ['1998-type-ii','1999'].includes(fixture.id) && byRole('decal-month')[0]?.fit!=='natural')fail('observed-may-must-fit-naturally',{fit:byRole('decal-month')[0]?.fit});
  const minimum=fixture.id==='2014'&&fixture.month==='NOV'?54:fixture.id==='2023'&&fixture.month==='MAR'?44:null;
  if(minimum!==null) {
    const month=byRole('decal-month')[0],height=month?month.box[3]-month.box[1]:0;
    if(height<minimum)fail('source-supported-month-height',{minimum,actual:height});
  }
  const barcodeExpected=year>=2009;
  if(metrics.barcodes.length!==(barcodeExpected?1:0))fail('barcode-count',{expected:barcodeExpected?1:0,actual:metrics.barcodes.length});
  const decoded=[];
  for(const barcode of metrics.barcodes) {
    if(barcode.control!==fixture.control || barcode.encoding!=='Code128C')fail('barcode-input',{expected:fixture.control,actual:barcode.control,encoding:barcode.encoding});
    try {
      const result=decodeBarcodeRects(barcode.rectangles,patterns);decoded.push(result);
      if(result.control!==fixture.control)fail('barcode-decoded-control',{expected:fixture.control,actual:result.control});
    } catch(error) {fail('barcode-encoding',{error:String(error)});}
  }
  return {reasons,decodedBarcodes:decoded,controlInputEvidence:specimen.control===null&&fixture.control!==null?'Illustrative editor-derived default; no catalogue control transcription':'Explicit catalogue control, or no control for 1970'};
}

export function checkWeightedMonth(runs,fixture) {
  const month=runs.find(run=>run.role==='decal-month');
  assert.ok(month,'Weighted month run is missing');
  assert.equal(month.text,fixture.month);
  assert.equal(month.chars.map(char=>char.char).join(''),fixture.month);
  assert.equal(month.chars.length,3,'Month must contain three independent character occurrences');
  const characters=month.chars.map(char=>{
    assert.ok(char.inkBox&&!char.inkClipped,'Weighted month ink must be present and unclipped');
    const [left,top,right,bottom]=char.inkBox,geometry=char.geometryBox;
    assert.ok(right-left>1&&bottom-top>=30,'Weighted month extraction returned a tiny or empty segment');
    const expansion=[geometry[0]-left,geometry[1]-top,right-geometry[2],bottom-geometry[3]];
    assert.ok(Math.max(...expansion)>.125,'Actual alpha bounds did not retain the added month stroke');
    assert.ok(Math.min(...expansion)>=-.25,'Raster alpha unexpectedly clips bare glyph geometry');
    return {char:char.char,geometryBox:geometry,inkBox:char.inkBox,expansion};
  });
  return {id:fixture.id,month:fixture.month,profile:month.profile,inkBoundsMethod:month.inkBoundsMethod,characters};
}

function sourceProvenance() {
  const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
  const files=[...new Set(execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard','--','src','package-lock.json'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean))].sort();
  const source=crypto.createHash('sha256');
  for(const file of files)source.update(file).update('\0').update(existsSync(path.join(ROOT,file))?readFileSync(path.join(ROOT,file)):'<deleted>');
  return {commit:git('rev-parse','HEAD'),workingChanges:Boolean(git('status','--porcelain','--untracked-files=normal')),sourceSha256:source.digest('hex'),
    sourceHashScope:'Sorted tracked and nonignored untracked src files plus package-lock.json: relative path, NUL, file bytes'};
}

export async function main() {
  const browserName=process.env.TYPOGRAPHY_BROWSER??'chromium';
  if(!['chromium','firefox','webkit'].includes(browserName))throw new Error('TYPOGRAPHY_BROWSER must be chromium, firefox or webkit');
  const output=path.join(ROOT,'typography-evidence','browser-'+browserName);await mkdir(output,{recursive:true});
  const temporary=await mkdtemp(path.join(os.tmpdir(),'plateforge-decal-browser-'));
  const started=Date.now(),report={schema:'plateforge.decal-browser-geometry/v1',status:'running',browser:browserName,
    boundsMethod:'Transformed SVG getBBox() geometry plus declared data-ink-padding. This is an approximation, not rasterized painted bounds. The Inkscape correction evidence independently measures visual paint bounds.',
    tolerances:{boundsSvgUnits:BOUNDS_TOLERANCE,collisionSvgUnits:COLLISION_TOLERANCE},
    limits:'Axis-aligned bounds can overestimate painted overlap and do not model every stroke or occlusion. This fixture suite does not establish photographic fidelity or exercise application SVG/PNG downloads.',
    provenance:sourceProvenance(),checks:[],fixtures:[],failures:[]};
  let browser,launched=false;
  try {
    const filename=path.join(temporary,'fixtures.json');
    execFileSync(process.execPath,[path.join(ROOT,'scripts/render-decal-typography-fixtures.mjs'),filename],{cwd:ROOT,timeout:60000,maxBuffer:4*1024*1024});
    const bytes=await readFile(filename),fixtures=JSON.parse(bytes);
    const specimens=JSON.parse(await readFile(path.join(ROOT,'src/regions/canada/bc-decal-specimens.json'),'utf8'));
    const patterns=JSON.parse(await readFile(path.join(ROOT,'src/templates/bc/code128-patterns.json'),'utf8'));
    report.coverage=validateFixtureCoverage(fixtures,Object.keys(specimens));report.fixturesSha256=hash(bytes);
    report.provenance.fixtureGeneratorSha256=hash(await readFile(path.join(ROOT,'scripts/render-decal-typography-fixtures.mjs')));
    report.provenance.verifierSha256=hash(await readFile(fileURLToPath(import.meta.url)));
    if(sourceProvenance().sourceSha256!==report.provenance.sourceSha256)throw new Error('Sources changed while generating fixtures');
    report.checks.push({name:'Complete 572-rendering / 55-variant coverage',status:'passed'});
    const require=createRequire(path.resolve(process.env.TYPOGRAPHY_BROWSER_DEPS??path.join(ROOT,'package.json')));
    const engine=require('playwright')[browserName];
    report.status='launching';
    browser=await engine.launch({headless:true,timeout:30000});launched=true;report.browserVersion=browser.version();report.status='running';
    const context=await browser.newContext({viewport:{width:1500,height:320},deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(10000);
    const deadline=Date.now()+4*60*1000;
    for(const [index,fixture] of fixtures.entries()) {
      if(Date.now()>deadline)throw new Error('572-case geometry check exceeded its four-minute browser budget');
      await page.setContent('<!doctype html><style>html,body{margin:0;padding:0}svg{display:block;max-width:none}</style>'+fixture.svg,{waitUntil:'domcontentloaded'});
      const metrics=await page.evaluate(measureFixture);
      const checked=checkFixtureMetrics(fixture,metrics,specimens[fixture.id],patterns);
      if(fixture.id==='2023'&&fixture.month==='MAR') {
        try {
          const detail=checkWeightedMonth(await page.evaluate(extractAuditRuns),fixture);
          report.checks.push({name:'Weighted modern month: actual alpha bounds include stroke',status:'passed',...detail});
        } catch(error) {
          checked.reasons.push({code:'weighted-month-alpha-extraction',error:String(error)});
          report.checks.push({name:'Weighted modern month: actual alpha bounds include stroke',status:'failed',error:String(error)});
        }
      }
      const row={id:fixture.id,month:fixture.month,control:fixture.control,year:fixture.year,svgSha256:hash(fixture.svg),...checked,...metrics};
      report.fixtures.push(row);
      if(checked.reasons.length) {
        report.failures.push({id:fixture.id,month:fixture.month,reasons:checked.reasons});
        if(report.failures.length<=20) {
          const failureDirectory=path.join(output,'decal-geometry-failures');await mkdir(failureDirectory,{recursive:true});
          await writeFile(path.join(failureDirectory,(fixture.id+'-'+fixture.month).replace(/[^a-z0-9-]/gi,'_')+'.svg'),fixture.svg);
        }
      }
      if((index+1)%100===0)console.log(`Decal browser geometry ${index+1}/${fixtures.length}`);
    }
    await context.close();
    report.status=report.failures.length?'failed':'passed';
    report.checks.push({name:'Approximate bounds, run collisions, glyph/input equality, Code128 decoding and source-supported fit guards',status:report.status,renderings:report.fixtures.length});
  } catch(error) {
    report.status=report.status==='launching'&&!launched?'blocked':'failed';report.error=String(error);
    report.checks.push({name:report.status==='blocked'?'Browser launch':'Fixture generation or browser execution',status:report.status,error:String(error)});
  } finally {
    if(browser)await browser.close().catch(()=>{});
    report.durationMs=Date.now()-started;
    await writeFile(path.join(output,'decal-geometry.json'),JSON.stringify(report,null,2)+'\n');
    await rm(temporary,{recursive:true,force:true});
  }
  console.log(JSON.stringify({browser:browserName,status:report.status,renderings:report.fixtures.length,failedFixtures:report.failures.length,report:path.join(output,'decal-geometry.json')}));
  if(report.status!=='passed')process.exitCode=1;
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await main();
