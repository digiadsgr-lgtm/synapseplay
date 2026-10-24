/**
 * Central Monetization & Stripe Hosted Checkout Configuration for SynapsePlay (FocusEngine 5+).
 *
 * All payments take place externally on Stripe Hosted Checkout pages (zero embedded payment SDKs).
 */

export const ENABLE_PAYWALL = false;

export const STRIPE_CHECKOUT_URLS = {
  /** SynapsePlay Therapist Pro (Ετήσιο B2B) — Απεριόριστα προφίλ & Εργαλείο Κλινικής Εναλλαγής */
  therapistProYearly:
    (import.meta.env?.VITE_STRIPE_B2B_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/4gM00jgydcQf7jP7HK63K00',

  /** SynapsePlay — Επιπλέον Προφίλ Παιδιού (Add-on) */
  extraChildProfile:
    (import.meta.env?.VITE_STRIPE_EXTRA_PROFILE_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/eVq28req5cQfgUp2nq63K01',

  /** SynapsePlay Family — Μηνιαίο (Έως 2 προφίλ παιδιών) */
  familyMonthly:
    (import.meta.env?.VITE_STRIPE_FAMILY_MONTHLY_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/aFa00jbdT03t5bHgeg63K02',

  /** SynapsePlay Family (Ετήσιο — Έως 2 προφίλ παιδιών) */
  familyYearly:
    (import.meta.env?.VITE_STRIPE_FAMILY_YEARLY_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/dRm8wP6XD17xdId8LO63K03',

  /** Backwards-compatible aliases used across components */
  familyPlan:
    (import.meta.env?.VITE_STRIPE_FAMILY_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/dRm8wP6XD17xdId8LO63K03',

  b2bTherapistPlan:
    (import.meta.env?.VITE_STRIPE_B2B_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/4gM00jgydcQf7jP7HK63K00',
} as const;

export default STRIPE_CHECKOUT_URLS;
