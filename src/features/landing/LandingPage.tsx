import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface AgePathwayItem {
  id: '4-5' | '5-6' | '6-8' | '8-10' | '10-12';
  ageLabelEl: string;
  stageTitleEl: string;
  pictogram: string;
  summaryEl: string;
  sessionSplitEl: string;
  clinicalFocusEl: string;
  sampleActivitiesEl: string[];
}

const AGE_PATHWAYS: AgePathwayItem[] = [
  {
    id: '4-5',
    ageLabelEl: '4–5 ετών',
    stageTitleEl: 'Προσχολική Αισθητηριακή & Κινητική Εστίαση',
    pictogram: '🌱',
    summaryEl: 'Μηδενικό κείμενο, μεγάλα εικονογράμματα, αισθητηριακή γείωση.',
    sessionSplitEl: "10' Συνολικά: 5' Ταμπλέτα + 3' Κίνηση στον Χώρο + 2' Smooth Landing",
    clinicalFocusEl:
      'Ακουστική και εικονογραφική καθοδήγηση χωρίς καμία απαίτηση ανάγνωσης. Μεγάλοι στόχοι αφής και άμεση σύνδεση με το σώμα.',
    sampleActivitiesEl: [
      '01. Οπτική Αναζήτηση (3 μεγάλα αντικείμενα χωρίς οπτικό θόρυβο)',
      '07. Κίνηση & Πάγωμα (Παιχνίδι Αγαλμάτων)',
      '10. Μίμηση Ζώου (Ιδιοδεκτικότητα & Ισορροπία)',
    ],
  },
  {
    id: '5-6',
    ageLabelEl: '5–6 ετών',
    stageTitleEl: 'Νηπιαγωγείο & Πρώιμη Αυτορρύθμιση',
    pictogram: '🐢',
    summaryEl: 'Ακολουθίες 2 βημάτων, οπτική σάρωση, αντικείμενα.',
    sessionSplitEl: "12' Συνολικά: 6' Ταμπλέτα + 4' Φυσική Δράση + 2' Smooth Landing",
    clinicalFocusEl:
      'Οπτική μνήμη 2 βημάτων, ακουστικές εντολές με εικονογράμματα και εκμάθηση αναμονής σήματος.',
    sampleActivitiesEl: [
      '03. Οπτική Μνήμη (Ζεύγη εικόνων με αυτόματη κάλυψη)',
      '08. Άκου & Κάνε (Εντολές 2 βημάτων)',
      '09. Περίμενε το Σήμα (Αναστολή παρόρμησης)',
    ],
  },
  {
    id: '6-8',
    ageLabelEl: '6–8 ετών',
    stageTitleEl: 'Α΄–Β΄ Δημοτικού & Δόμηση Ρουτίνας',
    pictogram: '🦉',
    summaryEl: 'Σειροθέτηση ρουτινών, ευελιξία κανόνων (χρώμα -> σχήμα).',
    sessionSplitEl: "15' Συνολικά: 8' Ταμπλέτα + 5' Φυσική Αποστολή + 2' Smooth Landing",
    clinicalFocusEl:
      'Οργάνωση καθημερινών ρουτινών 3 βημάτων, γνωστική ευελιξία (αλλαγή κανόνα) και σύνδεση με πραγματικά αντικείμενα του σπιτιού.',
    sampleActivitiesEl: [
      '05. Σειρά Βημάτων (Πρωινή & Σχολική Ρουτίνα)',
      '06. Αλλαγή Κανόνα (Εναλλαγή Χρώματος -> Σχήματος)',
      '11. Αποστολή στον Χώρο (Φυσικά αντικείμενα)',
    ],
  },
  {
    id: '8-10',
    ageLabelEl: '8–10 ετών',
    stageTitleEl: 'Γ΄–Δ΄ Δημοτικού & Εργαζόμενη Μνήμη',
    pictogram: '🦊',
    summaryEl: 'Σύνθετη σειριακή μνήμη, επιλεκτική προσοχή υπό περισπασμό.',
    sessionSplitEl: "18' Συνολικά: 10' Ταμπλέτα + 5' Κατασκευή/Κίνηση + 3' Smooth Landing",
    clinicalFocusEl:
      'Εργαζόμενη μνήμη 4 στοιχείων, εντοπισμός λεπτομερειών και έλεγχος παρορμητικότητας σε γρήγορη ροή ερεθισμάτων.',
    sampleActivitiesEl: [
      '02. Βρες τη Διαφορά (Σύνθετη οπτική σύγκριση)',
      '04. Μνήμη Ακολουθίας (Σειριακή ανάκληση μοτίβων)',
      '12. Χτίσε το Μοτίβο (Αρχιτεκτονική ακολουθιών)',
    ],
  },
  {
    id: '10-12',
    ageLabelEl: '10–12 ετών',
    stageTitleEl: 'Ε΄–ΣΤ΄ Δημοτικού & Μεταγνωστική Αυτονομία',
    pictogram: '🐬',
    summaryEl: 'Μεταγνώση, στρατηγικός σχεδιασμός πολλαπλών βημάτων.',
    sessionSplitEl: "20' Συνολικά: 12' Ταμπλέτα + 5' Φυσική Εφαρμογή + 3' Smooth Landing",
    clinicalFocusEl:
      'Αυτοπαρατήρηση στρατηγικής («Τι με βοήθησε σήμερα;»), εσωτερικός λόγος (Inner Speech) και αυτόνομος σχεδιασμός μελέτης.',
    sampleActivitiesEl: [
      '06. Αλλαγή Κανόνα (Ταχεία γνωστική μετατόπιση)',
      '09. Περίμενε το Σήμα (Συνεχής προσοχή CPT)',
      '11. Αποστολή στον Χώρο (Οργάνωση γραφείου & μελέτης)',
    ],
  },
];

