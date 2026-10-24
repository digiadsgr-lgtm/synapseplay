import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ACTIVITIES } from '../data/activitiesCatalog';
import { AGE_BAND_PROTOCOLS, type AgeBandId, getAgeBandProtocol } from '../data/ageProtocols';
import { getPersonalizedActivityRecommendation } from '../utils/childProfileLearningEngine';
import { speakGreek } from '../utils/soundAndSpeech';

interface BeginnerQuickStartModalProps {
  onClose: () => void;
}

export const BeginnerQuickStartModal: React.FC<BeginnerQuickStartModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { settings, updateSettings, activeProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'steps' | 'faq'>('steps');

  const recommendation = getPersonalizedActivityRecommendation(activeProfile, ACTIVITIES);
  const currentAgeBand: AgeBandId = settings.ageBand ?? activeProfile.ageBand ?? '6-8';

  const handleQuickAgeChange = (bandId: AgeBandId) => {
    const proto = getAgeBandProtocol(bandId);
    void updateSettings({
      ageBand: bandId,
      sessionLimitMinutes: proto.recommendedTotalMinutes,
      warningWindowMinutes: proto.smoothLandingMinutes,
    });
    speakGreek(
      `Επιλέχθηκε η ηλικία ${proto.labelEl}. Ο χρόνος και η δυσκολία προσαρμόστηκαν αυτόματα!`,
      settings.voiceEnabled,
      activeProfile.learnedModel.optimalSpeechRate
    );
  };

  const handleStartRecommendedNow = () => {
    onClose();
    navigate(`/activity/${recommendation.activity.id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="beginner-guide-modal-title"
      data-testid="beginner-quick-start-modal"
      className="fixed inset-0 z-50 bg-charcoal/70 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="max-w-2xl w-full bg-sand-light border-4 border-sage rounded-3xl p-6 space-y-5 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">🧭</span>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-sage-surface border border-sage text-[11px] font-extrabold text-sage-dark">
                Απλός Οδηγός για Αρχάριους Γονείς & Παιδιά
              </span>
              <h2
                id="beginner-guide-modal-title"
                className="text-xl md:text-2xl font-extrabold text-charcoal"
              >
                Πώς χρησιμοποιούμε το SynapsePlay σε 3 Απλά Βήματα
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-beginner-guide-btn"
            aria-label="Κλείσιμο οδηγού"
            className="touch-target px-3.5 py-2 rounded-2xl bg-white border-2 border-charcoal/20 font-extrabold text-charcoal hover:bg-sand-dark"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher + Audio Narration Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-sand-dark pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="beginner-tab-steps"
              onClick={() => setActiveTab('steps')}
              className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-extrabold border-2 transition-colors ${
                activeTab === 'steps'
                  ? 'bg-sage-dark text-white border-sage-dark'
                  : 'bg-white text-charcoal border-sand-dark hover:bg-sand'
              }`}
            >
              1-2-3 Πώς Ξεκινάμε
            </button>
            <button
              type="button"
              data-testid="beginner-tab-faq"
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-extrabold border-2 transition-colors ${
                activeTab === 'faq'
                  ? 'bg-sage-dark text-white border-sage-dark'
                  : 'bg-white text-charcoal border-sand-dark hover:bg-sand'
              }`}
            >
              ❓ Συχνές Ερωτήσεις Γονέων
            </button>
          </div>

          <button
            type="button"
            data-testid="speak-beginner-guide-btn"
            onClick={() =>
              speakGreek(
                'Καλώς ήρθατε στο SynapsePlay! Βήμα πρώτο: Διαλέξτε την ηλικία του παιδιού. Βήμα δεύτερο: Πατήστε το πράσινο κουμπί για να παίξετε το σημερινό παιχνίδι των πέντε λεπτών. Βήμα τρίτο: Όταν τελειώσει ο χρόνος, η οθόνη ξεκουράζεται ήρεμα χωρίς καβγά!',
                true,
                activeProfile.learnedModel.optimalSpeechRate
              )
            }
            className="touch-target px-3.5 py-2 rounded-2xl bg-white border-2 border-sage text-charcoal font-extrabold text-xs flex items-center gap-1.5 hover:bg-sage-surface"
          >
            <span aria-hidden="true">🔊</span>
            <span>Άκου τον Οδηγό</span>
          </button>
        </div>

        {activeTab === 'steps' ? (
          <div className="space-y-4">
            {/* Step 1: Pick Age right here */}
            <div className="p-4 rounded-2xl bg-white border-2 border-sage space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-sage-dark text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  1
                </span>
                <h3 className="text-base font-extrabold text-charcoal">
                  Διαλέξτε την Ηλικία του Παιδιού (όλα ρυθμίζονται αυτόματα!)
                </h3>
              </div>
              <p className="text-xs md:text-sm text-charcoal-muted">
                Δεν χρειάζεται να ρυθμίσετε τίποτα δύσκολο. Πατήστε την ηλικία του παιδιού σας και η
                εφαρμογή προσαρμόζει μόνη της τη δυσκολία, τη φωνή και τον χρόνο:
              </p>
              <div className="flex flex-wrap gap-2 pt-1" data-testid="modal-quick-age-selector">
                {AGE_BAND_PROTOCOLS.map((proto) => {
                  const isActive = currentAgeBand === proto.id;
                  return (
                    <button
                      key={proto.id}
                      type="button"
                      data-testid={`modal-age-btn-${proto.id}`}
                      onClick={() => handleQuickAgeChange(proto.id)}
                      className={`px-3.5 py-2 rounded-xl border-2 text-xs font-extrabold transition-all ${
                        isActive
                          ? 'bg-sage-dark text-white border-charcoal shadow-sm scale-[1.02]'
                          : 'bg-sand-light text-charcoal border-sand-dark hover:bg-sand'
                      }`}
                    >
                      {isActive ? '✓ ' : ''}
                      {proto.labelEl} ({proto.recommendedTotalMinutes} λεπτά)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Start 1 Daily Game */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-slate text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  2
                </span>
                <h3 className="text-base font-extrabold text-charcoal">
                  Παίξτε 1 ή 2 Παιχνίδια την Ημέρα (5–10 λεπτά αρκούν)
                </h3>
              </div>
              <p className="text-xs md:text-sm text-charcoal-muted">
                Κάθε παιχνίδι έχει <strong>φωνητική καθοδήγηση στα Ελληνικά (🔊)</strong> και{' '}
                <strong>εικόνες βήμα-βήμα</strong>. Δεν υπάρχει «έχασες», ούτε αγχωτικό χρονόμετρο. Αν
                το παιδί μπερδευτεί, πατάει το κουμπί <strong>«💡 Βοήθεια»</strong>!
              </p>
            </div>

            {/* Step 3: Smooth Landing */}
            <div className="p-4 rounded-2xl bg-white border-2 border-terracotta space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-terracotta text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  3
                </span>
                <h3 className="text-base font-extrabold text-charcoal">
                  Ήρεμο Κλείσιμο Οθόνης χωρίς Καβγά (Smooth Landing)
                </h3>
              </div>
              <p className="text-xs md:text-sm text-charcoal-muted">
                Ο πράσινος κύκλος στην κορυφή δείχνει ήρεμα πόση ενέργεια απομένει. 2 λεπτά πριν το
                τέλος, η εφαρμογή προειδοποιεί γλυκά το παιδί ώστε να κλείσει την οθόνη μόνο του, με
                χαμόγελο!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs md:text-sm text-charcoal" data-testid="beginner-faq-list">
            <div className="p-3.5 rounded-2xl bg-white border border-sand-dark space-y-1">
              <p className="font-extrabold text-sage-dark">
                ❓ Πρέπει να κάθομαι δίπλα στο παιδί όταν παίζει;
              </p>
              <p className="text-charcoal-muted">
                Για ηλικίες <strong>4–6 ετών</strong> προτείνουμε να είστε δίπλα του τις πρώτες 2–3
                φορές. Για ηλικίες <strong>6–12 ετών</strong> το παιδί μπορεί να παίξει αυτόνομα χάρη
                στις φωνητικές οδηγίες (🔊) και τις εικόνες.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-sand-dark space-y-1">
              <p className="font-extrabold text-sage-dark">
                ❓ Από ποιο παιχνίδι είναι καλύτερο να ξεκινήσουμε σήμερα;
              </p>
              <p className="text-charcoal-muted">
                Η εφαρμογή διαλέγει αυτόματα το ιδανικό παιχνίδι στην κάρτα{' '}
                <strong>«🌟 Προσωπική Πρόταση»</strong> στην αρχική οθόνη. Πατήστε απλώς{' '}
                <strong>«▶️ Παίξε Τώρα»</strong>!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-sand-dark space-y-1">
              <p className="font-extrabold text-sage-dark">
                ❓ Πώς μπαίνω στις Ρυθμίσεις Γονέων (🔒 Γονείς);
              </p>
              <p className="text-charcoal-muted">
                Πατήστε το κουμπί <strong>«🔒 Γονείς»</strong> πάνω δεξιά και απαντήστε στην απλή
                πράξη (υπάρχει ώστε να μην αλλάζει το παιδί μόνο του τον χρόνο). Εκεί θα βρείτε και{' '}
                <strong>Έτοιμα Πακέτα Ρυθμίσεων με 1 Κλικ</strong>!
              </p>
            </div>
          </div>
        )}

        {/* Footer CTA buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sand-dark">
          <button
            type="button"
            onClick={onClose}
            className="touch-target px-5 py-2.5 rounded-2xl bg-white border-2 border-slate text-charcoal font-extrabold text-sm hover:bg-slate-surface"
          >
            Κατάλαβα, Κλείσιμο
          </button>

          <button
            type="button"
            data-testid="modal-start-recommended-btn"
            onClick={handleStartRecommendedNow}
            className="touch-target px-6 py-3 rounded-2xl bg-sage-dark text-white font-extrabold text-sm flex items-center gap-2 hover:bg-sage shadow-sm"
          >
            <span aria-hidden="true">▶️</span>
            <span>Ξεκίνα το Σημερινό Παιχνίδι ({recommendation.activity.titleEl})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
