/**
 * ΠΡΟΤΑΣΗ (βελτίωση 5 — «τιμή χωρίς παγίδες»).
 *
 * Σύνδεσμος του Stripe Customer Portal για διαχείριση / ακύρωση συνδρομής με ένα κλικ.
 * Τον παίρνετε από: Stripe Dashboard → Settings → Billing → Customer portal → «Activate link».
 * Μοιάζει με: https://billing.stripe.com/p/login/XXXXXXXX
 *
 * Όσο είναι κενό, το κουμπί ΔΕΝ εμφανίζεται. Δεν είναι μυστικό (το βλέπει κάθε πελάτης).
 */
export const BILLING_PORTAL_LOGIN_URL = '';

/** Ημέρες πριν την ανανέωση που στέλνει email το Stripe (όπως ρυθμιστεί στο Dashboard). */
export const RENEWAL_REMINDER_DAYS = 7;
