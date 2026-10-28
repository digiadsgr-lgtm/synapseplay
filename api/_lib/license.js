/**
 * Shared helpers for SynapsePlay licences (files starting with "_" are NOT exposed as endpoints).
 *
 * A licence is a signed, self-contained token that the app verifies OFFLINE:
 *     SP1.<base64url(JSON payload)>.<base64url(ECDSA P-256 / SHA-256 signature)>
 * payload = { v: 1, p: 'family' | 'extra' | 'b2b', e: expiresAt(unix s), i: issuedAt, n: count, r: ref,
 *             c?: child code ΚΚΚΚ-ΠΠΠΠ-Ε (family/extra — από το client_reference_id του Stripe) }
 *
 * Only this server holds the PRIVATE key (env LICENSE_SIGNING_KEY); the app ships the PUBLIC key
 * (src/config/licensePublicKey.ts). Nobody can create a valid code without the private key.
 *
 * Env vars used here (all NEW, none of the existing ones is changed):
 *   LICENSE_SIGNING_KEY   base64 PKCS#8 private key (from scripts/generate-license-keys.mjs)
 *   STRIPE_SECRET_KEY     restricted key, READ access to Checkout Sessions + Subscriptions
 *   LICENSE_PRICE_MAP     optional JSON {"price_…":"family","price_…":"extra","price_…":"b2b"}
 *   LICENSE_FROM_EMAIL    sender for licence e-mails, e.g. "SynapsePlay <licenses@synapseplay.gr>"
 *   (re-used, read-only) RESEND_API_KEY, FEEDBACK_FROM_EMAIL, FEEDBACK_RECEIVER_EMAIL
 */
import crypto from 'node:crypto';

export const SITE_URL = 'https://www.synapseplay.gr';
const GRACE_SECONDS = 3 * 24 * 3600; // renewal payments can arrive a little late
const OWNER_FALLBACK_EMAIL = 'digiadsgr@gmail.com';

// Fallback when LICENSE_PRICE_MAP is not set: unit amount in cents (EUR) → plan
// Παλιές ΚΑΙ νέες τιμές: λειτουργεί με όποιο Payment Link κι αν είναι ενεργό
const DEFAULT_AMOUNT_MAP = {
  499: 'family', // Οικογενειακό μηνιαίο 4,99€ (παλιό link — δεν προβάλλεται πια)
  3999: 'family', // Οικογενειακό ετήσιο 39,99€ (σημερινό link)
  5999: 'family', // Οικογενειακό ετήσιο 59,99€ (νέα τιμή)
  199: 'extra', // Επιπλέον παιδί 1,99€ / μήνα (σημερινό link)
  999: 'extra', // Επιπλέον παιδί 9,99€ / έτος (νέα τιμή)
  29900: 'b2b', // Therapist Pro 299€ (σημερινό link)
  49900: 'b2b', // Therapist Pro 499€ / έτος (ιδρυτικό κέντρο: 999€ − κουπόνι 500€)
  49999: 'b2b', // Therapist Pro 499,99€ / έτος (ιδρυτικό κέντρο: 999,99€ − κουπόνι 500€)
  99900: 'b2b', // Therapist Pro 999€ / έτος (νέα τιμή)
  99999: 'b2b', // Therapist Pro 999,99€ / έτος (ενεργό Stripe link)
};

/* Κωδικός παιδιού — ίδιος αλγόριθμος με src/utils/childCode.ts (Luhn mod 32). */
const CHILD_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function childCodeCheckChar(body) {
  let factor = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    let addend = factor * CHILD_CODE_ALPHABET.indexOf(body[i]);
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / 32) + (addend % 32);
    sum += addend;
  }
  return CHILD_CODE_ALPHABET[(32 - (sum % 32)) % 32];
}

