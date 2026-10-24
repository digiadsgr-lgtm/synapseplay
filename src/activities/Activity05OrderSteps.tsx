import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface RoutineStep {
  order: number;
  emoji: string;
  labelEl: string;
}

const ROUTINES: Array<{ titleEl: string; steps: RoutineStep[]; displayOrder: number[] }> = [
  {
    titleEl: 'Ρουτίνα: Πλένω τα Δόντια μου',
    steps: [
      { order: 1, emoji: '🪥', labelEl: 'Βάζω οδοντόκρεμα στην οδοντόβουρτσα' },
      { order: 2, emoji: '🦷', labelEl: 'Βουρτσίζω απαλά τα δόντια μου' },
      { order: 3, emoji: '💧', labelEl: 'Ξεπλένω το στόμα με νερό' },
    ],
    displayOrder: [2, 1, 3],
  },
  {
    titleEl: 'Ρουτίνα: Ετοιμάζω τη Σχολική Τσάντα',
    steps: [
      { order: 1, emoji: '🎒', labelEl: 'Ανοίγω τη σχολική μου τσάντα' },
      { order: 2, emoji: '📚', labelEl: 'Βάζω μέσα τα τετράδια και την κασετίνα' },
      { order: 3, emoji: '🔒', labelEl: 'Κλείνω το φερμουάρ της τσάντας' },
    ],
    displayOrder: [3, 1, 2],
  },
  {
    titleEl: 'Ρουτίνα: Πλένω τα Χέρια μου',
    steps: [
      { order: 1, emoji: '🚰', labelEl: 'Βρέχω τα χέρια μου με νερό' },
      { order: 2, emoji: '🧼', labelEl: 'Τρίβω τα χέρια με σαπούνι' },
      { order: 3, emoji: '🧻', labelEl: 'Σκουπίζω τα χέρια στην πετσέτα' },
    ],
    displayOrder: [2, 3, 1],
  },
  {
    titleEl: 'Ρουτίνα: Φυτεύω ένα Σποράκι στον Κήπο',
    steps: [
      { order: 1, emoji: '🪴', labelEl: 'Βάζω χώμα στη γλάστρα και φυτεύω το σποράκι' },
      { order: 2, emoji: '🚿', labelEl: 'Ποτίζω απαλά με λίγο νερό' },
      { order: 3, emoji: '🌱', labelEl: 'Το φυτό μεγαλώνει στον ήλιο' },
    ],
    displayOrder: [3, 1, 2],
  },
  {
    titleEl: 'Ρουτίνα: Ετοιμάζω το Τοστ μου',
    steps: [
      { order: 1, emoji: '🍞', labelEl: 'Παίρνω δύο φέτες ψωμί' },
      { order: 2, emoji: '🧀', labelEl: 'Βάζω το τυρί ανάμεσα στις φέτες' },
      { order: 3, emoji: '🥪', labelEl: 'Ακουμπάω το έτοιμο σάντουιτς στο πιάτο' },
    ],
    displayOrder: [2, 3, 1],
  },
  {
    titleEl: 'Ρουτίνα: Ετοιμάζομαι για Βραδινό Ύπνο',
    steps: [
      { order: 1, emoji: '👕', labelEl: 'Φοράω τις άνετες πιτζάμες μου' },
      { order: 2, emoji: '📖', labelEl: 'Διαβάζουμε ένα ήρεμο παραμύθι' },
      { order: 3, emoji: '😴', labelEl: 'Κλείνω το φως και ξαπλώνω στο μαξιλάρι' },
    ],
    displayOrder: [3, 1, 2],
  },
  {
    titleEl: 'Ρουτίνα: Διασχίζω τον Δρόμο με Ασφάλεια',
    steps: [
      { order: 1, emoji: '🛑', labelEl: 'Σταματάω στο πεζοδρόμιο στη διάβαση' },
      { order: 2, emoji: '👀', labelEl: 'Κοιτάζω αριστερά και δεξιά αν έρχεται όχημα' },
      { order: 3, emoji: '🚶', labelEl: 'Περνάω ήρεμα με το πράσινο φανάρι πεζών' },
    ],
    displayOrder: [2, 1, 3],
  },
  {
    titleEl: 'Ρουτίνα: Ζωγραφίζω με Νερομπογιές',
    steps: [
      { order: 1, emoji: '🖌️', labelEl: 'Βουτάω το πινέλο σε λίγο νερό και χρώμα' },
      { order: 2, emoji: '🎨', labelEl: 'Ζωγραφίζω πάνω στο λευκό χαρτί' },
      { order: 3, emoji: '🧼', labelEl: 'Πλένω το πινέλο και μαζεύω το τραπέζι' },
    ],
    displayOrder: [3, 2, 1],
  },
  {
    titleEl: 'Ρουτίνα: Στρώνω το Τραπέζι του Φαγητού',
    steps: [
      { order: 1, emoji: '🍽️', labelEl: 'Τοποθετώ τα πιάτα και τα κουτάλια στο τραπέζι' },
      { order: 2, emoji: '🍲', labelEl: 'Καθόμαστε όλοι μαζί και τρώμε ήρεμα' },
      { order: 3, emoji: '🧽', labelEl: 'Μαζεύουμε τα πιάτα στον νεροχύτη' },
    ],
    displayOrder: [2, 1, 3],
  },
  {
    titleEl: 'Ρουτίνα: Ετοιμάζομαι για Βροχερή Βόλτα',
    steps: [
      { order: 1, emoji: '🧥', labelEl: 'Φοράω το αδιάβροχο μπουφάν μου' },
      { order: 2, emoji: '👢', labelEl: 'Βάζω τις γαλότσες στα πόδια μου' },
      { order: 3, emoji: '☂️', labelEl: 'Ανοίγω την ομπρέλα μου έξω από την πόρτα' },
    ],
    displayOrder: [3, 1, 2],
  },
  {
    titleEl: 'Ρουτίνα: Ξεκινάω το Απογευματινό Διάβασμα',
    steps: [
      { order: 1, emoji: '🧹', labelEl: 'Αδειάζω το γραφείο μου από τα περιττά παιχνίδια' },
      { order: 2, emoji: '📖', labelEl: 'Ανοίγω το βιβλίο και το τετράδιο της πρώτης άσκησης' },
      { order: 3, emoji: '✏️', labelEl: 'Γράφω ήρεμα με το μολύβι μου' },
    ],
    displayOrder: [2, 3, 1],
  },
  {
    titleEl: 'Ρουτίνα: Φτιάχνω Φυσικό Χυμό Πορτοκάλι',
    steps: [
      { order: 1, emoji: '🍊', labelEl: 'Πλένω και κόβω στη μέση τα πορτοκάλια' },
      { order: 2, emoji: '🥣', labelEl: 'Στύβω τα πορτοκάλια στον στίφτη' },
      { order: 3, emoji: '🥤', labelEl: 'Αδειάζω τον φρέσκο χυμό στο ποτήρι μου' },
    ],
    displayOrder: [3, 1, 2],
  },
  {
    titleEl: 'Ρουτίνα: Φροντίζω το Κατοικίδιό μου',
    steps: [
      { order: 1, emoji: '🥣', labelEl: 'Βάζω καθαρό νερό και τροφή στο μπολ του' },
      { order: 2, emoji: '🐕', labelEl: 'Το ζωάκι τρώει ήρεμα το φαγητό του' },
      { order: 3, emoji: '🤍', labelEl: 'Το χαϊδεύω απαλά στην πλάτη' },
    ],
    displayOrder: [2, 1, 3],
  },
  {
    titleEl: 'Ρουτίνα: Τακτοποιώ τα Τουβλάκια μου',
    steps: [
      { order: 1, emoji: '🧱', labelEl: 'Μαζεύω τα τουβλάκια από το χαλί' },
      { order: 2, emoji: '📦', labelEl: 'Τα βάζω όλα μέσα στο κουτί αποθήκευσης' },
      { order: 3, emoji: '✨', labelEl: 'Κλείνω το καπάκι και βάζω το κουτί στο ράφι' },
    ],
    displayOrder: [3, 2, 1],
  },
];

