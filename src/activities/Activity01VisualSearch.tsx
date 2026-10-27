import React, { useMemo, useEffect, useCallback } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface SearchRoundConfig {
  target: { emoji: string; labelEl: string };
  grid: Array<{ id: string; emoji: string; labelEl: string; isTarget: boolean }>;
}

const ROUNDS: SearchRoundConfig[] = [
  {
    target: { emoji: '🐢', labelEl: 'Πράσινη Χελώνα' },
    grid: [
      { id: '1-1', emoji: '🐸', labelEl: 'Βατραχάκι', isTarget: false },
      { id: '1-2', emoji: '🍐', labelEl: 'Αχλάδι', isTarget: false },
      { id: '1-3', emoji: '🐢', labelEl: 'Πράσινη Χελώνα', isTarget: true },
      { id: '1-4', emoji: '🍀', labelEl: 'Τριφύλλι', isTarget: false },
      { id: '1-5', emoji: '🦕', labelEl: 'Δεινόσαυρος', isTarget: false },
      { id: '1-6', emoji: '🍏', labelEl: 'Πράσινο Μήλο', isTarget: false },
    ],
  },
  {
    target: { emoji: '⛵', labelEl: 'Ιστιοπλοϊκό Καραβάκι' },
    grid: [
      { id: '2-1', emoji: '🚲', labelEl: 'Ποδήλατο', isTarget: false },
      { id: '2-2', emoji: '🚂', labelEl: 'Τρενάκι', isTarget: false },
      { id: '2-3', emoji: '⛺', labelEl: 'Σκηνή', isTarget: false },
      { id: '2-4', emoji: '⛵', labelEl: 'Ιστιοπλοϊκό Καραβάκι', isTarget: true },
      { id: '2-5', emoji: '🚁', labelEl: 'Ελικόπτερο', isTarget: false },
      { id: '2-6', emoji: '🛶', labelEl: 'Κανό', isTarget: false },
      { id: '2-7', emoji: '🚌', labelEl: 'Λεωφορείο', isTarget: false },
      { id: '2-8', emoji: '🏠', labelEl: 'Σπιτάκι', isTarget: false },
    ],
  },
  {
    target: { emoji: '🌻', labelEl: 'Ηλίανθος' },
    grid: [
      { id: '3-1', emoji: '🌼', labelEl: 'Μαργαρίτα', isTarget: false },
      { id: '3-2', emoji: '🍋', labelEl: 'Λεμόνι', isTarget: false },
      { id: '3-3', emoji: '⭐', labelEl: 'Αστέρι', isTarget: false },
      { id: '3-4', emoji: '🌙', labelEl: 'Φεγγάρι', isTarget: false },
      { id: '3-5', emoji: '🔔', labelEl: 'Καμπανάκι', isTarget: false },
      { id: '3-6', emoji: '🌻', labelEl: 'Ηλίανθος', isTarget: true },
      { id: '3-7', emoji: '🍯', labelEl: 'Μέλι', isTarget: false },
      { id: '3-8', emoji: '🐥', labelEl: 'Κοτοπουλάκι', isTarget: false },
    ],
  },
  {
    target: { emoji: '🦉', labelEl: 'Σοφή Κουκουβάγια' },
    grid: [
      { id: '4-1', emoji: '🐿️', labelEl: 'Σκιουράκι', isTarget: false },
      { id: '4-2', emoji: '🦔', labelEl: 'Σκαντζόχοιρος', isTarget: false },
      { id: '4-3', emoji: '🦉', labelEl: 'Σοφή Κουκουβάγια', isTarget: true },
      { id: '4-4', emoji: '🦌', labelEl: 'Ελάφι', isTarget: false },
      { id: '4-5', emoji: '🍄', labelEl: 'Μανιτάρι', isTarget: false },
      { id: '4-6', emoji: '🌰', labelEl: 'Κάστανο', isTarget: false },
    ],
  },
  {
    target: { emoji: '🐬', labelEl: 'Μπλε Δελφίνι' },
    grid: [
      { id: '5-1', emoji: '🐳', labelEl: 'Φάλαινα', isTarget: false },
      { id: '5-2', emoji: '🐟', labelEl: 'Ψαράκι', isTarget: false },
      { id: '5-3', emoji: '🦀', labelEl: 'Καβούρι', isTarget: false },
      { id: '5-4', emoji: '🐬', labelEl: 'Μπλε Δελφίνι', isTarget: true },
      { id: '5-5', emoji: '🐙', labelEl: 'Χταπόδι', isTarget: false },
      { id: '5-6', emoji: '🐚', labelEl: 'Κοχύλι', isTarget: false },
    ],
  },
  {
    target: { emoji: '🎸', labelEl: 'Ξύλινη Κιθάρα' },
    grid: [
      { id: '6-1', emoji: '🥁', labelEl: 'Τύμπανο', isTarget: false },
      { id: '6-2', emoji: '🎹', labelEl: 'Πιάνο', isTarget: false },
      { id: '6-3', emoji: '🎺', labelEl: 'Τρομπέτα', isTarget: false },
      { id: '6-4', emoji: '🎻', labelEl: 'Βιολί', isTarget: false },
      { id: '6-5', emoji: '🎸', labelEl: 'Ξύλινη Κιθάρα', isTarget: true },
      { id: '6-6', emoji: '🪈', labelEl: 'Φλάουτο', isTarget: false },
    ],
  },
  {
    target: { emoji: '🚀', labelEl: 'Διαστημικός Πύραυλος' },
    grid: [
      { id: '7-1', emoji: '🪐', labelEl: 'Πλανήτης', isTarget: false },
      { id: '7-2', emoji: '🌕', labelEl: 'Πανσέληνος', isTarget: false },
      { id: '7-3', emoji: '🚀', labelEl: 'Διαστημικός Πύραυλος', isTarget: true },
      { id: '7-4', emoji: '☄️', labelEl: 'Κομήτης', isTarget: false },
      { id: '7-5', emoji: '🛰️', labelEl: 'Δορυφόρος', isTarget: false },
      { id: '7-6', emoji: '🔭', labelEl: 'Τηλεσκόπιο', isTarget: false },
    ],
  },
  {
    target: { emoji: '🍓', labelEl: 'Κόκκινη Φράουλα' },
    grid: [
      { id: '8-1', emoji: '🍒', labelEl: 'Κεράσια', isTarget: false },
      { id: '8-2', emoji: '🍎', labelEl: 'Κόκκινο Μήλο', isTarget: false },
      { id: '8-3', emoji: '🍉', labelEl: 'Καρπούζι', isTarget: false },
      { id: '8-4', emoji: '🍓', labelEl: 'Κόκκινη Φράουλα', isTarget: true },
      { id: '8-5', emoji: '🍅', labelEl: 'Ντομάτα', isTarget: false },
      { id: '8-6', emoji: '🌶️', labelEl: 'Πιπεριά', isTarget: false },
    ],
  },
  {
    target: { emoji: '🦋', labelEl: 'Πολύχρωμη Πεταλούδα' },
    grid: [
      { id: '9-1', emoji: '🐝', labelEl: 'Μέλισσα', isTarget: false },
      { id: '9-2', emoji: '🐞', labelEl: 'Πασχαλίτσα', isTarget: false },
      { id: '9-3', emoji: '🦋', labelEl: 'Πολύχρωμη Πεταλούδα', isTarget: true },
      { id: '9-4', emoji: '🐌', labelEl: 'Σαλιγκάρι', isTarget: false },
      { id: '9-5', emoji: '🐛', labelEl: 'Κάμπια', isTarget: false },
      { id: '9-6', emoji: '🌸', labelEl: 'Άνθος Κερασιάς', isTarget: false },
    ],
  },
  {
    target: { emoji: '🦊', labelEl: 'Κόκκινη Αλεπού' },
    grid: [
      { id: '10-1', emoji: '🐻', labelEl: 'Αρκουδάκι', isTarget: false },
      { id: '10-2', emoji: '🦊', labelEl: 'Κόκκινη Αλεπού', isTarget: true },
      { id: '10-3', emoji: '🐰', labelEl: 'Κουνελάκι', isTarget: false },
      { id: '10-4', emoji: '🦌', labelEl: 'Ελαφάκι', isTarget: false },
      { id: '10-5', emoji: '🐿️', labelEl: 'Σκιουράκι', isTarget: false },
      { id: '10-6', emoji: '🦔', labelEl: 'Σκαντζόχοιρος', isTarget: false },
    ],
  },
  {
    target: { emoji: '🎈', labelEl: 'Κόκκινο Μπαλόνι' },
    grid: [
      { id: '11-1', emoji: '🪁', labelEl: 'Χαρταετός', isTarget: false },
      { id: '11-2', emoji: '🧸', labelEl: 'Αρκουδάκι Παιχνίδι', isTarget: false },
      { id: '11-3', emoji: '🎨', labelEl: 'Παλέτα Χρωμάτων', isTarget: false },
      { id: '11-4', emoji: '🎈', labelEl: 'Κόκκινο Μπαλόνι', isTarget: true },
      { id: '11-5', emoji: '🧩', labelEl: 'Κομμάτι Παζλ', isTarget: false },
      { id: '11-6', emoji: '🪀', labelEl: 'Γιο-γιο', isTarget: false },
    ],
  },
  {
    target: { emoji: '🧭', labelEl: 'Πυξίδα Εξερευνητή' },
    grid: [
      { id: '12-1', emoji: '🔦', labelEl: 'Φακός', isTarget: false },
      { id: '12-2', emoji: '⛺', labelEl: 'Σκηνή', isTarget: false },
      { id: '12-3', emoji: '🧭', labelEl: 'Πυξίδα Εξερευνητή', isTarget: true },
      { id: '12-4', emoji: '🎒', labelEl: 'Σακίδιο Πλάτης', isTarget: false },
      { id: '12-5', emoji: '🏔️', labelEl: 'Βουνό', isTarget: false },
      { id: '12-6', emoji: '🛶', labelEl: 'Κανό', isTarget: false },
    ],
  },
  {
    target: { emoji: '🎻', labelEl: 'Μελωδικό Βιολί' },
    grid: [
      { id: '13-1', emoji: '🥁', labelEl: 'Τύμπανο', isTarget: false },
      { id: '13-2', emoji: '🎹', labelEl: 'Πιάνο', isTarget: false },
      { id: '13-3', emoji: '🪈', labelEl: 'Φλογέρα', isTarget: false },
      { id: '13-4', emoji: '🎻', labelEl: 'Μελωδικό Βιολί', isTarget: true },
      { id: '13-5', emoji: '🎺', labelEl: 'Τρομπέτα', isTarget: false },
      { id: '13-6', emoji: '🔔', labelEl: 'Καμπανάκι', isTarget: false },
    ],
  },
  {
    target: { emoji: '🌈', labelEl: 'Ουράνιο Τόξο' },
    grid: [
      { id: '14-1', emoji: '☁️', labelEl: 'Σύννεφο', isTarget: false },
      { id: '14-2', emoji: '☀️', labelEl: 'Ήλιος', isTarget: false },
      { id: '14-3', emoji: '🌈', labelEl: 'Ουράνιο Τόξο', isTarget: true },
      { id: '14-4', emoji: '❄️', labelEl: 'Χιονονιφάδα', isTarget: false },
      { id: '14-5', emoji: '💧', labelEl: 'Σταγόνα', isTarget: false },
      { id: '14-6', emoji: '🌙', labelEl: 'Φεγγάρι', isTarget: false },
    ],
  },
  {
    target: { emoji: '🦢', labelEl: 'Λευκός Κύκνος' },
    grid: [
      { id: '15-1', emoji: '🦆', labelEl: 'Παπάκι', isTarget: false },
      { id: '15-2', emoji: '🦩', labelEl: 'Φλαμίνγκο', isTarget: false },
      { id: '15-3', emoji: '🕊️', labelEl: 'Περιστέρι', isTarget: false },
      { id: '15-4', emoji: '🦢', labelEl: 'Λευκός Κύκνος', isTarget: true },
      { id: '15-5', emoji: '🦜', labelEl: 'Παπαγάλος', isTarget: false },
      { id: '15-6', emoji: '🦚', labelEl: 'Παγώνι', isTarget: false },
    ],
  },
];

