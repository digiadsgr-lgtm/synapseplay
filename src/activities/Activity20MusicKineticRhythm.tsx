import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

type PercussionMove = 'clap' | 'knees' | 'rest';

interface RhythmPatternRound {
  tempoTitleEl: string;
  tempoDescEl: string;
  pattern: PercussionMove[];
}

const MOVE_META: Record<PercussionMove, { emoji: string; labelEl: string; colorClass: string }> = {
  clap: {
    emoji: '👏',
    labelEl: 'Παλαμάκι',
    colorClass: 'bg-sage-surface border-sage-dark text-charcoal',
  },
  knees: {
    emoji: '🦵👐',
    labelEl: 'Άγγιγμα στα Γόνατα',
    colorClass: 'bg-slate-surface border-slate-dark text-charcoal',
  },
  rest: {
    emoji: '🤫🌿',
    labelEl: 'Μουσική Παύση (Σιωπή)',
    colorClass: 'bg-terracotta-surface border-terracotta-dark text-charcoal',
  },
};

const RHYTHM_ROUNDS: RhythmPatternRound[] = [
  {
    tempoTitleEl: 'Ρυθμός: Αργός Βηματισμός Χελώνας 🐢',
    tempoDescEl: 'Ακολούθησε το μουσικοκινητικό μέτρο: Παλαμάκι ➔ Γόνατα ➔ Μουσική Παύση!',
    pattern: ['clap', 'knees', 'rest'],
  },
  {
    tempoTitleEl: 'Ρυθμός: Σταθερός Παλμός 🚶',
    tempoDescEl: 'Συγχρόνισε τα χέρια με το μοτίβο: Γόνατα ➔ Παλαμάκι ➔ Γόνατα!',
    pattern: ['knees', 'clap', 'knees'],
  },
  {
    tempoTitleEl: 'Ρυθμός: Αυτορρύθμιση & Σιωπή 🎼',
    tempoDescEl: 'Ξεκίνα με Παλαμάκι, κράτα τη Μουσική Παύση και ολοκλήρωσε στα Γόνατα!',
    pattern: ['clap', 'rest', 'knees'],
  },
  {
    tempoTitleEl: 'Ρυθμός: Ηχώ του Δάσους 🌲',
    tempoDescEl: 'Ακολούθησε την παρτιτούρα: Γόνατα ➔ Μουσική Παύση ➔ Παλαμάκι!',
    pattern: ['knees', 'rest', 'clap'],
  },
  {
    tempoTitleEl: 'Ρυθμός: Ήρεμο Κύμα Θάλασσας 🌊',
    tempoDescEl: 'Ξεκίνα με Μουσική Παύση (εισπνοή), συνέχισε στα Γόνατα και κλείσε με Παλαμάκι!',
    pattern: ['rest', 'knees', 'clap'],
  },
  {
    tempoTitleEl: 'Ρυθμός: Διπλός Παλμός & Σιωπή 🥁',
    tempoDescEl: 'Χτύπα Παλαμάκι ➔ Παλαμάκι ➔ και κράτα Μουσική Παύση!',
    pattern: ['clap', 'clap', 'rest'],
  },
];

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
    () => selectSessionRounds(RHYTHM_ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [restSilenceMs, setRestSilenceMs] = useState<number>(0);
  const advanceRef = useRef(advanceRound);
  advanceRef.current = advanceRound;
  const absorbedRef = useRef(getAbsorbedCount);
  absorbedRef.current = getAbsorbedCount;

  useEffect(() => {
    setStepIdx(hintLevel === 2 ? round.pattern.length - 1 : 0);
    setRestSilenceMs(0);
  }, [currentRound, hintLevel, round.pattern.length, sessionSeed]);

  const expectedMove = round.pattern[stepIdx];

  // Genuine Musical Rest (Silence): automatically advances after 1600ms of not tapping clap/knees
  useEffect(() => {
    if (expectedMove !== 'rest' || phase === 'PAUSED' || phase === 'COMPLETED') {
      setRestSilenceMs(0);
      return;
    }
    const timer = window.setTimeout(() => {
      const next = restSilenceMs + 100;
      if (next >= 1600) {
        playCalmTone('soft-step', settings.soundEnabled);
        setRestSilenceMs(0);
        if (stepIdx + 1 >= round.pattern.length) {
          setStepIdx(0);
          advanceRef.current(absorbedRef.current());
        } else {
          setStepIdx((s) => s + 1);
        }
      } else {
        setRestSilenceMs(next);
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [expectedMove, phase, restSilenceMs, stepIdx, round.pattern.length, settings.soundEnabled]);

  const restPct = Math.min(100, Math.round((restSilenceMs / 1600) * 100));

  const handleMovePress = (move: PercussionMove) => {
    runDebounced(() => {
      if (move === expectedMove) {
        playCalmTone(move === 'rest' ? 'soft-step' : 'pulse', settings.soundEnabled);
        setRestSilenceMs(0);
        if (stepIdx + 1 >= round.pattern.length) {
          setStepIdx(0);
          advanceRound(getAbsorbedCount());
        } else {
          setStepIdx((s) => s + 1);
        }
      } else {
        if (expectedMove === 'rest') {
          setRestSilenceMs(0);
        }
        const expectedLabel = MOVE_META[expectedMove].labelEl;
        triggerGentleFeedback(
          `Κοίτα την παρτιτούρα του Μαέστρου: στον χρόνο ${stepIdx + 1} έχουμε «${expectedLabel}»!`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-20-music-kinetic-rhythm">
      <div className="p-5 rounded-3xl bg-white border-2 border-sand-dark space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-sage-surface text-xs font-extrabold text-charcoal border border-sage">
          🎵 Μουσικοκινητική Αγωγή Dalcroze / Orff
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{round.tempoTitleEl}</h2>
        <p className="text-sm font-bold text-charcoal-muted">{round.tempoDescEl}</p>

        {/* Visual Musical Score */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {round.pattern.map((mv, idx) => {
            const meta = MOVE_META[mv];
            const isDone = idx < stepIdx;
            const isCurrent = idx === stepIdx;
            return (
              <div
                key={`${mv}-${idx}`}
                data-testid={`rhythm-score-slot-${idx}`}
                className={`px-5 py-3 rounded-2xl border-4 flex flex-col items-center gap-1 ${
                  isDone
                    ? 'bg-sage text-white border-sage-dark'
                    : isCurrent
                    ? 'bg-slate text-white border-charcoal scale-105'
                    : 'bg-sand-light text-charcoal border-sand-dark'
                }`}
              >
                <span className="text-3xl" aria-hidden="true">{meta.emoji}</span>
                <span className="text-xs font-extrabold">
                  {idx + 1}. {meta.labelEl}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Musical Rest (Silence) Meter */}
        {expectedMove === 'rest' && (
          <div className="max-w-sm mx-auto pt-2 space-y-1">
            <div className="flex justify-between text-xs font-extrabold text-terracotta-dark px-1">
              <span>🤫 Κράτα Μουσική Σιωπή (προχωράει αυτόματα)...</span>
              <span>{restPct}%</span>
            </div>
            <div className="w-full h-3 bg-sand-light rounded-full overflow-hidden border border-terracotta-dark">
              <div
                className="h-full bg-terracotta-dark transition-all duration-100"
                style={{ width: `${restPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body Percussion Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {(['clap', 'knees', 'rest'] as PercussionMove[]).map((mv) => {
          const meta = MOVE_META[mv];
          const highlight =
            (hintLevel >= 1 || ageBand === '4-5' || adaptiveProfile.autoHintBoost) &&
            mv === expectedMove;
          return (
            <button
              key={mv}
              type="button"
              data-testid={`music-kinetic-btn-${mv}`}
              onClick={() => handleMovePress(mv)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-charcoal ring-4 ring-sage/50 scale-105'
                  : `${meta.colorClass} hover:opacity-90`
              }`}
            >
              <span className="text-5xl" aria-hidden="true">{meta.emoji}</span>
              <span className="text-base font-extrabold">{meta.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
