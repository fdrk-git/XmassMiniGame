// ====================== CONFIG — made by the ?setup page, or edit by hand ======================
const LANGUAGE = 'hu';           // game text: 'hu' (Magyar) or 'en' (English)
const SENTENCE = 'MERRY XMAS';   // spaces split words; every other character is one hidden card (QR texts mx1, mx2, ...)
// HINTS[0] is shown at the start (leads to card 1), HINTS[n] after card n is found, the last one leads to the gift.
const HINTS = [
  '[1. TIPP – írd át: hol van az 1. kártya?]',
  '[2. TIPP – írd át: hol van a 2. kártya?]',
  '[3. TIPP – írd át: hol van a 3. kártya?]',
  '[4. TIPP – írd át: hol van a 4. kártya?]',
  '[5. TIPP – írd át: hol van az 5. kártya?]',
  '[6. TIPP – írd át: hol van a 6. kártya?]',
  '[7. TIPP – írd át: hol van a 7. kártya?]',
  '[8. TIPP – írd át: hol van a 8. kártya?]',
  '[9. TIPP – írd át: hol van a 9. kártya?]',
  '[UTOLSÓ TIPP – írd át: hol van az ajándék?] 🎁',
];
// Compass direction (degrees) for each hint, recorded with ?setup. null = no arrow for that step.
const BEARINGS = [null, null, null, null, null, null, null, null, null, null];
// =================================================================
