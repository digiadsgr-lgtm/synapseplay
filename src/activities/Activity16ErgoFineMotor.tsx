import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface FineMotorExercise {
  titleEl: string;
  ergoPromptEl: string;
  seatedPromptEl: string;
  waypoints: Array<{ step: number; emoji: string; labelEl: string }>;
}

const EXERCISES: FineMotorExercise[] = [
  {
    titleEl: 'Άσκηση: Τσιμπίδα Καβουριού & Οριζόντια Ιχνηλάτηση (Αριστερά ➔ Δεξιά)',
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
    titleEl: 'Άσκηση: Πιάνο Δακτύλων & Αμφίπλευρος Συντονισμός',
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
    titleEl: 'Άσκηση: Γραφοκινητικό Κύμα & Τριποδική Λαβή',
    ergoPromptEl:
      'Κράτησε ένα αληθινό μολύβι (ή το δάχτυλό σου) με 3 δάχτυλα («φωλιά πουλιού») και ακολούθησε το κύμα!',
    seatedPromptEl:
      'Το ένα χέρι σταθεροποιεί το χαρτί ή το τάμπλετ στο τραπέζι και το άλλο ακολουθεί ήρεμα τα 3 σημεία του κύματος!',
    waypoints: [
      { step: 1, emoji: '🌊', labelEl: 'Κορυφή 1' },
      { step: 2, emoji: '⛵', labelEl: 'Καμπύλη 2' },
      { step: 3, emoji: '🏝️', labelEl: 'Λιμάνι 3' },
    ],
  },
  {
    titleEl: 'Άσκηση: Διαγώνια Τροχιά Αστεριού & Οπτικοκινητική Παρακολούθηση',
    ergoPromptEl:
      'Ακολούθησε με τον δείκτη σου το αστέρι χωρίς να κουνάς το κεφάλι, μόνο με τα μάτια και το χέρι!',
    seatedPromptEl:
      'Κράτα τους ώμους χαλαρούς στην καρέκλα και ένωσε τα 3 φωτεινά σημεία του ουρανού!',
    waypoints: [
      { step: 1, emoji: '🌙', labelEl: 'Φεγγάρι 1' },
      { step: 2, emoji: '✨', labelEl: 'Αστερισμός 2' },
      { step: 3, emoji: '🌟', labelEl: 'Πολικός Αστέρας 3' },
    ],
  },
  {
    titleEl: 'Άσκηση: Απομόνωση Δακτύλων — Άγγιγμα Αντίχειρα με κάθε Δάχτυλο',
    ergoPromptEl:
      'Ακούμπησε τον αντίχειρα διαδοχικά με τον δείκτη, τον μεσαίο και το μικρό δαχτυλάκι και πάτησε τα 3 βήματα!',
    seatedPromptEl:
      'Με τους καρπούς σταθερούς πάνω στο τραπέζι, κάνε 3 απαλά αγγίγματα αντίχειρα-δακτύλων!',
    waypoints: [
      { step: 1, emoji: '👌', labelEl: 'Αντίχειρας + Δείκτης' },
      { step: 2, emoji: '🤏', labelEl: 'Αντίχειρας + Μεσαίος' },
      { step: 3, emoji: '🙌', labelEl: 'Ανοιχτές Παλάμες' },
    ],
  },
  {
    titleEl: 'Άσκηση: Ζιγκ-Ζαγκ Βουνού & Έλεγχος Πίεσης Δακτύλου',
    ergoPromptEl:
      'Ακούμπησε απαλά την οθόνη (χωρίς δυνατή πίεση) ανεβαίνοντας στην κορυφή του βουνού και κατεβαίνοντας στην κατασκήνωση!',
    seatedPromptEl:
      'Καθιστός με σταθερά πέλματα, χάραξε με απαλό άγγιγμα τις 3 στάσεις του βουνού!',
    waypoints: [
      { step: 1, emoji: '🌲', labelEl: 'Πρόποδες 1' },
      { step: 2, emoji: '⛰️', labelEl: 'Κορυφή 2' },
      { step: 3, emoji: '⛺', labelEl: 'Κατασκήνωση 3' },
    ],
  },
  {
    titleEl: 'Άσκηση: Ουράνιο Τόξο & Πέρασμα Μέσης Γραμμής Σώματος',
    ergoPromptEl:
      'Με το δεξί σου χέρι ξεκίνα από τ’ αριστερά και σχημάτισε μια μεγάλη καμπύλη ουράνιου τόξου μέχρι τα δεξιά!',
    seatedPromptEl:
      'Καθιστός χωρίς να στρίβεις τον κορμό, πέρασε το χέρι σου από αριστερά προς τα δεξιά στα 3 σημεία του ουράνιου τόξου!',
    waypoints: [
      { step: 1, emoji: '☁️', labelEl: 'Σύννεφο Αριστερά' },
      { step: 2, emoji: '🌈', labelEl: 'Τόξο Κορυφής' },
      { step: 3, emoji: '☀️', labelEl: 'Ήλιος Δεξιά' },
    ],
  },
  {
    titleEl: 'Άσκηση: Πτήση Μέλισσας & Σταθερότητα Καρπού',
    ergoPromptEl:
      'Κράτα τον καρπό σου σταθερό και οδήγησε τη μικρή μέλισσα από το πρώτο λουλούδι μέχρι την κυψέλη!',
    seatedPromptEl:
      'Ακούμπησε τον πήχη στο τραπέζι και κίνησε μόνο τον δείκτη από το λουλούδι 1 έως την κυψέλη 3!',
    waypoints: [
      { step: 1, emoji: '🌷', labelEl: 'Λουλούδι 1' },
      { step: 2, emoji: '🐝', labelEl: 'Πτήση Μέλισσας 2' },
      { step: 3, emoji: '🍯', labelEl: 'Κυψέλη 3' },
    ],
  },
  {
    titleEl: 'Άσκηση: Σπείρα Σαλιγκαριού & Κυκλικός Έλεγχος Δακτύλων',
    ergoPromptEl:
      'Κάνε έναν ήρεμο κύκλο στον αέρα με τον δείκτη σου και έπειτα άγγιξε με ακρίβεια τα 3 βήματα του σαλιγκαριού!',
    seatedPromptEl:
      'Καθιστός, σχημάτισε έναν μικρό κύκλο πάνω στο τραπέζι και πάτησε με τη σειρά τα 3 σημεία!',
    waypoints: [
      { step: 1, emoji: '🍃', labelEl: 'Φύλλο Εκκίνησης' },
      { step: 2, emoji: '🐌', labelEl: 'Καμπύλη Σπείρας' },
      { step: 3, emoji: '🍄', labelEl: 'Μανιτάρι Τερματισμού' },
    ],
  },
  {
    titleEl: 'Άσκηση: Βήματα Χελώνας & Ρύθμιση Ταχύτητας Δακτύλου',
    ergoPromptEl:
      'Κίνησε το δάχτυλό σου αργά και σταθερά σαν χελωνάκι, ακουμπώντας απαλά τα 3 βότσαλα της λίμνης!',
    seatedPromptEl:
      'Πάρε ήρεμη ανάσα στην καρέκλα και άγγιξε αργά τα 3 βότσαλα από αριστερά προς τα δεξιά!',
    waypoints: [
      { step: 1, emoji: '🪨', labelEl: 'Πρώτο Βότσαλο' },
      { step: 2, emoji: '🐢', labelEl: 'Δεύτερο Βότσαλο' },
      { step: 3, emoji: '🌿', labelEl: 'Όχθη Λίμνης' },
    ],
  },
  {
    titleEl: 'Άσκηση: Γέφυρα Τρένου & Ευθύγραμμη Οπτικοκινητική Πορεία',
    ergoPromptEl:
      'Τέντωσε καθαρά τον δείκτη σου και οδήγησε το τρενάκι πάνω στις ράγες από τον σταθμό 1 έως τον σταθμό 3!',
    seatedPromptEl:
      'Καθιστός με ίσια πλάτη, ένωσε ευθύγραμμα τα 3 σημεία της σιδηροδρομικής γραμμής!',
    waypoints: [
      { step: 1, emoji: '🚉', labelEl: 'Αφετηρία Τρένου' },
      { step: 2, emoji: '🚂', labelEl: 'Γέφυρα Διαδρομής' },
      { step: 3, emoji: '🏁', labelEl: 'Τελικός Σταθμός' },
    ],
  },
  {
    titleEl: 'Άσκηση: Κούμπωμα Αστερισμών & Λεπτή Σύλληψη Ακριβείας',
    ergoPromptEl:
      'Ένωσε απαλά αντίχειρα και μεσαίο δάχτυλο και φώτισε ένα-ένα τα 3 αστέρια της νύχτας!',
    seatedPromptEl:
      'Με ήρεμους ώμους στην καρέκλα, άγγιξε με ακρίβεια τα 3 αστέρια από αριστερά προς τα δεξιά!',
    waypoints: [
      { step: 1, emoji: '⭐', labelEl: 'Αστέρι Α' },
      { step: 2, emoji: '🪐', labelEl: 'Πλανήτης Β' },
      { step: 3, emoji: '🚀', labelEl: 'Σταθμός Γ' },
    ],
  },
];

