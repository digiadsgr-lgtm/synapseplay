import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
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
  {
    emoji: '🐘',
    nameEl: 'Σταθερά Βήματα Ελέφαντα',
    standingPromptEl: 'Πίεσε εναλλάξ δυνατά τα πέλματά σου στο πάτωμα σαν ήρεμος, δυνατός ελέφαντας!',
    seatedPromptEl: 'Καθιστός, πίεσε σταθερά και τα δύο πέλματα στο πάτωμα μετρώντας 3 ήρεμες ανάσες!',
  },
  {
    emoji: '🐱',
    nameEl: 'Τέντωμα Ήρεμης Γάτας',
    standingPromptEl: 'Τέντωσε απαλά τα χέρια μπροστά και καμάρωσε την πλάτη σου σαν γατούλα που ξυπνάει!',
    seatedPromptEl: 'Καθιστός, πλέξε τα δάχτυλα και τέντωσε τις παλάμες μπροστά με βαθιά εκπνοή!',
  },
  {
    emoji: '🦅',
    nameEl: 'Άνοιγμα Φτερών Αετού',
    standingPromptEl: 'Άνοιξε αργά τα χέρια στο πλάι στο ύψος των ώμων και κράτα ισορροπία με ίσια πλάτη!',
    seatedPromptEl: 'Καθιστός, άνοιξε πλατιά τα χέρια στο πλάι και νιώσε το στήθος σου να ανοίγει ήρεμα!',
  },
  {
    emoji: '🐸',
    nameEl: 'Κάθισμα Ισορροπίας Βατράχου',
    standingPromptEl: 'Λύγισε απαλά τα γόνατα, ακούμπησε τα χέρια στη μέση και κράτα σταθερή ισορροπία!',
    seatedPromptEl: 'Καθιστός, σήκωσε ελαφρά τις φτέρνες πατώντας στις μύτες των ποδιών για 3 χρόνους!',
  },
  {
    emoji: '🦢',
    nameEl: 'Αρχοντικός Κύκνος στη Λίμνη',
    standingPromptEl: 'Σήκωσε ψηλά το πηγούνι, κατέβασε τους ώμους και ένωσε τις παλάμες μπροστά στο στήθος!',
    seatedPromptEl: 'Καθιστός, ένωσε τις παλάμες μπροστά στο στήθος και μάκρυνε τον λαιμό σου ήρεμα!',
  },
  {
    emoji: '🐨',
    nameEl: 'Σφιχτή Αγκαλιά Κοάλα',
    standingPromptEl: 'Σταύρωσε τα χέρια και δώσε στον εαυτό σου μια σφιχτή, ζεστή αγκαλιά σαν κοάλα στο δέντρο!',
    seatedPromptEl: 'Καθιστός, αγκάλιασε σφιχτά τον κορμό σου και νιώσε τους ώμους σου να χαλαρώνουν!',
  },
];

export const Activity10CopyAnimal: React.FC<ActivityRunnerRenderProps> = ({
  phase,
  currentRound,
  totalRounds,
  hintLevel,
  seatedMode,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activePoses = useMemo(
    () => selectSessionRounds(ANIMAL_POSES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const pose = activePoses[(currentRound - 1) % activePoses.length];
  const [countsDone, setCountsDone] = useState<number>(0);
  const advanceRef = useRef(advanceRound);
  advanceRef.current = advanceRound;
  const absorbedRef = useRef(getAbsorbedCount);
  absorbedRef.current = getAbsorbedCount;

  useEffect(() => {
    setCountsDone(hintLevel === 2 || ageBand === '4-5' ? 2 : 0);
  }, [currentRound, hintLevel, ageBand, sessionSeed]);

  // Automatic Hands-Free Rhythm Metronome (ticks every 1800ms while child holds the physical animal pose)
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED') return;
    const timer = window.setTimeout(() => {
      const next = countsDone + 1;
      playCalmTone(next >= 3 ? 'complete' : 'soft-step', settings.soundEnabled);
      if (next === 1) speakGreek('Ένα', settings.voiceEnabled, adaptiveProfile.speechRate);
      if (next === 2) speakGreek('Δύο', settings.voiceEnabled, adaptiveProfile.speechRate);
      if (next >= 3) {
        speakGreek('Τρία! Μπράβο!', settings.voiceEnabled, adaptiveProfile.speechRate);
        setCountsDone(0);
        advanceRef.current(absorbedRef.current());
      } else {
        setCountsDone(next);
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [phase, countsDone, currentRound, settings.soundEnabled, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const handleCountTap = () => {
    runDebounced(() => {
      const next = countsDone + 1;
      playCalmTone(next >= 3 ? 'complete' : 'soft-step', settings.soundEnabled);
      if (next >= 3) {
        setCountsDone(0);
        advanceRound(getAbsorbedCount());
      } else {
        setCountsDone(next);
      }
    });
  };

  const holdPct = Math.min(100, Math.round((countsDone / 3) * 100));

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" data-testid="activity-10-copy-animal">
      <div
        onClick={handleCountTap}
        className="p-6 rounded-3xl bg-sage-surface border-4 border-sage space-y-3 cursor-pointer"
      >
        <div className="text-6xl" aria-hidden="true">{pose.emoji}</div>
        <h2 className="text-2xl font-extrabold text-charcoal">{pose.nameEl}</h2>
        <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-extrabold text-slate-dark border border-slate">
          {seatedMode ? '🪑 Καθιστή Εκδοχή Ενεργή' : '🧍 Όρθια Εκδοχή Ενεργή'}
        </span>
        <p className="text-lg font-bold text-charcoal" data-testid="animal-pose-prompt">
          {seatedMode ? pose.seatedPromptEl : pose.standingPromptEl}
        </p>
        <div className="max-w-xs mx-auto pt-2 space-y-1">
          <div className="flex justify-between text-xs font-extrabold text-sage-dark px-1">
            <span>⏱️ Κράτα τη στάση ({countsDone} / 3)</span>
            <span>{holdPct}%</span>
          </div>
          <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-sage-dark">
            <div
              className="h-full bg-sage-dark transition-all duration-300"
              style={{ width: `${holdPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-charcoal-muted">
          Κράτα τη στάση (μετράει αυτόματα) ή πάτησε το κουμπί:
        </p>
        <button
          type="button"
          data-testid="copy-animal-rhythm-btn"
          onClick={handleCountTap}
          className={`touch-target px-8 py-4 rounded-3xl border-4 font-extrabold text-xl inline-flex items-center gap-3 ${
            hintLevel >= 1 || adaptiveProfile.autoHintBoost
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
