import React, { useState } from 'react';
import { CheckoutLink } from './CheckoutLink';
import { useApp } from '../context/AppContext';
import { MONETIZATION_CONFIG } from '../config/monetization.config';
import { PRICE_EXTRA_CHILD_YEAR_EL, PRICE_FAMILY_YEAR_EL } from '../config/pricing';
import {
  childCodeErrorEl,
  generateSelfChildCode,
  isSelfChildCode,
  parseChildCode,
  withChildCode,
} from '../utils/childCode';
import { NoTherapistOptions } from './NoTherapistOptions';

/**
 * Οικογενειακή συνδρομή: ο κωδικός παιδιού από τον θεραπευτή είναι ΥΠΟΧΡΕΩΤΙΚΟΣ.
 * Τα κουμπιά πληρωμής ανοίγουν μόνο με έγκυρο κωδικό, ο οποίος:
 *   - αποθηκεύεται στο προφίλ του παιδιού (σύνδεση σπιτιού ↔ θεραπευτή),
 *   - περνά στο Stripe ως client_reference_id (από ποιο κέντρο ήρθε η συνδρομή).
 */
export const ChildCodeCheckout: React.FC = () => {
  const { activeProfile, updateChildProfileDetails } = useApp();
  const [draft, setDraft] = useState<string>(activeProfile.childCode ?? '');
  const [touched, setTouched] = useState(false);

  const parsed = parseChildCode(draft);
  const error = touched ? childCodeErrorEl(draft) : null;
  const code = parsed?.code ?? null;

  const handleBlur = () => {
    setTouched(true);
    if (parsed) {
      setDraft(parsed.code);
      if (parsed.code !== activeProfile.childCode) {
        void updateChildProfileDetails(activeProfile.id, { childCode: parsed.code });
      }
    }
  };

  const handleNoTherapist = () => {
    const selfCode = generateSelfChildCode();
    setDraft(selfCode);
    setTouched(true);
    void updateChildProfileDetails(activeProfile.id, { childCode: selfCode });
  };

  const familyHref = code
    ? withChildCode(MONETIZATION_CONFIG.checkoutUrls.familyAnnual, code)
    : MONETIZATION_CONFIG.checkoutUrls.familyAnnual;
  const extraHref = code
    ? withChildCode(MONETIZATION_CONFIG.checkoutUrls.extraChildMonthly, code)
    : MONETIZATION_CONFIG.checkoutUrls.extraChildMonthly;

  return (
    <div
      data-testid="child-code-checkout"
      className="p-4 rounded-2xl bg-sand-light border-2 border-sand-dark flex flex-col justify-between gap-3"
    >
      <div className="space-y-1.5">
        <h3 className="text-sm font-extrabold text-charcoal">
          👨‍👩‍👧‍👦 Οικογενειακό Πλάνο — {PRICE_FAMILY_YEAR_EL}
        </h3>
        <p className="text-xs text-charcoal-muted">
          Πλήρης πρόσβαση σε όλες τις δραστηριότητες για 1 παιδί. Κάθε επιπλέον παιδί:{' '}
          {PRICE_EXTRA_CHILD_YEAR_EL}. Η ενεργοποίηση γίνεται με τον{' '}
          <strong>κωδικό παιδιού</strong> που δίνει ο θεραπευτής, ώστε η πρόοδος στο σπίτι να
          συνδέεται με τη θεραπεία.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="child-code-input" className="block text-xs font-extrabold text-charcoal">
          Κωδικός παιδιού από τον θεραπευτή (για «{activeProfile.nickname}»):
        </label>
        <input
          id="child-code-input"
          data-testid="child-code-input"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          maxLength={14}
          placeholder="π.χ. K7QM-4HXA-R"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          aria-invalid={Boolean(error)}
          aria-describedby="child-code-help"
          className={`w-full px-4 py-2.5 rounded-xl bg-white border-2 text-sm font-extrabold tracking-widest text-charcoal ${
            error ? 'border-terracotta' : code ? 'border-sage-dark' : 'border-slate'
          }`}
        />
        <p id="child-code-help" data-testid="child-code-status" className="text-[11px] font-bold">
          {code && isSelfChildCode(code) ? (
            <span className="text-sage-dark">
              ✅ Κωδικός ενεργοποίησης χωρίς θεραπευτή. Αν αργότερα σας δώσει κωδικό θεραπευτής,
              γράψτε τον εδώ.
            </span>
          ) : code ? (
            <span className="text-sage-dark">✅ Ο κωδικός είναι σωστός.</span>
          ) : error ? (
            <span className="text-terracotta-dark">⚠️ {error}</span>
          ) : (
            <span className="text-charcoal-muted">
              Δεν έχετε κωδικό; Ζητήστε τον από τον θεραπευτή ή το κέντρο του παιδιού.
            </span>
          )}
        </p>
      </div>

      {!code && (
        <NoTherapistOptions onNoTherapist={handleNoTherapist} defaultAgeBand={activeProfile.ageBand} />
      )}

      <div className="space-y-2">
        <CheckoutLink
          href={familyHref}
          enabled={Boolean(code) && MONETIZATION_CONFIG.isMonetizationEnabled}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="stripe-family-checkout-link"
          className="touch-target w-full px-3 py-2.5 rounded-xl bg-slate text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-slate-dark transition-colors"
        >
          <span>Εγγραφή στο Οικογενειακό — {PRICE_FAMILY_YEAR_EL}</span>
          <span aria-hidden="true">↗️</span>
        </CheckoutLink>
        <CheckoutLink
          href={extraHref}
          enabled={Boolean(code) && MONETIZATION_CONFIG.isMonetizationEnabled}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="stripe-extra-profile-checkout-link"
          className="touch-target w-full px-3 py-2 rounded-xl bg-terracotta-surface/70 border border-terracotta text-charcoal font-extrabold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-terracotta hover:text-white transition-colors"
        >
          <span>➕ Επιπλέον παιδί ({PRICE_EXTRA_CHILD_YEAR_EL}) — με τον δικό του κωδικό</span>
          <span aria-hidden="true">↗️</span>
        </CheckoutLink>
        <p className="text-[11px] text-charcoal-muted">
          Για επιπλέον παιδί: επιλέξτε πρώτα το προφίλ του και γράψτε τον δικό του κωδικό.
        </p>
        {MONETIZATION_CONFIG.isMonetizationEnabled && !code && (
          <p className="text-[11px] font-bold text-charcoal-muted">
            Τα κουμπιά ενεργοποιούνται μόλις γράψετε σωστό κωδικό παιδιού.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChildCodeCheckout;
