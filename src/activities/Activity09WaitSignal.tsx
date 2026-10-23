import React, { useState, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';

interface SignalItem {
  emoji: string;
  labelEl: string;
  hasStarCue: boolean;
}

const STREAM_ITEMS: SignalItem[] = [
  { emoji: '☁️', labelEl: 'Σύννεφο (Χωρίς Αστέρι)', hasStarCue: false },
  { emoji: '🍃', labelEl: 'Φύλλο (Χωρίς Αστέρι)', hasStarCue: false },
  { emoji: '🌟🐢', labelEl: 'Χελώνα με Χρυσό Αστέρι!', hasStarCue: true },
];

export const Activity09WaitSignal: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const [stepIndex, setStepIndex] = useState<number>(0);

  useEffect(() => {
    // If hintLevel === 2, jump straight to the cue item so the child experiences immediate success
    if (hintLevel === 2) {
      setStepIndex(2);
    } else {
      setStepIndex(0);
    }
  }, [currentRound, hintLevel]);

  const currentItem = STREAM_ITEMS[stepIndex % STREAM_ITEMS.length];

  const handleTapTarget = () => {
    runDebounced(() => {
      if (currentItem.hasStarCue) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          'Περίμενε λίγο ακόμα! Αυτό δεν έχει το Χρυσό Αστέρι 🌟. Πάτησε «Επόμενο Αντικείμενο».'
        );
      }
    });
  };

  const handleWaitNext = () => {
    runDebounced(() => {
      setStepIndex((prev) => Math.min(STREAM_ITEMS.length - 1, prev + 1));
    });
  };

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" data-testid="activity-09-wait-signal">
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate">
        <p className="font-extrabold text-charcoal text-lg">
          Κανόνας: Πατάω «Επιλογή!» ΜΟΝΟ όταν βλέπω το Χρυσό Αστέρι 🌟!
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
