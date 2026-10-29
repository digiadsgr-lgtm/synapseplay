import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { analyzeTake, feedbackFor, levelZone, type VoiceFrame } from '../utils/voiceAnalysis';
import {
  TARGET_SOUNDS,
  articulationLadder,
  countGreekSyllables,
  dictionRounds,
  ORAL_MOTOR_EXERCISES,
} from '../data/speechTherapyContent';
import { getActivityById } from '../data/activitiesCatalog';
import { SELF_REPORT_ACTIVITY_IDS } from '../utils/childProfileLearningEngine';

/** Συνθετικά καρέ: «συλλαβές» = εκρήξεις έντασης με σιωπή ανάμεσα. */
function bursts(n: number, opts: { amp?: number; hf?: number; gapMs?: number; burstMs?: number } = {}): VoiceFrame[] {
  const { amp = 0.12, hf = 0.1, gapMs = 150, burstMs = 180 } = opts;
  const frames: VoiceFrame[] = [];
  let t = 0;
  const push = (rms: number, h: number) => {
    frames.push({ t, rms, hf: h });
    t += 30;
  };
  for (let i = 0; i < 8; i++) push(0.002, 0.05);
  for (let b = 0; b < n; b++) {
    const k = Math.round(burstMs / 30);
    for (let i = 0; i < k; i++) push(amp * Math.sin(((i + 0.5) / k) * Math.PI), hf);
    for (let i = 0; i < Math.round(gapMs / 30); i++) push(0.002, 0.05);
  }
  return frames;
}

describe('«Άκου με»: ενδείξεις στη συσκευή', () => {
  it('σιωπή = δεν ακούστηκε· εκρήξεις = σωστό πλήθος συλλαβών', () => {
    expect(analyzeTake(bursts(0)).heard).toBe(false);
    for (const n of [2, 3, 5]) {
      const a = analyzeTake(bursts(n));
      expect(a.heard).toBe(true);
      expect(a.syllables).toBe(n);
    }
  });

  it('ζώνες έντασης και ένδειξη «σφυρίγματος»', () => {
    expect(levelZone(-60)).toBe('silent');
    expect(levelZone(-40)).toBe('quiet');
    expect(levelZone(-25)).toBe('normal');
    expect(levelZone(-10)).toBe('stage');
    const hiss = analyzeTake(bursts(1, { burstMs: 900, hf: 0.6 }));
    expect(feedbackFor(hiss, { sibilant: true }).ok).toBe(true);
    const soft = analyzeTake(bursts(1, { burstMs: 900, hf: 0.1 }));
    const fb = feedbackFor(soft, { sibilant: true });
    expect(fb.ok).toBe(false);
    expect(fb.lines.join(' ')).toMatch(/δόντια πιο κοντά/);
  });

  it('τα μηνύματα είναι ενθαρρυντικά, χωρίς «λάθος»', () => {
    const msgs = [
      ...feedbackFor(analyzeTake(bursts(0)), {}).lines,
      ...feedbackFor(analyzeTake(bursts(2)), { syllables: 5 }).lines,
      ...feedbackFor(analyzeTake(bursts(2, { amp: 0.004 })), { zone: 'stage' }).lines,
    ].join(' ');
    expect(msgs).not.toMatch(/λάθος|λανθασμ/i);
  });
});

