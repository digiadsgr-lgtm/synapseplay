import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { useSpokenPrompt } from '../hooks/useSpokenPrompt';

const IS_TEST_MODE = import.meta.env.MODE === 'test';

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Builds an unpredictable Go/No-Go stream: a random number of no-go items
 * (incl. "lure" items = the target animal WITHOUT the star for ages 6+),
 * followed by the star. In test mode the canonical order is kept.
 */
function buildSignalStream(
  baseStream: SignalItem[],
  ageBand: string,
  hintLevel: number,
  isAdvancedMastery: boolean
): SignalItem[] {
  const target = baseStream.find((i) => i.hasStarCue) ?? baseStream[baseStream.length - 1];
  const fillers = baseStream.filter((i) => !i.hasStarCue);
  const pebble: SignalItem = { emoji: '🪨', labelEl: 'Βότσαλο', hasStarCue: false };

  if (IS_TEST_MODE) {
    if (ageBand === '4-5' && hintLevel < 2) return baseStream.slice(1);
    if (isAdvancedMastery) return [pebble, ...baseStream];
    return baseStream;
  }

  const isYoung = ageBand === '4-5' || ageBand === '5-6';
  const lure: SignalItem = {
    emoji: target.emoji.replace('🌟', ''),
    labelEl: target.labelEl.replace(/ με Χρυσό Αστέρι!?$/, ''),
    hasStarCue: false,
  };
  const pool = isYoung ? fillers : [...fillers, lure, ...(isAdvancedMastery ? [pebble] : [])];
  const [minK, maxK] =
    ageBand === '4-5' ? [1, 2] : ageBand === '5-6' ? [1, 3] : ageBand === '6-8' ? [2, 4] : [2, 5];
  const k = randomInt(minK, maxK);

  const seq: SignalItem[] = [];
  for (let i = 0; i < k; i++) {
    const options = pool.filter((p) => p !== seq[seq.length - 1]);
    seq.push(options[randomInt(0, options.length - 1)]);
  }
  return [...seq, target];
}

/** ±25% jitter so the child cannot "count" the rhythm to the star. */
function jitteredInterval(baseMs: number): number {
  if (IS_TEST_MODE) return baseMs;
  return Math.round(baseMs * (0.75 + Math.random() * 0.5));
}

interface SignalItem {
  emoji: string;
  labelEl: string;
  hasStarCue: boolean;
}

