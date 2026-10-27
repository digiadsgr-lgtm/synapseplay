import { useEffect, useState } from 'react';
import { isSpeechGateInstant, speakGreek } from '../utils/soundAndSpeech';

/**
 * Speaks a round instruction and reports when the child has HEARD it.
 * Games use `heard` to start timers/streams/metronomes only after the instruction,
 * so nothing (a count, a stillness bar, a moving stream) races the voice.
 *
 * With the voice switched off, `heard` turns true after a short reading time.
 */
export function useSpokenPrompt(
  text: string,
  {
    enabled,
    rate,
    active = true,
    resetKey,
  }: { enabled: boolean; rate: number; active?: boolean; resetKey?: unknown }
): boolean {
  const instant = isSpeechGateInstant();
  const [heard, setHeard] = useState<boolean>(instant);

  useEffect(() => {
    if (!active) return;
    if (instant) {
      void speakGreek(text, enabled, rate);
      setHeard(true);
      return;
    }
    let alive = true;
    setHeard(false);
    speakGreek(text, enabled, rate).then(() => {
      if (alive) setHeard(true);
    });
    return () => {
      alive = false;
    };
  }, [text, enabled, rate, active, resetKey, instant]);

  return heard;
}