/** client_reference_id → κωδικός παιδιού σε κανονική μορφή, ή null. */
export function normalizeChildCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (c.length !== 9 || ![...c].every((ch) => CHILD_CODE_ALPHABET.includes(ch))) return null;
  if (childCodeCheckChar(c.slice(0, 8)) !== c[8]) return null;
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c[8]}`;
}

/** Κωδικός παιδιού της αρχικής αγοράς μιας συνδρομής (για τις ανανεώσεις). */
export async function childCodeForSubscription(subscriptionId) {
  if (!subscriptionId || !process.env.STRIPE_SECRET_KEY) return null;
  const list = await stripeGet(
    `checkout/sessions?subscription=${encodeURIComponent(subscriptionId)}&limit=1`
  );
  const s = list && list.data && list.data[0];
  return s ? normalizeChildCode(s.client_reference_id) : null;
}

export const PLAN_LABELS_EL = {
  family: 'Οικογενειακό Πλάνο',
  extra: 'Επιπλέον Προφίλ Παιδιού',
  b2b: 'Άδεια Θεραπευτή (B2B)',
};

/** price id (preferred, via LICENSE_PRICE_MAP) or unit amount in cents → plan, or null. */
export function planFor({ priceId, unitAmount }) {
  try {
    const map = JSON.parse(process.env.LICENSE_PRICE_MAP || '{}');
    if (priceId && typeof map[priceId] === 'string') return map[priceId];
  } catch {
    // ignore malformed map → amount fallback
  }
  return DEFAULT_AMOUNT_MAP[Number(unitAmount)] || null;
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function loadSigningKey() {
  const raw = (process.env.LICENSE_SIGNING_KEY || '').trim();
  if (!raw) throw new Error('LICENSE_SIGNING_KEY is not configured');
  return crypto.createPrivateKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'pkcs8' });
}

export function isLicensingConfigured() {
  return Boolean(process.env.LICENSE_SIGNING_KEY && process.env.STRIPE_SECRET_KEY);
}

/** Creates a signed licence token. periodEnd = unix seconds of the paid period's end. */
export function issueLicenseToken({ plan, periodEnd, quantity = 1, ref, childCode }) {
  const payload = {
    v: 1,
    p: plan,
    e: Math.floor(Number(periodEnd)) + GRACE_SECONDS,
    i: Math.floor(Date.now() / 1000),
    n: Math.max(1, Math.floor(Number(quantity) || 1)),
    r: ref ? String(ref).slice(-10) : undefined,
    c: childCode || undefined,
  };
  const body = b64url(JSON.stringify(payload));
  const signingInput = `SP1.${body}`;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: loadSigningKey(),
    dsaEncoding: 'ieee-p1363', // raw r||s — the format WebCrypto verify() expects
  });
  return { token: `${signingInput}.${b64url(signature)}`, payload };
}

/** Minimal Stripe REST GET (no SDK dependency). */
export async function stripeGet(pathWithQuery) {
  const r = await fetch(`https://api.stripe.com/v1/${pathWithQuery}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!r.ok) return null;
  return r.json();
}

export function activationLink(token) {
  return `${SITE_URL}/parent?license=${encodeURIComponent(token)}`;
}

/** E-mails the licence to the customer (best effort). Owner gets a BCC copy for support. */
export async function emailLicense({ to, token, plan, expiresAt, childCode }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const owner = process.env.FEEDBACK_RECEIVER_EMAIL || OWNER_FALLBACK_EMAIL;
  const from =
    process.env.LICENSE_FROM_EMAIL ||
    process.env.FEEDBACK_FROM_EMAIL ||
    'SynapsePlay <onboarding@resend.dev>';
  const until = new Date(expiresAt * 1000).toLocaleDateString('el-GR');
  const text = [
    'Ευχαριστούμε για τη συνδρομή σας στο SynapsePlay!',
    '',
    `Πλάνο: ${PLAN_LABELS_EL[plan] || plan}`,
    ...(plan === 'b2b' ? [] : [`Κωδικός παιδιού: ${childCode || '— (δεν δόθηκε· θα επικοινωνήσουμε μαζί σας)'}`]),
    `Ισχύει έως: ${until} (ανανεώνεται αυτόματα με κάθε πληρωμή — θα λάβετε νέο κωδικό)`,
    '',
    'Ενεργοποίηση με 1 πάτημα (ανοίξτε το από τη συσκευή του παιδιού):',
    activationLink(token),
    '',
    'Ή αντιγράψτε τον κωδικό στο «Περιοχή Γονέων → Διαχείριση Συνδρομής»:',
    token,
    '',
    'Μπορείτε να τον χρησιμοποιήσετε σε όσες συσκευές της οικογένειας/του γραφείου σας χρειάζεστε.',
  ].join('\n');
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        bcc: owner && owner !== to ? [owner] : undefined,
        subject: `SynapsePlay — Κωδικός ενεργοποίησης (${PLAN_LABELS_EL[plan] || plan})${
          plan !== 'b2b' && !childCode ? ' [ΧΩΡΙΣ ΚΩΔΙΚΟ ΠΑΙΔΙΟΥ]' : ''
        }`,
        text,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Reads the raw request body (needed for Stripe signature verification). */
export async function readRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/** Verifies the Stripe-Signature header (HMAC-SHA256, 5-minute tolerance). */
export function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  let timestamp = null;
  const signatures = [];
  for (const part of String(header).split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1' && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSec) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');
  const exp = Buffer.from(expected, 'hex');
  return signatures.some((sig) => {
    const got = Buffer.from(sig, 'hex');
    return got.length === exp.length && crypto.timingSafeEqual(got, exp);
  });
}
