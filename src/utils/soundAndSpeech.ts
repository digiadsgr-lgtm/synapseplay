/**
 * Speech Synthesis & Gentle Audio Feedback Utilities
 * Strictly non-startling, calming frequencies.
 * Guarantees 100% Speech Synthesis Independence: if Web Speech or AudioContext fails,
 * the application continues smoothly with zero errors.
 */

export function speakGreek(text: string, enabled: boolean = true): void {
  if (!enabled || !text) return;
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'el-GR';
    utterance.rate = 0.92; // Calm, clear child-friendly pacing
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Silent fallback — visual pictograms are always shown alongside speech
  }
}

export function stopSpeaking(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore
  }
}

export type CalmToneType = 'chime' | 'soft-step' | 'gentle-nudge' | 'complete' | 'pulse';

export function playCalmTone(type: CalmToneType, enabled: boolean = true): void {
  if (!enabled) return;
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    if (type === 'chime') {
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.18); // C#5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'soft-step') {
      osc.frequency.setValueAtTime(392, now); // G4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'gentle-nudge') {
      // Non-punitive warm low marimba tone
      osc.frequency.setValueAtTime(293.66, now); // D4
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'pulse') {
      osc.frequency.setValueAtTime(329.63, now); // E4
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'complete') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.12);
      osc.frequency.setValueAtTime(659.25, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    }
  } catch {
    // AudioContext blocked or unsupported; continue silently
  }
}
