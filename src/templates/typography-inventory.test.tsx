import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {afterAll,describe,expect,it} from 'vitest';
import './index';
import '../regions';
import {getRegions,generatePlate,templateFor,resolveDesign} from '../core/registry';
import {createRng} from '../core/random';
import {allDieProfiles} from './dies/profiles';
import {installResearchRegistry,setResearchDiesEnabled,validateResearchRegistry} from './dies/research-dies';
import {IRAQ_FONT_PROFILES} from './iraq-custom-fonts';
import {IRAN_FONT_PROFILES} from './iran-custom-fonts';
import {reviewPlateExport} from '../ui/export-policy';
import {FONT_ASSETS} from './fonts';
import {fontHasCharacter} from '../core/font-contract';
import {TYPOGRAPHY_NOTES} from '../ui/TypographyCoverage';
const rows:Record<string,unknown>[]=[];
const hash=(object:unknown)=>createHash('sha256').update(JSON.stringify(object)).digest('hex');
afterAll(()=>{installResearchRegistry(null);setResearchDiesEnabled(true);});
describe('all registered typography paths',()=>{
  it('has finite source metadata, styles and hashes for every declared face',()=>{
    expect(FONT_ASSETS.length).toBeGreaterThan(400);expect(new Set(FONT_ASSETS.map(f=>f.id)).size).toBe(FONT_ASSETS.length);
    for(const f of FONT_ASSETS){expect(f.sourceVersion).toBeTruthy();expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);expect(f.unicodeRange).toBeTruthy();expect(f.url).toBeTruthy();}
  });
  it.each([['Noto Sans SC','京津沪粤警学港澳使领'],['Noto Sans JP','品川横浜なあ東京'],['Noto Sans KR','서울경기가허하호'],['Noto Sans Canadian Aboriginal','ᓄᓇᕗᑦ']])('covers required script examples in %s',(family,text)=>{
    for(const char of text)expect(FONT_ASSETS.filter(f=>f.family===family).some(f=>fontHasCharacter(f,char)),`${family}: ${char}`).toBe(true);
  });
  it('checks actual registered formats with production and research profiles',()=>{
    const registry=JSON.parse(readFileSync('src/templates/dies/research-registry.json','utf8'));validateResearchRegistry(registry);installResearchRegistry(registry);
    const templates=new Set<string>();
    for(const enabled of [false,true]){
      setResearchDiesEnabled(enabled);
      for(const region of getRegions())for(const format of region.formats){
        if(enabled&&region.id!=='ca-bc')continue;
        const plate=generatePlate(region,format,createRng(`typography:${region.id}:${format.id}`));
        const template=templateFor(region,format);templates.add(template.id);expect(TYPOGRAPHY_NOTES[template.id]).toBeTruthy();
        const design=resolveDesign(region,format);const svg=renderToStaticMarkup(createElement(template.render,{parts:plate.parts,design,text:plate.text}));
        expect(svg,`${region.id}/${format.id}`).not.toMatch(/(?:="|\s)(?:NaN|Infinity)(?:"|\s)/);
        const review=reviewPlateExport(plate);expect(review.errors,`${region.id}/${format.id}: ${review.errors.join('; ')}`).toEqual([]);
        const values=(attribute:string)=>[...new Set([...svg.matchAll(new RegExp(`${attribute}="([^"]+)"`,'g'))].map(m=>m[1]))];
        rows.push({region:region.id,format:format.id,template:template.id,researchEnabled:enabled,serial:plate.text,
          liveTextRuns:[...svg.matchAll(/<text(?:\s|>)/g)].length,families:values('font-family'),outlineProfiles:values('data-die'),researchUnits:values('data-research-unit'),provenance:values('data-provenance'),rights:review.rights,noticeCount:review.notices.length});
      }
    }
    expect(templates.size).toBe(13);expect(rows.filter(r=>!r.researchEnabled)).toHaveLength(785);
    if(process.env.TYPOGRAPHY_EVIDENCE){
      mkdirSync('typography-evidence',{recursive:true});
      writeFileSync('typography-evidence/format-coverage.json',JSON.stringify(rows,null,2)+'\n');
      const dies=allDieProfiles().map(p=>({id:p.id,label:p.label,geometrySha256:hash({params:p.params,overrides:p.overrides}),overrideCharacters:Object.keys(p.overrides??{}),allowConstructedFallback:p.allowConstructedFallback!==false,evidence:p.evidence}));
      const profiles=(data:Record<string,any>)=>Object.values(data).map(p=>({id:p.id,label:p.label,provenance:p.provenance,characters:Object.keys(p.glyphs),roles:Object.fromEntries(Object.entries(p.roles??{}).map(([name,role])=>[name,Object.keys((role as any).glyphs)])),wordmarks:Object.keys(p.wordmarks),rights:p.rights,sourceUrl:p.sourceUrl,geometrySha256:hash({glyphs:p.glyphs,roles:p.roles,wordmarks:p.wordmarks})}));
      writeFileSync('typography-evidence/outline-profile-inventory.json',JSON.stringify({dies,iraq:profiles(IRAQ_FONT_PROFILES),iran:profiles(IRAN_FONT_PROFILES)},null,2)+'\n');
    }
  },120000);
});