const STREAM_SETS: SignalItem[][] = [
  [
    { emoji: '☁️', labelEl: 'Σύννεφο', hasStarCue: false },
    { emoji: '🍃', labelEl: 'Φύλλο', hasStarCue: false },
    { emoji: '🌟🐢', labelEl: 'Χελώνα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🌊', labelEl: 'Κύμα', hasStarCue: false },
    { emoji: '🐚', labelEl: 'Κοχύλι', hasStarCue: false },
    { emoji: '🌟🐬', labelEl: 'Δελφίνι με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🌲', labelEl: 'Έλατο', hasStarCue: false },
    { emoji: '🍄', labelEl: 'Μανιτάρι', hasStarCue: false },
    { emoji: '🌟🦉', labelEl: 'Κουκουβάγια με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🪐', labelEl: 'Πλανήτης', hasStarCue: false },
    { emoji: '🌙', labelEl: 'Φεγγάρι', hasStarCue: false },
    { emoji: '🌟🚀', labelEl: 'Πύραυλος με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🥁', labelEl: 'Τύμπανο', hasStarCue: false },
    { emoji: '🎹', labelEl: 'Πιάνο', hasStarCue: false },
    { emoji: '🌟🎸', labelEl: 'Κιθάρα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🚲', labelEl: 'Ποδήλατο', hasStarCue: false },
    { emoji: '🚂', labelEl: 'Τρενάκι', hasStarCue: false },
    { emoji: '🌟⛵', labelEl: 'Καραβάκι με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🍎', labelEl: 'Μήλο', hasStarCue: false },
    { emoji: '🍐', labelEl: 'Αχλάδι', hasStarCue: false },
    { emoji: '🌟🍓', labelEl: 'Φράουλα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🐝', labelEl: 'Μέλισσα', hasStarCue: false },
    { emoji: '🐞', labelEl: 'Πασχαλίτσα', hasStarCue: false },
    { emoji: '🌟🦋', labelEl: 'Πεταλούδα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🐻', labelEl: 'Αρκουδάκι', hasStarCue: false },
    { emoji: '🐰', labelEl: 'Κουνελάκι', hasStarCue: false },
    { emoji: '🌟🦊', labelEl: 'Αλεπού με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '⛺', labelEl: 'Σκηνή', hasStarCue: false },
    { emoji: '🔦', labelEl: 'Φακός', hasStarCue: false },
    { emoji: '🌟🧭', labelEl: 'Πυξίδα με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🌷', labelEl: 'Τουλίπα', hasStarCue: false },
    { emoji: '🍀', labelEl: 'Τριφύλλι', hasStarCue: false },
    { emoji: '🌟🌻', labelEl: 'Ηλίανθος με Χρυσό Αστέρι!', hasStarCue: true },
  ],
  [
    { emoji: '🪁', labelEl: 'Χαρταετός', hasStarCue: false },
    { emoji: '🧸', labelEl: 'Αρκουδάκι Παιχνίδι', hasStarCue: false },
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

  // New unpredictable stream on every round / missed star (regenKey)
  const [regenKey, setRegenKey] = useState<number>(0);
  const streamItems = useMemo(
    () => buildSignalStream(baseStream, ageBand, hintLevel, diff.isAdvancedMastery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseStream, ageBand, hintLevel, diff.isAdvancedMastery, regenKey]
  );
  const isCueGuided = diff.isGuided || hintLevel >= 1;

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [stepElapsedMs, setStepElapsedMs] = useState<number>(0);
  const [stepTargetMs, setStepTargetMs] = useState<number>(() => jitteredInterval(diff.cptIntervalMs));

  useEffect(() => {
    setStepElapsedMs(0);
    if (hintLevel === 2) {
      setStepIndex(streamItems.length - 1);
    } else {
      setStepIndex(0);
    }
  }, [currentRound, hintLevel, sessionSeed, streamItems.length]);

  // The pictures start moving only after the rule has been heard
  // (before: the stream — and sometimes the star — ran while the rule was still being spoken).
  const heard = useSpokenPrompt('Πάτα μόνο όταν δεις το χρυσό αστέρι!', {
    enabled: settings.voiceEnabled,
    rate: adaptiveProfile.speechRate,
    resetKey: `${currentRound}-${sessionSeed}`,
    active: hintLevel !== 2,
  });
  const streamRunning = heard || hintLevel === 2;

  const currentItem = streamItems[stepIndex % streamItems.length] ?? streamItems[0];

  // 100% Automatic Continuous Performance Task (CPT) stream progression!
  // Objects appear automatically on screen with a live progress bar; no manual "Next" button required.
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED' || hintLevel === 2 || !streamRunning) return;

    if (!currentItem.hasStarCue) {
      const tickMs = 100;
      const interval = window.setInterval(() => {
        setStepElapsedMs((prev) => prev + tickMs);
      }, tickMs);
      return () => window.clearInterval(interval);
    } else {
      // Missed star (omission): after the response window, start a NEW random stream
      const responseWindowMs = IS_TEST_MODE || isCueGuided ? 5500 : 3000;
      const recycleTimer = window.setTimeout(() => {
        setStepElapsedMs(0);
        setStepIndex(0);
        setStepTargetMs(jitteredInterval(diff.cptIntervalMs));
        if (!IS_TEST_MODE) setRegenKey((k) => k + 1);
      }, responseWindowMs);
      return () => window.clearTimeout(recycleTimer);
    }
  }, [phase, hintLevel, stepIndex, currentItem.hasStarCue, isCueGuided, diff.cptIntervalMs, streamRunning]);

  useEffect(() => {
    if (
      phase === 'PAUSED' ||
      phase === 'COMPLETED' ||
      hintLevel === 2 ||
      currentItem.hasStarCue ||
      stepElapsedMs < stepTargetMs
    ) {
      return;
    }
    const nextIdx = Math.min(streamItems.length - 1, stepIndex + 1);
    setStepElapsedMs(0);
    setStepTargetMs(jitteredInterval(diff.cptIntervalMs));
    setStepIndex(nextIdx);
    // Audio "go" cue only for guided ages / hints — older children must detect the star visually
    if (streamItems[nextIdx]?.hasStarCue && isCueGuided) {
      playCalmTone('soft-step', settings.soundEnabled);
      speakGreek('Τώρα!', settings.voiceEnabled, adaptiveProfile.speechRate, { kind: 'feedback' });
    }
  }, [
    phase,
    hintLevel,
    stepIndex,
    stepElapsedMs,
    currentItem.hasStarCue,
    streamItems,
    diff.cptIntervalMs,
    stepTargetMs,
    isCueGuided,
    settings.soundEnabled,
    settings.voiceEnabled,
    adaptiveProfile.speechRate,
  ]);

  const streamProgressPct = currentItem.hasStarCue
    ? 100
    : Math.min(100, Math.round((stepElapsedMs / Math.max(800, stepTargetMs)) * 100));

  const handleTapTarget = () => {
    runDebounced(() => {
      if (currentItem.hasStarCue) {
        playCalmTone('complete', settings.soundEnabled);
        advanceRound(getAbsorbedCount());
      } else {
        // Reset current non-star wait timer slightly and remind child to wait for the Golden Star
        setStepElapsedMs(0);
        triggerGentleFeedback('Όχι ακόμα! Περιμένουμε το χρυσό αστέρι.');
      }
    });
  };

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" data-testid="activity-09-wait-signal">
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate space-y-2.5">
        <p className="font-extrabold text-charcoal text-lg">
          Πατάω μόνο όταν δω το χρυσό αστέρι 🌟
        </p>

        {/* Live Automatic Stream Progress Bar */}
        <div className="max-w-md mx-auto space-y-1">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-dark">
            <span>{isCueGuided && currentItem.hasStarCue ? '🌟 Τώρα!' : '👀'}</span>
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
          currentItem.hasStarCue && isCueGuided
            ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40 scale-[1.02] shadow-md'
            : 'bg-white border-sand-dark'
        }`}
      >
        <div className="text-7xl select-none" aria-hidden="true">
          {currentItem.emoji}
        </div>
        <h2 className="text-xl font-extrabold text-charcoal">{currentItem.labelEl}</h2>
        {isCueGuided && (
          <p className="text-sm font-extrabold text-charcoal-muted">
            {currentItem.hasStarCue ? '🟢 Πάτα τώρα!' : '🤫 Περιμένουμε…'}
          </p>
        )}
      </button>

      {/* Single Target Action Button */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          data-testid="wait-signal-tap-btn"
          onClick={handleTapTarget}
          className={`touch-target min-w-[260px] px-8 py-4 rounded-3xl border-4 font-extrabold text-lg flex items-center justify-center gap-2.5 transition-all ${
            currentItem.hasStarCue && isCueGuided
              ? 'bg-sage-dark text-white border-charcoal ring-4 ring-sage/40 scale-105'
              : 'bg-sand-light border-sand-dark text-charcoal'
          }`}
        >
          <span className="text-2xl" aria-hidden="true">
            🌟
          </span>
          <span>Είδα το Αστέρι!</span>
        </button>
      </div>
    </div>
  );
};
