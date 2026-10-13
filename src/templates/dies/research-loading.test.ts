import {afterEach,describe,expect,it,vi} from 'vitest';
import {installResearchRegistry,loadResearchDies,researchLoadState,researchLoadError,researchRegistryLoaded,validateResearchRegistry} from './research-dies';
const valid={glyphs:[[60,'M0 0H50V100H0Z']],units:{sample:{role:'serial',title:'Source',reviewReady:true,glyphs:{A:0}}},bindings:{format:{die:['sample']}}};
afterEach(()=>{installResearchRegistry(null);vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('research loading has explicit failure and retry states',()=>{
  it('validates the actual registry schema',()=>expect(()=>validateResearchRegistry(valid)).not.toThrow());
  it.each([null,{}, {...valid,glyphs:[[NaN,'M0 0']]},{...valid,bindings:{f:{d:['missing']}}},{...valid,units:{sample:{...valid.units.sample,glyphs:{A:100}}}}])('rejects malformed indices/metrics',data=>expect(()=>validateResearchRegistry(data)).toThrow());
  it('does not claim loading forever after an HTTP failure, and retries',async()=>{
    const request=vi.fn().mockResolvedValueOnce(new Response('not found',{status:503})).mockImplementation(async()=>new Response(JSON.stringify(valid)));
    vi.stubGlobal('fetch',request);vi.spyOn(console,'warn').mockImplementation(()=>{});
    await loadResearchDies();expect(researchLoadState()).toBe('error');expect(researchLoadError()).toContain('503');expect(researchRegistryLoaded()).toBe(false);
    await loadResearchDies();expect(researchLoadState()).toBe('ready');expect(researchRegistryLoaded()).toBe(true);expect(request).toHaveBeenCalledTimes(2);
  });
});
