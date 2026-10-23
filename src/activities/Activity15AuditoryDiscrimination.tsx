import React from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface AuditoryConceptRound {
  conceptBadgeEl: string;
  spokenInstructionEl: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const AUDITORY_ROUNDS: AuditoryConceptRound[] = [
  {
    conceptBadgeEl: 'Χωρική Έννοια: ΜΕΣΑ στο κουτί',
    spokenInstructionEl: 'Διάλεξε την εικόνα όπου το μπαλάκι ή το δώρο είναι ΜΕΣΑ στο κουτί!',
    options: [
      { id: 'au1-1', emoji: '🎁📦', labelEl: 'ΜΕΣΑ στο κουτί', isCorrect: true },
      { id: 'au1-2', emoji: '📦⬆️⚽', labelEl: 'ΠΑΝΩ από το κουτί', isCorrect: false },
      { id: 'au1-3', emoji: '📦➡️⚽', labelEl: 'ΔΙΠΛΑ στο κουτί', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση Ελάχιστων Ζευγών: /ΚΟΤΑ/ vs /ΠΟΡΤΑ/',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη: «ΚΟ - ΤΑ». Ποια εικόνα δείχνει την ΚΟΤΑ (όχι την ΠΟΡΤΑ);',
    options: [
      { id: 'au2-1', emoji: '🚪', labelEl: 'Πόρτα (/Π/)', isCorrect: false },
      { id: 'au2-2', emoji: '🐔', labelEl: 'Κότα (/Κ/)', isCorrect: true },
      { id: 'au2-3', emoji: '🎂', labelEl: 'Τούρτα (/Τ/)', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Χωροχρονική Σχέση: ΑΝΑΜΕΣΑ στα δύο δέντρα',
    spokenInstructionEl: 'Βρες την εικόνα όπου το σπιτάκι βρίσκεται ΑΝΑΜΕΣΑ στα δύο δέντρα!',
    options: [
      { id: 'au3-1', emoji: '🌳🏠🌳', labelEl: 'ΑΝΑΜΕΣΑ στα δύο δέντρα', isCorrect: true },
      { id: 'au3-2', emoji: '🌳🌳🏠', labelEl: 'Μετά από τα δέντρα', isCorrect: false },
      { id: 'au3-3', emoji: '🏠🌳🌳', labelEl: 'Πριν από τα δέντρα', isCorrect: false },
    ],
  },
];

export const Activity15AuditoryDiscrimination: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  adaptiveProfile,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const round = AUDITORY_ROUNDS[(currentRound - 1) % AUDITORY_ROUNDS.length];

  const visibleOptions =
    hintLevel === 2
      ? round.options.filter((o, i) => o.isCorrect || i === 0)
      : round.options;

  const handleSelect = (isCorrect: boolean, labelEl: string) => {
    runDebounced(() => {
      if (isCorrect) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Επέλεξες «${labelEl}». Άκου ξανά την εντολή: «${round.conceptBadgeEl}»!`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-15-auditory-discrimination">
      <div className="p-6 rounded-3xl bg-slate-surface border-4 border-slate space-y-3">
        <span className="inline-block px-4 py-1 rounded-full bg-white text-xs font-extrabold text-slate-dark border border-slate">
          🔊 {round.conceptBadgeEl}
        </span>
        <p className="text-xl font-extrabold text-charcoal">{round.spokenInstructionEl}</p>
        <button
          type="button"
          data-testid="auditory-replay-btn"
          onClick={() => speakGreek(round.spokenInstructionEl, true, adaptiveProfile.speechRate)}
          className="touch-target px-5 py-2.5 rounded-2xl bg-white border-2 border-slate font-extrabold text-charcoal inline-flex items-center gap-2 hover:bg-sand"
        >
          <span aria-hidden="true">👂</span>
          <span>Άκου Ξανά Καθαρά</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight =
            (hintLevel >= 1 || adaptiveProfile.autoHintBoost || settings.ageBand === '4-5') &&
            opt.isCorrect &&
            hintLevel >= 1;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCorrect ? 'auditory-discrimination-target' : `auditory-opt-${opt.id}`}
              onClick={() => handleSelect(opt.isCorrect, opt.labelEl)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-4xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-base font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
