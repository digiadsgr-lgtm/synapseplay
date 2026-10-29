import React from 'react';

/**
 * Οργάνωση της Περιοχής Γονέων σε δύο ρόλους, με λίγες καρτέλες ο καθένας.
 * Καμία ενότητα δεν σβήστηκε: κάθε μία ανήκει σε μία (ή δύο) καρτέλες.
 */

export type DashboardMode = 'parent' | 'therapist';

export type DashboardTab =
  | 'today'
  | 'progress'
  | 'settings'
  | 'subscription'
  | 'guide'
  | 't-children'
  | 't-home'
  | 't-history'
  | 't-clinical'
  | 't-feedback';

export type DashboardSection =
  | 'presets'
  | 'session-settings'
  | 'subscription'
  | 'home-practice'
  | 'share-progress'
  | 'pilot-feedback'
  | 'profiles'
  | 'pro-tools'
  | 'therapist-home'
  | 'history'
  | 'device'
  | 'protocols'
  | 'engine'
  | 'studies'
  | 'activity-guide';

export const TABS: Record<DashboardMode, { id: DashboardTab; labelEl: string; hintEl: string }[]> = {
  parent: [
    { id: 'today', labelEl: '🏠 Σήμερα', hintEl: 'Τι χρειάζεται τώρα: πρόγραμμα, αποστολές, αποστολή προόδου' },
    { id: 'progress', labelEl: '📈 Πρόοδος', hintEl: 'Τι έπαιξε το παιδί και πώς πάει' },
    { id: 'settings', labelEl: '⚙️ Παιδιά & ρυθμίσεις', hintEl: 'Προφίλ, χρόνος οθόνης, φωνή, προσβασιμότητα' },
    { id: 'subscription', labelEl: '🔑 Συνδρομή', hintEl: 'Κωδικός παιδιού, ενεργοποίηση, πληρωμή' },
    { id: 'guide', labelEl: '📚 Οδηγός', hintEl: 'Τα παιχνίδια, η συσκευή, σχόλια προς εμάς' },
  ],
  therapist: [
    { id: 't-children', labelEl: '👧 Παιδιά & κωδικοί', hintEl: 'Προφίλ, κωδικοί παιδιού, αναφορές PDF/CSV, αντίγραφα' },
    { id: 't-home', labelEl: '📋 Πρόγραμμα & σπίτι', hintEl: 'Συνταγή με QR, πρόοδος από γονείς' },
    { id: 't-history', labelEl: '📊 Ιστορικό', hintEl: 'Όλες οι καταγραφές της συσκευής' },
    { id: 't-clinical', labelEl: '🩺 Κλινικό υλικό', hintEl: 'Πρωτόκολλα, προσαρμογή, βιβλιογραφία, οδηγός παιχνιδιών' },
    { id: 't-feedback', labelEl: '💬 Σχόλια', hintEl: 'Παρατηρήσεις πιλοτικής δοκιμής' },
    { id: 'subscription', labelEl: '🔑 Άδεια', hintEl: 'Άδεια κέντρου (B2B)' },
  ],
};

/** Σε ποιες καρτέλες εμφανίζεται κάθε ενότητα. */
export const SECTION_TABS: Record<DashboardSection, DashboardTab[]> = {
  presets: ['settings'],
  'session-settings': ['settings'],
  subscription: ['subscription'],
  'home-practice': ['today'],
  'share-progress': ['today'],
  'pilot-feedback': ['guide', 't-feedback'],
  profiles: ['settings', 't-children'],
  'pro-tools': ['t-children'],
  'therapist-home': ['t-home'],
  history: ['progress', 't-history'],
  device: ['guide'],
  protocols: ['t-clinical'],
  engine: ['t-clinical'],
  studies: ['t-clinical'],
  'activity-guide': ['guide', 't-clinical'],
};

const MODE_KEY = 'synapseplay_dashboard_mode';

export function rememberedMode(): DashboardMode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'therapist' ? 'therapist' : 'parent';
  } catch {
    return 'parent';
  }
}

export function rememberMode(mode: DashboardMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    // αγνοούμε
  }
}

/** Αρχική καρτέλα από τη διεύθυνση (επιστροφή από Stripe, σύνδεσμοι προγράμματος/προόδου, #subscription). */
export function initialNav(loc: { search: string; hash: string }): { mode: DashboardMode; tab: DashboardTab } {
  const q = new URLSearchParams(loc.search);
  const incoming = q.get('incoming');
  if (incoming === 'plan') return { mode: 'parent', tab: 'today' };
  if (incoming === 'progress') return { mode: 'therapist', tab: 't-home' };
  const mode = rememberedMode();
  if (q.get('checkout_session') || q.get('license') || loc.hash === '#subscription') {
    return { mode, tab: 'subscription' };
  }
  return { mode, tab: TABS[mode][0].id };
}

export const DashboardNav: React.FC<{
  mode: DashboardMode;
  tab: DashboardTab;
  onMode: (m: DashboardMode) => void;
  onTab: (t: DashboardTab) => void;
}> = ({ mode, tab, onMode, onTab }) => {
  const tabs = TABS[mode];
  const current = tabs.find((t) => t.id === tab);
  return (
    <nav
      aria-label="Ενότητες Περιοχής Γονέων"
      data-testid="dashboard-nav"
      className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-sand/95 backdrop-blur border-b-2 border-sand-dark space-y-2"
    >
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ρόλος">
        {(
          [
            ['parent', '👨‍👩‍👧 Γονιός'],
            ['therapist', '🩺 Θεραπευτής / κέντρο'],
          ] as [DashboardMode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            data-testid={`dashboard-mode-${m}`}
            onClick={() => onMode(m)}
            className={`touch-target px-4 py-2 rounded-2xl border-2 text-sm font-extrabold ${
              mode === m ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-sand-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tablist" aria-label="Καρτέλες" className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`dashboard-tab-${t.id}`}
            onClick={() => onTab(t.id)}
            className={`shrink-0 px-3 py-2 rounded-xl border-2 text-sm font-bold ${
              tab === t.id ? 'bg-sage-dark text-white border-sage-dark' : 'bg-white text-charcoal border-sand-dark'
            }`}
          >
            {t.labelEl}
          </button>
        ))}
      </div>
      {current && (
        <p className="text-xs text-charcoal-muted" data-testid="dashboard-tab-hint">
          {current.hintEl}
        </p>
      )}
    </nav>
  );
};
