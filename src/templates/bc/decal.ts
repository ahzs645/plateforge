/**
 * Renewal decal artwork in photographed era layouts. Province, month/year,
 * control and day printing have separate constructions. Sizes are estimated;
 * control numbers are illustrative unless supplied. Code 128 encoding was confirmed on four source specimens.
 */
import { node as n, type SvgNode } from '../svg-scene';
import { buildDieText } from '../dies/engine';
import { dieProfile } from '../dies/profiles';
import { buildExpo86Logo } from './expo86-logo';
import { buildCode128 } from './decal-barcode';
import { buildDecalFlower } from './decal-flower';
import { buildDecalSun } from './decal-sun';
import { decalTypography, type TypographyRun } from './decal-typography';

export interface DecalArt {
  style: 'annual' | 'panel' | 'bordered' | 'solid';
  background: string;
  ink: string;
  serialInk: string;
  /** Pale centre of 1980s month / province-control / year panel decals. */
  panelCentre?: { background: string; ink: string; serialInk: string; controlBackground?: string };
  /** 1980: province spans the top, month/control/year across the lower line. */
  fullProvincePanel?: boolean;
  panelLayout?: 'vertical-sides' | 'province-bottom';
  expo86?: boolean;
  /** Three-letter month (1980 onward). */
  month?: string;
  /** Year as printed: two digits before 2014, full year from 2014. */
  year: string;
  serial?: string;
  /** Day-of-month sticker (1993 onward), drawn in its own well when the base has one. */
  day?: string;
  /** Width-to-height ratio of the decal, estimated from photos. */
  aspect: number;
  borderRatio?: number;
  doubleBorder?: boolean;
  system?: string;
  /** Individually reviewed catalogue variant for typography fitting. */
  typographyId?: string;
  controlRegular?: boolean;
  expiryYear?: number;
  issuedOn?: string;
  nominalColours?: string;
  colourEvidence?: string;
  requirementEnded?: string;
}

/** The decal's own rectangle, centred in a well and never wider than its real proportions. */
export function decalBox(art: DecalArt, well: Box, inset = 1.5): Box {
  const width = Math.max(0, Math.min(well.width - 2 * inset, (well.height - 2 * inset) * art.aspect));
  const height = width / art.aspect;
  return { x: well.x + (well.width - width) / 2, y: well.y + (well.height - height) / 2, width, height };
}
export interface Box { x: number; y: number; width: number; height: number }

function defaultPrinting(role: string): string {
  if (role === 'decal-month') return 'bc-decal-print-heavy-month';
  if (role === 'decal-year') return 'bc-decal-print-heavy-year';
  if (role === 'decal-serial') return 'bc-decal-print-control-bold';
  if (role === 'day-number') return 'bc-decal-print-normal';
  return 'bc-decal-print-normal';
}
function drawText(text: string, x: number, baseline: number, cap: number, maxWidth: number, ink: string, role: string, anchor: 'start' | 'middle' | 'end' = 'middle', profileId?: string, letterSpacing = 0, kerning?: Readonly<Record<string, number>>): SvgNode {
  return buildDieText({ text, profile: dieProfile(profileId?.startsWith('bc-decal-print-') || profileId === 'bc-decal-1970' ? profileId : profileId === 'bc-decal-panel' ? (role === 'decal-month' ? 'bc-decal-print-heavy-month-wide' : 'bc-decal-print-heavy-year-wide') : profileId === 'bc-decal-annual' && role === 'decal-year' ? 'bc-decal-print-heavy-year' : profileId === 'bc-decal-wide' || profileId === 'bc-decal-annual' ? 'bc-decal-print-normal' : profileId === 'bc-decal-control' ? 'bc-decal-print-control' : profileId === 'bc-decal-control-bold' ? 'bc-decal-print-control-bold' : defaultPrinting(role)), x, baseline, capHeight: cap, maxWidth, anchor, ink, role, letterSpacing, kerning }).node;
}

