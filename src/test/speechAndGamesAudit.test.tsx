import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  accentGreekWord,
  nextPraisePhrase,
  normalizeGreekForSpeech,
  speakGreek,
  stopSpeaking,
  syllableForSpeech,
} from '../utils/soundAndSpeech';
import { buildRhythmForAge } from '../activities/Activity20MusicKineticRhythm';
import { neutralOptionLabel } from '../activities/Activity06SwitchRule';
import { definitionWithoutWord } from '../activities/Activity13SpeechArticulation';
import { optionLabel } from '../activities/Activity15AuditoryDiscrimination';

describe('Audit 10/2026 — Greek speech normalisation', () => {
  it('never stretches articles/short words («τάα», «τόο», «μέε», «νάα»)', () => {
    expect(normalizeGreekForSpeech('Τα παιχνίδια ξεκουράζονται.')).toBe('Τα παιχνίδια ξεκουράζονται.');
    const caps = normalizeGreekForSpeech('Κοίτα το ΜΗΛΟ ΚΑΙ ΤΟ ΠΑΠΙ ΜΕ ΤΑ ΠΟΔΙΑ ΣΟΥ');
    expect(caps).toBe('Κοίτα το μήλο και το παπί με τα πόδια σου');
    expect(normalizeGreekForSpeech('ΝΑ ΚΑΙ ΤΟ ΑΣΤΕΡΙ')).toBe('να και το αστέρι');
  });

  it('keeps word pairs apart and joins only syllable chains', () => {
    expect(normalizeGreekForSpeech('βήμα-βήμα, σιγά-σιγά, αριστερά-δεξιά')).toBe('βήμα βήμα, σιγά σιγά, αριστερά δεξιά');
    expect(normalizeGreekForSpeech('Χε-λώ-να')).toBe('χελώνα');
    expect(normalizeGreekForSpeech('Θά-λασ-σα')).toBe('θάλασσα');
    expect(normalizeGreekForSpeech('αντίχειρα-δείκτη')).toBe('αντίχειρα δείκτη');
  });

  it('removes emoji/symbols and reads arrows, «&», «+», «/ή», «vs», «2ο» naturally', () => {
    expect(normalizeGreekForSpeech('Ήρεμα ✋ — περιμένουμε το αστέρι 🌟 ⭐ ⏳ ⏸️')).toBe('Ήρεμα, περιμένουμε το αστέρι');
    expect(normalizeGreekForSpeech('Παλαμάκι ➔ Γόνατα ➔ Σιωπή')).toBe('Παλαμάκι, Γόνατα, Σιωπή');
    expect(normalizeGreekForSpeech('Καθιστός/ή, άνοιξε τα χέρια')).toBe('Καθιστός, άνοιξε τα χέρια');
    expect(normalizeGreekForSpeech('«Κότα» vs «Πόρτα»')).toBe('Κότα ή Πόρτα');
    expect(normalizeGreekForSpeech('Πόδι + Ελαύνω & Μολύβι')).toBe('Πόδι και Ελαύνω και Μολύβι');
    expect(normalizeGreekForSpeech('Ποιο είναι στη ΜΕΣΗ (2ο);')).toBe('Ποιο είναι στη μέση, δεύτερο;');
  });

  it('every ALL-CAPS word used in the games is pronounced as a word', () => {
    const dir = path.resolve(__dirname, '../activities');
    const words = new Set<string>();
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of src.matchAll(/(?<![Α-Ωα-ωΆ-Ώά-ώ])[Α-ΩΆ-Ώ]{2,}(?![Α-Ωα-ωΆ-Ώά-ώ])/g)) words.add(m[0]);
    }
    for (const w of words) {
      const spoken = normalizeGreekForSpeech(w);
      expect(spoken, w).toBe(spoken.toLowerCase());
    }
  });

  it('default stress = penultimate, monosyllables unaccented, syllables never stretched', () => {
    expect(accentGreekWord('ποδια')).toBe('πόδια');
    expect(accentGreekWord('σου')).toBe('σου');
    expect(syllableForSpeech('μπα')).toBe('μπά');
    expect(syllableForSpeech('ντρο')).toBe('ντρό');
  });

  it('praise is short and never the same twice in a row', () => {
    let prev = nextPraisePhrase();
    for (let i = 0; i < 20; i++) {
      const next = nextPraisePhrase();
      expect(next).not.toBe(prev);
      expect(next.length).toBeLessThan(20);
      prev = next;
    }
  });
});

