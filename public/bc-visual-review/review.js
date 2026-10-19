const $ = (id) => document.getElementById(id);
const embeddedLedger = document.getElementById('evidence-ledger');
const embeddedImages = document.getElementById('evidence-images');
const inlineImages = embeddedImages ? JSON.parse(embeddedImages.textContent) : {};
const manifest = embeddedLedger ? JSON.parse(embeddedLedger.textContent) : await fetch('manifest.json').then((response) => {
  if (!response.ok) throw Error(`Evidence ledger: HTTP ${response.status}`);
  return response.json();
});
const images = new Map();
async function loadImage(url) {
  url = inlineImages[url] ?? url;
  if (!images.has(url)) images.set(url, (async () => {
    const image = new Image(); image.src = url; await image.decode(); return image;
  })());
  return images.get(url);
}
function canvas(width = 900, height = 500) {
  const value = document.createElement('canvas'); value.width = width; value.height = height; return value;
}
function crop(image, rect) {
  const result = canvas(Math.max(1, Math.round(rect[2])), Math.max(1, Math.round(rect[3])));
  result.getContext('2d').drawImage(image, ...rect, 0, 0, result.width, result.height); return result;
}
function photoCrop(image, box) {
  const [x0, y0, x1, y1] = box;
  return crop(image, [x0 * image.width, y0 * image.height, (x1 - x0) * image.width, (y1 - y0) * image.height]);
}
function fit(context, image, {alpha = 1, scale = 1, dx = 0, dy = 0, height} = {}) {
  const factor = (height ? height / image.height : Math.min(880 / image.width, 480 / image.height)) * scale;
  context.globalAlpha = alpha;
  context.drawImage(image, (900 - image.width * factor) / 2 + dx, (500 - image.height * factor) / 2 + dy, image.width * factor, image.height * factor);
  context.globalAlpha = 1;
}
let active, selected = [], renderVersion = 0, blinkTimer = null, blinkState = false;
function stopBlink() { clearInterval(blinkTimer); blinkTimer = null; $('blink').setAttribute('aria-pressed', 'false'); }
function reset() {
  stopBlink(); for (const [id, value] of [['opacity', '0.5'], ['scale', '1'], ['shift-x', '0'], ['shift-y', '0']]) $(id).value = value;
}
function draw() {
  if (!active) return;
  const {record, current, main, original} = active, mode = $('mode').value;
  const context = $('overlay').getContext('2d', {willReadFrequently: true});
  context.fillStyle = 'white'; context.fillRect(0, 0, 900, 500);
  if (mode === 'difference') {
    const a = canvas(), b = canvas(); fit(a.getContext('2d'), main); fit(b.getContext('2d'), current);
    const x = a.getContext('2d').getImageData(0, 0, 900, 500), y = b.getContext('2d').getImageData(0, 0, 900, 500);
    for (let i = 0; i < x.data.length; i += 4) {
      const difference = Math.max(...[0, 1, 2].map((c) => Math.abs(x.data[i + c] - y.data[i + c])));
      x.data[i] = 255; x.data[i + 1] = x.data[i + 2] = 255 - difference; x.data[i + 3] = 255;
    }
    context.putImageData(x, 0, 0);
    $('alignment').textContent = 'Red shows pixel differences between captured main and branch renders. This view includes antialiasing; the recorded measurements use the native captures.';
    return;
  }
  let underneath = main, overlay = current, height;
  if (mode === 'source') underneath = photoCrop(original, record.frame);
  if (mode === 'shape') {
    underneath = photoCrop(original, record.focus.sourceBox);
    const [x, y, width, h] = record.states.current.focusBox;
    const [, , plateWidth, plateHeight] = record.states.current.viewBox;
    overlay = crop(current, [x / plateWidth * current.width, y / plateHeight * current.height, width / plateWidth * current.width, h / plateHeight * current.height]);
    // Equal height and centre, never independent width fitting.
    height = Math.min(400, 860 / Math.max(underneath.width / underneath.height, overlay.width / overlay.height));
  }
  fit(context, underneath, {height});
  fit(context, overlay, {height, alpha: blinkTimer ? Number(blinkState) : Number($('opacity').value), scale: Number($('scale').value), dx: Number($('shift-x').value), dy: Number($('shift-y').value)});
  $('alignment').textContent = mode === 'shape'
    ? 'Shape comparison: cropped logo, equal height and centre, with width proportions retained. White space, paint and photographic perspective can still affect this visual comparison.'
    : mode === 'source' ? record.alignment : 'Main and branch share the same physical plate coordinates and deterministic inputs. The sliders allow exploratory adjustment; Reset restores captured placement.';
}
async function show() {
  reset(); const version = ++renderVersion;
  const record = selected.find((record) => record.id === $('specimen').value);
  if (!record) return;
  const [original, mainAtlas, currentAtlas] = await Promise.all([loadImage(record.source), loadImage(record.images.main.file), loadImage(record.images.current.file)]);
  if (version !== renderVersion) return;
  active = {record, original, main: crop(mainAtlas, record.images.main.rect), current: crop(currentAtlas, record.images.current.rect)};
  $('title').textContent = record.title;
  $('finding').textContent = `${record.status}. ${record.finding ?? record.existingReview ?? ''}`;
  $('source').src = original.src; $('source').alt = `${record.title}: reference photograph`;
  $('source-link').href = record.sourceUrl; $('format-link').href = `${embeddedLedger ? 'https://projects.ahmadjalil.com/plateforge/' : '../'}#/ca-bc/${record.format}`;
  $('format-link').hidden = record.kind === 'decal';
  $('mode').querySelector('[value=shape]').disabled = !record.focus;
  if ($('mode').value === 'shape' && !record.focus) $('mode').value = 'source';
  for (const state of ['main', 'current']) {
    const context = $(state).getContext('2d'); context.fillStyle = 'white'; context.fillRect(0, 0, 900, 500); fit(context, active[state]);
  }
  const diff = record.difference;
  $('measurement').textContent = `Main → branch: ${(diff.changedFraction * 100).toFixed(3)}% of native pixels change by more than 16/255; ${(diff.perceptualChangedFraction * 100).toFixed(3)}% with antialiasing excluded. These measurements compare digital renders, not the photograph.`;
  $('metadata').textContent = JSON.stringify({source: record.sourceUrl, sourcePixels: record.sourceOriginalPixels, sourceSha256: record.sourceSha256, storedPhotoSha256: record.sourceStoredSha256, renderSourceSha256: manifest.renderSourceSha256, inputs: record.parts, research: record.research, focus: record.focus, captured: record.states, limits: record.limits}, null, 2);
  history.replaceState(null, '', '#' + record.id); draw();
}
function populate(id) {
  const category = $('category').value;
  selected = manifest.cases.filter((record) => category === 'all' || record.category === category);
  $('specimen').replaceChildren(...selected.map((record) => new Option(record.title, record.id)));
  if (selected.some((record) => record.id === id)) $('specimen').value = id;
  show().catch(fail);
}
function fail(error) { $('finding').textContent = 'Comparison could not load: ' + error.message; throw error; }
$('summary').textContent = `${manifest.auditCount} B.C. default formats compared; ${manifest.changedCount} exceed 0.1% changed pixels. ${manifest.cases.length} source specimens are available below. Reviewed ${manifest.reviewedOn} in Chromium ${manifest.browser}.`;
$('base-sha').textContent = manifest.baseCommit.slice(0, 7); $('render-sha').textContent = manifest.renderCommit.slice(0, 7) + (manifest.workingChanges ? ' + reviewed source changes' : '');
for (const record of [...manifest.audit].sort((a, b) => b.difference.changedFraction - a.difference.changedFraction)) {
  const row = document.createElement('tr');
  for (const text of [record.format, `${(record.difference.changedFraction * 100).toFixed(3)}%`, `${(record.difference.perceptualChangedFraction * 100).toFixed(3)}%`]) {
    const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
  }
  $('audit').append(row);
}
$('category').addEventListener('change', () => populate()); $('specimen').addEventListener('change', () => show().catch(fail));
for (const [button, delta] of [['previous', -1], ['next', 1]]) $(button).addEventListener('click', () => {
  const select = $('specimen'); select.selectedIndex = (select.selectedIndex + delta + selected.length) % selected.length; show().catch(fail);
});
for (const id of ['mode', 'opacity', 'scale', 'shift-x', 'shift-y']) $(id).addEventListener('input', draw);
$('reset').addEventListener('click', () => { reset(); draw(); });
$('blink').addEventListener('click', () => {
  if (blinkTimer) stopBlink(); else { blinkTimer = setInterval(() => { blinkState = !blinkState; draw(); }, 600); $('blink').setAttribute('aria-pressed', 'true'); }
  draw();
});
$('save').addEventListener('click', () => {
  const link = document.createElement('a'); link.download = `${active.record.id}-${$('mode').value}-overlay.png`; link.href = $('overlay').toDataURL(); link.click();
});
const requested = manifest.cases.find((record) => record.id === location.hash.slice(1));
if (requested) $('category').value = requested.category;
populate(requested?.id);