export function buildDecal(art: DecalArt, b: Box): SvgNode {
  const { x, y, width: w, height: h } = b;
  const parts: SvgNode[] = [];
  const audit = decalTypography(art.typographyId, art.month);
  const occurrences: Record<string, number> = {};
  // Each role follows its explicit source line order. No browser word wrapping
  // or per-glyph horizontal scaling is used; alternate months retain native advances.
  const t = (...args: Parameters<typeof drawText>): SvgNode => {
    const role = args[6], index = occurrences[role] ?? 0;
    occurrences[role] = index + 1;
    const run: TypographyRun | undefined = audit?.runs[role]?.[index];
    if (!run) return drawText(...args);
    return drawText(args[0], run.local ? args[1] : x+w*run.x,
      run.local ? args[2] : y+h*run.baseline, h*run.cap,
      (run.local ? h : w)*run.width, args[5], role, run.anchor ?? args[7],
      run.profile === 'outline-1970' ? 'bc-decal-1970' : `bc-decal-print-${run.profile}`, run.tracking, run.kerning);
  };

  if (art.style === 'annual' && art.year === '78') {
    parts.push(n('rect', { x, y, width: w, height: h, fill: art.background }),
      t('78', x+w*.35, y+h*.71, h*.55, w*.43, art.ink, 'decal-year', 'middle', 'bc-decal-print-normal'),
      t('B', x+w*.635, y+h*.395, h*.22, w*.19, art.ink, 'decal-class', 'middle', 'bc-decal-province'),
      t('C', x+w*.635, y+h*.70, h*.22, w*.19, art.ink, 'decal-class', 'middle', 'bc-decal-province'));
    for (const [text, column] of [['PASS', .075], ['COMM', .845]] as const) {
      [...text].forEach((char, i) => parts.push(t(char, x+w*column, y+h*(.25+i*.13), h*.105, w*.08, art.ink, 'decal-class', 'middle', 'bc-decal-province')));
    }
    if (art.serial) parts.push(t(art.serial, x+w*.5, y+h*.91, h*.16, w*.77, art.serialInk, 'decal-serial', 'middle', 'bc-decal-control'));
  } else if (art.style === 'annual' && art.year === '70') {
    parts.push(n('rect', { x, y, width: w, height: h, fill: art.background }),
      t('70', x+w*.5, y+h*.57, h*.48, w*.66, art.ink, 'decal-year', 'middle', 'bc-decal-1970'),
      t('BRITISH', x+w*.5, y+h*.76, h*.12, w*.74, art.ink, 'decal-legend'),
      t('COLUMBIA', x+w*.5, y+h*.92, h*.12, w*.86, art.ink, 'decal-legend'));
  } else if (art.style === 'annual' && ['71', '74', '75', '76', '77'].includes(art.year)) {
    parts.push(n('rect', { x, y, width: w, height: h, fill: art.background }));
    const province = (cx: number, top: number, width: number, cap = .12) => [
      t('BRITISH', x+w*cx, y+h*(top+cap), h*cap, w*width, art.ink, 'decal-legend'),
      t('COLUMBIA', x+w*cx, y+h*(top+cap*2.5), h*cap, w*width, art.ink, 'decal-legend'),
    ];
    const control = (left: number, top: number, width: number, height: number) => art.serial ? [
      n('rect', { x:x+w*left, y:y+h*top, width:w*width, height:h*height,
        fill: art.year==='74'?art.background:art.ink, stroke:art.ink, strokeWidth:h*.008, 'data-role':'decal-control-panel' }),
      t(art.serial, x+w*(left+width/2), y+h*(top+height*.78), h*height*.50,
        w*width*.88, '#171717', 'decal-serial', 'middle', 'bc-decal-control'),
    ] : [];
    const flower = (cx: number, cy: number) => buildDecalFlower(x+w*cx, y+h*cy, h*.30, art.ink);
    if (art.year === '71') {
      parts.push(...province(.30,.08,.52),
        t('71',x+w*.79,y+h*.84,h*.40,w*.38,art.ink,'decal-year','middle','bc-decal-wide'),
        ...control(.07,.51,.49,.31), buildDecalSun(x+w*.79, y+h*.22, h*.40, art.ink));
    } else if (art.year === '74') {
      parts.push(...province(.39,.08,.57,.11),
        t('7',x+w*.85,y+h*.42,h*.34,w*.18,art.ink,'decal-year','middle','bc-decal-wide'),
        t('4',x+w*.85,y+h*.86,h*.34,w*.18,art.ink,'decal-year','middle','bc-decal-wide'),
        ...control(.09,.43,.62,.28),
        t('PASSENGER',x+w*.41,y+h*.9,h*.12,w*.65,art.ink,'decal-class'));
    } else if (art.year === '75') {
      parts.push(...province(.30,.09,.52),
        t('75',x+w*.77,y+h*.36,h*.30,w*.42,art.ink,'decal-year','middle','bc-decal-wide'),
        ...control(.075,.42,.85,.30),
        t('PASS. COMM.',x+w*.5,y+h*.9,h*.12,w*.86,art.ink,'decal-class'));
    } else if (art.year === '76') {
      parts.push(...province(.35,.07,.59), flower(.82,.23),
        t('76',x+w*.125,y+h*.52,h*.12,w*.16,art.ink,'decal-year'),
        t('PASS. COMM.',x+w*.57,y+h*.52,h*.12,w*.73,art.ink,'decal-class'),
        ...control(.07,.61,.86,.31));
    } else {
      parts.push(t('B',x+w*.1,y+h*.21,h*.13,w*.12,art.ink,'decal-class'),
        t('C',x+w*.1,y+h*.39,h*.13,w*.12,art.ink,'decal-class'),
        t('77',x+w*.44,y+h*.4,h*.29,w*.46,art.ink,'decal-year','middle','bc-decal-wide'),
        flower(.82,.22),t('PASS. COMM.',x+w*.50,y+h*.55,h*.12,w*.83,art.ink,'decal-class'),
        ...control(.09,.62,.84,.29));
    }
  } else if (art.style === 'annual') {
    parts.push(n('rect', { x, y, width: w, height: h, fill: art.background }),
      t(art.year, x + w * 0.23, y + h * 0.86, h * 0.72, w * 0.38, art.ink, 'decal-year', 'middle', 'bc-decal-annual'),
      t('BRITISH', x + w * 0.71, y + h * 0.64, h * 0.14, w * 0.49, art.ink, 'decal-legend'),
      t('COLUMBIA', x + w * 0.71, y + h * 0.84, h * 0.14, w * 0.49, art.ink, 'decal-legend'),
      ...(art.serial ? [n('rect',{x:x+w*.40,y:y+h*.14,width:w*.54,height:h*.33,fill:'none',stroke:art.ink,strokeWidth:h*.015}),
        t(art.serial, x+w*.69, y+h*.34, h*.17, w*.44, art.serialInk, 'decal-serial','middle','bc-decal-control-bold')] : []));
  } else if (art.fullProvincePanel) {
    parts.push(n('rect', {x,y,width:w,height:h,fill:art.background}),
      t('BRITISH COLUMBIA',x+w*.5,y+h*.3,h*.22,w*.94,art.ink,'decal-legend','middle','bc-decal-print-regular'),
      t(art.month ?? '',x+w*.02,y+h*.88,h*.44,w*.4,art.ink,'decal-month','start','bc-decal-wide'),
      t(art.year,x+w*.98,y+h*.88,h*.44,w*.25,art.ink,'decal-year','end','bc-decal-wide'),
      ...(art.serial ? [n('rect',{x:x+w*.44,y:y+h*.55,width:w*.3,height:h*.31,fill:'none',stroke:art.serialInk,strokeWidth:h*.007}),t(art.serial,x+w*.59,y+h*.78,h*.17,w*.27,art.serialInk,'decal-serial','middle','bc-decal-control')] : []));
  } else if (art.panelLayout==='vertical-sides') {
    parts.push(n('rect',{x,y,width:w,height:h,fill:art.background}),
      n('rect',{x,y,width:w*.09,height:h,fill:'#f4f1e7'}),
      n('rect',{x:x+w*.9,y,width:w*.1,height:h,fill:'#f4f1e7'}),
      n('g',{transform:`translate(${x+w*.045} ${y+h*.5}) rotate(-90)`},t('BRITISH',0,0,h*.065,h*.78,art.background,'decal-legend')),
      n('g',{transform:`translate(${x+w*.078} ${y+h*.5}) rotate(-90)`},t('COLUMBIA',0,0,h*.065,h*.78,art.background,'decal-legend')),
      t(art.month??'',x+w*.36,y+h*.81,h*.7,w*.49,art.ink,'decal-month','middle','bc-decal-panel'),
      t(art.year,x+w*.76,y+h*.81,h*.7,w*.23,art.ink,'decal-year','middle','bc-decal-panel'),
      ...(art.serial?[n('g',{transform:`translate(${x+w*.943} ${y+h*.5}) rotate(90)`},t(art.serial,0,0,h*.13,h*.91,art.serialInk,'decal-serial','middle','bc-decal-control'))]:[]));
  } else if (art.panelLayout==='province-bottom') {
    parts.push(n('rect',{x,y,width:w,height:h,fill:art.background}),
      t(art.month??'',x+w*.23,y+h*.73,h*.6,w*.4,art.ink,'decal-month','middle','bc-decal-panel'),
      t(art.year,x+w*.83,y+h*.73,h*.6,w*.28,art.ink,'decal-year','middle','bc-decal-panel'),
      t('BRITISH COLUMBIA',x+w*.66,y+h*.9,h*.12,w*.56,art.ink,'decal-legend'),
      ...(art.serial?[t(art.serial,x+w*.57,y+h*.48,h*.17,w*.27,art.serialInk,'decal-serial','middle','bc-decal-control')]:[]));
  } else if (art.expo86) {
    parts.push(n('rect',{x,y,width:w,height:h,fill:art.background}),
      t('BRITISH COLUMBIA',x+w*.3,y+h*.22,h*.13,w*.53,'#b72b2b','decal-legend'),
      t(art.month ?? '',x+w*.3,y+h*.87,h*.61,w*.42,'#b72b2b','decal-month','middle','bc-decal-control'),
      buildExpo86Logo({x:x+w*.59,y,width:w*.30,height:h*.97},'#12356e'),
      ...(art.serial ? [n('g',{transform:`translate(${x+w*.95} ${y+h*.5}) rotate(90)`},
        t(art.serial,0,0,h*.12,h*.84,'#171717','decal-serial','middle','bc-decal-control'))] : []));
  } else if (art.style === 'panel' && art.panelCentre) {
    const centre = art.panelCentre;
    const left = w * (art.year === '88' ? .46 : art.year === '83' ? .405 : .38);
    const middle = w * (art.year === '88' ? .26 : art.year === '83' ? .335 : .35);
    const right = w - left - middle;
    const controlAbove = art.year === '82';
    parts.push(n('rect', { x, y, width: w, height: h, fill: art.background }),
      n('rect', { x: x+left, y, width: middle, height: h, fill: centre.background, 'data-role': 'decal-centre' }),
      ...(centre.controlBackground ? [n('rect', { x: x+w*.38, y: y+h*(controlAbove ? .20 : .47), width: w*.38, height: h*(controlAbove ? .32 : .31), fill: centre.controlBackground, 'data-role': 'decal-control-panel' })] : []),
      t(art.month ?? '', x+left/2, y+h*.82, h*.64, left-h*.13, art.ink, 'decal-month', 'middle', 'bc-decal-panel'),
      t(art.year, x+left+middle+right/2, y+h*.82, h*.64, right-h*.1, art.ink, 'decal-year', 'middle', 'bc-decal-panel'),
      t('BRITISH', x+left+middle/2, y+h*(controlAbove ? .72 : .26), h*.10, middle-h*.08, centre.ink, 'decal-legend', 'middle', 'bc-decal-province'),
      t('COLUMBIA', x+left+middle/2, y+h*(controlAbove ? .88 : .41), h*.10, middle-h*.08, centre.ink, 'decal-legend', 'middle', 'bc-decal-province'),
      ...(art.serial ? [t(art.serial, x+left+middle/2, y+h*(controlAbove ? .41 : .81), h*.14, middle-h*.1, centre.serialInk, 'decal-serial', 'middle', 'bc-decal-control')] : []));
  } else if (art.year.length === 4) {
    const cap=Number(art.year)>=2018?.47:.59;
    parts.push(n('rect', {x, y, width:w, height:h, rx:h*(audit?.layout?.cornerRadius ?? (Number(art.year)>=2018?.10:.035)), fill:art.background}),
      t(art.month ?? '', x+w*.04, y+h*.65, h*cap, w*.34, art.ink, 'decal-month', 'start'),
      t(art.year, x+w*.96, y+h*.65, h*cap, w*.46, art.ink, 'decal-year', 'end'),
      n('g', {transform:`translate(${x+w*(audit?.layout?.provinceColumns?.[0] ?? .445)} ${y+h*(audit?.layout?.provinceCentre ?? .36)}) rotate(-90)`},
        t('BRITISH', 0, 0, h*.065, h*.45, art.ink, 'decal-legend', 'middle', 'bc-decal-print-vertical-province')),
      n('g', {transform:`translate(${x+w*(audit?.layout?.provinceColumns?.[1] ?? .485)} ${y+h*(audit?.layout?.provinceCentre ?? .36)}) rotate(-90)`},
        t('COLUMBIA', 0, 0, h*.065, h*.45, art.ink, 'decal-legend', 'middle', 'bc-decal-print-vertical-province')),
      ...(art.serial ? [t(art.serial, x+w*.765, y+h*.89, h*.16, w*.43, art.serialInk, 'decal-serial')] : []));
    if (art.serial) {
      const barcode = audit?.layout?.barcode;
      parts.push(buildCode128(art.serial, barcode ? { x:x+w*barcode.x, y:y+h*barcode.y, width:w*barcode.width, height:h*barcode.height } : {x:x-w*.015,y:y+h*.75,width:w*.59,height:h*.16},art.ink));
    }
  } else if (art.year === '04') {
    parts.push(n('rect', {x,y,width:w,height:h,fill:art.background}),
      t(art.month ?? '', x+w*.025, y+h*.80, h*.73, w*.37, art.ink, 'decal-month', 'start'),
      t(art.year, x+w*.595, y+h*.59, h*.51, w*.26, art.ink, 'decal-year'),
      t('BRITISH', x+w*.43, y+h*.38, h*.085, w*.12, art.ink, 'decal-legend'),
      t('COLUMBIA', x+w*.43, y+h*.49, h*.085, w*.15, art.ink, 'decal-legend'),
      ...(art.serial ? [t(art.serial,x+w*.51,y+h*.95,h*.16,w*.5,art.serialInk,'decal-serial')] : []));
  } else if (art.style === 'solid' && Number(art.year) >= 5 && Number(art.year) <= 13) {
    const barcodeEra = Number(art.year) >= 9;
    parts.push(n('rect',{x,y,width:w,height:h,rx:h*.035,fill:art.background}),
      t(art.month ?? '',x+w*.025,y+h*(barcodeEra ? .70 : .80),h*(barcodeEra ? .64 : .73),w*.46,art.ink,'decal-month','start'),
      t(art.year,x+w*.975,y+h*.68,h*(barcodeEra ? .62 : .55),w*.26,art.ink,'decal-year','end'),
      t('BRITISH',x+w*.59,y+h*.35,h*.085,w*.16,art.ink,'decal-legend'),
      t('COLUMBIA',x+w*.59,y+h*.48,h*.085,w*.16,art.ink,'decal-legend'),
      ...(art.serial ? [t(art.serial,x+w*.765,y+h*.91,h*.16,w*.43,art.serialInk,'decal-serial')] : []));
    if (barcodeEra && art.serial) parts.push(buildCode128(art.serial,{x:x-w*.015,y:y+h*.75,width:w*.59,height:h*.16},art.ink));
  } else {
    const bordered = art.style === 'bordered' || !!art.borderRatio;
    const edge = bordered ? h * (art.borderRatio ?? 0.055) : 0;
    parts.push(n('rect', { x, y, width: w, height: h, rx: art.style === 'solid' ? h * 0.08 : 0, fill: art.background }));
    if (bordered) parts.push(n('rect', { x: x + edge / 2, y: y + edge / 2, width: w - edge, height: h - edge, fill: 'none', stroke: art.ink, strokeWidth: edge }));
    if (art.doubleBorder) parts.push(n('rect',{x:x+edge*1.7,y:y+edge*1.7,width:w-edge*3.4,height:h-edge*3.4,
      rx:h*.05,fill:'none',stroke:art.ink,strokeWidth:edge*.4,'data-role':'decal-inner-border'}));
    const inner = { x: x + edge, w: w - 2 * edge, top: y + edge, h: h - 2 * edge };
    parts.push(
      t(art.month ?? '', inner.x + inner.w * 0.02, inner.top + inner.h * 0.86, inner.h * 0.72, inner.w * 0.38, art.ink, 'decal-month', 'start', 'bc-decal-panel'),
      t(art.year, inner.x + inner.w * 0.98, inner.top + inner.h * 0.86, inner.h * 0.72, inner.w * 0.28, art.ink, 'decal-year', 'end', 'bc-decal-panel'),
      t('BRITISH', inner.x + inner.w * 0.53, inner.top + inner.h * 0.25, inner.h * 0.105, inner.w * 0.28, art.ink, 'decal-legend'),
      t('COLUMBIA', inner.x + inner.w * 0.53, inner.top + inner.h * 0.45, inner.h * 0.105, inner.w * 0.28, art.ink, 'decal-legend'),
      ...(art.serial ? [t(art.serial, inner.x + inner.w * 0.53, inner.top + inner.h * 0.78, inner.h * 0.16, inner.w * 0.28, art.serialInk, 'decal-serial', 'middle', art.controlRegular ? 'bc-decal-control' : 'bc-decal-control-bold')] : []));
  }
  return n('g', { 'data-role': 'renewal-decal', 'data-accuracy': 'photograph-reviewed reconstruction; font and colour approximate',
    ...(art.system ? {'data-printing-system':art.system}:{}),
    ...(audit ? {'data-typography-review': art.typographyId!, 'data-font-evidence': 'visual candidates; historical font identity unconfirmed'} : {}),
    ...(art.expiryYear ? { 'data-expiry-year': art.expiryYear } : {}),
    ...(art.issuedOn ? { 'data-issued-on': art.issuedOn } : {}),
    ...(art.colourEvidence ? { 'data-colour-evidence': art.colourEvidence } : {}),
    ...(art.nominalColours ? { 'data-nominal-colours': art.nominalColours } : {}),
    ...(art.requirementEnded ? { 'data-required-until': art.requirementEnded } : {}), 'data-placement': 'rear',
  }, ...parts);
}

/** White day-of-month sticker with a black number. */
export function buildDaySticker(day: string, b: Box): SvgNode {
  return n('g', { 'data-role': 'day-decal' },
    n('rect', { x: b.x, y: b.y, width: b.width, height: b.height, rx: 1.5, fill: '#eef3f5', stroke: '#c9cfd4', strokeWidth: 0.4 }),
    drawText(day, b.x + b.width / 2, b.y + b.height * 0.74, b.height * 0.46, b.width * 0.7, '#111111', 'day-number'));
}
