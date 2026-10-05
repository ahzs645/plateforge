/** Independent photographic construction candidates, never B.C. maker assignments. */
import type {DieProfile} from './engine';
import type {SkeletonParams} from './skeleton';
import {registerDieProfile} from './profiles';
const specimen = {title: 'World License Plates · Canadian federal and Forces plates', url: 'http://www.worldlicenseplates.com/world/CN_CDNX.html'};
function profile(id: string, label: string, params: Partial<SkeletonParams>): DieProfile {
  return {id: `ca-federal-${id}`, label, allowResearchReplacement: false,
    overrides: {
      '(': {advance: 28, paths: ['M24 5 Q5 50 24 95']},
      ')': {advance: 28, paths: ['M4 5 Q23 50 4 95']},
    },
    params: {width: 54, stroke: 11, curve: 'stadium', tracking: 12, narrow: 0.5, wide: 1.15,
      one: 'flag', two: 'curved', three: 'round', four: 'open', seven: 'straight', ...params},
    evidence: {status: 'category', specimens: [specimen], notes: 'Illustrative construction read from credited gallery photographs. Not a traced alphabet, recovered tooling, manufacturer attribution or certified match for unobserved glyphs. Colours and date captions remain separate from this construction.'}};
}
export const FEDERAL_DIES = [
  profile('legend', 'Federal · light small legend candidate', {width: 53, stroke: 8, tracking: 18}),
  profile('legend-bold', 'Federal · bold small legend candidate', {width: 54, stroke: 13, tracking: 12}),
  profile('rounded', 'Federal · rounded medium serial candidate', {width: 57, stroke: 11, curve: 'oval', tracking: 12}),
  profile('narrow', 'Federal · narrow upright serial candidate', {width: 43, stroke: 9, tracking: 13, curve: 'stadium', four: 'closed'}),
  profile('heavy', 'Federal · heavy rounded serial candidate', {width: 54, stroke: 14, curve: 'stadium', tracking: 12}),
  profile('block', 'Federal · red block serial candidate', {width: 50, stroke: 13, curve: 'box', boxRadius: 7, tracking: 13, four: 'open', one: 'flag-base'}),
  profile('fisheries', 'Fisheries · condensed green serial candidate', {width: 44, stroke: 11, tracking: 12, curve: 'stadium'}),
  profile('angular', 'CDN 2016 · angular letters / rounded numerals candidate', {width: 59, stroke: 13, curve: 'box', boxRadius: 2,
    glyphCurve: {'0':'stadium','8':'oval','9':'oval'}, tracking: 17, one: 'flag-base', two: 'angled', four: 'open'}),
];
registerDieProfile(...FEDERAL_DIES);
