# Xmas Mini Game 🎄

A one-time Christmas letter hunt that runs in the phone browser. Nine QR cards are hidden around the house; the player finds them in order with the camera, each one reveals a letter of **MERRY XMAS**, and the last one leads to the gift.

## How it plays

- Tap **Kezdjük!** and allow camera and motion access.
- Point the camera at a card. The QR code is covered on screen by a round red-and-gold plinth lying flat on the card. A gift stands on it until the card is found, then a gold 3D letter that turns to face the camera. Cards can lie on the floor or a table. When a card is found, its letter launches up from the statue and flies into its place in the row at the top.
- The bottom panel shows a written hint and a compass arrow towards the next card. Hold the phone flat for the arrow.
- Cards must be found in order. A later card answers "Még nem!", a repeated card does nothing.
- After the ninth card the phrase lights up and the final hint points to the gift.

The game text is in Hungarian. Progress is not saved: reloading restarts the hunt.

## Setting it up

1. **Print the cards.** Open `index.html?setup` on a computer and print. Cards printed before v0.0.6 still work but scan poorly at an angle; reprint them. The small number on each card is its order (1 = M … 9 = S). To test without printing, **Full screen** under a card shows that one code large, ready to scan from the screen (tap to close), and **Download** saves it as `card-N.png`.
2. **Write the hints.** Edit the ten entries of `HINTS` at the top of the script in `index.html`. The first leads to card 1, the last to the gift.
3. **Record the directions.** With the cards hidden, open `?setup` on the iPhone. At each spot hold the phone flat, point it at the next card and tap **Record**. Paste the resulting line over `const BEARINGS`. Steps left as `null` show no arrow.

## Requirements

- Must be served over **HTTPS** (or `localhost`), otherwise the camera will not open.
- Built for iPhone Safari; the compass uses an iOS-only heading value.
- Needs an internet connection: the QR reader ([jsQR](https://github.com/cozmo/jsQR)) and the card generator load from a CDN.
- Indoor compasses can be 20–30° off near metal and electronics, so the arrow is a nudge, not a pointer.

## Development

```bash
python3 -m http.server 8123
```

Then open `http://localhost:8123`. Opening `http://localhost:8123/?test` runs a small self-check of the game logic; results are in the browser console.

## Versions

The page checks the server for a newer version each time it opens and reloads itself if it finds one, so a new deploy shows up without clearing site data. `const VERSION` in `index.html` must be bumped with every release for this to work; the setup page shows the loaded version.

Versions are `vX.Y.Z`, where each part runs 0–9 and carries into the next at 10 (v0.0.9 is followed by v0.1.0). Every version is published as a pre-release until the game is finished.
