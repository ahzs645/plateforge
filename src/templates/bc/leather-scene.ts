import { node as n, type SvgNode } from '../svg-scene';
import { LEATHER_GLYPHS, OBSERVED_DIGITS, type LeatherGlyph } from './leather-glyphs';
import { LEATHER_SOURCE, leatherSpecimen, type GlyphBox, type LeatherSpecimen } from './leather-specimens';
export interface LeatherSceneOptions {
  specimen?: string; scope?: string; background?: string; ink?: string;
  title?: string; metadata?: Record<string, unknown>;
}
export type LeatherParts = Record<string, string | undefined>;
const fmt = (v:number) => Number(v.toFixed(4));
/** Syntactic support only. The source does not establish a precise 1912 upper bound. */
export function validLeatherSerial(serial:string): boolean { return /^[1-9]\d{0,3}$/.test(serial); }

export function leatherLayout(s:LeatherSpecimen, serial:string): GlyphBox[] {
  if (!validLeatherSerial(serial)) return [];
  if (serial === s.id) return s.serial.map((b) => ({...b}));
  const table=LEATHER_GLYPHS[s.id], area=s.custom;
  // Each profile has its own native aspect. Fit the whole run uniformly:
  // no textLength, condensed-font fallback, or per-letter forced stretching.
  const nativeScale=area.cap/100;
  const widths=[...serial].map((c)=>table[c].width*nativeScale);
  const natural=widths.reduce((a,b)=>a+b,0)+area.spacing*(serial.length-1);
  const fit=Math.min(1,area.width/natural), cap=area.cap*fit;
  let x=area.x+(area.width-natural*fit)/2;
  return [...serial].map((char,i)=>{
    const box={char,x:fmt(x),y:fmt(area.y+(area.cap-cap)/2),width:fmt(widths[i]*fit),height:fmt(cap)};
    x+=widths[i]*fit+area.spacing*fit;
    return box;
  });
}
function glyphNode(g:LeatherGlyph,b:GlyphBox,id:string,raised:boolean,mounts:boolean,evidence:string,ink?:string):SvgNode {
  const paths:SvgNode[]=[];
  const outlineAttrs={d:g.d,fillRule:'evenodd',...(g.transform?{transform:g.transform}:{})};
  if(raised) paths.push(n('g',{transform:'translate(0.9 1.8)',opacity:0.6},n('path',{...outlineAttrs,fill:'#060a0b'})));
  paths.push(n('path',{...outlineAttrs,fill:ink??(raised?`url(#${id}-metal)`:'#dedbcf'),
    ...(raised?{stroke:'#9e9e90',strokeWidth:0.8,strokeLinejoin:'round'}:{}),'data-role':'glyph-outline'}));
  // Small hand-defined facets imply raised house-number pieces, not sheet embossing.
  if(raised) paths.push(n('path',{...outlineAttrs,fill:'none',stroke:'#f4f0df',strokeWidth:0.55,opacity:0.6}));
  if(mounts && g.mounts?.length) paths.push(n('g',{'data-role':'letter-fasteners',...(g.transform?{transform:g.transform}:{})},
    ...g.mounts.flatMap(([cx,cy])=>[
      n('circle',{cx,cy,r:3.1,fill:'#8b8068'}),n('circle',{cx,cy:cy+0.45,r:2.1,fill:'#302c23'}),
      ...(raised?[n('path',{d:`M${cx-1.2} ${cy-1.1} Q${cx} ${cy-1.9} ${cx+1.2} ${cy-1.1}`,fill:'none',stroke:'#c7b88f',strokeWidth:0.7})]:[]),
    ])));
  return n('g',{'data-char':b.char,'data-evidence':evidence,'data-role':'attached-character',
    transform:`translate(${b.x} ${b.y})${b.rotate?` rotate(${b.rotate} ${b.width/2} ${b.height/2})`:''} scale(${fmt(b.width/g.width)} ${fmt(b.height/100)})`},...paths);
}
function grain(s:LeatherSpecimen,id:string):SvgNode {
  let seed=Number(s.id);
  const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  let small='',fine='';
  for(let i=0;i<230;i++){
    const x=13+rng()*224,y=15+rng()*(s.height-30),w=1+rng()*5;
    small+=`M${fmt(x)} ${fmt(y)} q${fmt(w/2)} ${fmt(rng()*1.3-0.65)} ${fmt(w)} ${fmt(rng()*0.6-0.3)} `;
  }
  for(let i=0;i<37;i++){
    const x=14+rng()*211,y=17+rng()*(s.height-33),w=4+rng()*9;
    fine+=`M${fmt(x)} ${fmt(y)} q${fmt(w/2)} ${fmt(rng()*4-2)} ${fmt(w)} ${fmt(rng()*2-1)} `;
  }
  const extra=s.id==='4189'?[n('path',{
    d:'M32 62 Q41 60 48 47 Q53 42 58 41 M47 48 Q37 42 42 35 Q48 30 52 20 M58 80 Q76 96 91 80 Q92 68 85 57 M85 57 Q86 47 79 39 Q73 32 73 19 M91 80 Q106 83 115 71',
    fill:'none',stroke:'#111619',strokeWidth:0.55,opacity:0.65,
  })]:[];
  return n('g',{'data-role':'illustrative-leather-grain',clipPath:`url(#${id}-inner)`},
    n('path',{d:small,fill:'none',stroke:'#899089',strokeWidth:0.22,opacity:0.15}),
    n('path',{d:fine,fill:'none',stroke:'#050a0a',strokeWidth:0.4,opacity:0.3}),...extra);
}
export function buildLeatherScene(parts:LeatherParts,options:LeatherSceneOptions={}):SvgNode {
  const s=leatherSpecimen(options.specimen),serial=parts.serial??s.id;
  const id=(options.scope??`bc-leather-${s.id}`).replace(/[^a-zA-Z0-9_-]/g,'-');
  const raised=parts.finish!=='flat';
  const invalid=!validLeatherSerial(serial);
  const inferred=[...new Set([...serial].filter((c)=>!OBSERVED_DIGITS[s.id].includes(c)))];
  const boxes=leatherLayout(s,serial),table=LEATHER_GLYPHS[s.id];
  const metadata={schema:'plateforge.bc-leather.v1',specimen:s.id,serial,
    reconstruction:'original-vector-reconstruction-not-an-authentication',source:LEATHER_SOURCE,
    sourceImages:'four low-resolution photographs supplied by the user; source rights remain with the photographer/collection',
    era:[1904,1912],specimenManufactureYear:null,physicalDimensionsMm:null,
    coordinates:'reference-image-relative units, not physical dimensions',
    lettering:'manually constructed filled SVG paths',inferredDigits:inferred,
    customSerial:serial!==s.id,syntacticallyValid:!invalid,note:s.note,
    surface:'decorative vector material shading; not a measured patina or metallurgical identification',
    ...(options.metadata?{editorMetadata:options.metadata}:{})};
  const background=options.background??s.background;
  const defs=n('defs',{},
    n('linearGradient',{id:`${id}-metal`,x1:'0%',y1:'0%',x2:'90%',y2:'80%'},
      n('stop',{offset:'0%',stopColor:'#fffbea'}),n('stop',{offset:'24%',stopColor:s.metal}),
      n('stop',{offset:'50%',stopColor:'#a6aaa4'}),n('stop',{offset:'64%',stopColor:'#e6e2d4'}),
      n('stop',{offset:'100%',stopColor:s.id==='1143'?'#a89e7b':'#b7b6a8'})),
    n('linearGradient',{id:`${id}-leather`,x1:'0%',y1:'0%',x2:'5%',y2:'100%'},
      n('stop',{offset:'0%',stopColor:background}),n('stop',{offset:'60%',stopColor:background}),
      n('stop',{offset:'100%',stopColor:s.edge})),
    n('clipPath',{id:`${id}-inner`},n('path',{d:s.inner})),
  );
  const backing=n('g',{'data-role':'leather-backing'},
    n('path',{d:s.body,fill:s.edge,transform:'translate(0 0.5)'}),
    n('path',{d:s.body,fill:raised?`url(#${id}-leather)`:background,stroke:s.edge,strokeWidth:1.1}),
    n('path',{d:s.rim,fill:'none',stroke:raised?'#53584d':'#3b403a',strokeWidth:0.7,opacity:0.8}),
    n('path',{d:s.inner,fill:'none',stroke:s.edge,strokeWidth:s.id==='2685'?3.8:3.1}),
    n('path',{d:s.inner,fill:'none',stroke:raised?'#5b6053':'#363b35',strokeWidth:0.5,opacity:0.6}),
    n('path',{d:s.seam,fill:'none',stroke:s.id==='3432'?'#78715c':'#5d5b4b',strokeWidth:0.55,strokeDasharray:'0.55 0.85','data-role':'stitching'}),
    ...(raised?[grain(s,id)]:[]),
    ...(s.tabs??[]).map((x)=>n('g',{'data-role':'upper-tab'},
      n('path',{d:`M${x} 1 L${x+6} 0 L${x+7} 12 L${x+5} 15 L${x-1} 15 Z`,fill:'#35342a',stroke:'#514b37',strokeWidth:0.55}),
      n('path',{d:`M${x} 12 L${x+6} 12`,stroke:'#b19b6e',strokeWidth:0.55,opacity:0.65}))),
  );
  return n('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${s.width} ${s.height}`,width:s.width,height:s.height,
    role:'img','aria-labelledby':`${id}-title ${id}-desc`,'data-region':'ca-bc','data-specimen':s.id,
    'data-reconstruction':'specimen-based','data-units':'image-relative','data-valid':String(!invalid)},
    n('title',{id:`${id}-title`},options.title??`British Columbia pre-provincial plate ${serial}; ${s.id} specimen style`),
    n('desc',{id:`${id}-desc`},`${s.note} ${invalid?'Invalid serial: enter 1–4 digits without a leading zero.':serial!==s.id?'Custom arrangement; not a documented specimen.':'Reconstruction of the supplied specimen photograph.'} ${inferred.length?`Figures ${inferred.join(', ')} are stylistic extrapolations in this profile.`:''}`),
    n('metadata',{},JSON.stringify(metadata)),defs,backing,
    n('g',{'data-role':'province-letters'},...s.legends.map((b)=>glyphNode(b.glyph,b,id,raised,true,'observed-photo',options.ink))),
    n('g',{'data-role':'serial','aria-label':serial,'data-layout':serial===s.id?'specimen-positions':'uniform-fit'},
      ...boxes.map((b)=>glyphNode(table[b.char],b,id,raised,s.numberMounts,
        OBSERVED_DIGITS[s.id].includes(b.char)?'observed-photo':'inferred-style',options.ink))),
  );
}
