import React, { useEffect, useMemo, useState } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { VoiceCoach } from '../components/VoiceCoach';
import { useApp } from '../context/AppContext';
import { countGreekSyllables, dictionRounds } from '../data/speechTherapyContent';
import { useSpokenPrompt } from '../hooks/useSpokenPrompt';
import { playCalmTone } from '../utils/soundAndSpeech';

/**
 * 23. Θέατρο της Φωνής: ζέσταμα, γλωσσοδέτες αργά→γρήγορα, συναισθήματα, ένταση, ρυθμός συλλαβών.
 */
export const Activity23VoiceTheater: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const rounds = useMemo(() => dictionRounds(ageBand, sessionSeed), [ageBand, sessionSeed]);
  const round = rounds[(currentRound - 1) % rounds.length];
  const [step, setStep] = useState<number>(0);

  useEffect(() => setStep(0), [currentRound, sessionSeed]);

  useSpokenPrompt(`${round.titleEl}. ${round.promptEl}`, {
    enabled: settings.voiceEnabled,
    rate: adaptiveProfile.speechRate,
    resetKey: `${currentRound}-${sessionSeed}`,
  });

  const zone = round.volumeTargets?.[step];
  const plainLine = round.lineEl.replace(/-/g, '');

  return (
    <div className="space-y-4 text-center max-w-2xl mx-auto" data-testid="activity-23-voice-theater">
      <div className="p-6 rounded-3xl bg-sand-light border-4 border-terracotta space-y-3">
        <div className="text-5xl" aria-hidden="true">{round.emoji}</div>
        <h2 className="text-2xl font-extrabold text-charcoal">{round.titleEl}</h2>
        <p className="text-base font-bold text-charcoal-muted">{round.promptEl}</p>
        <p className="text-3xl font-extrabold text-charcoal leading-snug" data-testid="voice-theater-line">
          «{round.lineEl}»
        </p>
        <div className="flex flex-wrap justify-center gap-1.5" data-testid="voice-theater-steps">
          {round.stepsEl.map((s, i) => (
            <span
              key={s}
              className={`px-3 py-1.5 rounded-xl border-2 text-sm font-extrabold ${
                i === step ? 'bg-terracotta-dark text-white border-terracotta-dark' : i < step ? 'bg-sage-surface border-sage text-sage-dark' : 'bg-white border-sand-dark text-charcoal-muted'
              }`}
            >
              {i < step ? '✓ ' : ''}
              {s}
            </span>
          ))}
        </div>
      </div>

      <VoiceCoach
        modelText={plainLine}
        resetKey={`${currentRound}-${step}-${sessionSeed}`}
        rate={adaptiveProfile.speechRate * (round.kind === 'twister' ? 0.8 : 0.9)}
        target={{
          zone,
          syllables: round.kind === 'rhythm' ? countGreekSyllables(plainLine) : undefined,
        }}
        onRate={(r) => {
          if (r === 'almost') {
            triggerGentleFeedback('Σχεδόν! Πάρε μια ανάσα και ξανά.');
            return;
          }
          if (step + 1 < round.stepsEl.length) {
            playCalmTone('soft-step', settings.soundEnabled);
            setStep(step + 1);
          } else {
            advanceRound();
          }
        }}
      />
    </div>
  );
};

export default Activity23VoiceTheater;
