import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
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
  {
    emoji: '🍋✊',
    titleEl: 'Στύβω τα Αόρατα Λεμόνια (Προοδευτική Μυϊκή Χαλάρωση Jacobson)',
    disciplineTagEl: 'Παιδοψυχολογία & Εργοθεραπεία (Μυϊκή Αποφόρτιση Άκρων Χειρών)',
    standingInstructionEl:
      'Σφίξε απαλά τις παλάμες σου σαν να στύβεις δύο λεμόνια στην εισπνοή και άνοιξε χαλαρά τα δάχτυλα στην εκπνοή!',
    seatedInstructionEl:
      'Καθιστός με τους πήχεις στο τραπέζι, σφίξε απαλά τις γροθιές σου και άφησέ τες να χαλαρώσουν τελείως!',
  },
  {
    emoji: '🪶🌬️',
    titleEl: 'Αναπνοή του Φτερού (Παρατεταμένη Εκπνοή Ηρεμίας)',
    disciplineTagEl: 'Παιδοψυχιατρική & Λογοθεραπεία (Έλεγχος Αναπνευστικής Ροής)',
    standingInstructionEl:
      'Πάρε ήρεμη εισπνοή από τη μύτη και φύσηξε απαλά από το στόμα σαν να κρατάς ένα πούπουλο στον αέρα!',
    seatedInstructionEl:
      'Καθιστός με ίσια πλάτη, φύσηξε αργά και σταθερά μπροστά σου για 3 ήρεμους χρόνους!',
  },
  {
    emoji: '🏔️🦵',
    titleEl: 'Σταθερό Βουνό (Ισομετρική Ενεργοποίηση Τετρακεφάλων & Κορμού)',
    disciplineTagEl: 'Φυσιατρική & Εργοθεραπεία (Κεντρική Σταθερότητα Κορμού)',
    standingInstructionEl:
      'Στάσου ίσια σαν ψηλό βουνό, σφίξε απαλά την κοιλιά και τα πόδια σου και κράτα σταθερή στάση!',
    seatedInstructionEl:
      'Καθιστός, ακούμπησε τις παλάμες στους μηρούς σου και δώσε ήρεμη, σταθερή πίεση προς τα κάτω!',
  },
  {
    emoji: '🌊🫧',
    titleEl: 'Αναπνοή της Κοιλιάς (Διαφραγματικός Ρυθμός)',
    disciplineTagEl: 'Παιδοψυχολογία & Παιδοψυχιατρική (Αυτόνομη Ρύθμιση)',
    standingInstructionEl:
      'Βάλε τις παλάμες στην κοιλιά σου: νιώσε την να φουσκώνει απαλά σαν μπαλόνι στην εισπνοή και να ξεφουσκώνει στην εκπνοή!',
    seatedInstructionEl:
      'Καθιστός αναπαυτικά, ακούμπησε τις παλάμες στην κοιλιά και μέτρησε 3 ήρεμες διαφραγματικές ανάσες!',
  },
  {
    emoji: '🦒✨',
    titleEl: 'Επιμήκυνση Σπονδυλικής Στήλης (Αυχενική & Θωρακική Ευθυγράμμιση)',
    disciplineTagEl: 'Φυσιατρική Εργονομία & Σωματική Επίγνωση',
    standingInstructionEl:
      'Φαντάσου μια αόρατη κλωστή στην κορυφή του κεφαλιού που σε ψηλώνει ήρεμα προς το ταβάνι με χαλαρούς ώμους!',
    seatedInstructionEl:
      'Καθιστός στην καρέκλα, μάκρυνε απαλά τον αυχένα σου προς τα πάνω κρατώντας το πηγούνι ελαφρά μέσα!',
  },
  {
    emoji: '🤲🪨',
    titleEl: 'Ζεστή Πέτρα στις Παλάμες (Απτική & Ιδιοδεκτική Συγκέντρωση)',
    disciplineTagEl: 'Εργοθεραπεία (Αισθητηριακή Εστίαση & Γείωση)',
    standingInstructionEl:
      'Τρίψε απαλά τις δύο παλάμες μεταξύ τους μέχρι να ζεσταθούν και κράτησέ τες ενωμένες στο κέντρο του στήθους!',
    seatedInstructionEl:
      'Καθιστός, τρίψε απαλά τις παλάμες σου και ακούμπησέ τες ζεστές και ήρεμες πάνω στο τραπέζι!',
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

  useEffect(() => {
    setPulsesCompleted(hintLevel === 2 || ageBand === '4-5' ? 2 : 0);
  }, [currentRound, hintLevel, ageBand, sessionSeed]);

  // Automatic Hands-Free Proprioceptive Metronome (ticks every 1800ms while child presses palms/feet)
  useEffect(() => {
    if (phase === 'PAUSED' || phase === 'COMPLETED') return;
    const timer = window.setTimeout(() => {
      setPulsesCompleted((prev) => {
        const next = prev + 1;
        playCalmTone(next >= 3 ? 'complete' : 'soft-step', settings.soundEnabled);
        if (next === 1) speakGreek('Ένα', settings.voiceEnabled, adaptiveProfile.speechRate);
        if (next === 2) speakGreek('Δύο', settings.voiceEnabled, adaptiveProfile.speechRate);
        if (next >= 3) {
          speakGreek('Τρία! Μπράβο!', settings.voiceEnabled, adaptiveProfile.speechRate);
          advanceRef.current(absorbedRef.current());
          return 0;
        }
        return next;
      });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [phase, pulsesCompleted, currentRound, settings.soundEnabled, settings.voiceEnabled, adaptiveProfile.speechRate]);

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
        <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-extrabold text-slate-dark border border-slate">
          🧘 {item.disciplineTagEl}
        </span>
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
