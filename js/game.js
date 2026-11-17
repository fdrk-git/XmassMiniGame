// A browser may show a saved old copy of this page. Ask the server for the current one and, if its version
// differs, reload under a new address (?v=...) that no saved copy exists for.
function selfUpdate() {
  fetch(location.pathname + '?fresh=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).then(t => {
    const v = (/const VERSION = '([\d.]+)'/.exec(t) || [])[1], q = new URLSearchParams(location.search);
    if (v && v !== VERSION && q.get('v') !== v) {   // the q.get check stops a reload loop
      q.set('v', v);
      location.replace(location.pathname + '?' + q);
    }
  }).catch(() => {});   // offline or blocked: keep the copy we have
}
selfUpdate();

const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

// The sentence as words (a word is a list of characters, one hidden card each) and all its cards in order.
const wordsOf = sentence => sentence.toUpperCase().split(/\s+/).filter(Boolean).map(w => [...w]);
const WORDS = wordsOf(SENTENCE), LETTERS = WORDS.flat();

// The row of slots (top of the game, and the preview on the start screen): `chip(i)` makes the markup of card i's slot.
// Each word stays whole, a space lets the row wrap.
const slotRow = chip => { let i = 0; return WORDS.map(w => `<span class="w">${w.map(() => chip(i++)).join('')}</span>`).join(' '); };
const chipEl = i => $('slots').querySelectorAll('b, i')[i];

// Slot size: one row if the chips stay at least 18px, else one word per line, down to whatever fits the longest word.
// A chip with its margins is 1.21em wide, a space about .7em (what the old fixed 11.6 allowed for MERRY XMAS).
function slotSize(room, words) {
  const oneRow = room / (words.flat().length * 1.21 + (words.length - 1) * .7);
  return Math.min(30, oneRow >= 18 ? oneRow : room / (Math.max(...words.map(w => w.length)) * 1.21));
}
function fitSlots() {   // each row by the room its parent gives it: the start screen has padding, the game's row spans the screen
  for (const row of [$('slots'), $('preview')]) {
    const box = row.parentElement, cs = getComputedStyle(box);
    if (box.clientWidth) row.style.setProperty('--sz', slotSize(box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 16, WORDS) + 'px');
  }
}
fitSlots();
addEventListener('resize', fitSlots);

// ---- the game's own text, in the hunt's language (LANGUAGE in config.js; a config without it is Hungarian) ----
const TEXTS = {
  hu: {
    title: 'Karácsonyi kincskeresés', heading: 'Karácsonyi<br>kincskeresés',
    lead: n => `${n} betű rejtőzik a lakásban.<br>Keresd meg őket a kamerával – sorban!`,
    go: 'Kezdjük!', allow: 'Engedélyezd a kamerát és a mozgásérzékelőt.',
    noCamera: 'Nem sikerült elindítani a kamerát. Engedélyezd, majd töltsd újra az oldalt.',
    notYet: 'Még nem! Ez egy későbbi betű 😉', allFound: 'Megvan mind!', holdFlat: 'Az iránytűhöz tartsd vízszintesen a telefont',
  },
  en: {
    title: 'Christmas treasure hunt', heading: 'Christmas<br>treasure hunt',
    lead: n => `${n === 1 ? 'One letter is' : n + ' letters are'} hidden around the house.<br>Find them with the camera – in order!`,
    go: "Let's go!", allow: 'Allow the camera and motion sensors.',
    noCamera: 'The camera could not start. Allow it, then reload the page.',
    notYet: 'Not yet! That is a later letter 😉', allFound: 'All found!', holdFlat: 'Hold the phone flat for the compass',
  },
};
const LANG = typeof LANGUAGE === 'string' && TEXTS[LANGUAGE] ? LANGUAGE : 'hu', T = TEXTS[LANG];
document.documentElement.lang = LANG;
document.title = T.title + ' ✨';
$('title').innerHTML = T.heading;
$('lead').innerHTML = T.lead(LETTERS.length);
$('go').textContent = T.go;
$('allow').textContent = T.allow;

let found = 0, heading = null, lastSeen = null, toastTimer;

function render() {
  $('slots').innerHTML = slotRow(i => i < found ? `<b${i === landing ? ' style="color:transparent;text-shadow:none"' : ''}>${esc(LETTERS[i])}</b>` : '<i>•</i>');
  $('hint').innerHTML = (found === LETTERS.length ? T.allFound + ' ' : '') + (HINTS[found] || '') +
    (BEARINGS[found] != null ? `<small id="tip">${T.holdFlat}</small>` : '');
  document.body.classList.toggle('done', found === LETTERS.length && landing < 0);   // the finale waits for the last letter to land
  turnArrow();
}

function turnArrow() {
  const b = BEARINGS[found];
  const show = b != null && heading != null;
  $('arrow').style.display = show ? '' : 'none';   // an <svg> has no .hidden property
  if (show) $('arrow').style.transform = `rotate(${b - heading}deg)`;
}