describe('Περιεχόμενο λογοθεραπείας', () => {
  it('κάθε λέξη της σκάλας περιέχει τον ήχο-στόχο', () => {
    const letters: Record<string, RegExp> = {
      s: /σ|ς/, r: /ρ/, l: /λ/, th: /θ/, k: /κ/, g: /γ/, z: /ζ/, x: /χ/, ts: /τσ/, d: /δ/,
    };
    for (const s of TARGET_SOUNDS) {
      for (const w of [...s.initial, ...s.medial]) expect([s.id, w.word, letters[s.id].test(w.word)]).toEqual([s.id, w.word, true]);
      expect(s.syllables).toHaveLength(5);
    }
  });

  it('οι μικροί σταματούν στις λέξεις, οι μεγάλοι φτάνουν στην πρόταση', () => {
    expect(articulationLadder(TARGET_SOUNDS[0], '4-5').map((r) => r.step)).not.toContain('phrase');
    expect(articulationLadder(TARGET_SOUNDS[0], '8-10').at(-1)?.step).toBe('phrase');
    expect(countGreekSyllables('Το πρωί πίνω γάλα με μέλι.')).toBe(10);
  });

  it('θέατρο: 5 γύροι, ένταση με 3 ζώνες-στόχους', () => {
    const r = dictionRounds('8-10');
    expect(r).toHaveLength(5);
    expect(r.find((x) => x.kind === 'volume')?.volumeTargets).toEqual(['quiet', 'normal', 'stage']);
    expect(ORAL_MOTOR_EXERCISES.length).toBeGreaterThanOrEqual(5);
  });

  it('τα 3 νέα παιχνίδια είναι στον κατάλογο, ως «κρίση ενήλικα»', () => {
    for (const id of ['21-tongue-gym', '22-clear-sounds', '23-voice-theater'] as const) {
      expect(getActivityById(id)?.totalRounds).toBe(5);
      expect(SELF_REPORT_ACTIVITY_IDS.has(id)).toBe(true);
    }
  });
});

describe('Τα παιχνίδια λόγου στην πράξη (χωρίς μικρόφωνο)', () => {
  it('Καθαρή Προφορά: αλλαγή ήχου, «σχεδόν» μένει στο σκαλί, «καθαρά» ανεβαίνει', async () => {
    render(
      <MemoryRouter initialEntries={['/activity/22-clear-sounds']}>
        <App />
      </MemoryRouter>
    );
    const start = screen.queryByTestId('runner-start-activity-btn');
    if (start) fireEvent.click(start);
    fireEvent.click(await screen.findByTestId('clear-sound-r'));
    await waitFor(() => expect(screen.getByTestId('clear-sound-r')).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByTestId('clear-sounds-step')).toHaveTextContent('Σκαλί 1');
    expect(screen.getByTestId('voice-enable-mic-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('voice-rate-almost-btn'));
    expect(screen.getByTestId('clear-sounds-step')).toHaveTextContent('Σκαλί 1');
    fireEvent.click(screen.getByTestId('voice-rate-clear-btn'));
    await waitFor(() => expect(screen.getByTestId('clear-sounds-step')).toHaveTextContent('Σκαλί 2'));
    expect(screen.getByTestId('clear-sounds-display')).toHaveTextContent('ρα');
  });

  it('Γυμναστική της Γλώσσας: μετράει επαναλήψεις και περνάει στην επόμενη άσκηση', async () => {
    render(
      <MemoryRouter initialEntries={['/activity/21-tongue-gym']}>
        <App />
      </MemoryRouter>
    );
    const start = screen.queryByTestId('runner-start-activity-btn');
    if (start) fireEvent.click(start);
    const first = (await screen.findByTestId('tongue-gym-name')).textContent;
    for (let i = 0; i < 8 && !screen.queryByTestId('tongue-gym-next-btn'); i++) {
      fireEvent.click(screen.getByTestId('tongue-gym-tap-btn'));
    }
    fireEvent.click(screen.getByTestId('tongue-gym-next-btn'));
    await waitFor(() => expect(screen.getByTestId('tongue-gym-name').textContent).not.toBe(first));
  });

  it('Θέατρο της Φωνής: τα βήματα του γύρου προχωρούν με «καθαρά»', async () => {
    render(
      <MemoryRouter initialEntries={['/activity/23-voice-theater']}>
        <App />
      </MemoryRouter>
    );
    const start = screen.queryByTestId('runner-start-activity-btn');
    if (start) fireEvent.click(start);
    const steps = await screen.findByTestId('voice-theater-steps');
    expect(steps.textContent).toMatch(/Α… Ε… Ι/);
    fireEvent.click(screen.getByTestId('voice-rate-clear-btn'));
    await waitFor(() => expect(screen.getByTestId('voice-theater-steps').textContent).toMatch(/✓/));
  });
});
