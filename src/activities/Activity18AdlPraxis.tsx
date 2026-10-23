import React, { useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface PraxisScenario {
  titleEl: string;
  goalEmoji: string;
  questionEl: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const PRAXIS_ROUNDS: PraxisScenario[] = [
  {
    titleEl: 'Αυτονομία: Ντύνομαι για Βόλτα (Κινητικός Σχεδιασμός)',
    goalEmoji: '👟🧦',
    questionEl: 'Θέλεις να φορέσεις τα αθλητικά σου παπούτσια. Τι πρέπει να φορέσεις πρώτα στα πόδια;',
    options: [
      { id: 'px1-1', emoji: '🧦', labelEl: 'Πρώτα φοράω τις κάλτσες μου', isCorrect: true },
      { id: 'px1-2', emoji: '🧤', labelEl: 'Φοράω γάντια στα πόδια', isCorrect: false },
      { id: 'px1-3', emoji: '🎩', labelEl: 'Βάζω καπέλο στα παπούτσια', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Τρώω τη Σούπα μου στο Τραπέζι',
    goalEmoji: '🍲',
    questionEl: 'Μπροστά σου έχεις ένα μπολ με ζεστή σούπα. Ποιο εργαλείο θα κρατήσεις με το χέρι σου;',
    options: [
      { id: 'px2-1', emoji: '✏️', labelEl: 'Το ξύλινο μολύβι', isCorrect: false },
      { id: 'px2-2', emoji: '🥄', labelEl: 'Το κουτάλι της σούπας', isCorrect: true },
      { id: 'px2-3', emoji: '📏', labelEl: 'Τον χάρακα', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Οργάνωση Γραφείου Μελέτης',
    goalEmoji: '🗂️✏️',
    questionEl: 'Τελείωσες τη ζωγραφική σου. Πού βάζουμε τους μαρκαδόρους για να μη στεγνώσουν;',
    options: [
      { id: 'px3-1', emoji: '🖍️🔒', labelEl: 'Κλείνουμε τα καπάκια και τους βάζουμε στην κασετίνα', isCorrect: true },
      { id: 'px3-2', emoji: '🛋️', labelEl: 'Τους αφήνουμε ανοιχτούς στο πάτωμα', isCorrect: false },
      { id: 'px3-3', emoji: '🧊', labelEl: 'Τους βάζουμε στην κατάψυξη', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Βροχερός Καιρός & Έξοδος από το Σπίτι',
    goalEmoji: '🌧️🧥',
    questionEl: 'Έξω βρέχει και φυσάει. Τι φοράμε πάνω από τη μπλούζα μας πριν βγούμε;',
    options: [
      { id: 'px4-1', emoji: '🧥☂️', labelEl: 'Φοράμε το αδιάβροχο μπουφάν μας και παίρνουμε ομπρέλα', isCorrect: true },
      { id: 'px4-2', emoji: '🩳', labelEl: 'Φοράμε καλοκαιρινό μαγιό', isCorrect: false },
      { id: 'px4-3', emoji: '🕶️', labelEl: 'Φοράμε μόνο γυαλιά ηλίου', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Κόβω Χαρτονάκια στη Χειροτεχνία',
    goalEmoji: '✂️📄',
    questionEl: 'Θέλεις να κόψεις ένα χάρτινο αστέρι με ασφάλεια. Πώς χρησιμοποιούμε τα δύο μας χέρια;',
    options: [
      { id: 'px5-1', emoji: '🤲✂️', labelEl: 'Το ένα χέρι κρατάει σταθερά το χαρτί και το άλλο κόβει αργά με το παιδικό ψαλίδι', isCorrect: true },
      { id: 'px5-2', emoji: '🏃✂️', labelEl: 'Τρέχουμε στο δωμάτιο κρατώντας το ψαλίδι', isCorrect: false },
      { id: 'px5-3', emoji: '🥄', labelEl: 'Κόβουμε το χαρτόνι με κουτάλι', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Έπεσε λίγο Νερό στο Τραπέζι',
    goalEmoji: '💧🧽',
    questionEl: 'Κατά λάθος χύθηκε λίγο νερό πάνω στο τραπέζι. Ποια είναι η ήρεμη πρακτική κίνηση;',
    options: [
      { id: 'px6-1', emoji: '🧽✨', labelEl: 'Παίρνω ήρεμα ένα σφουγγαράκι ή χαρτί κουζίνας και το σκουπίζω', isCorrect: true },
      { id: 'px6-2', emoji: '😭', labelEl: 'Φωνάζω και πετάω το ποτήρι κάτω', isCorrect: false },
      { id: 'px6-3', emoji: '📚', labelEl: 'Βάζω τα βιβλία μου πάνω στο νερό', isCorrect: false },
    ],
  },
];

export const Activity18AdlPraxis: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeRounds = useMemo(
    () => selectSessionRounds(PRAXIS_ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];

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
