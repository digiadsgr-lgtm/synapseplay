import React, { useMemo, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { reduceToTwoChoices, rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';
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
    questionEl: 'Τελείωσες τη ζωγραφική σου. Πού βάζεις τους μαρκαδόρους για να μη στεγνώσουν;',
    options: [
      { id: 'px3-1', emoji: '🖍️🔒', labelEl: 'Κλείνω τα καπάκια και τους βάζω στην κασετίνα', isCorrect: true },
      { id: 'px3-2', emoji: '🛋️', labelEl: 'Τους αφήνω ανοιχτούς στο πάτωμα', isCorrect: false },
      { id: 'px3-3', emoji: '🧊', labelEl: 'Τους βάζω στην κατάψυξη', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Βροχερός Καιρός & Έξοδος από το Σπίτι',
    goalEmoji: '🌧️🧥',
    questionEl: 'Έξω βρέχει και φυσάει. Τι φοράς πάνω από την μπλούζα σου πριν βγεις;',
    options: [
      { id: 'px4-1', emoji: '🧥☂️', labelEl: 'Φοράω το αδιάβροχο μπουφάν μου και παίρνω ομπρέλα', isCorrect: true },
      { id: 'px4-2', emoji: '🩳', labelEl: 'Φοράω καλοκαιρινό μαγιό', isCorrect: false },
      { id: 'px4-3', emoji: '🕶️', labelEl: 'Φοράω μόνο γυαλιά ηλίου', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Κόβω Χαρτονάκια στη Χειροτεχνία',
    goalEmoji: '✂️📄',
    questionEl: 'Θέλεις να κόψεις ένα χάρτινο αστέρι με ασφάλεια. Πώς χρησιμοποιείς τα δύο σου χέρια;',
    options: [
      { id: 'px5-1', emoji: '🤲✂️', labelEl: 'Το ένα χέρι κρατάει σταθερά το χαρτί και το άλλο κόβει αργά με το παιδικό ψαλίδι', isCorrect: true },
      { id: 'px5-2', emoji: '🏃✂️', labelEl: 'Τρέχω στο δωμάτιο κρατώντας το ψαλίδι', isCorrect: false },
      { id: 'px5-3', emoji: '🥄', labelEl: 'Κόβω το χαρτόνι με κουτάλι', isCorrect: false },
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
    questionEl: 'Πήρες ένα μήλο από το καλάθι της κουζίνας. Τι κάνεις πάντα πριν το δαγκώσεις;',
    options: [
      { id: 'px8-1', emoji: '🚰🍎', labelEl: 'Το πλένω καλά με καθαρό νερό στη βρύση και το σκουπίζω', isCorrect: true },
      { id: 'px8-2', emoji: '🖍️', labelEl: 'Το βάφω με μαρκαδόρους', isCorrect: false },
      { id: 'px8-3', emoji: '🛋️', labelEl: 'Το κρύβω κάτω από τον καναπέ', isCorrect: false },
    ],
  },
  {
    titleEl: 'Αυτονομία: Αλείφω Βούτυρο ή Μέλι στο Ψωμί',
    goalEmoji: '🍞🍯',
    questionEl: 'Θέλεις να αλείψεις μέλι στη φέτα του ψωμιού σου. Πώς χρησιμοποιείς τα χέρια σου;',
    options: [
      { id: 'px9-1', emoji: '🍞🥄', labelEl: 'Το ένα χέρι κρατάει σταθερό το πιάτο/ψωμί και το άλλο απλώνει απαλά το μέλι', isCorrect: true },
      { id: 'px9-2', emoji: '🌀', labelEl: 'Πετάω τη φέτα ψηλά στον αέρα', isCorrect: false },
      { id: 'px9-3', emoji: '📏', labelEl: 'Αλείφω με τον σχολικό χάρακα', isCorrect: false },
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

const SENIOR_PRAXIS_ROUNDS: PraxisScenario[] = [
  {
    titleEl: 'Εκτελεστική Οργάνωση (8-12 ετών): Ιεράρχηση Απογευματινής Μελέτης',
    goalEmoji: '🗂️⏱️',
    questionEl: 'Έχεις 3 εργασίες για αύριο: ένα απαιτητικό κεφάλαιο Μαθηματικών, μια σύντομη αντιγραφή και την προετοιμασία της τσάντας. Ποια στρατηγική αξιοποιεί καλύτερα την ενέργειά σου;',
    options: [
      { id: 'spx1-1', emoji: '🧠✅', labelEl: 'Ξεκινώ με τα Μαθηματικά όσο το μυαλό μου είναι ξεκούραστο, συνεχίζω με τη σύντομη εργασία και κλείνω ετοιμάζοντας την τσάντα', isCorrect: true },
      { id: 'spx1-2', emoji: '🌙😴', labelEl: 'Αφήνω τα δύσκολα Μαθηματικά για αργά το βράδυ όταν νυστάζω', isCorrect: false },
      { id: 'spx1-3', emoji: '🌪️', labelEl: 'Ανοίγω και τα 3 βιβλία ταυτόχρονα πηδώντας από το ένα στο άλλο', isCorrect: false },
    ],
  },
  {
    titleEl: 'Εκτελεστική Αυτονομία: Σχολικό Project με Προθεσμία 5 Ημερών',
    goalEmoji: '📅📊',
    questionEl: 'Ο εκπαιδευτικός αναθέτει μια εργασία Φυσικής που παραδίδεται την Παρασκευή. Πώς την οργανώνεις χωρίς άγχος;',
    options: [
      { id: 'spx2-1', emoji: '📋✨', labelEl: 'Χωρίζω την εργασία σε 4 μικρά ημερήσια βήματα (Έρευνα ➔ Συγγραφή ➔ Εικόνες ➔ Έλεγχος)', isCorrect: true },
      { id: 'spx2-2', emoji: '⏳😰', labelEl: 'Την ξεχνάω όλη την εβδομάδα και ξεκινάω την Πέμπτη στις 10 το βράδυ', isCorrect: false },
      { id: 'spx2-3', emoji: '🙈', labelEl: 'Περιμένω να την κάνει κάποιος άλλος αντί για μένα', isCorrect: false },
    ],
  },
  {
    titleEl: 'Ψηφιακή Αυτορρύθμιση: Συγκέντρωση την Ώρα της Μελέτης',
    goalEmoji: '🔕📚',
    questionEl: 'Καθώς διαβάζεις Ιστορία, ακούς συνεχώς ειδοποιήσεις από ομαδική συνομιλία στο τάμπλετ (Tablet). Τι κάνεις;',
    options: [
      { id: 'spx3-1', emoji: '🔕🎯', labelEl: 'Ενεργοποιώ τη λειτουργία «Μην Ενοχλείτε» μέχρι να ολοκληρώσω το κεφάλαιο μελέτης', isCorrect: true },
      { id: 'spx3-2', emoji: '📱🔄', labelEl: 'Διακόπτω το διάβασμα κάθε 30 δευτερόλεπτα για να απαντάω στα μηνύματα', isCorrect: false },
      { id: 'spx3-3', emoji: '🔊', labelEl: 'Δυναμώνω την ένταση των ειδοποιήσεων πάνω στο βιβλίο', isCorrect: false },
    ],
  },
  {
    titleEl: 'Πράξη & Ακρίβεια: Σχεδίαση Κύκλου στη Γεωμετρία',
    goalEmoji: '📐⭕',
    questionEl: 'Χρειάζεται να σχεδιάσεις έναν απόλυτα συμμετρικό κύκλο ακτίνας 4 εκατοστών στο τετράδιο Γεωμετρίας. Πώς χρησιμοποιείς τα όργανα;',
    options: [
      { id: 'spx4-1', emoji: '📏🧭', labelEl: 'Μετράω 4 εκ. στον χάρακα με τον διαβήτη, σταθεροποιώ την ακίδα στο κέντρο και περιστρέφω ομαλά', isCorrect: true },
      { id: 'spx4-2', emoji: '🖍️', labelEl: 'Ζωγραφίζω βιαστικά με το χέρι χωρίς κανένα όργανο μέτρησης', isCorrect: false },
      { id: 'spx4-3', emoji: '✂️', labelEl: 'Χρησιμοποιώ το ψαλίδι πάνω στο τετράδιο', isCorrect: false },
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
  const isSeniorAge = ageBand === '8-10' || ageBand === '10-12';
  const praxisPool = isSeniorAge ? SENIOR_PRAXIS_ROUNDS : PRAXIS_ROUNDS;
  const activeRounds = useMemo(
    () => selectSessionRounds(praxisPool, totalRounds, sessionSeed),
    [praxisPool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];

  useEffect(() => {
    speakGreek(round.questionEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [currentRound, sessionSeed, round.questionEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const visibleOptions = useMemo(() => {
    const baseOpts =
      hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
        ? reduceToTwoChoices(round.options, (o) => o.isCorrect)
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
