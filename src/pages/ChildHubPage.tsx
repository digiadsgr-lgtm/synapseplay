import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIVITIES, CATEGORIES, getActivitiesByCategory } from '../data/activitiesCatalog';
import { AGE_BAND_PROTOCOLS, type AgeBandId } from '../data/ageProtocols';
import { useApp } from '../context/AppContext';
import {
  AVATAR_PRESETS,
  DOMAIN_LABELS_EL,
  evaluateChildAvatarProgress,
  getAvatarCompanionMetadata,
  getPersonalizedActivityRecommendation,
} from '../utils/childProfileLearningEngine';
import { speakGreek } from '../utils/soundAndSpeech';

export const ChildHubPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    settings,
    profileCreationPermission,
    childProfiles,
    activeProfile,
    switchChildProfile,
    createChildProfile,
    updateProfileAvatar,
  } = useApp();

  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState<boolean>(false);
  const [showFamilyLimitNotice, setShowFamilyLimitNotice] = useState<boolean>(false);
  const [newNickname, setNewNickname] = useState<string>('');
  const [newAvatar, setNewAvatar] = useState<string>('🦄');
  const [newAgeBand, setNewAgeBand] = useState<AgeBandId>('6-8');

  const recommendation = useMemo(
    () => getPersonalizedActivityRecommendation(activeProfile, ACTIVITIES),
    [activeProfile]
  );

  const avatarEvaluation = useMemo(
    () => evaluateChildAvatarProgress(activeProfile),
    [activeProfile]
  );
  const selectedNewAvatarMeta = useMemo(
    () => getAvatarCompanionMetadata(newAvatar),
    [newAvatar]
  );

  const handleCategorySelect = (categoryId: string, voicePromptEl: string) => {
    speakGreek(voicePromptEl, settings.voiceEnabled, activeProfile.learnedModel.optimalSpeechRate);
    navigate(`/category/${categoryId}`);
  };

  const handleToggleCreateProfile = () => {
    if (!isCreatingProfile && !profileCreationPermission.allowed) {
      setShowFamilyLimitNotice(true);
      return;
    }
    setShowFamilyLimitNotice(false);
    setIsCreatingProfile((v) => !v);
  };

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileCreationPermission.allowed) {
      setShowFamilyLimitNotice(true);
      setIsCreatingProfile(false);
      return;
    }
    const presetName =
      AVATAR_PRESETS.find((p) => p.emoji === newAvatar)?.defaultNameEl ?? 'Μικρός Εξερευνητής';
    const created = await createChildProfile({
      nickname: newNickname.trim() || presetName,
      avatarEmoji: newAvatar,
      ageBand: newAgeBand,
    });
    if (!created) {
      setShowFamilyLimitNotice(true);
      setIsCreatingProfile(false);
      return;
    }
    setNewNickname('');
    setIsCreatingProfile(false);
    setShowFamilyLimitNotice(false);
    speakGreek(
      `Καλώς ήρθες, ${created.nickname}! Το προσωπικό σου προφίλ είναι έτοιμο.`,
      settings.voiceEnabled,
      created.learnedModel.optimalSpeechRate
    );
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6" data-testid="child-hub-page">
      {/* Per-Device Multi-Child Micro-Profile Switcher & Creator */}
      <section
        aria-label="Προφίλ Παιδιών Συσκευής"
        data-testid="child-profile-switcher"
        className="bg-white border-2 border-sage rounded-3xl p-4 md:p-5 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">👤</span>
            <div>
              <h2 className="text-base font-extrabold text-charcoal">
                Το Προφίλ μου στη Συσκευή
              </h2>
              <p className="text-xs text-charcoal-muted">
                Κάθε παιδί έχει το δικό του προφίλ που μαθαίνει και προσαρμόζεται στην πρόοδό του!
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="open-create-profile-btn"
            onClick={handleToggleCreateProfile}
            className="touch-target px-4 py-2 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold text-sm flex items-center gap-1.5 hover:bg-sage hover:text-white"
          >
            <span aria-hidden="true">{isCreatingProfile ? '✖️' : '➕'}</span>
            <span>{isCreatingProfile ? 'Κλείσιμο' : 'Νέο Προφίλ Παιδιού'}</span>
          </button>
        </div>

        {/* Friendly Notice ONLY when Family Plan is active/simulated and 3rd profile is attempted */}
        {showFamilyLimitNotice && !profileCreationPermission.allowed && (
          <div
            role="status"
            data-testid="family-plan-limit-notice"
            className="p-4 rounded-2xl bg-sand-light border-2 border-terracotta flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <p className="text-sm font-extrabold text-charcoal">
              {profileCreationPermission.noticeEl}
            </p>
            <a
              href={profileCreationPermission.upgradeCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="family-limit-stripe-upgrade-link"
              className="touch-target px-5 py-2.5 rounded-2xl bg-sage-dark text-white font-extrabold text-xs flex items-center gap-2 hover:bg-sage shrink-0"
            >
              <span>Αναβάθμιση Πλάνου (Stripe)</span>
              <span aria-hidden="true">↗️</span>
            </a>
          </div>
        )}

        {/* Profile Selector Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {childProfiles.map((prof) => {
            const isSelected = prof.id === activeProfile.id;
            return (
              <button
                key={prof.id}
                type="button"
                data-testid={`child-profile-pill-${prof.id}`}
                aria-pressed={isSelected}
                onClick={() => void switchChildProfile(prof.id)}
                className={`touch-target px-4 py-2.5 rounded-2xl border-2 font-extrabold text-sm flex items-center gap-2.5 transition-all ${
                  isSelected
                    ? 'bg-sage-dark text-white border-charcoal shadow-sm scale-[1.02]'
                    : 'bg-sand-light text-charcoal border-sand-dark hover:bg-sand'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">{prof.avatarEmoji}</span>
                <div className="text-left">
                  <div className="leading-tight">{prof.nickname}</div>
                  <div className="text-[11px] opacity-85 font-bold">
                    {prof.ageBand} ετών • {prof.learnedModel.totalSessionsCompleted} συνεδρίες
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Micro-Profile Creator Form */}
        {isCreatingProfile && (
          <form
            onSubmit={(e) => void handleCreateProfileSubmit(e)}
            data-testid="create-profile-form"
            className="p-4 rounded-2xl bg-sand-light border-2 border-sand-dark space-y-4"
          >
            <h3 className="text-sm font-extrabold text-charcoal">
              ✨ Δημιουργία Νέου Προφίλ Παιδιού (100% Τοπικά στη Συσκευή)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Avatar */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-extrabold text-charcoal">
                  1. Διάλεξε Θεραπευτικό Συνοδοιπόρο (Αγαπημένα Ζώα & Φανταστικοί Χαρακτήρες):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.emoji}
                      type="button"
                      data-testid={`avatar-preset-${preset.emoji}`}
                      title={`${preset.defaultNameEl} — ${preset.superpowerTitleEl}`}
                      onClick={() => {
                        setNewAvatar(preset.emoji);
                        speakGreek(
                          `${preset.defaultNameEl}. ${preset.coachingTipEl}`,
                          settings.voiceEnabled,
                          activeProfile.learnedModel.optimalSpeechRate
                        );
                      }}
                      className={`w-11 h-11 rounded-xl border-2 text-2xl flex items-center justify-center transition-transform ${
                        newAvatar === preset.emoji
                          ? 'bg-sage text-white border-charcoal scale-110 shadow-sm'
                          : 'bg-white border-sand-dark hover:border-slate'
                      }`}
                    >
                      {preset.emoji}
                    </button>
                  ))}
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-sage text-xs text-charcoal space-y-0.5">
                  <p className="font-extrabold text-sage-dark">
                    {selectedNewAvatarMeta.emoji} {selectedNewAvatarMeta.defaultNameEl} •{' '}
                    {selectedNewAvatarMeta.superpowerTitleEl}
                  </p>
                  <p className="text-charcoal-muted">{selectedNewAvatarMeta.coachingTipEl}</p>
                </div>
              </div>

              {/* Step 2 & 3: Nickname & Age Band */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-profile-name-input"
                    className="block text-xs font-extrabold text-charcoal"
                  >
                    2. Όνομα ή Ψευδώνυμο:
                  </label>
                  <input
                    id="new-profile-name-input"
                    data-testid="new-profile-name-input"
                    type="text"
                    maxLength={24}
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder={`π.χ. Άρης ή ${selectedNewAvatarMeta.defaultNameEl}`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-charcoal">
                    3. Ηλικιακή Ομάδα:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AGE_BAND_PROTOCOLS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        data-testid={`new-profile-age-${b.id}`}
                        onClick={() => setNewAgeBand(b.id)}
                        className={`px-3 py-2 rounded-xl border-2 text-xs font-extrabold ${
                          newAgeBand === b.id
                            ? 'bg-slate text-white border-slate-dark'
                            : 'bg-white text-charcoal border-sand-dark'
                        }`}
                      >
                        {b.labelEl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                data-testid="submit-create-profile-btn"
                onClick={(e) => void handleCreateProfileSubmit(e)}
                className="touch-target px-6 py-2.5 rounded-2xl bg-sage-dark text-white font-extrabold text-sm hover:bg-sage"
              >
                ✓ Αποθήκευση & Ενεργοποίηση Προφίλ
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Welcoming Child Banner + Personalized Continual-Learning Recommendation */}
      <section
        aria-labelledby="hub-welcome-heading"
        className="bg-sand-light border-2 border-sand-dark rounded-3xl p-6 space-y-4 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              data-testid="toggle-avatar-companion-picker-btn"
              onClick={() => setIsChangingAvatar((v) => !v)}
              title="Πάτησε για να αλλάξεις τον Θεραπευτικό Συνοδοιπόρο σου!"
              className="touch-target w-20 h-20 rounded-3xl bg-sage-surface border-3 border-sage flex flex-col items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-sm"
            >
              <span className="text-4xl leading-none" aria-hidden="true">
                {activeProfile.avatarEmoji}
              </span>
              <span className="text-[10px] font-extrabold text-sage-dark mt-1">
                Αλλαγή ✨
              </span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  data-testid="companion-evolution-badge"
                  className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white border border-sage text-xs font-extrabold text-sage-dark"
                >
                  <span>{avatarEvaluation.evolutionBadgeEmoji}</span>
                  <span>{avatarEvaluation.evolutionTitleEl}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-surface border border-slate text-xs font-extrabold text-charcoal">
                  <span>Δείκτης Εστίασης: {avatarEvaluation.overallMasteryPct}%</span>
                </span>
              </div>
              <h1 id="hub-welcome-heading" className="text-2xl md:text-3xl font-extrabold text-charcoal">
                Γεια σου, {activeProfile.nickname}! Τι θέλεις να παίξουμε σήμερα;
              </h1>
              <p className="text-sm font-bold text-slate-dark" data-testid="active-profile-adaptation-summary">
                🧠 {activeProfile.learnedModel.adaptationSummaryEl}
              </p>
              <p
                className="text-xs font-extrabold text-sage-dark mt-1"
                data-testid="companion-superpower-banner"
              >
                {avatarEvaluation.childEncouragementEl}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              speakGreek(
                `Γεια σου, ${activeProfile.nickname}! ${avatarEvaluation.avatar.coachingTipEl} Διάλεξε μία από τις τέσσερις ομάδες παιχνιδιών για να ξεκινήσουμε.`,
                true,
                activeProfile.learnedModel.optimalSpeechRate
              )
            }
            data-testid="hub-voice-welcome-btn"
            aria-label="Άκουσε το καλωσόρισμα"
            className="touch-target px-5 py-3 rounded-2xl bg-white border-2 border-sage text-charcoal font-bold flex items-center gap-2 hover:bg-sage-surface shrink-0"
          >
            <span className="text-2xl" aria-hidden="true">🔊</span>
            <span>Άκου</span>
          </button>
        </div>

        {/* Interactive Companion Picker & ADHD Superpower Explorer */}
        {isChangingAvatar && (
          <div
            data-testid="companion-avatar-picker-panel"
            className="p-4 rounded-2xl bg-white border-2 border-sage space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-charcoal">
                🦄 Διάλεξε τον Αγαπημένο σου Συνοδοιπόρο Εστίασης (Ζώα & Φανταστικοί Ήρωες):
              </h2>
              <button
                type="button"
                onClick={() => setIsChangingAvatar(false)}
                className="px-3 py-1 rounded-xl bg-sand text-xs font-extrabold text-charcoal"
              >
                Έτοιμο ✓
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isCurrent = activeProfile.avatarEmoji === preset.emoji;
                return (
                  <button
                    key={preset.emoji}
                    type="button"
                    data-testid={`switch-avatar-btn-${preset.emoji}`}
                    onClick={() => {
                      void updateProfileAvatar(activeProfile.id, preset.emoji);
                      speakGreek(
                        `${preset.defaultNameEl}! ${preset.coachingTipEl}`,
                        settings.voiceEnabled,
                        activeProfile.learnedModel.optimalSpeechRate
                      );
                    }}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center text-center gap-1 transition-all ${
                      isCurrent
                        ? 'bg-sage-surface border-charcoal ring-2 ring-sage scale-105'
                        : 'bg-sand-light border-sand-dark hover:bg-white'
                    }`}
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {preset.emoji}
                    </span>
                    <span className="text-[11px] font-extrabold text-charcoal leading-tight">
                      {preset.defaultNameEl}
                    </span>
                    <span className="text-[9px] font-bold text-slate-dark leading-tight">
                      {DOMAIN_LABELS_EL[preset.primaryDomain].emoji}{' '}
                      {preset.category === 'fantasy' ? 'Φαντασία' : 'Ζωάκι'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Personalized Activity Recommendation from Child's Continual Learning Model */}
        <div
          data-testid="personalized-recommendation-card"
          className="p-4 rounded-2xl bg-white border-2 border-sage flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">{recommendation.activity.pictogram}</span>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-sage-surface text-[11px] font-extrabold text-sage-dark border border-sage">
                🌟 Προσωπική Πρόταση Προσαρμοσμένη σε Εσένα
              </span>
              <p className="text-base font-extrabold text-charcoal mt-0.5">
                {recommendation.activity.code}. {recommendation.activity.titleEl}
              </p>
              <p className="text-xs text-charcoal-muted">{recommendation.reasonEl}</p>
            </div>
          </div>

          <button
            type="button"
            data-testid="play-recommended-activity-btn"
            onClick={() => navigate(`/activity/${recommendation.activity.id}`)}
            className="touch-target px-5 py-2.5 rounded-2xl bg-sage-dark text-white font-extrabold text-sm flex items-center gap-2 hover:bg-sage shrink-0"
          >
            <span aria-hidden="true">▶️</span>
            <span>Παίξε Τώρα</span>
          </button>
        </div>
      </section>

      {/* Maximum 4 Primary Categories */}
      <section aria-label="Οι 4 Βασικές Κατηγορίες Δραστηριοτήτων">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="category-cards-grid">
          {CATEGORIES.map((category) => {
            const activities = getActivitiesByCategory(category.id);
            return (
              <div
                key={category.id}
                data-testid={`category-card-${category.id}`}
                className={`rounded-3xl border-4 p-6 flex flex-col justify-between gap-5 shadow-sm transition-transform ${category.accentColorClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl select-none" aria-hidden="true">
                      {category.pictogram}
                    </span>
                    <div>
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-1 ${category.badgeBgClass}`}
                      >
                        Ομάδα {category.groupCode} • {activities.length} Παιχνίδια
                      </span>
                      <h2 className="text-2xl font-extrabold text-charcoal">{category.titleEl}</h2>
                      <p className="text-sm font-bold text-charcoal-muted">{category.subtitleEl}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      speakGreek(
                        category.voicePromptEl,
                        true,
                        activeProfile.learnedModel.optimalSpeechRate
                      )
                    }
                    aria-label={`Άκουσε περιγραφή για ${category.titleEl}`}
                    className="touch-target px-3.5 py-2 rounded-2xl bg-white/90 border-2 border-charcoal/20 text-charcoal font-bold flex items-center justify-center hover:bg-white"
                  >
                    <span className="text-2xl" aria-hidden="true">🔊</span>
                  </button>
                </div>

                {/* Activity Mini Pictogram Preview */}
                <div className="flex flex-wrap items-center gap-2">
                  {activities.map((act) => (
                    <span
                      key={act.id}
                      className="px-3 py-1.5 rounded-xl bg-white/80 border border-charcoal/15 text-xs font-bold text-charcoal flex items-center gap-1.5"
                    >
                      <span aria-hidden="true">{act.pictogram}</span>
                      <span>{act.titleEl}</span>
                    </span>
                  ))}
                </div>

                {/* Single Clear Primary Action per Category Card */}
                <button
                  type="button"
                  data-testid={`open-category-${category.id}`}
                  onClick={() => handleCategorySelect(category.id, category.voicePromptEl)}
                  className="touch-target w-full py-4 px-6 rounded-2xl bg-charcoal text-white font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-slate-dark transition-colors"
                >
                  <span>Παίξε «{category.titleEl}»</span>
                  <span aria-hidden="true">➡️</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Non-Medical & Privacy-by-Design Footer Disclaimer */}
      <footer
        data-testid="educational-disclaimer-footer"
        className="p-4 rounded-2xl bg-sand-light border border-sand-dark text-center text-xs text-charcoal-muted space-y-1"
      >
        <p className="font-bold text-charcoal">
          Σημαντική Ενημέρωση: Το SynapsePlay (FocusEngine 5+) είναι περιβάλλον παιδαγωγικής
          υποστήριξης και εξάσκησης δεξιοτήτων.
        </p>
        <p>
          ΔΕΝ αποτελεί ιατρική συσκευή, διαγνωστικό εργαλείο ή κλινική θεραπεία ΔΕΠΥ. 100% τοπική
          λειτουργία στη συσκευή χωρίς διαφημίσεις ή ιχνηλάτες.
        </p>
      </footer>
    </main>
  );
};
