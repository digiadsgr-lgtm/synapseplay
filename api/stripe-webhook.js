/**
 * POST /api/stripe-webhook   (Stripe Dashboard → Developers → Webhooks → event: invoice.paid)
 *
 * Every successful subscription payment (first one AND every renewal) → new signed licence
 * valid until the end of the paid period (+3 days grace) → e-mailed to the customer.
 * If a subscription is cancelled, no new invoice is paid, so the licence simply expires.
 *
 * Env: STRIPE_WEBHOOK_SECRET (whsec_…), LICENSE_SIGNING_KEY, RESEND_API_KEY (+ LICENSE_FROM_EMAIL)
 */
import {
  childCodeForSubscription,
  emailLicense,
  issueLicenseToken,
  planFor,
  readRawBody,
  verifyStripeSignature,
} from './_lib/license.js';

// Keep the raw body intact for signature verification
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.LICENSE_SIGNING_KEY) {
    return res.status(503).json({ ok: false, reason: 'not-configured' });
  }

  const raw = await readRawBody(req);
  if (!verifyStripeSignature(raw, req.headers['stripe-signature'], secret)) {
    return res.status(400).json({ ok: false, reason: 'bad-signature' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ ok: false });
  }

  if (event.type !== 'invoice.paid') {
    return res.status(200).json({ ok: true, ignored: event.type });
  }

  const invoice = event.data && event.data.object ? event.data.object : {};
  const lines = (invoice.lines && invoice.lines.data) || [];
  const line =
    lines.find((l) => l.subscription || l.type === 'subscription' || (l.parent && l.parent.subscription_item_details)) ||
    lines[0];
  if (!line) return res.status(200).json({ ok: true, ignored: 'no-lines' });

  // Stripe API versions differ: price on the line (older) or under pricing.price_details (2025+)
  const priceId =
    (line.price && line.price.id) ||
    (line.pricing && line.pricing.price_details && line.pricing.price_details.price) ||
    null;
  const quantity = line.quantity || 1;
  const unitAmount =
    (line.price && line.price.unit_amount) ??
    (line.pricing && line.pricing.unit_amount_decimal != null
      ? Math.round(Number(line.pricing.unit_amount_decimal))
      : Math.round((line.amount || invoice.amount_paid || 0) / quantity));

  const plan = planFor({ priceId, unitAmount });
  if (!plan) return res.status(200).json({ ok: true, ignored: 'unknown-plan' });

  const periodEnd = (line.period && line.period.end) || invoice.period_end;
  const subscriptionId =
    invoice.subscription ||
    (invoice.parent && invoice.parent.subscription_details && invoice.parent.subscription_details.subscription) ||
    (line.parent && line.parent.subscription_item_details && line.parent.subscription_item_details.subscription) ||
    null;
  // Κωδικός παιδιού από την αρχική αγορά (client_reference_id) — ισχύει και στις ανανεώσεις
  const childCode = plan === 'b2b' ? null : await childCodeForSubscription(subscriptionId);
  const { token, payload } = issueLicenseToken({
    plan,
    periodEnd,
    quantity,
    ref: subscriptionId || invoice.id,
    childCode,
  });

  const sent = await emailLicense({
    to: invoice.customer_email,
    token,
    plan,
    expiresAt: payload.e,
    childCode,
  });

  // Always 200 so Stripe does not retry endlessly; "emailed" tells you in the Stripe log if mail failed.
  return res.status(200).json({ ok: true, plan, emailed: sent, childCode });
}
