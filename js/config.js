// ====================== CONFIG — edit these ======================
const LETTERS = 'MERRYXMAS';   // card 1 = M ... card 9 = S; QR texts are mx1..mx9
const GAP_AFTER = 5;           // space between MERRY and XMAS
// HINTS[0] is shown at the start (leads to card 1), HINTS[n] after card n is found, HINTS[9] leads to the gift.
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
