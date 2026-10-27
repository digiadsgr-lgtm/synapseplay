import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { useSpokenPrompt } from '../hooks/useSpokenPrompt';
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
    titleEl: 'Οι Δυνατές Παλάμες',
    disciplineTagEl: 'Εργοθεραπεία (Αισθητηριακή Ολοκλήρωση Ayres) & Φυσιατρική',
    standingInstructionEl:
      'Ένωσε τις παλάμες σου μπροστά στο στήθος και πίεσέ τες σταθερά μεταξύ τους όσο μετράμε ως το 3!',
    seatedInstructionEl:
      'Κάθισε με τα πέλματα σταθερά στο πάτωμα, ένωσε τις παλάμες και πίεσέ τες απαλά όσο μετράμε ως το 3!',
  },
  {
    emoji: '🪑💪',
    titleEl: 'Ώμοι Πάνω, Ώμοι Κάτω',
    disciplineTagEl: 'Φυσιατρική Στάση Σώματος & Ιδιοδεκτικότητα Κορμού',
    standingInstructionEl:
      'Σήκωσε τους ώμους ψηλά προς τα αυτιά στην εισπνοή και άφησέ τους να κατέβουν χαλαρά στην εκπνοή!',
    seatedInstructionEl:
      'Πιάσε τα πλαϊνά της καρέκλας, ίσιωσε την πλάτη σου και κατέβασε ήρεμα τους ώμους μακριά από τα αυτιά!',
  },
  {
    emoji: '🐻🧘',
    titleEl: 'Σφιχτή Αγκαλιά Αρκούδας',
    disciplineTagEl: 'Εργοθεραπεία & Παιδοψυχιατρική Αποφόρτιση Διέγερσης',
    standingInstructionEl:
      'Σταύρωσε τα χέρια και αγκάλιασε σφιχτά τους ώμους σου δίνοντας σταθερή, ήρεμη πίεση στο σώμα!',
    seatedInstructionEl:
      'Κάθισε αναπαυτικά, αγκάλιασε τους ώμους σου και βγάλε αργά τον αέρα όσο μετράμε ως το 3!',
  },
  {
    emoji: '🌳🦶',
    titleEl: 'Ρίζες Δέντρου στο Πάτωμα',
    disciplineTagEl: 'Φυσιατρική & Εργοθεραπεία (Στασική Σταθερότητα)',
    standingInstructionEl:
      'Πίεσε σταθερά και τα δύο πέλματα στο πάτωμα σαν βαθιές ρίζες δέντρου και νιώσε τα πόδια σου δυνατά!',
    seatedInstructionEl:
      'Κάθισε με γωνία 90 μοιρών στα γόνατα και πίεσε σταθερά τα πέλματα στο πάτωμα όσο μετράμε ως το 3!',
  },
  {
    emoji: '🧱🤲',
    titleEl: 'Σπρώχνω τον Αόρατο Τοίχο',
    disciplineTagEl: 'Εργοθεραπεία (Ayres SI Heavy Work) & Φυσιατρική',
    standingInstructionEl:
      'Τέντωσε τα χέρια μπροστά (ή σε έναν αληθινό τοίχο) και σπρώξε σταθερά με ήρεμη εκπνοή!',
    seatedInstructionEl:
      'Ακούμπησε τις παλάμες πάνω στο τραπέζι και δώσε σταθερή, ήρεμη πίεση προς τα κάτω όσο μετράμε ως το 3!',
  },
  {
    emoji: '🦋🌬️',
    titleEl: 'Ανοίγω σαν Λουλούδι',
    disciplineTagEl: 'Εργοθεραπεία & Φυσιατρική',
    standingInstructionEl:
      'Άνοιξε τα χέρια στο πλάι παίρνοντας βαθιά εισπνοή από τη μύτη και ένωσέ τα μπροστά με αργή εκπνοή!',
    seatedInstructionEl:
      'Κάθισε με ίσιο κορμό, άνοιξε ελαφρά τους αγκώνες στην εισπνοή και χαλάρωσε στην εκπνοή!',
  },
  {
    emoji: '🍋✊',
    titleEl: 'Στύβω τα Αόρατα Λεμόνια',
    disciplineTagEl: 'Παιδοψυχολογία & Εργοθεραπεία (Μυϊκή Αποφόρτιση Άκρων Χειρών)',
    standingInstructionEl:
      'Σφίξε απαλά τις παλάμες σου σαν να στύβεις δύο λεμόνια στην εισπνοή και άνοιξε χαλαρά τα δάχτυλα στην εκπνοή!',
    seatedInstructionEl:
      'Κάθισε με τους πήχεις στο τραπέζι, σφίξε απαλά τις γροθιές σου και άφησέ τες να χαλαρώσουν τελείως!',
  },
  {
    emoji: '🪶🌬️',
    titleEl: 'Η Ανάσα του Φτερού',
    disciplineTagEl: 'Παιδοψυχιατρική & Λογοθεραπεία (Έλεγχος Αναπνευστικής Ροής)',
    standingInstructionEl:
      'Πάρε ήρεμη εισπνοή από τη μύτη και φύσηξε απαλά από το στόμα σαν να κρατάς ένα πούπουλο στον αέρα!',
    seatedInstructionEl:
      'Κάθισε με ίσια πλάτη, φύσηξε αργά και σταθερά μπροστά σου όσο μετράμε ως το 3!',
  },
  {
    emoji: '🏔️🦵',
    titleEl: 'Σταθερό Βουνό',
    disciplineTagEl: 'Φυσιατρική & Εργοθεραπεία (Κεντρική Σταθερότητα Κορμού)',
    standingInstructionEl:
      'Στάσου ίσια σαν ψηλό βουνό, σφίξε απαλά την κοιλιά και τα πόδια σου και κράτα σταθερή στάση!',
    seatedInstructionEl:
      'Από την καρέκλα, ακούμπησε τις παλάμες στους μηρούς σου και δώσε ήρεμη, σταθερή πίεση προς τα κάτω!',
  },
  {
    emoji: '🌊🫧',
    titleEl: 'Η Κοιλιά Μπαλόνι',
    disciplineTagEl: 'Παιδοψυχολογία & Παιδοψυχιατρική (Αυτόνομη Ρύθμιση)',
    standingInstructionEl:
      'Βάλε τις παλάμες στην κοιλιά σου: νιώσε τη να φουσκώνει απαλά σαν μπαλόνι στην εισπνοή και να ξεφουσκώνει στην εκπνοή!',
    seatedInstructionEl:
      'Κάθισε αναπαυτικά, ακούμπησε τις παλάμες στην κοιλιά και ανάπνευσε ήρεμα όσο μετράμε ως το 3!',
  },
  {
    emoji: '🦒✨',
    titleEl: 'Ψηλώνω σαν Κλωστή',
    disciplineTagEl: 'Φυσιατρική Εργονομία & Σωματική Επίγνωση',
    standingInstructionEl:
      'Φαντάσου μια αόρατη κλωστή στην κορυφή του κεφαλιού που σε ψηλώνει ήρεμα προς το ταβάνι με χαλαρούς ώμους!',
    seatedInstructionEl:
      'Κάθισε στην καρέκλα και μάκρυνε απαλά τον αυχένα σου προς τα πάνω κρατώντας το πηγούνι ελαφρά μέσα!',
  },
  {
    emoji: '🤲🪨',
    titleEl: 'Ζεστή Πέτρα στις Παλάμες',
    disciplineTagEl: 'Εργοθεραπεία (Αισθητηριακή Εστίαση & Γείωση)',
    standingInstructionEl:
      'Τρίψε απαλά τις δύο παλάμες μεταξύ τους μέχρι να ζεσταθούν και κράτησέ τες ενωμένες στο κέντρο του στήθους!',
    seatedInstructionEl:
      'Από την καρέκλα, τρίψε απαλά τις παλάμες σου και ακούμπησέ τες ζεστές και ήρεμες πάνω στο τραπέζι!',
  },
];

