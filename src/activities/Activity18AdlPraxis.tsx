import React, { useMemo, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

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
    questionEl: 'Έξω βρέχει και φυσάει. Τι φοράμε πάνω από την μπλούζα μας πριν βγούμε;',
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
  {
    titleEl: 'Αυτονομία: Κουμπώνω το Μπουφάν μου',
    goalEmoji: '🧥🤲',
    questionEl: 'Θέλεις να κλείσεις το φερμουάρ στο μπουφάν σου. Πώς συνεργάζονται τα δύο σου χέρια;',
    options: [
      { id: 'px7-1', emoji: '🤲⬆️', labelEl: 'Το ένα χέρι κρατάει σταθερά τη βάση και το άλλο τραβάει ήρεμα το φερμουάρ προς τα πάνω', isCorrect: true },
      { id: 'px7-2', emoji: '💢', labelEl: 'Τραβάω απότομα το μανίκι με δύναμη', isCorrect: false },
      { id: 'px7-3', emoji: '👟', labelEl: 'Προσπαθώ να το κλείσω με το παπούτσι', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Πλένω τα Φρούτα πριν τα Φάω',
    goalEmoji: '🍎🚰',
    questionEl: 'Πήρες ένα μήλο από το καλάθι της κουζίνας. Τι κάνουμε πάντα πριν το δαγκώσουμε;',
    options: [
      { id: 'px8-1', emoji: '🚰🍎', labelEl: 'Το πλένουμε καλά με καθαρό νερό στη βρύση και το σκουπίζουμε', isCorrect: true },
      { id: 'px8-2', emoji: '🖍️', labelEl: 'Το βάφουμε με μαρκαδόρους', isCorrect: false },
      { id: 'px8-3', emoji: '🛋️', labelEl: 'Το κρύβουμε κάτω από τον καναπέ', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Αλείφω Βούτυρο ή Μέλι στο Ψωμί',
    goalEmoji: '🍞🍯',
    questionEl: 'Θέλεις να αλείψεις μέλι στη φέτα του ψωμιού σου. Πώς χρησιμοποιούμε τα χέρια μας;',
    options: [
      { id: 'px9-1', emoji: '🍞🥄', labelEl: 'Το ένα χέρι κρατάει σταθερό το πιάτο/ψωμί και το άλλο απλώνει απαλά το μέλι', isCorrect: true },
      { id: 'px9-2', emoji: '🌀', labelEl: 'Πετάμε τη φέτα ψηλά στον αέρα', isCorrect: false },
      { id: 'px9-3', emoji: '📏', labelEl: 'Αλείφουμε με τον σχολικό χάρακα', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Ετοιμάζω το Παγούρι μου για το Σχολείο',
    goalEmoji: '🚰🎒',
    questionEl: 'Γέμισες το παγούρι σου με νερό. Τι πρέπει να ελέγξεις πριν το βάλεις μέσα στην τσάντα;',
    options: [
      { id: 'px10-1', emoji: '🔒💧', labelEl: 'Βιδώνω καλά το καπάκι για να μη βραχούν τα βιβλία μου', isCorrect: true },
      { id: 'px10-2', emoji: '🔓', labelEl: 'Το βάζω ανοιχτό ανάποδα μέσα στην τσάντα', isCorrect: false },
      { id: 'px10-3', emoji: '🧊', labelEl: 'Βάζω τα τετράδια μέσα στο παγούρι', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Χτενίζω τα Μαλλιά μου το Πρωί',
    goalEmoji: '🪮🪞',
    questionEl: 'Ξύπνησες το πρωί και τα μαλλιά σου είναι ανακατεμένα. Ποιο αντικείμενο χρησιμοποιείς μπροστά στον καθρέφτη;',
    options: [
      { id: 'px11-1', emoji: '🪮✨', labelEl: 'Κρατάω τη βούρτσα ή τη χτένα και χτενίζω απαλά τα μαλλιά μου', isCorrect: true },
      { id: 'px11-2', emoji: '🪥', labelEl: 'Χτενίζω τα μαλλιά μου με την οδοντόβουρτσα', isCorrect: false },
      { id: 'px11-3', emoji: '🥄', labelEl: 'Χρησιμοποιώ το πιρούνι του φαγητού', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Κλείνω την Κόλλα Στικ μετά τη Χειροτεχνία',
    goalEmoji: '🧴📄',
    questionEl: 'Κόλλησες τις εικόνες στο τετράδιό σου με την κόλλα στικ. Τι κάνεις μόλις τελειώσεις;',
    options: [
      { id: 'px12-1', emoji: '🔒✨', labelEl: 'Γυρίζω τη βάση προς τα κάτω και κουμπώνω σφιχτά το καπάκι της κόλλας', isCorrect: true },
      { id: 'px12-2', emoji: '📖', labelEl: 'Κλείνω το βιβλίο με την ανοιχτή κόλλα μέσα', isCorrect: false },
      { id: 'px12-3', emoji: '🪑', labelEl: 'Αλείφω κόλλα πάνω στην καρέκλα', isCorrect: false },
    ],
  },
];

export const Activity18AdlPraxis: React.FC<ActivityRunnerRenderProps> = ({
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
    () => selectSessionRounds(PRAXIS_ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];

  useEffect(() => {
    speakGreek(round.questionEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [currentRound, sessionSeed, round.questionEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const visibleOptions = useMemo(() => {
    const baseOpts =
      hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
        ? round.options.filter((o, i) => o.isCorrect || i === 0)
        : round.options;
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [round.options, hintLevel, ageBand, adaptiveProfile.distractorReductionRatio, sessionSeed, currentRound]);

  const handleSelect = (isCorrect: boolean, labelEl: string) => {
    runDebounced(() => {
      if (isCorrect) {
        playCalmTone('complete', settings.soundEnabled);
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
