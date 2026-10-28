import React, { useState } from 'react';
import { CheckoutLink } from '../components/CheckoutLink';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ACTIVITIES } from '../data/activitiesCatalog';
import {
  AGE_BAND_PROTOCOLS,
  DEVICE_STRATEGY_SUMMARY,
  getAgeBandProtocol,
  type AgeBandId,
} from '../data/ageProtocols';
import { INTERDISCIPLINARY_PROTOCOLS } from '../data/interdisciplinaryProtocols';
import { ADAPTIVE_SCENARIO_CATALOG } from '../utils/adaptiveScenarioEngine';
import { CLINICAL_STUDIES_AND_TRIALS } from '../utils/clinicalAdhdEngine';
import {
  AVATAR_PRESETS,
  DOMAIN_LABELS_EL,
  evaluateChildAvatarProgress,
  type ClinicalDomainKey,
} from '../utils/childProfileLearningEngine';
import { getActiveGreekVoiceLabel, speakGreek } from '../utils/soundAndSpeech';
import { ParentGateModal } from '../components/ParentGateModal';
import { ClinicalFeedbackSection } from '../components/ClinicalFeedbackSection';
import { SubscriptionManagementSection } from '../components/SubscriptionManagementSection';
import { ProfessionalToolsSection } from '../components/ProfessionalToolsSection';
import { MONETIZATION_CONFIG } from '../config/monetization.config';
import { PRICE_B2B_YEAR_EL, PRICE_EXTRA_CHILD_YEAR_EL } from '../config/pricing';
import { ShareProgressWithTherapist } from '../components/ShareProgressWithTherapist';
import { formatLogAccuracy, summarizeRecentAccuracy } from '../utils/progressMetrics';

