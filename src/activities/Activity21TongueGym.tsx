import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useApp } from '../context/AppContext';
import { ORAL_MOTOR_EXERCISES, YOUNG } from '../data/speechTherapyContent';
import { useSpokenPrompt } from '../hooks/useSpokenPrompt';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';

/**
 * 21. Γυμναστική της Γλώσσας (στοματοκινητικές ασκήσεις, μπροστά σε καθρέφτη).
 * Η εφαρμογή δίνει ρυθμό και μετράει επαναλήψεις· δεν μπορεί να «δει» τη γλώσσα (αυτοαναφορά).
 */
export const Activity21TongueGym: React.FC<ActivityRunnerRenderProps> = ({
  phase,
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
}) => {
  const { settings } = useApp();
  const exercises = useMemo(
    () => selectSessionRounds(ORAL_MOTOR_EXERCISES, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
  );
  const ex = exercises[(currentRound - 1) % exercises.length];
  const target = YOUNG.has(ageBand) ? ex.reps[0] : ex.reps[1];
  const [count, setCount] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const countRef = useRef(0);

  useEffect(() => {
    setCount(0);
    countRef.current = 0;
    setRunning(false);
  }, [currentRound, sessionSeed]);

  const heard = useSpokenPrompt(`${ex.nameEl}. ${ex.promptEl}`, {
    enabled: settings.voiceEnabled,
    rate: adaptiveProfile.speechRate,
    resetKey: `${currentRound}-${sessionSeed}`,
  });

  // Ήρεμος ρυθμός: πιο αργός με «βοήθεια» και για τους μικρούς
  const beatMs = (ex.holdSeconds ? ex.holdSeconds * 1000 + 1200 : 1700) + (hintLevel > 0 || YOUNG.has(ageBand) ? 500 : 0);

  useEffect(() => {
    if (!running || phase === 'PAUSED' || phase === 'COMPLETED' || !heard) return;
    if (countRef.current >= target) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      countRef.current += 1;
      setCount(countRef.current);
      playCalmTone(countRef.current >= target ? 'complete' : 'soft-step', settings.soundEnabled);
      void speakGreek(
        countRef.current >= target ? 'Μπράβο! Τέλος!' : `${ex.beatEl}… ${countRef.current}`,
        settings.voiceEnabled,
        adaptiveProfile.speechRate,
        { kind: 'count' }
      );
    }, beatMs);
    return () => window.clearTimeout(timer);
  }, [running, count, phase, heard, target, beatMs, ex.beatEl, settings.soundEnabled, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const done = count >= target;

  return (
    <div className="space-y-5 text-center max-w-xl mx-auto" data-testid="activity-21-tongue-gym">
      <div className="p-6 rounded-3xl bg-terracotta-surface border-4 border-terracotta space-y-3">
        <div className="text-6xl" aria-hidden="true">{ex.emoji}</div>
        <h2 className="text-2xl font-extrabold text-charcoal" data-testid="tongue-gym-name">{ex.nameEl}</h2>
        <p className="text-lg font-bold text-charcoal">{ex.promptEl}</p>
        <p className="text-sm font-bold text-terracotta-dark">🪞 Κάν’ το μπροστά σε καθρέφτη, μαζί με τον μεγάλο!</p>
        <div className="flex justify-center gap-1.5 pt-1" aria-label={`${count} από ${target}`} data-testid="tongue-gym-count">
          {Array.from({ length: target }, (_, i) => (
            <span key={i} className={`w-5 h-5 rounded-full border-2 ${i < count ? 'bg-sage-dark border-sage-dark' : 'bg-white border-sand-dark'}`} />
          ))}
        </div>
      </div>
      {done ? (
        <button
          type="button"
          data-testid="tongue-gym-next-btn"
          onClick={() => advanceRound()}
          className="touch-target px-8 py-4 rounded-3xl bg-sage-dark text-white font-extrabold text-xl"
        >
          ✅ Τα κατάφερα!
        </button>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            data-testid="tongue-gym-start-btn"
            disabled={running}
            onClick={() => setRunning(true)}
            className="touch-target px-7 py-4 rounded-3xl bg-terracotta-dark text-white font-extrabold text-xl disabled:opacity-60"
          >
            {running ? `⏱️ ${count} / ${target}` : count > 0 ? '▶️ Συνέχεια' : '▶️ Ξεκινάμε!'}
          </button>
          <button
            type="button"
            data-testid="tongue-gym-tap-btn"
            onClick={() => {
              countRef.current = Math.min(target, countRef.current + 1);
              setCount(countRef.current);
              playCalmTone(countRef.current >= target ? 'complete' : 'soft-step', settings.soundEnabled);
            }}
            className="touch-target px-5 py-4 rounded-3xl bg-white border-2 border-terracotta text-charcoal font-extrabold"
          >
            👆 Έκανα μία
          </button>
        </div>
      )}
    </div>
  );
};

export default Activity21TongueGym;