describe('Audit 10/2026 — speech queue (no more cut-offs)', () => {
  const spoken: string[] = [];
  const cancelled: string[] = [];
  let current: { text: string; onend?: () => void } | null = null;

  beforeEach(() => {
    spoken.length = 0;
    cancelled.length = 0;
    current = null;
    class FakeUtterance {
      text: string;
      onend?: () => void;
      onerror?: () => void;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: unknown = null;
      constructor(t: string) {
        this.text = t;
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        paused: false,
        speak: (u: { text: string; onend?: () => void }) => {
          spoken.push(u.text);
          current = u;
        },
        cancel: () => {
          if (current) cancelled.push(current.text);
          current = null;
        },
        resume: () => undefined,
        getVoices: () => [],
        addEventListener: () => undefined,
      },
    });
  });
  afterEach(() => {
    stopSpeaking();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).speechSynthesis;
    vi.unstubAllGlobals();
  });

  const finishCurrent = () => {
    const c = current;
    current = null;
    c?.onend?.();
  };

  it('a protected praise is not cut by the next instruction; the instruction waits', async () => {
    void speakGreek('Μπράβο!', true, 0.9, { protect: true, kind: 'praise' });
    const next = speakGreek('Βρες το μήλο.', true, 0.9);
    expect(spoken).toEqual(['Μπράβο!']);
    expect(cancelled).toEqual([]);
    finishCurrent();
    expect(spoken).toEqual(['Μπράβο!', 'Βρες το μήλο.']);
    finishCurrent();
    await expect(next).resolves.toBeUndefined();
  });

  it('a new instruction still replaces an old instruction/feedback', () => {
    void speakGreek('Παλιά οδηγία που κρατάει πολύ.', true);
    void speakGreek('Νέα οδηγία.', true);
    expect(cancelled).toEqual(['Παλιά οδηγία που κρατάει πολύ.']);
    expect(spoken[spoken.length - 1]).toBe('Νέα οδηγία.');
  });
});

describe('Audit 10/2026 — game content no longer gives the answer away', () => {
  it('06: option labels lose colour/shape adjectives and «παγίδα» explanations', () => {
    expect(neutralOptionLabel('Πράσινο Βατραχάκι')).toBe('Βατραχάκι');
    expect(neutralOptionLabel('Σαλιγκάρι (Εξαιρετικά Αργή Κίνηση — Αντίθετο!)')).toBe('Σαλιγκάρι');
    expect(neutralOptionLabel('Αεροπλάνο (Πετάει ψηλά — παγίδα!)')).toBe('Αεροπλάνο');
  });
  it('13: definitions do not start with the answer word', () => {
    expect(definitionWithoutWord('Ποδήλατο: Πόδι + Ελαύνω (Δίτροχο όχημα με πετάλια)')).toBe(
      'Πόδι + Ελαύνω (Δίτροχο όχημα με πετάλια)'
    );
  });
  it('15: the explanation in brackets is hidden', () => {
    expect(optionLabel('Ομπρέλα (Επειδή σήμερα βρέχει δυνατά)')).toBe('Ομπρέλα');
  });
  it('20: rhythm length grows with age (2 → 5 beats), 4-5 has no silence', () => {
    const base = ['clap', 'rest', 'knees'] as const;
    expect(buildRhythmForAge([...base], '4-5', false)).toEqual(['clap', 'knees']);
    expect(buildRhythmForAge([...base], '5-6', false)).toHaveLength(3);
    expect(buildRhythmForAge([...base], '8-10', false)).toHaveLength(4);
    expect(buildRhythmForAge([...base], '10-12', false)).toHaveLength(5);
  });
});
