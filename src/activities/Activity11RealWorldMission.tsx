import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface MissionConfig {
  titleEl: string;
  steps: Array<{ emoji: string; textEl: string }>;
}

const MISSIONS: MissionConfig[] = [
  {
    titleEl: 'Αποστολή: Το Κουτάλι & το Μολύβι',
    steps: [
      { emoji: '🥄', textEl: 'Βρες ένα κουτάλι ή ένα ασφαλές αντικείμενο στο δωμάτιο.' },
      { emoji: '✏️', textEl: 'Ακούμπησέ το ήρεμα δίπλα σε ένα μολύβι ή έναν μαρκαδόρο.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Το Βιβλίο στο Τραπέζι',
    steps: [
      { emoji: '📗', textEl: 'Διάλεξε ένα αγαπημένο σου παραμύθι ή τετράδιο.' },
      { emoji: '🪑', textEl: 'Βάλ’ το τακτοποιημένα στη γωνία του τραπεζιού.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Το Μαξιλάρι της Ηρεμίας',
    steps: [
      { emoji: '🛋️', textEl: 'Φτιάξε όμορφα ένα μαξιλάρι στον καναπέ ή στο κρεβάτι.' },
      { emoji: '🌬️', textEl: 'Κάθισε αναπαυτικά και πάρε μία βαθιά ανάσα!' },
    ],
  },
  {
    titleEl: 'Αποστολή: Τα Δύο Παπούτσια στη Σειρά',
    steps: [
      { emoji: '👟', textEl: 'Βρες ένα ζευγάρι παπούτσια ή παντόφλες στο δωμάτιο.' },
      { emoji: '✨', textEl: 'Βάλ’ τα δίπλα-δίπλα τακτοποιημένα κοντά στην πόρτα.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Το Ποτήρι με το Νερό',
    steps: [
      { emoji: '💧', textEl: 'Πήγαινε ήρεμα στην κουζίνα και πιες δύο γουλιές δροσερό νερό.' },
      { emoji: '🤲', textEl: 'Ακούμπησε το ποτήρι προσεκτικά πάνω στον πάγκο.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Ταξινομώ 3 Μικρά Παιχνίδια',
    steps: [
      { emoji: '🧸', textEl: 'Διάλεξε 3 μικρά παιχνίδια ή τουβλάκια από το πάτωμα.' },
      { emoji: '📦', textEl: 'Τοποθέτησέ τα με τη σειρά μέσα στο κουτί ή στο ράφι τους.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Η Κασετίνα της Τάξης',
    steps: [
      { emoji: '🖍️', textEl: 'Βρες 2 μολύβια ή μαρκαδόρους που βρίσκονται έξω από την κασετίνα.' },
      { emoji: '🎒', textEl: 'Βάλ’ τα μέσα στην κασετίνα και κλείσε ήρεμα το φερμουάρ.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Η Καρέκλα στη Θέση της',
    steps: [
      { emoji: '🪑', textEl: 'Πιάσε με τα δύο χέρια την καρέκλα του γραφείου ή του τραπεζιού.' },
      { emoji: '🤫', textEl: 'Σπρώξ’ την απαλά στη θέση της χωρίς να κάνει θόρυβο στο πάτωμα.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Εξερευνητής Υφών στο Δωμάτιο',
    steps: [
      { emoji: '🧶', textEl: 'Ακούμπησε ένα μαλακό αντικείμενο στο δωμάτιο (π.χ. ύφασμα ή λούτρινο).' },
      { emoji: '🪵', textEl: 'Ακούμπησε ένα λείο, σταθερό αντικείμενο (π.χ. ξύλινο τραπέζι ή βιβλίο).' },
    ],
  },
  {
    titleEl: 'Αποστολή: Η Γωνιά της Ανακύκλωσης',
    steps: [
      { emoji: '📄', textEl: 'Βρες ένα πρόχειρο χαρτάκι ή περιτύλιγμα που δεν χρειάζεσαι πια.' },
      { emoji: '♻️', textEl: 'Ρίξ’ το προσεκτικά στον κάδο ανακύκλωσης ή απορριμμάτων.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Το Φυτό του Σπιτιού',
    steps: [
      { emoji: '🪴', textEl: 'Πήγαινε κοντά σε μια γλάστρα ή ένα λουλούδι του σπιτιού.' },
      { emoji: '👀', textEl: 'Παρατήρησε από κοντά τα φύλλα του χωρίς να τα τραβήξεις.' },
    ],
  },
  {
    titleEl: 'Αποστολή: Το Ρούχο στην Κρεμάστρα',
    steps: [
      { emoji: '🧥', textEl: 'Πάρε τη ζακέτα ή το μπουφάν σου με τα δύο χέρια.' },
      { emoji: '✨', textEl: 'Κρέμασέ το τακτοποιημένα στην κρεμάστρα ή δίπλωσέ το στην καρέκλα.' },
    ],
  },
];

export const Activity11RealWorldMission: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const activeMissions = useMemo(
    () => selectSessionRounds(MISSIONS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const mission = activeMissions[(currentRound - 1) % activeMissions.length];
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([false, false]);

  useEffect(() => {
    setCheckedSteps([false, false]);
    speakGreek(
      `${mission.titleEl}. Βήμα 1: ${mission.steps[0].textEl}`,
      settings.voiceEnabled,
      adaptiveProfile.speechRate
    );
  }, [currentRound, sessionSeed, mission.titleEl, mission.steps, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const toggleStep = (index: number) => {
    runDebounced(() => {
      const next = [...checkedSteps];
      next[index] = !next[index];
      setCheckedSteps(next);
      if (next[index]) {
        playCalmTone('soft-step', settings.soundEnabled);
        speakGreek(mission.steps[index].textEl, settings.voiceEnabled, adaptiveProfile.speechRate);
      }
    });
  };

  const allChecked = checkedSteps.every(Boolean) || hintLevel === 2;

  const handleCompleteMission = () => {
    runDebounced(() => {
      playCalmTone('complete', settings.soundEnabled);
      advanceRound(getAbsorbedCount());
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" data-testid="activity-11-real-world-mission">
      <div className="p-5 rounded-3xl bg-sage-surface border-2 border-sage text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">{mission.titleEl}</h2>
        <p className="text-sm font-bold text-charcoal-muted">
          {allChecked
            ? '✅ Όλα τα βήματα ολοκληρώθηκαν! Πάτησε το κουμπί «Ολοκλήρωσα την Αποστολή!» κάτω!'
            : '👉 Πάτησε πρώτα τα 2 βήματα (1 & 2) καθώς τα κάνεις στον χώρο και μετά το κουμπί ολοκλήρωσης!'}
        </p>
      </div>

      <div className="space-y-4">
        {mission.steps.map((step, idx) => {
          const isDone = checkedSteps[idx];
          const isNextHint =
            (hintLevel >= 1 || ageBand === '4-5' || adaptiveProfile.autoHintBoost) &&
            !isDone &&
            (idx === 0 || checkedSteps[0]);
          return (
            <button
              key={step.textEl}
              type="button"
              data-testid={`mission-step-check-${idx}`}
              onClick={() => toggleStep(idx)}
              aria-pressed={isDone}
              className={`touch-target w-full p-5 rounded-2xl border-2 text-left flex items-center justify-between gap-4 transition-colors ${
                isDone
                  ? 'bg-sage text-white border-sage-dark'
                  : isNextHint
                  ? 'bg-white border-4 border-terracotta ring-4 ring-terracotta/30 text-charcoal'
                  : 'bg-white border-sand-dark text-charcoal hover:border-slate'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl" aria-hidden="true">{step.emoji}</span>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                    Βήμα {idx + 1}
                  </span>
                  <p className="text-lg font-bold">{step.textEl}</p>
                </div>
              </div>
              <span className="text-3xl font-extrabold" aria-hidden="true">
                {isDone ? '☑️' : '⬜'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          data-testid="mission-complete-btn"
          disabled={!allChecked}
          onClick={handleCompleteMission}
          className="touch-target px-8 py-4 rounded-3xl bg-sage-dark text-white font-extrabold text-xl inline-flex items-center gap-3 hover:bg-sage disabled:opacity-40"
        >
          <span aria-hidden="true">🌟</span>
          <span>Ολοκλήρωσα την Αποστολή!</span>
        </button>
      </div>
    </div>
  );
};
