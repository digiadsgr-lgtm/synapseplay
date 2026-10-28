#!/usr/bin/env node
/**
 * Αναφορά συνεργατών (κέντρα) από το Stripe — ΜΟΝΟ ανάγνωση.
 *
 *   STRIPE_SECRET_KEY=rk_live_… node scripts/partner-report.mjs --from 2027-01-01 --to 2027-12-31 > synergates.csv
 *
 * Τρέχει ΤΟΠΙΚΑ (όχι στο Vercel). Restricted key με READ σε Invoices, Checkout Sessions, Subscriptions.
 * Δεν αλλάζει τίποτα στο Stripe.
 *
 * Κανόνες (αποφάσεις 28/10/2026 — ρυθμίζονται στο RULES):
 *   - Μετράει ΚΑΘΕ πληρωμένο τιμολόγιο οικογενειακού: νέες εγγραφές ΚΑΙ ανανεώσεις.
 *   - Το μέτρημα ξεκινά από το μηδέν κάθε χρόνο της άδειας B2B → τρέξτε το με --from/--to = έτος άδειας του κέντρου.
 *   - Οικογένειες 1..THRESHOLD: επιστροφή REFUND_PER_FAMILY (49,95€) η καθεμία, μόνο αν το κέντρο έχει άδεια B2B.
 *   - Οικογένειες πάνω από THRESHOLD: το SynapsePlay κρατά KEEP_NET (25€) ΚΑΘΑΡΑ, το κέντρο παίρνει το υπόλοιπο καθαρό.
 *   - Επιπλέον παιδί: το SynapsePlay κρατά EXTRA_KEEP_NET (4,99€) καθαρά, το κέντρο το υπόλοιπο· δεν μετρά στις 20.
 *   - «Καθαρό» = ποσό − ΦΠΑ (VAT) − χρέωση Stripe (FEE_PCT + FEE_FIXED). Χωρίς αναμονή 14 ημερών.
 * Τα πλάνα αναγνωρίζονται από το ποσό (παλιές ΚΑΙ νέες τιμές).
 */

export const RULES = {
  THRESHOLD: 20,
  REFUND_PER_FAMILY: 49.95,
  KEEP_NET: 25.0,
  EXTRA_KEEP_NET: 4.99,
  VAT: 0.24,
  FEE_PCT: 0.015,
  FEE_FIXED: 0.25,
  AMOUNTS: { 3999: 'family', 5999: 'family', 199: 'extra', 999: 'extra', 29900: 'b2b', 99900: 'b2b' },
};

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function checkChar(body) {
  let factor = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    let addend = factor * ALPHABET.indexOf(body[i]);
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / 32) + (addend % 32);
    sum += addend;
  }
  return ALPHABET[(32 - (sum % 32)) % 32];
}

