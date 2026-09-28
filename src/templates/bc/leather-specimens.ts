import { BLOCK_B, BLOCK_C, SERIF_B, SERIF_C, type LeatherGlyph } from './leather-glyphs';
export interface GlyphBox {
  char: string; x: number; y: number; width: number; height: number; rotate?: number;
}
export interface LeatherSpecimen {
  id: string; label: string; width: number; height: number;
  body: string; inner: string; seam: string; rim: string;
  background: string; edge: string; metal: string;
  serial: readonly GlyphBox[];
  legends: readonly (GlyphBox & { glyph: LeatherGlyph })[];
  custom: { x: number; y: number; width: number; cap: number; spacing: number };
  tabs?: readonly number[];
  numberMounts: boolean;
  note: string;
}
export const LEATHER_SOURCE = {
  title: 'BCpl8s · British Columbia Passenger License Plates 1904–1912',
  url: 'https://www.bcpl8s.ca/Passenger-1904-1912.html',
};
/** Coordinates are relative to the supplied images, NOT measured millimetres. */
export const LEATHER_SPECIMENS: readonly LeatherSpecimen[] = [
  {
    id: '1143', label: '1143 · short serif figures / diagonal BC', width: 250, height: 100,
    body: 'M18 4 Q9 2 5 10 Q2 16 3 29 L2 79 Q1 92 13 96 Q20 98 35 97 L231 97 Q245 97 247 86 L247 24 Q247 5 236 4 Q124 2 18 4 Z',
    inner: 'M19 14 Q12 13 12 22 L11 77 Q11 85 20 85 L230 85 Q237 85 237 77 L237 23 Q237 14 229 14 Z',
    rim: 'M19 7 Q8 7 7 20 L6 79 Q6 91 18 92 L230 92 Q241 92 242 81 L242 23 Q242 8 233 8 Z',
    seam: 'M18 16 L232 16 L233 82 L17 82 Z',
    background: '#242420', edge: '#121512', metal: '#e0d7b8',
    serial: [
      {char:'1',x:91,y:27,width:26,height:47}, {char:'1',x:125,y:27,width:26,height:47},
      {char:'4',x:155,y:27,width:32,height:47}, {char:'3',x:194,y:25,width:32,height:48},
    ],
    legends: [
      {char:'B',x:18,y:23,width:29,height:31,glyph:SERIF_B,rotate:1},
      {char:'C',x:49,y:46,width:31,height:32,glyph:SERIF_C,rotate:-4},
    ],
    custom:{x:88,y:26,width:141,cap:48,spacing:8}, numberMounts:true,
    note:'Warm silver-tone attached figures; short serif 1 and 4, curled 3. Physical dimensions and maker unverified.',
  },
  {
    id:'2685',label:'2685 · tall ornamental figures / two upper tabs',width:250,height:113,
    body:'M25 6 L226 5 Q246 5 248 23 L248 88 Q248 107 232 109 L23 110 Q5 110 3 95 L2 28 Q3 8 25 6 Z',
    inner:'M25 17 L225 16 Q237 17 237 29 L238 84 Q238 95 226 96 L25 97 Q14 97 14 85 L13 32 Q12 19 25 17 Z',
    rim:'M24 9 L226 8 Q241 8 244 25 L244 88 Q244 103 230 104 L24 105 Q9 105 7 92 L6 29 Q7 11 24 9 Z',
    seam:'M25 20 L229 19 L233 91 L19 93 L18 26 Z',
    background:'#353d3e',edge:'#171e1d',metal:'#d9d8ca',
    serial:[
      {char:'2',x:83,y:23,width:32,height:68}, {char:'6',x:125,y:23,width:32,height:67},
      {char:'8',x:166,y:23,width:32,height:67}, {char:'5',x:207,y:22,width:30,height:67},
    ],
    legends:[
      {char:'B',x:16,y:23,width:30,height:32,glyph:SERIF_B},
      {char:'C',x:37,y:57,width:29,height:35,glyph:SERIF_C,rotate:-6},
    ],
    custom:{x:80,y:23,width:158,cap:67,spacing:7.5},tabs:[22,224],numberMounts:true,
    note:'Blue-black backing; rolled border, two visible upper tabs, ornamental 2/5 and narrow oval counters in 6/8. Colour is photograph-derived.',
  },
  {
    id:'3432',label:'3432 · curled figures / block BC at right',width:250,height:100,
    body:'M22 5 L232 5 Q244 5 246 17 L247 81 Q247 94 233 96 L19 96 Q5 96 3 84 L3 25 Q3 6 22 5 Z',
    inner:'M21 15 L232 15 Q237 15 237 24 L238 79 Q238 86 231 86 L20 86 Q14 86 14 79 L14 26 Q14 15 21 15 Z',
    rim:'M21 9 L232 9 Q240 9 241 21 L242 81 Q242 91 231 91 L19 91 Q9 91 8 81 L8 24 Q8 9 21 9 Z',
    seam:'M23 17 L232 17 L232 84 L18 84 L18 22 Z',
    background:'#222429',edge:'#151a1c',metal:'#e0deda',
    serial:[
      {char:'3',x:26,y:27,width:33,height:47},{char:'4',x:65,y:27,width:34,height:48},
      {char:'3',x:104,y:27,width:33,height:47},{char:'2',x:143,y:28,width:36,height:48},
    ],
    legends:[
      {char:'B',x:181,y:23,width:29,height:45,glyph:BLOCK_B},
      {char:'C',x:215,y:34,width:28,height:45,glyph:BLOCK_C},
    ],
    custom:{x:24,y:27,width:154,cap:48,spacing:6},numberMounts:true,
    note:'The province letters belong at the right, with B raised above C. Their chamfered block construction differs from the ornamental numbers.',
  },
  {
    id:'4189',label:'4189 · tall high-contrast figures / diagonal BC',width:250,height:101,
    body:'M23 5 L229 5 Q246 5 247 21 L247 80 Q247 95 234 97 L20 97 Q4 97 3 82 L3 24 Q3 6 23 5 Z',
    inner:'M22 15 L228 15 Q236 15 237 26 L237 79 Q237 85 228 86 L21 86 Q13 86 13 77 L13 27 Q13 16 22 15 Z',
    rim:'M22 9 L229 9 Q241 9 242 24 L242 79 Q242 91 231 92 L21 92 Q9 92 8 80 L8 26 Q8 10 22 9 Z',
    seam:'M15 83 Q121 85 234 83',
    background:'#25282a',edge:'#14191c',metal:'#c8cac5',
    serial:[
      {char:'4',x:95,y:17,width:32,height:62},{char:'1',x:136,y:18,width:25,height:62},
      {char:'8',x:165,y:19,width:31,height:61},{char:'9',x:201,y:20,width:29,height:60},
    ],
    legends:[
      {char:'B',x:21,y:22,width:29,height:30,glyph:SERIF_B},
      {char:'C',x:50,y:47,width:32,height:32,glyph:{...SERIF_C,mounts:[]},rotate:-4},
    ],
    custom:{x:91,y:18,width:141,cap:61,spacing:7},numberMounts:false,
    note:'Tall high-contrast serif 4/1 and oval 8/9. No invented screw heads on the large figures; leather creasing is illustrative rather than a copied wear map.',
  },
];
export function leatherSpecimen(id: unknown): LeatherSpecimen {
  return LEATHER_SPECIMENS.find((s) => s.id === id) ?? LEATHER_SPECIMENS[0];
}
export function leatherGeometry(id: unknown) {
  const s = leatherSpecimen(id);
  return { width:s.width, height:s.height };
}
