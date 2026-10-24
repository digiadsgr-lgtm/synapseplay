// src/config/monetization.config.ts

export interface MonetizationConfig {
  /**
   * Όσο είναι false, όλες οι λειτουργίες και δραστηριότητες παραμένουν 100% δωρεάν για δοκιμές.
   * Όταν βγει σε παραγωγή, αλλάζει σε true.
   */
  isMonetizationEnabled: boolean;
  checkoutUrls: {
    familyMonthly: string;
    familyAnnual: string;
    extraChildMonthly: string;
    therapistAnnual: string;
  };
}

export const MONETIZATION_CONFIG: MonetizationConfig = {
  // Ελέγχεται από τη μεταβλητή περιβάλλοντος ή παραμένει false κατά το development
  isMonetizationEnabled: import.meta.env.VITE_ENABLE_MONETIZATION === 'true',
  checkoutUrls: {
    // SynapsePlay Family — Μηνιαίο (4,99€ / μήνα)
    familyMonthly: 'https://buy.stripe.com/aFa00jbdT03t5bHgeg63K02',

    // SynapsePlay Family — Ετήσιο (39,99€ / έτος)
    familyAnnual: 'https://buy.stripe.com/dRm8wP6XD17xdId8LO63K03',

    // SynapsePlay — Επιπλέον Προφίλ Παιδιού (1,99€ / μήνα)
    extraChildMonthly: 'https://buy.stripe.com/eVq28req5cQfgUp2nq63K01',

    // SynapsePlay Therapist Pro — Ετήσιο B2B (299,00€ / έτος)
    therapistAnnual: 'https://buy.stripe.com/4gM00jgydcQf7jP7HK63K00',
  },
};

export const ENABLE_PAYWALL = MONETIZATION_CONFIG.isMonetizationEnabled;

export const STRIPE_CHECKOUT_URLS = {
  ...MONETIZATION_CONFIG.checkoutUrls,
  therapistProYearly: MONETIZATION_CONFIG.checkoutUrls.therapistAnnual,
  extraChildProfile: MONETIZATION_CONFIG.checkoutUrls.extraChildMonthly,
  familyYearly: MONETIZATION_CONFIG.checkoutUrls.familyAnnual,
  familyPlan: MONETIZATION_CONFIG.checkoutUrls.familyAnnual,
  b2bTherapistPlan: MONETIZATION_CONFIG.checkoutUrls.therapistAnnual,
} as const;

export default MONETIZATION_CONFIG;
