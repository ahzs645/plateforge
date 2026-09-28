/** Four independent pre-provincial specimen styles; keep the existing URL. */
import type { PlateFormat } from '../../core/types';
import { LEATHER_SOURCE, LEATHER_SPECIMENS } from '../../templates/bc/leather-specimens';
import { validLeatherSerial } from '../../templates/bc/leather-scene';
import { kitFormat } from './bc-kit';
export const bcLeatherFormats: PlateFormat[] = LEATHER_SPECIMENS.map((s):PlateFormat => {
  // Register a real recipe so React, batch exporters and direct kit consumers
  // all use the same leather scene, not a UI-only replacement.
  const registered=kitFormat({
    id:s.id==='1143'?'1904-leather':`1904-leather-${s.id}`,
    label:`1904–12 · leather · ${s.id} style`,family:'passenger',era:'owner-1904',period:[1904,1912],
    description:s.note,
    grammar:{blocks:[],hint:'1–4 digits · syntax only',custom:{
      generate:(rng)=>String(rng.int(1,9999)),test:validLeatherSerial,
    }},
    recipe:{id:`early-leather-${s.id}`,label:s.label,leatherSpecimen:s.id,
      width:s.width,height:s.height,radius:0,background:s.background,ink:s.metal,
      embossed:false,holes:'none',rim:null,legends:[],source:LEATHER_SOURCE,note:s.note,
      // The kit contract requires serial geometry; the leather renderer owns
      // the actual outlines and positions. This die is never used to draw them.
      serial:{x:0,baseline:0,cap:0,maxWidth:0,die:'bc-block-1918'},
    },
  });
  return {
  ...registered,
  id:s.id==='1143'?'1904-leather':`1904-leather-${s.id}`,
  label:`1904–12 · leather · ${s.id} style`,
  description:`Specimen-based reconstruction: ${s.label}. ${s.note} These are not one uniform provincial design. Exact manufacture date and physical size are not verified. Enter ${s.id} to reproduce the reference arrangement; other numbers use a custom arrangement, and unseen figures are stylistic extrapolations. The 1–4-digit editor limit is not a verified registration-number range.`,
  family:'passenger',era:'owner-1904',period:[1904,1912],
  references:[LEATHER_SOURCE],pattern:'1–4 digits · syntax only',
  fields:[
    {key:'serial',label:`Plate serial · reference ${s.id}`,maxLength:4,placeholder:s.id},
    {key:'finish',label:'Rendering',preserveOnGenerate:true,options:[
      {value:'raised',label:'Attached metal / leather · vector material study'},
      {value:'flat',label:'Flat geometry · editable outlines'},
    ]},
  ],
  design:{kit:`early-leather-${s.id}`,year:1904},
  generate:(rng)=>({serial:String(rng.int(1,9999)),finish:'raised'}),
  validate:(parts)=>{
    if(!validLeatherSerial(parts.serial??'')) return 'Enter 1–4 digits without a leading zero. This is a drawing constraint, not confirmation of a historical registration.';
    if(parts.finish!==undefined && !['raised','flat'].includes(parts.finish)) return 'Choose the raised-material or flat-outline rendering.';
    return null;
  },
  text:(parts)=>parts.serial??'',
};
});
