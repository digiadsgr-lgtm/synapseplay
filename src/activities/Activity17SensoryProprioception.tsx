import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

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
    titleEl: 'Ισομετρική Πίεση Παλαμών (Βαθιά Πίεση / Heavy Work)',
    disciplineTagEl: 'Εργοθεραπεία (Αισθητηριακή Ολοκλήρωση Ayres) & Φυσιατρική',
    standingInstructionEl:
      'Ένωσε τις παλάμες σου μπροστά στο στήθος και σπρώξε τις σταθερά μεταξύ τους για 3 ήρεμους ρυθμούς!',
    seatedInstructionEl:
      'Καθιστός με τα πέλματα σταθερά στο πάτωμα, ένωσε τις παλάμες και πίεσέ τις απαλά για 3 ρυθμούς!',
  },
  {
    emoji: '🪑💪',
    titleEl: 'Εργονομική Ευθυγράμμιση Κορμού & Αποφόρτιση Ώμων',
    disciplineTagEl: 'Φυσιατρική Στάση Σώματος & Ιδιοδεκτικότητα Κορμού',
    standingInstructionEl:
      'Σήκωσε τους ώμους ψηλά προς τα αυτιά στην εισπνοή, και άφησέ τους να κατέβουν χαλαρά στην εκπνοή!',
    seatedInstructionEl:
      'Πιάσε τα πλαϊνά της καρέκλας, ίσιωσε την πλάτη σου και κατέβασε ήρεμα τους ώμους μακριά από τα αυτιά!',
  },
  {
    emoji: '🐢🧘',
    titleEl: 'Σφιχτή Αγκαλιά Αρκούδας (Αυτορρύθμιση Βαθιάς Πίεσης)',
    disciplineTagEl: 'Εργοθεραπεία & Παιδοψυχιατρική Αποφόρτιση Διέγερσης',
    standingInstructionEl:
      'Σταύρωσε τα χέρια και αγκάλιασε σφιχτά τους ώμους σου δίνοντας σταθερή, ήρεμη πίεση στο σώμα!',
    seatedInstructionEl:
      'Καθιστός αναπαυτικά, αγκάλιασε τους ώμους σου και μέτρησε 3 ήρεμες εκπνοές!',
  },
  {
    emoji: '🌳🦶',
    titleEl: 'Ρίζες Δέντρου στο Πάτωμα (Ιδιοδεκτική Γείωση Κάτω Άκρων)',
    disciplineTagEl: 'Φυσιατρική & Εργοθεραπεία (Στασική Σταθερότητα)',
    standingInstructionEl:
      'Πίεσε σταθερά και τα δύο πέλματα στο πάτωμα σαν βαθιές ρίζες δέντρου και νιώσε τα πόδια σου δυνατά!',
    seatedInstructionEl:
      'Καθιστός με γωνία 90 μοιρών στα γόνατα, πίεσε σταθερά τα πέλματα στο πάτωμα για 3 ήρεμους ρυθμούς!',
  },
  {
    emoji: '🧱🤲',
    titleEl: 'Σπρώχνω τον Αόρατο Τοίχο (Ισομετρική Ενδυνάμωση Άνω Άκρων)',
    disciplineTagEl: 'Εργοθεραπεία (Ayres SI Heavy Work) & Φυσιατρική',
    standingInstructionEl:
      'Τέντωσε τα χέρια μπροστά (ή σε έναν αληθινό τοίχο) και σπρώξε σταθερά με ήρεμη εκπνοή!',
    seatedInstructionEl:
      'Ακούμπησε τις παλάμες πάνω στο τραπέζι και δώσε σταθερή, ήρεμη πίεση προς τα κάτω για 3 ρυθμούς!',
  },
  {
    emoji: '🦋🌬️',
    titleEl: 'Διάταση Θώρακα & Αναπνοή Πνευμονογαστρικής Ηρεμίας',
    disciplineTagEl: 'Παιδοψυχιατρική (Polyvagal Regulation) & Φυσιατρική',
    standingInstructionEl:
      'Άνοιξε τα χέρια στο πλάι παίρνοντας βαθιά εισπνοή από τη μύτη και ένωσέ τα μπροστά με αργή εκπνοή!',
    seatedInstructionEl:
      'Καθιστός με ίσιο κορμό, άνοιξε ελαφρά τους αγκώνες στην εισπνοή και χαλάρωσε στην εκπνοή!',
  },
];

export const Activity17SensoryProprioception: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  seatedMode,
  sessionSeed = 0,
  advanceRound,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeExercises = useMemo(
    () => selectSessionRounds(SENSORY_EXERCISES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const item = activeExercises[(currentRound - 1) % activeExercises.length];
  const [pulsesCompleted, setPulsesCompleted] = useState<number>(0);

  useEffect(() => {
    setPulsesCompleted(hintLevel === 2 ? 2 : 0);
  }, [currentRound, hintLevel, sessionSeed]);

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
