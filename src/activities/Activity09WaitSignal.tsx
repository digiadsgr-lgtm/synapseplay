import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
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
  [
    { emoji: '🍎', labelEl: 'Μήλο (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🍐', labelEl: 'Αχλάδι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🍓', labelEl: 'Φράουλα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🐝', labelEl: 'Μέλισσα (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🐞', labelEl: 'Πασχαλίτσα (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🦋', labelEl: 'Πεταλούδα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🐻', labelEl: 'Αρκουδάκι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🐰', labelEl: 'Κουνελάκι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🦊', labelEl: 'Αλεπού με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '⛺', labelEl: 'Σκηνή (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🔦', labelEl: 'Φακός (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🧭', labelEl: 'Πυξίδα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🌷', labelEl: 'Τουλίπα (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🍀', labelEl: 'Τριφύλλι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🌻', labelEl: 'Ηλίανθος με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🪁', labelEl: 'Χαρταετός (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🧸', labelEl: 'Αρκουδάκι Παιχνίδι (Χωρίς Αστέρι)', hasStarCue: false },
    { emoji: '🌟🎈', labelEl: 'Μπαλόνι με Χρυσό Αστέρι!', hasStarCue: true },
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

  // Calibrate stream length by age band & live performance
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
  const [stepElapsedMs, setStepElapsedMs] = useState<number>(0);

  useEffect(() => {
    setStepElapsedMs(0);
    if (hintLevel === 2) {
      setStepIndex(streamItems.length - 1);
    } else {
      setStepIndex(0);
    }
  }, [currentRound, hintLevel, sessionSeed, streamItems.length]);

  const currentItem = streamItems[stepIndex % streamItems.length] ?? streamItems[0];

  // 100% Automatic Continuous Performance Task (CPT) stream progression!
  // Objects appear automatically on screen with a live progress bar; no manual "Next" button required.
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED' || hintLevel === 2) return;

    if (!currentItem.hasStarCue) {
      const tickMs = 100;
      const interval = window.setInterval(() => {
        setStepElapsedMs((prev) => {
          const nextElapsed = prev + tickMs;
          if (nextElapsed >= diff.cptIntervalMs) {
            window.clearInterval(interval);
            setStepIndex((idx) => {
              const nextIdx = Math.min(streamItems.length - 1, idx + 1);
              if (streamItems[nextIdx]?.hasStarCue) {
                playCalmTone('soft-step', settings.soundEnabled);
                speakGreek(
                  'Χρυσό αστέρι! Πάτησε τώρα!',
                  settings.voiceEnabled,
                  adaptiveProfile.speechRate
                );
              }
              return nextIdx;
            });
            return 0;
          }
          return nextElapsed;
        });
      }, tickMs);
      return () => window.clearInterval(interval);
    } else {
      // If the child doesn't tap the Golden Star within 5.5s, loop the stream smoothly so it stays alive
      const recycleTimer = window.setTimeout(() => {
        setStepElapsedMs(0);
        setStepIndex(0);
      }, 5500);
      return () => window.clearTimeout(recycleTimer);
    }
  }, [
    phase,
    hintLevel,
    stepIndex,
    currentItem.hasStarCue,
    streamItems,
    diff.cptIntervalMs,
    settings.soundEnabled,
    settings.voiceEnabled,
    adaptiveProfile.speechRate,
  ]);

  const streamProgressPct = currentItem.hasStarCue
    ? 100
    : Math.min(100, Math.round((stepElapsedMs / Math.max(800, diff.cptIntervalMs)) * 100));

  const handleTapTarget = () => {
    runDebounced(() => {
      if (currentItem.hasStarCue) {
        playCalmTone('complete', settings.soundEnabled);
        advanceRound(getAbsorbedCount());
      } else {
        // Reset current non-star wait timer slightly and remind child to wait for the Golden Star
        setStepElapsedMs(0);
        triggerGentleFeedback(
          `Ώπα! Το «${currentItem.labelEl}» δεν έχει το Χρυσό Αστέρι 🌟 — κράτα τα χεράκια ήρεμα μέχρι να εμφανιστεί το αστέρι!`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" data-testid="activity-09-wait-signal">
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate space-y-2.5">
        <p className="font-extrabold text-charcoal text-lg">
          Κανόνας: Κοιτάζω τις εικόνες που αλλάζουν μόνες τους και πατάω ΜΟΝΟ όταν εμφανιστεί το Χρυσό Αστέρι 🌟!
        </p>

        {/* Live Automatic Stream Progress Bar */}
        <div className="max-w-md mx-auto space-y-1">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-dark">
            <span>
              {currentItem.hasStarCue
                ? '🌟 ΤΟ ΧΡΥΣΟ ΑΣΤΕΡΙ ΕΜΦΑΝΙΣΤΗΚΕ! ΠΑΤΑ ΤΩΡΑ!'
                : '⏳ Η επόμενη εικόνα έρχεται αυτόματα... (Μην πατήσεις!)'}
            </span>
            <span>
              Εικόνα {stepIndex + 1}/{streamItems.length}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-white border border-slate overflow-hidden">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                currentItem.hasStarCue ? 'bg-sage-dark' : 'bg-slate'
              }`}
              style={{ width: `${streamProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Central Stage — Objects glide automatically on screen */}
      <button
        type="button"
        onClick={handleTapTarget}
        data-testid={currentItem.hasStarCue ? 'signal-stage-ready' : 'signal-stage-waiting'}
        className={`touch-target w-full p-8 rounded-3xl border-4 space-y-3 transition-all cursor-pointer ${
          currentItem.hasStarCue
            ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40 scale-[1.02] shadow-md'
            : 'bg-white border-sand-dark'
        }`}
      >
        <div className="text-7xl select-none" aria-hidden="true">
          {currentItem.emoji}
        </div>
        <h2 className="text-xl font-extrabold text-charcoal">{currentItem.labelEl}</h2>
        <p className="text-sm font-extrabold text-charcoal-muted">
          {currentItem.hasStarCue
            ? '🟢 Πάτησε την εικόνα ή το πράσινο κουμπί ΤΩΡΑ!'
            : '🤫 Δεν έχει Χρυσό Αστέρι — περιμένουμε ήρεμα...'}
        </p>
      </button>

      {/* Single Target Action Button */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          data-testid="wait-signal-tap-btn"
          onClick={handleTapTarget}
          className={`touch-target min-w-[260px] px-8 py-4 rounded-3xl border-4 font-extrabold text-lg flex items-center justify-center gap-2.5 transition-all ${
            currentItem.hasStarCue
              ? 'bg-sage-dark text-white border-charcoal ring-4 ring-sage/40 scale-105'
              : 'bg-sand-light border-sand-dark text-charcoal-muted opacity-80'
          }`}
        >
          <span className="text-2xl" aria-hidden="true">
            {currentItem.hasStarCue ? '🌟' : '✋'}
          </span>
          <span>
            {currentItem.hasStarCue
              ? 'Είδα το Χρυσό Αστέρι — Πάτα Τώρα!'
              : 'Περίμενε το Χρυσό Αστέρι...'}
          </span>
        </button>
      </div>
    </div>
  );
};
