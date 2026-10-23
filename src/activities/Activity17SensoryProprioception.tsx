import React, { useState, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';

interface ProprioceptiveExercise {
  emoji: string;
  titleEl: string;
  disciplineTagEl: string;
  standingInstructionEl: string;
  seatedInstructionEl: string;
}

const SENSORY_EXERCISES: ProprioceptiveExercise[] = [
  {
    emoji: '🐘👐',
    titleEl: '1. Ισομετρική Πίεση Παλαμών (Βαθιά Πίεση / Heavy Work)',
    disciplineTagEl: 'Εργοθεραπεία (Αισθητηριακή Ολοκλήρωση) & Φυσιατρική',
    standingInstructionEl:
      'Ένωσε τις παλάμες σου μπροστά στο στήθος και σπρώξε τις σταθερά μεταξύ τους για 3 ήρεμους ρυθμούς!',
    seatedInstructionEl:
      'Καθιστός με τα πέλματα σταθερά στο πάτωμα, ένωσε τις παλάμες και πίεσέ τις απαλά για 3 ρυθμούς!',
  },
  {
    emoji: '🪑💪',
    titleEl: '2. Εργονομική Ευθυγράμμιση Κορμού & Αποφόρτιση Ώμων',
    disciplineTagEl: 'Φυσιατρική Στάση Σώματος & Ιδιοδεκτικότητα Κορμού',
    standingInstructionEl:
      'Σήκωσε τους ώμους ψηλά προς τα αυτιά στην εισπνοή... και άφησέ τους να κατέβουν χαλαρά στην εκπνοή!',
    seatedInstructionEl:
      'Πιάσε τα πλαϊνά της καρέκλας, ίσιωσε την πλάτη σου και κατέβασε ήρεμα τους ώμους μακριά από τα αυτιά!',
  },
  {
    emoji: '🐢🧘',
    titleEl: '3. Σφιχτή Αγκαλιά Αρκούδας (Αυτορρύθμιση Βαθιάς Πίεσης)',
    disciplineTagEl: 'Εργοθεραπεία & Παιδοψυχιατρική Αποφόρτιση Διέγερσης',
    standingInstructionEl:
      'Σταύρωσε τα χέρια και αγκάλιασε σφιχτά τους ώμους σου δίνοντας σταθερή, ήρεμη πίεση στο σώμα!',
    seatedInstructionEl:
      'Καθιστός αναπαυτικά, αγκάλιασε τους ώμους σου και μέτρησε 3 ήρεμες εκπνοές!',
  },
];

export const Activity17SensoryProprioception: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  seatedMode,
  advanceRound,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const item = SENSORY_EXERCISES[(currentRound - 1) % SENSORY_EXERCISES.length];
  const [pulsesCompleted, setPulsesCompleted] = useState<number>(0);

  useEffect(() => {
    setPulsesCompleted(hintLevel === 2 ? 2 : 0);
  }, [currentRound, hintLevel]);

  const handleProprioceptivePulse = () => {
    runDebounced(() => {
      const next = pulsesCompleted + 1;
      if (next >= 3) {
        setPulsesCompleted(0);
        advanceRound(getAbsorbedCount());
      } else {
        setPulsesCompleted(next);
      }
    });
  };

  return (
    <div className="space-y-6 text-center max-w-2xl mx-auto" data-testid="activity-17-sensory-proprioception">
      <div className="p-6 rounded-3xl bg-slate-surface border-4 border-slate space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-extrabold text-slate-dark border border-slate">
          🧘 {item.disciplineTagEl}
        </span>
        <div className="text-6xl" aria-hidden="true">{item.emoji}</div>
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{item.titleEl}</h2>
        <p className="text-lg font-bold text-charcoal" data-testid="proprioception-instruction">
          {seatedMode ? item.seatedInstructionEl : item.standingInstructionEl}
        </p>
      </div>

      <button
        type="button"
        data-testid="proprioception-pulse-btn"
        onClick={handleProprioceptivePulse}
        className={`touch-target px-8 py-4 rounded-3xl border-4 font-extrabold text-xl inline-flex items-center gap-3 ${
          hintLevel >= 1
            ? 'bg-sage-dark text-white border-charcoal ring-4 ring-sage/40'
            : 'bg-sage text-white border-sage-dark hover:bg-sage-dark'
        }`}
      >
        <span aria-hidden="true">🌿</span>
        <span>Σταθερή Πίεση & Αναπνοή ({pulsesCompleted} / 3)</span>
      </button>
    </div>
  );
};
