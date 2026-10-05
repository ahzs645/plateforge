import type {DieProfile} from './engine';
import {buildDieText} from './engine';
import glyphs from './alberta-avant-garde.json';

/** Fixed printed slogan, independent of Alberta's editable embossed serial. */
export const ALBERTA_AVANT_GARDE_PROFILE: DieProfile = {
  id:'ab-avant-garde-slogan', label:'Avant Garde Std Medium · reconstructed plate alternates',
  params:{width:70,stroke:0,curve:'oval',tracking:0},
  overrides:glyphs.plate, allowConstructedFallback:false, allowResearchReplacement:false,
  evidence:{status:'legend-approximation',specimens:[
    {title:'Original Avant Garde alternate specimen',url:'https://www.e-daylight.jp/fonts/type/a/agg/avant-garde-gothic.jpg'},
    {title:'World License Plates · Alberta',url:'http://www.worldlicenseplates.com/world/CN_ALBE.html'},
  ],notes:'Fixed Wild Rose Country outlines from supplied ITC Avant Garde Gothic Std Medium (ITCAvantGardeStd-Md, OTF 1.018). This Std file lacks the requested W/e/t/y alternates; those four forms are explicitly reconstructed against photographs/specimen, not extracted Pro glyphs. Native other outlines and advances retained. Whole line uniformly fitted; precise historical weight/version unconfirmed. No font software bundled.'},
};
export const ALBERTA_AVANT_GARDE_DEFAULT_PROFILE: DieProfile = {
  ...ALBERTA_AVANT_GARDE_PROFILE,id:'ab-avant-garde-std-default',overrides:glyphs.default,
  label:'Avant Garde Std Medium · supplied default glyphs',
};

export function buildAlbertaSlogan({x=300,baseline,capHeight,maxWidth,ink,defaults=false}:{
  x?:number;baseline:number;capHeight:number;maxWidth?:number;ink:string;defaults?:boolean;
}) {
  return buildDieText({text:'Wild Rose Country',profile:defaults?ALBERTA_AVANT_GARDE_DEFAULT_PROFILE:ALBERTA_AVANT_GARDE_PROFILE,
    x,baseline,capHeight,maxWidth,ink,role:'alberta-slogan',kerning:glyphs.kerning});
}
