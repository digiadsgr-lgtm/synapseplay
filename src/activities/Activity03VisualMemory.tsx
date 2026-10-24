import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  rotateOptionsForSession,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface MemoryCard {
  id: string;
  emoji: string;
  labelEl: string;
  isTarget: boolean;
}

const ROUNDS: Array<{ targetLabelEl: string; targetEmoji: string; cards: MemoryCard[] }> = [
  {
    targetLabelEl: 'Κόκκινο Μήλο',
    targetEmoji: '🍎',
    cards: [
      { id: 'm1-1', emoji: '🍎', labelEl: 'Κόκκινο Μήλο', isTarget: true },
      { id: 'm1-2', emoji: '🚲', labelEl: 'Ποδήλατο', isTarget: false },
      { id: 'm1-3', emoji: '🎸', labelEl: 'Κιθάρα', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Μπλε Καραβάκι',
    targetEmoji: '⛵',
    cards: [
      { id: 'm2-1', emoji: '🌵', labelEl: 'Κάκτος', isTarget: false },
      { id: 'm2-2', emoji: '⛵', labelEl: 'Μπλε Καραβάκι', isTarget: true },
      { id: 'm2-3', emoji: '🎈', labelEl: 'Μπαλόνι', isTarget: false },
      { id: 'm2-4', emoji: '🎩', labelEl: 'Καπέλο', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Κίτρινο Αστέρι',
    targetEmoji: '⭐',
    cards: [
      { id: 'm3-1', emoji: '🦋', labelEl: 'Πεταλούδα', isTarget: false },
      { id: 'm3-2', emoji: '🍄', labelEl: 'Μανιτάρι', isTarget: false },
      { id: 'm3-3', emoji: '⭐', labelEl: 'Κίτρινο Αστέρι', isTarget: true },
      { id: 'm3-4', emoji: '🐢', labelEl: 'Χελώνα', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Πράσινο Τριφύλλι',
    targetEmoji: '🍀',
    cards: [
      { id: 'm4-1', emoji: '🌻', labelEl: 'Ηλίανθος', isTarget: false },
      { id: 'm4-2', emoji: '🍀', labelEl: 'Πράσινο Τριφύλλι', isTarget: true },
      { id: 'm4-3', emoji: '🐚', labelEl: 'Κοχύλι', isTarget: false },
      { id: 'm4-4', emoji: '🥁', labelEl: 'Τύμπανο', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Σοφή Κουκουβάγια',
    targetEmoji: '🦉',
    cards: [
      { id: 'm5-1', emoji: '🦉', labelEl: 'Σοφή Κουκουβάγια', isTarget: true },
      { id: 'm5-2', emoji: '🐬', labelEl: 'Δελφίνι', isTarget: false },
      { id: 'm5-3', emoji: '🚂', labelEl: 'Τρενάκι', isTarget: false },
      { id: 'm5-4', emoji: '🍓', labelEl: 'Φράουλα', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Διαστημικός Πύραυλος',
    targetEmoji: '🚀',
    cards: [
      { id: 'm6-1', emoji: '⛺', labelEl: 'Σκηνή', isTarget: false },
      { id: 'm6-2', emoji: '🎻', labelEl: 'Βιολί', isTarget: false },
      { id: 'm6-3', emoji: '🚀', labelEl: 'Διαστημικός Πύραυλος', isTarget: true },
      { id: 'm6-4', emoji: '🍐', labelEl: 'Αχλάδι', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Χρυσό Καμπανάκι',
    targetEmoji: '🔔',
    cards: [
      { id: 'm7-1', emoji: '📘', labelEl: 'Βιβλίο', isTarget: false },
      { id: 'm7-2', emoji: '🔔', labelEl: 'Χρυσό Καμπανάκι', isTarget: true },
      { id: 'm7-3', emoji: '🦀', labelEl: 'Καβούρι', isTarget: false },
      { id: 'm7-4', emoji: '🌙', labelEl: 'Φεγγάρι', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Μικρό Σκιουράκι',
    targetEmoji: '🐿️',
    cards: [
      { id: 'm8-1', emoji: '🐳', labelEl: 'Φάλαινα', isTarget: false },
      { id: 'm8-2', emoji: '🍋', labelEl: 'Λεμόνι', isTarget: false },
      { id: 'm8-3', emoji: '🏠', labelEl: 'Σπιτάκι', isTarget: false },
      { id: 'm8-4', emoji: '🐿️', labelEl: 'Μικρό Σκιουράκι', isTarget: true },
    ],
  },
  {
    targetLabelEl: 'Μπλε Δελφίνι',
    targetEmoji: '🐬',
    cards: [
      { id: 'm9-1', emoji: '🐬', labelEl: 'Μπλε Δελφίνι', isTarget: true },
      { id: 'm9-2', emoji: '🌻', labelEl: 'Ηλίανθος', isTarget: false },
      { id: 'm9-3', emoji: '🎒', labelEl: 'Τσάντα', isTarget: false },
      { id: 'm9-4', emoji: '🎹', labelEl: 'Πιάνο', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Κόκκινη Φράουλα',
    targetEmoji: '🍓',
    cards: [
      { id: 'm10-1', emoji: '🍐', labelEl: 'Αχλάδι', isTarget: false },
      { id: 'm10-2', emoji: '🍓', labelEl: 'Κόκκινη Φράουλα', isTarget: true },
      { id: 'm10-3', emoji: '🔔', labelEl: 'Καμπανάκι', isTarget: false },
      { id: 'm10-4', emoji: '⛺', labelEl: 'Σκηνή', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Κίτρινος Ήλιος',
    targetEmoji: '☀️',
    cards: [
      { id: 'm11-1', emoji: '🌙', labelEl: 'Φεγγάρι', isTarget: false },
      { id: 'm11-2', emoji: '☁️', labelEl: 'Σύννεφο', isTarget: false },
      { id: 'm11-3', emoji: '☀️', labelEl: 'Κίτρινος Ήλιος', isTarget: true },
      { id: 'm11-4', emoji: '🌈', labelEl: 'Ουράνιο Τόξο', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Μικρή Μέλισσα',
    targetEmoji: '🐝',
    cards: [
      { id: 'm12-1', emoji: '🐞', labelEl: 'Πασχαλίτσα', isTarget: false },
      { id: 'm12-2', emoji: '🐝', labelEl: 'Μικρή Μέλισσα', isTarget: true },
      { id: 'm12-3', emoji: '🦋', labelEl: 'Πεταλούδα', isTarget: false },
      { id: 'm12-4', emoji: '🌷', labelEl: 'Τουλίπα', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Πράσινος Βάτραχος',
    targetEmoji: '🐸',
    cards: [
      { id: 'm13-1', emoji: '🦆', labelEl: 'Παπάκι', isTarget: false },
      { id: 'm13-2', emoji: '🐟', labelEl: 'Ψαράκι', isTarget: false },
      { id: 'm13-3', emoji: '🐸', labelEl: 'Πράσινος Βάτραχος', isTarget: true },
      { id: 'm13-4', emoji: '🦀', labelEl: 'Καβούρι', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Ξύλινο Βιολί',
    targetEmoji: '🎻',
    cards: [
      { id: 'm14-1', emoji: '🎻', labelEl: 'Ξύλινο Βιολί', isTarget: true },
      { id: 'm14-2', emoji: '🥁', labelEl: 'Τύμπανο', isTarget: false },
      { id: 'm14-3', emoji: '🎺', labelEl: 'Τρομπέτα', isTarget: false },
      { id: 'm14-4', emoji: '🪈', labelEl: 'Φλογέρα', isTarget: false },
    ],
  },
  {
    targetLabelEl: 'Πολύχρωμος Χαρταετός',
    targetEmoji: '🪁',
    cards: [
      { id: 'm15-1', emoji: '🎈', labelEl: 'Μπαλόνι', isTarget: false },
      { id: 'm15-2', emoji: '🧸', labelEl: 'Αρκουδάκι', isTarget: false },
      { id: 'm15-3', emoji: '🪁', labelEl: 'Πολύχρωμος Χαρταετός', isTarget: true },
      { id: 'm15-4', emoji: '⚽', labelEl: 'Μπάλα', isTarget: false },
    ],
  },
];

export const Activity03VisualMemory: React.FC<ActivityRunnerRenderProps> = ({
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
  const diff = useMemo(
    () => getAgeAndPerformanceDifficulty(ageBand, adaptiveProfile, hintLevel),
    [ageBand, adaptiveProfile, hintLevel]
  );

  const activeRounds = useMemo(
    () => selectSessionRounds(ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const roundData = activeRounds[(currentRound - 1) % activeRounds.length];
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [obsElapsedMs, setObsElapsedMs] = useState<number>(0);
  const [peekCardId, setPeekCardId] = useState<string | null>(null);

  useEffect(() => {
    setIsHidden(false);
    setObsElapsedMs(0);
    setPeekCardId(null);
  }, [currentRound, sessionSeed]);

  // Automatic Observation Countdown: cards stay face-up while the child memorizes all positions,
  // then automatically flip face-down and announce the target to find!
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED' || isHidden) return;

    const tickMs = 100;
    const interval = window.setInterval(() => {
      setObsElapsedMs((prev) => prev + tickMs);
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [phase, isHidden, currentRound]);

  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED' || isHidden) return;
    if (obsElapsedMs >= diff.memoryObservationMs) {
      setIsHidden(true);
      playCalmTone('soft-step', settings.soundEnabled);
      speakGreek(
        `Πού κρύφτηκε: ${roundData.targetLabelEl};`,
        settings.voiceEnabled,
        adaptiveProfile.speechRate
      );
    }
  }, [
    phase,
    isHidden,
    obsElapsedMs,
    diff.memoryObservationMs,
    roundData.targetLabelEl,
    settings.soundEnabled,
    settings.voiceEnabled,
    adaptiveProfile.speechRate,
  ]);

  const visibleCards = useMemo(() => {
    let baseCards = roundData.cards;
    if (diff.isSimplified) {
      baseCards = roundData.cards.filter((c, idx) => c.isTarget || idx === 0);
    } else if (diff.isAdvancedMastery) {
      baseCards = [
        ...roundData.cards,
        { id: `extra-${currentRound}`, emoji: '🧭', labelEl: 'Πυξίδα', isTarget: false },
      ];
    }
    return rotateOptionsForSession(baseCards, sessionSeed, currentRound);
  }, [roundData.cards, diff.isSimplified, diff.isAdvancedMastery, currentRound, sessionSeed]);

  const obsRemainingPct = Math.max(
    0,
    Math.round(((diff.memoryObservationMs - obsElapsedMs) / Math.max(1000, diff.memoryObservationMs)) * 100)
  );

  // Show the target name ONLY after the cards are flipped face-down (or if in simplified/hint mode),
  // so the child genuinely memorizes all cards during the observation phase!
  const revealTargetPrompt = isHidden || diff.isSimplified || hintLevel >= 1;

  const handleCardPick = (card: MemoryCard) => {
    runDebounced(() => {
      if (!isHidden) {
        triggerGentleFeedback(
          'Κοίτα πρώτα όλες τις κάρτες! Σε λίγα δευτερόλεπτα γυρίζουν ανάποδα για να βρεις πού κρύφτηκε ο στόχος!'
        );
        return;
      }
      if (card.isTarget) {
        playCalmTone('complete', settings.soundEnabled);
        advanceRound(getAbsorbedCount());
      } else {
        // Flip the wrong card briefly face-up so the child sees what was there, then flip all back for a fresh look
        setPeekCardId(card.id);
        setIsHidden(false);
        setObsElapsedMs(0);
        triggerGentleFeedback(
          `Εκεί ήταν «${card.labelEl}». Δες ξανά τις κάρτες προσεκτικά — θα γυρίσουν αυτόματα σε λίγο!`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-03-visual-memory">
      <div className="p-5 rounded-3xl bg-slate-surface border-2 border-slate space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-left">
            {revealTargetPrompt ? (
              <>
                <span className="text-lg font-extrabold text-charcoal">
                  {isHidden ? 'Βρες πού κρύφτηκε:' : 'Θυμήσου πού βρίσκεται:'}
                </span>
                <span className="px-4 py-2 rounded-xl bg-white border-2 border-slate font-extrabold text-lg flex items-center gap-2 shadow-sm">
                  <span className="text-2xl" aria-hidden="true">{roundData.targetEmoji}</span>
                  <span>{roundData.targetLabelEl}</span>
                </span>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">👀🧠</span>
                <div>
                  <p className="text-base md:text-lg font-extrabold text-charcoal">
                    Απομνημόνευσε ΟΛΕΣ τις κάρτες και τις θέσεις τους!
                  </p>
                  <p className="text-xs font-bold text-slate-dark">
                    Μόλις γυρίσουν ανάποδα θα σου αποκαλύψουμε ποια εικόνα ψάχνουμε!
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            data-testid="toggle-hide-cards-btn"
            onClick={() => {
              setIsHidden((h) => !h);
              setObsElapsedMs(0);
            }}
            className="touch-target px-4 py-2 rounded-2xl bg-white border-2 border-slate text-charcoal text-xs font-extrabold flex items-center gap-1.5 hover:bg-sand"
          >
            <span aria-hidden="true">{isHidden ? '👀' : '🙈'}</span>
            <span>{isHidden ? 'Δείξε ξανά για λίγο' : 'Είμαι Έτοιμος — Κρύψε Τώρα'}</span>
          </button>
        </div>

        {/* Live Observation Countdown Bar */}
        {!isHidden && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-extrabold text-slate-dark">
              <span>⏳ Χρόνος Παρατήρησης Καρτών</span>
              <span>{((diff.memoryObservationMs - obsElapsedMs) / 1000).toFixed(1)} δευτ.</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white border border-slate overflow-hidden">
              <div
                className="h-full bg-sage-dark transition-all duration-100 rounded-full"
                style={{ width: `${obsRemainingPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {visibleCards.map((card) => {
          const highlight = isHidden && diff.isGuided && hintLevel >= 1 && card.isTarget;
          const isPeeking = peekCardId === card.id && !isHidden;
          return (
            <button
              key={card.id}
              type="button"
              data-testid={card.isTarget ? 'memory-card-target' : `memory-card-${card.id}`}
              onClick={() => handleCardPick(card)}
              aria-label={isHidden ? 'Κρυμμένη κάρτα' : card.labelEl}
              className={`touch-target min-h-[128px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40 scale-105'
                  : isHidden
                  ? 'bg-slate text-white border-slate-dark hover:bg-slate-light cursor-pointer'
                  : isPeeking
                  ? 'bg-terracotta-surface border-terracotta-dark text-charcoal'
                  : 'bg-white border-sand-dark text-charcoal'
              }`}
            >
              <span className="text-5xl select-none" aria-hidden="true">
                {isHidden ? '❓' : card.emoji}
              </span>
              <span className="text-sm font-extrabold">
                {isHidden ? 'Πού ήταν;' : card.labelEl}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
