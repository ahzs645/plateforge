import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateFixtureCoverage,decodeBarcodeRects,checkFixtureMetrics,checkWeightedMonth} from './verify-decal-browser-geometry.mjs';

const specimens=JSON.parse(fs.readFileSync(new URL('../src/regions/canada/bc-decal-specimens.json',import.meta.url)));
const patterns=JSON.parse(fs.readFileSync(new URL('../src/templates/bc/code128-patterns.json',import.meta.url)));
const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const run=(role,text,box)=>({role,index:0,text,profile:'fixture',fit:'natural',box,geometryBox:box,padding:{declared:0,x:0,y:0},filledStroke:0,chars:[...text].map((char,index)=>({index,char,hasGeometry:char!==' '}))});
const annual={id:'1977',month:'JAN',control:'7006989',year:'77'};
const annualMetrics=()=>({width:200,height:100,expoLogoCount:0,barcodes:[],runs:[run('decal-year','77',[10,10,30,40]),run('decal-serial','7006989',[10,60,110,80])]});

function barFixture(codes,unit=1) {
  let cursor=10;const bars=[];
  codes.flatMap(code=>patterns[code]).forEach((width,index)=>{if(index%2===0)bars.push({x:cursor,y:75,width:width*unit,height:15});cursor+=width*unit;});
  return bars;
}

test('coverage rejects a missing or duplicated selectable month',()=>{
  const ids=Object.keys(specimens),fixtures=ids.flatMap(id=>(Number(id.slice(0,4))>=1980?months:['JAN']).map(month=>({id,month})));
  assert.deepEqual(validateFixtureCoverage(fixtures,ids),{renderings:572,catalogueVariants:55});
  assert.throws(()=>validateFixtureCoverage(fixtures.slice(1),ids),/572/);
  assert.throws(()=>validateFixtureCoverage([fixtures[1],...fixtures.slice(1)],ids),/Duplicate/);
});

test('glyph/control equality detects substitutions even when fixture labels agree',()=>{
  assert.deepEqual(checkFixtureMetrics(annual,annualMetrics(),specimens['1977'],patterns).reasons,[]);
  const missing=annualMetrics();missing.runs[1].chars.pop();
  assert.ok(checkFixtureMetrics(annual,missing,specimens['1977'],patterns).reasons.some(reason=>reason.code==='glyph-text'));
  const replaced={...annual,control:'0688523'},metrics=annualMetrics();metrics.runs[1]=run('decal-serial','0688523',[10,60,110,80]);
  assert.ok(checkFixtureMetrics(replaced,metrics,specimens['1977'],patterns).reasons.some(reason=>reason.code==='input-control-substitution'));
});

test('declared-padding bounds detect clipping and run collisions',()=>{
  const clipped=annualMetrics();clipped.runs[0].box[0]=-.8;
  assert.ok(checkFixtureMetrics(annual,clipped,specimens['1977'],patterns).reasons.some(reason=>reason.code==='approximate-bounds'));
  const colliding=annualMetrics();colliding.runs[1].box=[15,20,50,50];
  assert.ok(checkFixtureMetrics(annual,colliding,specimens['1977'],patterns).reasons.some(reason=>reason.code==='approximate-run-collision'));
});

test('SVG bar decoder preserves leading zeroes and checks real encoded content',()=>{
  // Start C, 00 00 00 01, checksum 06, stop: the official illustration's input.
  assert.equal(decodeBarcodeRects(barFixture([105,0,0,0,1,6,106],1.75),patterns).control,'00000001');
  assert.throws(()=>decodeBarcodeRects(barFixture([105,0,0,0,1,7,106]),patterns),/checksum/);
  const corrupt=barFixture([105,0,0,0,1,6,106]);corrupt[2].width+=.2;
  assert.throws(()=>decodeBarcodeRects(corrupt,patterns),/integral/);
});

test('barcode label alone cannot hide a different encoded control',()=>{
  const fixture={id:'2017',month:'JUL',year:'2017',control:'00000001'};
  const metrics={width:240,height:100,expoLogoCount:0,runs:[run('decal-month','JUL',[10,10,70,60]),run('decal-year','2017',[160,10,230,60]),run('decal-serial','00000001',[140,75,230,90])],
    barcodes:[{role:'decal-barcode',control:'00000001',encoding:'Code128C',box:[10,75,89,90],rectangles:barFixture([105,0,0,0,2,10,106])}]};
  assert.ok(checkFixtureMetrics(fixture,metrics,{control:'00000001'},patterns).reasons.some(reason=>reason.code==='barcode-decoded-control'));
});

test('source-supported MAY must retain natural fitting in its two corrected variants',()=>{
  for(const id of ['1998-type-ii','1999']) {
    const fixture={id,month:'MAY',year:id.slice(2,4),control:specimens[id].control};
    const metrics={width:330,height:100,expoLogoCount:0,barcodes:[],runs:[run('decal-month','MAY',[10,10,120,80]),run('decal-year',fixture.year,[270,10,320,80]),run('decal-serial',fixture.control,[150,70,240,90])]};
    assert.deepEqual(checkFixtureMetrics(fixture,metrics,specimens[id],patterns).reasons,[]);
    metrics.runs[0].fit='reduced';
    assert.ok(checkFixtureMetrics(fixture,metrics,specimens[id],patterns).reasons.some(reason=>reason.code==='observed-may-must-fit-naturally'));
  }
});

test('weighted-month regression requires actual stroke expansion and rejects tiny glyphs',()=>{
  const fixture={id:'2023',month:'MAR'};
  const month={role:'decal-month',text:'MAR',profile:'weighted-fixture',inkBoundsMethod:'fixture alpha',chars:[...'MAR'].map((char,index)=>({char,geometryBox:[10+index*20,10,25+index*20,60],inkBox:[9.5+index*20,9.5,25.5+index*20,60.5],inkClipped:false}))};
  assert.equal(checkWeightedMonth([month],fixture).characters.length,3);
  const bare=structuredClone(month);bare.chars[0].inkBox=bare.chars[0].geometryBox;
  assert.throws(()=>checkWeightedMonth([bare],fixture),/added month stroke/);
  const tiny=structuredClone(month);tiny.chars[0].inkBox=[1,1,2,2];
  assert.throws(()=>checkWeightedMonth([tiny],fixture),/tiny or empty/);
});
