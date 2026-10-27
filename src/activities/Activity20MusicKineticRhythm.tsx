import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { isSpeechGateInstant, playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

/**
 * «Ο Μαέστρος» — listen, then repeat.
 *
 * Before (audit 10/2026): the child was told to clap AND to press buttons at the same time,
 * the «rest» had both a button and an automatic timer, nothing was ever played to the child
 * (no model rhythm), and the texts used words like «παρτιτούρα», «μουσικοκινητικό μέτρο».
 * No child understood what to do.
 *
 * Now every round is the classic music-therapy loop:
 *   1. The maestro PLAYS the rhythm: each beat lights up with its own sound
 *      (👏 = clap sound, 🦵 = low knee «thud», 🤫 = silence).
 *   2. «Τώρα εσύ!» → the child taps 👏 / 🦵 in the same order. The buttons ARE the instrument.
 *      On 🤫 the child must NOT tap: waiting quietly is the inhibition exercise.
 *   3. A wrong beat → the maestro simply plays it again.
 */

type PercussionMove = 'clap' | 'knees' | 'rest';

const MOVE_META: Record<PercussionMove, { emoji: string; labelEl: string; colorClass: string }> = {
  clap: { emoji: '👏', labelEl: 'Παλαμάκι', colorClass: 'bg-sage-surface border-sage-dark text-charcoal' },
  knees: { emoji: '🦵', labelEl: 'Γόνατα', colorClass: 'bg-slate-surface border-slate-dark text-charcoal' },
  rest: { emoji: '🤫', labelEl: 'Σιωπή', colorClass: 'bg-terracotta-surface border-terracotta-dark text-charcoal' },
};

const RHYTHM_PATTERNS: PercussionMove[][] = [
  ['clap', 'knees', 'rest'],
  ['knees', 'clap', 'knees'],
  ['clap', 'rest', 'knees'],
  ['knees', 'rest', 'clap'],
  ['rest', 'knees', 'clap'],
  ['clap', 'clap', 'rest'],
  ['knees', 'knees', 'clap'],
  ['clap', 'knees', 'clap'],
  ['rest', 'clap', 'knees'],
  ['knees', 'knees', 'rest'],
  ['rest', 'clap', 'clap'],
  ['knees', 'rest', 'knees'],
];

/** Pattern length grows with age: 2 beats (4-5) → 5 beats (10-12). */
export function buildRhythmForAge(base: PercussionMove[], ageBand: string, enrich: boolean): PercussionMove[] {
  if (ageBand === '4-5') {
    const sounds = base.filter((m) => m !== 'rest');
    const two = sounds.length >= 2 ? sounds.slice(0, 2) : (['clap', 'knees'] as PercussionMove[]);
    return two[0] === two[1] ? [two[0], two[0] === 'clap' ? 'knees' : 'clap'] : two;
  }
  if (ageBand === '5-6') return base;
  if (ageBand === '6-8') return enrich ? [...base, base[0] === 'rest' ? 'clap' : base[0]] : base;
  const four: PercussionMove[] = [...base, base[0] === 'rest' ? 'clap' : base[0]];
  if (ageBand === '10-12' || enrich) return [...four, base[1] === 'rest' ? 'knees' : base[1]];
  return four;
}

const BEAT_MS: Record<string, number> = { '4-5': 1000, '5-6': 900, '6-8': 800, '8-10': 700, '10-12': 650 };

type Stage = 'intro' | 'demo' | 'turn';

export const Activity20MusicKineticRhythm: React.FC<ActivityRunnerRenderProps> = ({
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
  const activeRounds = useMemo(
    () => selectSessionRounds(RHYTHM_PATTERNS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const pattern = useMemo(
    () =>
      buildRhythmForAge(
        activeRounds[(currentRound - 1) % activeRounds.length],
        ageBand,
        Boolean(adaptiveProfile.enrichChallenge)
      ),
    [activeRounds, currentRound, ageBand, adaptiveProfile.enrichChallenge]
  );
  const beatMs = BEAT_MS[ageBand] ?? 800;
  const restMs = Math.round(beatMs * 1.3);
  const isYoung = ageBand === '4-5' || ageBand === '5-6';
  const halted = phase === 'PAUSED' || phase === 'COMPLETED';

  const [stage, setStage] = useState<Stage>('intro');
  const [demoBeat, setDemoBeat] = useState<number | null>(null);
  const [demoRun, setDemoRun] = useState<number>(0);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [restRun, setRestRun] = useState<number>(0);
  const earlyTapsRef = useRef<number>(0);

  // 1. Round start: one short instruction, THEN the maestro plays
  useEffect(() => {
    let alive = true;
    setStage('intro');
    setStepIdx(0);
    setDemoBeat(null);
    earlyTapsRef.current = 0;
    const intro =
      currentRound === 1
        ? pattern.includes('rest')
          ? 'Παλαμάκι, γόνατα και σιωπή! Κοίτα και άκου τον μαέστρο.'
          : 'Παλαμάκι και γόνατα! Κοίτα και άκου τον μαέστρο.'
        : 'Άκου τον μαέστρο.';
    const startDemo = () => {
      if (!alive) return;
      setStage('demo');
      setDemoRun((r) => r + 1);
    };
    const spoken = speakGreek(intro, settings.voiceEnabled, adaptiveProfile.speechRate);
    if (isSpeechGateInstant()) startDemo();
    else void spoken.then(startDemo);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, sessionSeed]);

  // 2. The maestro plays the rhythm (restarts from the beginning after a pause)
  useEffect(() => {
    if (stage !== 'demo' || halted) return;
    const timers: number[] = [];
    pattern.forEach((mv, i) => {
      timers.push(
        window.setTimeout(() => {
          setDemoBeat(i);
          if (mv !== 'rest') playCalmTone(mv, settings.soundEnabled);
        }, 300 + i * beatMs)
      );
    });
    timers.push(
      window.setTimeout(() => {
        setDemoBeat(null);
        setStepIdx(0);
        setStage('turn');
        speakGreek('Τώρα εσύ!', settings.voiceEnabled, adaptiveProfile.speechRate);
      }, 300 + pattern.length * beatMs + 250)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stage, demoRun, halted, pattern, beatMs, settings.soundEnabled, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const expectedMove = pattern[stepIdx];

  const completeStep = useCallback(() => {
    if (stepIdx + 1 >= pattern.length) {
      setStage('intro');
      advanceRound(getAbsorbedCount() + earlyTapsRef.current);
    } else {
      setStepIdx((s) => s + 1);
    }
  }, [stepIdx, pattern.length, advanceRound, getAbsorbedCount]);

  const completeStepRef = useRef(completeStep);
  completeStepRef.current = completeStep;

  // 3. Silence beat: the child waits without tapping → it passes by itself
  useEffect(() => {
    if (stage !== 'turn' || halted || expectedMove !== 'rest') return;
    const t = window.setTimeout(() => {
      playCalmTone('soft-step', settings.soundEnabled);
      completeStepRef.current();
    }, restMs);
    return () => window.clearTimeout(t);
  }, [stage, halted, expectedMove, stepIdx, restRun, restMs, settings.soundEnabled]);

  const replayDemo = () => {
    setStepIdx(0);
    setStage('demo');
    setDemoRun((r) => r + 1);
  };

  const handleMovePress = (move: Exclude<PercussionMove, 'rest'>) => {
    if (stage !== 'turn') {
      // Tapping while the maestro plays: not an error, just counted as an impulsive tap
      earlyTapsRef.current += 1;
      return;
    }
    runDebounced(() => {
      playCalmTone(move, settings.soundEnabled);
      if (expectedMove === 'rest') {
        setRestRun((r) => r + 1); // restart the silence
        triggerGentleFeedback('Σσσ! Εδώ είναι η σιωπή. Περίμενε χωρίς να πατήσεις.');
        return;
      }
      if (move === expectedMove) {
        completeStep();
        return;
      }
      triggerGentleFeedback(`Ο μαέστρος έκανε ${MOVE_META[expectedMove].labelEl.toLowerCase()}. Άκου τον ξανά!`);
      window.setTimeout(replayDemo, 2800); // after the short correction has been heard
    });
  };

  // Rhythm slots: during the child's turn the symbols stay visible only for the young ages or with a hint
  const showSymbolsInTurn = isYoung || hintLevel >= 1;
  const highlightNext = hintLevel >= 2 || (ageBand === '4-5' && hintLevel >= 1);

  return (
    <div
      className="space-y-5 text-center"
      data-testid="activity-20-music-kinetic-rhythm"
      data-stage={stage}
      data-next-move={stage === 'turn' ? expectedMove : ''}
      data-pattern={pattern.join(',')}
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-sand-dark space-y-3">
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal" data-testid="rhythm-stage-title">
          {stage === 'turn' ? '🙋 Τώρα εσύ! Με την ίδια σειρά.' : '🎼 Ο μαέστρος παίζει… κοίτα και άκου!'}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3" aria-live="polite">
          {pattern.map((mv, idx) => {
            const meta = MOVE_META[mv];
            const isDemoNow = stage === 'demo' && demoBeat === idx;
            const isDone = stage === 'turn' && idx < stepIdx;
            const isCurrent = stage === 'turn' && idx === stepIdx;
            const visible = stage !== 'turn' || isDone || showSymbolsInTurn || (isCurrent && mv === 'rest');
            return (
              <div
                key={`${mv}-${idx}`}
                data-testid={`rhythm-score-slot-${idx}`}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 flex flex-col items-center justify-center transition-all ${
                  isDemoNow
                    ? 'bg-ochre border-charcoal scale-110'
                    : isDone
                    ? 'bg-sage text-white border-sage-dark'
                    : isCurrent
                    ? 'bg-slate-surface border-charcoal'
                    : 'bg-sand-light border-sand-dark'
                }`}
              >
                <span className="text-4xl" aria-hidden="true">{visible ? meta.emoji : '❓'}</span>
                <span className="text-xs font-extrabold">{visible ? meta.labelEl : idx + 1}</span>
              </div>
            );
          })}
        </div>

        {stage === 'turn' && expectedMove === 'rest' && (
          <p className="text-base font-extrabold text-terracotta-dark" data-testid="rhythm-rest-cue">
            🤫 Σιωπή! Μην πατήσεις τίποτα…
          </p>
        )}
      </div>

      {/* The two «instruments» */}
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {(['clap', 'knees'] as const).map((mv) => {
          const meta = MOVE_META[mv];
          const highlight = stage === 'turn' && highlightNext && mv === expectedMove;
          return (
            <button
              key={mv}
              type="button"
              data-testid={`music-kinetic-btn-${mv}`}
              onClick={() => handleMovePress(mv)}
              aria-label={meta.labelEl}
              className={`touch-target min-h-[140px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                stage !== 'turn' ? 'opacity-60 ' : ''
              }${highlight ? 'bg-sage-surface border-charcoal ring-4 ring-sage/50 scale-105' : `${meta.colorClass} hover:opacity-90`}`}
            >
              <span className="text-6xl" aria-hidden="true">{meta.emoji}</span>
              <span className="text-lg font-extrabold">{meta.labelEl}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="px-3 py-1.5 rounded-full bg-terracotta-surface border border-terracotta-dark font-bold">
          🤫 = σιωπή: περιμένω χωρίς να πατήσω
        </span>
        <button
          type="button"
          data-testid="rhythm-replay-btn"
          onClick={replayDemo}
          disabled={stage !== 'turn'}
          className="touch-target px-4 py-2 rounded-2xl bg-white border-2 border-slate font-extrabold disabled:opacity-50"
        >
          🔁 Δείξε μου ξανά
        </button>
      </div>
    </div>
  );
};