export const Activity16ErgoFineMotor: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  seatedMode,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeExercises = useMemo(
    () => selectSessionRounds(EXERCISES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const exercise = activeExercises[(currentRound - 1) % activeExercises.length];
  const [tracedStep, setTracedStep] = useState<number>(0);
  const [isPointerDragging, setIsPointerDragging] = useState<boolean>(false);

  useEffect(() => {
    setTracedStep(hintLevel === 2 ? 2 : 0);
    setIsPointerDragging(false);
  }, [currentRound, hintLevel, sessionSeed]);

  const nextExpectedStep = tracedStep + 1;
  const tracePct = Math.min(
    100,
    Math.round((tracedStep / Math.max(1, exercise.waypoints.length)) * 100)
  );

  const handleWaypointTap = (stepNum: number) => {
    runDebounced(() => {
      if (stepNum <= tracedStep) return;
      if (stepNum === nextExpectedStep) {
        playCalmTone(
          stepNum >= exercise.waypoints.length ? 'complete' : 'soft-step',
          settings.soundEnabled
        );
        if (stepNum >= exercise.waypoints.length) {
          setTracedStep(0);
          setIsPointerDragging(false);
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
      <div
        className="p-6 rounded-3xl bg-white border-2 border-sand-dark space-y-4 select-none"
        onPointerUp={() => setIsPointerDragging(false)}
        onPointerLeave={() => setIsPointerDragging(false)}
      >
        <div className="max-w-md mx-auto space-y-1">
          <div className="flex justify-between text-xs font-extrabold text-sage-dark px-1">
            <span>✏️ Διαδρομή Ιχνηλάτησης (Αριστερά ➔ Δεξιά)</span>
            <span>{tracePct}%</span>
          </div>
          <div className="w-full h-3 bg-sand-light rounded-full overflow-hidden border border-sand-dark">
            <div
              className="h-full bg-sage transition-all duration-200"
              style={{ width: `${tracePct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {exercise.waypoints.map((wp) => {
            const isCompletedStep = wp.step <= tracedStep;
            const isNextStep = wp.step === nextExpectedStep;
            const highlight =
              (hintLevel >= 1 || ageBand === '4-5' || adaptiveProfile.autoHintBoost) && isNextStep;

            return (
              <button
                key={wp.step}
                type="button"
                data-testid={`fine-motor-waypoint-${wp.step}`}
                onClick={() => handleWaypointTap(wp.step)}
                onPointerDown={() => {
                  setIsPointerDragging(true);
                }}
                onPointerEnter={() => {
                  if (isPointerDragging && wp.step === nextExpectedStep) {
                    handleWaypointTap(wp.step);
                  }
                }}
                className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                  isCompletedStep
                    ? 'bg-sage text-white border-sage-dark'
                    : highlight
                    ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40 scale-105'
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
