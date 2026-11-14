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
  // hints block: pasting it back must give exactly the typed text, whatever it contains
  {
    const typed = ['plain', 'quote " and \\ backslash', 'two\nlines', '🎁 emoji', 'Árvíztűrő tükörfúrógép', "it's", '<\/script>', '', '  spaces  ', '\u2028 line sep'];
    const back = new Function(hintsBlock(typed) + '; return HINTS')();
    console.assert(JSON.stringify(back) === JSON.stringify(typed), 'hints block round trip', back);
  }
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
  localStorage.setItem(KEEP, '99'); console.assert(savedCount() === 9, 'saved progress capped');
  localStorage.setItem(KEEP, 'x'); console.assert(savedCount() === 0, 'bad saved progress ignored'); localStorage.removeItem(KEEP);
  onCode('hello');  console.assert(found === 0, 'foreign QR ignored');
  onCode('mx3');    console.assert(found === 0, 'future card refused');
  onCode('mx1'); onCode('mx1'); console.assert(found === 1, 'repeat ignored');
  for (let i = 2; i <= 9; i++) onCode('mx' + i);
  console.assert(found === 9 && !document.body.classList.contains('done'), 'all found; finale waits for the last letter');
  setTimeout(() => {
    console.assert(document.body.classList.contains('done') && !document.querySelector('.fly') && landing < 0, 'finale reached after landing');
    console.log('self-check finished, found =', found, 'failed =', failed);
  }, 2000);
}
