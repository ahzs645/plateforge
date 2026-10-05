/** Native user-supplied artwork; no system-font dependency for either wordmark. */
import type {ReactElement} from 'react';
import vectors from './alberta-vectors.json';
export type AlbertaWordmark = 'geometric' | 'script';
export function AlbertaArtwork({kind,x,y,width,height,color}: {
  kind: AlbertaWordmark | 'rose';x:number;y:number;width:number;height:number;color:string;
}): ReactElement {
  const art=vectors[kind];
  const [vx,vy,vw,vh]=art.viewBox,scale=Math.min(width/vw,height/vh);
  const px=x+(width-vw*scale)/2,py=y+(height-vh*scale)/2;
  // Groups avoid nested SVG sizing rules affecting preview/export placement.
  return <g transform={`translate(${px} ${py}) scale(${scale}) translate(${-vx} ${-vy})`}
    data-artwork={`alberta-${kind}`} role="img"
    aria-label={kind==='rose'?'Alberta wild rose · supplied vector':`Alberta · supplied ${kind} wordmark`}>
    {art.paths.map((path,i)=><path key={i} d={path.d} fill={color}
      fillRule={'fillRule' in path ? path.fillRule as 'evenodd'|'nonzero' : undefined} />)}
  </g>;
}
