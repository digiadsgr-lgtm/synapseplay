import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';

interface PulsePhase {
  mode: 'go' | 'freeze';
  instructionEl: string;
  seatedInstructionEl: string;
}

const PHASES: PulsePhase[] = [
  {
    mode: 'go',
    instructionEl: 'Πράσινο Σήμα! Κούνησε ρυθμικά τα χέρια και πάτα το πράσινο κουμπί 2 φορές!',
    seatedInstructionEl:
      'Πράσινο Σήμα (Καθιστή)! Χτύπα απαλά τα δάχτυλα και πάτα το πράσινο κουμπί 2 φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'Στοπ! Πάγωσε σαν άγαλμα! Μην πατήσεις το κουμπί κίνησης — πάτα «Έμεινα Ακίνητος»!',
    seatedInstructionEl:
      'Στοπ (Καθιστή)! Ακούμπησε ήρεμα τις παλάμες στα γόνατα και πάτα «Έμεινα Ακίνητος»!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο ξανά! Ρυθμική κίνηση! Πάτα το πράσινο κουμπί 2 φορές!',
    seatedInstructionEl:
      'Πράσινο ξανά (Καθιστή)! Ρυθμικό άγγιγμα! Πάτα το πράσινο κουμπί 2 φορές!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο! Άνοιξε και κλείσε τις παλάμες ρυθμικά και πάτα το πράσινο κουμπί 2 φορές!',
    seatedInstructionEl:
      'Πράσινο (Καθιστή)! Ακούμπησε τους ώμους ρυθμικά και πάτα το πράσινο κουμπί 2 φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'Στοπ! Κάνε το ακίνητο δεντράκι με βαθιά ανάσα και πάτα «Έμεινα Ακίνητος»!',
    seatedInstructionEl:
      'Στοπ (Καθιστή)! Κράτα την πλάτη ίσια, πάρε ανάσα και πάτα «Έμεινα Ακίνητος»!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο! Σήκωσε εναλλάξ τις φτέρνες σου και πάτα το πράσινο κουμπί 2 φορές!',
    seatedInstructionEl:
      'Πράσινο (Καθιστή)! Χτύπα ρυθμικά τα πέλματα στο πάτωμα και πάτα το πράσινο κουμπί 2 φορές!',
  },
];

