import React, { useMemo, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { reduceToTwoChoices, rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface RuleRound {
  ruleType: 'color' | 'shape';
  ruleTitleEl: string;
  targetEmoji: string;
  targetDescriptionEl: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const RULE_ROUNDS: RuleRound[] = [
  {
    ruleType: 'color',
    ruleTitleEl: 'Κανόνας: Διαλέγω το ίδιο χρώμα (Πράσινο)',
    targetEmoji: '🍏',
    targetDescriptionEl: 'Πράσινο Μήλο',
    options: [
      { id: 'r1-1', emoji: '🐸', labelEl: 'Πράσινο Βατραχάκι', isCorrect: true },
      { id: 'r1-2', emoji: '🍅', labelEl: 'Κόκκινη Ντομάτα', isCorrect: false },
      { id: 'r1-3', emoji: '🍋', labelEl: 'Κίτρινο Λεμόνι', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: 'Κανόνας: Διαλέγω το ίδιο χρώμα (Μπλε)',
    targetEmoji: '📘',
    targetDescriptionEl: 'Μπλε Βιβλίο',
    options: [
      { id: 'r2-1', emoji: '🥕', labelEl: 'Πορτοκαλί Καρότο', isCorrect: false },
      { id: 'r2-2', emoji: '🐳', labelEl: 'Μπλε Φάλαινα', isCorrect: true },
      { id: 'r2-3', emoji: '🌻', labelEl: 'Κίτρινος Ηλίανθος', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Τώρα διαλέγω το ίδιο σχήμα (Στρογγυλό)',
    targetEmoji: '⚽',
    targetDescriptionEl: 'Στρογγυλή Μπάλα',
    options: [
      { id: 'r3-1', emoji: '🍊', labelEl: 'Στρογγυλό Πορτοκάλι', isCorrect: true },
      { id: 'r3-2', emoji: '📐', labelEl: 'Τριγωνικός Χάρακας', isCorrect: false },
      { id: 'r3-3', emoji: '📦', labelEl: 'Τετράγωνο Κουτί', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: 'Κανόνας Σχήματος: Διαλέγω το ίδιο σχήμα (Αστέρι)',
    targetEmoji: '⭐',
    targetDescriptionEl: 'Αστέρι',
    options: [
      { id: 'r4-1', emoji: '🎈', labelEl: 'Μπαλόνι', isCorrect: false },
      { id: 'r4-2', emoji: '🌟', labelEl: 'Λαμπερό Αστέρι', isCorrect: true },
      { id: 'r4-3', emoji: '📘', labelEl: 'Τετράγωνο Βιβλίο', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: 'Κανόνας: Διαλέγω το ίδιο χρώμα (Κίτρινο)',
    targetEmoji: '🍋',
    targetDescriptionEl: 'Κίτρινο Λεμόνι',
    options: [
      { id: 'r5-1', emoji: '🌻', labelEl: 'Κίτρινος Ηλίανθος', isCorrect: true },
      { id: 'r5-2', emoji: '🍓', labelEl: 'Κόκκινη Φράουλα', isCorrect: false },
      { id: 'r5-3', emoji: '🐳', labelEl: 'Μπλε Φάλαινα', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Τώρα διαλέγω το ίδιο σχήμα (Τετράγωνο)',
    targetEmoji: '📦',
    targetDescriptionEl: 'Τετράγωνο Κουτί',
    options: [
      { id: 'r6-1', emoji: '⚽', labelEl: 'Στρογγυλή Μπάλα', isCorrect: false },
      { id: 'r6-2', emoji: '🖼️', labelEl: 'Τετράγωνο Κάδρο', isCorrect: true },
      { id: 'r6-3', emoji: '🌙', labelEl: 'Καμπύλο Φεγγάρι', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Διαλέγω το ίδιο χρώμα (Κόκκινο)',
    targetEmoji: '🍎',
    targetDescriptionEl: 'Κόκκινο Μήλο',
    options: [
      { id: 'r7-1', emoji: '🍓', labelEl: 'Κόκκινη Φράουλα', isCorrect: true },
      { id: 'r7-2', emoji: '🍐', labelEl: 'Πράσινο Αχλάδι', isCorrect: false },
      { id: 'r7-3', emoji: '📘', labelEl: 'Μπλε Τετράδιο', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: 'Κανόνας Σχήματος: Διαλέγω το ίδιο σχήμα (Τρίγωνο)',
    targetEmoji: '📐',
    targetDescriptionEl: 'Τριγωνικός Χάρακας',
    options: [
      { id: 'r8-1', emoji: '⛺', labelEl: 'Τριγωνική Σκηνή', isCorrect: true },
      { id: 'r8-2', emoji: '🍊', labelEl: 'Στρογγυλό Πορτοκάλι', isCorrect: false },
      { id: 'r8-3', emoji: '📦', labelEl: 'Τετράγωνο Κιβώτιο', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Διαλέγω το ίδιο χρώμα (Πορτοκαλί)',
    targetEmoji: '🎃',
    targetDescriptionEl: 'Πορτοκαλί Κολοκύθα',
    options: [
      { id: 'r9-1', emoji: '📘', labelEl: 'Μπλε Βιβλίο', isCorrect: false },
      { id: 'r9-2', emoji: '🥕', labelEl: 'Πορτοκαλί Καρότο', isCorrect: true },
      { id: 'r9-3', emoji: '🍀', labelEl: 'Πράσινο Τριφύλλι', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Διαλέγω το ίδιο σχήμα (Στρογγυλό)',
    targetEmoji: '🌕',
    targetDescriptionEl: 'Στρογγυλή Πανσέληνος',
    options: [
      { id: 'r10-1', emoji: '⚽', labelEl: 'Στρογγυλή Μπάλα', isCorrect: true },
      { id: 'r10-2', emoji: '📘', labelEl: 'Τετράγωνο Βιβλίο', isCorrect: false },
      { id: 'r10-3', emoji: '⛺', labelEl: 'Τριγωνική Σκηνή', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Διαλέγω το ίδιο χρώμα (Πράσινο)',
    targetEmoji: '🍀',
    targetDescriptionEl: 'Πράσινο Τριφύλλι',
    options: [
      { id: 'r11-1', emoji: '🍓', labelEl: 'Κόκκινη Φράουλα', isCorrect: false },
      { id: 'r11-2', emoji: '🐢', labelEl: 'Πράσινη Χελώνα', isCorrect: true },
      { id: 'r11-3', emoji: '🌻', labelEl: 'Κίτρινος Ηλίανθος', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα! Διαλέγω το ίδιο σχήμα (Τετράγωνο)',
    targetEmoji: '🖼️',
    targetDescriptionEl: 'Τετράγωνο Κάδρο',
    options: [
      { id: 'r12-1', emoji: '📦', labelEl: 'Τετράγωνο Κουτί', isCorrect: true },
      { id: 'r12-2', emoji: '🍊', labelEl: 'Στρογγυλό Πορτοκάλι', isCorrect: false },
      { id: 'r12-3', emoji: '📐', labelEl: 'Τριγωνικός Χάρακας', isCorrect: false },
    ],
  },
];

const SENIOR_RULE_ROUNDS: RuleRound[] = [
  {
    ruleType: 'color',
    ruleTitleEl: 'Κανόνας Α (Επιστημονική Κατηγορία): Αγνόησε το χρώμα και διάλεξε το όργανο αστρονομίας!',
    targetEmoji: '🪐',
    targetDescriptionEl: 'Στόχος: Παρατήρηση Πλανητών & Διαστήματος',
    options: [
      { id: 'sr1-1', emoji: '🔭', labelEl: 'Τηλεσκόπιο Αστρονομίας', isCorrect: true },
      { id: 'sr1-2', emoji: '🍊', labelEl: 'Πορτοκάλι (Ίδιο χρώμα/σχήμα με τον Κρόνο)', isCorrect: false },
      { id: 'sr1-3', emoji: '🏀', labelEl: 'Μπάλα Μπάσκετ (Ίδιο σφαιρικό σχήμα)', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα (Αντίθετη Ιδιότητα): Διάλεξε το ΑΝΤΙΘΕΤΟ σε ταχύτητα κίνησης!',
    targetEmoji: '🚀',
    targetDescriptionEl: 'Στόχος Αναφοράς: Υπερηχητικός Πύραυλος (Μέγιστη Ταχύτητα)',
    options: [
      { id: 'sr2-1', emoji: '🏎️', labelEl: 'Αγωνιστικό Αυτοκίνητο (Γρήγορο — παγίδα!)', isCorrect: false },
      { id: 'sr2-2', emoji: '🐌', labelEl: 'Σαλιγκάρι (Εξαιρετικά Αργή Κίνηση — Αντίθετο!)', isCorrect: true },
      { id: 'sr2-3', emoji: '✈️', labelEl: 'Αεροπλάνο (Πετάει ψηλά — παγίδα!)', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα (Υλικό Κατασκευής): Αγνόησε τη χρήση και διάλεξε το αντικείμενο από ΞΥΛΟ!',
    targetEmoji: '🎸',
    targetDescriptionEl: 'Στόχος Αναφοράς: Ακουστική Ξύλινη Κιθάρα',
    options: [
      { id: 'sr3-1', emoji: '🎺', labelEl: 'Μεταλλική Τρομπέτα (Μουσικό όργανο αλλά μεταλλικό — παγίδα!)', isCorrect: false },
      { id: 'sr3-2', emoji: '🪑', labelEl: 'Ξύλινη Καρέκλα (Ίδιο υλικό κατασκευής: Ξύλο)', isCorrect: true },
      { id: 'sr3-3', emoji: '🎧', labelEl: 'Πλαστικά Ακουστικά (Σχετίζονται με μουσική — παγίδα!)', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα (Πηγή Ενέργειας): Διάλεξε τι λειτουργεί ΧΩΡΙΣ ηλεκτρισμό ή μπαταρία!',
    targetEmoji: '🧭',
    targetDescriptionEl: 'Στόχος Αναφοράς: Μαγνητική Πυξίδα Πεδίου',
    options: [
      { id: 'sr4-1', emoji: '🔦', labelEl: 'Φακός Μπαταρίας', isCorrect: false },
      { id: 'sr4-2', emoji: '🚲', labelEl: 'Ποδήλατο (Κινείται με μυϊκή ενέργεια)', isCorrect: true },
      { id: 'sr4-3', emoji: '💻', labelEl: 'Φορητός Υπολογιστής', isCorrect: false },
    ],
  },
  {
    ruleType: 'color',
    ruleTitleEl: 'Κανόνας Α (Βιολογικό Περιβάλλον): Αγνόησε το χρώμα και διάλεξε το θαλάσσιο θηλαστικό!',
    targetEmoji: '🌊',
    targetDescriptionEl: 'Στόχος: Θαλάσσιο Οικοσύστημα',
    options: [
      { id: 'sr5-1', emoji: '🐬', labelEl: 'Δελφίνι (Θαλάσσιο Θηλαστικό)', isCorrect: true },
      { id: 'sr5-2', emoji: '🫐', labelEl: 'Μύρτιλο (Μπλε χρώμα — παγίδα!)', isCorrect: false },
      { id: 'sr5-3', emoji: '🦅', labelEl: 'Αετός (Πτηνό των βουνών)', isCorrect: false },
    ],
  },
  {
    ruleType: 'shape',
    ruleTitleEl: '🔄 Αλλαγή Κανόνα (Αντίθετη Θερμοκρασία): Διάλεξε το ΑΝΤΙΘΕΤΟ σε θερμοκρασία!',
    targetEmoji: '🌋',
    targetDescriptionEl: 'Στόχος Αναφοράς: Ενεργό Ηφαίστειο (Υψηλή Θερμότητα)',
    options: [
      { id: 'sr6-1', emoji: '☀️', labelEl: 'Καυτός Ήλιος (Ίδια θερμότητα — παγίδα!)', isCorrect: false },
      { id: 'sr6-2', emoji: '🧊', labelEl: 'Παγόβουνο / Κύβος Πάγου (Αντίθετη Θερμοκρασία)', isCorrect: true },
      { id: 'sr6-3', emoji: '⛰️', labelEl: 'Βραχώδες Βουνό (Ίδιο σχήμα — παγίδα!)', isCorrect: false },
    ],
  },
];

export const Activity06SwitchRule: React.FC<ActivityRunnerRenderProps> = ({
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
  const rulePool = isSeniorAge ? SENIOR_RULE_ROUNDS : RULE_ROUNDS;
  const activeRounds = useMemo(
    () => selectSessionRounds(rulePool, totalRounds, sessionSeed),
    [rulePool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];

  // Announce the active sorting rule aloud on every round so rule switches (Color <-> Shape) are crystal clear
  useEffect(() => {
    speakGreek(
      `${round.ruleTitleEl}. ${round.targetDescriptionEl}`,
      settings.voiceEnabled,
      adaptiveProfile.speechRate
    );
  }, [currentRound, sessionSeed, round.ruleTitleEl, round.targetDescriptionEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const visibleOptions = useMemo(() => {
    let baseOpts = round.options;
    if (hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5) {
      baseOpts = reduceToTwoChoices(round.options, (o) => o.isCorrect);
    } else if (ageBand === '8-10' || ageBand === '10-12' || adaptiveProfile.enrichChallenge) {
      baseOpts = [
        ...round.options,
        {
          id: `r-extra-${currentRound}`,
          emoji: round.ruleType === 'color' ? '🎩' : '🍌',
          labelEl: round.ruleType === 'color' ? 'Μαύρο Καπέλο' : 'Μακρόστενη Μπανάνα',
          isCorrect: false,
        },
      ];
    }
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [
    round.options,
    round.ruleType,
    hintLevel,
    ageBand,
    adaptiveProfile.distractorReductionRatio,
    adaptiveProfile.enrichChallenge,
    currentRound,
    sessionSeed,
  ]);

  const handleOptionSelect = (isCorrect: boolean, labelEl: string) => {
    runDebounced(() => {
      if (isCorrect) {
        playCalmTone('complete', settings.soundEnabled);
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Προσοχή στον ενεργό κανόνα! Τώρα ταιριάζουμε με βάση το ${
            round.ruleType === 'color' ? 'χρώμα' : 'σχήμα'
          }, όχι το «${labelEl}».`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-06-switch-rule">
      {/* Explicit Rule Banner */}
      <div
        data-testid={`rule-banner-${round.ruleType}`}
        className={`p-5 rounded-3xl border-4 space-y-2 ${
          round.ruleType === 'color'
            ? 'bg-sage-surface border-sage-dark'
            : 'bg-terracotta-surface border-terracotta-dark'
        }`}
      >
        <div className="text-3xl" aria-hidden="true">
          {round.ruleType === 'color' ? '🎨 Κανόνας Χρώματος' : '⭐ Κανόνας Σχήματος'}
        </div>
        <h2 className="text-xl font-extrabold text-charcoal">{round.ruleTitleEl}</h2>
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-charcoal/20">
          <span className="text-4xl" aria-hidden="true">{round.targetEmoji}</span>
          <span className="font-extrabold text-lg text-charcoal">{round.targetDescriptionEl}</span>
        </div>
      </div>

      {/* Sorting Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight = hintLevel >= 1 && opt.isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCorrect ? 'switch-rule-target' : `switch-rule-opt-${opt.id}`}
              onClick={() => handleOptionSelect(opt.isCorrect, opt.labelEl)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-base font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
