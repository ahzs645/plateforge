import { describe, it, expect } from 'vitest';
import { buildLeatherScene, leatherLayout, validLeatherSerial } from './leather-scene';
import { LEATHER_SPECIMENS, leatherGeometry } from './leather-specimens';
import { LEATHER_GLYPHS, OBSERVED_DIGITS } from './leather-glyphs';
import { serializeSvgNode } from '../svg-scene';
import { bcLeatherFormats } from '../../regions/canada/bc-leather';
import { kitRecipe } from '../../regions/canada/bc-kit';
import { buildKitScene, kitGeometry } from './kit';

describe('BC pre-provincial specimen reconstructions',()=>{
  it('keeps the existing route and adds three separately registered recipes',()=>{
    expect(bcLeatherFormats.map(f=>f.id)).toEqual(['1904-leather','1904-leather-2685','1904-leather-3432','1904-leather-4189']);
    expect(new Set(bcLeatherFormats.map(f=>f.design?.kit)).size).toBe(4);
  });
  it.each(LEATHER_SPECIMENS)('uses the $id renderer through the shared kit',s=>{
    const format=bcLeatherFormats.find(f=>f.design?.kit===`early-leather-${s.id}`)!;
    const recipe=kitRecipe(String(format.design?.kit));
    expect(kitGeometry(recipe)).toEqual(leatherGeometry(s.id));
    const svg=serializeSvgNode(buildKitScene(recipe,{serial:s.id,finish:'raised'}));
    expect(svg).toContain(`data-specimen="${s.id}"`);
    expect(svg).toContain('data-layout="specimen-positions"');
    expect(svg).not.toMatch(/<(text|image|foreignObject)\b/);
    expect(svg).not.toMatch(/font-family|@font-face|textLength/);
    expect(svg).toContain('stop-color=');
  });
  it('puts BC after the serial only in the 3432 specimen',()=>{
    for(const s of LEATHER_SPECIMENS){
      const serialMin=Math.min(...s.serial.map(x=>x.x));
      const serialMax=Math.max(...s.serial.map(x=>x.x+x.width));
      if(s.id==='3432') expect(Math.min(...s.legends.map(x=>x.x))).toBeGreaterThan(serialMax);
      else expect(Math.max(...s.legends.map(x=>x.x+x.width))).toBeLessThan(serialMin);
    }
  });
  it('supports all digits but records which are extrapolated',()=>{
    for(const s of LEATHER_SPECIMENS){
      expect(Object.keys(LEATHER_GLYPHS[s.id]).sort().join('')).toBe('0123456789');
      for(const c of s.id) expect(OBSERVED_DIGITS[s.id]).toContain(c);
      const svg=serializeSvgNode(buildLeatherScene({serial:'7070'},{specimen:s.id}));
      expect(svg).toContain('inferred-style');
      expect(svg).toContain('inferredDigits');
      expect(svg).toContain('physicalDimensionsMm&quot;:null');
    }
  });
  it('fits every supported custom number without overlapping its next glyph',()=>{
    for(const s of LEATHER_SPECIMENS) for(let number=1;number<=9999;number++){
      const serial=String(number),boxes=leatherLayout(s,serial);
      expect(boxes).toHaveLength(serial.length);
      if(serial===s.id)continue;
      for(let i=0;i<boxes.length;i++){
        const b=boxes[i];
        expect(b.x).toBeGreaterThanOrEqual(s.custom.x-0.001);
        expect(b.x+b.width).toBeLessThanOrEqual(s.custom.x+s.custom.width+0.001);
        if(i)expect(b.x).toBeGreaterThanOrEqual(boxes[i-1].x+boxes[i-1].width-0.001);
      }
    }
  });
  it('does not sanitize arbitrary input into a different registration',()=>{
    for(const bad of ['0','0123','12345','12A3','12-3','<script>','']){
      expect(validLeatherSerial(bad)).toBe(false);
      expect(leatherLayout(LEATHER_SPECIMENS[0],bad)).toEqual([]);
    }
  });
  it('makes deterministic, scope-isolated SVG and honours flat mode',()=>{
    const parts={serial:'1143',finish:'flat'};
    const a=serializeSvgNode(buildLeatherScene(parts,{scope:'spec-a'}));
    expect(a).toBe(serializeSvgNode(buildLeatherScene(parts,{scope:'spec-a'})));
    expect(a).not.toContain('illustrative-leather-grain');
    const b=serializeSvgNode(buildLeatherScene(parts,{scope:'spec-b'}));
    expect(b).not.toContain('spec-a');
  });
});
