import React from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';

interface PraxisScenario {
  titleEl: string;
  goalEmoji: string;
  questionEl: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const PRAXIS_ROUNDS: PraxisScenario[] = [
  {
    titleEl: 'Αυτονομία 1: Ντύνομαι για Βόλτα (Κινητικός Σχεδιασμός)',
    goalEmoji: '👟🧦',
    questionEl: 'Θέλεις να φορέσεις τα αθλητικά σου παπούτσια. Τι πρέπει να φορέσεις ΠΡΩΤΑ στα πόδια;',
    options: [
      { id: 'px1-1', emoji: '🧦', labelEl: 'Πρώτα φοράω τις κάλτσες μου', isCorrect: true },
      { id: 'px1-2', emoji: '🧤', labelEl: 'Φοράω γάντια στα πόδια', isCorrect: false },
      { id: 'px1-3', emoji: '🎩', labelEl: 'Βάζω καπέλο στα παπούτσια', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία 2: Τρώω τη Σούπα μου στο Τραπέζι',
    goalEmoji: '🍲',
    questionEl: 'Μπροστά σου έχεις ένα μπολ με ζεστή σούπα. Ποιο εργαλείο θα κρατήσεις με το χέρι σου;',
    options: [
      { id: 'px2-1', emoji: '✏️', labelEl: 'Το ξύλινο μολύβι', isCorrect: false },
      { id: 'px2-2', emoji: '🥄', labelEl: 'Το κουτάλι της σούπας', isCorrect: true },
      { id: 'px2-3', emoji: '📏', labelEl: 'Τον χάρακα', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία 3: Οργάνωση Γραφείου Μελέτης',
    goalEmoji: '🗂️✏️',
    questionEl: 'Τελείωσες τη ζωγραφική σου. Πού βάζουμε τους μαρκαδόρους για να μη στεγνώσουν;',
    options: [
      { id: 'px3-1', emoji: '🖍️🔒', labelEl: 'Κλείνουμε τα καπάκια και τους βάζουμε στην κασετίνα', isCorrect: true },
      { id: 'px3-2', emoji: '🛋️', labelEl: 'Τους αφήνουμε ανοιχτούς στο πάτωμα', isCorrect: false },
      { id: 'px3-3', emoji: '冷蔵庫', labelEl: 'Τους βάζουμε στο ψυγείο', isCorrect: false },
    ],
  },
];

export const Activity18AdlPraxis: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  adaptiveProfile,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const round = PRAXIS_ROUNDS[(currentRound - 1) % PRAXIS_ROUNDS.length];

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
          `Σκέψου πρακτικά: μας βοηθάει το «${labelEl}» σε αυτή την καθημερινή ρουτίνα; Δοκίμασε ξανά!`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-18-adl-praxis">
      <div className="p-6 rounded-3xl bg-sage-surface border-4 border-sage space-y-2">
        <div className="text-5xl" aria-hidden="true">{round.goalEmoji}</div>
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{round.titleEl}</h2>
        <p className="text-lg font-bold text-charcoal">{round.questionEl}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight = (hintLevel >= 1 || adaptiveProfile.autoHintBoost) && opt.isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCorrect ? 'adl-praxis-target' : `adl-praxis-opt-${opt.id}`}
              onClick={() => handleSelect(opt.isCorrect, opt.labelEl)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-4xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-sm font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
