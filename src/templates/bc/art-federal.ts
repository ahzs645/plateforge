/** Schematic gallery emblems; small seals and validation microtext are unresolved. */
import {node as n} from '../svg-scene';
import {registerArtwork} from './art';
const leaf = 'M20 1 L23 8 L27 6 L25.5 16 L31 10 L33 14 L38.5 12.5 L35.5 20 L37.5 22 L29 28.5 L30.5 32 L21 30.5 L21 39 L19 39 L19 30.5 L9.5 32 L11 28.5 L2.5 22 L4.5 20 L1.5 12.5 L7 14 L9 10 L14.5 16 L13 6 L17 8 Z';
registerArtwork('federal-maple', {viewBox: [40,40], draw: () => [n('path', {d: leaf, fill: 'currentColor'})]});
registerArtwork('federal-flag', {viewBox: [80,40], draw: () => [
  n('rect', {width: 80, height: 40, fill: '#fff'}),
  n('path', {d: 'M0 0 H20 V40 H0 Z M60 0 H80 V40 H60 Z', fill: '#c22f32'}),
  n('path', {d: leaf, fill: '#c22f32', transform: 'translate(24 4) scale(.8)'}),
]});
registerArtwork('federal-validation', {viewBox: [30,40], draw: () => [
  n('rect', {x: .5, y: .5, width: 29, height: 39, fill: 'currentColor', stroke: '#555', strokeWidth: 1}),
  n('path', {d: leaf, transform: 'translate(6 10) scale(.45)', fill: '#b9242d'}),
]});
