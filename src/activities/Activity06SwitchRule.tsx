import React, { useMemo, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';
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
      { id: 'r3-2', emoji: '📐', labelEl: 'Τρίγωνο Χάρακας', isCorrect: false },
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
  const activeRounds = useMemo(
    () => selectSessionRounds(RULE_ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
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
    if (hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5) {
      return round.options.filter((o, i) => o.isCorrect || i === 0);
    }
    if (ageBand === '8-10' || ageBand === '10-12' || adaptiveProfile.enrichChallenge) {
      return [
        ...round.options,
        {
          id: `r-extra-${currentRound}`,
          emoji: round.ruleType === 'color' ? '🎩' : '🍌',
          labelEl: round.ruleType === 'color' ? 'Μαύρο Καπέλο' : 'Μακρόστενη Μπανάνα',
          isCorrect: false,
        },
      ];
    }
    return round.options;
  }, [
    round.options,
    round.ruleType,
    hintLevel,
    ageBand,
    adaptiveProfile.distractorReductionRatio,
    adaptiveProfile.enrichChallenge,
    currentRound,
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
