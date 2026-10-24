import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SynapsePlayLogoMark } from '../components/SynapsePlayLogoMark';
import { clearGdprConsentAck } from '../components/GdprConsentBanner';

export const LegalCompliancePage: React.FC = () => {
  const { settings, childProfiles, sessionLogs, feedbackEntries, wipeAllData } = useApp();
  const [wipeConfirmedMessage, setWipeConfirmedMessage] = useState<string | null>(null);

  const handleExportGdprPortabilityJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      controller: 'DIGIADS (https://digiads.gr)',
      application: 'SynapsePlay (FocusEngine 5+)',
      gdprBasis: 'Article 15 & Article 20 GDPR — Right of Access & Data Portability (Local Device Data)',
      localDeviceData: {
        settings,
        childProfiles,
        activityHistory: sessionLogs,
        feedbackNotes: feedbackEntries,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapseplay-gdpr-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGdprRightToErasure = async () => {
    await wipeAllData();
    clearGdprConsentAck();
    setWipeConfirmedMessage(
      'Όλα τα τοπικά δεδομένα της συσκευής (προφίλ, ιστορικό, ρυθμίσεις και παρατηρήσεις) διαγράφηκαν οριστικά σύμφωνα με το Άρθρο 17 του ΓΚΠΔ (Δικαίωμα στη Λήθη).'
    );
  };

  return (
    <div
      data-testid="legal-compliance-page"
      className="min-h-screen bg-[#EFE8D8] text-[#2C3539] font-sans pb-16"
    >
      {/* Top Bar */}
      <header className="border-b border-[#2C3539]/15 bg-[#FAF6EE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <SynapsePlayLogoMark sizeClassName="w-11 h-11" />
            <div>
              <span className="text-lg font-extrabold text-[#2C3539] group-hover:text-[#4A6B82] transition-colors">
                SynapsePlay
              </span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#4A6B82]/15 text-[#4A6B82] text-xs font-extrabold">
                Νομικό Κέντρο &amp; GDPR
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              data-testid="legal-back-home-link"
              className="touch-target px-4 py-2 rounded-2xl bg-white border border-[#2C3539]/20 text-xs sm:text-sm font-extrabold text-[#2C3539] hover:bg-[#EFE8D8]"
            >
              ← Αρχική Σελίδα
            </Link>
            <Link
              to="/app"
              data-testid="legal-launch-app-link"
              className="touch-target px-4 py-2 rounded-2xl bg-[#7A9A7B] text-white text-xs sm:text-sm font-extrabold hover:opacity-95"
            >
              Είσοδος στην Εφαρμογή →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero Banner */}
        <section className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7A9A7B]/20 text-xs font-extrabold text-[#2C3539]">
            <span aria-hidden="true">🛡️</span>
            <span>100% Συμμόρφωση με τον Γενικό Κανονισμό Προστασίας Δεδομένων (ΕΕ 2016/679 &amp; Ν. 4624/2019)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2C3539] tracking-tight">
            Όροι Χρήσης Ιστοσελίδας, Πολιτική Απορρήτου &amp; Πλήρης Συμμόρφωση GDPR
          </h1>
          <p className="text-sm sm:text-base text-[#2C3539]/85 leading-relaxed">
            Η διαδικτυακή εφαρμογή <strong>SynapsePlay (FocusEngine 5+)</strong> αναπτύχθηκε και
            αναπτύσσεται από την{' '}
            <a
              href="https://digiads.gr"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="legal-digiads-header-link"
              className="font-extrabold text-[#4A6B82] underline underline-offset-4 hover:text-[#2C3539]"
            >
              DIGIADS (https://digiads.gr)
            </a>{' '}
            με απόλυτη προτεραιότητα την ασφάλεια των παιδιών, την προστασία της ιδιωτικότητας από
            τον σχεδιασμό (<strong>Privacy-by-Design &amp; Privacy-by-Default</strong>, Άρθρο 25
            ΓΚΠΔ) και την πλήρη διαφάνεια απέναντι σε γονείς, κηδεμόνες και επαγγελματίες υγείας.
          </p>
          <div className="text-xs font-bold text-[#4A6B82]">
            Τελευταία Ενημέρωση: Οκτώβριος 2026 • Έκδοση Πολιτικής: 2.0 (EU/GR GDPR Compliant)
          </div>
        </section>

        {/* 1. Data Controller & Developer Identity */}
        <section
          aria-labelledby="legal-controller-heading"
          className="bg-[#FAF6EE] border-2 border-[#4A6B82]/40 rounded-3xl p-6 sm:p-8 space-y-4"
        >
          <h2 id="legal-controller-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
            1. Ταυτότητα Δημιουργού &amp; Υπευθύνου Επεξεργασίας (Data Controller)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-1.5">
              <div className="font-extrabold text-[#4A6B82]">Φορέας Ανάπτυξης &amp; Λειτουργίας</div>
              <p className="font-bold text-[#2C3539]">
                DIGIADS — Ψηφιακές Εφαρμογές &amp; Τεχνολογικές Λύσεις
              </p>
              <p>
                Επίσημη Ιστοσελίδα:{' '}
                <a
                  href="https://digiads.gr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold text-[#4A6B82] underline"
                >
                  https://digiads.gr
                </a>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFE8D8] border border-[#2C3539]/15 space-y-1.5">
              <div className="font-extrabold text-[#4A6B82]">
                Επικοινωνία Θεμάτων Προστασίας Δεδομένων (GDPR)
              </div>
              <p className="text-[#2C3539]/90">
                Για οποιοδήποτε αίτημα σχετικά με τους Όρους Χρήσης, την προστασία προσωπικών
                δεδομένων ή την άσκηση των δικαιωμάτων σας βάσει του ΓΚΠΔ, μπορείτε να
                επικοινωνήσετε μέσω της επίσημης ιστοσελίδας{' '}
                <a
                  href="https://digiads.gr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold text-[#4A6B82] underline"
                >
                  digiads.gr
                </a>{' '}
                ή μέσω της φόρμας αξιολόγησης στο Περιβάλλον Γονέα.
              </p>
            </div>
          </div>
        </section>

        {/* 2. GDPR Architecture & Children's Data Protection */}
        <section
          aria-labelledby="legal-gdpr-heading"
          className="bg-[#FAF6EE] border-2 border-[#7A9A7B] rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <h2 id="legal-gdpr-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
            2. Πολιτική Απορρήτου &amp; Αρχιτεκτονική Προστασίας Δεδομένων (GDPR)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                🔒 2.1. 100% Τοπική Αποθήκευση (Άρθρο 25 ΓΚΠΔ — Privacy-by-Design)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                Το SynapsePlay λειτουργεί με αρχιτεκτονική <strong>Local-First / Client-Side</strong>.
                Τα μικρά προφίλ των παιδιών (ψευδώνυμο, επιλεγμένο εικονίδιο avatar, ηλικιακή ομάδα
                και ιστορικό ολοκληρωμένων δραστηριοτήτων) αποθηκεύονται{' '}
                <strong>αποκλειστικά τοπικά στη συσκευή του χρήστη (IndexedDB)</strong> και{' '}
                <strong>δεν μεταδίδονται ούτε αποθηκεύονται</strong> σε κεντρικούς servers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                👶 2.2. Ειδική Προστασία Ανηλίκων (Άρθρο 8 ΓΚΠΔ &amp; Ν. 4624/2019)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                Η εφαρμογή απευθύνεται σε γονείς, κηδεμόνες και ειδικούς θεραπευτές για χρήση με
                παιδιά 4–12 ετών. Το Περιβάλλον Γονέα/Ειδικού προστατεύεται από δυναμική πύλη
                επαλήθευσης ενηλίκου. Η εφαρμογή <strong>δεν ζητά και δεν συλλέγει</strong>{' '}
                πραγματικά ονοματεπώνυμα παιδιών, φωτογραφίες, ηχογραφήσεις φωνής, στοιχεία
                τοποθεσίας (GPS) ή επαφές.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                💳 2.3. Ασφάλεια Συναλλαγών &amp; Συνδρομών (Stripe Checkout)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                Όλες οι πληρωμές συνδρομών (Οικογενειακό Πλάνο, Επιπλέον Προφίλ, Therapist Pro B2B)
                πραγματοποιούνται αποκλειστικά σε εξωτερικές, κρυπτογραφημένες σελίδες της{' '}
                <strong>Stripe (PCI-DSS Level 1 Certified)</strong>. Η εφαρμογή δεν ενσωματώνει SDKs
                παρακολούθησης πληρωμών και η DIGIADS δεν έχει ποτέ πρόσβαση σε αριθμούς καρτών.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#2C3539]/15 space-y-2">
              <h3 className="font-extrabold text-[#2C3539]">
                ✉️ 2.4. Εθελοντική Υποβολή Παρατηρήσεων &amp; Αξιολόγησης (Άρθρο 6 παρ. 1α ΓΚΠΔ)
              </h3>
              <p className="text-[#2C3539]/85 leading-relaxed">
                Στο προστατευμένο Περιβάλλον Γονέα/Ειδικού παρέχεται προαιρετική φόρμα αποστολής
                παρατηρήσεων και προτάσεων βελτίωσης. Η αποστολή γίνεται μόνο κατόπιν ρητής ενέργειας
                του ενήλικα χρήστη και τα στοιχεία χρησιμοποιούνται αποκλειστικά για την τεχνική και
                παιδαγωγική βελτίωση της εφαρμογής.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Interactive GDPR Rights Center (Articles 15, 17, 20) */}
        <section
          aria-labelledby="legal-rights-heading"
          data-testid="gdpr-rights-action-center"
          className="bg-[#FAF6EE] border-2 border-[#D97757] rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <h2 id="legal-rights-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
              3. Τα Δικαιώματά σας βάσει του GDPR (Άρθρα 15–22 ΓΚΠΔ) &amp; Άμεση Άσκηση
            </h2>
            <p className="text-sm text-[#2C3539]/85">
              Σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (ΕΕ 2016/679), έχετε δικαίωμα
              πρόσβασης (Άρθρο 15), διόρθωσης (Άρθρο 16), διαγραφής / «δικαίωμα στη λήθη» (Άρθρο 17),
              περιορισμού επεξεργασίας (Άρθρο 18) και φορητότητας των δεδομένων σας (Άρθρο 20), καθώς
              και δικαίωμα υποβολής αναφοράς στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (
              <a
                href="https://www.dpa.gr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#4A6B82] underline"
              >
                www.dpa.gr
              </a>
              ). Επειδή τα δεδομένα τηρούνται τοπικά στη συσκευή σας, μπορείτε να ασκήσετε τα
              δικαιώματα Φορητότητας και Οριστικής Διαγραφής ακαριαία παρακάτω:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="gdpr-export-data-btn"
              onClick={handleExportGdprPortabilityJson}
              className="touch-target px-5 py-3 rounded-2xl bg-[#4A6B82] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 hover:opacity-95"
            >
              <span aria-hidden="true">📥</span>
              <span>Εξαγωγή Δεδομένων Συσκευής σε JSON (Άρθρο 20 ΓΚΠΔ)</span>
            </button>

            <button
              type="button"
              data-testid="gdpr-erase-all-data-btn"
              onClick={() => void handleGdprRightToErasure()}
              className="touch-target px-5 py-3 rounded-2xl bg-[#D97757] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 hover:opacity-95"
            >
              <span aria-hidden="true">🗑️</span>
              <span>Οριστική Διαγραφή Όλων των Τοπικών Δεδομένων (Άρθρο 17 ΓΚΠΔ)</span>
            </button>
          </div>

          {wipeConfirmedMessage && (
            <div
              role="status"
              data-testid="gdpr-erase-confirmation"
              className="p-4 rounded-2xl bg-[#7A9A7B]/20 border-2 border-[#7A9A7B] text-xs sm:text-sm font-extrabold text-[#2C3539]"
            >
              ✔ {wipeConfirmedMessage}
            </div>
          )}
        </section>

        {/* 4. Terms of Use & Intellectual Property */}
        <section
          aria-labelledby="legal-terms-heading"
          className="bg-[#FAF6EE] border-2 border-[#2C3539]/20 rounded-3xl p-6 sm:p-8 space-y-4 text-sm leading-relaxed"
        >
          <h2 id="legal-terms-heading" className="text-xl sm:text-2xl font-extrabold text-[#2C3539]">
            4. Όροι Χρήσης Ιστοσελίδας &amp; Άδεια Χρήσης Εφαρμογής (Terms of Service)
          </h2>

          <div className="space-y-3 text-[#2C3539]/90">
            <p>
              <strong>4.1. Αποδοχή Όρων:</strong> Η πλοήγηση και χρήση της ιστοσελίδας και της
              εφαρμογής SynapsePlay συνεπάγεται την ανεπιφύλακτη αποδοχή των παρόντων Όρων Χρήσης από
              τον ενήλικα χρήστη (γονέα, κηδεμόνα ή επαγγελματία ειδικής αγωγής/υγείας).
            </p>
            <p>
              <strong>4.2. Δικαιώματα Πνευματικής Ιδιοκτησίας:</strong> Το σύνολο του περιεχομένου,
              ο πηγαίος κώδικας, η αρχιτεκτονική FocusEngine 5+, η μηχανή φωνητικής καθοδήγησης, τα
              σενάρια δραστηριοτήτων, τα γραφικά και τα εμπορικά σήματα του SynapsePlay αποτελούν
              πνευματική ιδιοκτησία της{' '}
              <a
                href="https://digiads.gr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#4A6B82] underline"
              >
                DIGIADS (https://digiads.gr)
              </a>{' '}
              και προστατεύονται από την ελληνική και ευρωπαϊκή νομοθεσία περί πνευματικής
              ιδιοκτησίας (Ν. 2121/1993). Απαγορεύεται η αναπαραγωγή, αντιγραφή, αποσυμπίληση ή
              εμπορική εκμετάλλευση χωρίς έγγραφη άδεια.
            </p>
            <p>
              <strong>4.3. Επίπεδα Αδειοδότησης (Οικογενειακό &amp; Επαγγελματικό B2B):</strong> Το
              Οικογενειακό Πλάνο προορίζεται αποκλειστικά για ιδιωτική οικιακή χρήση (έως 2 προφίλ
              παιδιών ανά συσκευή, με δυνατότητα προσθήκης επιπλέον προφίλ). Η χρήση σε θεραπευτήρια,
              κέντρα ειδικών θεραπειών, σχολεία ή κλινικές συνεδρίες απαιτεί την επαγγελματική άδεια{' '}
              <strong>SynapsePlay Therapist Pro (Ετήσιο B2B)</strong>.
            </p>
            <p>
              <strong>4.4. Εφαρμοστέο Δίκαιο:</strong> Οι παρόντες Όροι Χρήσης διέπονται από το
              Ελληνικό και το Ευρωπαϊκό Δίκαιο.
            </p>
          </div>
        </section>

        {/* 5. Medical & Pedagogical Disclaimer + 6. Cookies & Local Storage Table */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FAF6EE] border-2 border-[#4A6B82]/40 rounded-3xl p-6 space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C3539]">
              5. Ιατρική &amp; Παιδαγωγική Αποποίηση Ευθύνης
            </h2>
            <p className="text-[#2C3539]/90">
              Το <strong>SynapsePlay (FocusEngine 5+)</strong> είναι παιδαγωγικό και υποστηρικτικό
              ψηφιακό εργαλείο εξάσκησης εκτελεστικών λειτουργιών, παρατηρητικότητας και
              αυτορρύθμισης. <strong>Δεν αποτελεί ιατρική συσκευή (Medical Device)</strong>, δεν
              πραγματοποιεί κλινική διάγνωση ΔΕΠΥ ή άλλων αναπτυξιακών διαταραχών και{' '}
              <strong>δεν υποκαθιστά</strong> την εξατομικευμένη ιατρική, παιδοψυχιατρική,
              ψυχολογική, λογοθεραπευτική ή εργοθεραπευτική αξιολόγηση και παρέμβαση.
            </p>
          </div>

          <div className="bg-[#FAF6EE] border-2 border-[#7A9A7B]/50 rounded-3xl p-6 space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C3539]">
              6. Πολιτική Cookies &amp; Τοπικής Αποθήκευσης (ePrivacy)
            </h2>
            <p className="text-[#2C3539]/90">
              Η ιστοσελίδα <strong>δεν χρησιμοποιεί</strong> διαφημιστικά cookies, cookies
              προφίλ ή εργαλεία παρακολούθησης τρίτων (Zero Third-Party Tracking). Χρησιμοποιεί
              αποκλειστικά τεχνικά απαραίτητη τοπική αποθήκευση στον browser σας:
            </p>
            <ul className="text-xs font-bold space-y-1.5 text-[#2C3539]">
              <li>
                • <code>IndexedDB (synapseplay_db)</code>: Τοπική αποθήκευση προφίλ, ρυθμίσεων &amp;
                ιστορικού στη συσκευή.
              </li>
              <li>
                • <code>localStorage (synapseplay_gdpr_consent_v1)</code>: Απομνημόνευση ενημέρωσης
                του μηνύματος GDPR.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LegalCompliancePage;
