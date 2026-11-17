// All of js/config.js as text, ready to paste over the file. JSON.stringify escapes quotes, backslashes, line breaks and emoji
// safely, and keeps accents as they are.
const configText = (language, sentence, hints, bearings) => `// ====================== CONFIG — made by the ?setup page, or edit by hand ======================
const LANGUAGE = ${JSON.stringify(language)};           // game text: 'hu' (Magyar) or 'en' (English)
const SENTENCE = ${JSON.stringify(sentence)};   // spaces split words; every other character is one hidden card (QR texts mx1, mx2, ...)
// HINTS[0] is shown at the start (leads to card 1), HINTS[n] after card n is found, the last one leads to the gift.
const HINTS = [
${hints.map(t => '  ' + JSON.stringify(t) + ',').join('\n')}
];
// Compass direction (degrees) for each hint, recorded with ?setup. null = no arrow for that step.
const BEARINGS = ${JSON.stringify(bearings)};
// =================================================================
`;

// A list with one entry per step (cards + 1): cut or padded with `fill` after the cards, the last entry (the gift step) kept last.
const fitList = (list, cards, fill) => {
  const body = list.slice(0, -1).slice(0, cards);
  while (body.length < cards) body.push(fill);
  return [...body, list.length ? list[list.length - 1] : fill];
};

// ---------------- setup / print mode: open index.html?setup ----------------
const setup = location.search.includes('setup');
const MAX_CARDS = 30;
if (setup) {
  document.body.className = 'setup';
  document.documentElement.classList.add('setup');   // the html element is what blocks scrolling on the game page
  for (const id of ['start', 'view', 'slots']) $(id).hidden = true;
  $('setup').hidden = false;
  $('ver').textContent = 'Version ' + VERSION;

  // The hunt being edited. Typed text is remembered on this computer, but only while the game's own config is unchanged:
  // after a new config.js is pasted in and deployed, the page starts from that.
  const base = JSON.stringify([LANG, SENTENCE, HINTS]), KEY = 'hunt.hints';
  let language = LANG, sentence = SENTENCE, texts = [...HINTS], step = 0;   // step: the next compass direction to record
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)), n = saved && typeof saved.sentence === 'string' ? wordsOf(saved.sentence).flat().length : 0;
    if (saved && saved.base === base && Array.isArray(saved.texts) && n > 0 && n <= MAX_CARDS) {
      sentence = saved.sentence; texts = saved.texts.map(String);
      if (TEXTS[saved.language]) language = saved.language;
    }
  } catch (e) { /* no storage: start from the game's config */ }
  const letters = () => wordsOf(sentence).flat();
  texts = fitList(texts, letters().length, '');
  let bearings = fitList([...BEARINGS], letters().length, null);
  const config = () => configText(language, sentence.trim().replace(/\s+/g, ' '), texts, bearings);

  // everything that follows from the settings
  const show = () => {
    const l = letters(), n = l.length;
    $('count').textContent = n + (n === 1 ? ' card' : ' cards');
    $('order').textContent = `Print this page (the instructions above are left out). The small number is the order: 1 = ${l[0]}` + (n > 1 ? ` … ${n} = ${l[n - 1]}.` : '.');
    $('out').textContent = `Directions: ${bearings.map(b => b ?? '–').join(' ')}\nNext to record: step ${Math.min(step + 1, n + 1)} of ${n + 1}`;
    $('configOut').textContent = config();
    try { localStorage.setItem(KEY, JSON.stringify({ base, language, sentence, texts })); } catch (e) { /* private window: nothing remembered */ }
  };
  const label = i => { const l = letters(), ch = k => esc(l[k - 1]);
    return i === 0 ? `Start, leads to card 1 (${ch(1)})` : i < l.length
      ? `After card ${i} (${ch(i)}), leads to card ${i + 1}` : `After card ${i} (${ch(i)}), leads to the gift`; };
  const drawHints = () => {
    $('hints').innerHTML = texts.map((_, i) => `<div class="hint"><label for="h${i}">${label(i)}</label><textarea id="h${i}" rows="2"></textarea></div>`).join('');
    texts.forEach((t, i) => $('h' + i).value = t);   // set as a value, not as markup, so any text is safe
  };

  $('language').value = language;
  $('language').onchange = e => { language = e.target.value; show(); };
  $('sentence').value = sentence;
  $('sentence').oninput = e => {
    const n = wordsOf(e.target.value).flat().length;
    if (!n || n > MAX_CARDS) { $('count').textContent = n ? `${n} cards is too many: the most is ${MAX_CARDS}.` : 'Type at least one character.'; return; }
    sentence = e.target.value;
    texts = fitList(texts, n, ''); bearings = fitList(bearings, n, null); step = Math.min(step, n + 1);
    drawHints(); drawCards(); show();
  };
  $('hints').oninput = e => { texts[+e.target.id.slice(1)] = e.target.value; show(); };
  $('copyConfig').onclick = () => navigator.clipboard.writeText(config()).then(
    () => $('copied').textContent = 'Copied', () => $('copied').textContent = 'Could not copy: select the text and copy it yourself');

  $('compassOn').onclick = askCompass;
  $('rec').onclick = () => { if (heading != null && step < bearings.length) bearings[step++] = Math.round(heading); show(); };
  $('undo').onclick = () => { if (step) bearings[--step] = null; show(); };

  // One card per character. Each PNG is made once (at least 1024 px) and serves the printed card, the download and full screen.
  const cardHtml = [];
  const makeCard = i => {
    // Size 2 on purpose: the smallest size (1) has no alignment mark, and without it the reader fails on tilted
    // cards (simulated: size 1 unreadable at 20°, size 2 readable to 55°). 'H' = most damage tolerance.
    const q = qrcode(2, 'H'); q.addData('mx' + (i + 1)); q.make();
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
  };
  const drawCards = () => {
    if (!window.qrcode) return;   // the generator is still loading; its onload draws them
    $('cards').innerHTML = letters().map((_, i) => cardHtml[i] ??= makeCard(i)).join('');
  };
  const lib = document.createElement('script');
  lib.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  lib.onload = drawCards;
  document.body.append(lib);

  drawHints(); show();
  $('cards').onclick = e => {
    if (!e.target.classList.contains('full')) return;
    $('full').firstElementChild.src = e.target.closest('div').querySelector('img').src;
    $('full').hidden = false;
  };
  $('full').onclick = () => $('full').hidden = true;
  addEventListener('keydown', e => { if (e.key === 'Escape') $('full').hidden = true; });
} else render();
