// The hints as a block to paste over `const HINTS` in js/config.js. JSON.stringify escapes quotes, backslashes, line breaks
// and emoji safely, and keeps accents as they are.
const hintsBlock = texts => 'const HINTS = [\n' + texts.map(t => '  ' + JSON.stringify(t) + ',').join('\n') + '\n];';

// ---------------- setup / print mode: open index.html?setup ----------------
const setup = location.search.includes('setup');
if (setup) {
  document.body.className = 'setup';
  document.documentElement.classList.add('setup');   // the html element is what blocks scrolling on the game page
  for (const id of ['start', 'view', 'slots']) $(id).hidden = true;
  $('setup').hidden = false;
  const rec = [];
  const show = () => $('out').textContent = `const BEARINGS = [${rec.join(', ')}];   // ${rec.length}/10 recorded`;
  $('compassOn').onclick = askCompass;
  $('rec').onclick = () => { if (heading != null && rec.length < 10) rec.push(Math.round(heading)); show(); };
  $('undo').onclick = () => { rec.pop(); show(); };
  show();
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  s.onload = () => $('cards').innerHTML = [...LETTERS].map((_, i) => {
    // Size 2 on purpose: the smallest size (1) has no alignment mark, and without it the reader fails on tilted
    // cards (simulated: size 1 unreadable at 20°, size 2 readable to 55°). 'H' = most damage tolerance.
    const q = qrcode(2, 'H'); q.addData('mx' + (i + 1)); q.make();
    // One PNG per card (at least 1024 px) serves the printed card, the download and full screen.
    // Statue colours: deep red dots on cream inside a gold-and-red frame. The reader needs dark dots on a light
    // ground with a clear light margin of 4 cells, so the dots stay the darkest colour and the frame sits outside it.
    const m = q.getModuleCount(), n = m + 12, cell = Math.ceil(1024 / n), c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = c.height = n * cell;
    [['#5a0715', 0], ['#e3b23c', .35], ['#5a0715', 1.5], ['#fff6d0', 2]].forEach(([colour, inset]) => {
      x.fillStyle = colour; x.fillRect(inset * cell, inset * cell, c.width - 2 * inset * cell, c.height - 2 * inset * cell);
    });
    x.fillStyle = '#5a0715';
    for (let r = 0; r < m; r++) for (let k = 0; k < m; k++) if (q.isDark(r, k)) x.fillRect((k + 6) * cell, (r + 6) * cell, cell, cell);
    const png = c.toDataURL('image/png');
    return `<div><img src="${png}" alt="QR ${i + 1}">${i + 1}<span class="noprint"><br>` +
      `<a class="btn" download="card-${i + 1}.png" href="${png}">Download</a><button class="btn full">Full screen</button></span></div>`;
  }).join('');
  document.body.append(s);
  $('ver').textContent = 'Version ' + VERSION;
  // hint editor: one box per hint, prefilled from the game's own HINTS. Typed text is remembered on this computer, but
  // only while the game's HINTS are unchanged: after a new block is pasted in and deployed, the boxes start from that.
  const base = JSON.stringify(HINTS), KEY = 'hunt.hints';
  let texts = [...HINTS];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.base === base && Array.isArray(saved.texts) && saved.texts.length === HINTS.length) texts = saved.texts.map(String);
  } catch (e) { /* no storage: start from the game's hints */ }
  const label = i => i === 0 ? `Start, leads to card 1 (${LETTERS[0]})` : i < LETTERS.length
    ? `After card ${i} (${LETTERS[i - 1]}), leads to card ${i + 1}` : `After card ${i} (${LETTERS[i - 1]}), leads to the gift`;
  $('hints').innerHTML = texts.map((_, i) => `<div class="hint"><label for="h${i}">${label(i)}</label><textarea id="h${i}" rows="2"></textarea></div>`).join('');
  texts.forEach((t, i) => $('h' + i).value = t);   // set as a value, not as markup, so any text is safe
  const showHints = () => {
    $('hintsOut').textContent = hintsBlock(texts);
    try { localStorage.setItem(KEY, JSON.stringify({ base, texts })); } catch (e) { /* private window: nothing remembered */ }
  };
  $('hints').oninput = e => { texts[+e.target.id.slice(1)] = e.target.value; showHints(); };
  $('copyHints').onclick = () => navigator.clipboard.writeText(hintsBlock(texts)).then(
    () => $('copied').textContent = 'Copied', () => $('copied').textContent = 'Could not copy: select the block and copy it yourself');
  showHints();
  $('cards').onclick = e => {
    if (!e.target.classList.contains('full')) return;
    $('full').firstElementChild.src = e.target.closest('div').querySelector('img').src;
    $('full').hidden = false;
  };
  $('full').onclick = () => $('full').hidden = true;
  addEventListener('keydown', e => { if (e.key === 'Escape') $('full').hidden = true; });
} else render();
