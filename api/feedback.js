/**
 * Vercel Serverless Function: /api/feedback
 * Hardened server-side email relay for SynapsePlay clinical & parent feedback.
 *
 * Required Vercel Environment Variables:
 *   RESEND_API_KEY           - Resend API key (re_...)
 *   FEEDBACK_RECEIVER_EMAIL  - Destination email address for clinical reports
 * Optional:
 *   FEEDBACK_FROM_EMAIL      - Verified sender (defaults to onboarding@resend.dev)
 *   FEEDBACK_EXTRA_ORIGIN    - Optional extra allowed origin (e.g. preview URL)
 */

const ALLOWED_ORIGINS = new Set([
  'https://www.synapseplay.gr',
  'https://synapseplay.gr',
  ...(process.env.FEEDBACK_EXTRA_ORIGIN ? [process.env.FEEDBACK_EXTRA_ORIGIN.trim()] : []),
]);

// Best-effort in-memory rate limiter per warm Serverless instance (5 req / 10 min per IP)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const ipHits = new Map();

function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  if (ipHits.size > 500) {
    for (const [k, v] of ipHits) {
      if (now - v.windowStart > RATE_WINDOW_MS) ipHits.delete(k);
    }
  }
  const entry = ipHits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    ipHits.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX_REQUESTS;
}

function isOriginAllowed(req) {
  const origin = req.headers?.origin;
  const referer = req.headers?.referer;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) return true;
  if (typeof referer === 'string') {
    for (const allowed of ALLOWED_ORIGINS) {
      if (referer.startsWith(allowed + '/') || referer === allowed) return true;
    }
  }
  // Allow same-host calls on Vercel preview deployments only when host matches origin
  const host = req.headers?.host;
  if (typeof origin === 'string' && typeof host === 'string' && origin === `https://${host}`) {
    return true;
  }
  return false;
}

/** Strip control chars (including CR/LF to prevent header injection) and clamp length. */
function sanitizeField(value, maxLen = 200, fallback = '—') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\r\n\t\x00-\x1F\x7F]+/g, ' ').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

/** Sanitize multi-line text while bounding size. */
function sanitizeMultiline(value, maxLen = 4000, fallback = '—') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, '').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

export default async function handler(req, res) {
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  const origin = req.headers?.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ ok: false, error: 'Forbidden origin' });
  }

  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ ok: false, error: 'Unsupported Media Type' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too Many Requests' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }

    // Honeypot field: bots that fill hidden fields get silently dropped
    if (typeof rawBody.website === 'string' && rawBody.website.trim() !== '') {
      return res.status(200).json({ ok: true, provider: 'noop' });
    }

    const comment = sanitizeMultiline(rawBody.comment, 4000, '');
    const fullReport = sanitizeMultiline(rawBody.fullReport, 20000, '');
    if (!comment && !fullReport) {
      return res.status(400).json({ ok: false, error: 'Empty feedback' });
    }

    const role = sanitizeField(rawBody.role, 120);
    const centerOrName = sanitizeField(rawBody.centerOrName, 120);
    const scope = sanitizeField(rawBody.scope, 160);
    const ageBand = sanitizeField(rawBody.ageBand, 40);
    const rating = sanitizeField(rawBody.rating, 80);
    const category = sanitizeField(rawBody.category, 80);
    const submittedAt = new Date().toISOString();

    // Subject is always constructed server-side from sanitized fields
    const subject = `SynapsePlay Αξιολόγηση — ${role} (${centerOrName})`.slice(0, 180);

    const textReport = [
      '==========================================================',
      'SYNAPSEPLAY — ΝΕΑ ΚΛΙΝΙΚΗ ΑΞΙΟΛΟΓΗΣΗ / ΠΑΡΑΤΗΡΗΣΗ',
      '==========================================================',
      `• Ιδιότητα / Ειδικότητα: ${role}`,
      `• Όνομα / Κέντρο ΔΕΠΥ: ${centerOrName}`,
      `• Ενότητα / Παιχνίδι: ${scope}`,
      `• Ηλικιακή Ομάδα: ${ageBand}`,
      `• Βαθμολογία: ${rating}`,
      `• Κατηγορία: ${category}`,
      `• Ημερομηνία: ${submittedAt}`,
      '----------------------------------------------------------',
      'ΠΑΡΑΤΗΡΗΣΗ / ΠΡΟΤΑΣΗ:',
      comment || '—',
      fullReport ? `\n==========================================================\nΠΛΗΡΗΣ ΑΝΑΦΟΡΑ:\n${fullReport}` : '',
    ].join('\n');

    const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
    const receiverEmail = (process.env.FEEDBACK_RECEIVER_EMAIL || '').trim();
    const fromEmail = (
      process.env.FEEDBACK_FROM_EMAIL || 'SynapsePlay <onboarding@resend.dev>'
    ).trim();

    if (!resendApiKey || !receiverEmail) {
      return res.status(503).json({
        ok: false,
        error: 'Feedback email relay is not configured on the server',
      });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [receiverEmail],
        subject,
        text: textReport,
      }),
    });

    if (resendResponse.ok) {
      return res.status(200).json({ ok: true, provider: 'resend' });
    }

    return res.status(502).json({
      ok: false,
      error: 'Upstream email provider rejected the request',
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Failed to relay feedback' });
  }
}
