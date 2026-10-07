import {describe, expect, it} from 'vitest';
import {BC_DECALS, decalId} from '../../regions/canada/bc-decals';
import {decalArt} from '../../regions/canada/bc-kit';
import {serializeSvgNode, type SvgNode} from '../svg-scene';
import {buildDecal, decalBox} from './decal';
import {code128Codes} from './decal-barcode';
import {DECAL_TYPOGRAPHY, decalTypography} from './decal-typography';

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
  it('applies the ICBC July 2017 design boundary to the selected expiry month',()=>{
    const early=decalTypography('2017','JUN')!;
    const late=decalTypography('2017','JUL')!;
    expect(early.layout?.cornerRadius).toBe(0);
    expect(late.layout?.cornerRadius).toBe(.10);
    expect(late.runs['decal-month'][0].cap).toBeLessThan(early.runs['decal-month'][0].cap);
    const d=get('2017');
    const june=buildDecal(decalArt(d,{decalMonth:'JUN'}),box);
    const july=buildDecal(decalArt(d,{decalMonth:'JUL'}),box);
    expect((june.children[0] as SvgNode).attrs.rx).toBe(0);
    expect((july.children[0] as SvgNode).attrs.rx).toBe(10);
    expect(find(june,'decal-month')[0].attrs['aria-label']).toBe('JUN');
    expect(find(july,'decal-month')[0].attrs['aria-label']).toBe('JUL');
  });
  it('retains photographed punctuation in the 1975 and 1977 class lines',()=>{
    expect(find(render('1975'),'decal-class').map(n=>n.attrs['aria-label'])).toContain('PASS. COMM.');
    expect(find(render('1977'),'decal-class').map(n=>n.attrs['aria-label'])).toContain('PASS. COMM.');
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
  it('covers every catalogue variant with its own source-linked typography review',()=>{
    expect(Object.keys(DECAL_TYPOGRAPHY).sort()).toEqual(BC_DECALS.map(decalId).sort());
    for (const decal of BC_DECALS) {
      const audit=DECAL_TYPOGRAPHY[decalId(decal)];
      expect(audit.source).toBe(decal.image);
      expect(audit.sourceSha256).toBe(decal.specimen!.sourceSha256);
      const scene=render(decalId(decal));
      for (const [role, runs] of Object.entries(audit.runs)) {
        expect(find(scene,role), `${decalId(decal)} ${role} line count`).toHaveLength(runs.length);
      }
    }
  });
  it('keeps both 1984 vertical province lines distinct and separates the modern columns',()=>{
    const vertical=find(render('1984'),'decal-legend');
    expect(vertical.map(run=>run.attrs['aria-label'])).toEqual(['BRITISH','COLUMBIA']);
    expect(serializeSvgNode(render('1984'))).toContain('rotate(-90)');
    expect(find(render('1974'),'decal-year').map(run=>run.attrs['aria-label'])).toEqual(['7','4']);
    expect(find(render('1985'),'decal-legend').map(run=>run.attrs['aria-label'])).toEqual(['BRITISH COLUMBIA']);
  });
  it.each(BC_DECALS.filter(d=>d.year>=1980))('retains $year $variant month text for every selectable month',decal=>{
    for (const month of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']) {
      const scene=buildDecal(decalArt(decal,{decalMonth:month}),box);
      expect(find(scene,'decal-month').map(run=>run.attrs['aria-label'])).toEqual([month]);
      expect(serializeSvgNode(scene)).not.toMatch(/NaN|Infinity/);
    }
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