export const Activity01VisualSearch: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeRounds = useMemo(
    () => selectSessionRounds(ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const roundData = activeRounds[(currentRound - 1) % activeRounds.length];

  useEffect(() => {
    speakGreek(
      `Ψάξε και βρες: ${roundData.target.labelEl}!`,
      settings.voiceEnabled,
      adaptiveProfile.speechRate
    );
  }, [currentRound, sessionSeed, roundData.target.labelEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const isSeniorAge = ageBand === '8-10' || ageBand === '10-12';

  // Age-graded & Invisible Adaptive Scenario distractor scaling:
  // - Hint Level 2 or Age 4-5: 3 items (2 distractors + 1 target)
  // - Age 5-6 or high distractorReductionRatio: 4 items
  // - Age 6-8: 6 items
  // - Age 8-10 / 10-12: 12 items (3x4 high-density Senior Detective visual search matrix)
  const visibleItems = useMemo(() => {
    const targetItem = roundData.grid.find((i) => i.isTarget)!;
    const distractors = roundData.grid.filter((i) => !i.isTarget);

    let baseItems = roundData.grid;
    if (hintLevel >= 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5) {
      baseItems = [distractors[0], targetItem, distractors[1]];
    } else if (ageBand === '5-6' || adaptiveProfile.distractorReductionRatio >= 0.3) {
      baseItems = [distractors[0], distractors[1], targetItem, distractors[2]];
    } else if (isSeniorAge || adaptiveProfile.enrichChallenge) {
      const seniorExtras = [
        { id: `vs-ex1-${currentRound}`, emoji: '🔮', labelEl: 'Γυάλινη Σφαίρα', isTarget: false },
        { id: `vs-ex2-${currentRound}`, emoji: '🧲', labelEl: 'Μαγνήτης', isTarget: false },
        { id: `vs-ex3-${currentRound}`, emoji: '🔬', labelEl: 'Μικροσκόπιο', isTarget: false },
        { id: `vs-ex4-${currentRound}`, emoji: '🧬', labelEl: 'Έλικα DNA', isTarget: false },
        { id: `vs-ex5-${currentRound}`, emoji: '🧪', labelEl: 'Δοκιμαστικός Σωλήνας', isTarget: false },
        { id: `vs-ex6-${currentRound}`, emoji: '⚙️', labelEl: 'Γρανάζι Μηχανής', isTarget: false },
      ];
      baseItems = [...roundData.grid.slice(0, 6), ...seniorExtras];
    }
    return rotateOptionsForSession(baseItems, sessionSeed, currentRound);
  }, [roundData, hintLevel, ageBand, isSeniorAge, adaptiveProfile.distractorReductionRatio, adaptiveProfile.enrichChallenge, sessionSeed, currentRound]);

  const handleSelect = useCallback(
    (isTarget: boolean, labelEl: string) => {
      runDebounced(() => {
        if (isTarget) {
          playCalmTone('complete', settings.soundEnabled);
          advanceRound(getAbsorbedCount());
        } else {
          triggerGentleFeedback(
            `Αυτό είναι: ${labelEl}. Ψάχνουμε: ${roundData.target.labelEl}.`
          );
        }
      });
    },
    [runDebounced, advanceRound, getAbsorbedCount, triggerGentleFeedback, roundData.target.labelEl, settings.soundEnabled]
  );

  // Keyboard number-key support (1-8) in addition to standard Tab/Enter/Space
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < visibleItems.length) {
        const item = visibleItems[idx];
        handleSelect(item.isTarget, item.labelEl);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visibleItems, handleSelect]);

  return (
    <div className="space-y-6" data-testid="activity-01-visual-search">
      {/* Target Display Card */}
      <div className="p-5 rounded-3xl bg-slate-surface border-2 border-slate flex flex-wrap items-center justify-center gap-4">
        <span className="text-lg font-extrabold text-charcoal">
          {isSeniorAge ? 'Αποστολή Ντετέκτιβ (12 Σύμβολα):' : 'Στόχος Αναζήτησης:'}
        </span>
        <button
          type="button"
          data-testid="visual-search-target-badge"
          onClick={() =>
            speakGreek(
              `Ψάχνουμε: ${roundData.target.labelEl}.`,
              true,
              adaptiveProfile.speechRate,
              { force: true }
            )
          }
          className="touch-target px-5 py-3 rounded-2xl bg-white border-2 border-slate flex items-center gap-3 shadow-sm hover:bg-sand-light cursor-pointer"
        >
          <span className="text-4xl" aria-hidden="true">
            {isSeniorAge && hintLevel === 0 ? '🕵️‍♂️' : roundData.target.emoji}
          </span>
          <span className="text-xl font-extrabold text-charcoal">{roundData.target.labelEl}</span>
          <span className="text-lg" aria-hidden="true">🔊</span>
        </button>
      </div>

      {/* Calibrated Search Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" data-testid="visual-search-grid">
        {visibleItems.map((item, idx) => {
          const highlightTarget = hintLevel >= 1 && item.isTarget;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={item.isTarget ? 'search-item-target' : `search-item-${item.id}`}
              onClick={() => handleSelect(item.isTarget, item.labelEl)}
              aria-label={`${idx + 1}. ${item.labelEl}`}
              className={`touch-target min-h-[104px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                highlightTarget
                  ? 'bg-sage-surface border-4 border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate hover:bg-slate-surface/50'
              }`}
            >
              <span className="text-5xl select-none" aria-hidden="true">
                {item.emoji}
              </span>
              {(!isSeniorAge || hintLevel >= 1) && (
                <span className="text-sm font-bold text-charcoal">{item.labelEl}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
