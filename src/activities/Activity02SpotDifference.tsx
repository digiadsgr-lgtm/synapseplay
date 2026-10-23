import React from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';

interface SceneSlot {
  id: string;
  leftEmoji: string;
  rightEmoji: string;
  labelEl: string;
  isDifferent: boolean;
}

const SCENES: SceneSlot[][] = [
  [
    { id: 's1-1', leftEmoji: '🌳', rightEmoji: '🌳', labelEl: 'Δέντρο', isDifferent: false },
    { id: 's1-2', leftEmoji: '☀️', rightEmoji: '🌙', labelEl: 'Ουρανός (Ήλιος / Φεγγάρι)', isDifferent: true },
    { id: 's1-3', leftEmoji: '🏡', rightEmoji: '🏡', labelEl: 'Σπιτάκι', isDifferent: false },
    { id: 's1-4', leftEmoji: '🌷', rightEmoji: '🌷', labelEl: 'Λουλούδι', isDifferent: false },
  ],
  [
    { id: 's2-1', leftEmoji: '⛵', rightEmoji: '⛵', labelEl: 'Καραβάκι', isDifferent: false },
    { id: 's2-2', leftEmoji: '🐟', rightEmoji: '🐟', labelEl: 'Ψαράκι', isDifferent: false },
    { id: 's2-3', leftEmoji: '🦀', rightEmoji: '🐙', labelEl: 'Βυθός (Καβούρι / Χταπόδι)', isDifferent: true },
    { id: 's2-4', leftEmoji: '🐚', rightEmoji: '🐚', labelEl: 'Κοχύλι', isDifferent: false },
  ],
  [
    { id: 's3-1', leftEmoji: '🍎', rightEmoji: '🍐', labelEl: 'Φρούτο (Μήλο / Αχλάδι)', isDifferent: true },
    { id: 's3-2', leftEmoji: '🥪', rightEmoji: '🥪', labelEl: 'Σάντουιτς', isDifferent: false },
    { id: 's3-3', leftEmoji: '🥛', rightEmoji: '🥛', labelEl: 'Ποτήρι', isDifferent: false },
    { id: 's3-4', leftEmoji: '🥄', rightEmoji: '🥄', labelEl: 'Κουτάλι', isDifferent: false },
  ],
];

export const Activity02SpotDifference: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const slots = SCENES[(currentRound - 1) % SCENES.length];

  const visibleSlots = hintLevel === 2 ? slots.filter((s, i) => s.isDifferent || i === 0) : slots;

  const handleRightCardClick = (slot: SceneSlot) => {
    runDebounced(() => {
      if (slot.isDifferent) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Το στοιχείο «${slot.labelEl}» είναι ίδιο και στις δύο εικόνες. Ψάξε ποιο άλλαξε!`
        );
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="activity-02-spot-difference">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Reference Scene */}
        <div className="p-5 rounded-3xl bg-white border-2 border-sand-dark space-y-3">
          <h2 className="text-lg font-extrabold text-charcoal text-center">
            Εικόνα Α (Αρχική)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {visibleSlots.map((slot) => (
              <div
                key={`left-${slot.id}`}
                className="min-h-[96px] p-4 rounded-2xl bg-sand border-2 border-sand-dark flex flex-col items-center justify-center gap-1"
              >
                <span className="text-5xl" aria-hidden="true">{slot.leftEmoji}</span>
                <span className="text-xs font-bold text-charcoal-muted text-center">{slot.labelEl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Interactive Scene with generous >=96px touch zones */}
        <div className="p-5 rounded-3xl bg-slate-surface border-2 border-slate space-y-3">
          <h2 className="text-lg font-extrabold text-charcoal text-center">
            Εικόνα Β (Πάτησε τη Διαφορά!)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {visibleSlots.map((slot) => {
              const highlight = hintLevel >= 1 && slot.isDifferent;
              return (
                <button
                  key={`right-${slot.id}`}
                  type="button"
                  data-testid={slot.isDifferent ? 'difference-item-target' : `difference-item-${slot.id}`}
                  onClick={() => handleRightCardClick(slot)}
                  aria-label={`Επιλογή: ${slot.labelEl}`}
                  className={`touch-target min-h-[96px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                    highlight
                      ? 'bg-sage-surface border-4 border-sage-dark ring-4 ring-sage/40'
                      : 'bg-white border-slate hover:bg-sage-surface/50'
                  }`}
                >
                  <span className="text-5xl" aria-hidden="true">{slot.rightEmoji}</span>
                  <span className="text-xs font-bold text-charcoal text-center">{slot.labelEl}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
