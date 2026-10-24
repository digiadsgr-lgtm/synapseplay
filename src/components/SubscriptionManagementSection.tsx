import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MONETIZATION_CONFIG } from '../config/monetization.config';

export const SubscriptionManagementSection: React.FC = () => {
  const { settings, licenseState, childProfiles, activateLicenseKey } = useApp();
  const [keyInput, setKeyInput] = useState<string>(settings.licenseKey ?? '');
  const [statusFeedback, setStatusFeedback] = useState<{
    valid: boolean;
    messageEl: string;
  } | null>(null);

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await activateLicenseKey(keyInput);
    setStatusFeedback({ valid: res.valid, messageEl: res.messageEl });
    if (res.valid) {
      setKeyInput(res.normalizedKey);
    }
  };

  const handleQuickActivate = async (sampleKey: string) => {
    setKeyInput(sampleKey);
    const res = await activateLicenseKey(sampleKey);
    setStatusFeedback({ valid: res.valid, messageEl: res.messageEl });
  };

  return (
    <section
      data-testid="subscription-management-section"
      className="bg-white border-2 border-slate rounded-3xl p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-charcoal flex items-center gap-2">
            <span aria-hidden="true">🔑</span>
            <span>Διαχείριση Συνδρομής</span>
          </h2>
          <p className="text-sm text-charcoal-muted">
            Διαχείριση άδειας χρήσης, ενεργοποίηση κωδικού (Οικογενειακό ή Επαγγελματικό B2B
            Κέντρων/Θεραπευτών) και εξωτερικοί σύνδεσμοι Stripe.
          </p>
        </div>

        <div
          data-testid="subscription-current-status"
          className={`px-4 py-2 rounded-2xl border-2 text-xs md:text-sm font-extrabold flex items-center gap-2 ${
            licenseState.isB2BPlanActive
              ? 'bg-sage-dark text-white border-sage-dark'
              : licenseState.isFamilyPlanActive
              ? 'bg-slate text-white border-slate-dark'
              : 'bg-sage-surface text-charcoal border-sage'
          }`}
        >
          <span aria-hidden="true">
            {licenseState.isB2BPlanActive ? '🏥' : licenseState.isFamilyPlanActive ? '👨‍👩‍👧‍👦' : '🔓'}
          </span>
          <span>Κατάσταση: {licenseState.statusLabelEl}</span>
        </div>
      </div>

      {/* Summary of Active Limits */}
      <div className="p-4 rounded-2xl bg-sand-light border border-sand-dark text-xs text-charcoal flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-extrabold">Ενεργά Προφίλ στη Συσκευή: </span>
          <span>
            {childProfiles.length} /{' '}
            {licenseState.maxProfiles === null
              ? 'Απεριόριστα'
              : `${licenseState.maxProfiles} (Όριο Οικογενειακού Πλάνου)`}
          </span>
        </div>
        <div className="font-bold text-charcoal-muted">
          Paywall Mode:{' '}
          <span className="text-charcoal font-extrabold">
            {MONETIZATION_CONFIG.isMonetizationEnabled
              ? 'PRODUCTION (Ενεργό)'
              : 'DEVELOPMENT (100% Δωρεάν & Ξεκλείδωτο)'}
          </span>
        </div>
      </div>

      {/* License Key Input Form */}
      <form
        onSubmit={(e) => void handleActivateSubmit(e)}
        data-testid="license-key-activation-form"
        className="p-4 rounded-2xl bg-slate-surface/50 border border-slate/40 space-y-3"
      >
        <label htmlFor="license-key-input" className="block text-sm font-extrabold text-charcoal">
          Κωδικός Ενεργοποίησης (License Key):
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="license-key-input"
            data-testid="license-key-input"
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="π.χ. FAMILY-2026 ή B2B-CLINIC-2026"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
          />
          <button
            type="submit"
            data-testid="activate-license-key-btn"
            className="touch-target px-5 py-2.5 rounded-xl bg-sage-dark text-white font-extrabold text-sm hover:bg-sage shrink-0"
          >
            Ενεργοποίηση Κωδικού
          </button>
        </div>

        {/* Quick Local Mode Switchers for Testing / Clinical Demo */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-charcoal-muted">
            Γρήγορη Τοπική Δοκιμή Πλάνων:
          </span>
          <button
            type="button"
            data-testid="simulate-family-plan-btn"
            onClick={() => void handleQuickActivate('FAMILY-2026')}
            className="px-3 py-1 rounded-xl bg-white border border-slate text-xs font-extrabold text-charcoal hover:bg-sand"
          >
            👨‍👩‍👧‍👦 Δοκιμή Family Plan (Έως 2 Προφίλ)
          </button>
          <button
            type="button"
            data-testid="simulate-b2b-plan-btn"
            onClick={() => void handleQuickActivate('B2B-CLINIC-2026')}
            className="px-3 py-1 rounded-xl bg-white border border-sage-dark text-xs font-extrabold text-charcoal hover:bg-sage-surface"
          >
            🏥 Δοκιμή B2B / Θεραπευτή (Απεριόριστα)
          </button>
          {!licenseState.isDevUnlocked && (
            <button
              type="button"
              data-testid="reset-dev-unlocked-btn"
              onClick={() => void handleQuickActivate('DEV')}
              className="px-3 py-1 rounded-xl bg-sand-light border border-charcoal/30 text-xs font-bold text-charcoal"
            >
              🔓 Επαναφορά Δοκιμαστικής Έκδοσης
            </button>
          )}
        </div>

        {statusFeedback && (
          <div
            role="status"
            data-testid="license-key-feedback-banner"
            className={`p-3 rounded-xl border text-xs font-extrabold ${
              statusFeedback.valid
                ? 'bg-sage-surface border-sage text-charcoal'
                : 'bg-terracotta-surface border-terracotta text-charcoal'
            }`}
          >
            {statusFeedback.messageEl}
          </div>
        )}
      </form>

      {/* External Stripe Hosted Checkout Links (No embedded payment SDKs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-sand-light border-2 border-sand-dark flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-charcoal">
              👨‍👩‍👧‍👦 Οικογενειακό Πλάνο (SynapsePlay Family)
            </h3>
            <p className="text-xs text-charcoal-muted">
              Πλήρης πρόσβαση σε όλες τις δραστηριότητες και έως 2 ανεξάρτητα προφίλ παιδιών στη
              συσκευή (4,99€ / μήνα ή 39,99€ / έτος), με δυνατότητα προσθήκης επιπλέον προφίλ (1,99€
              / μήνα).
            </p>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={MONETIZATION_CONFIG.checkoutUrls.familyMonthly}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="stripe-family-monthly-checkout-link"
                className="touch-target px-3 py-2.5 rounded-xl bg-white border-2 border-slate text-charcoal font-extrabold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-slate hover:text-white transition-colors"
              >
                <span>Εγγραφή στο Οικογενειακό — Μηνιαίο (4,99€)</span>
                <span aria-hidden="true">↗️</span>
              </a>
              <a
                href={MONETIZATION_CONFIG.checkoutUrls.familyAnnual}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="stripe-family-checkout-link"
                className="touch-target px-3 py-2.5 rounded-xl bg-slate text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-slate-dark transition-colors"
              >
                <span>Εγγραφή στο Οικογενειακό — Ετήσιο (39,99€)</span>
                <span aria-hidden="true">↗️</span>
              </a>
            </div>
            <a
              href={MONETIZATION_CONFIG.checkoutUrls.extraChildMonthly}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="stripe-extra-profile-checkout-link"
              className="touch-target w-full px-3 py-2 rounded-xl bg-terracotta-surface/70 border border-terracotta text-charcoal font-extrabold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-terracotta hover:text-white transition-colors"
            >
              <span>➕ Επιπλέον Προφίλ Παιδιού (1,99€ / μήνα)</span>
              <span aria-hidden="true">↗️</span>
            </a>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sage-surface/60 border-2 border-sage flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-charcoal">
              🏥 SynapsePlay Therapist Pro — Ετήσιο B2B (299,00€ / έτος)
            </h3>
            <p className="text-xs text-charcoal-muted">
              Επαγγελματική άδεια για Εργοθεραπευτές, Λογοθεραπευτές &amp; Κέντρα ΔΕΠΥ: Απεριόριστα
              προφίλ παιδιών και γρήγορη «Εναλλαγή Παιδιού» μεταξύ των συνεδριών.
            </p>
          </div>
          <a
            href={MONETIZATION_CONFIG.checkoutUrls.therapistAnnual}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="stripe-b2b-checkout-link"
            className="touch-target px-4 py-3 rounded-xl bg-sage-dark text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 hover:bg-sage transition-colors"
          >
            <span>Απόκτηση Άδειας Θεραπευτή (B2B — 299,00€ / έτος)</span>
            <span aria-hidden="true">↗️</span>
          </a>
        </div>
      </div>
    </section>
  );
};