// Decorations: falling snow (start screen and finale) and a string of lights across the top of the start screen.
function decorate() {
  for (const box of document.querySelectorAll('.snow')) for (let i = 0; i < (+box.dataset.flakes || 28); i++) {
    const f = document.createElement('i'), size = 3 + Math.random() * 5;
    f.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;opacity:${.35 + Math.random() * .55};` +
      `animation-duration:${6 + Math.random() * 8}s;animation-delay:${-Math.random() * 14}s`;
    box.append(f);
  }
  const swags = 3, sag = 10, bulbs = 12, colours = ['#ff3b4f', '#ffd76a', '#4fd37f'];
  // the wire hangs in three swags; bulbs sit on it: y = 4 + 4 * sag * t * (1 - t) along each swag (t from 0 to 1)
  let wire = '';
  for (let k = 0; k < swags; k++) { const x0 = 100 * k / swags, x1 = 100 * (k + 1) / swags; wire += `${k ? 'L' : 'M'}${x0} 4 Q${(x0 + x1) / 2} ${4 + 2 * sag} ${x1} 4 `; }
  $('start').querySelector('.lights').innerHTML = `<svg viewBox="0 0 100 34" preserveAspectRatio="none"><path d="${wire}" fill="none" stroke="#0a2a1d" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>` +
    Array.from({ length: bulbs }, (_, i) => { const t = ((i + .5) / bulbs * swags) % 1;
      return `<i style="left:${(i + .5) / bulbs * 100}%;top:${4 + 4 * sag * t * (1 - t)}px;color:${colours[i % 3]};animation-delay:${-i * .37}s"></i>`; }).join('');
  $('preview').innerHTML = slotRow(() => '<i>•</i>');
}
decorate();

let landing = -1;   // index of the letter now flying to its place in the top row (hidden there until it lands), or -1

// ---- sparkle effects: made on demand, each removes itself when its animation ends ----
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// One gold spark at (x, y) that drifts by (dx, dy) over `ms` while it fades, shrinks and turns.
function spark(x, y, dx, dy, ms, size = 14) {
  const el = document.createElement('div');
  el.className = 'spark'; el.textContent = '✦'; el.style.fontSize = size + 'px';
  document.body.append(el);
  el.animate([{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(1)`, opacity: 1 },
              { transform: `translate(${x + dx}px, ${y + dy}px) translate(-50%, -50%) scale(.2) rotate(180deg)`, opacity: 0 }],
             { duration: ms, easing: 'ease-out' });
  setTimeout(() => el.remove(), ms + 50);   // a timer, not an animation event: it also fires if the page was in the background
}

// A ring that grows and fades, with sparks flying out of it.
function burst(x, y, sparks = 10, reach = 70) {
  if (calm()) return;
  const ring = document.createElement('div');
  ring.className = 'ring'; ring.style.cssText = `left:${x}px;top:${y}px;width:20px;height:20px;margin:-10px 0 0 -10px`;
  document.body.append(ring);
  ring.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(3.2)', opacity: 0 }], { duration: 600, easing: 'ease-out' });
  setTimeout(() => ring.remove(), 650);
  for (let i = 0; i < sparks; i++) {
    const a = Math.PI * 2 * i / sparks + Math.random() * .5, d = reach * (.6 + Math.random() * .7);
    spark(x, y, Math.cos(a) * d, Math.sin(a) * d, 500 + Math.random() * 300, 16 + Math.random() * 14);
  }
}

