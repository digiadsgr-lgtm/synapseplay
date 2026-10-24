import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';
import { playCalmTone } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

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
  phase,
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
  const diff = useMemo(
    () => getAgeAndPerformanceDifficulty(ageBand, adaptiveProfile, hintLevel),
    [ageBand, adaptiveProfile, hintLevel]
  );

  const activeSets = useMemo(
    () => selectSessionRounds(STREAM_SETS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const baseStream = activeSets[(currentRound - 1) % activeSets.length];

  // Calibrate stream length by age band & live performance:
  // - 4-5 years: shorter wait (1 non-star item + 1 star target)
  // - 6-8 years: standard wait (2 non-star items + 1 star target)
  // - 8-10 / 10-12 or Mastery: extended vigilance (3 non-star items + 1 star target)
  const streamItems = useMemo(() => {
    if (ageBand === '4-5' && hintLevel < 2) {
      return baseStream.slice(1);
    }
    if (diff.isAdvancedMastery) {
      return [
        { emoji: '🪨', labelEl: 'Βότσαλο (Χωρίς Αστέρι)', hasStarCue: false },
        ...baseStream,
      ];
    }
    return baseStream;
  }, [baseStream, ageBand, hintLevel, diff.isAdvancedMastery]);

  const [stepIndex, setStepIndex] = useState<number>(0);

  useEffect(() => {
    if (hintLevel === 2) {
      setStepIndex(streamItems.length - 1);
    } else {
      setStepIndex(0);
    }
  }, [currentRound, hintLevel, sessionSeed, streamItems.length]);

  const currentItem = streamItems[stepIndex % streamItems.length] ?? streamItems[0];

  // Automatic Continuous Performance Task (CPT) stream progression!
  // Objects appear automatically on screen so the child never has to manually click "Next Object".
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED' || hintLevel === 2) return;

    if (!currentItem.hasStarCue) {
      const timer = window.setTimeout(() => {
        setStepIndex((prev) => {
          const next = Math.min(streamItems.length - 1, prev + 1);
          if (streamItems[next]?.hasStarCue) {
            playCalmTone('soft-step', settings.soundEnabled);
          }
          return next;
        });
      }, diff.cptIntervalMs);
      return () => window.clearTimeout(timer);
    }
  }, [
    phase,
    hintLevel,
    stepIndex,
    currentItem.hasStarCue,
    streamItems,
    diff.cptIntervalMs,
    settings.soundEnabled,
  ]);

  const handleTapTarget = () => {
    runDebounced(() => {
      if (currentItem.hasStarCue) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          'Περίμενε λίγο ακόμα! Αυτό δεν έχει το Χρυσό Αστέρι 🌟 — το επόμενο αντικείμενο έρχεται αυτόματα!'
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
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate space-y-2">
        <p className="font-extrabold text-charcoal text-lg">
          Κανόνας: Περιμένω ήρεμα καθώς αλλάζουν οι εικόνες και πατάω ΜΟΝΟ όταν εμφανιστεί το Χρυσό Αστέρι 🌟!
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-dark">
          <span>
            {currentItem.hasStarCue
              ? '🌟 Εμφανίστηκε το Χρυσό Αστέρι! Πάτησε την κάρτα ή το κουμπί τώρα!'
              : `⏳ Τα αντικείμενα εναλλάσσονται αυτόματα (${(diff.cptIntervalMs / 1000).toFixed(1)} δευτ.)...`}
          </span>
        </div>
        {/* Visual Stream Step Dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {streamItems.map((item, idx) => (
            <span
              key={`${item.labelEl}-${idx}`}
              className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
                idx === stepIndex
                  ? item.hasStarCue
                    ? 'bg-sage-dark text-white border-charcoal scale-110'
                    : 'bg-slate text-white border-slate-dark'
                  : idx < stepIndex
                  ? 'bg-sage-surface text-charcoal border-sage'
                  : 'bg-white text-charcoal-muted border-sand-dark'
              }`}
            >
              {item.hasStarCue ? '🌟 Σήμα!' : `Εικόνα ${idx + 1}`}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Central Stage — Child can tap directly on the object card OR the button below */}
      <button
        type="button"
        onClick={handleTapTarget}
        data-testid={currentItem.hasStarCue ? 'signal-stage-ready' : 'signal-stage-waiting'}
        className={`w-full p-8 rounded-3xl border-4 space-y-3 transition-all cursor-pointer ${
          currentItem.hasStarCue
            ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40 scale-[1.02]'
            : 'bg-white border-sand-dark hover:border-slate'
        }`}
      >
        <div className="text-6xl" aria-hidden="true">{currentItem.emoji}</div>
        <h2 className="text-xl font-extrabold text-charcoal">{currentItem.labelEl}</h2>
        <p className="text-xs font-bold text-charcoal-muted">
          {currentItem.hasStarCue
            ? '👉 Πάτησε εδώ ή στο κουμπί «Επιλογή Τώρα!»'
            : '🤫 Κράτα τα χέρια ήρεμα... περιμένουμε το 🌟'}
        </p>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-4">
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

        {!currentItem.hasStarCue && (
          <button
            type="button"
            data-testid="wait-signal-next-btn"
            onClick={handleWaitNext}
            className="touch-target px-5 py-3 rounded-2xl bg-sand border-2 border-sand-dark text-charcoal font-bold text-sm flex items-center gap-2 hover:bg-slate-surface"
          >
            <span aria-hidden="true">⏭️</span>
            <span>Άμεσο Επόμενο</span>
          </button>
        )}
      </div>
    </div>
  );
};
