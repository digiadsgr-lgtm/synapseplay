import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface SignalItem {
  emoji: string;
  labelEl: string;
  hasStarCue: boolean;
}

const STREAM_SETS: SignalItem[][] = [
  [
    { emoji: '☁️', labelEl: 'Σύννεφο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🍃', labelEl: 'Φύλλο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🐢', labelEl: 'Χελώνα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🌊', labelEl: 'Κύμα (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🐚', labelEl: 'Κοχύλι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🐬', labelEl: 'Δελφίνι με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🌲', labelEl: 'Έλατο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🍄', labelEl: 'Μανιτάρι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🦉', labelEl: 'Κουκουβάγια με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🪐', labelEl: 'Πλανήτης (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌙', labelEl: 'Φεγγάρι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🚀', labelEl: 'Πύραυλος με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🥁', labelEl: 'Τύμπανο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🎹', labelEl: 'Πιάνο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🎸', labelEl: 'Κιθάρα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🚲', labelEl: 'Ποδήλατο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🚂', labelEl: 'Τρενάκι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟⛵', labelEl: 'Καραβάκι με Χρυσό Αστέρι!', hasStarCue: true },
  ],
];

export const Activity09WaitSignal: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeSets = useMemo(
    () => selectSessionRounds(STREAM_SETS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const streamItems = activeSets[(currentRound - 1) % activeSets.length];
  const [stepIndex, setStepIndex] = useState<number>(0);

  useEffect(() => {
    if (hintLevel === 2) {
      setStepIndex(2);
    } else {
      setStepIndex(0);
    }
  }, [currentRound, hintLevel, sessionSeed]);

  const currentItem = streamItems[stepIndex % streamItems.length];

  const handleTapTarget = () => {
    runDebounced(() => {
      if (currentItem.hasStarCue) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          'Περίμενε λίγο ακόμα! Αυτό δεν έχει το Χρυσό Αστέρι. Πάτησε «Επόμενο Αντικείμενο».'
        );
      }
    });
  };

  const handleWaitNext = () => {
    runDebounced(() => {
      setStepIndex((prev) => Math.min(streamItems.length - 1, prev + 1));
    });
  };

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" data-testid="activity-09-wait-signal">
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate">
        <p className="font-extrabold text-charcoal text-lg">
          Κανόνας: Πατάω «Επιλογή!» μόνο όταν βλέπω το Χρυσό Αστέρι 🌟!
        </p>
      </div>

      <div
        data-testid={currentItem.hasStarCue ? 'signal-stage-ready' : 'signal-stage-waiting'}
        className={`p-8 rounded-3xl border-4 space-y-3 ${
          currentItem.hasStarCue
            ? 'bg-sage-surface border-sage-dark'
            : 'bg-white border-sand-dark'
        }`}
      >
        <div className="text-6xl" aria-hidden="true">{currentItem.emoji}</div>
        <h2 className="text-xl font-extrabold text-charcoal">{currentItem.labelEl}</h2>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {!currentItem.hasStarCue && (
          <button
            type="button"
            data-testid="wait-signal-next-btn"
            onClick={handleWaitNext}
            className="touch-target px-6 py-4 rounded-2xl bg-slate text-white font-extrabold text-lg flex items-center gap-2 hover:bg-slate-dark"
          >
            <span aria-hidden="true">⏳</span>
            <span>Περιμένω — Επόμενο Αντικείμενο</span>
          </button>
        )}

        <button
          type="button"
          data-testid="wait-signal-tap-btn"
          onClick={handleTapTarget}
          className={`touch-target px-8 py-4 rounded-2xl border-4 font-extrabold text-lg flex items-center gap-2 ${
            currentItem.hasStarCue && hintLevel >= 1
              ? 'bg-sage-dark text-white border-charcoal ring-4 ring-sage/40'
              : currentItem.hasStarCue
              ? 'bg-sage text-white border-sage-dark hover:bg-sage-dark'
              : 'bg-white border-sand-dark text-charcoal hover:bg-sand'
          }`}
        >
          <span aria-hidden="true">🌟</span>
          <span>Επιλογή Τώρα!</span>
        </button>
      </div>
    </div>
  );
};
