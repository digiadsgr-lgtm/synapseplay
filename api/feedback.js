/**
 * Vercel Serverless Function: POST /api/feedback
 * Hardened relay with Resend + FormSubmit zero-config support:
 * origin allowlist, strict validation, length caps, honeypot,
 * best-effort rate limit, and server-constructed subject/fields.
 */

const ALLOWED_ORIGINS = new Set([
  'https://www.synapseplay.gr',
  'https://synapseplay.gr',
]);

const ROLES = new Set([
  'parent', 'occupational-therapist', 'speech-therapist', 'child-psychologist',
  'child-psychiatrist', 'physiatrist', 'social-worker', 'adhd-center-director',
]);
const AGE_BANDS = new Set(['4-5', '5-6', '6-8', '8-10', '10-12']);

// Best-effort per-instance limiter (serverless instances are ephemeral).
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > MAX_PER_WINDOW;
}

function str(v, max) {
  if (typeof v !== 'string') return '';
  // strip control chars (incl. CR/LF for header-safe single-line fields)
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}
function line(v, max) {
  return str(v, max).replace(/[\r\n]+/g, ' ');
}
function score(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const origin = req.headers.origin || '';
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ ok: false });
  }

  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return res.status(415).json({ ok: false });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false });
  }

  const recipientEmail = process.env.FEEDBACK_RECEIVER_EMAIL || 'digiadsgr@gmail.com';
  const resendKey = process.env.RESEND_API_KEY;

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ ok: false });
  }

  // Honeypot: το πεδίο "website" είναι κρυφό στη φόρμα — μόνο bots το συμπληρώνουν.
  if (body.website) {
    return res.status(200).json({ ok: true, method: 'noop' });
  }

  const role = ROLES.has(body.reviewerRole) ? body.reviewerRole : 'other';
  const roleLabel = line(body.reviewerRoleLabelEl, 60) || 'Αξιολογητής';
  const name = line(body.reviewerNameOrCenter, 80) || 'Ανώνυμος';
  const scope = line(body.targetScopeLabelEl, 120) || 'Γενική Λειτουργία';
  const ageBand = AGE_BANDS.has(body.ageBandTested) ? body.ageBandTested : '6-8';
  const stars = score(body.ratingStars) ?? 5;
  const usability = score(body.usabilityScore) ?? 5;
  const clinical = score(body.clinicalAppropriatenessScore) ?? 5;
  const category = line(body.observationCategory, 60) || 'clinical-suggestion';
  const comment = str(body.commentEl, 4000);
  const fullReport = str(body.fullReportText, 20000);

  if (!comment && !fullReport) {
    return res.status(400).json({ ok: false });
  }

  // Το subject φτιάχνεται ΜΟΝΟ στον server — όχι από τον client.
  const subject = `SynapsePlay Αξιολόγηση — ${roleLabel} (${scope})`.slice(0, 180);

  const text = [
    'Νέα Αξιολόγηση / Παρατήρηση στο SynapsePlay',
    '-------------------------------------------------------------',
    `Αξιολογητής: ${roleLabel} [${role}] (${name})`,
    `Ενότητα / Παιχνίδι: ${scope}`,
    `Ηλικιακή Ομάδα: ${ageBand}`,
    `Κατηγορία: ${category}`,
    `Βαθμολογία: ${stars}/5 (Ευχρηστία: ${usability}/5 | Κλινική: ${clinical}/5)`,
    '',
    'Παρατήρηση / Πρόταση:',
    comment,
    fullReport ? `\n--- Πλήρης αναφορά ---\n${fullReport}` : '',
  ].join('\n');

  // 1. Αν υπάρχει RESEND_API_KEY, αποστολή μέσω Resend
  if (resendKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FEEDBACK_FROM_EMAIL || 'SynapsePlay Feedback <onboarding@resend.dev>',
          to: [recipientEmail],
          subject,
          text,
        }),
      });
      if (r.ok) return res.status(200).json({ ok: true, method: 'resend' });
    } catch {
      // Fall through to FormSubmit
    }
  }

  // 2. Προεπιλεγμένη αποστολή μέσω FormSubmit AJAX (δεν απαιτεί RESEND_API_KEY)
  try {
    const originHeader = req.headers.origin || 'https://www.synapseplay.gr';
    const refererHeader = req.headers.referer || 'https://www.synapseplay.gr/parent';

    const formSubmitResp = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: originHeader,
        Referer: refererHeader,
        'User-Agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        Αξιολογητής: `${roleLabel} (${name})`,
        Ενότητα_Παιχνίδι: scope,
        Ηλικιακή_Ομάδα: `${ageBand} ετών`,
        Βαθμολογία: `${stars}/5 ⭐ (Ευχρηστία: ${usability}/5, Κλινική: ${clinical}/5)`,
        Κατηγορία: category,
        Παρατήρηση_Πρόταση: comment || fullReport,
      }),
    });

    if (formSubmitResp.ok) {
      const fsData = await formSubmitResp.json().catch(() => ({}));
      if (fsData && (fsData.success === 'true' || fsData.success === true)) {
        return res.status(200).json({ ok: true, method: 'formsubmit-server' });
      }
    }
    return res.status(502).json({ ok: false, error: 'formsubmit-browser-fallback-needed' });
  } catch {
    return res.status(502).json({ ok: false, error: 'formsubmit-browser-fallback-needed' });
  }
}
