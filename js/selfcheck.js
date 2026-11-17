// ---------------- self-check: open index.html?test and read the console ----------------
if (location.search.includes('test')) {
  let failed = 0; const assertNow = console.assert.bind(console);
  console.assert = (ok, ...info) => { if (!ok) failed++; assertNow(ok, ...info); };   // counted, so the last line can say how many failed
  for (const el of document.querySelectorAll('script[src*="?v="], link[href*="?v="]'))   // the release step must bump these with VERSION
    console.assert((el.src || el.href).endsWith('?v=' + VERSION), 'asset version matches VERSION', el.src || el.href);
  console.assert(HINTS.length === LETTERS.length + 1 && BEARINGS.length === HINTS.length, 'config lengths');
  // a card lying on the ground, seen at 60 degrees by a known camera: the matrix must put a point 200 px above
  // the card's centre where that camera would really see it
  const cf = 800, ccx = 400, ccy = 300, th = Math.PI / 3, see = (x, y, z) => {
    const Y = y * Math.cos(th) - z * Math.sin(th) - 100, Z = y * Math.sin(th) + z * Math.cos(th) + 900;
    return { x: cf * (x - 150) / Z + ccx, y: cf * Y / Z + ccy };
  };
  const mat = new DOMMatrix(poseMatrix([see(0, 0, 0), see(300, 0, 0), see(300, 300, 0), see(0, 300, 0)], cf, ccx, ccy).css);
  [[0, 0, 0], [300, 300, 0], [150, 150, -200]].forEach(([x, y, z]) => {
    const q = mat.transformPoint({ x, y, z }), want = see(x, y, z);
    console.assert(Math.hypot(q.x / q.w - want.x, q.y / q.w - want.y) < 1, 'card point lands where the camera sees it', x, y, z);
  });
  // jitter: a small far card whose corners wobble by up to 3 px. The statue's top must stay almost still.
  {
    const r = $('view').getBoundingClientRect(), f2 = FOCAL * Math.max(r.width, r.height), th2 = -Math.PI / 3, Z0 = f2 * 300 / 80;
    const far = (x, y) => { const Z = (y - 150) * Math.sin(th2) + Z0; return [f2 * (x - 150) / Z + r.width / 2, f2 * (y - 150) * Math.cos(th2) / Z + r.height / 2]; };
    let seed = 11, prev = null, sum = 0;
    const wob = ([x, y]) => ({ x: x + ((seed = seed * 16807 % 2147483647) / 2147483647 - .5) * 6, y: y + ((seed = seed * 16807 % 2147483647) / 2147483647 - .5) * 6 });
    for (let i = 0; i < 180; i++) {
      showTile({ n: 1, loc: { topLeftCorner: wob(far(0, 0)), topRightCorner: wob(far(300, 0)), bottomRightCorner: wob(far(300, 300)), bottomLeftCorner: wob(far(0, 300)) } }, r.width, r.height);
      const q = new DOMMatrix($('tile').style.transform).transformPoint({ x: 150, y: 150, z: -250 }), top = [q.x / q.w, q.y / q.w];
      if (i > 30) sum += Math.hypot(top[0] - prev[0], top[1] - prev[1]);
      prev = top;
    }
    showTile(null);
    console.assert(sum / 149 < 1, 'statue top wobbles under 1 px per frame', sum / 149);
  }
  // config file text: pasting it back must give exactly the typed sentence, hints and directions, whatever they contain
  {
    const typed = ['plain', 'quote " and \\ backslash', 'two\nlines', '🎁 emoji', 'Árvíztűrő tükörfúrógép', "it's", '<\/script>', '', '  spaces  ', '\u2028 line sep'];
    const want = ['en', 'Árvíz "tűrő" \\ <b>!', typed, [null, 12, 359]];
    const back = new Function(configText(...want) + '; return [LANGUAGE, SENTENCE, HINTS, BEARINGS]')();
    console.assert(JSON.stringify(back) === JSON.stringify(want), 'config text round trip', back);
  }
  // both languages have every text, and the page uses the configured one
  console.assert(Object.keys(TEXTS.hu).join() === Object.keys(TEXTS.en).join() && T === TEXTS[LANGUAGE], 'game text complete in both languages');
  console.assert(TEXTS.en.lead(1).startsWith('One letter is') && TEXTS.en.lead(9).startsWith('9 letters are'), 'English count reads right');
  // the sentence: words and cards, the lists that follow its length, and the slot size
  console.assert(JSON.stringify(wordsOf(' Merry  ő! ')) === '[["M","E","R","R","Y"],["Ő","!"]]', 'sentence split into words, upper case');
  console.assert(JSON.stringify(fitList(['a', 'b', 'gift'], 4, '')) === '["a","b","","","gift"]', 'list grows before the gift step');
  console.assert(JSON.stringify(fitList(['a', 'b', 'c', 'gift'], 1, '')) === '["a","gift"]', 'list shrinks, gift step stays last');
  console.assert(esc('<b>&"\'') === '&#60;b&#62;&#38;&#34;&#39;', 'letters are escaped');
  console.assert(Math.abs(slotSize(377, wordsOf('MERRY XMAS')) - 30) < 1e-9, 'short sentence: one row at full size');
  console.assert(slotSize(377, wordsOf('AAAAAAAA BBBBBBBB CCCCCCCC')) === 30, 'long sentence wraps by word at full size');
  console.assert(slotSize(377, wordsOf('A'.repeat(30))) < 12, 'one very long word shrinks to fit');
  // a tile with nothing readable must go: tracking lost -> after 250 ms; tracking fooled by an unchanging picture -> after HIDE_MS
  {
    const real = performance.now.bind(performance); let clock = 5000; performance.now = () => clock;
    const frame = fill => { const c = document.createElement('canvas'); c.width = c.height = 320; const x = c.getContext('2d'); fill(x); return c; };
    const flat = frame(x => { x.fillStyle = '#888'; x.fillRect(0, 0, 320, 320); });
    const noise = () => frame(x => { for (let i = 0; i < 400; i++) { x.fillStyle = `hsl(${Math.random() * 360},50%,${Math.random() * 100}%)`; x.fillRect(Math.random() * 320, Math.random() * 320, 40, 40); } });
    const corners = () => ({ topLeftCorner: { x: 110, y: 110 }, topRightCorner: { x: 210, y: 110 }, bottomRightCorner: { x: 210, y: 210 }, bottomLeftCorner: { x: 110, y: 210 } });
    const keep = lastSeen;
    lastSeen = null; step(flat, 320, 320); step(flat, 320, 320);   // two frames, so tracking has a previous picture to compare with
    lastSeen = { n: 1, loc: corners(), t: clock, live: clock };
    for (clock += 33; clock < 5000 + HIDE_MS - 100; clock += 33) step(flat, 320, 320);
    console.assert(lastSeen, 'unchanging picture: tile still held just before HIDE_MS');
    for (; clock < 5000 + HIDE_MS + 100; clock += 33) step(flat, 320, 320);
    console.assert(!lastSeen, 'unchanging picture: tile let go after HIDE_MS');
    lastSeen = { n: 1, loc: corners(), t: clock, live: clock }; step(noise(), 320, 320);
    clock += 33; step(noise(), 320, 320); console.assert(lastSeen && lastSeen.lost, 'tracking lost on a different picture');
    clock += 300; step(noise(), 320, 320); console.assert(!lastSeen, 'lost tile let go after 250 ms');
    performance.now = real; lastSeen = keep;
  }
  localStorage.setItem(KEEP, '4'); console.assert(savedCount() === 4, 'saved progress read back');
  localStorage.setItem(KEEP, '99'); console.assert(savedCount() === LETTERS.length, 'saved progress capped');
  localStorage.setItem(KEEP, 'x'); console.assert(savedCount() === 0, 'bad saved progress ignored'); localStorage.removeItem(KEEP);
  onCode('hello');  console.assert(found === 0, 'foreign QR ignored');
  onCode('mx3');    console.assert(found === 0, 'future card refused');
  onCode('mx' + (LETTERS.length + 1)); console.assert(found === 0, 'card beyond the last letter ignored');
  onCode('mx1'); onCode('mx1'); console.assert(found === 1, 'repeat ignored');
  for (let i = 2; i <= LETTERS.length; i++) onCode('mx' + i);
  console.assert(found === LETTERS.length && !document.body.classList.contains('done'), 'all found; finale waits for the last letter');
  setTimeout(() => {
    console.assert(document.body.classList.contains('done') && !document.querySelector('.fly') && landing < 0, 'finale reached after landing');
    console.log('self-check finished, found =', found, 'failed =', failed);
  }, 2000);
}