// A flat gold letter launches up from the statue (or from mid-screen if no card is in view) in a flash of sparks,
// spins and tilts through the air leaving a sparkle trail, and lands in its slot with a ring, sparks and a pop.
function fly(i) {
  const el = document.createElement('div'), slot = chipEl(i).getBoundingClientRect();
  el.className = 'fly'; el.textContent = LETTERS[i];
  document.body.append(el);
  let x = innerWidth / 2, y = innerHeight / 2, s = 1.5;
  if (!$('tile').hidden) {   // start where the statue's letter is, at its size on screen
    const m = new DOMMatrix($('tile').style.transform);
    const at = z => { const q = m.transformPoint({ x: 150, y: 150, z }); return [q.x / q.w, q.y / q.w]; };
    const foot = at(-40), head = at(-300);
    [x, y] = at(-170);
    s = Math.hypot(head[0] - foot[0], head[1] - foot[1]) / 260 * 360 / 120;
  }
  burst(x, y, 8, 60);
  const pose = (x, y, s, turn, tilt) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s}) rotateY(${turn}deg) rotate(${tilt}deg)`;
  el.animate([
    { transform: pose(x, y, s, 0, 0), easing: 'cubic-bezier(.2, .8, .3, 1)' },                                                          // launch
    { transform: pose(x, Math.max(130, y - innerHeight * .3), s * 1.3, 360, -14), offset: .4, easing: 'cubic-bezier(.6, 0, .4, 1)' },   // hang, leaning
    { transform: pose(slot.left + slot.width / 2, slot.top + slot.height / 2, parseFloat(getComputedStyle($('slots')).fontSize) / 120, 720, 10) },   // land at slot size (slot font / 120px)
  ], { duration: 1500, fill: 'forwards' });
  const trail = calm() ? 0 : setInterval(() => {   // 33 sparks over the flight, each gone after under a second
    const b = el.getBoundingClientRect();
    spark(b.left + b.width * (.25 + Math.random() * .5), b.top + b.height * (.25 + Math.random() * .5),
      (Math.random() - .5) * 40, 30 + Math.random() * 40, 500 + Math.random() * 300, 14 + Math.random() * 18);
  }, 45);
  setTimeout(() => {
    clearInterval(trail); el.remove(); if (landing === i) landing = -1; render();
    const chip = chipEl(i), r = chip.getBoundingClientRect();
    if (!calm()) {   // the slot pops and flashes as the letter lands
      chip.animate([{ transform: 'scale(1)', boxShadow: '0 0 0 rgba(255, 215, 106, 0)' },
                    { transform: 'scale(1.45) rotate(-6deg)', boxShadow: '0 0 1.1em #ffd76a', offset: .35 },
                    { transform: 'scale(1)', boxShadow: '0 0 0 rgba(255, 215, 106, 0)' }], { duration: 500, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
      burst(r.left + r.width / 2, r.top + r.height / 2);
    }
    chime([NOTES[i]], 0);
    if (found === LETTERS.length && landing < 0) celebrate();
  }, 1500);
}

// All nine found: the letters jump one after another in a wave, each with a small burst, and gold sparks rain down.
function celebrate() {
  chime(NOTES, .09);
  if (calm()) return;
  $('slots').querySelectorAll('b, i').forEach((chip, i) => {
    chip.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-.9em) scale(1.25) rotate(-8deg)', offset: .4 }, { transform: 'translateY(0) scale(1)' }],
      { duration: 700, delay: i * 80, easing: 'cubic-bezier(.3, 1.5, .5, 1)' });
    const r = chip.getBoundingClientRect();
    setTimeout(burst, i * 80 + 250, r.left + r.width / 2, r.top + r.height / 2, 6, 50);
  });
  for (let i = 0; i < 28; i++)
    setTimeout(spark, 300 + i * 70, Math.random() * innerWidth, -10, (Math.random() - .5) * 80, innerHeight * (.4 + Math.random() * .5), 1800 + Math.random() * 1200, 14 + Math.random() * 18);
}

function toast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('on'), 2000);
}

// ---- sound: soft chimes made with the browser's audio API (no files). iOS allows sound only after a tap, so Start makes the context ----
let audio;
const NOTES = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];   // C major pentatonic, one note per letter
function chime(freqs, gap = .12) {
  if (!audio) return;
  freqs.forEach((f, k) => {
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + k * gap;
    o.frequency.value = f; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + .7);
    o.start(t); o.stop(t + .75);
  });
}

// ---- progress survives a reload (a refresh or a phone that dropped the tab); open the game with ?reset to start over ----
const KEEP = 'hunt.found', testing = location.search.includes('test');
const savedCount = () => { try { return Math.min(LETTERS.length, +localStorage.getItem(KEEP) || 0); } catch (e) { return 0; } };
try { if (location.search.includes('reset')) localStorage.removeItem(KEEP); } catch (e) { /* nothing to reset */ }

// Returns the card number for one of our QR texts, else 0. Advances the game when it is the next card.
function onCode(text) {
  let n = +(/^mx([1-9]\d?)$/.exec(text) || [])[1] || 0;
  if (n > LETTERS.length) n = 0;   // a card of some other hunt
  if (n === found + 1) {
    found++;
    if (!testing) try { localStorage.setItem(KEEP, found); } catch (e) { /* private window: nothing remembered */ }
    navigator.vibrate?.(200);
    landing = n - 1;
    render();
    setTimeout(fly, 0, n - 1);   // after this frame's work, so the tile is already placed on the card just found
  } else if (n > found + 1) toast(T.notYet);
  return n;   // already-found cards: nothing happens
}

const small = document.createElement('canvas'), sctx = small.getContext('2d', { willReadFrequently: true });

// Decodes one region of `src`, shrunk so its long side is at most `maxSide` px (jsQR time grows with pixel count).
// Returned corner positions are mapped back to `src` coordinates.
function decode(src, sx, sy, sw, sh, maxSide) {
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  small.width = Math.max(1, sw * k | 0); small.height = Math.max(1, sh * k | 0);
  sctx.drawImage(src, sx, sy, sw, sh, 0, 0, small.width, small.height);
  const qr = jsQR(sctx.getImageData(0, 0, small.width, small.height).data, small.width, small.height, { inversionAttempts: 'dontInvert' });
  if (qr) for (const p of Object.values(qr.location)) if (p) { p.x = sx + p.x / k; p.y = sy + p.y / k; }
  return qr;
}

// --- motion tracking: decoding fails on blurred frames, so between decodes the tile follows the picture itself ---
const TRACK = 320;   // long side of the small gray frame used for tracking
const tcv = document.createElement('canvas'), tctx = tcv.getContext('2d', { willReadFrequently: true });
let gray = null, prevGray = null, tk = 1;

function grabGray(src, W, H) {
  tk = TRACK / Math.max(W, H);
  const w = W * tk | 0, h = H * tk | 0;
  if (tcv.width !== w || tcv.height !== h) { tcv.width = w; tcv.height = h; gray = null; }
  tctx.drawImage(src, 0, 0, W, H, 0, 0, w, h);
  const d = tctx.getImageData(0, 0, w, h).data, a = new Uint8Array(w * h), g = new Uint8Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 1];   // green is close enough to brightness
  // soften (5-pixel cross) so a sharp frame and a motion-blurred frame of the same card still look alike
  for (let i = 2 * w; i < a.length - 2 * w; i++) g[i] = (a[i] * 2 + a[i - 1] + a[i + 1] + a[i - 2] + a[i + 2] + a[i - w] + a[i + w] + a[i - 2 * w] + a[i + 2 * w]) / 10;
  prevGray = gray; gray = g;
}

// Finds where the patch of picture under the tile moved to since the previous frame and shifts the tile with it.
// Returns that shift in picture px, or false when the patch can't be found (card gone or covered) or is too close
// to the frame edge.
function follow(loc) {
  if (!prevGray) return false;
  const w = tcv.width, h = tcv.height, R = 10;   // R: furthest shift searched per frame, in tracking pixels (40 px of the camera picture; a shaking hand moves a card a fraction of that per frame)
  const p = Object.values(loc).filter(Boolean), xs = p.map(q => q.x), ys = p.map(q => q.y);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2 * tk | 0, cy = (Math.max(...ys) + Math.min(...ys)) / 2 * tk | 0;
  // The patch reaches past the code into the card's white border: its edges survive blur far better than the code's dots.
  // Near the edge of the picture it shrinks to the room that is left (the search must stay inside the picture); only a
  // patch too small to tell anything apart means the card is practically out of view.
  const want = (Math.max(...xs) - Math.min(...xs)) * tk * .8 | 0;
  const half = Math.min(48, Math.max(6, want), Math.min(cx, cy, w - 1 - cx, h - 1 - cy) - R - 1);
  if (half < 6) return false;
  const diff = (dx, dy, limit) => {
    let s = 0;
    for (let y = -half; y <= half && s < limit; y += 2)
      for (let x = -half; x <= half; x += 2)
        s += Math.abs(prevGray[(cy + y) * w + cx + x] - gray[(cy + y + dy) * w + cx + x + dx]);
    return s;
  };
  let best = diff(0, 0, Infinity), bx = 0, by = 0;   // staying put wins ties
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const s = diff(dx, dy, best);
    if (s < best) { best = s; bx = dx; by = dy; }
  }
  const samples = (Math.floor(half) + 1) ** 2;   // patch is sampled every 2nd pixel each way
  // Average brightness mismatch (0-255). Simulated frames: same card sharp-to-blurred scores up to ~29,
  // card gone scores ~60. Not yet tuned on a real camera.
  if (best / samples > 40) return false;
  // Refine to a fraction of a tracking pixel: the small extra shift that best explains the remaining brightness
  // differences, judged by how brightness slopes across the patch (one Lucas-Kanade step). Identical frames give 0.
  let xx = 0, xy = 0, yy = 0, xt = 0, yt = 0;
  for (let y = -half; y <= half; y += 2) for (let x = -half; x <= half; x += 2) {
    const i = (cy + y + by) * w + cx + x + bx, j = (cy + y) * w + cx + x, dt = prevGray[j] - gray[i];
    const gx = (gray[i + 1] - gray[i - 1] + prevGray[j + 1] - prevGray[j - 1]) / 4;   // slopes averaged over both frames
    const gy = (gray[i + w] - gray[i - w] + prevGray[j + w] - prevGray[j - w]) / 4;
    xx += gx * gx; xy += gx * gy; yy += gy * gy; xt += gx * dt; yt += gy * dt;
  }
  // Only trusted when the two frames look alike (mismatch under 12 of 255): if one is sharp and the other blurred,
  // the differences come from the blur, not from movement, and the whole-pixel shift is used as it is.
  const det = xx * yy - xy * xy, lim = v => det && best / samples < 12 ? Math.max(-1, Math.min(1, v / det)) : 0;
  const shift = { x: (bx + lim(yy * xt - xy * yt)) / tk, y: (by + lim(xx * yt - xy * xt)) / tk };
  for (const q of p) { q.x += shift.x; q.y += shift.y; }
  shift.mismatch = best / samples;   // how well the patch matched (0 = identical), to tell a real card from background
  return shift;   // how far the card moved in the picture since the previous frame
}

let frameNo = 0;

function findCode(src, W, H, wholeFrame) {
  let qr = null;
  if (lastSeen) {
    // a card was just here: look closely around its last position first (small area, so sharp and fast)
    const p = Object.values(lastSeen.loc).filter(Boolean), xs = p.map(q => q.x), ys = p.map(q => q.y);
    const r = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.5;
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const x0 = Math.max(0, cx - r), y0 = Math.max(0, cy - r);
    qr = decode(src, x0, y0, Math.min(W, cx + r) - x0, Math.min(H, cy + r) - y0, 480);
  }
  // shortcut: whole frame is searched at 800px, so far-away cards need her to step closer; raise if range is too short
  return qr || (wholeFrame ? decode(src, 0, 0, W, H, 800) : null);
}

// Processes one camera frame; returns the tile to draw ({n, loc}) or null.
// How long a tile may stay without a successful read of its code. When tracking loses the card, the tile is let go after
// 250 ms (below). But once the card has left, tracking can simply follow the background instead (measured: it matches
// the background as well as it matches a real card, so match quality cannot tell them apart), and then only failed reads
// show that the card is gone. Simulated hand-held camera, card staying in view: longest gap between reads 0.23 s with
// moderate shake and 0.97 s with strong shake and heavy motion blur (30 fps, 10% of frames readable); at 20 fps with
// strong shake 1.45 s, which this value will drop. When the card has really left and tracking follows the background,
// the tile lingers up to this long. Not yet tuned on a real phone.
const HIDE_MS = 1200;

function step(src, W, H) {
  const now = performance.now();
  grabGray(src, W, H);
  // move the held tile with the picture first, so the close-up search below looks in the right place.
  // Once the patch is lost it is not picked up again (it would lock onto the background); only a read revives it.
  const followed = lastSeen && !lastSeen.lost && follow(lastSeen.loc);
  // while the tile is following, the close-up search is enough; the slower whole-frame search runs every 4th frame
  const qr = findCode(src, W, H, !followed || ++frameNo % 4 === 0);
  const n = qr && onCode(qr.data);
  if (n) lastSeen = { n, loc: qr.location, t: now, live: now };
  else if (lastSeen) {
    if (followed) lastSeen.live = now; else lastSeen.lost = true;
    // let go: tracking failed for a moment (card gone or covered), or no read for too long
    if (now - lastSeen.t > HIDE_MS || (lastSeen.lost && now - lastSeen.live > 250)) lastSeen = null;
  }
  if (lastSeen) lastSeen.shift = followed || null;   // this frame's measured movement, for showTile()
  return lastSeen;
}

// ---- ?debug: live steadiness numbers on screen, for tuning on a real phone ----
const DEBUG = location.search.includes('debug');
let dbg = { since: 0, frames: 0, reads: 0, n: 0, slip: 0, lean: 0, turn: 0, last: null };

function debugFrame(tile) {   // once per camera frame, after showTile()
  const now = performance.now(), deg = 180 / Math.PI;
  dbg.frames++;
  let cur = null;
  if (tile && shown) {
    if (tile.t === tile.live && tile.t !== dbg.readAt) { dbg.reads++; dbg.readAt = tile.t; }
    cur = { n: tile.n, x: shown.p.reduce((a, q) => a + q.x, 0) / 4, y: shown.p.reduce((a, q) => a + q.y, 0) / 4, down: shown.down, yaw: shown.yaw,
            size: Math.hypot(shown.p[1].x - shown.p[0].x, shown.p[1].y - shown.p[0].y) };
    if (dbg.last && dbg.last.n === cur.n) {
      const s = tile.shift || { x: 0, y: 0 };
      dbg.slip += Math.hypot(cur.x - dbg.last.x - s.x, cur.y - dbg.last.y - s.y);   // tile movement the picture's own movement doesn't explain
      dbg.lean += Math.acos(Math.min(1, cur.down.reduce((a, v, i) => a + v * dbg.last.down[i], 0))) * deg;
      dbg.turn += Math.abs(Math.atan2(Math.sin(cur.yaw - dbg.last.yaw), Math.cos(cur.yaw - dbg.last.yaw))) * deg;
      dbg.n++;
    }
  }
  dbg.last = cur;
  if (now - dbg.since < 1000) return;
  const per = v => dbg.n ? (v / dbg.n).toFixed(2) : '–';
  $('dbg').hidden = false;
  $('dbg').textContent = `v${VERSION}  ${Math.round(dbg.frames * 1000 / (now - dbg.since))} fps  read ${Math.round(100 * dbg.reads / dbg.frames)}%` +
    `  card ${cur ? Math.round(cur.size) : '–'}px\nper frame: slip ${per(dbg.slip)}px  lean ${per(dbg.lean)}°  turn ${per(dbg.turn)}°`;
  dbg = { since: now, frames: 0, reads: 0, n: 0, slip: 0, lean: 0, turn: 0, last: cur, readAt: dbg.readAt };
}

function scan() {
  const v = $('video'), c = $('view'), ctx = c.getContext('2d');
  if (v.videoWidth) {
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
    ctx.drawImage(v, 0, 0);
    const tile = step(v, c.width, c.height);
    showTile(tile, c.width, c.height);
    if (DEBUG) debugFrame(tile);
  }
  requestAnimationFrame(scan);
}

// shortcut: the camera's focal length is assumed (0.8 x the picture's long side, about right for an iPhone main
// camera). It only affects how upright the statue stands; if statues lean, tune this number.
const FOCAL = .8;

// How fast a smoothed direction moves toward its newly measured value, given how far apart they are (radians).
// Differences inside `band` (what measurement noise alone produces) are followed very slowly, so the statue stands
// still; larger ones are real movement and are followed quickly.
const ease = (err, band) => Math.min(1, Math.max(.02, (err - band) / .3));

// Builds the CSS matrix that places the 300x300 px #tile box, and everything standing on it, onto the card.
// p: the code's four corners on screen (top-left, top-right, bottom-right, bottom-left).
// f: focal length in screen px; (cx, cy): centre of the camera picture on screen.
// prevDown: the previous frame's `down` (see below), or nothing for an unsmoothed answer.
// The card is treated as a rigid square in space: its centre, size and turn come from well-measured screen
// positions, its tilt from `down`. Also returns `yaw`: the turn (radians) that makes a statue face the camera.
function poseMatrix([p0, p1, p2, p3], f, cx, cy, prevDown) {
  // exact perspective mapping of the unit square onto the four corners: at(u, v) with u, v from 0 to 1
  const dx1 = p1.x - p2.x, dy1 = p1.y - p2.y, dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
  const sx = p0.x - p1.x + p2.x - p3.x, sy = p0.y - p1.y + p2.y - p3.y, det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
  const X = [p1.x - p0.x + g * p1.x, p1.y - p0.y + g * p1.y, g], Y = [p3.x - p0.x + h * p3.x, p3.y - p0.y + h * p3.y, h];
  const at = (u, v) => { const w = g * u + h * v + 1; return [(X[0] * u + Y[0] * v + p0.x) / w, (X[1] * u + Y[1] * v + p0.y) / w]; };
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2], unit = u => u.map(v => v / Math.hypot(...u));
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  // `down`: straight into the card (statues stand the opposite way), from the square's edge directions as the
  // camera sees them. It rests on the faint perspective terms g and h, so a fraction of a pixel of corner noise
  // swings it by degrees, more so the smaller the card looks. That swing is what made statues jitter, so `down`
  // is eased toward each new measurement, and g and h are used for nothing else that stands up.
  const cam = c => [(c[0] - cx * c[2]) / f, (c[1] - cy * c[2]) / f, c[2]];
  let down = unit(cross(cam(X), cam(Y)));
  const mid = at(.5, .5), mx = [0, 1].map(i => at(1, .5)[i] - at(0, .5)[i]), my = [0, 1].map(i => at(.5, 1)[i] - at(.5, 0)[i]);
  // How far noise alone swings `down` (radians): grows with focal length over card size squared. The factor 2 was
  // measured with simulated corners wobbling by up to 3 px (95% of swings fall inside); not yet tuned on a real camera.
  const noise = 2 * f / (mx[0] * mx[0] + mx[1] * mx[1]);
  if (prevDown) {
    const k = ease(Math.acos(Math.min(1, dot(down, prevDown))), noise);
    down = unit(prevDown.map((v, i) => v + (down[i] - v) * k));
  }
  // the card's centre lies along this line of sight, at depth 1
  const ray = [(mid[0] - cx) / f, (mid[1] - cy) / f, 1];
  // the direction in the card's plane that shows on screen as the offset m (length: what m spans at the centre)
  const inPlane = m => { const z = -(m[0] * down[0] + m[1] * down[1]) / f / dot(ray, down); return [m[0] / f + ray[0] * z, m[1] / f + ray[1] * z, z]; };
  const u = inPlane(mx), ax = unit(u), ay = cross(down, ax);
  let len = (Math.hypot(...u) + Math.hypot(...inPlane(my))) / 600;   // card px in camera units
  const seen = (x, y) => { const q = ray.map((v, i) => v + len * ((x - 150) * ax[i] + (y - 150) * ay[i])); return [f * q[0] / q[2], f * q[1] / q[2]]; };
  for (let i = 0; i < 2; i++) {   // correct the size for perspective: make the card's two mid-lines as long as measured
    const lx = Math.hypot(seen(300, 150)[0] - seen(0, 150)[0], seen(300, 150)[1] - seen(0, 150)[1]);
    const ly = Math.hypot(seen(150, 300)[0] - seen(150, 0)[0], seen(150, 300)[1] - seen(150, 0)[1]);
    len *= (Math.hypot(...mx) + Math.hypot(...my)) / (lx + ly);
  }
  const col = v => [f * v[0] + cx * v[2], f * v[1] + cy * v[2], v[2]];   // camera space -> screen, as a matrix column
  const C = [ax, ay, down].map(v => col(v.map(w => w * len))), T = col(ray.map((v, i) => v - 150 * len * (ax[i] + ay[i])));
  const camX = -dot(ray, ax) / len, camY = -dot(ray, ay) / len;   // the camera over the card, in card px from its centre
  return {
    css: `matrix3d(${C.map(c => `${c[0]},${c[1]},0,${c[2]}`).join(', ')}, ${T[0]},${T[1]},1,${T[2]})`,
    yaw: Math.atan2(-camX, camY), overhead: Math.hypot(camX, camY) < 100, down, noise,
  };
}

let leaving = null;   // timer while the tile scales away
let shown = null;   // the tile as drawn: corners, upright direction and statue turn, each smoothed over time

// Places the #tile element over the card (or hides it). W, H: size of the camera picture the corners refer to.
// Per frame this only sets two transforms; everything else on the tile is static or animated by CSS.
function showTile(tile, W, H) {
  const el = $('tile'), turn = el.querySelector('.turn'), stand = turn.lastElementChild;
  if (!tile) {
    if (el.hidden || leaving) return;
    shown = null;
    el.classList.add('leave');   // scales away over 200 ms, then hides
    leaving = setTimeout(() => { el.hidden = true; el.classList.remove('leave'); leaving = null; }, 200);
    return;
  }
  if (leaving) { clearTimeout(leaving); leaving = null; el.classList.remove('leave'); }   // came back before it had gone: just stay
  else if (el.hidden) stand.dataset.t = '-';   // came back after it had gone: play the entrance again
  const target = [tile.loc.topLeftCorner, tile.loc.topRightCorner, tile.loc.bottomRightCorner, tile.loc.bottomLeftCorner];
  if (!shown || shown.n !== tile.n) shown = { n: tile.n, p: target.map(q => ({ x: q.x, y: q.y })), yaw: null, down: null };
  else {
    // First move the drawn corners by how far the picture itself moved under the card this frame. A hand-held
    // phone shakes by a few px per frame; without this step the smoothing below lags behind that real movement
    // and the tile visibly slips against the card.
    if (tile.shift) shown.p.forEach(q => { q.x += tile.shift.x; q.y += tile.shift.y; });
    // What is left is the reader's wobble. Small differences are blended in slowly (steady tile), big ones quickly.
    const size = Math.hypot(target[1].x - target[0].x, target[1].y - target[0].y);
    const move = Math.max(...target.map((q, i) => Math.hypot(q.x - shown.p[i].x, q.y - shown.p[i].y)));
    const k = Math.min(1, Math.max(.15, move / size * 4));
    shown.p.forEach((q, i) => { q.x += (target[i].x - q.x) * k; q.y += (target[i].y - q.y) * k; });
  }
  // camera picture -> screen: the canvas is shown with object-fit: cover
  const r = $('view').getBoundingClientRect(), s = Math.max(r.width / W, r.height / H);
  const ox = r.left + (r.width - W * s) / 2, oy = r.top + (r.height - H * s) / 2;
  const pose = poseMatrix(shown.p.map(q => ({ x: q.x * s + ox, y: q.y * s + oy })),
    FOCAL * Math.max(W, H) * s, r.left + r.width / 2, r.top + r.height / 2, shown.down);
  shown.down = pose.down;
  el.style.transform = pose.css;
  // Turn the statue to face the camera. Seen from straight above the direction is meaningless, so keep the last one.
  if (shown.yaw == null) shown.yaw = pose.yaw;
  else if (!pose.overhead) {
    const d = Math.atan2(Math.sin(pose.yaw - shown.yaw), Math.cos(pose.yaw - shown.yaw));
    shown.yaw += d * ease(Math.abs(d), 2 * pose.noise);
  }
  turn.style.transform = `translate(150px, 150px) translateZ(-40px) rotateZ(${shown.yaw}rad)`;   // -40: on top of the plinth
  const text = tile.n <= found ? LETTERS[tile.n - 1] : '';
  if (stand.dataset.t !== text) {
    stand.dataset.t = text;
    stand.innerHTML = '<div class="rise">' + (text ? letterStatue(text) : GIFT) + SPARKS + '</div>';
  }
  el.hidden = false;
}

// ---- what stands on the card. In the statue's own space: x = sideways, -y = up, -z = toward the camera. ----

// A letter: 10 copies stacked 4 px apart form the dark side, then a pale copy nudged up-left (the lit bevel edge),
// then the polished face on top.
const letterStatue = char => { const c = esc(char); return Array.from({ length: 10 }, (_, i) =>
  `<span style="transform:translateX(-50%) translateZ(${-i * 4}px);color:hsl(40,82%,${19 + i * 2.2}%)">${c}</span>`).join('') +
  `<span class="edge">${c}</span><span class="front">${c}</span>`; };

// A wrapped present: four walls, a lid, and a bow.
const GIFT = '<div class="box" style="transform:translateZ(95px)"></div>' +
  '<div class="box" style="transform:rotateY(90deg) translateZ(95px)"></div><div class="box" style="transform:rotateY(90deg) translateZ(-95px)"></div>' +
  '<div class="box" style="transform:translateZ(-95px)"></div><div class="box lid"></div>' +
  '<u style="left:-88px;transform:rotate(-24deg)"></u><u style="left:4px;transform:rotate(24deg)"></u><u class="knot"></u>';

const SPARKS = '<b style="left:-170px;bottom:250px">✦</b><b style="left:120px;bottom:300px;animation-delay:.9s">✦</b>' +
  '<b style="left:150px;bottom:90px;animation-delay:1.7s">✦</b>';

// The plinth, built once: flat discs stacked upward read as a stepped cylinder from any angle (3 wide ones for the
// lower step, 7 for the upper; two are gold bands), with a decorated top face.
$('tile').querySelector('.plinth').innerHTML = Array.from({ length: 10 }, (_, i) => {
  const d = i < 3 ? 480 : 440;
  return `<i style="width:${d}px;height:${d}px;margin:${-d / 2}px;transform:translateZ(${-i * 4}px);` +
    `background:${i === 2 || i === 9 ? '#e3b23c' : `hsl(350,72%,${13 + i * 1.6}%)`}"></i>`;
}).join('') + `<svg viewBox="-220 -220 440 440">
  <defs><radialGradient id="felt" cy="40%"><stop offset="0" stop-color="#b8213c"/><stop offset="1" stop-color="#560613"/></radialGradient>
    <path id="leaf" d="M0 0Q9 -15 20 -9Q24 -3 34 -6Q30 3 38 8Q26 10 24 18Q14 12 6 16Q8 8 0 0Z" fill="#1d6b3c" stroke="#0e3f22" stroke-width="1.5"/></defs>
  <circle r="218" fill="#ffd76a"/><circle r="208" fill="url(#felt)"/>
  <circle r="196" fill="none" stroke="#3d040d" stroke-width="3"/><circle r="192" fill="none" stroke="#e3b23c" stroke-width="2"/>
  <circle r="150" fill="none" stroke="#e3b23c" stroke-width="5"/><circle r="144" fill="none" stroke="#3d040d" stroke-width="2"/>
  ${Array.from({ length: 18 }, (_, i) => i % 6 === 0
    ? `<g transform="rotate(${i * 20}) translate(0 -171)"><use href="#leaf" transform="rotate(200)"/><use href="#leaf" transform="rotate(-20)"/>` +
      `<circle r="6" fill="#e0182d"/><circle cx="-9" cy="6" r="5" fill="#c20f24"/><circle cx="7" cy="8" r="5" fill="#c20f24"/><circle cx="-2" cy="-2" r="1.6" fill="#fff"/></g>`
    : `<text transform="rotate(${i * 20}) translate(0 -165)" text-anchor="middle" font-size="17" fill="#ffd76a">★</text>`).join('')}
</svg>`;

function askCompass() {
  // iOS: must be called directly inside the tap, before any await
  const p = window.DeviceOrientationEvent?.requestPermission?.().catch(() => {});
  addEventListener('deviceorientation', e => {
    if (e.webkitCompassHeading == null) return;   // iOS-only value; elsewhere the arrow stays hidden
    heading = e.webkitCompassHeading;
    setup ? $('heading').textContent = Math.round(heading) + '°' : turnArrow();
  });
  return p;
}

$('go').onclick = async () => {
  const motion = askCompass();
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { audio = null; }   // no sound is fine
  try {
    $('video').srcObject = await navigator.mediaDevices.getUserMedia(
      { video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
    await $('video').play();
  } catch (e) {
    $('err').textContent = T.noCamera;
    return;
  }
  await motion;
  found = savedCount(); render();
  $('start').hidden = true;
  $('panel').hidden = false;
  scan();
};

// Rescue for a card that will not scan: hold a finger on the letter row for 2 seconds to count the next card as found.
let rescue;
$('slots').addEventListener('pointerdown', () => { rescue = setTimeout(() => found < LETTERS.length && onCode('mx' + (found + 1)), 2000); });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('slots').addEventListener(ev, () => clearTimeout(rescue));