const CORE_PILLARS = [
  {
    groupCode: 'Ομάδα Α',
    titleEl: 'Ομάδα Α: Detective Eyes',
    subtitleEl: 'Οπτική Παρατηρητικότητα & Επιλεκτική Εστίαση',
    pictogram: '🔍',
    borderClass: 'border-[#7A9A7B]',
    badgeBgClass: 'bg-[#7A9A7B]/15 text-[#2C3539]',
    descriptionEl:
      'Εξάσκηση συστηματικής οπτικής σάρωσης και φιλτραρίσματος περισπασμών σε ήρεμο, καθαρό φόντο.',
    activitiesEl: [
      '01. Οπτική Αναζήτηση (Visual Search)',
      '02. Βρες τη Διαφορά (Spot the Difference)',
      '03. Οπτική Μνήμη (Visual Memory)',
    ],
  },
  {
    groupCode: 'Ομάδα Β',
    titleEl: 'Ομάδα Β: Think & Plan',
    subtitleEl: 'Μνήμη Εργασίας & Καθημερινές Ρουτίνες',
    pictogram: '🧩',
    borderClass: 'border-[#4A6B82]',
    badgeBgClass: 'bg-[#4A6B82]/15 text-[#2C3539]',
    descriptionEl:
      'Ενίσχυση της σειριακής μνήμης εργασίας, της οργάνωσης βημάτων ρουτίνας και της γνωστικής ευελιξίας.',
    activitiesEl: [
      '04. Μνήμη Ακολουθίας (Sequence Memory)',
      '05. Σειρά Βημάτων (Order the Steps)',
      '06. Αλλαγή Κανόνα (Switch the Rule)',
    ],
  },
  {
    groupCode: 'Ομάδα Γ',
    titleEl: 'Ομάδα Γ: Pause & Choose',
    subtitleEl: 'Αυτορρύθμιση & Αναστολή Παρόρμησης',
    pictogram: '🛑',
    borderClass: 'border-[#D97757]',
    badgeBgClass: 'bg-[#D97757]/15 text-[#2C3539]',
    descriptionEl:
      'Εκπαίδευση του μηχανισμού «Σταματώ – Παρατηρώ – Επιλέγω» (Go/No-Go) χωρίς ποινές ή αγχωτικά χρονόμετρα.',
    activitiesEl: [
      '07. Κίνηση & Πάγωμα (Move & Freeze)',
      '08. Άκου & Κάνε (Listen & Do)',
      '09. Περίμενε το Σήμα (Wait for the Signal)',
    ],
  },
  {
    groupCode: 'Ομάδα Δ',
    titleEl: 'Ομάδα Δ: Move & Build',
    subtitleEl: 'Ήπια Κίνηση & Κατασκευές στον Φυσικό Χώρο',
    pictogram: '🌿',
    borderClass: 'border-[#7A9A7B]',
    badgeBgClass: 'bg-[#7A9A7B]/20 text-[#2C3539]',
    descriptionEl:
      'Μεταφορά της συγκέντρωσης από την οθόνη στο σώμα, την ιδιοδεκτικότητα και τα πραγματικά αντικείμενα του δωματίου.',
    activitiesEl: [
      '10. Μίμηση Ζώου (Copy the Animal)',
      '11. Αποστολή στον Χώρο (Real-World Mission)',
      '12. Χτίσε το Μοτίβο (Build the Pattern)',
    ],
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAgeId, setSelectedAgeId] = useState<AgePathwayItem['id']>('6-8');
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  const activeAgePathway =
    AGE_PATHWAYS.find((item) => item.id === selectedAgeId) ?? AGE_PATHWAYS[2];

  const handleSmoothScroll = (sectionId: string) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div
      data-testid="landing-page"
      className="min-h-screen bg-[#EFE8D8] text-[#2C3539] font-sans selection:bg-[#7A9A7B]/30"
    >
      {/* Top Marketing Navigation Bar */}
      <nav
        aria-label="Πλοήγηση Παρουσίασης SynapsePlay"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#2C3539]/10"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-11 h-11 rounded-2xl bg-[#7A9A7B] text-white flex items-center justify-center text-2xl shadow-sm"
          >
            🌱
          </span>
          <div>
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-[#2C3539]">
              SynapsePlay
            </span>
            <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold">
              FocusEngine 5+
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleSmoothScroll('pillars')}
            className="touch-target px-4 py-2 rounded-2xl bg-white/70 border border-[#2C3539]/15 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-white transition-colors"
          >
            Οι 4 Πυλώνες
          </button>
          <button
            type="button"
            onClick={() => handleSmoothScroll('pricing')}
            className="touch-target px-4 py-2 rounded-2xl bg-white/70 border border-[#2C3539]/15 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-white transition-colors"
          >
            Πλάνα & Κέντρα ΔΕΠΥ
          </button>
          <button
            type="button"
            data-testid="landing-nav-launch-app-btn"
            onClick={() => navigate('/app')}
            className="touch-target px-5 py-2.5 rounded-2xl bg-[#D97757] text-white text-xs sm:text-sm font-extrabold shadow-sm hover:opacity-95 transition-opacity"
          >
            Είσοδος στην Εφαρμογή →
          </button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section
        aria-labelledby="landing-hero-heading"
        data-testid="landing-hero-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 md:py-16"
      >
        <div className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm space-y-8">
          <div className="max-w-3xl space-y-5">
            <span
              data-testid="landing-hero-badge"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7A9A7B]/20 border border-[#7A9A7B] text-xs sm:text-sm font-extrabold text-[#2C3539]"
            >
              <span aria-hidden="true">🧠</span>
              <span>Επιστημονικά Τεκμηριωμένη Εξάσκηση Εκτελεστικών Λειτουργιών</span>
            </span>

            <h1
              id="landing-hero-heading"
              data-testid="landing-hero-headline"
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2C3539] leading-tight tracking-tight"
            >
              Από την οθόνη στην πράξη. Βοηθήστε το παιδί σας να συγκεντρώνεται χωρίς οθονικό
              εθισμό.
            </h1>

            <p
              data-testid="landing-hero-subtitle"
              className="text-base sm:text-lg md:text-xl text-[#2C3539]/85 leading-relaxed font-medium"
            >
              Μια ήρεμη, ψηφιακή γέφυρα για παιδιά 4–12 ετών (με έμφαση στη ΔΕΠΥ). Εξάσκηση
              παρατηρητικότητας, μνήμης και αυτορρύθμισης με μηδενική ματαίωση και ομαλή επιστροφή
              στον φυσικό κόσμο.
            </p>
          </div>

          {/* Call to Action (CTA) Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link
              to="/app"
              data-testid="hero-primary-cta-btn"
              className="touch-target px-8 py-4 rounded-2xl bg-[#D97757] text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-sm hover:opacity-95 transition-opacity"
            >
              <span>Δοκιμάστε το Δωρεάν (Beta)</span>
              <span aria-hidden="true">▶️</span>
            </Link>

            <a
              href="#pillars"
              data-testid="hero-secondary-cta-btn"
              onClick={(e) => {
                e.preventDefault();
                handleSmoothScroll('pillars');
              }}
              className="touch-target px-7 py-4 rounded-2xl bg-white border-2 border-[#4A6B82] text-[#2C3539] font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-[#4A6B82]/10 transition-colors"
            >
              <span>Πώς Λειτουργεί</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div
            data-testid="landing-trust-badges"
            className="pt-4 border-t border-[#2C3539]/15 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm font-extrabold text-[#2C3539]"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EFE8D8] border border-[#2C3539]/15">
              <span aria-hidden="true">🔒</span>
              <span>100% Client-Side & Local</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EFE8D8] border border-[#2C3539]/15">
              <span aria-hidden="true">🌿</span>
              <span>Χωρίς Διαφημίσεις</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EFE8D8] border border-[#2C3539]/15">
              <span aria-hidden="true">📱</span>
              <span>Σχεδιασμένο για Tablet</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM WE SOLVE (The Gap) */}
      <section
        aria-labelledby="landing-problem-heading"
        data-testid="landing-problem-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold uppercase tracking-wider">
            Γιατί Διαφέρει το SynapsePlay
          </span>
          <h2
            id="landing-problem-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#2C3539]"
          >
            Το Κενό που Καλύπτουμε: Ήρεμη Εξάσκηση Αντί για Υπερδιέγερση
          </h2>
          <p className="text-sm sm:text-base text-[#2C3539]/80">
            Σχεδιασμένο ειδικά για τον νευροδιαφορετικό εγκέφαλο, με σεβασμό στον ρυθμό του παιδιού
            και την ηρεμία της οικογένειας.
          </p>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-[#FAF6EE] border-2 border-[#2C3539]/15 rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#D97757]/15 border border-[#D97757] flex items-center justify-center text-3xl">
              🧘
            </div>
            <h3 className="text-xl font-extrabold text-[#2C3539]">Όχι άλλο Zombie Scrolling</h3>
            <p className="text-sm sm:text-base text-[#2C3539]/85 leading-relaxed">
              Τα κοινά παιχνίδια υπερφορτώνουν τον εγκέφαλο με ντοπαμίνη και φανταχτερά εφέ,
              οδηγώντας σε εκρήξεις θυμού (meltdowns).
            </p>
          </article>

          <article className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#7A9A7B]/20 border border-[#7A9A7B] flex items-center justify-center text-3xl">
              💡
            </div>
            <h3 className="text-xl font-extrabold text-[#2C3539]">
              Μηδενική Τιμωρία (No Game Over)
            </h3>
            <p className="text-sm sm:text-base text-[#2C3539]/85 leading-relaxed">
              Αντί για απογοήτευση και χαμένους βαθμούς, το παιδί λαμβάνει κλιμακωτή βοήθεια και
              ενθάρρυνση της προσπάθειας.
            </p>
          </article>

          <article className="bg-[#FAF6EE] border-2 border-[#4A6B82] rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#4A6B82]/15 border border-[#4A6B82] flex items-center justify-center text-3xl">
              🏡
            </div>
            <h3 className="text-xl font-extrabold text-[#2C3539]">
              Σύνδεση με τον Πραγματικό Χώρο
            </h3>
            <p className="text-sm sm:text-base text-[#2C3539]/85 leading-relaxed">
              Οι δεξιότητες δεν μένουν στην οθόνη — μεταφέρονται σε φυσικά αντικείμενα, ρουτίνες και
              ασφαλείς κινήσεις.
            </p>
          </article>
        </div>

        {/* Structured Comparison Table */}
        <div className="bg-[#FAF6EE] border-2 border-[#2C3539]/15 rounded-3xl p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#2C3539]/15 text-[#2C3539] font-extrabold">
                <th className="py-3 px-3">Κριτήριο Σχεδιασμού</th>
                <th className="py-3 px-3 text-[#2C3539]/70">Συμβατικά Παιδικά Apps</th>
                <th className="py-3 px-3 text-[#4A6B82]">SynapsePlay (FocusEngine 5+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3539]/10">
              <tr>
                <td className="py-3 px-3 font-extrabold">Οπτικά & Ηχητικά Ερεθίσματα</td>
                <td className="py-3 px-3 text-[#2C3539]/75">
                  Έντονα χρώματα neon, γρήγορες εναλλαγές, σειρήνες
                </td>
                <td className="py-3 px-3 font-bold text-[#2C3539]">
                  Γήινη παλέτα (Soft Sage & Warm Sand), ήρεμη ελληνική εκφώνηση
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-extrabold">Διαχείριση Λάθους</td>
                <td className="py-3 px-3 text-[#2C3539]/75">
                  «Game Over», κόκκινο Χ, απώλεια πόντων, ματαίωση
                </td>
                <td className="py-3 px-3 font-bold text-[#2C3539]">
                  Κλιμακωτή Βοήθεια 2 επιπέδων (Hint Ladder) & απορρόφηση διπλών κλικ (400ms)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-extrabold">Κλείσιμο Οθόνης</td>
                <td className="py-3 px-3 text-[#2C3539]/75">
                  Απότομη διακοπή ή ατέρμονο παιχνίδι (meltdowns)
                </td>
                <td className="py-3 px-3 font-bold text-[#2C3539]">
                  Module 13 Smooth Landing (προετοιμασία 2 λεπτά πριν & μετάβαση στο δωμάτιο)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. THE 4 PILLARS & 12 ACTIVITIES (#pillars) */}
      <section
        id="pillars"
        aria-labelledby="landing-pillars-heading"
        data-testid="landing-pillars-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8 scroll-mt-16"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#7A9A7B]/20 text-[#2C3539] text-xs font-extrabold uppercase tracking-wider">
            Δομημένο Παιδαγωγικό Πρόγραμμα
          </span>
          <h2
            id="landing-pillars-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#2C3539]"
          >
            Οι 4 Πυλώνες Εκτελεστικών Λειτουργιών & οι 12 Βασικές Δραστηριότητες
          </h2>
          <p className="text-sm sm:text-base text-[#2C3539]/80">
            Κάθε ομάδα στοχεύει σε έναν θεμελιώδη τομέα συγκέντρωσης, μνήμης εργασίας και
            αυτορρύθμισης, εμπλουτισμένο με διεπιστημονικά πρωτόκολλα.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_PILLARS.map((pillar) => (
            <div
              key={pillar.groupCode}
              data-testid={`landing-pillar-${pillar.groupCode}`}
              className={`bg-[#FAF6EE] border-2 ${pillar.borderClass} rounded-3xl p-6 space-y-4 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl" aria-hidden="true">
                    {pillar.pictogram}
                  </span>
                  <div>
                    <span
                      className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold ${pillar.badgeBgClass}`}
                    >
                      {pillar.groupCode}
                    </span>
                    <h3 className="text-xl font-extrabold text-[#2C3539] mt-0.5">
                      {pillar.titleEl}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-[#4A6B82]">
                      {pillar.subtitleEl}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#2C3539]/85 leading-relaxed">{pillar.descriptionEl}</p>

              <ul className="space-y-1.5 pt-1">
                {pillar.activitiesEl.map((act) => (
                  <li
                    key={act}
                    className="px-3.5 py-2 rounded-xl bg-[#EFE8D8] text-xs sm:text-sm font-bold text-[#2C3539] flex items-center gap-2"
                  >
                    <span aria-hidden="true" className="text-[#7A9A7B]">
                      ✓
                    </span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Feature Callout: Module 13 Smooth Landing Protocol */}
        <div
          data-testid="landing-smooth-landing-callout"
          className="bg-[#4A6B82] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-4xl shrink-0"
            >
              🌅
            </span>
            <div className="space-y-1.5">
              <span className="inline-block px-3 py-0.5 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-wider">
                Αποκλειστική Καινοτομία
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Module 13: Smooth Landing Protocol
              </h3>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
                Ομαλή προετοιμασία λήξης 2 λεπτά πριν, ώστε το κλείσιμο της οθόνης να μην είναι πια
                πεδίο μάχης. Χωρίς αγχωτικό ψηφιακό χρονόμετρο — μόνο ένας ήρεμος οπτικός δακτύλιος
                και ήπια μετάβαση σε δραστηριότητες του πραγματικού κόσμου.
              </p>
            </div>
          </div>

          <Link
            to="/app"
            className="touch-target px-6 py-3.5 rounded-2xl bg-[#D97757] text-white font-extrabold text-sm sm:text-base shrink-0 hover:opacity-95 transition-opacity"
          >
            Δοκιμάστε το Smooth Landing →
          </Link>
        </div>
      </section>

      {/* 4. AGE-APPROPRIATE PATHWAYS (4–12 Ετών) */}
      <section
        aria-labelledby="landing-ages-heading"
        data-testid="landing-age-pathways-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold uppercase tracking-wider">
            Εξατομίκευση ανά Ηλικία
          </span>
          <h2
            id="landing-ages-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#2C3539]"
          >
            Ηλικιακά Μονοπάτια Προσαρμογής (4–12 Ετών)
          </h2>
          <p className="text-sm sm:text-base text-[#2C3539]/80">
            Το SynapsePlay προσαρμόζει αυτόματα την οπτική πυκνότητα, τον χρόνο συνεδρίας και το
            επίπεδο δυσκολίας στην αναπτυξιακή βαθμίδα του παιδιού:
          </p>
        </div>

        {/* Interactive Age Tabs */}
        <div
          role="tablist"
          aria-label="Επιλογή Ηλικιακής Ομάδας"
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          {AGE_PATHWAYS.map((item) => {
            const isSelected = item.id === selectedAgeId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`landing-age-tab-${item.id}`}
                onClick={() => setSelectedAgeId(item.id)}
                className={`touch-target px-5 py-3 rounded-2xl border-2 font-extrabold text-sm flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-[#7A9A7B] text-white border-[#2C3539]'
                    : 'bg-[#FAF6EE] text-[#2C3539] border-[#2C3539]/20 hover:bg-white'
                }`}
              >
                <span aria-hidden="true">{item.pictogram}</span>
                <span>{item.ageLabelEl}</span>
              </button>
            );
          })}
        </div>

        {/* Active Age Pathway Detail Card */}
        <div
          data-testid="landing-active-age-card"
          className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center shadow-sm"
        >
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7A9A7B]/20 text-xs font-extrabold text-[#2C3539]">
              {activeAgePathway.pictogram} {activeAgePathway.ageLabelEl} —{' '}
              {activeAgePathway.stageTitleEl}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
              {activeAgePathway.summaryEl}
            </h3>
            <p className="text-sm sm:text-base text-[#2C3539]/85 leading-relaxed">
              {activeAgePathway.clinicalFocusEl}
            </p>
            <div className="p-3.5 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 text-xs sm:text-sm font-extrabold text-[#4A6B82]">
              ⏳ Προτεινόμενη Δομή Συνεδρίας: {activeAgePathway.sessionSplitEl}
            </div>
          </div>

          <div className="bg-white border border-[#2C3539]/15 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#4A6B82]">
              Ενδεικτικές Προσαρμοσμένες Δραστηριότητες ({activeAgePathway.ageLabelEl}):
            </p>
            <ul className="space-y-2">
              {activeAgePathway.sampleActivitiesEl.map((act) => (
                <li
                  key={act}
                  className="p-3 rounded-xl bg-[#FAF6EE] border border-[#2C3539]/10 text-xs sm:text-sm font-bold text-[#2C3539]"
                >
                  {act}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compact All-5-Ages Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {AGE_PATHWAYS.map((item) => (
            <div
              key={item.id}
              data-testid={`landing-age-summary-card-${item.id}`}
              className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#2C3539]/15 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#2C3539]">{item.ageLabelEl}</span>
                <span className="text-xl" aria-hidden="true">
                  {item.pictogram}
                </span>
              </div>
              <p className="text-xs text-[#2C3539]/85 font-medium leading-relaxed">
                {item.summaryEl}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRICING & LICENSING PLANS (#pricing) */}
      <section
        id="pricing"
        aria-labelledby="landing-pricing-heading"
        data-testid="landing-pricing-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8 scroll-mt-16"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span
            data-testid="landing-beta-free-badge"
            className="inline-block px-4 py-1.5 rounded-full bg-[#D97757]/20 border border-[#D97757] text-[#2C3539] text-xs sm:text-sm font-extrabold"
          >
            🎉 Τρέχουσα Φάση: Δωρεάν Δοκιμαστική Πρόσβαση (Beta) για Όλους!
          </span>
          <h2
            id="landing-pricing-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#2C3539]"
          >
            Πλάνα Διάθεσης για Οικογένειες & Θεραπευτικά Κέντρα
          </h2>
          <p className="text-sm sm:text-base text-[#2C3539]/80">
            Κατά την τρέχουσα περίοδο δοκιμών (Beta), όλες οι λειτουργίες και τα προφίλ είναι 100%
            ξεκλείδωτα και δωρεάν.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan 1: Family Plan */}
          <div
            data-testid="landing-plan-family"
            className="bg-[#FAF6EE] border-2 border-[#4A6B82] rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold">
                  Για Γονείς & Σπίτι
                </span>
                <span className="text-3xl" aria-hidden="true">
                  👨‍👩‍👧‍👦
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-[#2C3539]">Family Plan (Οικογενειακό)</h3>
              <p className="text-sm text-[#2C3539]/80">
                Ιδανικό για καθημερινή, ήρεμη εξάσκηση στο σπίτι με αυτόματη προσαρμογή στην ηλικία
                και τον ρυθμό του παιδιού.
              </p>

              <ul className="space-y-2.5 pt-2 text-sm font-bold text-[#2C3539]">
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7A9A7B]" aria-hidden="true">
                    ✔
                  </span>
                  <span>Έως 2 Προφίλ Παιδιών</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7A9A7B]" aria-hidden="true">
                    ✔
                  </span>
                  <span>Και οι 12 δραστηριότητες ξεκλείδωτες (+ εμπλουτισμένες ενότητες)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7A9A7B]" aria-hidden="true">
                    ✔
                  </span>
                  <span>Smooth Landing & Parent Analytics</span>
                </li>
              </ul>
            </div>

            <Link
              to="/app"
              data-testid="landing-family-start-btn"
              className="touch-target w-full py-4 px-6 rounded-2xl bg-[#D97757] text-white font-extrabold text-base text-center flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              <span>Έναρξη Χρήσης</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Plan 2: Therapist & Clinical License (B2B) */}
          <div
            data-testid="landing-plan-b2b"
            className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#7A9A7B]/25 text-[#2C3539] text-xs font-extrabold">
                  B2B / Κλινική Άδεια
                </span>
                <span className="text-3xl" aria-hidden="true">
                  🏥
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-[#2C3539]">
                Therapist & Clinical License (B2B)
              </h3>
              <p className="text-sm font-bold text-[#4A6B82]">
                Για Εργοθεραπευτές, Λογοθεραπευτές & Κέντρα Ειδικών Θεραπειών
              </p>

              <ul className="space-y-2.5 pt-2 text-sm font-bold text-[#2C3539]">
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7A9A7B]" aria-hidden="true">
                    ✔
                  </span>
                  <span>Για Εργοθεραπευτές, Λογοθεραπευτές & Κέντρα Ειδικών Θεραπειών</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7A9A7B]" aria-hidden="true">
                    ✔
                  </span>
                  <span>Απεριόριστα Προφίλ Παιδιών & Γρήγορος Profile Switcher</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[#7A9A7B]" aria-hidden="true">
                    ✔
                  </span>
                  <span>Εξαγωγή Αναφορών Παρατήρησης για τον Φάκελο του Παιδιού</span>
                </li>
              </ul>
            </div>

            <Link
              to="/parent"
              data-testid="landing-b2b-contact-btn"
              className="touch-target w-full py-4 px-6 rounded-2xl bg-[#7A9A7B] text-white font-extrabold text-base text-center flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              <span>Επικοινωνία / Επαγγελματική Άδεια</span>
              <span aria-hidden="true">🔑</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. PRIVACY & SAFETY COMMITMENT */}
      <section
        aria-labelledby="landing-privacy-heading"
        data-testid="landing-privacy-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12"
      >
        <div className="bg-[#FAF6EE] border-2 border-[#4A6B82] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2
              id="landing-privacy-heading"
              className="text-2xl sm:text-3xl font-extrabold text-[#2C3539]"
            >
              Δέσμευση Ιδιωτικότητας & Παιδαγωγικής Ασφάλειας
            </h2>
            <p className="text-sm text-[#2C3539]/80">
              Σχεδιασμένο με την αρχή Privacy-by-Design για την απόλυτη προστασία των παιδιών.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-2">
              <div className="text-3xl" aria-hidden="true">
                🛡️
              </div>
              <h3 className="text-lg font-extrabold text-[#2C3539]">Zero Cloud Tracking</h3>
              <p className="text-sm text-[#2C3539]/85">
                Όλα τα δεδομένα μένουν αποκλειστικά στο tablet σας.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-2">
              <div className="text-3xl" aria-hidden="true">
                🗑️
              </div>
              <h3 className="text-lg font-extrabold text-[#2C3539]">
                Πλήρης Διαγραφή με 1 Κλικ
              </h3>
              <p className="text-sm text-[#2C3539]/85">
                Ο γονέας έχει τον απόλυτο έλεγχο.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-2">
              <div className="text-3xl" aria-hidden="true">
                ⚖️
              </div>
              <h3 className="text-lg font-extrabold text-[#2C3539]">Επιστημονική Ειλικρίνεια</h3>
              <p className="text-sm text-[#2C3539]/85">
                Εργαλείο εξάσκησης, όχι ιατρική διάγνωση ή υποκατάστατο θεραπείας.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer
        data-testid="landing-footer"
        className="border-t-2 border-[#2C3539]/15 bg-[#FAF6EE] mt-8"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-bold text-[#2C3539]">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🌱</span>
            <span>© SynapsePlay — FocusEngine 5+</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/app"
              data-testid="footer-link-app"
              className="touch-target px-3 py-1.5 rounded-xl hover:bg-[#EFE8D8] underline underline-offset-4"
            >
              Σύνδεση στην Εφαρμογή
            </Link>
            <Link
              to="/parent"
              data-testid="footer-link-parent"
              className="touch-target px-3 py-1.5 rounded-xl hover:bg-[#EFE8D8] underline underline-offset-4"
            >
              Περιβάλλον Γονέα
            </Link>
            <button
              type="button"
              data-testid="footer-link-terms"
              onClick={() => setShowTermsModal((v) => !v)}
              className="touch-target px-3 py-1.5 rounded-xl hover:bg-[#EFE8D8] underline underline-offset-4"
            >
              Όροι Χρήσης & Ιδιωτικότητα
            </button>
          </div>
        </div>

        {showTermsModal && (
          <div
            role="region"
            aria-label="Όροι Χρήσης και Ιδιωτικότητα"
            data-testid="landing-terms-panel"
            className="max-w-6xl mx-auto px-4 sm:px-6 pb-8"
          >
            <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/20 text-xs text-[#2C3539] space-y-2">
              <p className="font-extrabold">
                Όροι Χρήσης & Πολιτική Ιδιωτικότητας (Privacy-by-Design):
              </p>
              <p>
                Το SynapsePlay (FocusEngine 5+) είναι παιδαγωγικό εργαλείο εξάσκησης εκτελεστικών
                λειτουργιών και αυτορρύθμισης. Δεν αποτελεί ιατρική συσκευή, διαγνωστικό μέσο ή
                υποκατάστατο εξατομικευμένης κλινικής θεραπείας. Όλα τα προφίλ και τα στατιστικά
                αποθηκεύονται αποκλειστικά τοπικά στη συσκευή (IndexedDB) και διαγράφονται ανά πάσα
                στιγμή με 1 κλικ από το Περιβάλλον Γονέα.
              </p>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default LandingPage;
