import React, { useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import {
  getAgeAndPerformanceDifficulty,
  rotateOptionsForSession,
  selectSessionRounds,
} from '../utils/clinicalAdhdEngine';

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
  [
    { id: 's4-1', leftEmoji: '🎒', rightEmoji: '🎒', labelEl: 'Σχολική Τσάντα', isDifferent: false },
    { id: 's4-2', leftEmoji: '✏️', rightEmoji: '🖍️', labelEl: 'Κασετίνα (Μολύβι / Μαρκαδόρος)', isDifferent: true },
    { id: 's4-3', leftEmoji: '📘', rightEmoji: '📘', labelEl: 'Τετράδιο', isDifferent: false },
    { id: 's4-4', leftEmoji: '📏', rightEmoji: '📏', labelEl: 'Χάρακας', isDifferent: false },
  ],
  [
    { id: 's5-1', leftEmoji: '🚀', rightEmoji: '🚀', labelEl: 'Πύραυλος', isDifferent: false },
    { id: 's5-2', leftEmoji: '🪐', rightEmoji: '🪐', labelEl: 'Πλανήτης Κρόνος', isDifferent: false },
    { id: 's5-3', leftEmoji: '⭐', rightEmoji: '☄️', labelEl: 'Διάστημα (Αστέρι / Κομήτης)', isDifferent: true },
    { id: 's5-4', leftEmoji: '🌕', rightEmoji: '🌕', labelEl: 'Φεγγάρι', isDifferent: false },
  ],
  [
    { id: 's6-1', leftEmoji: '🎸', rightEmoji: '🎻', labelEl: 'Έγχορδο (Κιθάρα / Βιολί)', isDifferent: true },
    { id: 's6-2', leftEmoji: '🥁', rightEmoji: '🥁', labelEl: 'Τύμπανο', isDifferent: false },
    { id: 's6-3', leftEmoji: '🎹', rightEmoji: '🎹', labelEl: 'Πιάνο', isDifferent: false },
    { id: 's6-4', leftEmoji: '🔔', rightEmoji: '🔔', labelEl: 'Καμπανάκι', isDifferent: false },
  ],
  [
    { id: 's7-1', leftEmoji: '🌲', rightEmoji: '🌲', labelEl: 'Έλατο', isDifferent: false },
    { id: 's7-2', leftEmoji: '⛺', rightEmoji: '⛺', labelEl: 'Σκηνή Κατασκήνωσης', isDifferent: false },
    { id: 's7-3', leftEmoji: '🦉', rightEmoji: '🐿️', labelEl: 'Δάσος (Κουκουβάγια / Σκιουράκι)', isDifferent: true },
    { id: 's7-4', leftEmoji: '🍄', rightEmoji: '🍄', labelEl: 'Μανιτάρι', isDifferent: false },
  ],
  [
    { id: 's8-1', leftEmoji: '🚲', rightEmoji: '🛴', labelEl: 'Ρόδες (Ποδήλατο / Πατίνι)', isDifferent: true },
    { id: 's8-2', leftEmoji: '⚽', rightEmoji: '⚽', labelEl: 'Μπάλα', isDifferent: false },
    { id: 's8-3', leftEmoji: '🛝', rightEmoji: '🛝', labelEl: 'Τσουλήθρα', isDifferent: false },
    { id: 's8-4', leftEmoji: '🌳', rightEmoji: '🌳', labelEl: 'Πάρκο', isDifferent: false },
  ],
  [
    { id: 's9-1', leftEmoji: '🛏️', rightEmoji: '🛏️', labelEl: 'Κρεβάτι', isDifferent: false },
    { id: 's9-2', leftEmoji: '🧸', rightEmoji: '🐰', labelEl: 'Παιχνίδι (Αρκουδάκι / Κουνελάκι)', isDifferent: true },
    { id: 's9-3', leftEmoji: '📚', rightEmoji: '📚', labelEl: 'Παραμύθια', isDifferent: false },
    { id: 's9-4', leftEmoji: '🕰️', rightEmoji: '🕰️', labelEl: 'Ρολόι', isDifferent: false },
  ],
  [
    { id: 's10-1', leftEmoji: '🪴', rightEmoji: '🪴', labelEl: 'Γλάστρα', isDifferent: false },
    { id: 's10-2', leftEmoji: '🌻', rightEmoji: '🌷', labelEl: 'Λουλούδι (Ηλίανθος / Τουλίπα)', isDifferent: true },
    { id: 's10-3', leftEmoji: '🐝', rightEmoji: '🐝', labelEl: 'Μέλισσα', isDifferent: false },
    { id: 's10-4', leftEmoji: '🚿', rightEmoji: '🚿', labelEl: 'Ποτιστήρι', isDifferent: false },
  ],
  [
    { id: 's11-1', leftEmoji: '🚂', rightEmoji: '🚂', labelEl: 'Τρενάκι', isDifferent: false },
    { id: 's11-2', leftEmoji: '🚌', rightEmoji: '🚒', labelEl: 'Όχημα (Λεωφορείο / Πυροσβεστικό)', isDifferent: true },
    { id: 's11-3', leftEmoji: '🚦', rightEmoji: '🚦', labelEl: 'Φανάρι', isDifferent: false },
    { id: 's11-4', leftEmoji: '🛣️', rightEmoji: '🛣️', labelEl: 'Δρόμος', isDifferent: false },
  ],
  [
    { id: 's12-1', leftEmoji: '❄️', rightEmoji: '❄️', labelEl: 'Χιονονιφάδα', isDifferent: false },
    { id: 's12-2', leftEmoji: '⛄', rightEmoji: '⛄', labelEl: 'Χιονάνθρωπος', isDifferent: false },
    { id: 's12-3', leftEmoji: '🧣', rightEmoji: '🧤', labelEl: 'Ζεστασιά (Κασκόλ / Γάντια)', isDifferent: true },
    { id: 's12-4', leftEmoji: '🏔️', rightEmoji: '🏔️', labelEl: 'Βουνό', isDifferent: false },
  ],
  [
    { id: 's13-1', leftEmoji: '🎨', rightEmoji: '🎨', labelEl: 'Παλέτα Χρωμάτων', isDifferent: false },
    { id: 's13-2', leftEmoji: '🖌️', rightEmoji: '✂️', labelEl: 'Εργαλείο (Πινέλο / Ψαλίδι)', isDifferent: true },
    { id: 's13-3', leftEmoji: '🖼️', rightEmoji: '🖼️', labelEl: 'Κάδρο', isDifferent: false },
    { id: 's13-4', leftEmoji: '📐', rightEmoji: '📐', labelEl: 'Χάρακας', isDifferent: false },
  ],
  [
    { id: 's14-1', leftEmoji: '🐢', rightEmoji: '🐸', labelEl: 'Λίμνη (Χελώνα / Βατραχάκι)', isDifferent: true },
    { id: 's14-2', leftEmoji: '🦆', rightEmoji: '🦆', labelEl: 'Παπάκι', isDifferent: false },
    { id: 's14-3', leftEmoji: '🌿', rightEmoji: '🌿', labelEl: 'Καλάμια', isDifferent: false },
    { id: 's14-4', leftEmoji: '💧', rightEmoji: '💧', labelEl: 'Νερό', isDifferent: false },
  ],
  [
    { id: 's15-1', leftEmoji: '🥣', rightEmoji: '🥣', labelEl: 'Μπολ Πρωινού', isDifferent: false },
    { id: 's15-2', leftEmoji: '🥐', rightEmoji: '🥞', labelEl: 'Πρωινό (Κρουασάν / Τηγανίτες)', isDifferent: true },
    { id: 's15-3', leftEmoji: '🍊', rightEmoji: '🍊', labelEl: 'Πορτοκάλι', isDifferent: false },
    { id: 's15-4', leftEmoji: '🍯', rightEmoji: '🍯', labelEl: 'Μέλι', isDifferent: false },
  ],
];

