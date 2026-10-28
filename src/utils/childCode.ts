/**
 * Κωδικός παιδιού (δίνεται από τον θεραπευτή / το κέντρο).
 *
 * Μορφή:  ΚΚΚΚ-ΠΠΠΠ-Ε   π.χ. K7QM-4HXA-R
 *   ΚΚΚΚ = κωδικός κέντρου (ίδιος για όλα τα παιδιά του κέντρου)
 *   ΠΠΠΠ = μοναδικό κομμάτι του παιδιού (τυχαίο)
 *   Ε    = ψηφίο ελέγχου (Luhn mod 32) — πιάνει τυπογραφικά λάθη και αντιμεταθέσεις
 *
 * Αλφάβητο 32 χαρακτήρων χωρίς μπερδέματα (χωρίς 0/O, 1/I).
 * Ελληνικά γράμματα που μοιάζουν με λατινικά (Κ, Μ, Ρ, Χ…) μετατρέπονται αυτόματα,
 * ώστε ο γονιός να μπορεί να πληκτρολογήσει με ελληνικό πληκτρολόγιο.
 *
 * Ο κωδικός ΔΕΝ είναι μυστικό/κλειδί: χρησιμοποιείται ως client_reference_id στο Stripe
 * για να φαίνεται από ποιο κέντρο ήρθε κάθε οικογενειακή συνδρομή και για να
 * συνδέεται το αρχείο προόδου του σπιτιού με το προφίλ του παιδιού στο κέντρο.
 */

export const CHILD_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const N = CHILD_CODE_ALPHABET.length; // 32

const GREEK_TO_LATIN: Record<string, string> = {
  Α: 'A',
  Β: 'B',
  Ε: 'E',
  Ζ: 'Z',
  Η: 'H',
  Κ: 'K',
  Μ: 'M',
  Ν: 'N',
  Ρ: 'P',
  Τ: 'T',
  Υ: 'Y',
  Χ: 'X',
};

/** Κεφαλαία, χωρίς τόνους/κενά/παύλες, ελληνικά → λατινικά. */
function compact(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[\s\-_.]/g, '')
    .split('')
    .map((ch) => GREEK_TO_LATIN[ch] ?? ch)
    .join('');
}

function checkChar(body: string): string {
  let factor = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    const v = CHILD_CODE_ALPHABET.indexOf(body[i]);
    let addend = factor * v;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / N) + (addend % N);
    sum += addend;
  }
  return CHILD_CODE_ALPHABET[(N - (sum % N)) % N];
}

function format(body8: string): string {
  return `${body8.slice(0, 4)}-${body8.slice(4, 8)}-${checkChar(body8)}`;
}

function randomChars(count: number): string {
  const bytes = new Uint8Array(count);
  const c = globalThis.crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < count; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => CHILD_CODE_ALPHABET[b % N]).join('');
}

export interface ParsedChildCode {
  /** Κανονική μορφή ΚΚΚΚ-ΠΠΠΠ-Ε */
  code: string;
  centerCode: string;
}

/** Επιστρέφει τον κωδικό σε κανονική μορφή, ή null αν δεν είναι έγκυρος. */
export function parseChildCode(raw: string): ParsedChildCode | null {
  const c = compact(raw ?? '');
  if (c.length !== 9) return null;
  for (const ch of c) if (!CHILD_CODE_ALPHABET.includes(ch)) return null;
  const body = c.slice(0, 8);
  if (checkChar(body) !== c[8]) return null;
  return { code: format(body), centerCode: body.slice(0, 4) };
}

export function isValidChildCode(raw: string): boolean {
  return parseChildCode(raw) !== null;
}

/** Μήνυμα λάθους για τον γονιό (ή null αν ο κωδικός είναι σωστός). */
export function childCodeErrorEl(raw: string): string | null {
  const c = compact(raw ?? '');
  if (!c) return 'Γράψτε τον κωδικό παιδιού που σας έδωσε ο θεραπευτής.';
  if (c.length !== 9) return 'Ο κωδικός έχει 9 χαρακτήρες, π.χ. K7QM-4HXA-R.';
  if ([...c].some((ch) => !CHILD_CODE_ALPHABET.includes(ch)))
    return 'Ο κωδικός δεν περιέχει 0, 1, O ή I. Ελέγξτε τον ξανά.';
  if (!isValidChildCode(c)) return 'Ο κωδικός δεν είναι σωστός — ελέγξτε μήπως λείπει ή άλλαξε κάποιος χαρακτήρας.';
  return null;
}

/** Τυχαίος κωδικός κέντρου (4 χαρακτήρες) — χρησιμοποιείται όσο δεν υπάρχει άδεια B2B. */
export function randomCenterCode(): string {
  return randomChars(4);
}

/**
 * Κωδικός κέντρου από το ref της άδειας B2B (τελευταίοι 10 χαρακτήρες της συνδρομής Stripe).
 * Ίδιος υπολογισμός υπάρχει στο scripts/partner-report.mjs (FNV-1a 32-bit → 4 χαρακτήρες).
 */
export function centerCodeFromLicenseRef(ref: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < ref.length; i++) {
    h ^= ref.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += CHILD_CODE_ALPHABET[h % N];
    h = Math.floor(h / N);
  }
  return out;
}

/** Νέος κωδικός παιδιού για το κέντρο. */
export function generateChildCode(centerCode: string): string {
  const center = compact(centerCode).slice(0, 4);
  if (center.length !== 4 || [...center].some((ch) => !CHILD_CODE_ALPHABET.includes(ch))) {
    throw new Error('Μη έγκυρος κωδικός κέντρου');
  }
  return format(center + randomChars(4));
}

/**
 * Προσθέτει τον κωδικό παιδιού στο Stripe Payment Link ως client_reference_id
 * (επιτρέπονται γράμματα, αριθμοί, - και _). Το ίδιο το link δεν αλλάζει.
 */
export function withChildCode(checkoutUrl: string, code: string): string {
  const parsed = parseChildCode(code);
  if (!parsed) return checkoutUrl;
  try {
    const u = new URL(checkoutUrl);
    u.searchParams.set('client_reference_id', parsed.code);
    return u.toString();
  } catch {
    return checkoutUrl;
  }
}