export const ParentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    settings,
    updateSettings,
    licenseState,
    profileCreationPermission,
    childProfiles,
    activeProfile,
    switchChildProfile,
    createChildProfile,
    deleteChildProfile,
    sessionLogs,
    wipeAllData,
    elapsedSeconds,
    isParentUnlocked,
    setParentUnlocked,
    simulateTimeStateForDemo,
  } = useApp();

  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipeDoneMessage, setWipeDoneMessage] = useState(false);
  const [parentNewProfileName, setParentNewProfileName] = useState('');
  const [parentNewProfileAge, setParentNewProfileAge] = useState<AgeBandId>('6-8');
  const [parentNewProfileAvatar, setParentNewProfileAvatar] = useState('🦊');
  const [showParentFamilyLimitNotice, setShowParentFamilyLimitNotice] = useState(false);
  const [appliedPresetNotice, setAppliedPresetNotice] = useState<string | null>(null);

  // Enforce accidental-access barrier even on direct URL navigation to /parent
  if (!isParentUnlocked) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12" data-testid="parent-locked-barrier">
        <h1 className="sr-only">Πίνακας Γονέων &amp; Θεραπευτών — SynapsePlay</h1>
        <ParentGateModal
          onSuccess={() => setParentUnlocked(true)}
          onCancel={() => navigate('/app')}
        />
      </main>
    );
  }

  const handleWipeConfirm = async () => {
    await wipeAllData();
    setConfirmWipe(false);
    setWipeDoneMessage(true);
  };

  const handleExitToChild = () => {
    setParentUnlocked(false);
    navigate('/app');
  };

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const activeAgeProtocol = getAgeBandProtocol(settings.ageBand ?? '6-8');

  const handleSelectAgeBand = (bandId: AgeBandId) => {
    const proto = getAgeBandProtocol(bandId);
    void updateSettings({
      ageBand: bandId,
      sessionLimitMinutes: proto.recommendedTotalMinutes,
      warningWindowMinutes: proto.smoothLandingMinutes,
    });
  };

  const handleApplySmartPreset = (presetId: 'calm-preschool' | 'school-focus' | 'bedtime-winddown') => {
    if (presetId === 'calm-preschool') {
      void updateSettings({
        ageBand: '4-5',
        sessionLimitMinutes: 12,
        warningWindowMinutes: 2,
        voiceEnabled: true,
        soundEnabled: true,
        seatedModeDefault: true,
        reducedMotion: false,
      });
      setAppliedPresetNotice('✅ Εφαρμόστηκε το πακέτο «🌱 Ήρεμο Ξεκίνημα (4–6 ετών)»: 12 λεπτά, Φωνή Ενεργή & Καθιστή Εκδοχή.');
    } else if (presetId === 'school-focus') {
      void updateSettings({
        ageBand: '6-8',
        sessionLimitMinutes: 15,
        warningWindowMinutes: 2,
        voiceEnabled: true,
        soundEnabled: true,
        seatedModeDefault: false,
        reducedMotion: false,
      });
      setAppliedPresetNotice('✅ Εφαρμόστηκε το πακέτο «🎒 Καθημερινή Σχολική Εστίαση (6–9 ετών)»: 15 λεπτά, Φωνή & Ήρεμοι Ήχοι Ενεργοί.');
    } else {
      void updateSettings({
        sessionLimitMinutes: 10,
        warningWindowMinutes: 2,
        voiceEnabled: true,
        soundEnabled: true,
        seatedModeDefault: true,
        reducedMotion: true,
      });
      setAppliedPresetNotice('✅ Εφαρμόστηκε το πακέτο «🌙 Χαλάρωση Πριν από τον Ύπνο»: 10 λεπτά, Μειωμένη Κίνηση & Καθιστή Εκδοχή.');
    }
  };

  const handleParentCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileCreationPermission.allowed) {
      setShowParentFamilyLimitNotice(true);
      return;
    }
    const presetName =
      AVATAR_PRESETS.find((p) => p.emoji === parentNewProfileAvatar)?.defaultNameEl ??
      'Μικρός Εξερευνητής';
    const created = await createChildProfile({
      nickname: parentNewProfileName.trim() || presetName,
      avatarEmoji: parentNewProfileAvatar,
      ageBand: parentNewProfileAge,
    });
    if (!created) {
      setShowParentFamilyLimitNotice(true);
      return;
    }
    setParentNewProfileName('');
    setShowParentFamilyLimitNotice(false);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-8" data-testid="parent-dashboard-page">
      {/* Header & Non-Medical Notice */}
      <section className="bg-sand-light border-2 border-slate rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal">
              Πίνακας Γονέων & Παιδαγωγών
            </h1>
            <p className="text-sm text-charcoal-muted">
              Ρυθμίσεις συνεδρίας, προσβασιμότητα, ιστορικό εξάσκησης και πλήρης έλεγχος τοπικών
              δεδομένων.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExitToChild}
            data-testid="parent-back-to-child-btn"
            className="touch-target px-5 py-3 rounded-2xl bg-sage-dark text-white font-extrabold flex items-center gap-2 hover:bg-sage"
          >
            <span aria-hidden="true">🧒</span>
            <span>Επιστροφή στο Περιβάλλον Παιδιού</span>
          </button>
        </div>

        {/* B2B / Therapist Quick Profile Switcher ("Εναλλαγή Παιδιού") between Clinical Sessions */}
        {licenseState.showTherapistQuickSwitcher && (
          <div
            data-testid="therapist-quick-profile-switcher"
            className="p-4 rounded-2xl bg-sage-surface border-2 border-sage-dark flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">🏥</span>
              <div>
                <p className="text-xs md:text-sm font-extrabold text-charcoal">
                  Εναλλαγή Παιδιού (Κλινική Συνεδρία B2B / Θεραπευτή)
                </p>
                <p className="text-[11px] text-charcoal-muted">
                  Ενεργό Παιδί: <strong>{activeProfile.nickname}</strong> ({activeProfile.ageBand}{' '}
                  ετών)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="therapist-quick-switcher-select" className="text-xs font-extrabold text-charcoal">
                Εναλλαγή Παιδιού:
              </label>
              <select
                id="therapist-quick-switcher-select"
                data-testid="therapist-quick-switcher-select"
                value={activeProfile.id}
                onChange={(e) => void switchChildProfile(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border-2 border-sage-dark text-xs font-extrabold text-charcoal"
              >
                {childProfiles.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.avatarEmoji} {prof.nickname} ({prof.ageBand} ετών)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-surface border border-slate text-xs md:text-sm text-charcoal space-y-1">
          <p className="font-extrabold">
            ⚖️ Παιδαγωγική Δήλωση & Προστασία Ιδιωτικότητας (Privacy-by-Design):
          </p>
          <p>
            Το SynapsePlay είναι εκπαιδευτικό εργαλείο ενίσχυσης της εκτελεστικής λειτουργίας και
            αυτορρύθμισης.{' '}
            <strong>
              Δεν αποτελεί ιατρική συσκευή, διαγνωστικό τεστ ή κλινική θεραπεία ΔΕΠΥ.
            </strong>{' '}
            Τα προφίλ και η πρόοδος των παιδιών αποθηκεύονται αποκλειστικά τοπικά στη συσκευή σας
            (IndexedDB) και δεν αποστέλλονται πουθενά. Χωρίς διαφημίσεις· στατιστικά επισκεψιμότητας
            μόνο αν τα έχετε αποδεχτεί.
          </p>
        </div>
      </section>

      {/* Smart 1-Click Beginner Presets for Parents */}
      <section
        aria-label="Έτοιμες Ρυθμίσεις με 1 Κλικ για Αρχάριους Γονείς"
        data-testid="parent-smart-presets-section"
        className="bg-white border-2 border-sage rounded-3xl p-6 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-sage-surface border border-sage text-[11px] font-extrabold text-sage-dark mb-1">
              ⚡ Εύκολη Ρύθμιση για Αρχάριους Γονείς
            </span>
            <h2 className="text-xl font-extrabold text-charcoal">
              Έτοιμα Πακέτα Ρυθμίσεων με 1 Κλικ (Χωρίς ψάξιμο!)
            </h2>
            <p className="text-xs md:text-sm text-charcoal-muted">
              Πατήστε αυτό που σας ταιριάζει τώρα και όλες οι ρυθμίσεις (χρόνος, ηλικία, φωνή, κίνηση)
              μπαίνουν αυτόματα:
            </p>
          </div>
          <button
            type="button"
            data-testid="quick-reset-timer-top-btn"
            onClick={() => {
              simulateTimeStateForDemo('normal');
              setAppliedPresetNotice('✅ Ο σημερινός χρόνος μηδενίστηκε! Το παιδί έχει ξανά πλήρη συνεδρία.');
            }}
            className="touch-target px-4 py-2.5 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold text-xs flex items-center gap-1.5 hover:bg-sage hover:text-white"
          >
            <span aria-hidden="true">🔄</span>
            <span>Μηδενισμός Σημερινού Χρόνου</span>
          </button>
        </div>

        {appliedPresetNotice && (
          <div
            role="status"
            data-testid="smart-preset-applied-banner"
            className="p-3.5 rounded-2xl bg-sage-surface border-2 border-sage-dark text-xs md:text-sm font-extrabold text-charcoal"
          >
            {appliedPresetNotice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            data-testid="smart-preset-calm-preschool"
            onClick={() => handleApplySmartPreset('calm-preschool')}
            className="touch-target text-left p-4 rounded-2xl bg-sand-light border-2 border-sand-dark hover:border-sage-dark hover:bg-sage-surface/50 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">🌱</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-sage text-[11px] font-extrabold text-sage-dark">
                12 λεπτά • 4–6 ετών
              </span>
            </div>
            <p className="text-sm font-extrabold text-charcoal">Ήρεμο Ξεκίνημα (Προσχολική)</p>
            <p className="text-xs text-charcoal-muted">
              Αργή καθαρή φωνή, μεγάλες εικόνες, καθιστή εκδοχή και ήρεμη προειδοποίηση 2 λεπτά πριν.
            </p>
          </button>

          <button
            type="button"
            data-testid="smart-preset-school-focus"
            onClick={() => handleApplySmartPreset('school-focus')}
            className="touch-target text-left p-4 rounded-2xl bg-sand-light border-2 border-sand-dark hover:border-sage-dark hover:bg-sage-surface/50 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">🎒</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate text-[11px] font-extrabold text-slate-dark">
                15 λεπτά • 6–9 ετών
              </span>
            </div>
            <p className="text-sm font-extrabold text-charcoal">Καθημερινή Σχολική Εστίαση</p>
            <p className="text-xs text-charcoal-muted">
              Ιδανικό πριν από το απογευματινό διάβασμα: 15 λεπτά συγκέντρωσης, μνήμης και αυτορρύθμισης.
            </p>
          </button>

          <button
            type="button"
            data-testid="smart-preset-bedtime-winddown"
            onClick={() => handleApplySmartPreset('bedtime-winddown')}
            className="touch-target text-left p-4 rounded-2xl bg-sand-light border-2 border-sand-dark hover:border-sage-dark hover:bg-sage-surface/50 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">🌙</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-terracotta text-[11px] font-extrabold text-terracotta-dark">
                10 λεπτά • Χαλάρωση
              </span>
            </div>
            <p className="text-sm font-extrabold text-charcoal">Χαλάρωση Πριν από τον Ύπνο</p>
            <p className="text-xs text-charcoal-muted">
              Μειωμένη κίνηση οθόνης, καθιστή εκδοχή και γρήγορη αποφόρτιση για ήρεμο ύπνο.
            </p>
          </button>
        </div>
      </section>

      {/* Session Time Limit & Smooth Landing Controls */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-sand-dark rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-charcoal flex items-center gap-2">
            <span aria-hidden="true">⏳</span>
            <span>Όριο Συνεδρίας & Smooth Landing (Module 13)</span>
          </h2>
          <p className="text-sm text-charcoal-muted">
            Σημερινός χρόνος χρήσης:{' '}
            <strong>
              {elapsedMinutes} λεπτά ({elapsedSeconds} δευτ.)
            </strong>
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-charcoal">
              Ηλικιακή Ομάδα & Κλινικό Πρωτόκολλο (4–12 Ετών):
            </label>
            <div className="flex flex-wrap gap-2" data-testid="age-band-selector">
              {AGE_BAND_PROTOCOLS.map((proto) => (
                <button
                  key={proto.id}
                  type="button"
                  data-testid={`age-band-btn-${proto.id}`}
                  onClick={() => handleSelectAgeBand(proto.id)}
                  aria-pressed={activeAgeProtocol.id === proto.id}
                  className={`touch-target px-3.5 py-2 rounded-2xl border-2 text-xs font-extrabold ${
                    activeAgeProtocol.id === proto.id
                      ? 'bg-sage-dark text-white border-sage-dark'
                      : 'bg-sand-light text-charcoal border-sand-dark hover:bg-sand'
                  }`}
                >
                  {proto.labelEl} ({proto.recommendedTotalMinutes}&apos;)
                </button>
              ))}
            </div>
            <div
              data-testid="active-age-protocol-summary"
              className="p-3 rounded-2xl bg-sage-surface border border-sage text-xs text-charcoal space-y-1"
            >
              <p className="font-extrabold">
                {activeAgeProtocol.labelEl} — {activeAgeProtocol.stageEl}: Split{' '}
                {activeAgeProtocol.digitalMinutes}&apos; Ψηφιακό + {activeAgeProtocol.physicalMinutes}
                &apos; Φυσική Δράση + {activeAgeProtocol.smoothLandingMinutes}&apos; Smooth Landing
              </p>
              <p>{activeAgeProtocol.clinicalGoalEl}</p>
              <p className="text-charcoal-muted">{activeAgeProtocol.specialistProtocolEl}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-charcoal">
              Μέγιστη Διάρκεια Συνεδρίας (Λεπτά):
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 12, 15, 18, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  data-testid={`limit-mins-btn-${mins}`}
                  onClick={() => void updateSettings({ sessionLimitMinutes: mins })}
                  aria-pressed={settings.sessionLimitMinutes === mins}
                  className={`touch-target px-4 py-2 rounded-2xl border-2 font-extrabold ${
                    settings.sessionLimitMinutes === mins
                      ? 'bg-slate text-white border-slate-dark'
                      : 'bg-sand-light text-charcoal border-sand-dark hover:bg-sand'
                  }`}
                >
                  {mins} λεπτά
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-charcoal">
              Προειδοποίηση Πριν από τη Λήξη (Λεπτά):
            </label>
            <div className="flex flex-wrap gap-2">
              {[2, 5].map((warnMins) => (
                <button
                  key={warnMins}
                  type="button"
                  data-testid={`warning-mins-btn-${warnMins}`}
                  onClick={() => void updateSettings({ warningWindowMinutes: warnMins })}
                  aria-pressed={settings.warningWindowMinutes === warnMins}
                  className={`touch-target px-4 py-2 rounded-2xl border-2 font-extrabold ${
                    settings.warningWindowMinutes === warnMins
                      ? 'bg-slate text-white border-slate-dark'
                      : 'bg-sand-light text-charcoal border-sand-dark hover:bg-sand'
                  }`}
                >
                  {warnMins} λεπτά πριν
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-2 border-t border-sand-dark">
            <p className="text-xs font-bold text-charcoal-muted">
              Δοκιμή Καταστάσεων Ομαλής Μετάβασης (Smooth Landing):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="simulate-normal-time-btn"
                onClick={() => simulateTimeStateForDemo('normal')}
                className="touch-target px-3 py-2 rounded-xl bg-sage-surface border border-sage text-xs font-bold text-charcoal"
              >
                🌿 Επαναφορά Χρόνου
              </button>
              <button
                type="button"
                data-testid="simulate-warning-time-btn"
                onClick={() => simulateTimeStateForDemo('warning')}
                className="touch-target px-3 py-2 rounded-xl bg-terracotta-surface border border-terracotta text-xs font-bold text-charcoal"
              >
                🌅 Δοκιμή Προειδοποίησης 2 Λεπτών
              </button>
              <button
                type="button"
                data-testid="simulate-depleted-time-btn"
                onClick={() => simulateTimeStateForDemo('depleted')}
                className="touch-target px-3 py-2 rounded-xl bg-slate-surface border border-slate text-xs font-bold text-charcoal"
              >
                🌙 Δοκιμή Οθόνης Ξεκούρασης
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility & Sensory Guardrails */}
        <div className="bg-white border-2 border-sand-dark rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-charcoal flex items-center gap-2">
            <span aria-hidden="true">♿</span>
            <span>Προσβασιμότητα & Αισθητηριακές Ρυθμίσεις</span>
          </h2>

          <div className="space-y-3">
            <button
              type="button"
              data-testid="parent-toggle-voice"
              onClick={() => void updateSettings({ voiceEnabled: !settings.voiceEnabled })}
              aria-pressed={settings.voiceEnabled}
              className="touch-target w-full px-4 py-3 rounded-2xl bg-sand-light border-2 border-sand-dark flex items-center justify-between font-bold text-charcoal"
            >
              <span>🔊 Φωνητική Εκφώνηση (Ελληνικά)</span>
              <span className="px-3 py-1 rounded-xl bg-white border border-charcoal/20 text-sm">
                {settings.voiceEnabled ? 'ΕΝΕΡΓΗ' : 'ΑΝΕΝΕΡΓΗ'}
              </span>
            </button>

            <button
              type="button"
              data-testid="parent-toggle-sound"
              onClick={() => void updateSettings({ soundEnabled: !settings.soundEnabled })}
              aria-pressed={settings.soundEnabled}
              className="touch-target w-full px-4 py-3 rounded-2xl bg-sand-light border-2 border-sand-dark flex items-center justify-between font-bold text-charcoal"
            >
              <span>🎵 Ήρεμοι Ήχοι Ανατροφοδότησης</span>
              <span className="px-3 py-1 rounded-xl bg-white border border-charcoal/20 text-sm">
                {settings.soundEnabled ? 'ΕΝΕΡΓΟΙ' : 'ΑΝΕΝΕΡΓΟΙ'}
              </span>
            </button>

            <button
              type="button"
              data-testid="parent-toggle-reduced-motion"
              onClick={() => void updateSettings({ reducedMotion: !settings.reducedMotion })}
              aria-pressed={settings.reducedMotion}
              className="touch-target w-full px-4 py-3 rounded-2xl bg-sand-light border-2 border-sand-dark flex items-center justify-between font-bold text-charcoal"
            >
              <span>🐢 Μειωμένη Κίνηση (Reduced Motion)</span>
              <span className="px-3 py-1 rounded-xl bg-white border border-charcoal/20 text-sm">
                {settings.reducedMotion ? 'ΝΑΙ' : 'ΟΧΙ'}
              </span>
            </button>

            <button
              type="button"
              data-testid="parent-toggle-seated-default"
              onClick={() =>
                void updateSettings({ seatedModeDefault: !settings.seatedModeDefault })
              }
              aria-pressed={settings.seatedModeDefault}
              className="touch-target w-full px-4 py-3 rounded-2xl bg-sand-light border-2 border-sand-dark flex items-center justify-between font-bold text-charcoal"
            >
              <span>🪑 Προεπιλογή Καθιστής Εκδοχής (Κινητικές Ασκήσεις)</span>
              <span className="px-3 py-1 rounded-xl bg-white border border-charcoal/20 text-sm">
                {settings.seatedModeDefault ? 'ΝΑΙ' : 'ΟΧΙ'}
              </span>
            </button>

            {/* Greek Speech Synthesis Engine Diagnostics & Audition */}
            <div
              data-testid="parent-voice-diagnostics-box"
              className="p-3.5 rounded-2xl bg-sage-surface/70 border border-sage space-y-2 text-xs text-charcoal"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-extrabold">
                    🎙️ Ελληνική Μηχανή Φωνητικής Προσωδίας (Neural TTS):
                  </p>
                  <p className="text-charcoal-muted">
                    Ενεργή φωνή: <strong>{getActiveGreekVoiceLabel()}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="parent-test-greek-voice-btn"
                  onClick={() =>
                    speakGreek(
                      'Καλημέρα! Η κότα, το καράβι και ο φωτεινός μονόκερος παίζουν ήρεμα με συγκέντρωση!',
                      true,
                      activeProfile.learnedModel.optimalSpeechRate
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-white border border-sage-dark font-extrabold text-charcoal hover:bg-sage hover:text-white"
                >
                  🔊 Δοκιμή Καθαρής Εκφώνησης
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription & Licensing Management Section ("Διαχείριση Συνδρομής") */}
      <SubscriptionManagementSection />

      <ShareProgressWithTherapist />

      {/* Clinical & Parent Evaluation, Observations & Suggestions Hub */}
      <ClinicalFeedbackSection />

      {/* Per-Device Child Micro-Profiles & Continual Learning Adaptation */}
      <section
        data-testid="child-profiles-learning-section"
        className="bg-white border-2 border-sage rounded-3xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-charcoal">
              👤 Μικρά Προφίλ Παιδιών & Αυτο-Εκπαιδευόμενο Μοντέλο Προσαρμογής ({childProfiles.length})
            </h2>
            <p className="text-sm text-charcoal-muted">
              Κάθε παιδί στη συσκευή διαθέτει ανεξάρτητο τοπικό προφίλ που εκπαιδεύεται αυτόματα (EMA
              Continual Learning) από τις ολοκληρωμένες συνεδρίες, τις βοήθειες και τον ρυθμό
              απόκρισής του:
            </p>
          </div>
        </div>

        {/* Create Child Profile directly inside Parent/Therapist Area */}
        <form
          onSubmit={(e) => void handleParentCreateProfile(e)}
          data-testid="parent-create-profile-form"
          className="p-4 rounded-2xl bg-sand-light border border-sand-dark flex flex-wrap items-end gap-3"
        >
          <div className="space-y-1">
            <label htmlFor="parent-new-profile-avatar" className="block text-xs font-extrabold text-charcoal">
              Εικονίδιο:
            </label>
            <select
              id="parent-new-profile-avatar"
              value={parentNewProfileAvatar}
              onChange={(e) => setParentNewProfileAvatar(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate text-sm font-bold text-charcoal"
            >
              {AVATAR_PRESETS.map((p) => (
                <option key={p.emoji} value={p.emoji}>
                  {p.emoji} {p.defaultNameEl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px] space-y-1">
            <label htmlFor="parent-new-profile-name" className="block text-xs font-extrabold text-charcoal">
              Όνομα / Ψευδώνυμο Παιδιού:
            </label>
            <input
              id="parent-new-profile-name"
              data-testid="parent-new-profile-name-input"
              type="text"
              maxLength={24}
              value={parentNewProfileName}
              onChange={(e) => setParentNewProfileName(e.target.value)}
              placeholder="π.χ. Νικόλας"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate text-sm font-bold text-charcoal"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="parent-new-profile-age" className="block text-xs font-extrabold text-charcoal">
              Ηλικία:
            </label>
            <select
              id="parent-new-profile-age"
              data-testid="parent-new-profile-age-select"
              value={parentNewProfileAge}
              onChange={(e) => setParentNewProfileAge(e.target.value as AgeBandId)}
              className="px-3 py-2 rounded-xl bg-white border border-slate text-sm font-bold text-charcoal"
            >
              {AGE_BAND_PROTOCOLS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.labelEl}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            data-testid="parent-create-profile-btn"
            className="touch-target px-5 py-2 rounded-xl bg-sage-dark text-white font-extrabold text-xs hover:bg-sage"
          >
            ➕ Προσθήκη Προφίλ Παιδιού
          </button>
        </form>

        {/* Friendly Notice when Family Plan 2-profile limit is reached */}
        {(showParentFamilyLimitNotice || !profileCreationPermission.allowed) &&
          !profileCreationPermission.allowed && (
            <div
              role="status"
              data-testid="parent-family-plan-limit-notice"
              className="p-4 rounded-2xl bg-terracotta-surface/60 border-2 border-terracotta flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <p className="text-sm font-extrabold text-charcoal">
                {profileCreationPermission.noticeEl}
              </p>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="#subscription"
                  data-testid="parent-family-limit-stripe-upgrade-link"
                  className="touch-target px-4 py-2.5 rounded-2xl bg-terracotta text-white font-extrabold text-xs flex items-center gap-1.5 hover:opacity-95"
                >
                  <span>➕ Επιπλέον παιδί ({PRICE_EXTRA_CHILD_YEAR_EL}) με κωδικό</span>
                  <span aria-hidden="true">↑</span>
                </a>
                <CheckoutLink
                  href={MONETIZATION_CONFIG.checkoutUrls.therapistAnnual}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="parent-family-limit-stripe-b2b-link"
                  className="touch-target px-4 py-2.5 rounded-2xl bg-sage-dark text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-sage"
                >
                  <span>🏥 Άδεια Θεραπευτή B2B ({PRICE_B2B_YEAR_EL})</span>
                  <span aria-hidden="true">↗️</span>
                </CheckoutLink>
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childProfiles.map((prof) => {
            const isSelected = prof.id === activeProfile.id;
            const avatarEval = evaluateChildAvatarProgress(prof);
            const recent = summarizeRecentAccuracy(sessionLogs, prof.id, 10);
            const masteryEntries = Object.entries(prof.learnedModel.domainMastery) as Array<
              [ClinicalDomainKey, number]
            >;
            return (
              <div
                key={prof.id}
                data-testid={`parent-profile-card-${prof.id}`}
                className={`p-5 rounded-3xl border-2 space-y-3 ${
                  isSelected
                    ? 'bg-sage-surface/60 border-sage-dark'
                    : 'bg-sand-light border-sand-dark'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl" aria-hidden="true">{prof.avatarEmoji}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-charcoal">{prof.nickname}</h3>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-sage text-white text-[10px] font-extrabold">
                            Ενεργό
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-white border border-sage text-[10px] font-extrabold text-sage-dark">
                          {avatarEval.evolutionBadgeEmoji} {avatarEval.evolutionTitleEl}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-dark">
                        Ηλικία {prof.ageBand} ετών • {prof.learnedModel.totalSessionsCompleted}{' '}
                        ολοκληρωμένες συνεδρίες •{' '}
                        <span data-testid={`parent-recent-accuracy-${prof.id}`}>
                          {recent.accuracyPct === null
                            ? 'Ακρίβεια: δεν υπάρχουν ακόμη μετρήσιμα παιχνίδια'
                            : `Ακρίβεια (τελευταία ${recent.measuredCount} παιχνίδια): ${recent.accuracyPct}%`}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isSelected && (
                      <button
                        type="button"
                        onClick={() => void switchChildProfile(prof.id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate text-xs font-extrabold text-charcoal"
                      >
                        Επιλογή
                      </button>
                    )}
                    {childProfiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => void deleteChildProfile(prof.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-terracotta-surface border border-terracotta text-xs font-extrabold text-charcoal"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs font-bold text-charcoal bg-white p-2.5 rounded-xl border border-sand-dark">
                  🧭 {prof.learnedModel.adaptationSummaryEl}
                </p>

                {/* Clinical Avatar Companion Assessment & ADHD Progress Insight */}
                <div
                  data-testid={`parent-avatar-clinical-eval-${prof.id}`}
                  className="p-2.5 rounded-xl bg-white/90 border border-sage text-[11px] text-charcoal space-y-1"
                >
                  <p className="font-extrabold text-sage-dark">
                    {avatarEval.avatar.emoji} Συνοδοιπόρος: {avatarEval.avatar.defaultNameEl} ({avatarEval.avatar.superpowerTitleEl})
                  </p>
                  <p className="text-charcoal-muted">{avatarEval.clinicalAssessmentEl}</p>
                </div>

                {/* Domain practice estimates (app estimate, not a clinical measurement) */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-charcoal-muted">
                    Τάση εξάσκησης ανά τομέα — εκτίμηση της εφαρμογής από ακρίβεια και βοήθειες, όχι
                    κλινική μέτρηση. Τα παιχνίδια κίνησης δεν μετρώνται.
                  </p>
                  {masteryEntries.map(([domKey, score]) => {
                    const meta = DOMAIN_LABELS_EL[domKey];
                    const pct = Math.round(score * 100);
                    return (
                      <div key={domKey} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] font-bold text-charcoal">
                          <span>
                            {meta.emoji} {meta.labelEl}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white border border-sand-dark overflow-hidden">
                          <div
                            className="h-full bg-sage-dark rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Profiles editing, PDF/CSV reports, backup & restore */}
      <ProfessionalToolsSection />

      {/* Activity Session Logs & One-Click Data Wipe */}
      <section className="bg-white border-2 border-sand-dark rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-charcoal">
              📊 Ιστορικό Δραστηριοτήτων ({sessionLogs.length})
            </h2>
            <p className="text-sm text-charcoal-muted">
              Καταγραφή γύρων, λαθών, βοηθειών και ακρίβειας ανά παιχνίδι. «Αυτοαναφορά» = παιχνίδια
              κίνησης που η εφαρμογή δεν μπορεί να ελέγξει.
            </p>
          </div>

          {/* One-Click Data Wipe */}
          <div>
            {!confirmWipe ? (
              <button
                type="button"
                data-testid="one-click-wipe-trigger-btn"
                onClick={() => {
                  setWipeDoneMessage(false);
                  setConfirmWipe(true);
                }}
                className="touch-target px-5 py-3 rounded-2xl bg-terracotta-surface border-2 border-terracotta-dark text-charcoal font-extrabold flex items-center gap-2 hover:bg-terracotta-dark hover:text-white"
              >
                <span aria-hidden="true">🗑️</span>
                <span>Διαγραφή Όλων των Δεδομένων</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="confirm-data-wipe-btn"
                  onClick={() => void handleWipeConfirm()}
                  className="touch-target px-5 py-3 rounded-2xl bg-terracotta-dark text-white font-extrabold"
                >
                  ✓ Επιβεβαίωση Οριστικής Διαγραφής
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmWipe(false)}
                  className="touch-target px-4 py-3 rounded-2xl bg-sand border border-charcoal/20 font-bold text-charcoal"
                >
                  Ακύρωση
                </button>
              </div>
            )}
          </div>
        </div>

        {wipeDoneMessage && (
          <div
            role="status"
            data-testid="wipe-success-banner"
            className="p-4 rounded-2xl bg-sage-surface border-2 border-sage font-bold text-charcoal"
          >
            ✅ Όλα τα τοπικά δεδομένα και το ιστορικό διαγράφηκαν επιτυχώς από τη συσκευή.
          </div>
        )}

        {sessionLogs.length === 0 ? (
          <p className="text-sm text-charcoal-muted py-4 text-center" data-testid="empty-logs-message">
            Δεν υπάρχουν ακόμη καταγεγραμμένες συνεδρίες.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm" data-testid="session-logs-table">
              <thead>
                <tr className="border-b-2 border-sand-dark text-charcoal font-extrabold">
                  <th className="py-3 px-2">Δραστηριότητα</th>
                  <th className="py-3 px-2">Γύροι</th>
                  <th className="py-3 px-2">Βοήθειες (Hints)</th>
                  <th className="py-3 px-2">Λάθη</th>
                  <th className="py-3 px-2">Ακρίβεια</th>
                  <th className="py-3 px-2">Διάρκεια</th>
                  <th className="py-3 px-2">Ημερομηνία</th>
                </tr>
              </thead>
              <tbody>
                {sessionLogs.map((log, i) => (
                  <tr key={log.id ?? i} className="border-b border-sand" data-testid={`session-log-row-${i}`}>
                    <td className="py-3 px-2 font-bold text-charcoal">{log.activityTitleEl}</td>
                    <td className="py-3 px-2">
                      {log.completedRounds}/{log.totalRounds}
                    </td>
                    <td className="py-3 px-2">{log.hintsUsed}</td>
                    <td className="py-3 px-2">{typeof log.errorsCount === 'number' ? log.errorsCount : '—'}</td>
                    <td className="py-3 px-2">{formatLogAccuracy(log)}</td>
                    <td className="py-3 px-2">{log.durationSeconds} δευτ.</td>
                    <td className="py-3 px-2 text-charcoal-muted">{log.dateKey}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Device Ergonomics Strategy & Pedagogical Reference Guide */}
      <section
        data-testid="device-strategy-section"
        className="bg-white border-2 border-slate rounded-3xl p-6 space-y-3"
      >
        <h2 className="text-xl font-extrabold text-charcoal">
          📱 {DEVICE_STRATEGY_SUMMARY.titleEl}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-charcoal">
          <div className="p-4 rounded-2xl bg-terracotta-surface border border-terracotta space-y-1">
            <p className="font-extrabold">Γιατί ΟΧΙ Κινητό:</p>
            <p>{DEVICE_STRATEGY_SUMMARY.whyNotMobileEl}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-surface border border-slate space-y-1">
            <p className="font-extrabold">Γιατί ΟΧΙ Υπολογιστής (PC):</p>
            <p>{DEVICE_STRATEGY_SUMMARY.whyNotPcEl}</p>
          </div>
          <div className="p-4 rounded-2xl bg-sage-surface border border-sage space-y-1">
            <p className="font-extrabold">Η Βέλτιστη Λύση (Tablet 10–11&quot; Kiosk):</p>
            <p>{DEVICE_STRATEGY_SUMMARY.ergonomicsEl}</p>
          </div>
        </div>
      </section>

      {/* Pedagogical Reference Guide for All 20 Activities */}
      <section
        data-testid="interdisciplinary-protocols-section"
        className="bg-white border-2 border-sage rounded-3xl p-6 space-y-4"
      >
        <h2 className="text-xl font-extrabold text-charcoal">
          🩺 Διεπιστημονικά Κλινικά Πρωτόκολλα (8 Ειδικότητες)
        </h2>
        <p className="text-sm text-charcoal-muted">
          Ενσωματωμένες κατευθυντήριες αρχές Εργοθεραπείας, Φυσιατρικής, Λογοθεραπείας,
          Παιδοψυχολογίας, Παιδοψυχιατρικής, Κοινωνικής Εργασίας, Μουσικοκινητικής & Θεατρικής
          Αγωγής:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTERDISCIPLINARY_PROTOCOLS.map((proto) => (
            <div
              key={proto.id}
              data-testid={`discipline-card-${proto.id}`}
              className="p-4 rounded-2xl bg-sand-light border border-sand-dark space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{proto.emoji}</span>
                <h3 className="font-extrabold text-charcoal text-sm">{proto.titleEl}</h3>
              </div>
              <p className="text-xs font-bold text-slate-dark">{proto.coreClinicalObjectiveEl}</p>
              <p className="text-xs text-charcoal-muted">{proto.methodologyEl}</p>
              <p className="text-[11px] font-bold text-sage-dark">{proto.platformImplementationEl}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Invisible Adaptive Scenario Engine Overview (Visible Only to Parents/Clinicians) */}
      <section
        data-testid="invisible-adaptive-engine-section"
        className="bg-white border-2 border-slate rounded-3xl p-6 space-y-4"
      >
        <h2 className="text-xl font-extrabold text-charcoal">
          🧭 Αόρατη Μηχανή Δυναμικής Προσαρμογής Σεναρίων (Invisible Adaptive Engine)
        </h2>
        <p className="text-sm text-charcoal-muted">
          Το σύστημα προσαρμόζεται δυναμικά και αόρατα στο παιδί (ρυθμός εκφώνησης, μείωση
          περισπασμών, πρόληψη ματαίωσης ή εμπλουτισμός δυσκολίας) χωρίς καμία ετικέτα ή αγχωτική
          ένδειξη στην παιδική οθόνη:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(ADAPTIVE_SCENARIO_CATALOG).map(([key, sc]) => (
            <div
              key={key}
              className="p-3.5 rounded-2xl bg-slate-surface/60 border border-slate/40 space-y-1"
            >
              <p className="text-xs font-extrabold text-charcoal">{sc.internalTitleEl}</p>
              <p className="text-xs text-charcoal-muted">{sc.clinicalRationaleEl}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Background reading that inspired the design (NOT evidence that SynapsePlay works) */}
      <section
        data-testid="clinical-studies-rct-section"
        className="bg-white border-2 border-sage rounded-3xl p-6 space-y-4"
      >
        <h2 className="text-xl font-extrabold text-charcoal">
          📚 Σχετική Βιβλιογραφία που Ενέπνευσε τον Σχεδιασμό
        </h2>
        <p className="text-sm text-charcoal-muted">
          Οι παρακάτω εργασίες αποτέλεσαν έμπνευση για τον σχεδιασμό των παιχνιδιών. Το SynapsePlay{' '}
          <strong>δεν έχει αξιολογηθεί σε κλινική μελέτη</strong> και δεν αναπαράγει τις
          παρεμβάσεις που μελετήθηκαν σε αυτές. Είναι εργαλείο εξάσκησης, όχι θεραπεία.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CLINICAL_STUDIES_AND_TRIALS.map((study) => (
            <div
              key={study.id}
              data-testid={`clinical-study-card-${study.id}`}
              className="p-4 rounded-2xl bg-sand-light border border-sand-dark space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold text-charcoal text-sm">{study.authorsAndYear}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white border border-sage text-[11px] font-bold text-sage-dark">
                  {study.journalOrSource}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-dark">{study.clinicalFocusEl}</p>
              <p className="text-xs text-charcoal-muted">{study.engineImplementationEl}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {study.specialtiesInvolvedEl.map((sp) => (
                  <span
                    key={sp}
                    className="px-2 py-0.5 rounded-lg bg-sage-surface text-[10px] font-extrabold text-charcoal"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pedagogical Reference Guide for All 20 Activities */}
      <section className="bg-sand-light border-2 border-sand-dark rounded-3xl p-6 space-y-4">
        <h2 className="text-xl font-extrabold text-charcoal">
          📚 Παιδαγωγικός & Κλινικός Οδηγός των {ACTIVITIES.length} Δραστηριοτήτων
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACTIVITIES.map((act) => (
            <div key={act.id} className="p-4 rounded-2xl bg-white border border-sand-dark space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-charcoal">
                  {act.code}. {act.titleEl} ({act.titleEn})
                </span>
                <span className="text-xl" aria-hidden="true">{act.pictogram}</span>
              </div>
              <p className="text-xs font-bold text-slate-dark">Τομέας: {act.executiveDomain}</p>
              <p className="text-xs text-charcoal-muted">{act.parentGuidanceEl}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GDPR Compliance & DIGIADS Developer Attribution Footer */}
      <section
        data-testid="parent-gdpr-footer-section"
        className="bg-white border-2 border-slate rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-charcoal"
      >
        <div className="space-y-1">
          <p className="font-extrabold text-sm">
            🛡️ 100% Συμμόρφωση GDPR (ΕΕ 2016/679 &amp; Ν. 4624/2019) • Privacy-by-Design
          </p>
          <p className="text-charcoal-muted">
            Η εφαρμογή <strong>SynapsePlay (FocusEngine 5+)</strong> αναπτύχθηκε και αναπτύσσεται από
            την{' '}
            <a
              href="https://digiads.gr"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="parent-digiads-link"
              className="font-extrabold text-slate underline underline-offset-2 hover:text-charcoal"
            >
              DIGIADS (https://digiads.gr)
            </a>
            . Μηδενικά cookies παρακολούθησης • 100% τοπική αποθήκευση στη συσκευή σας.
          </p>
        </div>

        <Link
          to="/legal"
          data-testid="parent-open-legal-page-link"
          className="touch-target px-4 py-2.5 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold text-xs flex items-center gap-2 hover:bg-sage hover:text-white shrink-0"
        >
          <span>Όροι Χρήσης, Πολιτική Απορρήτου &amp; Κέντρο GDPR</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
};
