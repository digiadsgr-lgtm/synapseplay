import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface AnimalPose {
  emoji: string;
  nameEl: string;
  standingPromptEl: string;
  seatedPromptEl: string;
}

const ANIMAL_POSES: AnimalPose[] = [
  {
    emoji: '🦩',
    nameEl: 'Ισορροπία Πελαργού',
    standingPromptEl: 'Στάσου όρθιος, άνοιξε τα χέρια σαν φτερά και σήκωσε ελαφρά το ένα πόδι για 3 δευτερόλεπτα!',
    seatedPromptEl: 'Καθιστός στην καρέκλα, άνοιξε πλατιά τα χέρια σαν φτερά πελαργού και κράτησέ τα σταθερά!',
  },
  {
    emoji: '🐻',
    nameEl: 'Αργά Βήματα Αρκούδας',
    standingPromptEl: 'Κάνε 3 αργά, ήρεμα και σταθερά βήματα στο δωμάτιο σαν μεγάλη ήρεμη αρκούδα!',
    seatedPromptEl: 'Καθιστός, ακούμπησε εναλλάξ αργά τις παλάμες σου στα γόνατα με σταθερό ρυθμό!',
  },
  {
    emoji: '🐢',
    nameEl: 'Καβούκι Χελώνας',
    standingPromptEl: 'Αγκάλιασε τους ώμους σου απαλά και πάρε μια βαθιά, ήρεμη ανάσα σαν χελωνάκι!',
    seatedPromptEl: 'Καθιστός, αγκάλιασε απαλά τους ώμους σου και βγάλε αργά τον αέρα!',
  },
  {
    emoji: '🦒',
    nameEl: 'Ψηλός Λαιμός Καμηλοπάρδαλης',
    standingPromptEl: 'Τέντωσε τα χέρια ψηλά προς τον ουρανό σαν καμηλοπάρδαλη που φτάνει τα φύλλα του δέντρου!',
    seatedPromptEl: 'Καθιστός με ίσια πλάτη, τέντωσε ήρεμα τα δύο χέρια ψηλά και μέτρησε 3 ανάσες!',
  },
  {
    emoji: '🦀',
    nameEl: 'Πλάγια Κίνηση Καβουριού',
    standingPromptEl: 'Λύγισε λίγο τα γόνατα, άνοιξε τους αγκώνες και κάνε 2 μικρά πλάγια βήματα με έλεγχο!',
    seatedPromptEl: 'Καθιστός, άνοιξε και κλείσε ρυθμικά τις παλάμες σαν δαγκάνες καβουριού 3 φορές!',
  },
  {
    emoji: '🦋',
    nameEl: 'Ήρεμα Φτερά Πεταλούδας',
    standingPromptEl: 'Ακούμπησε τα δάχτυλα στους ώμους και κάνε 3 αργούς κύκλους με τους αγκώνες σου!',
    seatedPromptEl: 'Καθιστός, κάνε 3 αργές, ήρεμες κινήσεις στους ώμους σαν φτερά πεταλούδας!',
  },
];

export const Activity10CopyAnimal: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  seatedMode,
  sessionSeed = 0,
  advanceRound,
}) => {
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activePoses = useMemo(
    () => selectSessionRounds(ANIMAL_POSES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const pose = activePoses[(currentRound - 1) % activePoses.length];
  const [countsDone, setCountsDone] = useState<number>(0);

  useEffect(() => {
    setCountsDone(hintLevel === 2 ? 2 : 0);
  }, [currentRound, hintLevel, sessionSeed]);

  const handleCountTap = () => {
    runDebounced(() => {
      const next = countsDone + 1;
      if (next >= 3) {
        setCountsDone(0);
        advanceRound(getAbsorbedCount());
      } else {
        setCountsDone(next);
      }
    });
  };

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" data-testid="activity-10-copy-animal">
      <div className="p-6 rounded-3xl bg-sage-surface border-4 border-sage space-y-3">
        <div className="text-6xl" aria-hidden="true">{pose.emoji}</div>
        <h2 className="text-2xl font-extrabold text-charcoal">{pose.nameEl}</h2>
        <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-extrabold text-slate-dark border border-slate">
          {seatedMode ? '🪑 Καθιστή Εκδοχή Ενεργή' : '🧍 Όρθια Εκδοχή Ενεργή'}
        </span>
        <p className="text-lg font-bold text-charcoal" data-testid="animal-pose-prompt">
          {seatedMode ? pose.seatedPromptEl : pose.standingPromptEl}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-charcoal-muted">
          Μέτρησε 3 ήρεμους ρυθμούς πατώντας το κουμπί:
        </p>
        <button
          type="button"
          data-testid="copy-animal-rhythm-btn"
          onClick={handleCountTap}
          className={`touch-target px-8 py-4 rounded-3xl border-4 font-extrabold text-xl inline-flex items-center gap-3 ${
            hintLevel >= 1
              ? 'bg-sage-dark text-white border-charcoal ring-4 ring-sage/40'
              : 'bg-sage text-white border-sage-dark hover:bg-sage-dark'
          }`}
        >
          <span aria-hidden="true">🌿</span>
          <span>Ήρεμος Ρυθμός ({countsDone} / 3)</span>
        </button>
      </div>
    </div>
  );
};