export const Activity05OrderSteps: React.FC<ActivityRunnerRenderProps> = ({
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
  const activeRoutines = useMemo(
    () => selectSessionRounds(ROUTINES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const routine = activeRoutines[(currentRound - 1) % activeRoutines.length];
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  useEffect(() => {
    setSelectedOrders([]);
    if (currentRound > 1) {
      speakGreek(routine.titleEl, settings.voiceEnabled, adaptiveProfile.speechRate);
    }
  }, [currentRound, sessionSeed, routine.titleEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const nextExpectedOrder = selectedOrders.length + 1;

  const handlePickStep = (step: RoutineStep) => {
    runDebounced(() => {
      if (selectedOrders.includes(step.order)) return;

      if (step.order === nextExpectedOrder) {
        const updated = [...selectedOrders, step.order];
        setSelectedOrders(updated);
        if (updated.length === routine.steps.length) {
          playCalmTone('complete', settings.soundEnabled);
          advanceRound(getAbsorbedCount());
        } else {
          playCalmTone('soft-step', settings.soundEnabled);
          speakGreek(step.labelEl, settings.voiceEnabled, adaptiveProfile.speechRate);
        }
      } else {
        triggerGentleFeedback(
          `Σκέψου ήρεμα: τι κάνουμε στο Βήμα ${nextExpectedOrder} πριν από το «${step.labelEl}»;`
        );
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="activity-05-order-steps">
      <div className="p-4 rounded-2xl bg-sage-surface border-2 border-sage text-center space-y-2">
        <h2 className="text-xl font-extrabold text-charcoal">{routine.titleEl}</h2>
        <p className="text-sm font-bold text-charcoal-muted">
          Επίλεξε το Βήμα {nextExpectedOrder} από τα {routine.steps.length} με τη σωστή χρονική σειρά:
        </p>
        {/* Visual Sequence Timeline Strip */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {routine.steps.map((s) => {
            const done = selectedOrders.includes(s.order);
            return (
              <span
                key={`timeline-${s.order}`}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                  done
                    ? 'bg-sage-dark text-white border-charcoal'
                    : s.order === nextExpectedOrder
                    ? 'bg-white text-charcoal border-slate-dark'
                    : 'bg-sand-light text-charcoal-muted border-sand-dark'
                }`}
              >
                {done ? `${s.order}. ${s.emoji} ✓` : `Βήμα ${s.order}`}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routine.displayOrder.map((orderNum) => {
          const step = routine.steps.find((s) => s.order === orderNum)!;
          const isAlreadyPicked = selectedOrders.includes(step.order);
          const isNextHint =
            !isAlreadyPicked &&
            (hintLevel >= 1 || ageBand === '4-5' || adaptiveProfile.autoHintBoost) &&
            step.order === nextExpectedOrder;

          return (
            <button
              key={step.order}
              type="button"
              disabled={isAlreadyPicked}
              data-testid={`order-step-card-${step.order}`}
              onClick={() => handlePickStep(step)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-3 text-center transition-all ${
                isAlreadyPicked
                  ? 'bg-sage text-white border-sage-dark opacity-90'
                  : isNextHint
                  ? 'bg-white border-terracotta ring-4 ring-terracotta/40 text-charcoal'
                  : 'bg-white border-sand-dark text-charcoal hover:border-slate'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">{step.emoji}</span>
              <span className="text-base font-extrabold">{step.labelEl}</span>
              {(isAlreadyPicked || hintLevel === 2 || ageBand === '4-5') && (
                <span className="px-3 py-1 rounded-full bg-sand text-charcoal text-xs font-extrabold">
                  Βήμα {step.order}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