export const Activity02SpotDifference: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const diff = useMemo(
    () => getAgeAndPerformanceDifficulty(ageBand, adaptiveProfile, hintLevel),
    [ageBand, adaptiveProfile, hintLevel]
  );

  const activeScenes = useMemo(
    () => selectSessionRounds(SCENES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const slots = activeScenes[(currentRound - 1) % activeScenes.length];

  const visibleSlots = useMemo(() => {
    let baseSlots = slots;
    if (diff.isSimplified) {
      baseSlots = slots.filter((s, i) => s.isDifferent || i === 0);
    } else if (ageBand === '5-6') {
      baseSlots = slots.slice(0, 3);
    } else if (diff.isAdvancedMastery) {
      baseSlots = [
        ...slots,
        { id: `ex1-${currentRound}`, leftEmoji: '☁️', rightEmoji: '☁️', labelEl: 'Σύννεφο', isDifferent: false },
        { id: `ex2-${currentRound}`, leftEmoji: '🍀', rightEmoji: '🍀', labelEl: 'Τριφύλλι', isDifferent: false },
      ];
    }
    return rotateOptionsForSession(baseSlots, sessionSeed, currentRound);
  }, [slots, diff.isSimplified, diff.isAdvancedMastery, ageBand, currentRound, sessionSeed]);

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
        {/* Left Reference Scene (also clickable if the child taps the difference on the left!) */}
        <div className="p-5 rounded-3xl bg-white border-2 border-sand-dark space-y-3">
          <h2 className="text-lg font-extrabold text-charcoal text-center">
            Εικόνα Α (Αρχική)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {visibleSlots.map((slot) => (
              <button
                key={`left-${slot.id}`}
                type="button"
                onClick={() => handleRightCardClick(slot)}
                className="touch-target min-h-[96px] p-4 rounded-2xl bg-sand border-2 border-sand-dark flex flex-col items-center justify-center gap-1 hover:border-slate"
              >
                <span className="text-5xl" aria-hidden="true">{slot.leftEmoji}</span>
                <span className="text-xs font-bold text-charcoal-muted text-center">{slot.labelEl}</span>
              </button>
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
              const highlight = diff.isGuided && hintLevel >= 1 && slot.isDifferent;
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
