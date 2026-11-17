# Xmas Mini Game 🎄

A one-time letter hunt that runs in the phone browser. One QR card per character of a sentence is hidden around the house (the default sentence is **MERRY XMAS**, nine cards); the player finds them in order with the camera, each one reveals a letter, and the last hint leads to the gift. The sentence, hints and cards are all made on the setup page, so anyone can set up their own hunt.

## How it plays

- Tap **Kezdjük!** and allow camera and motion access.
- Point the camera at a card. The QR code is covered on screen by a round red-and-gold plinth lying flat on the card. A gift stands on it until the card is found, then a gold 3D letter that turns to face the camera. Cards can lie on the floor or a table. The statue is only there while a code is on screen: when the card leaves the picture it shrinks away, and it rises again when the card is back.
- When a card is found, its letter launches up from the statue in a flash of sparks, spins to its place in the row at the top leaving a sparkle trail, and lands with a pop. Snow falls over the game the whole time, heavier at the end.
- The bottom panel shows a written hint and a compass arrow towards the next card. Hold the phone flat for the arrow.
- Cards must be found in order. A later card answers "Még nem!", a repeated card does nothing.
- After the last card the letters jump in a wave under a shower of gold sparks, then the phrase glows and the final hint points to the gift.

- A soft chime plays as each letter lands and a short run of notes at the end (nothing plays while the iPhone's silent switch is on).
- If a card will not scan, hold a finger on the row of letters for 2 seconds and the game counts the next card as found.

The game text is in Hungarian. Progress is kept on the phone, so a reload or a dropped tab carries on where she was. To start over (for example after your own test run), open the game once with `?reset` added to the address.

## Setting up your own hunt

Everything is done on the `?setup` page. Open `index.html?setup` on a computer (served locally, or from wherever you host it).

1. **Write the sentence.** Spaces split words; every other character (letters, numbers, `!`) is one hidden card, up to 30. Long sentences wrap onto one line per word on the phone.
2. **Write the hints.** One box per step: the first leads to card 1, the last to the gift. The boxes follow the sentence as you change it. What you type is kept on that computer only.
3. **Record the directions (optional).** With the cards hidden, open `?setup` on the iPhone. At each spot hold the phone flat, point it at the next card and tap **Record**. Steps you skip show no arrow.
4. **Save the hunt.** Press **Copy** and paste the text over the whole of `js/config.js`, then deploy. The game does not change until you do. You can also edit `js/config.js` by hand: `SENTENCE`, `HINTS` and `BEARINGS`, with one more hint and direction than there are cards.
5. **Print the cards.** Print the same page: one QR card per character, numbered in order, deep red on cream with a gold frame to match the statues. A black-and-white print should also scan (the reader only looks at brightness). To test without printing, **Full screen** under a card shows that one code large, ready to scan from the screen (tap to close), and **Download** saves it as `card-N.png`. The cards only carry their number (`mx1`, `mx2`, ...), so they work with any sentence of the same length, but do not mix cards from two hunts in one house.

## Requirements

- Must be served over **HTTPS** (or `localhost`), otherwise the camera will not open.
- Built for iPhone Safari; the compass uses an iOS-only heading value.
- Needs an internet connection: the QR reader ([jsQR](https://github.com/cozmo/jsQR)) and the card generator load from a CDN.
- Indoor compasses can be 20–30° off near metal and electronics, so the arrow is a nudge, not a pointer.

## Files

```
index.html       page markup and the version number
css/style.css    all styling, including the setup page and print layout
js/config.js     the only file to edit: sentence, hints, compass directions
js/game.js       camera, QR reading, motion tracking, the statue, effects, game flow
js/setup.js      the ?setup page: sentence, hint editor, compass recorder, printable cards
js/selfcheck.js  the ?test self-check
backups/         zip of every version (git-ignored)
```

## Development

```bash
python3 -m http.server 8123
```

Then open `http://localhost:8123`. Adding `?debug` to the game's address shows live numbers on screen (frame rate, how often the code is read, and how much the tile slips, leans and turns per frame) for tuning steadiness on a real phone. Opening `http://localhost:8123/?test` runs a small self-check of the game logic; the last console line reports how many checks failed.

## Versions

The page checks the server for a newer version each time it opens and reloads itself if it finds one, so a new deploy shows up without clearing site data. `const VERSION` in `index.html` must be bumped with every release for this to work, and so must the `?v=` on its `css/` and `js/` links (`sed -i '' 's/?v=OLD/?v=NEW/g' index.html`), which keeps phones from reusing old copies of those files (`?test` checks they match); the setup page shows the loaded version.

Versions are `vX.Y.Z`, where each part runs 0–9 and carries into the next at 10 (v0.0.9 is followed by v0.1.0). Every version is published as a pre-release until the game is finished.