export function normalizeChildCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (c.length !== 9 || ![...c].every((ch) => ALPHABET.includes(ch))) return null;
  if (checkChar(c.slice(0, 8)) !== c[8]) return null;
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c[8]}`;
}

/** Ίδιο με src/utils/childCode.ts → centerCodeFromLicenseRef (ref = τελευταίοι 10 χαρ. της συνδρομής). */
export function centerCodeFromLicenseRef(ref) {
  let h = 0x811c9dc5;
  for (let i = 0; i < ref.length; i++) {
    h ^= ref.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[h % 32];
    h = Math.floor(h / 32);
  }
  return out;
}

const r2 = (n) => Math.round(n * 100) / 100;

export function netOf(gross, rules = RULES) {
  return gross / (1 + rules.VAT) - (gross * rules.FEE_PCT + rules.FEE_FIXED);
}

/**
 * payments: [{ id, subscription, childCode, amount (cents, ανά μονάδα), email }]
 * → { centers: [...], withoutCode: [...] }
 */
export function summarize(payments, rules = RULES) {
  const centers = new Map();
  const get = (code) => {
    if (!centers.has(code)) {
      centers.set(code, { center: code, b2bEmail: '', hasB2B: false, families: 0, extras: 0, payoutOver: 0, payoutExtras: 0 });
    }
    return centers.get(code);
  };
  const withoutCode = [];
  // παλαιότερες πρώτα, ώστε οι 20 πρώτες να είναι οι πρώτες χρονικά
  const sorted = [...payments].sort((x, y) => (x.created || 0) - (y.created || 0));
  for (const s of sorted) {
    const plan = rules.AMOUNTS[s.amount];
    if (!plan) continue;
    if (plan === 'b2b') {
      const c = get(centerCodeFromLicenseRef(String(s.subscription || s.id).slice(-10)));
      c.hasB2B = true;
      c.b2bEmail = s.email || c.b2bEmail;
      continue;
    }
    const code = normalizeChildCode(s.childCode);
    if (!code) {
      withoutCode.push(s);
      continue;
    }
    if (code.startsWith('SELF-')) {
      // «Δεν θέλω θεραπευτή»: μετριέται μόνο για ενημέρωση — καμία επιστροφή/πληρωμή σε κέντρο
      const self = get('SELF');
      if (plan === 'extra') self.extras += 1;
      else self.families += 1;
      self.isSelf = true;
      continue;
    }
    const c = get(code.slice(0, 4));
    const net = netOf(s.amount / 100, rules);
    if (plan === 'extra') {
      c.extras += 1;
      c.payoutExtras += Math.max(0, net - rules.EXTRA_KEEP_NET);
      continue;
    }
    c.families += 1;
    if (c.families > rules.THRESHOLD) c.payoutOver += Math.max(0, net - rules.KEEP_NET);
  }
  const rows = [...centers.values()].map((c) => {
    const refund =
      c.hasB2B && !c.isSelf ? Math.min(c.families, rules.THRESHOLD) * rules.REFUND_PER_FAMILY : 0;
    return {
      ...c,
      b2bRefund: r2(refund),
      familiesOverThreshold: c.isSelf ? 0 : Math.max(0, c.families - rules.THRESHOLD),
      payoutOver: r2(c.payoutOver),
      payoutExtras: r2(c.payoutExtras),
      total: r2(refund + c.payoutOver + c.payoutExtras),
    };
  });
  rows.sort((a, b) => b.families - a.families);
  return { centers: rows, withoutCode };
}

const eur = (n) => n.toFixed(2).replace('.', ',');

export function toCsv({ centers }) {
  const head = [
    'Κέντρο',
    'Email B2B',
    'Άδεια B2B',
    'Οικογένειες (νέες + ανανεώσεις)',
    'Επιπλέον παιδιά',
    'Επιστροφή άδειας (€)',
    'Οικογένειες πάνω από 20',
    'Στο κέντρο από οικογένειες >20 (€)',
    'Στο κέντρο από επιπλέον παιδιά (€)',
    'ΣΥΝΟΛΟ προς κέντρο (€)',
  ];
  const rows = centers.map((c) =>
    [
      c.isSelf ? 'SELF (χωρίς θεραπευτή)' : c.center,
      c.b2bEmail,
      c.hasB2B ? 'ναι' : 'όχι',
      c.families,
      c.extras,
      eur(c.b2bRefund),
      c.familiesOverThreshold,
      eur(c.payoutOver),
      eur(c.payoutExtras),
      eur(c.total),
    ].join(';')
  );
  return '\ufeff' + [head.join(';'), ...rows].join('\r\n');
}

async function stripeGet(path) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!r.ok) throw new Error(`Stripe ${r.status}: ${await r.text()}`);
  return r.json();
}

const codeCache = new Map();
async function childCodeForSubscription(sub) {
  if (!sub) return null;
  if (codeCache.has(sub)) return codeCache.get(sub);
  const list = await stripeGet(`checkout/sessions?subscription=${encodeURIComponent(sub)}&limit=1`);
  const s = list.data && list.data[0];
  const code = s ? s.client_reference_id : null;
  codeCache.set(sub, code);
  return code;
}

/** Όλα τα πληρωμένα τιμολόγια (νέες συνδρομές + ανανεώσεις) της περιόδου. */
async function fetchPayments(fromSec, toSec) {
  const out = [];
  let after = '';
  for (;;) {
    const page = await stripeGet(
      `invoices?status=paid&limit=100&created[gte]=${fromSec}&created[lte]=${toSec}` +
        (after ? `&starting_after=${after}` : '')
    );
    for (const inv of page.data) {
      const line = inv.lines && inv.lines.data && inv.lines.data[0];
      const qty = (line && line.quantity) || 1;
      const sub =
        (typeof inv.subscription === 'string' && inv.subscription) ||
        (inv.parent && inv.parent.subscription_details && inv.parent.subscription_details.subscription) ||
        null;
      out.push({
        id: inv.id,
        created: inv.created,
        subscription: sub,
        amount: Math.round((inv.amount_paid || 0) / qty),
        email: inv.customer_email,
        childCode: await childCodeForSubscription(sub),
      });
    }
    if (!page.has_more || page.data.length === 0) break;
    after = page.data[page.data.length - 1].id;
  }
  return out;
}

async function main() {
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : null;
  };
  const from = arg('--from');
  const to = arg('--to');
  if (!process.env.STRIPE_SECRET_KEY || !from || !to) {
    console.error('Χρήση: STRIPE_SECRET_KEY=rk_… node scripts/partner-report.mjs --from YYYY-MM-DD --to YYYY-MM-DD');
    process.exit(1);
  }
  const fromSec = Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000);
  const toSec = Math.floor(new Date(`${to}T23:59:59Z`).getTime() / 1000);
  const result = summarize(await fetchPayments(fromSec, toSec));
  process.stdout.write(toCsv(result) + '\r\n');
  if (result.withoutCode.length) {
    console.error(`⚠️ ${result.withoutCode.length} πληρωμές οικογενειών ΧΩΡΙΣ έγκυρο κωδικό παιδιού:`);
    for (const s of result.withoutCode) console.error(`   ${s.id}  ${s.email || ''}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
