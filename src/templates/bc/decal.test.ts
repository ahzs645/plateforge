import {describe, expect, it} from 'vitest';
import {BC_DECALS, decalId} from '../../regions/canada/bc-decals';
import {decalArt} from '../../regions/canada/bc-kit';
import {serializeSvgNode, type SvgNode} from '../svg-scene';
import {buildDecal, decalBox} from './decal';
import {code128Codes} from './decal-barcode';

const box = {x:0,y:0,width:230,height:100};
const get = (id:string) => BC_DECALS.find(d=>decalId(d)===id)!;
function render(id:string, control='99103688') {
  return buildDecal(decalArt(get(id),{decalMonth:'NOV',decalSerial:control}),box);
}
function find(scene:SvgNode, role:string):SvgNode[] {
  return [...(scene.attrs['data-role']===role?[scene]:[]),...scene.children.flatMap(c=>typeof c==='string'?[]:find(c,role))];
}

describe('Photographed B.C. decal printing systems',()=>{
  it('uses the full year and separate vertical province construction from 2014',()=>{
    const modern=render('2014');
    expect(find(modern,'decal-year')[0].attrs['aria-label']).toBe('2014');
    expect(find(modern,'decal-legend')).toHaveLength(2);
    expect(find(modern,'decal-legend').every(n=>n.attrs['data-die']==='bc-decal-print-vertical-province')).toBe(true);
    expect(serializeSvgNode(modern)).toContain('rotate(-90)');
    expect(find(render('2013'),'decal-year')[0].attrs['aria-label']).toBe('13');
  });
  it('encodes the actual printed control with the independently checked Code 128 C checksum',()=>{
    expect(code128Codes('99103688')).toEqual([105,99,10,36,88,66,106]);
    expect(code128Codes('00000000')).toEqual([105,0,0,0,0,2,106]);
    expect(()=>code128Codes('1234567')).toThrow(RangeError);
    expect(find(render('2014'),'decal-barcode')[0].attrs['data-control']).toBe('99103688');
    expect(find(render('2009'),'decal-barcode')).toHaveLength(1);
    expect(find(render('2008'),'decal-barcode')).toHaveLength(0);
  });
  it('handles unfinished control input without breaking the preview',()=>{
    for(const value of ['9','not digits','123456789']) {
      const art=decalArt(get('2022'),{decalSerial:value,serial:'NWT123'});
      expect(art.serial).toMatch(/^\d{8}$/);
      expect(()=>buildDecal(art,box)).not.toThrow();
    }
  });
  it('preserves decal proportions when the well width limits the size',()=>{
    const art=decalArt(get('1989'),{});
    const b=decalBox(art,{x:10,y:20,width:40,height:40});
    expect(b.width/b.height).toBeCloseTo(art.aspect);
    expect(b.x+b.width/2).toBe(30);
    expect(b.y+b.height/2).toBe(40);
  });
  it('keeps the supplied Expo artwork and the distinct double-outline variant',()=>{
    expect(serializeSvgNode(render('1986'))).toContain('user-supplied-Expo86logo.svg');
    expect(find(render('1999-white'),'decal-inner-border')).toHaveLength(1);
    expect(get('2008').serialInk).toBe(get('2008').ink);
  });
  it.each(BC_DECALS)('renders the individually recorded $year $variant specimen with portable outlines',decal=>{
    const r=decal.specimen!;
    expect(r.photoInspected).toBe(true);
    expect(r.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    const art=decalArt(decal,{decalMonth:r.month??'JAN',decalSerial:r.control??''});
    const svg=serializeSvgNode(buildDecal(art,{...box,width:art.aspect*100}));
    expect(svg).not.toMatch(/NaN|Infinity|<text|<image|bc-legend-/);
    expect(svg).toContain('data-printing-system=');
  });
});