export const Activity17SensoryProprioception: React.FC<ActivityRunnerRenderProps> = ({
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
  const activeExercises = useMemo(
    () => selectSessionRounds(SENSORY_EXERCISES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const item = activeExercises[(currentRound - 1) % activeExercises.length];
  const [pulsesCompleted, setPulsesCompleted] = useState<number>(0);
  const advanceRef = useRef(advanceRound);
  advanceRef.current = advanceRound;
  const absorbedRef = useRef(getAbsorbedCount);
  absorbedRef.current = getAbsorbedCount;

  const activeInstructionEl = seatedMode ? item.seatedInstructionEl : item.standingInstructionEl;

  useEffect(() => {
    setPulsesCompleted(0);
  }, [currentRound, hintLevel, ageBand, sessionSeed]);

  // The count starts only AFTER the child has heard the whole instruction
  const heard = useSpokenPrompt(activeInstructionEl, {
    enabled: settings.voiceEnabled,
    rate: adaptiveProfile.speechRate,
    resetKey: `${currentRound}-${sessionSeed}`,
  });

  // Automatic Hands-Free Proprioceptive Metronome (ticks while child presses palms/feet)
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED' || !heard) return;
    const delayMs = 2000; // ~ one calm breath per count
    const timer = window.setTimeout(() => {
      const next = pulsesCompleted + 1;
      playCalmTone(next >= 3 ? 'complete' : 'soft-step', settings.soundEnabled);
      if (next === 1) speakGreek('Ένα', settings.voiceEnabled, adaptiveProfile.speechRate, { kind: 'count' });
      if (next === 2) speakGreek('Δύο', settings.voiceEnabled, adaptiveProfile.speechRate, { kind: 'count' });
      if (next >= 3) {
        speakGreek('Τρία!', settings.voiceEnabled, adaptiveProfile.speechRate, { kind: 'count', protect: true });
        setPulsesCompleted(0);
        advanceRef.current(absorbedRef.current());
      } else {
        setPulsesCompleted(next);
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [phase, heard, pulsesCompleted, currentRound, settings.soundEnabled, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const handleProprioceptivePulse = () => {
    runDebounced(() => {
      const next = pulsesCompleted + 1;
      playCalmTone(next >= 3 ? 'complete' : 'soft-step', settings.soundEnabled);
      if (next >= 3) {
        setPulsesCompleted(0);
        advanceRound(getAbsorbedCount());
      } else {
        setPulsesCompleted(next);
      }
    });
  };

  const holdPct = Math.min(100, Math.round((pulsesCompleted / 3) * 100));

  return (
    <div className="space-y-6 text-center max-w-2xl mx-auto" data-testid="activity-17-sensory-proprioception">
      <div
        onClick={handleProprioceptivePulse}
        className="p-6 rounded-3xl bg-slate-surface border-4 border-slate space-y-3 cursor-pointer"
      >
        <div className="text-6xl" aria-hidden="true">{item.emoji}</div>
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{item.titleEl}</h2>
        <p className="text-lg font-bold text-charcoal" data-testid="proprioception-instruction">
          {seatedMode ? item.seatedInstructionEl : item.standingInstructionEl}
        </p>
        <div className="max-w-xs mx-auto pt-2 space-y-1">
          <div className="flex justify-between text-xs font-extrabold text-slate-dark px-1">
            <span>⏱️ Σταθερή πίεση ({pulsesCompleted} / 3)</span>
            <span>{holdPct}%</span>
          </div>
          <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-dark">
            <div
              className="h-full bg-slate-dark transition-all duration-300"
              style={{ width: `${holdPct}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        data-testid="proprioception-pulse-btn"
        onClick={handleProprioceptivePulse}
        className={`touch-target px-8 py-4 rounded-3xl border-4 font-extrabold text-xl inline-flex items-center gap-3 ${
          hintLevel >= 1 || adaptiveProfile.autoHintBoost
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
