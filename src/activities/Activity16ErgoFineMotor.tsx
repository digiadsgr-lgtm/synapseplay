import React, { useState, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface FineMotorExercise {
  titleEl: string;
  ergoPromptEl: string;
  seatedPromptEl: string;
  waypoints: Array<{ step: number; emoji: string; labelEl: string }>;
}

const EXERCISES: FineMotorExercise[] = [
  {
    titleEl: 'Άσκηση 1: Τσιμπίδα Καβουριού & Οριζόντια Ιχνηλάτηση (Αριστερά ➔ Δεξιά)',
    ergoPromptEl:
      'Ένωσε τον αντίχειρα με τον δείκτη σαν «τσιμπίδα καβουριού» 🦀 και άγγιξε τα σημεία με τη σειρά από αριστερά προς τα δεξιά!',
    seatedPromptEl:
      'Με τους αγκώνες ξεκούραστους στο γραφείο, ένωσε αντίχειρα-δείκτη και άγγιξε τα σημεία 1 ➔ 2 ➔ 3!',
    waypoints: [
      { step: 1, emoji: '🦀', labelEl: 'Αρχή (Αριστερά)' },
      { step: 2, emoji: '〰️', labelEl: 'Μέση Διαδρομής' },
      { step: 3, emoji: '🐚', labelEl: 'Τέλος (Δεξιά)' },
    ],
  },
  {
    titleEl: 'Άσκηση 2: Πιάνο Δακτύλων & Αμφίπλευρος Συντονισμός',
    ergoPromptEl:
      'Ακούμπησε και τις δύο παλάμες στο τραπέζι. Χτύπα απαλά ένα-ένα τα δάχτυλα σαν πιάνο 🎹 και πάτησε τα 3 σημεία!',
    seatedPromptEl:
      'Καθιστός με ίσια πλάτη, παίξε «σιωπηλό πιάνο» στα γόνατα ή στο γραφείο και ολοκλήρωσε τη διαδρομή!',
    waypoints: [
      { step: 1, emoji: '☝️', labelEl: 'Δείκτης' },
      { step: 2, emoji: '✌️', labelEl: 'Μεσαίος & Παράμεσος' },
      { step: 3, emoji: '🖐️', labelEl: 'Όλη η Παλάμη' },
    ],
  },
  {
    titleEl: 'Άσκηση 3: Γραφοκινητικό Κύμα & Τριποδική Λαβή',
    ergoPromptEl:
      'Κράτησε ένα αληθινό μολύβι (ή το δάχτυλό σου) με 3 δάχτυλα («φωλιά πουλιού») και ακολούθησε το κύμα!',
    seatedPromptEl:
      'Το ένα χέρι σταθεροποιεί το χαρτί/τάμπλετ στο τραπέζι και το άλλο ακολουθεί ήρεμα τα 3 σημεία του κύματος!',
    waypoints: [
      { step: 1, emoji: '🌊', labelEl: 'Κορυφή 1' },
      { step: 2, emoji: '⛵', labelEl: 'Καμπύλη 2' },
      { step: 3, emoji: '🏝️', labelEl: 'Λιμάνι 3' },
    ],
  },
];

export const Activity16ErgoFineMotor: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  seatedMode,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const exercise = EXERCISES[(currentRound - 1) % EXERCISES.length];
  const [tracedStep, setTracedStep] = useState<number>(0);

  useEffect(() => {
    setTracedStep(hintLevel === 2 ? 2 : 0);
  }, [currentRound, hintLevel]);

  const nextExpectedStep = tracedStep + 1;

  const handleWaypointTap = (stepNum: number) => {
    runDebounced(() => {
      if (stepNum <= tracedStep) return;
      if (stepNum === nextExpectedStep) {
        playCalmTone('soft-step', settings.soundEnabled);
        if (stepNum >= exercise.waypoints.length) {
          setTracedStep(0);
          advanceRound(getAbsorbedCount());
        } else {
          setTracedStep(stepNum);
        }
      } else {
        triggerGentleFeedback(
          `Ξεκινάμε πάντα από αριστερά προς τα δεξιά! Πάτησε πρώτα το Σημείο ${nextExpectedStep}.`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-16-ergo-fine-motor">
      <div className="p-5 rounded-3xl bg-sage-surface border-4 border-sage space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-extrabold text-charcoal border border-sage">
          👐 Εργοθεραπεία — Λεπτή Κινητικότητα & Γραφοκινητική Πορεία
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{exercise.titleEl}</h2>
        <p className="text-base font-bold text-charcoal" data-testid="ergo-fine-motor-prompt">
          {seatedMode ? exercise.seatedPromptEl : exercise.ergoPromptEl}
        </p>
      </div>

      {/* Left-to-Right Graphomotor Tracing Track */}
      <div className="p-6 rounded-3xl bg-white border-2 border-sand-dark">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {exercise.waypoints.map((wp) => {
            const isCompletedStep = wp.step <= tracedStep;
            const isNextStep = wp.step === nextExpectedStep;
            const highlight = hintLevel >= 1 && isNextStep;

            return (
              <button
                key={wp.step}
                type="button"
                data-testid={`fine-motor-waypoint-${wp.step}`}
                onClick={() => handleWaypointTap(wp.step)}
                className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                  isCompletedStep
                    ? 'bg-sage text-white border-sage-dark'
                    : highlight
                    ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                    : isNextStep
                    ? 'bg-slate-surface border-slate text-charcoal'
                    : 'bg-sand-light border-sand-dark text-charcoal-muted'
                }`}
              >
                <span className="text-4xl" aria-hidden="true">{wp.emoji}</span>
                <span className="text-base font-extrabold">
                  {wp.step}. {wp.labelEl}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
