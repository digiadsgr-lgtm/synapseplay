import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hasAnalyticsConsent, loadGtmAfterConsent } from '../utils/analyticsConsent';

const GDPR_ACK_STORAGE_KEY = 'synapseplay_gdpr_consent_v1';
let memoryGdprConsentFallback: string | null = null;

export function getGdprConsentAck(): string | null {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
      return window.localStorage.getItem(GDPR_ACK_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
  return memoryGdprConsentFallback;
}

export function setGdprConsentAck(value: string): void {
  memoryGdprConsentFallback = value;
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
      window.localStorage.setItem(GDPR_ACK_STORAGE_KEY, value);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearGdprConsentAck(): void {
  memoryGdprConsentFallback = null;
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage?.removeItem === 'function') {
      window.localStorage.removeItem(GDPR_ACK_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export const GdprConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const saved = getGdprConsentAck();
    if (!saved) {
      setIsVisible(true);
    } else if (hasAnalyticsConsent(saved)) {
      loadGtmAfterConsent();
    }
  }, []);

  const handleAcceptNecessaryOnly = () => {
    setGdprConsentAck(
      JSON.stringify({
        acceptedAt: new Date().toISOString(),
        mode: 'strictly-necessary-local-only',
        analytics: false,
      })
    );
    setIsVisible(false);
  };

  const handleAcceptWithAnalytics = () => {
    setGdprConsentAck(
      JSON.stringify({
        acceptedAt: new Date().toISOString(),
        mode: 'necessary-and-analytics',
        analytics: true,
      })
    );
    loadGtmAfterConsent();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Ενημέρωση Προστασίας Δεδομένων GDPR και Τοπικής Αποθήκευσης"
      data-testid="gdpr-consent-banner"
      className="fixed bottom-4 left-4 right-4 z-40 max-w-5xl mx-auto bg-[#FAF6EE] border-2 border-[#4A6B82] rounded-3xl p-4 sm:p-5 shadow-lg text-[#2C3539]"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="font-extrabold flex items-center gap-2 text-[#2C3539]">
            <span aria-hidden="true">🛡️</span>
            <span>
              Προστασία Δεδομένων GDPR &amp; Επιλογή Στατιστικών (Privacy-by-Design)
            </span>
          </div>
          <p className="text-[#2C3539]/85 leading-relaxed">
            Το <strong>SynapsePlay</strong> (ανάπτυξη:{' '}
            <a
              href="https://digiads.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-[#4A6B82] underline underline-offset-2 hover:text-[#2C3539]"
            >
              DIGIADS
            </a>
            ) αποθηκεύει τα προφίλ και την πρόοδο των παιδιών{' '}
            <strong>αποκλειστικά τοπικά στη συσκευή σας</strong> (IndexedDB). Τα ανώνυμα στατιστικά
            επισκεψιμότητας (Google Tag Manager &amp; Vercel Analytics) ενεργοποιούνται{' '}
            <strong>μόνο αν δώσετε ρητή συγκατάθεση</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <Link
            to="/legal"
            data-testid="gdpr-banner-learn-more-link"
            className="touch-target px-4 py-2.5 rounded-2xl bg-white border-2 border-[#4A6B82] text-[#2C3539] font-extrabold text-xs text-center flex items-center justify-center hover:bg-[#EFE8D8] transition-colors"
          >
            Όροι Χρήσης &amp; GDPR
          </Link>
          <button
            type="button"
            data-testid="gdpr-banner-accept-btn"
            onClick={handleAcceptNecessaryOnly}
            className="touch-target px-4 py-2.5 rounded-2xl bg-white border-2 border-[#7A9A7B] text-[#2C3539] font-extrabold text-xs text-center flex items-center justify-center hover:bg-[#EFE8D8] transition-colors"
          >
            Μόνο τα Απαραίτητα
          </button>
          <button
            type="button"
            data-testid="gdpr-banner-accept-analytics-btn"
            onClick={handleAcceptWithAnalytics}
            className="touch-target px-5 py-2.5 rounded-2xl bg-[#7A9A7B] text-white font-extrabold text-xs text-center flex items-center justify-center hover:opacity-95 transition-opacity"
          >
            Αποδοχή &amp; Στατιστικών
          </button>
        </div>
      </div>
    </aside>
  );
};

export default GdprConsentBanner;
