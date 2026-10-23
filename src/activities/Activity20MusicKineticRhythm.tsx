import React, { useState, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

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
    tempoTitleEl: 'Ρυθμός 1: Adagio (Αργά σαν Χελώνα 🐢)',
    tempoDescEl: 'Ακολούθησε το μουσικοκινητικό μέτρο: Παλαμάκι ➔ Γόνατα ➔ Μουσική Παύση!',
    pattern: ['clap', 'knees', 'rest'],
  },
  {
    tempoTitleEl: 'Ρυθμός 2: Moderato (Σταθερός Βηματισμός 🚶)',
    tempoDescEl: 'Συγχρόνισε τα χέρια με το μοτίβο Orff: Γόνατα ➔ Παλαμάκι ➔ Γόνατα!',
    pattern: ['knees', 'clap', 'knees'],
  },
  {
    tempoTitleEl: 'Ρυθμός 3: Ρυθμική Αυτορρύθμιση & Σιωπή 🎼',
    tempoDescEl: 'Ξεκίνα με Παλαμάκι, κράτα τη Μουσική Παύση και ολοκλήρωσε στα Γόνατα!',
    pattern: ['clap', 'rest', 'knees'],
  },
];

export const Activity20MusicKineticRhythm: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const round = RHYTHM_ROUNDS[(currentRound - 1) % RHYTHM_ROUNDS.length];
  const [stepIdx, setStepIdx] = useState<number>(0);

  useEffect(() => {
    setStepIdx(hintLevel === 2 ? round.pattern.length - 1 : 0);
  }, [currentRound, hintLevel, round.pattern.length]);

  const expectedMove = round.pattern[stepIdx];

  const handleMovePress = (move: PercussionMove) => {
    runDebounced(() => {
      if (move === expectedMove) {
        playCalmTone(move === 'rest' ? 'soft-step' : 'pulse', settings.soundEnabled);
        if (stepIdx + 1 >= round.pattern.length) {
          setStepIdx(0);
          advanceRound(getAbsorbedCount());
        } else {
          setStepIdx((s) => s + 1);
        }
      } else {
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
      </div>

      {/* Body Percussion Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {(['clap', 'knees', 'rest'] as PercussionMove[]).map((mv) => {
          const meta = MOVE_META[mv];
          const highlight = hintLevel >= 1 && mv === expectedMove;
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
