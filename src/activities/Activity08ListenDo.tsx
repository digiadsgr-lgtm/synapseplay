import React, { useState, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface ListenRound {
  instructionEl: string;
  pictogramCue: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isTarget: boolean }>;
}

const LISTEN_ROUNDS: ListenRound[] = [
  {
    instructionEl: 'Περίμενε να ολοκληρωθεί η οδηγία... και μετά πάτησε το ΚΙΤΡΙΝΟ ΑΣΤΕΡΙ!',
    pictogramCue: '👂 ⏳ ➡️ ⭐',
    options: [
      { id: 'l1-1', emoji: '🍎', labelEl: 'Κόκκινο Μήλο', isTarget: false },
      { id: 'l1-2', emoji: '⭐', labelEl: 'Κίτρινο Αστέρι', isTarget: true },
      { id: 'l1-3', emoji: '🐸', labelEl: 'Πράσινο Βατραχάκι', isTarget: false },
    ],
  },
  {
    instructionEl: 'Άκου προσεκτικά μέχρι το τέλος... και πάτησε την ΠΡΑΣΙΝΗ ΧΕΛΩΝΑ!',
    pictogramCue: '👂 ⏳ ➡️ 🐢',
    options: [
      { id: 'l2-1', emoji: '🐢', labelEl: 'Πράσινη Χελώνα', isTarget: true },
      { id: 'l2-2', emoji: '🎈', labelEl: 'Μπαλόνι', isTarget: false },
      { id: 'l2-3', emoji: '⛵', labelEl: 'Καραβάκι', isTarget: false },
    ],
  },
  {
    instructionEl: 'Κράτα τα χέρια ήρεμα... και τώρα πάτησε το ΜΠΛΕ ΚΑΡΑΒΑΚΙ!',
    pictogramCue: '👂 ⏳ ➡️ ⛵',
    options: [
      { id: 'l3-1', emoji: '🌻', labelEl: 'Ηλίανθος', isTarget: false },
      { id: 'l3-2', emoji: '🍄', labelEl: 'Μανιτάρι', isTarget: false },
      { id: 'l3-3', emoji: '⛵', labelEl: 'Μπλε Καραβάκι', isTarget: true },
    ],
  },
];

export const Activity08ListenDo: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const round = LISTEN_ROUNDS[(currentRound - 1) % LISTEN_ROUNDS.length];
  const [isListeningFinished, setIsListeningFinished] = useState<boolean>(false);

  useEffect(() => {
    setIsListeningFinished(false);
    speakGreek(round.instructionEl, settings.voiceEnabled);
    const timer = window.setTimeout(() => {
      setIsListeningFinished(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [currentRound, round.instructionEl, settings.voiceEnabled]);

  const visibleOptions =
    hintLevel === 2
      ? round.options.filter((o, i) => o.isTarget || i === 0)
      : round.options;

  const handleSelect = (isTarget: boolean, labelEl: string) => {
    runDebounced(() => {
      if (!isListeningFinished) {
        triggerGentleFeedback(
          'Περίμενε μια στιγμή να ανάψει το πράσινο σήμα «Τώρα Διάλεξε!» πριν πατήσεις.'
        );
        return;
      }
      if (isTarget) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(`Διάλεξες «${labelEl}». Δες ξανά το εικονίδιο της οδηγίας επάνω!`);
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-08-listen-do">
      <div
        data-testid={isListeningFinished ? 'listen-status-ready' : 'listen-status-waiting'}
        className={`p-5 rounded-3xl border-4 space-y-2 transition-colors ${
          isListeningFinished
            ? 'bg-sage-surface border-sage-dark'
            : 'bg-slate-surface border-slate'
        }`}
      >
        <div className="text-3xl font-extrabold" aria-hidden="true">
          {round.pictogramCue}
        </div>
        <p className="text-lg font-extrabold text-charcoal">{round.instructionEl}</p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-charcoal/20 text-sm font-extrabold">
          <span>{isListeningFinished ? '🟢 Τώρα Διάλεξε!' : '⏳ Άκου / Δες πρώτα...'}</span>
        </div>

        {!isListeningFinished && (
          <div className="pt-2">
            <button
              type="button"
              data-testid="listen-ready-override-btn"
              onClick={() => setIsListeningFinished(true)}
              className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-xs font-bold text-charcoal"
            >
              Άκουσα την οδηγία — Είμαι έτοιμος!
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight = isListeningFinished && hintLevel >= 1 && opt.isTarget;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isTarget ? 'listen-do-target' : `listen-do-opt-${opt.id}`}
              onClick={() => handleSelect(opt.isTarget, opt.labelEl)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-base font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
