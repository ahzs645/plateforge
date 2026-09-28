/** Pure SVG scene builder: shared by React, export tests and the offline review sheet. */
import type { Design, Parts } from '../core/types';
import { IRAQ_LETTERS, iraqGovernorate } from '../regions/asia/iraq-data';
import { asciiDigits, displayDigits, normalizeLetter } from '../regions/asia/plate-script';
import { accessibility, glyphRun, xml, type GlyphProfile } from './westasia-glyphs';

export interface PlateScene { width: number; height: number; body: string }
const colour = (value: unknown, fallback: string): string => typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? value : fallback;
function rect(x: number, y: number, w: number, h: number, fill: string, more = ''): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
}
const rule = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="currentColor" stroke-width="2"/>`;
/** Only words use SVG text. Unlike numeric blocks, Arabic words must remain joined and RTL. */
function legend(value: string, x: number, y: number, size: number, width: number, rtl = false): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${rtl ? 'Tahoma,Arial,sans-serif' : 'Arial,sans-serif'}" font-size="${size}" font-weight="700" fill="currentColor" direction="${rtl ? 'rtl' : 'ltr'}" unicode-bidi="isolate" textLength="${width}" lengthAdjust="spacingAndGlyphs">${xml(value.slice(0, 100))}</text>`;
}
function shell(w: number, h: number, bg: string): string {
  return rect(0, 0, w, h, bg, 'rx="7"') + rect(3, 3, w - 6, h - 6, 'none', 'rx="5" stroke="currentColor" stroke-width="1.7"');
}
function iranStrip(w: number, h: number): string {
  // Tricolour and a simplified geometric emblem; flag micro-calligraphy is explicitly not reproduced.
  const fw = w - 12;
  return rect(4, 4, w - 4, h - 8, '#174a97') + `<g data-layer="flag">` + rect(9, 12, fw, 7, '#23924b') + rect(9, 19, fw, 7, '#ffffff') + rect(9, 26, fw, 7, '#d52731') +
    `<g transform="translate(${9 + fw / 2 - 3} 19) scale(.12)" fill="none" stroke="#d52731" stroke-width="5"><path d="M25 1V50M12 4Q-7 25 17 47M38 4Q57 25 33 47M15 13Q8 36 25 48Q42 36 35 13"/></g></g>` +
    `<g color="#ffffff">${legend('I.R.', w / 2 + 2, h - 32, 10, w - 14)}${legend('IRAN', w / 2 + 2, h - 15, 10, w - 11)}</g>`;
}
function serialRun(value: string, x: number, y: number, width: number, height: number, gap: number, profile: GlyphProfile = 'geometric'): string {
  // Short historical/carried-over serials retain their die proportions instead of stretching to five slots.
  const fitted = Math.min(width, Math.max(0, [...value].length * height * .61 + ([...value].length - 1) * gap));
  return glyphRun(value, x + (width - fitted) / 2, y, fitted, height, gap, profile);
}
function metadata(text: string, country: string): string {
  return `<title>${xml(text)}</title><desc>PlateForge ${country}: editable geometric reconstruction, not official manufacturing artwork. Serial glyphs are paths; joined legends use system-font SVG text. Colours, flag detail and unverified historical dimensions are approximate. Research snapshot 2026-09-27.</desc>`;
}

export function iraqSize(design: Design, parts: Parts = {}): { width: number; height: number } {
  return (design.system === 'modern' && parts.layout !== 'compact') || design.system === 'side' ? { width: 520, height: 110 } : { width: 335, height: 155 };
}
export function iraqScene(design: Design, parts: Parts, text = ''): PlateScene {
  const { width: w, height: h } = iraqSize(design, parts);
  const ink = colour(design.ink, '#151515');
  const bg = colour(design.bg, '#f8f8f3');
  const province = iraqGovernorate(asciiDigits(parts.governorate))?.arabic ?? '';
  const serial = asciiDigits(parts.serial ?? '');
  let body = metadata(text, 'Iraq') + `<g color="${ink}">` + shell(w, h, bg);
  if (design.system === 'modern') {
    // Modern federal / KRG Latin lettering uses EuroPlate outlines (typography review: 0.80 vs 0.49 overlap).
    const compact = w < 400, stripW = compact ? 32 : 38;
    body += `<g data-layer="class-strip">` + rect(4, 4, stripW - 4, h - 8, colour(design.strip, '#f8f8f3')) + `</g>` + rule(stripW, 4, stripW, h - 4);
    body += `<g color="${colour(design.stripInk, ink)}">`;
    const sy = compact ? 24 : 12, dy = compact ? 31 : 25;
    for (const [i, ch] of [...'IRQ'].entries()) body += glyphRun(ch, 11, sy + i * dy, stripW - 18, 22, 3, 'euro');
    if (design.kr === true) body += glyphRun('KR', 9, h - 23, stripW - 14, 13, 2, 'euro');
    body += '</g>';
    const code = asciiDigits(parts.governorate ?? '');
    if (compact) {
      body += `<g data-layer="governorate">${glyphRun(code, 88, 12, 88, 53, 3, 'euro')}</g>`;
      body += `<g data-layer="series">${glyphRun(parts.letter ?? '', 213, 12, 36, 53, 3, 'euro')}</g>`;
      body += `<g data-layer="serial">${serialRun(serial, 54, 73, 259, 65, 9, 'euro')}</g>`;
    } else {
      body += `<g data-layer="governorate">${glyphRun(code, 51, 17, 94, 77, 7, 'euro')}</g>`;
      body += `<g data-layer="series">${glyphRun(parts.letter ?? '', 162, 17, 44, 77, 3, 'euro')}</g>`;
      body += `<g data-layer="serial">${serialRun(serial, 228, 17, 276, 77, 8, 'euro')}</g>`;
    }
  } else if (design.system === 'bilingual') {
    body += rule(31, 4, 31, h - 4) + rule(31, 114, w - 4, 114);
    for (const [i, ch] of [...'IRAQ'].entries()) body += glyphRun(ch, 10, 18 + i * 31, 14, 25);
    const ar = IRAQ_LETTERS.find((l) => l.latin === parts.letter)?.arabic ?? parts.letter ?? '';
    body += `<g data-layer="arabic-serial">${glyphRun(normalizeLetter(ar), 45, 12, 44, 63)}${glyphRun(displayDigits(serial, 'arabic'), 112, 12, 207, 63, 7)}</g>`;
    body += `<g data-layer="latin-serial">${glyphRun(`${parts.letter ?? ''} ${serial}`, 101, 80, 175, 24, 4)}</g>`;
    const label = String(design.classLabel ?? '');
    body += design.national === true ? legend(label, 182, 142, 23, Math.min(250, Math.max(92, label.length * 9)), true) :
      rule(180, 114, 180, h - 4) + legend(province, 106, 142, 23, Math.min(126, Math.max(61, province.length * 11)), true) + legend(label, 256, 142, 23, Math.min(122, Math.max(57, label.length * 11)), true);
  } else if (design.system === 'side') {
    body += rule(152, 4, 152, h - 4) + rule(4, 55, 152, 55);
    body += legend('العراق', 79, 42, 33, 97, true) + legend(province, 79, 91, 31, 128, true);
    body += `<g data-layer="serial">${serialRun(displayDigits(serial, 'arabic'), 174, 17, 324, 78, 8)}</g>`;
  } else {
    body += rule(4, 94, w - 4, 94) + rule(w / 2, 94, w / 2, h - 4);
    body += `<g data-layer="serial">${serialRun(displayDigits(serial, 'arabic'), 18, 12, w - 36, 70, 10)}</g>`;
    body += legend(province, w / 4, 133, 30, Math.min(141, Math.max(72, province.length * 13)), true) + legend('العراق', w * .75, 133, 31, 100, true);
  }
  return { width: w, height: h, body: body + '</g>' };
}

