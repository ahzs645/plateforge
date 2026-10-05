import type {KitRecipe} from '../../templates/bc/kit';

/** One national CANADA shell for the regular plate and both APEC sticker variants.
 * Artwork, mount style and serial position are separate photographed choices.
 */
export function federalCanadaLayout({id,label,source,note,apec=false,mapleLeaves=true,
  background='#e4ded0',ink='#1e1e22',frameColor,holes='round',countryColor='#2a3a33'}:{
  id:string;label:string;source:{title:string;url:string};note:string;
  apec?:boolean;mapleLeaves?:boolean;background?:string;ink?:string;
  frameColor?:string;holes?:'round'|'slots';countryColor?:string;
}):KitRecipe {
  return {id,label,width:300,height:150,radius:7,background,ink,embossed:true,source,note,
    holes,holeAt:{x:[.2,.78],y:[holes==='slots'?.07:.08,.93]},
    rim:{inset:3.5,width:1.4,...(frameColor?{color:frameColor}:{})},
    shapes:[{kind:'rect',x:12,y:47,width:276,height:88,rx:5,strokeWidth:1.2,
      ...(frameColor?{stroke:frameColor}:{})}],
    art:[...(mapleLeaves?[
      {art:'official-maple-leaf',x:16,y:12,width:20,height:20,role:'maple-left'},
      {art:'official-maple-leaf',x:264,y:12,width:20,height:20,role:'maple-right'},
    ]:[]),...(apec?[{art:'official-apec-sticker',x:18,y:55,width:82,height:70,role:'apec-sticker'}]:[])],
    legends:[{text:'CANADA',x:150,baseline:38,cap:21,maxWidth:120,die:'bc-legend-1964',
      color:countryColor,role:'country',spread:true}],
    serial:{x:apec?196:150,baseline:127,cap:66,maxWidth:apec?170:262,die:'bc-astro-4'},
  };
}
