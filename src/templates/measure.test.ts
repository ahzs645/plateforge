import {afterEach,describe,expect,it,vi} from 'vitest';
import {canvasFont,fit,inkExtent,measure} from './measure';
const font={family:'"Barlow Condensed"',size:20,weight:600,style:'italic' as const,letterSpacing:2};
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
describe('measurement consistency',()=>{
  it('includes rendered style in canvas shorthand',()=>expect(canvasFont(font)).toBe('italic 600 20px "Barlow Condensed"'));
  it.each([0,-1,Infinity,NaN])('rejects invalid size %s',size=>expect(()=>canvasFont({...font,size})).toThrow());
  it('keeps SSR estimates explicitly separate and Unicode-aware',()=>{expect(measure('😀',font)).toBe(13);expect(inkExtent('',font)).toEqual({ascent:0,descent:0});});
  it('only fits overflowing text',()=>{expect(fit('1',font,100).attrs).toEqual({});expect(fit('123456',font,20).attrs).toEqual({textLength:20,lengthAdjust:'spacingAndGlyphs'});});
  it('resets canvas tracking and measures the actual italic style',async()=>{
    const ctx={font:'',letterSpacing:'9px',wordSpacing:'8px',textAlign:'end',textBaseline:'top',measureText:vi.fn(()=>({width:30,actualBoundingBoxAscent:12,actualBoundingBoxDescent:3}))};
    vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx})});
    const module=await import('./measure');
    expect(module.measure('ABC',font)).toBe(36);expect(ctx.font).toContain('italic 600');expect(ctx.letterSpacing).toBe('0px');expect(ctx.wordSpacing).toBe('0px');
    expect(module.inkExtent('ABC',font)).toEqual({ascent:12,descent:3});
  });
});
