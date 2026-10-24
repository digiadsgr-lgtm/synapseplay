import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
    }
  }, []);

  const handleAcceptNecessary = () => {
    setGdprConsentAck(
      JSON.stringify({
        acceptedAt: new Date().toISOString(),
        mode: 'strictly-necessary-local-only',
      })
    );
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
              100% Συμμόρφωση GDPR &amp; Μηδενικά Cookies Παρακολούθησης (Privacy-by-Design)
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
            ) <strong>δεν χρησιμοποιεί</strong> διαφημιστικά cookies ή trackers τρίτων. Τα προφίλ και
            η πρόοδος των παιδιών αποθηκεύονται <strong>αποκλειστικά τοπικά στη συσκευή σας</strong>{' '}
            (IndexedDB) με δυνατότητα οριστικής διαγραφής με 1 κλικ ανά πάσα στιγμή.
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
            onClick={handleAcceptNecessary}
            className="touch-target px-5 py-2.5 rounded-2xl bg-[#7A9A7B] text-white font-extrabold text-xs text-center flex items-center justify-center hover:opacity-95 transition-opacity"
          >
            Κατανοητό &amp; Συνέχεια
          </button>
        </div>
      </div>
    </aside>
  );
};

export default GdprConsentBanner;