export const Activity07MoveFreeze: React.FC<ActivityRunnerRenderProps> = ({
  phase: runnerPhase,
  currentRound,
  totalRounds,
  hintLevel,
  seatedMode,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const diff = useMemo(
    () => getAgeAndPerformanceDifficulty(ageBand, adaptiveProfile, hintLevel),
    [ageBand, adaptiveProfile, hintLevel]
  );

  const activePhases = useMemo(
    () => selectSessionRounds(PHASES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const phase = activePhases[(currentRound - 1) % activePhases.length];
  const [goTaps, setGoTaps] = useState<number>(0);
  const advanceRef = useRef(advanceRound);
  advanceRef.current = advanceRound;
  const absorbedRef = useRef(getAbsorbedCount);
  absorbedRef.current = getAbsorbedCount;

  useEffect(() => {
    setGoTaps(0);
  }, [currentRound, sessionSeed]);

  // Automatic Statue Hold Timer during FREEZE phase:
  // If the child stays still without pressing the GO button for freezeHoldMs (~3s), the round completes automatically!
  useEffect(() => {
    if (runnerPhase === 'PAUSED' || runnerPhase === 'COMPLETED' || phase.mode !== 'freeze') {
      return;
    }
    const timer = window.setTimeout(() => {
      setGoTaps(0);
      advanceRef.current(absorbedRef.current());
    }, diff.freezeHoldMs);
    return () => window.clearTimeout(timer);
  }, [runnerPhase, phase.mode, currentRound, diff.freezeHoldMs]);

  const handleGoPulseTap = () => {
    runDebounced(() => {
      if (phase.mode === 'freeze') {
        triggerGentleFeedback(
          'Ώπα! Τώρα έχουμε το σήμα ΣΤΟΠ 🛑. Παίρνουμε μια ανάσα και μένουμε ακίνητοι!'
        );
        return;
      }
      const next = goTaps + 1;
      if (next >= 2) {
        setGoTaps(0);
        advanceRound(getAbsorbedCount());
      } else {
        setGoTaps(next);
      }
    });
  };

  const handleFreezeConfirm = () => {
    runDebounced(() => {
      if (phase.mode === 'go') {
        triggerGentleFeedback(
          'Τώρα το σήμα είναι ΠΡΑΣΙΝΟ 🌿! Πάτησε το πράσινο κουμπί ρυθμικά.'
        );
        return;
      }
      setGoTaps(0);
      advanceRound(getAbsorbedCount());
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-07-move-freeze">
      {/* Visual Signal Indicator (also clickable for intuitive direct child interaction!) */}
      <div
        data-testid={`signal-card-${phase.mode}`}
        onClick={() => (phase.mode === 'go' ? handleGoPulseTap() : handleFreezeConfirm())}
        className={`p-6 rounded-3xl border-4 max-w-xl mx-auto space-y-3 transition-colors cursor-pointer ${
          phase.mode === 'go'
            ? 'bg-sage-surface border-sage-dark'
            : 'bg-terracotta-surface border-terracotta-dark'
        }`}
      >
        <div className="text-6xl" aria-hidden="true">
          {phase.mode === 'go' ? '🌿🥁' : '🛑🧘'}
        </div>
        <h2 className="text-2xl font-extrabold text-charcoal">
          {phase.mode === 'go' ? 'Σήμα: Κίνηση' : 'Σήμα: Πάγωσε σαν Άγαλμα!'}
        </h2>
        <p className="text-lg font-bold text-charcoal" data-testid="move-freeze-instruction">
          {seatedMode ? phase.seatedInstructionEl : phase.instructionEl}
        </p>
        {phase.mode === 'go' ? (
          <p className="text-sm font-extrabold text-sage-dark" data-testid="move-freeze-tap-counter">
            Ρυθμικά πατήματα: {goTaps} / 2
          </p>
        ) : (
          <p className="text-xs font-extrabold text-charcoal-muted">
            ⏳ Μείνε ακίνητος για {(diff.freezeHoldMs / 1000).toFixed(1)} δευτ. (ολοκληρώνεται αυτόματα) ή πάτα «Έμεινα Ακίνητος!»
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {(!diff.isSimplified || phase.mode === 'go') && (
          <button
            type="button"
            data-testid="move-freeze-go-btn"
            onClick={handleGoPulseTap}
            className={`touch-target min-w-[220px] min-h-[96px] px-6 py-4 rounded-3xl border-4 font-extrabold text-xl flex flex-col items-center justify-center gap-1 ${
              diff.isGuided && phase.mode === 'go'
                ? 'bg-sage text-white border-charcoal ring-4 ring-sage/50'
                : 'bg-sage-surface border-sage-dark text-charcoal hover:bg-sage hover:text-white'
            }`}
          >
            <span className="text-3xl" aria-hidden="true">🌿</span>
            <span>Ρυθμικό Πάτημα ({goTaps}/2)</span>
          </button>
        )}

        {(!diff.isSimplified || phase.mode === 'freeze') && (
          <button
            type="button"
            data-testid="move-freeze-stop-btn"
            onClick={handleFreezeConfirm}
            className={`touch-target min-w-[220px] min-h-[96px] px-6 py-4 rounded-3xl border-4 font-extrabold text-xl flex flex-col items-center justify-center gap-1 ${
              diff.isGuided && phase.mode === 'freeze'
                ? 'bg-terracotta-dark text-white border-charcoal ring-4 ring-terracotta/50'
                : 'bg-terracotta-surface border-terracotta-dark text-charcoal hover:bg-terracotta-dark hover:text-white'
            }`}
          >
            <span className="text-3xl" aria-hidden="true">🛑</span>
            <span>Έμεινα Ακίνητος!</span>
          </button>
        )}
      </div>
    </div>
  );
};
