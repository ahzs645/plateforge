import {webcrypto,createHash} from 'node:crypto';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {EmbeddedAssetCache} from './embedded-assets';
const bytes=new Uint8Array([119,79,70,50,0,0,0,0,0,0,0,1]);
const good=()=>new Response(bytes,{headers:{'content-type':'font/woff2'}});
const digest=createHash('sha256').update(bytes).digest('hex');
afterEach(()=>vi.unstubAllGlobals());
describe('retryable asset inlining',()=>{
  it('deduplicates concurrent requests',async()=>{const request=vi.fn(async()=>good());const c=new EmbeddedAssetCache(request);await Promise.all([c.get('/a','font'),c.get('/a','font')]);expect(request).toHaveBeenCalledTimes(1);});
  it('rejects HTTP failures and permits a fresh retry',async()=>{const request=vi.fn().mockResolvedValueOnce(new Response('missing',{status:404})).mockImplementation(async()=>good());const c=new EmbeddedAssetCache(request);await expect(c.get('/a','font')).rejects.toThrow('404');await expect(c.get('/a','font')).resolves.toContain('data:font/woff2;base64,');expect(request).toHaveBeenCalledTimes(2);});
  it('rejects HTML with a successful status',async()=>{const c=new EmbeddedAssetCache(vi.fn(async()=>new Response('<html>not a font</html>',{headers:{'content-type':'text/html'}})));await expect(c.get('/a','font')).rejects.toThrow('Invalid');});
  it('rejects a payload whose magic is not a font',async()=>{const c=new EmbeddedAssetCache(vi.fn(async()=>new Response('unrecognized bytes')));await expect(c.get('/a','font')).rejects.toThrow('supported font');});
  it('verifies the exact inspected source hash',async()=>{vi.stubGlobal('crypto',webcrypto);const c=new EmbeddedAssetCache(vi.fn(async()=>good()));await expect(c.get('/a','font',digest)).resolves.toContain('base64');await expect(c.get('/a','font','0'.repeat(64))).rejects.toThrow('SHA-256');});
  it('fails explicitly when integrity cannot be checked',async()=>{vi.stubGlobal('crypto',undefined);const c=new EmbeddedAssetCache(vi.fn(async()=>good()));await expect(c.get('/a','font',digest)).rejects.toThrow('HTTPS');});
  it('evicts old entries instead of retaining arbitrary images forever',async()=>{const request=vi.fn(async()=>good());const c=new EmbeddedAssetCache(request,1);await c.get('/a','font');await c.get('/b','font');await c.get('/a','font');expect(request).toHaveBeenCalledTimes(3);});
  it.each([0,-1,1.5,Infinity])('rejects invalid cache bound %s',limit=>expect(()=>new EmbeddedAssetCache(fetch,limit)).toThrow());
});