export function iranSize(design: Design): { width: number; height: number } {
  if (design.system === 'motorcycle') return { width: 200, height: 150 };
  if (design.system === 'free-zone') return { width: 305, height: 153 };
  return { width: 520, height: 110 };
}
export function iranScene(design: Design, parts: Parts, text = ''): PlateScene {
  const { width: w, height: h } = iranSize(design);
  const ink = colour(design.ink, '#141414');
  let body = metadata(text, 'Iran') + `<g color="${ink}">` + shell(w, h, colour(design.bg, '#fafaf6'));
  if (design.system === 'motorcycle') {
    body += iranStrip(31, h) + legend('ایران', 165, 18, 14, 39, true);
    body += `<g data-layer="allocation">${glyphRun(displayDigits(parts.code ?? '', 'persian'), 53, 30, 114, 43, 5)}</g>`;
    body += `<g data-layer="serial">${glyphRun(displayDigits(parts.serial ?? '', 'persian'), 40, 85, 151, 52, 5)}</g>`;
  } else if (design.system === 'free-zone') {
    body += iranStrip(58, h);
    body += `<g color="#ffffff">${legend('LOGO', 31, 60, 10, 38)}${legend('PENDING', 31, 74, 8, 42)}${legend(parts.zone ?? '', 31, 98, 10, 43)}</g>`;
    body += `<g data-layer="persian-serial">${glyphRun(displayDigits(parts.serial ?? '', 'persian'), 76, 16, 209, 54, 7)}</g>`;
    body += `<g data-layer="latin-serial">${glyphRun(asciiDigits(parts.serial), 76, 85, 209, 53, 7)}</g>`;
  } else if (design.system === 'protocol') {
    body += iranStrip(42, h);
    body += legend('تشریفات', 159, 57, 36, 165, true) + legend('PROTOCOL', 159, 87, 18, 147);
    body += `<g data-layer="serial">${glyphRun(displayDigits(parts.serial ?? '', 'persian'), 276, 18, 227, 76, 9)}</g>`;
  } else {
    body += iranStrip(42, h) + rule(431, 4, 431, h - 4) + rule(431, 35, w - 4, 35);
    body += `<g data-layer="prefix">${glyphRun(displayDigits(parts.prefix ?? '', 'persian'), 54, 18, 100, 78, 6)}</g>`;
    const classLetter = String(design.classLetter ?? normalizeLetter(parts.letter));
    body += '<g data-layer="series">';
    if (design.accessible === true) body += accessibility(171, 20, 68);
    else if (classLetter === 'الف') body += legend('الف', 207, 81, 54, 78, true);
    else body += glyphRun(normalizeLetter(classLetter), 178, design.vehicleClass === 'taxi' ? 39 : 19, 61, design.vehicleClass === 'taxi' ? 55 : 76);
    if (design.vehicleClass === 'taxi') body += legend('TAXI', 208, 27, 13, 48);
    body += '</g>';
    body += `<g data-layer="serial">${glyphRun(displayDigits((design.mission === true ? parts.mission : parts.serial) ?? '', 'persian'), 267, 18, 150, 78, 5)}</g>`;
    body += legend('ایران', 473, 26, 22, 63, true);
    body += `<g data-layer="allocation">${glyphRun(displayDigits(parts.code ?? '', 'persian'), 442, 44, 64, 56, 4)}</g>`;
  }
  return { width: w, height: h, body: body + '</g>' };
}

export function sceneSvg(scene: PlateScene, label = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="${xml(label)}">${scene.body}</svg>`;
}
