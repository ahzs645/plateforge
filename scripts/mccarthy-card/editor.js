/* The generated page has no network dependencies. Source: scripts/mccarthy-card/. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const MODEL = JSON.parse($('cardModel').textContent);
  const ASSETS = JSON.parse($('cardAssets').textContent);
  const NS = 'http://www.w3.org/2000/svg';
  const FONTS = new Map(MODEL.fonts.map((font) => [font.id, font]));
  const FONT_NAMES = new Map(MODEL.fonts.map((font, index) => [font.id, `PFCardFace${index}`]));
  const W = MODEL.artboard.width, H = MODEL.artboard.height;
  const OBSERVED = new Set(MODEL.observedChars || ' &-.013678BCDGIMPRSTVabcdefhilmnoprstuvy');
  const BASE = {
    schemaVersion: 1, sourceId: MODEL.sourceId,
    paper: MODEL.artboard.paper, transparent: false, pngWidth: 3600,
    crest: { x: MODEL.crest.x, y: MODEL.crest.y, height: MODEL.crest.height,
      color: MODEL.crest.color, visible: true },
    lines: MODEL.lines.map((line) => ({ id: line.id, text: line.text,
      color: line.color, x: line.x, y: line.y, capHeight: line.capHeight,
      fontId: line.fontId || MODEL.defaultFontId })),
  };
  let state = structuredClone(BASE), selected = MODEL.lines[0].id;
  let tab = 'text', view = 'rebuilt', ready = false, drag = null;
  const lineMetrics = new Map();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const labels = { name: 'Name', deputy: 'Deputy Premier', secretary: 'Provincial Secretary',
    minister: 'Minister title', telephone: 'Telephone', city: 'City', province: 'Province' };

  function el(tag, attributes = {}, text) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function message(text, error = false) {
    $('feedback').textContent = text;
    $('feedback').classList.toggle('error', error);
  }
  function currentLine() { return state.lines.find((line) => line.id === selected) || state.lines[0]; }
  function fontCss(font) {
    return `@font-face{font-family:'${FONT_NAMES.get(font.id)}';src:url(data:font/ttf;base64,${font.ttfBase64}) format('truetype');font-style:normal;font-weight:400;font-display:block;}`;
  }
  function measure(line) {
    const font = FONTS.get(line.fontId);
    const size = line.capHeight / font.capHeightEm;
    ctx.font = `400 ${size}px '${FONT_NAMES.get(font.id)}'`;
    ctx.fontKerning = 'normal';
    const metrics = ctx.measureText(line.text);
    // Actual ink bounds, not the full font's ascender/descender box.
    let bounds = [-metrics.actualBoundingBoxLeft, -metrics.actualBoundingBoxAscent,
      metrics.actualBoundingBoxRight, metrics.actualBoundingBoxDescent];
    if (!bounds.every(Number.isFinite)) bounds = [0, -line.capHeight, metrics.width, size * .25];
    if (!line.text.trim()) bounds = [0, -line.capHeight, 0, 0];
    return { size, bounds, width: bounds[2] - bounds[0], height: bounds[3] - bounds[1],
      tx: line.x - (bounds[0] + bounds[2]) / 2,
      ty: line.y - (bounds[1] + bounds[3]) / 2 };
  }
  function unsupported(line) {
    const font = FONTS.get(line.fontId);
    if (!font.coverage) return [];
    const coverage = new Set(font.coverage);
    return [...new Set([...line.text].filter((ch) => !coverage.has(ch)))];
  }
  function exportProblems() {
    return state.lines.flatMap((line) => {
      const missing = unsupported(line);
      return missing.length ? [`${labels[line.id]}: ${missing.join(' ')}`] : [];
    });
  }
  function provenance() {
    return {
      title: 'Grace M. McCarthy calling card — editable reconstruction',
      sourceId: MODEL.sourceId, sourceSha256: MODEL.source.sha256,
      sourceDate: null, physicalSize: 'Unknown; artboard follows estimated photograph proportions.',
      fontStatus: 'Source-informed study/candidate fonts; the original historical typeface is not authenticated.',
      fonts: [...new Set(state.lines.map((line) => line.fontId))].map((id) => {
        const font = FONTS.get(id);
        return { id, family: font.family, sha256: font.sha256, sourceUrl: font.sourceUrl,
          licence: font.licenseId, copyright: font.copyright, fullLicence: font.license };
      }),
      arms: { status: 'Supplied substitute, different engraving from source card.',
        scaling: 'Uniform; supplied compound path and evenodd fill preserved.',
        pathSha256: MODEL.crest.pathSha256 || null },
      layout: structuredClone(state), limitations: MODEL.limitations,
    };
  }
  function makeSvg({ embedFonts = false, selection = false } = {}) {
    const svg = el('svg', { xmlns: NS, width: W, height: H, viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': `Reconstructed calling card for ${state.lines[0].text}` });
    svg.append(el('title', {}, `Calling card — ${state.lines[0].text}`));
    svg.append(el('desc', {}, 'Editable source-informed reconstruction. Candidate script lettering and supplied substitute coat of arms.'));
    if (embedFonts) {
      const defs = el('defs');
      const used = [...new Set(state.lines.map((line) => line.fontId))];
      defs.append(el('style', { type: 'text/css' }, used.map((id) => fontCss(FONTS.get(id))).join('\n')));
      svg.append(defs, el('metadata', {}, JSON.stringify(provenance())));
    }
    svg.append(el('rect', { class: 'paper', width: W, height: H, fill: state.paper,
      'fill-opacity': state.transparent ? 0 : 1 }));
    const c = state.crest, bounds = MODEL.crest.bounds;
    const scale = c.height / (bounds[3] - bounds[1]);
    const width = (bounds[2] - bounds[0]) * scale;
    if (c.visible) {
      const group = el('g', { 'data-object': 'crest', 'data-provenance': 'supplied-substitute',
        transform: `translate(${c.x - width / 2} ${c.y - c.height / 2}) scale(${scale}) translate(${-bounds[0]} ${-bounds[1]})` });
      group.append(el('path', { class: 'crest-ink', d: MODEL.crest.path, fill: c.color, 'fill-rule': 'evenodd' }));
      svg.append(group);
    }
    for (const line of state.lines) {
      const metrics = measure(line);
      lineMetrics.set(line.id, metrics);
      const group = el('g', { 'data-object': line.id, transform: `translate(${metrics.tx} ${metrics.ty})` });
      group.append(el('text', { class: 'lettering', x: 0, y: 0,
        'font-family': `${FONT_NAMES.get(line.fontId)}, ${JSON.stringify(FONTS.get(line.fontId).family)}`, 'font-size': metrics.size,
        'font-weight': 400, 'font-style': 'normal', 'font-kerning': 'normal',
        'font-variant-ligatures': 'normal', fill: line.color, 'xml:space': 'preserve' }, line.text));
      svg.append(group);
    }
    if (selection && view !== 'source') {
      let box;
      if (tab === 'arms' && c.visible) box = [c.x - width / 2, c.y - c.height / 2, width, c.height];
      else if (tab === 'text') {
        const line = currentLine(), metrics = lineMetrics.get(line.id);
        box = [line.x - metrics.width / 2, line.y - metrics.height / 2, metrics.width, metrics.height];
      }
      if (box) svg.append(el('rect', { class: 'selection-box ui-only',
        x: box[0] - 8, y: box[1] - 8, width: box[2] + 16, height: box[3] + 16 }));
    }
    return svg;
  }
  function render() {
    if (!ready) return;
    const svg = makeSvg({ selection: true });
    svg.id = 'cardSvg';
    svg.classList.add('focus-card');
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-label', 'Editable card preview. Select a line or the arms; use arrow keys to move the selection.');
    $('cardMount').replaceChildren(svg);
    $('stage').dataset.view = view;
    $('referenceImage').style.opacity = view === 'overlay' ? $('sourceOpacity').value / 100 : 1;
    $('opacityControl').hidden = view !== 'overlay';
    document.querySelectorAll('[data-view]').forEach((button) => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
    const line = currentLine(), metrics = lineMetrics.get(line.id);
    $('lineBounds').textContent = `${metrics.width.toFixed(1)} × ${metrics.height.toFixed(1)} px`;
    $('crestWidth').textContent = `${(state.crest.height * (MODEL.crest.bounds[2] - MODEL.crest.bounds[0]) / (MODEL.crest.bounds[3] - MODEL.crest.bounds[1])).toFixed(1)} px`;
    const missing = unsupported(line), unobserved = [...new Set([...line.text].filter((ch) => !OBSERVED.has(ch)))];
    $('glyphNotice').textContent = missing.length ? `Missing from this font: ${missing.join(' ')}. Choose another face or change the wording before export.` :
      unobserved.length ? `Not visible in the source: ${unobserved.join(' ')}. These forms come from the selected font.` : 'All characters in this line also occur somewhere on the photographed card.';
    $('glyphNotice').classList.toggle('error', missing.length > 0);
  }
  function chooseTab(next) {
    tab = next;
    for (const name of ['text', 'arms', 'card']) $(name + 'Panel').hidden = name !== next;
    document.querySelectorAll('[data-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === next)));
    $('selectionHint').textContent = next === 'arms' ? 'Supplied arms selected. Drag or use arrow keys to move.' :
      next === 'text' ? 'Select lettering or the arms to edit. Drag to position.' : 'Paper and export settings.';
    render();
  }
  function syncInspector() {
    const line = currentLine(), font = FONTS.get(line.fontId);
    $('lineSelect').value = line.id;
    $('lineText').value = line.text;
    $('lineFont').value = line.fontId;
    $('lineSize').value = Number(line.capHeight.toFixed(2));
    $('lineColor').value = line.color;
    $('lineX').value = Number(line.x.toFixed(2));
    $('lineY').value = Number(line.y.toFixed(2));
    $('fontStatus').textContent = font.matchNote || 'Comparison candidate; the original historical face is not authenticated.';
    $('crestVisible').checked = state.crest.visible;
    $('crestHeight').value = Number(state.crest.height.toFixed(2));
    $('crestColor').value = state.crest.color;
    $('crestX').value = Number(state.crest.x.toFixed(2));
    $('crestY').value = Number(state.crest.y.toFixed(2));
    $('paperColor').value = state.paper;
    $('transparent').checked = state.transparent;
    $('pngWidth').value = String(state.pngWidth);
  }
  function changeNumber(id, action) {
    $(id).addEventListener('input', () => {
      const input = $(id), value = Number(input.value);
      if (input.value === '' || !Number.isFinite(value) || value < Number(input.min) || value > Number(input.max)) return;
      action(value); render();
    });
  }
  function download(name, bytes, type) {
    const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; link.hidden = true;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function svgString() {
    const problems = exportProblems();
    if (problems.length) throw new Error(`The selected fonts lack characters in ${problems.join('; ')}.`);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(makeSvg({ embedFonts: true }));
  }
  function safeExport(action) {
    return async () => { try { await action(); } catch (error) { message(error.message || 'Export failed.', true); } };
  }
  async function pngExport() {
    const button = $('downloadPng');
    button.disabled = true;
    message('Rendering the current card…');
    try {
      const problems = exportProblems();
      if (problems.length) throw new Error(`The selected fonts lack characters in ${problems.join('; ')}.`);
      // Draw the loaded FontFace directly. SVG-as-image decoding can silently
      // discard embedded web fonts in some browsers; it is not used for PNG.
      const output = document.createElement('canvas');
      output.width = state.pngWidth; output.height = Math.round(state.pngWidth * H / W);
      const paint = output.getContext('2d');
      paint.scale(output.width / W, output.height / H);
      if (!state.transparent) { paint.fillStyle = state.paper; paint.fillRect(0, 0, W, H); }
      if (state.crest.visible) {
        const c = state.crest, b = MODEL.crest.bounds, s = c.height / (b[3] - b[1]);
        paint.save(); paint.translate(c.x - (b[2] - b[0]) * s / 2, c.y - c.height / 2);
        paint.scale(s, s); paint.translate(-b[0], -b[1]); paint.fillStyle = c.color;
        paint.fill(new Path2D(MODEL.crest.path), 'evenodd'); paint.restore();
      }
      for (const line of state.lines) {
        const metrics = measure(line);
        paint.font = `400 ${metrics.size}px '${FONT_NAMES.get(line.fontId)}'`;
        paint.fontKerning = 'normal'; paint.textAlign = 'left'; paint.textBaseline = 'alphabetic';
        paint.fillStyle = line.color; paint.fillText(line.text, metrics.tx, metrics.ty);
      }
      const blob = await new Promise((resolve) => output.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed. Export the SVG instead.');
      download('grace-mccarthy-card.png', blob, 'image/png');
      message(`PNG exported at ${output.width} × ${output.height} pixels.`);
    } finally { button.disabled = false; }
  }
  const enc = new TextEncoder();
  function fromBase64(text) {
    const raw = atob(text), out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function zipStored(files) {
    // ZIP "store" entries preserve the exact licensed TTF bytes, no dependencies.
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c; }
    const crc = (data) => { let c = 0xffffffff; for (const byte of data) c = table[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const local = [], central = []; let offset = 0, centralSize = 0;
    for (const file of files) {
      const name = enc.encode(file.name), data = typeof file.data === 'string' ? enc.encode(file.data) : file.data, sum = crc(data);
      const lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
      lv.setUint16(12, 33, true); lv.setUint32(14, sum, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true); lh.set(name, 30);
      const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(14, 33, true);
      cv.setUint32(16, sum, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); ch.set(name, 46);
      local.push(lh, data); central.push(ch); offset += lh.length + data.length; centralSize += ch.length;
    }
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
    return new Blob([...local, ...central, end], { type: 'application/zip' });
  }
  function fontsExport() {
    const files = [{ name: 'README.txt', data: 'PlateForge calling-card font study\n\nThese are candidate or source-informed study fonts. They are not authenticated historical typefaces. Install the included TTFs when editing live text in a desktop SVG editor. Each font includes its complete SIL Open Font License and provenance. The supplied card does not document a complete alphabet.\n' }];
    for (const font of MODEL.fonts) {
      const directory = font.id.replace(/[^a-z0-9_-]/gi, '-');
      files.push({ name: `${directory}/${font.filename}`, data: fromBase64(font.ttfBase64) },
        { name: `${directory}/OFL.txt`, data: font.license },
        { name: `${directory}/provenance.json`, data: JSON.stringify({ ...font, ttfBase64: undefined, runs: undefined }, null, 2) });
    }
    download('plateforge-card-fonts.zip', zipStored(files), 'application/zip');
    message('Font files, complete licences, and provenance exported.');
  }
  function validateProject(project) {
    if (!project || typeof project !== 'object' || project.schemaVersion !== 1 || project.sourceId !== MODEL.sourceId) throw new Error('Choose a project saved by this card editor.');
    const result = structuredClone(BASE), color = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
    const num = (v, min, max, name) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(`Invalid ${name} in the project.`); return v; };
    if (!color(project.paper) || typeof project.transparent !== 'boolean') throw new Error('Invalid paper settings.');
    result.paper = project.paper; result.transparent = project.transparent;
    if (![1800, 3600, 5400].includes(project.pngWidth)) throw new Error('Invalid PNG export width.');
    result.pngWidth = project.pngWidth;
    if (!project.crest || !color(project.crest.color) || typeof project.crest.visible !== 'boolean') throw new Error('Invalid coat-of-arms settings.');
    result.crest = { x: num(project.crest.x, -W, W * 2, 'arms X'), y: num(project.crest.y, -H, H * 2, 'arms Y'),
      height: num(project.crest.height, 25, 600, 'arms height'), color: project.crest.color, visible: project.crest.visible };
    if (!Array.isArray(project.lines) || project.lines.length !== BASE.lines.length) throw new Error('The project must contain all seven text lines.');
    const ids = new Set();
    for (const line of project.lines) {
      if (!line || ids.has(line.id) || !BASE.lines.some((item) => item.id === line.id)) throw new Error('Invalid or duplicate text line.');
      ids.add(line.id);
      if (typeof line.text !== 'string' || line.text.length > 180 || /[\r\n\u0000-\u001f]/.test(line.text)) throw new Error('Text lines must be 180 characters or fewer and contain no line breaks.');
      if (!FONTS.has(line.fontId) || !color(line.color)) throw new Error('Invalid font or colour.');
      Object.assign(result.lines.find((item) => item.id === line.id), { text: line.text, fontId: line.fontId, color: line.color,
        x: num(line.x, -W, W * 2, 'text X'), y: num(line.y, -H, H * 2, 'text Y'), capHeight: num(line.capHeight, 10, 240, 'capital height') });
    }
    return result;
  }
  function setupEvidence() {
    const root = $('evidenceBody');
    const heading = (text) => { const h = document.createElement('h3'); h.textContent = text; root.append(h); };
    const para = (text) => { const p = document.createElement('p'); p.textContent = text; root.append(p); };
    heading('What is recreated');
    para('All seven text lines, the card’s layout and its estimated proportions are rebuilt as editable vector elements. The coat of arms preserves the exact supplied compound path and its negative spaces. The clean card does not reproduce paper wear, shadows or scan noise.');
    heading('Lettering');
    para('Commercial Script is a historical identification candidate. The included open fonts and source-informed study cuts are practical reconstruction choices. Study cuts adjust capital/lowercase relationships and observed forms; they do not establish that the original printer used those digital fonts or that every inherited character is historically correct.');
    heading('The arms are a substitution');
    para('The source crest is approximately 1.5 times as wide as it is high. The supplied vector is approximately 0.89 times as wide as it is high, and has a different ribbon and supporter drawing. This recreation keeps its natural proportions and centres it within the photographed crest’s placement.');
    heading('Geometry and colour');
    para(`The 1800 × 1038 artboard comes from the measured source photograph. Its physical print size and original date are not established. ${MODEL.source.cornerConfidence}. The muted olive-gold is an approximation from the photograph, not a verified historical ink specification.`);
    heading('Source'); para(`Uploaded reference: ${MODEL.source.originalFilename}. SHA-256: ${MODEL.source.sha256}`);
    heading('Included typefaces');
    for (const font of MODEL.fonts) {
      const detail = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = `${font.family} · ${font.licenseId}`;
      detail.append(summary);
      const p = document.createElement('p'); p.textContent = font.matchNote || 'Candidate comparison font.'; detail.append(p);
      if (/^https:\/\//.test(font.sourceUrl || '')) { const a = document.createElement('a'); a.href = font.sourceUrl; a.target = '_blank'; a.rel = 'noreferrer'; a.textContent = 'Font source'; detail.append(a); }
      const pre = document.createElement('pre'); pre.textContent = font.license; detail.append(pre); root.append(detail);
    }
    $('observedCharacters').textContent = [...OBSERVED].sort().join(' ');
    for (const entry of ASSETS.comparisons || []) {
      const img = document.createElement('img'); img.src = entry.dataUrl; img.alt = entry.alt; img.className = 'comparison-image'; $('fontComparison').append(img);
    }
  }
  function setupControls() {
    for (const line of MODEL.lines) $('lineSelect').add(new Option(`${labels[line.id]} · ${line.text}`, line.id));
    for (const font of MODEL.fonts) $('lineFont').add(new Option(font.family, font.id));
    $('referenceImage').src = ASSETS.referenceDataUrl; $('sideReference').src = ASSETS.referenceDataUrl;
    document.querySelectorAll('button[data-view]').forEach((button) => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
    document.querySelectorAll('button[data-tab]').forEach((button) => button.addEventListener('click', () => chooseTab(button.dataset.tab)));
    $('sourceOpacity').addEventListener('input', render);
    $('lineSelect').addEventListener('change', () => { selected = $('lineSelect').value; syncInspector(); render(); });
    $('lineText').addEventListener('input', () => { currentLine().text = $('lineText').value.replace(/[\r\n\u0000-\u001f]/g, ' '); render(); });
    $('lineFont').addEventListener('change', () => { currentLine().fontId = $('lineFont').value; syncInspector(); render(); });
    $('lineColor').addEventListener('input', () => { currentLine().color = $('lineColor').value; render(); });
    $('applyFont').addEventListener('click', () => { const id = currentLine().fontId; state.lines.forEach((line) => { line.fontId = id; }); render(); message('Typeface applied to all seven lines. Their positions and sizes are retained.'); });
    changeNumber('lineSize', (v) => { currentLine().capHeight = v; });
    changeNumber('lineX', (v) => { currentLine().x = v; }); changeNumber('lineY', (v) => { currentLine().y = v; });
    $('fitWidth').addEventListener('click', () => {
      const line = currentLine(), source = MODEL.lines.find((item) => item.id === line.id), m = measure(line);
      if (!m.width) return;
      line.capHeight = Math.max(10, Math.min(240, line.capHeight * (source.sourceBounds[2] - source.sourceBounds[0]) / m.width));
      syncInspector(); render(); message('The line was resized uniformly to the reference width.');
    });
    $('crestVisible').addEventListener('change', () => { state.crest.visible = $('crestVisible').checked; render(); });
    $('crestColor').addEventListener('input', () => { state.crest.color = $('crestColor').value; render(); });
    changeNumber('crestHeight', (v) => { state.crest.height = v; }); changeNumber('crestX', (v) => { state.crest.x = v; }); changeNumber('crestY', (v) => { state.crest.y = v; });
    $('paperColor').addEventListener('input', () => { state.paper = $('paperColor').value; render(); });
    $('transparent').addEventListener('change', () => { state.transparent = $('transparent').checked; render(); });
    $('pngWidth').addEventListener('change', () => { state.pngWidth = Number($('pngWidth').value); });
    $('reset').addEventListener('click', () => { state = structuredClone(BASE); syncInspector(); render(); message('Original reconstruction restored.'); });
    $('downloadSvg').addEventListener('click', safeExport(() => { download('grace-mccarthy-card-editable.svg', svgString(), 'image/svg+xml;charset=utf-8'); message('Editable SVG exported with its fonts and provenance embedded.'); }));
    $('downloadPng').addEventListener('click', safeExport(pngExport));
    $('downloadOutlines').addEventListener('click', () => { download('grace-mccarthy-card-outlined.svg', ASSETS.referenceOutline, 'image/svg+xml;charset=utf-8'); message('Reference card exported as portable vector outlines; the original wording is preserved.'); });
    $('downloadFonts').addEventListener('click', fontsExport);
    $('downloadProject').addEventListener('click', () => { download('grace-mccarthy-card-project.json', JSON.stringify(state, null, 2), 'application/json'); message('Project saved. Open it here to restore your wording, positions, typefaces and colours.'); });
    $('importProject').addEventListener('click', () => $('projectFile').click());
    $('projectFile').addEventListener('change', async () => {
      const file = $('projectFile').files[0]; if (!file) return;
      try {
        if (file.size > 100000) throw new Error('This file is too large for a card project.');
        state = validateProject(JSON.parse(await file.text())); syncInspector(); render(); message('Project restored.');
      } catch (error) { message(error.message || 'The project could not be opened.', true); }
      finally { $('projectFile').value = ''; }
    });
    $('openEvidence').addEventListener('click', () => $('evidenceDialog').showModal());
    $('fontReview').addEventListener('click', () => $('fontDialog').showModal());
    $('mobileFontReview').addEventListener('click', () => $('fontDialog').showModal());
    document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => $(button.dataset.close).close()));
    $('cardMount').addEventListener('pointerdown', (event) => {
      if (view === 'source' || event.button !== 0) return;
      const object = event.target.closest('[data-object]'); if (!object) return;
      const id = object.dataset.object;
      if (id === 'crest') chooseTab('arms'); else { selected = id; chooseTab('text'); }
      syncInspector();
      const svg = $('cardSvg'), rect = svg.getBoundingClientRect();
      const item = id === 'crest' ? state.crest : currentLine();
      drag = { id, startX: event.clientX, startY: event.clientY, x: item.x, y: item.y, scaleX: W / rect.width, scaleY: H / rect.height, pointerId: event.pointerId };
      $('cardMount').setPointerCapture(event.pointerId); document.body.classList.add('dragging'); event.preventDefault();
      $('cardSvg').focus({ preventScroll: true });
    });
    $('cardMount').addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const item = drag.id === 'crest' ? state.crest : state.lines.find((line) => line.id === drag.id);
      item.x = Math.max(-W, Math.min(W * 2, drag.x + (event.clientX - drag.startX) * drag.scaleX));
      item.y = Math.max(-H, Math.min(H * 2, drag.y + (event.clientY - drag.startY) * drag.scaleY));
      syncInspector(); render();
    });
    const endDrag = () => { if (drag) $('cardSvg').focus({ preventScroll: true }); drag = null; document.body.classList.remove('dragging'); };
    $('cardMount').addEventListener('pointerup', endDrag); $('cardMount').addEventListener('pointercancel', endDrag);
    $('cardMount').addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || tab === 'card') return;
      event.preventDefault(); const item = tab === 'arms' ? state.crest : currentLine(), step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') item.x -= step; if (event.key === 'ArrowRight') item.x += step;
      if (event.key === 'ArrowUp') item.y -= step; if (event.key === 'ArrowDown') item.y += step;
      item.x = Math.max(-W, Math.min(W * 2, item.x)); item.y = Math.max(-H, Math.min(H * 2, item.y));
      syncInspector(); render(); $('cardSvg').focus({ preventScroll: true });
    });
    setupEvidence(); syncInspector();
  }
  async function start() {
    setupControls();
    try {
      await Promise.all(MODEL.fonts.map(async (font) => {
        const face = new FontFace(FONT_NAMES.get(font.id), fromBase64(font.ttfBase64).buffer, { weight: '400', style: 'normal' });
        await face.load(); document.fonts.add(face);
      }));
      await document.fonts.ready;
      ready = true; $('loading').hidden = true; $('stage').setAttribute('aria-busy', 'false');
      $('downloadSvg').disabled = false; $('downloadPng').disabled = false;
      render();
      // Exposed read-only snapshot for automated export verification, no network state.
      Object.defineProperty(window, 'plateforgeCardStudy', { value: Object.freeze({
        snapshot: () => structuredClone(state), svg: svgString,
        bounds: () => Object.fromEntries([...lineMetrics].map(([id, v]) => [id, { width: v.width, height: v.height }])),
      }) });
    } catch (error) {
      $('loading').textContent = 'A bundled font could not be loaded. The outlined reference SVG is still available below.';
      message(`Font loading failed: ${error.message}`, true);
    }
  }
  start();
})();
