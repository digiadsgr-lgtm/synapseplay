/**
 * GET /api/license-claim?session_id=cs_...
 *
 * Instant activation after payment: the Stripe Payment Link redirects the customer to
 *   https://www.synapseplay.gr/parent?checkout_session={CHECKOUT_SESSION_ID}
 * The app calls this endpoint; we ask Stripe whether that checkout was really PAID and,
 * if so, return a signed licence token that the app stores on the device.
 * (The same licence is also e-mailed by /api/stripe-webhook for other devices/renewals.)
 */
import { isLicensingConfigured, issueLicenseToken, planFor, stripeGet } from './_lib/license.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }

  const url = new URL(req.url || '', 'https://www.synapseplay.gr');
  const sessionId = String((req.query && req.query.session_id) || url.searchParams.get('session_id') || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) {
    return res.status(400).json({ ok: false, reason: 'bad-session' });
  }

  if (!isLicensingConfigured()) {
    return res.status(503).json({ ok: false, reason: 'not-configured' });
  }

  const session = await stripeGet(
    `checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items&expand[]=subscription`
  );
  if (!session) {
    return res.status(404).json({ ok: false, reason: 'not-found' });
  }
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  if (session.status !== 'complete' || !paid) {
    return res.status(402).json({ ok: false, reason: 'not-paid' });
  }

  const item = session.line_items && session.line_items.data && session.line_items.data[0];
  const price = item && item.price;
  const plan = planFor({
    priceId: price && price.id,
    unitAmount: price && price.unit_amount != null ? price.unit_amount : session.amount_total,
  });
  if (!plan) {
    return res.status(422).json({ ok: false, reason: 'unknown-plan' });
  }

  const sub = session.subscription && typeof session.subscription === 'object' ? session.subscription : null;
  const periodEnd =
    (sub && sub.current_period_end) ||
    (sub && sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end) ||
    Math.floor(Date.now() / 1000) + 31 * 24 * 3600;

  const { token, payload } = issueLicenseToken({
    plan,
    periodEnd,
    quantity: (item && item.quantity) || 1,
    ref: (sub && sub.id) || session.id,
  });

  return res.status(200).json({ ok: true, token, plan, expiresAt: payload.e });
}
