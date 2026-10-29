import React, { useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { VoiceCoach } from '../components/VoiceCoach';
import { useApp } from '../context/AppContext';
import { TARGET_SOUNDS, articulationLadder } from '../data/speechTherapyContent';
import { useSpokenPrompt } from '../hooks/useSpokenPrompt';
import { speakGreek } from '../utils/soundAndSpeech';

/**
 * 22. Καθαρή Προφορά: «σκάλα» για έναν ήχο (μόνος → συλλαβές → λέξη αρχή → μέση → πρόταση).
 * Πρότυπο φωνής, το παιδί το λέει, ακούει τον εαυτό του, ο ενήλικας κρίνει.
 */
export const Activity22ClearSounds: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  hintLevel,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings, updateSettings } = useApp();
  const sound = TARGET_SOUNDS.find((s) => s.id === settings.articulationTarget) ?? TARGET_SOUNDS[0];
  const ladder = useMemo(() => articulationLadder(sound, ageBand, sessionSeed), [sound, ageBand, sessionSeed]);
  const round = ladder[(currentRound - 1) % ladder.length];
  const isolated = round.step === 'isolated';
  const model = isolated ? `${sound.syllables[0]}, ${sound.syllables[0]}, ${sound.syllables[0]}` : round.modelEl;

  useSpokenPrompt(`${round.stepLabelEl}. Άκου και πες το κι εσύ: ${model}`, {
    enabled: settings.voiceEnabled,
    rate: adaptiveProfile.speechRate * 0.92,
    resetKey: `${currentRound}-${sessionSeed}-${sound.id}`,
  });

  return (
    <div className="space-y-4 text-center max-w-2xl mx-auto" data-testid="activity-22-clear-sounds">
      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Ήχος-στόχος" data-testid="clear-sounds-picker">
        {TARGET_SOUNDS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === sound.id}
            data-testid={`clear-sound-${s.id}`}
            onClick={() => void updateSettings({ articulationTarget: s.id })}
            className={`min-w-[44px] h-11 px-2 rounded-xl border-2 text-lg font-extrabold ${
              s.id === sound.id ? 'bg-slate text-white border-slate-dark' : 'bg-white text-charcoal border-sand-dark'
            }`}
          >
            {s.letter}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-3xl bg-slate-surface border-4 border-slate space-y-2">
        <p className="text-xs font-extrabold text-slate-dark uppercase tracking-wide" data-testid="clear-sounds-step">
          Σκαλί {currentRound}: {round.stepLabelEl}
        </p>
        {round.emoji && <div className="text-6xl" aria-hidden="true">{round.emoji}</div>}
        <p className={`${isolated ? 'text-7xl' : round.step === 'phrase' ? 'text-2xl' : 'text-4xl'} font-extrabold text-charcoal`} data-testid="clear-sounds-display">
          {round.displayEl}
        </p>
        {isolated && <p className="text-lg font-bold text-charcoal-muted">Κράτα τον ήχο: {sound.isolatedEl}</p>}
        <button
          type="button"
          data-testid="clear-sounds-tip-btn"
          onClick={() => void speakGreek(sound.tipEl, true, adaptiveProfile.speechRate, { force: true })}
          className={`mt-1 px-3 py-1.5 rounded-xl border-2 text-sm font-bold ${hintLevel > 0 ? 'bg-sage-surface border-sage-dark' : 'bg-white border-slate'}`}
        >
          👅 Πού μπαίνει η γλώσσα;
        </button>
        {hintLevel > 0 && <p className="text-sm text-charcoal">{sound.tipEl}</p>}
      </div>

      <VoiceCoach
        modelText={model}
        resetKey={`${currentRound}-${sound.id}-${sessionSeed}`}
        rate={adaptiveProfile.speechRate * 0.9}
        target={{
          syllables: isolated ? undefined : round.expectedSyllables,
          sibilant: isolated && !!sound.sibilant,
        }}
        onRate={(r) => (r === 'clear' ? advanceRound() : triggerGentleFeedback('Σχεδόν! Άκου ξανά και δοκίμασε πάλι.'))}
      />
    </div>
  );
};

export default Activity22ClearSounds;
