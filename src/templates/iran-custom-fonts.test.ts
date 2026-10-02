import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { IRAN_FONT_PROFILES, IRAN_WORDMARKS, renderIranGlyphRun, renderIranWordmark, renderIranRoleGlyphRun } from './iran-custom-fonts';

const full = ['parastoo-candidate', 'sahel-candidate', 'naskh-candidate'] as const;
describe('Iran source-honest portable typography', () => {
  it('contains actual Persian Unicode digits and the selectable isolated series letters in every full Persian candidate', () => {
    for (const id of full) {
      const profile = IRAN_FONT_PROFILES[id];
      for (const ch of '۰۱۲۳۴۵۶۷۸۹بپتثجدزسشصطعفقکگلمنوهی') {
        expect(profile.glyphs[ch]?.character, `${id}: ${ch}`).toBe(ch);
        expect(profile.glyphs[ch].path).toMatch(/^M/);
        expect(profile.glyphs[ch].advance).toBeGreaterThan(0);
      }
      expect(Object.keys(profile.glyphs).some((ch) => /[\uE000-\uF8FF]/u.test(ch))).toBe(false);
      expect(profile.provenance).toBe('candidate');
      expect(profile.rights).toContain('OFL');
    }
  });
  it('normalizes numeric input explicitly into Persian and never imports Iraqi Arabic digit outlines', () => {
    for (const id of full) {
      const persian = renderIranGlyphRun(id, '۰۱۲۳۴۵۶۷۸۹', 0, 100, 100);
      expect(renderIranGlyphRun(id, '0123456789', 0, 100, 100).markup).toBe(persian.markup);
      expect(renderIranGlyphRun(id, '٠١٢٣٤٥٦٧٨٩', 0, 100, 100).markup).toBe(persian.markup);
      expect(persian.errors).toEqual([]);
      expect(persian.sourceIds.every((source) => !/iraq/i.test(source))).toBe(true);
      expect(persian.markup).toContain('aria-label="۴"');
    }
  });
  it('preserves native numeral baseline, cap-height, aspect ratios and advances under a single uniform scale', () => {
    for (const id of full) {
      const p = IRAN_FONT_PROFILES[id];
      expect(p.capHeight).toBe(100); expect(p.baseline).toBe(0);
      expect(p.glyphs['۰'].bounds.height).toBeLessThan(70);
      const a = renderIranGlyphRun(id, '۱۲۴۵۶۷۸۹', 0, 0, 100, 3);
      const b = renderIranGlyphRun(id, '۱۲۴۵۶۷۸۹', 0, 0, 200, 6);
      expect(b.advance).toBeCloseTo(a.advance * 2);
      expect(b.bounds.width).toBeCloseTo(a.bounds.width * 2);
      expect(b.bounds.height).toBeCloseTo(a.bounds.height * 2);
      expect(a.advance).toBeCloseTo([...('۱۲۴۵۶۷۸۹')].reduce((sum, c) => sum + p.glyphs[c].advance, 0) + 7 * 3);
      expect(a.markup).not.toMatch(/scale\([^)]*[, ]/);
    }
  });
  it('shapes connected plate هـ atomically and keeps it different from isolated ه', () => {
    for (const id of full) {
      const p = IRAN_FONT_PROFILES[id];
      expect(p.glyphs['هـ'].path).not.toBe(p.glyphs['ه'].path);
      const result = renderIranGlyphRun(id, '۱۲هـ۳۴۵', 5, 100, 80);
      expect(result.provenance).toHaveLength(6);
      expect(result.errors).toEqual([]);
      expect(result.markup).toContain('U+0647 U+0640');
      expect(result.markup).toContain(':HB-fa');
    }
  });
  it('exports complete HarfBuzz-shaped words as portable outlines without text nodes or font references', () => {
    for (const id of full) {
      for (const wordId of Object.keys(IRAN_FONT_PROFILES[id].wordmarks)) {
        const word = IRAN_FONT_PROFILES[id].wordmarks[wordId];
        const result = renderIranWordmark(id, wordId, 10, 120, 50);
        expect(word.text).toBe(IRAN_WORDMARKS[wordId].text);
        expect(result.errors, `${id}: ${wordId}`).toEqual([]);
        expect(result.markup).not.toMatch(/<text|@font-face|<image|foreignObject|\uE000/);
        expect(result.markup).toContain(':HB-fa');
        expect(result.bounds.x).toBeCloseTo(10, 2);
        expect(result.bounds.y).toBeCloseTo(70, 2);
        expect(result.bounds.height).toBeCloseTo(50, 2);
        expect(result.bounds.width).toBeGreaterThan(0);
      }
    }
    expect(IRAN_WORDMARKS.iran.text).toBe('ایران');
    expect(IRAN_WORDMARKS['iran-arabic-yeh'].text).toBe('ايران');
    for (const id of ['tehran','shiraz','mashhad','isfahan','tabriz','rasht','alef','protocol','historic','temporary','political','service','consular','us-topographical','qeshm','kish','anzali','arvand','aras','maku','chabahar']) expect(IRAN_WORDMARKS[id]).toBeDefined();
    expect(IRAN_WORDMARKS['us-topographical'].text).toBe('جغرافیایی');
  });
  it('routes known literal words to complete outlines and blocks unknown unshaped strings', () => {
    expect(renderIranGlyphRun('parastoo-candidate','الف',0,100,80).markup).toBe(renderIranWordmark('parastoo-candidate','alef',0,100,80).markup);
    const unknown = renderIranGlyphRun('parastoo-candidate','تهرانستان',0,100,80);
    expect(unknown.errors.length).toBeGreaterThan(0);
    expect(unknown.provenance).toEqual(['unsupported']);
    expect(renderIranGlyphRun('parastoo-candidate','ب پ ت',0,100,80).errors).toEqual([]);
  });
  it('keeps observed historical coverage distinct from inferred numerals and unsupported letters', () => {
    expect(Object.values(IRAN_FONT_PROFILES['historic-1947-study'].glyphs).filter(g=>g.provenance==='observed').map(g=>g.character)).toEqual(['۳','۶','۷']);
    expect(Object.values(IRAN_FONT_PROFILES['historic-1961-study'].glyphs).filter(g=>g.provenance==='observed').map(g=>g.character)).toEqual(['۲','۵','۷','۸']);
    const inferred=renderIranGlyphRun('historic-1947-study','74',0,100,80,0,'strict');
    expect(inferred.provenance).toEqual(['observed','inferred']);
    expect(inferred.errors).toEqual([]);
    expect(inferred.markup).toContain('data-provenance="inferred"');
    expect(inferred.warnings.join(' ')).toMatch(/inferred/i);
    const strict = renderIranGlyphRun('historic-1947-study','7ب',0,100,80,0,'strict');
    expect(strict.provenance).toEqual(['observed','unsupported']);
    expect(strict.errors).toHaveLength(1);
    expect(strict.markup).toContain('data-provenance="unsupported"');
    expect(strict.warnings.join(' ')).toContain('private critical study');
    const fallback = renderIranGlyphRun('historic-1947-study','7ب',0,100,80,0,'fallback');
    expect(fallback.provenance).toEqual(['observed','fallback']);
    expect(fallback.errors).toEqual([]);
    expect(fallback.warnings.join(' ')).toContain('explicit fallback');
    expect(renderIranWordmark('historic-1961-study','tehran',0,100,20).errors).toHaveLength(1);
    expect(renderIranWordmark('historic-1961-study','tehran',0,100,20,'fallback').provenance).toEqual(['fallback']);
  });
  it('preserves distinct observed forms within four completed historical alphabets', () => {
    const cases = [
      ['historic-1947-study','7376','۳۶۷'],
      ['historic-1956-study','4255','۲۴۵'],
      ['historic-1961-study','22875','۲۵۷۸'],
      ['historic-1963-study','62019','۰۱۲۶۹'],
    ] as const;
    for (const [id, serial, coverage] of cases) {
      const profile = IRAN_FONT_PROFILES[id];
      expect(Object.values(profile.glyphs).filter(g=>g.provenance==='observed').map(g=>g.character).join('')).toBe(coverage);
      const result = renderIranGlyphRun(id,serial,0,100,80,0,'strict');
      expect(result.errors).toEqual([]);
      expect(result.provenance).toEqual([...serial].map(() => 'observed'));
      expect(Object.keys(profile.wordmarks)).toHaveLength(0);
      for (const glyph of Object.values(profile.glyphs).filter(g=>g.provenance==='observed')) {
        expect(glyph.path).toMatch(/[CQ]/);
        expect(glyph.note).toContain('residual photographic perspective');
        expect(glyph.path).not.toBe(IRAN_FONT_PROFILES['parastoo-candidate'].glyphs[glyph.character].path);
      }
    }
    const zero=IRAN_FONT_PROFILES['historic-1963-study'].glyphs['۰'];
    expect(zero.bounds.height).toBeLessThan(30);
    expect(zero.bounds.width / zero.bounds.height).toBeCloseTo(1, 0);
    expect(zero.bounds.y + zero.bounds.height).toBeLessThan(-30);
    expect(zero.path.match(/M/g)).toHaveLength(1); // Filled diamond, not the modern hollow circle.
    expect(IRAN_FONT_PROFILES['historic-1947-study'].glyphs['۶'].path).not.toBe(IRAN_FONT_PROFILES['historic-1963-study'].glyphs['۶'].path);
    expect(IRAN_FONT_PROFILES['historic-1956-study'].glyphs['۵'].path).not.toBe(IRAN_FONT_PROFILES['historic-1961-study'].glyphs['۵'].path);
    expect(renderIranGlyphRun('historic-1956-study','6',0,100,80).provenance).toEqual(['inferred']);
  });
  it('keeps all seven city-initial/year alphabets independent from main serial outlines', () => {
    const yearTexts = { '1947':'26', '1949':'28', '1954':'33', '1956':'35', '1960':'39', '1961':'40', '1963':'42' };
    const serials = { '1947':'7376', '1949':'3435', '1954':'200', '1956':'4255', '1960':'1827', '1961':'22875', '1963':'62019' };
    for (const [year, text] of Object.entries(yearTexts)) {
      const id = `historic-${year}-study`, p = IRAN_FONT_PROFILES[id];
      expect(Object.keys(p.roles!)).toEqual(['city-initial','year']);
      expect(renderIranRoleGlyphRun(id,'city-initial','ط',0,100,40).errors).toEqual([]);
      expect(renderIranRoleGlyphRun(id,'year',text,0,100,22).errors).toEqual([]);
      expect(renderIranGlyphRun(id,serials[year as keyof typeof serials],0,100,80).errors).toEqual([]);
      expect(p.roles!['city-initial'].glyphs['ط'].path).not.toBe(IRAN_FONT_PROFILES['parastoo-candidate'].glyphs['ط'].path);
      expect(renderIranRoleGlyphRun(id,'year','ط',0,100,40).errors).toHaveLength(1);
      expect(renderIranRoleGlyphRun(id,'imaginary-role',serials[year as keyof typeof serials][0],0,100,40).errors).toHaveLength(1);
      expect(renderIranRoleGlyphRun(id,'imaginary-role','1',0,100,40,0,'fallback').provenance).toEqual(['fallback']);
    }
    expect(IRAN_FONT_PROFILES['historic-1956-study'].roles!.year.glyphs['۵'].path).not.toBe(IRAN_FONT_PROFILES['historic-1956-study'].glyphs['۵'].path);
    const zero=IRAN_FONT_PROFILES['historic-1961-study'].roles!.year.glyphs['۰'];
    expect(zero.bounds.height).toBeLessThan(30); // Actual tiny round year-tab zero.
    expect(zero.path).not.toBe(IRAN_FONT_PROFILES['historic-1963-study'].glyphs['۰'].path);
    expect(IRAN_FONT_PROFILES['historic-1960-study'].glyphs['۱'].bounds.width).toBeLessThan(25);
    expect(IRAN_FONT_PROFILES['historic-1949-study'].glyphs['۴'].path).not.toBe(IRAN_FONT_PROFILES['parastoo-candidate'].glyphs['۴'].path);
  });
  it('retains the light 1960 figures and nearly vertical 1949 stem after contour review', () => {
    const one=IRAN_FONT_PROFILES['historic-1960-study'].glyphs['۱'];
    const seven=IRAN_FONT_PROFILES['historic-1960-study'].glyphs['۷'];
    const three=IRAN_FONT_PROFILES['historic-1949-study'].glyphs['۳'];
    expect(one.bounds.width/one.bounds.height).toBeLessThan(.135);
    expect(seven.bounds.width/seven.bounds.height).toBeLessThan(.5);
    expect(one.note).toContain('dark source core');
    expect(seven.note).toContain('No horizontal compression');
    expect(three.note).toContain('lower stem is near-vertical and narrow');
    for (const year of ['1949','1960']) {
      const run=renderIranGlyphRun(`historic-${year}-study`,year==='1949'?'3435':'1827',0,100,100);
      expect(run.errors).toEqual([]);
      expect(run.markup).not.toMatch(/scale\([^)]*[, ]/);
      expect(run.provenance.every(p=>p==='observed')).toBe(true);
    }
  });
  it('keeps missing numerals Latin in a partial Latin profile and does not hijack Latin words for shaping', () => {
    const base=IRAN_FONT_PROFILES['latin-candidate'];
    const id='latin-subset-regression';
    IRAN_FONT_PROFILES[id]={...base,id,glyphs:{'1':base.glyphs['1']}};
    const previous=IRAN_WORDMARKS.uniimog;
    IRAN_WORDMARKS.uniimog={id:'uniimog',label:'UNIIMOG',text:'UNIIMOG',kind:'class'};
    try {
      expect(renderIranGlyphRun(id,'0',0,100,50).errors).toHaveLength(1);
      const result=renderIranGlyphRun(id,'۰',0,100,50,0,'fallback');
      expect(result.errors).toEqual([]);expect(result.provenance).toEqual(['fallback']);
      expect(result.markup).toContain('aria-label="0"');expect(result.markup).toContain(base.glyphs['0'].path);
      expect(renderIranGlyphRun('latin-candidate','UNIIMOG',0,100,50).errors).toEqual([]);
    } finally {
      delete IRAN_FONT_PROFILES[id];
      if(previous) IRAN_WORDMARKS.uniimog=previous;else delete IRAN_WORDMARKS.uniimog;
    }
  });
  it('never invents unsupported glyphs even in fallback mode', () => {
    for (const policy of ['strict','fallback'] as const) {
      const result = renderIranGlyphRun('parastoo-candidate','\uE000🦖',0,100,80,0,policy);
      expect(result.provenance).toEqual(['unsupported','unsupported']);
      expect(result.errors).toHaveLength(2);
      for (const wordId of ['unknown','__proto__','toString','constructor','<script>']) {
        const word = renderIranWordmark('parastoo-candidate',wordId,0,100,80,policy);
        expect(word.errors).toHaveLength(1);
        expect(word.markup).not.toContain('<script>');
        expect(word.markup).not.toContain('NaN');
      }
    }
  });
  it('supports Latin international, mission and diplomatic letters in a separately licensed profile', () => {
    const result = renderIranGlyphRun('latin-candidate','UNIIMOG THR TEH D S 0123456789 & (CLUB)',0,100,70);
    expect(result.errors).toEqual([]);
    expect(result.sourceIds).toHaveLength(1);
    expect(result.sourceIds[0]).toContain('GL-Nummernschild');
    expect(renderIranGlyphRun('parastoo-candidate','D',0,100,70).errors).toHaveLength(1);
    expect(renderIranGlyphRun('parastoo-candidate','D',0,100,70,0,'fallback').provenance).toEqual(['fallback']);
  });
  it('renders every declared source glyph, contextual glyph and atomic word without implicit fallback', () => {
    for (const [id,profile] of Object.entries(IRAN_FONT_PROFILES)) {
      if (profile.provenance !== 'observed') continue;
      for (const ch of Object.keys(profile.glyphs)) {
        const result=renderIranGlyphRun(id,ch,0,100,50);
        expect(result.errors,`${id} main ${ch}`).toEqual([]);
        expect(result.provenance).toEqual([profile.glyphs[ch].provenance]);
        expect(Object.values(result.bounds).every(Number.isFinite)).toBe(true);
      }
      for (const [role,alphabet] of Object.entries(profile.roles ?? {})) {
        for (const ch of Object.keys(alphabet.glyphs)) {
          const result=renderIranRoleGlyphRun(id,role,ch,0,100,50);
          expect(result.errors,`${id} ${role} ${ch}`).toEqual([]);
          expect(result.provenance).toEqual([alphabet.glyphs[ch].provenance]);
        }
      }
      for (const wid of Object.keys(profile.wordmarks)) {
        const result=renderIranWordmark(id,wid,0,100,50);
        expect(result.errors,`${id} word ${wid}`).toEqual([]);
        expect(result.provenance).toEqual([profile.wordmarks[wid].provenance]);
        expect(result.bounds.height).toBeCloseTo(50,2);
      }
    }
    for (const id of ['latin-sans-candidate','latin-sans-bold-candidate','latin-freezone-candidate']) {
      expect(IRAN_FONT_PROFILES[id].script).toBe('latin');
      expect(renderIranGlyphRun(id,'IRAN TAXI MAKU 0123456789',0,100,50).errors).toEqual([]);
      expect(renderIranWordmark(id,'iran-latin',0,100,30).errors).toEqual([]);
    }
    expect(IRAN_WORDMARKS.iran.text).toBe('ایران');
    expect(IRAN_WORDMARKS['iran-latin'].text).toBe('IRAN');
    expect(IRAN_WORDMARKS.tehran.note).toBeUndefined();
    const latinFallback=renderIranWordmark('historic-1963-study','uniimog',0,100,30,'fallback');
    expect(latinFallback.errors).toEqual([]);expect(latinFallback.provenance).toEqual(['fallback']);
    expect(latinFallback.markup).toContain('aria-label="UNIIMOG"');
    expect(latinFallback.sourceIds[0]).toContain('LiberationSans-Regular');
  });

  it('renders all ten numerals in every numeric source alphabet with honest per-glyph provenance and no candidate substitution', () => {
    let alphabetCount=0, inferredCount=0;
    for (const [id,p] of Object.entries(IRAN_FONT_PROFILES)) {
      if(p.provenance==='candidate') continue;
      const digits=p.script==='latin'?'0123456789':'۰۱۲۳۴۵۶۷۸۹';
      for (const [role,glyphs] of [['main',p.glyphs], ...Object.entries(p.roles??{}).map(([r,a])=>[r,a.glyphs])] as [string,typeof p.glyphs][]) {
        if (![...digits].some(ch=>glyphs[ch])) continue;
        alphabetCount++;
        for(const ch of digits) {
          const g=glyphs[ch];
          expect(g,`${id}/${role}/${ch}`).toBeDefined();
          expect(['observed','inferred']).toContain(g.provenance);
          expect(g.path).toMatch(/^M/);
          expect(g.advance).toBeGreaterThan(0);
          if(g.provenance==='inferred') {
            inferredCount++;
            expect(g.inference?.method).toBeTruthy();
            expect(g.inference?.basisCharacters.length).toBeGreaterThan(0);
            expect(g.inference?.designNotes).toBeTruthy();
            expect(g.note).toMatch(/inferred/i);
            for(const candidate of Object.values(IRAN_FONT_PROFILES).filter(q=>q.provenance==='candidate')) {
              expect(g.path,`${id}/${role}/${ch} must not alias ${candidate.id}`).not.toBe(candidate.glyphs[ch]?.path);
            }
          }
        }
        const a=role==='main'?renderIranGlyphRun(id,digits,0,100,100):renderIranRoleGlyphRun(id,role,digits,0,100,100);
        const b=role==='main'?renderIranGlyphRun(id,digits,0,200,200):renderIranRoleGlyphRun(id,role,digits,0,200,200);
        expect(a.errors,`${id}/${role}`).toEqual([]);
        expect(a.provenance).not.toContain('fallback');
        expect(a.provenance).not.toContain('candidate');
        expect(a.markup).not.toMatch(/scale\([^)]*[, ]/);
        expect(a.markup).not.toMatch(/<text|<image|font-family/);
        expect(b.advance).toBeCloseTo(a.advance*2);
        expect(b.bounds.width).toBeCloseTo(a.bounds.width*2);
      }
    }
    expect(alphabetCount).toBeGreaterThanOrEqual(37);
    expect(inferredCount).toBeGreaterThan(200);
  });

  it('keeps every pre-completion observed source contour byte-for-byte unchanged', () => {
    const root=new URL('../../docs/research/iran-customizer/fonts/',import.meta.url);
    const baseline=JSON.parse(readFileSync(new URL('observed-path-baseline.json',root),'utf8')) as {file:string;profile:string;role:string;character:string;pathSha256:string}[];
    const cache=new Map<string,any[]>();
    expect(baseline.length).toBe(152);
    for(const record of baseline) {
      if(!cache.has(record.file)) cache.set(record.file,JSON.parse(readFileSync(new URL(record.file,root),'utf8')));
      const p=cache.get(record.file)!.find(s=>s.id===record.profile);
      const alphabet=record.role==='main'?p:p.roles[record.role];
      const g=alphabet.glyphs.find((glyph:{character:string})=>glyph.character===record.character);
      expect(g.provenance??'observed').toBe('observed');
      expect(createHash('sha256').update(g.path).digest('hex'),`${record.profile}/${record.role}/${record.character}`).toBe(record.pathSha256);
    }
  });

  it('renders the six earlier and nonnational diagram specimens entirely from observed numeric masters', () => {
    const cases=[
      ['source-previous-diplomatic-numerals','main','345'],['source-previous-diplomatic-numerals','prefix','12'],
      ['source-previous-service-numerals','main','345'],['source-previous-service-numerals','prefix','12'],
      ['source-previous-temporary-numerals','main','1234'],['source-previous-temporary-numerals','category','5'],['source-previous-temporary-numerals','prefix','92'],
      ['source-motorcycle-numerals','main','56789'],['source-motorcycle-numerals','allocation','123'],
      ['source-historic-numerals','main','12365'],['source-protocol-numerals','main','1391'],
    ];
    for(const [id,role,serial] of cases) {
      const run=role==='main'?renderIranGlyphRun(id,serial,0,100,100):renderIranRoleGlyphRun(id,role,serial,0,100,100);
      expect(run.errors,`${id}/${role}`).toEqual([]);
      expect(run.provenance).toEqual([...serial].map(()=>'observed'));
      expect(run.sourceIds.every(source=>!source.includes('candidate'))).toBe(true);
    }
    expect(IRAN_FONT_PROFILES['source-motorcycle-numerals'].roles!.allocation.glyphs['۲'].provenance).toBe('observed');
    expect(IRAN_FONT_PROFILES['source-motorcycle-numerals'].glyphs['۲'].provenance).toBe('inferred');
  });
  it('validates numeric geometry, profile identifiers and policies', () => {
    expect(() => renderIranGlyphRun('__proto__','1',0,100,80)).toThrow(RangeError);
    expect(() => renderIranGlyphRun('missing','1',0,100,80)).toThrow(RangeError);
    for (const size of [0,-10,NaN,Infinity]) expect(() => renderIranGlyphRun('parastoo-candidate','1',0,100,size)).toThrow(RangeError);
    expect(renderIranGlyphRun('parastoo-candidate','',15,25,80)).toMatchObject({markup:'',errors:[],advance:0,bounds:{x:15,y:25,width:0,height:0}});
  });
});
