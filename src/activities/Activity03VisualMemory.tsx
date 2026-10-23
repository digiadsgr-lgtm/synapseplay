import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

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
];

export const Activity03VisualMemory: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeRounds = useMemo(
    () => selectSessionRounds(ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const roundData = activeRounds[(currentRound - 1) % activeRounds.length];
  const [isHidden, setIsHidden] = useState<boolean>(false);

  useEffect(() => {
    setIsHidden(false);
  }, [currentRound, sessionSeed]);

  const visibleCards =
    hintLevel === 2
      ? roundData.cards.filter((c, idx) => c.isTarget || idx === 0)
      : roundData.cards;

  const handleCardPick = (card: MemoryCard) => {
    runDebounced(() => {
      if (!isHidden) {
        setIsHidden(true);
        return;
      }
      if (card.isTarget) {
        advanceRound(getAbsorbedCount());
      } else {
        setIsHidden(false);
        triggerGentleFeedback(
          `Εκεί ήταν «${card.labelEl}». Δες ξανά τις κάρτες και πάτησε «Κρύψε τις Κάρτες» όταν είσαι έτοιμος!`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-03-visual-memory">
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-charcoal">Θυμήσου πού βρίσκεται:</span>
          <span className="px-4 py-2 rounded-xl bg-white border-2 border-slate font-extrabold text-lg flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{roundData.targetEmoji}</span>
            <span>{roundData.targetLabelEl}</span>
          </span>
        </div>

        <button
          type="button"
          data-testid="toggle-hide-cards-btn"
          onClick={() => setIsHidden((h) => !h)}
          className="touch-target px-5 py-2.5 rounded-2xl bg-sage-dark text-white font-extrabold flex items-center gap-2 hover:bg-sage"
        >
          <span aria-hidden="true">{isHidden ? '👀' : '🙈'}</span>
          <span>{isHidden ? 'Δείξε λίγο τις Κάρτες' : 'Κρύψε τις Κάρτες & Βρες!'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {visibleCards.map((card) => {
          const highlight = isHidden && hintLevel >= 1 && card.isTarget;
          return (
            <button
              key={card.id}
              type="button"
              data-testid={card.isTarget ? 'memory-card-target' : `memory-card-${card.id}`}
              onClick={() => handleCardPick(card)}
              aria-label={isHidden ? 'Κρυμμένη κάρτα' : card.labelEl}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : isHidden
                  ? 'bg-slate text-white border-slate-dark hover:bg-slate-light'
                  : 'bg-white border-sand-dark text-charcoal'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">
                {isHidden ? '❓' : card.emoji}
              </span>
              <span className="text-sm font-bold">
                {isHidden ? 'Πού ήταν;' : card.labelEl}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
