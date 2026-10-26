import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface PulsePhase {
  mode: 'go' | 'freeze';
  instructionEl: string;
  seatedInstructionEl: string;
  spokenCueEl: string;
}

const PHASES: PulsePhase[] = [
  {
    mode: 'go',
    instructionEl: 'Πράσινο Φανάρι! Κούνησε ρυθμικά τα χέρια και χτύπα το πράσινο τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο Φανάρι (Καθιστή Εκδοχή)! Χτύπα απαλά τα δάχτυλα και πάτα το πράσινο τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο φανάρι! Χτύπα το πράσινο τύμπανο δύο φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ! Πάγωσε σαν άγαλμα! Κράτα τα χέρια σου ακίνητα και ΜΗΝ πατήσεις τίποτα μέχρι να γεμίσει η μπάρα!',
    seatedInstructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ (Καθιστή Εκδοχή)! Ακούμπησε ήρεμα τις παλάμες στα γόνατα και ΜΗΝ πατήσεις τίποτα μέχρι να γεμίσει η μπάρα!',
    spokenCueEl: 'Στοπ! Πάγωσε σαν άγαλμα! Μην πατήσεις τίποτα μέχρι να γεμίσει η μπάρα!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο Φανάρι ξανά! Ρυθμική κίνηση — χτύπα το πράσινο τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο Φανάρι ξανά (Καθιστή Εκδοχή)! Ρυθμικό άγγιγμα — πάτα το πράσινο τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο φανάρι ξανά! Χτύπα ρυθμικά το τύμπανο δύο φορές!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο! Άνοιξε και κλείσε τις παλάμες ρυθμικά και χτύπα το τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο (Καθιστή Εκδοχή)! Ακούμπησε τους ώμους ρυθμικά και χτύπα το τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο σήμα! Χτύπα το πράσινο τύμπανο δύο φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ! Κάνε το ακίνητο δεντράκι με βαθιά ανάσα — ΜΗΝ αγγίζεις την οθόνη μέχρι να γεμίσει η μπάρα!',
    seatedInstructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ (Καθιστή Εκδοχή)! Κράτα την πλάτη ίσια και ΜΗΝ αγγίζεις την οθόνη μέχρι να γεμίσει η μπάρα!',
    spokenCueEl: 'Στοπ! Κράτα το σώμα σου εντελώς ακίνητο χωρίς να πατήσεις την οθόνη!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο! Σήκωσε εναλλάξ τις φτέρνες σου και χτύπα το πράσινο τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο (Καθιστή Εκδοχή)! Χτύπα ρυθμικά τα πέλματα στο πάτωμα και πάτα το τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο φανάρι! Χτύπα το τύμπανο δύο φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ! Γίνε ακίνητος βράχος στη θάλασσα — ΜΗΝ πατήσεις τίποτα μέχρι να γεμίσει η μπάρα!',
    seatedInstructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ (Καθιστή Εκδοχή)! Σταύρωσε απαλά τα χέρια στο στήθος και ΜΗΝ πατήσεις τίποτα μέχρι να γεμίσει η μπάρα!',
    spokenCueEl: 'Στοπ! Κράτα το σώμα σου σταθερό σαν βράχο χωρίς να αγγίξεις την οθόνη!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο Φανάρι! Τέντωσε ψηλά τα χέρια σου και χτύπα το πράσινο τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο Φανάρι (Καθιστή Εκδοχή)! Τέντωσε μπροστά τα χέρια και πάτα το πράσινο τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο φανάρι! Τέντωσε τα χέρια και χτύπα το τύμπανο δύο φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ! Πάγωσε σαν χιονάνθρωπος — πάρε ήρεμη ανάσα και ΜΗΝ αγγίξεις την οθόνη!',
    seatedInstructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ (Καθιστή Εκδοχή)! Κράτα τα χέρια σταθερά στους μηρούς και ΜΗΝ αγγίξεις την οθόνη!',
    spokenCueEl: 'Στοπ! Πάγωσε σαν χιονάνθρωπος μέχρι να γεμίσει η μπάρα!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο! Κάνε δύο μικρά βήματα επί τόπου και χτύπα το πράσινο τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο (Καθιστή Εκδοχή)! Κούνησε ρυθμικά τους ώμους και πάτα το πράσινο τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο σήμα! Κινήσου ρυθμικά και χτύπα το τύμπανο δύο φορές!',
  },
  {
    mode: 'freeze',
    instructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ! Γίνε ήσυχη κουκουβάγια στο κλαδί — ΜΗΝ πατήσεις τίποτα μέχρι να γεμίσει η μπάρα!',
    seatedInstructionEl:
      'ΚΟΚΚΙΝΟ ΣΤΟΠ (Καθιστή Εκδοχή)! Κράτα το κεφάλι και τα χέρια ήρεμα χωρίς να πατήσεις την οθόνη!',
    spokenCueEl: 'Στοπ! Κράτα το σώμα σου ήρεμο και ακίνητο μέχρι να γεμίσει η μπάρα!',
  },
  {
    mode: 'go',
    instructionEl: 'Πράσινο Φανάρι! Κάνε κύκλους με τους καρπούς σου και χτύπα το τύμπανο 2 φορές!',
    seatedInstructionEl:
      'Πράσινο Φανάρι (Καθιστή Εκδοχή)! Γύρισε απαλά τους καρπούς και πάτα το τύμπανο 2 φορές!',
    spokenCueEl: 'Πράσινο φανάρι! Χτύπα ρυθμικά το τύμπανο δύο φορές!',
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
  const { settings } = useApp();
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
  const [freezeElapsedMs, setFreezeElapsedMs] = useState<number>(0);
  // The app cannot see the child's body: when the statue timer fills, an adult/child
  // confirms with one tap (also proves someone is still in front of the screen).
  const [freezeDone, setFreezeDone] = useState<boolean>(false);

  const advanceRef = useRef(advanceRound);
  advanceRef.current = advanceRound;
  const absorbedRef = useRef(getAbsorbedCount);
  absorbedRef.current = getAbsorbedCount;

  useEffect(() => {
    setGoTaps(0);
    setFreezeElapsedMs(0);
    setFreezeDone(false);
    speakGreek(phase.spokenCueEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [currentRound, sessionSeed, phase.spokenCueEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  // Live Statue Stillness Timer during FREEZE phase:
  // The child must NOT press anything while the stillness bar fills up to 100%!
  // If they stay still for diff.freezeHoldMs (~3s), the round completes automatically!
  useEffect(() => {
    if (
      runnerPhase === 'PAUSED' ||
      runnerPhase === 'COMPLETED' ||
      phase.mode !== 'freeze' ||
      freezeDone
    ) {
      return;
    }

    const stepMs = 100;
    const interval = window.setInterval(() => {
      setFreezeElapsedMs((prev) => prev + stepMs);
    }, stepMs);

    return () => window.clearInterval(interval);
  }, [runnerPhase, phase.mode, currentRound, freezeDone]);

  useEffect(() => {
    if (runnerPhase === 'PAUSED' || runnerPhase === 'COMPLETED' || phase.mode !== 'freeze') {
      return;
    }
    if (!freezeDone && freezeElapsedMs >= diff.freezeHoldMs) {
      setFreezeDone(true);
      playCalmTone('soft-step', settings.soundEnabled);
    }
  }, [runnerPhase, phase.mode, freezeElapsedMs, diff.freezeHoldMs, settings.soundEnabled, freezeDone]);

  const handleFreezeConfirm = () => {
    runDebounced(() => {
      setFreezeDone(false);
      setFreezeElapsedMs(0);
      playCalmTone('complete', settings.soundEnabled);
      advanceRef.current(absorbedRef.current());
    });
  };

  const freezeProgressPct = Math.min(
    100,
    Math.round((freezeElapsedMs / Math.max(1000, diff.freezeHoldMs)) * 100)
  );
  const remainingFreezeSec = Math.max(
    0,
    (diff.freezeHoldMs - freezeElapsedMs) / 1000
  ).toFixed(1);

  const handleDrumPadTap = () => {
    runDebounced(() => {
      if (phase.mode === 'freeze') {
        if (freezeDone) return;
        // Child impulsively tapped during RED STOP! Reset the stillness timer and guide gently:
        setFreezeElapsedMs(0);
        triggerGentleFeedback(
          'Ώπα! Το φανάρι είναι ΚΟΚΚΙΝΟ ΣΤΟΠ 🛑! Κράτα τα χεράκια σου ακίνητα χωρίς να πατάς το τύμπανο μέχρι να γεμίσει η μπάρα!'
        );
        return;
      }
      playCalmTone('pulse', settings.soundEnabled);
      const next = goTaps + 1;
      if (next >= 2) {
        setGoTaps(0);
        advanceRound(getAbsorbedCount());
      } else {
        setGoTaps(next);
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-07-move-freeze">
      {/* Live Traffic Light Stage */}
      <div
        data-testid={`signal-card-${phase.mode}`}
        onClick={phase.mode === 'go' ? handleDrumPadTap : undefined}
        className={`p-6 rounded-3xl border-4 max-w-xl mx-auto space-y-4 transition-all ${
          phase.mode === 'go'
            ? 'bg-sage-surface border-sage-dark shadow-sm cursor-pointer'
            : 'bg-terracotta-surface border-terracotta-dark shadow-sm'
        }`}
      >
        {/* Traffic Light Visual Header */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border-2 border-charcoal/20">
          <span
            className={`w-5 h-5 rounded-full ${
              phase.mode === 'go' ? 'bg-sage-dark animate-pulse' : 'bg-charcoal/20'
            }`}
          />
          <span
            className={`w-5 h-5 rounded-full ${
              phase.mode === 'freeze' ? 'bg-terracotta-dark animate-pulse' : 'bg-charcoal/20'
            }`}
          />
          <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal">
            {phase.mode === 'go' ? '🟢 ΠΡΑΣΙΝΟ: ΚΙΝΗΣΗ' : '🛑 ΚΟΚΚΙΝΟ: ΑΚΙΝΗΤΟ ΑΓΑΛΜΑ'}
          </span>
        </div>

        <div className="text-6xl" aria-hidden="true">
          {phase.mode === 'go' ? '🌿🥁' : '🛑🧘'}
        </div>

        <h2 className="text-2xl font-extrabold text-charcoal">
          {phase.mode === 'go'
            ? 'Πράσινο Σήμα: Ρυθμική Κίνηση!'
            : 'Κόκκινο Σήμα: Πάγωσε σαν Άγαλμα!'}
        </h2>

        <p className="text-lg font-bold text-charcoal" data-testid="move-freeze-instruction">
          {seatedMode ? phase.seatedInstructionEl : phase.instructionEl}
        </p>

        {phase.mode === 'go' ? (
          <div className="space-y-2 pt-1">
            <p className="text-sm font-extrabold text-sage-dark" data-testid="move-freeze-tap-counter">
              Ρυθμικά χτυπήματα στο τύμπανο: {goTaps} / 2
            </p>
            <div className="flex items-center justify-center gap-3">
              {[0, 1].map((idx) => (
                <span
                  key={idx}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-extrabold text-sm ${
                    idx < goTaps
                      ? 'bg-sage-dark text-white border-charcoal'
                      : 'bg-white text-charcoal border-sage-dark'
                  }`}
                >
                  {idx < goTaps ? '✓' : idx + 1}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Live Stillness Progress Bar during FREEZE — Child wins by NOT touching anything! */
          <div className="space-y-2 pt-2 max-w-md mx-auto" data-testid="freeze-stillness-meter">
            <div className="flex items-center justify-between text-xs font-extrabold text-charcoal">
              <span>🧘 Χρόνος Αγάλματος</span>
              <span>{remainingFreezeSec} δευτ.</span>
            </div>
            <div className="w-full h-5 rounded-full bg-white border-2 border-terracotta-dark overflow-hidden p-0.5">
              <div
                data-testid="freeze-stillness-progress-bar"
                className="h-full bg-sage-dark rounded-full transition-all duration-100"
                style={{ width: `${freezeProgressPct}%` }}
              />
            </div>
            {freezeDone ? (
              <div className="space-y-2 pt-1" data-testid="freeze-confirm-panel">
                <button
                  type="button"
                  data-testid="freeze-confirm-btn"
                  onClick={handleFreezeConfirm}
                  className="touch-target w-full px-6 py-4 rounded-3xl bg-sage text-white border-4 border-charcoal font-extrabold text-xl"
                >
                  🗿 Έμεινα άγαλμα!
                </button>
                <p className="text-xs font-bold text-charcoal-muted">
                  Γονέα: η εφαρμογή δεν βλέπει το σώμα — επιβεβαιώστε εσείς ότι το παιδί έμεινε ακίνητο.
                </p>
              </div>
            ) : (
              <p className="text-xs font-bold text-charcoal-muted">
                Μείνε ακίνητος σαν άγαλμα μέχρι να γεμίσει η μπάρα!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Single Drum Pad Action Control (Hidden at Hint Level 2 during FREEZE to prevent impulsive error) */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {!(hintLevel === 2 && phase.mode === 'freeze') && (
          <button
            type="button"
            data-testid="move-freeze-go-btn"
            onClick={handleDrumPadTap}
            className={`touch-target min-w-[260px] min-h-[104px] px-8 py-5 rounded-3xl border-4 font-extrabold text-xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              phase.mode === 'go'
                ? 'bg-sage text-white border-charcoal ring-4 ring-sage/40 hover:bg-sage-dark scale-[1.02]'
                : 'bg-sand-light border-sand-dark text-charcoal-muted opacity-75'
            }`}
          >
            <span className="text-4xl" aria-hidden="true">
              {phase.mode === 'go' ? '🥁🌿' : '🤫🛑'}
            </span>
            <span>
              {phase.mode === 'go'
                ? `Χτύπα το Τύμπανο! (${goTaps}/2)`
                : 'Τύμπανο (ΜΗΝ ΠΑΤΗΣΕΙΣ στο Κόκκινο!)'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
