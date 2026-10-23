/**
 * Clinical-Grade Greek Speech & Prosody Engine + Calming Harmonic Audio
 *
 * Solves common Greek Web Speech API (TTS) defects:
 * 1. Prevents ALL-CAPS Greek words (e.g. «ΚΟΤΑ», «ΠΟΡΤΑ», «ΜΕΣΑ», «ΠΡΑΣΙΝΟ») from being
 *    treated as acronyms and spelled letter-by-letter («Κ - Ο - Τ - Α»).
 * 2. Reconstructs hyphenated/spaced syllables (e.g. «ΚΟ - ΤΑ», «ΜΠΑ-ΛΑ», «ΧΕ-ΛΩ-ΝΑ»)
 *    into natural prosodic Greek words or open phonetic syllables.
 * 3. Translates linguistic phoneme slash notation (e.g. /Χ/, /Ρ/, /Κ/, /Σ/) into
 *    child-friendly spoken Greek descriptions instead of reading «κάθετος Χι κάθετος».
 * 4. Strips emojis, arrows, and decorative symbols so the synthesizer never reads out
 *    long Unicode symbol names in the middle of therapeutic instructions.
 * 5. Selects the most natural Greek voice available (Natural/Neural Athina, Nestoras,
 *    Google Ελληνικά, Melina, Stefanos) with calm Polyvagal-informed pacing.
 */

/**
 * Dictionary of uppercase/unaccented Greek words used across activities -> properly accented lowercase.
 * Ensures zero letter-by-letter acronym spelling by Greek TTS engines.
 */
const GREEK_UPPERCASE_LEXICON: Record<string, string> = {
  // Minimal pairs & Speech therapy words
  ΚΟΤΑ: 'κότα',
  ΠΟΡΤΑ: 'πόρτα',
  ΠΟΤΑ: 'πότα',
  ΤΟΥΡΤΑ: 'τούρτα',
  ΜΠΑΛΑ: 'μπάλα',
  ΣΑΛΑ: 'σάλα',
  ΓΑΤΑ: 'γάτα',
  ΠΑΠΙ: 'παπί',
  ΧΕΛΩΝΑ: 'χελώνα',
  ΚΑΡΑΒΙ: 'καράβι',
  ΘΑΛΑΣΣΑ: 'θάλασσα',
  ΠΟΔΗΛΑΤΟ: 'ποδήλατο',
  ΕΛΕΦΑΝΤΑΣ: 'ελέφαντας',
  ΣΥΓΚΕΝΤΡΩΣΗ: 'συγκέντρωση',
  ΗΡΕΜΟΣ: 'ήρεμος',
  ΠΟΔΙ: 'πόδι',
  ΡΟΔΙ: 'ρόδι',
  ΠΕΤΡΑ: 'πέτρα',
  ΦΕΤΡΑ: 'φέτρα',
  ΚΑΣΤΡΟ: 'κάστρο',
  ΑΣΤΡΟ: 'άστρο',
  ΤΡΕΝΟ: 'τρένο',
  ΦΡΕΝΟ: 'φρένο',
  ΨΑΡΙ: 'ψάρι',
  ΦΑΡΙ: 'φάρι',

  // Spatial & Prepositional concepts
  ΜΕΣΑ: 'μέσα',
  ΕΞΩ: 'έξω',
  ΠΑΝΩ: 'πάνω',
  ΚΑΤΩ: 'κάτω',
  ΔΙΠΛΑ: 'δίπλα',
  ΑΝΑΜΕΣΑ: 'ανάμεσα',
  ΜΠΡΟΣΤΑ: 'μπροστά',
  ΠΙΣΩ: 'πίσω',
  ΑΡΙΣΤΕΡΑ: 'αριστερά',
  ΔΕΞΙΑ: 'δεξιά',
  ΠΡΙΝ: 'πριν',
  ΜΕΤΑ: 'μετά',

  // Executive function & Rule switching terms
  ΚΑΝΟΝΑΣ: 'κανόνας',
  ΚΑΝΟΝΑ: 'κανόνα',
  ΚΑΝΟΝΕΣ: 'κανόνες',
  ΑΛΛΑΓΗ: 'αλλαγή',
  ΙΔΙΟ: 'ίδιο',
  ΙΔΙΑ: 'ίδια',
  ΔΙΑΦΟΡΕΤΙΚΟ: 'διαφορετικό',
  ΧΡΩΜΑ: 'χρώμα',
  ΧΡΩΜΑΤΟΣ: 'χρώματος',
  ΣΧΗΜΑ: 'σχήμα',
  ΣΧΗΜΑΤΟΣ: 'σχήματος',
  ΜΕΓΕΘΟΣ: 'μέγεθος',
  ΣΗΜΑ: 'σήμα',
  ΚΙΝΗΣΗ: 'κίνηση',
  ΠΑΓΩΣΕ: 'πάγωσε',
  ΣΤΟΠ: 'στοπ',
  ΞΑΝΑ: 'ξανά',
  ΜΗΝ: 'μην',
  ΜΟΝΟ: 'μόνο',
  ΠΡΩΤΑ: 'πρώτα',
  ΤΩΡΑ: 'τώρα',
  ΝΑΙ: 'ναι',
  ΟΧΙ: 'όχι',

  // Colors & Common targets
  ΠΡΑΣΙΝΟ: 'πράσινο',
  ΠΡΑΣΙΝΗ: 'πράσινη',
  ΚΙΤΡΙΝΟ: 'κίτρινο',
  ΚΙΤΡΙΝΗ: 'κίτρινη',
  ΚΟΚΚΙΝΟ: 'κόκκινο',
  ΚΟΚΚΙΝΗ: 'κόκκινη',
  ΜΠΛΕ: 'μπλε',
  ΠΟΡΤΟΚΑΛΙ: 'πορτοκαλί',
  ΑΣΤΕΡΙ: 'αστέρι',
  ΚΑΡΑΒΑΚΙ: 'καραβάκι',
  ΜΗΛΟ: 'μήλο',
  ΒΑΤΡΑΧΑΚΙ: 'βατραχάκι',
  ΗΛΙΑΝΘΟΣ: 'ηλίανθος',
  ΛΟΥΛΟΥΔΙ: 'λουλούδι',

  // Rhythm & Music-Kinetic terms
  ΤΑ: 'ταα',
  ΤΙ: 'τι',
  ΠΑΥΣΗ: 'παύση',
};

/**
 * Phonetic map for single syllables so clapping/tapping a syllable box
 * speaks a natural open Greek syllable rather than spelling out letters (e.g. Τ-Α).
 */
const SINGLE_SYLLABLE_PHONETIC_MAP: Record<string, string> = {
  ΜΠΑ: 'μπά',
  ΛΑ: 'λά',
  ΓΑ: 'γά',
  ΤΑ: 'τά',
  ΠΑ: 'πά',
  ΠΙ: 'πί',
  ΚΟ: 'κό',
  ΠΟ: 'πό',
  ΡΟ: 'ρό',
  ΔΙ: 'δί',
  ΧΕ: 'χέ',
  ΛΩ: 'λώ',
  ΝΑ: 'νά',
  ΚΑ: 'κά',
  ΡΑ: 'ρά',
  ΒΙ: 'βί',
  ΘΑ: 'θά',
  ΣΣΑ: 'σά',
  ΣΑ: 'σά',
  ΔΗ: 'δή',
  ΤΟ: 'τό',
  Ε: 'έ',
  ΛΕ: 'λέ',
  ΦΑ: 'φά',
  ΝΤΑΣ: 'ντάς',
  ΣΥ: 'σύ',
  ΓΚΕ: 'γκέ',
  ΝΤΡΩ: 'ντρώ',
  ΣΗ: 'σή',
  ΤΡΕ: 'τρέ',
  ΝΟ: 'νό',
  ΦΡΕ: 'φρέ',
  ΚΑΣ: 'κάς',
  ΤΡΟ: 'τρό',
  ΠΕ: 'πέ',
  ΤΡΑ: 'τρά',
  Η: 'ή',
  ΛΙΟΣ: 'λιος',
  ΜΕ: 'μέ',
  ΛΙ: 'λί',
  ΣΠΙ: 'σπί',
  ΤΙ: 'τί',
  ΜΟ: 'μό',
  ΛΥ: 'λύ',
};

/**
 * Multi-syllable visual strings mapped to natural spoken Greek phrases.
 */
const HYPHENATED_WORD_MAP: Record<string, string> = {
  'ΚΟ - ΤΑ': 'κότα',
  'ΚΟ-ΤΑ': 'κότα',
  'ΠΟ - ΤΑ': 'πότα',
  'ΠΟ-ΤΑ': 'πότα',
  'ΠΟ - ΔΙ': 'πόδι',
  'ΠΟ-ΔΙ': 'πόδι',
  'ΡΟ - ΔΙ': 'ρόδι',
  'ΡΟ-ΔΙ': 'ρόδι',
  'ΜΠΑ - ΛΑ': 'μπάλα',
  'ΜΠΑ-ΛΑ': 'μπάλα',
  'ΣΑ - ΛΑ': 'σάλα',
  'ΣΑ-ΛΑ': 'σάλα',
  'ΓΑ - ΤΑ': 'γάτα',
  'ΓΑ-ΤΑ': 'γάτα',
  'ΠΑ - ΠΙ': 'παπί',
  'ΠΑ-ΠΙ': 'παπί',
  'ΤΡΕ - ΝΟ': 'τρένο',
  'ΤΡΕ-ΝΟ': 'τρένο',
  'ΦΡΕ - ΝΟ': 'φρένο',
  'ΦΡΕ-ΝΟ': 'φρένο',
  'ΠΕ - ΤΡΑ': 'πέτρα',
  'ΠΕ-ΤΡΑ': 'πέτρα',
  'ΧΕ-ΛΩ-ΝΑ': 'χελώνα',
  'ΧΕ - ΛΩ - ΝΑ': 'χελώνα',
  'ΚΑ-ΡΑ-ΒΙ': 'καράβι',
  'ΚΑ - ΡΑ - ΒΙ': 'καράβι',
  'ΘΑ-ΛΑ-ΣΣΑ': 'θάλασσα',
  'ΘΑ - ΛΑ - ΣΣΑ': 'θάλασσα',
  'ΠΟ-ΔΗ-ΛΑ-ΤΟ': 'ποδήλατο',
  'ΠΟ - ΔΗ - ΛΑ - ΤΟ': 'ποδήλατο',
  'Ε-ΛΕ-ΦΑ-ΝΤΑΣ': 'ελέφαντας',
  'ΣΥ-ΓΚΕ-ΝΤΡΩ-ΣΗ': 'συγκέντρωση',
  'Α-ΣΤΡΟΝΑΥ-ΤΗΣ': 'αστροναύτης',
  'ΤΗ-ΛΕ-ΣΚΟ-ΠΙ-Ο': 'τηλεσκόπιο',
  'Τη-λε-σκό-πι-ο': 'τηλεσκόπιο',
  'Α-στρο-ναύ-της': 'αστροναύτης',
  'Μέ-λι-σσα': 'μέλισσα',
  'Ή-λιος': 'ήλιος',
  'Σπί-τι': 'σπίτι',
  'Τσά-ντα': 'τσάντα',
  'Μο-λύ-βι': 'μολύβι',
};

/**
 * Phoneme slash notation (/Χ/, /Ρ/, etc.) -> child-friendly spoken phoneme sound.
 */
const PHONEME_SLASH_MAP: Record<string, string> = {
  Χ: 'χου',
  χ: 'χου',
  Ρ: 'ρο',
  ρ: 'ρο',
  Σ: 'σίγμα',
  σ: 'σίγμα',
  Λ: 'λάμδα',
  λ: 'λάμδα',
  Κ: 'κάπα',
  κ: 'κάπα',
  Π: 'πι',
  π: 'πι',
  Τ: 'ταυ',
  τ: 'ταυ',
  Θ: 'θήτα',
  θ: 'θήτα',
  Φ: 'φι',
  φ: 'φι',
  Β: 'βήτα',
  β: 'βήτα',
  Δ: 'δέλτα',
  δ: 'δέλτα',
  Γ: 'γάμα',
  γ: 'γάμα',
  Μ: 'μι',
  μ: 'μι',
  Ν: 'νι',
  ν: 'νι',
  Η: 'ήτα',
  η: 'ήτα',
  ΓΚ: 'γκου',
  γκ: 'γκου',
  ΝΤΡ: 'ντρ',
  ντρ: 'ντρ',
  ΤΡ: 'τρ',
  τρ: 'τρ',
  ΣΤ: 'στ',
  στ: 'στ',
  ΜΠ: 'μπ',
  μπ: 'μπ',
  ΝΤ: 'ντ',
  ντ: 'ντ',
};

/**
 * Adds a Greek accent (tonos) to the first vowel of an unaccented lowercase Greek word
 * so TTS engines never spell it out letter-by-letter as an abbreviation.
 */
function ensureGreekTonos(word: string): string {
  // Already has a tonos or dialytika
  if (/[άέήίόύώϊϋΐΰ]/i.test(word)) {
    return word;
  }
  // Map of digraphs first, then single vowels
  const digraphReplacements: Array<[RegExp, string]> = [
    [/ου/, 'ού'],
    [/αι/, 'αί'],
    [/ει/, 'εί'],
    [/οι/, 'οί'],
  ];
  for (const [regex, replacement] of digraphReplacements) {
    if (regex.test(word)) {
      return word.replace(regex, replacement);
    }
  }
  const vowelMap: Record<string, string> = {
    α: 'ά',
    ε: 'έ',
    η: 'ή',
    ι: 'ί',
    ο: 'ό',
    υ: 'ύ',
    ω: 'ώ',
  };
  return word.replace(/[αεηιουω]/, (match) => vowelMap[match] ?? match);
}

/**
 * Normalizes any Greek UI string into natural, fluent text for Web Speech API synthesis.
 * Specifically prevents acronym spelling (e.g., «ΚΟΤΑ» -> «κότα», «ΚΟ - ΤΑ» -> «κότα»).
 */
export function normalizeGreekForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Strip emojis, pictograms, arrows, and UI checkmarks
  text = text.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}➔➡️⬆️⬇️⬅️✓☑️⬜]/gu,
    ' '
  );

  // 2. Replace English cue tags that confuse Greek TTS
  text = text
    .replace(/\(GO\)/gi, '')
    .replace(/\(STOP\)/gi, '')
    .replace(/\bGo\/No-Go\b/gi, '')
    .replace(/\bAdagio\b/gi, 'αργός ρυθμός')
    .replace(/\bModerato\b/gi, 'σταθερός ρυθμός')
    .replace(/\bAndante\b/gi, 'ήρεμος βηματισμός')
    .replace(/\bOrff\b/gi, 'Ορφ')
    .replace(/\bDalcroze\b/gi, 'Νταλκρόζ')
    .replace(/\bLEGO\b/gi, 'λέγκο');

  // 3. Replace known hyphenated/spaced syllable words (e.g. «ΚΟ - ΤΑ» -> «κότα»)
  for (const [pattern, spoken] of Object.entries(HYPHENATED_WORD_MAP)) {
    if (text.includes(pattern)) {
      text = text.split(pattern).join(spoken);
    }
  }

  // 4. Generic hyphenated Greek syllables (e.g. ΚΑ-ΛΑ-ΘΙ or ΠΟ - ΤΗ - ΡΙ) -> joined lowercase word
  text = text.replace(
    /([Α-ΩΆ-Ώα-ωά-ώ]{1,4})(?:\s*-\s*([Α-ΩΆ-Ώα-ωά-ώ]{1,4}))+/g,
    (fullMatch) => {
      const joinedUpper = fullMatch.replace(/\s*-\s*/g, '').toUpperCase();
      if (GREEK_UPPERCASE_LEXICON[joinedUpper]) {
        return GREEK_UPPERCASE_LEXICON[joinedUpper];
      }
      const joinedLower = fullMatch.replace(/\s*-\s*/g, '').toLowerCase();
      return ensureGreekTonos(joinedLower);
    }
  );

  // 5. Replace slash-wrapped words or phonemes (e.g. /ΚΟΤΑ/ -> κότα, /Χ/ -> χου)
  text = text.replace(/\/([Α-ΩΆ-Ώα-ωά-ώ]{1,10})\//g, (_, inner: string) => {
    const upper = inner.toUpperCase();
    if (GREEK_UPPERCASE_LEXICON[upper]) {
      return GREEK_UPPERCASE_LEXICON[upper];
    }
    if (PHONEME_SLASH_MAP[inner] || PHONEME_SLASH_MAP[upper]) {
      return PHONEME_SLASH_MAP[inner] ?? PHONEME_SLASH_MAP[upper];
    }
    return ensureGreekTonos(inner.toLowerCase());
  });

  // 6. Convert any ALL-CAPS Greek words (2+ letters) into accented lowercase so TTS never spells letters
  text = text.replace(/(?<![Α-ΩΆ-Ώα-ωά-ώ])([Α-ΩΆ-Ώ]{2,})(?![Α-ΩΆ-Ώα-ωά-ώ])/g, (word) => {
    const cleanUpper = word
      .replace(/Ά/g, 'Α')
      .replace(/Έ/g, 'Ε')
      .replace(/Ή/g, 'Η')
      .replace(/Ί/g, 'Ι')
      .replace(/Ό/g, 'Ο')
      .replace(/Ύ/g, 'Υ')
      .replace(/Ώ/g, 'Ω');

    if (GREEK_UPPERCASE_LEXICON[cleanUpper]) {
      return GREEK_UPPERCASE_LEXICON[cleanUpper];
    }
    if (SINGLE_SYLLABLE_PHONETIC_MAP[cleanUpper]) {
      return SINGLE_SYLLABLE_PHONETIC_MAP[cleanUpper];
    }
    // If original uppercase word already had an accent (e.g. ΚΌΤΑ), lowercase preserves it
    const lower = word.toLowerCase();
    return ensureGreekTonos(lower);
  });

  // 7. Also fix Title-Case unaccented 2-6 letter words like "Κοτα" -> "κότα"
  text = text.replace(/(?<![Α-ΩΆ-Ώα-ωά-ώ])([Α-Ω][α-ω]{1,5})(?![Α-ΩΆ-Ώα-ωά-ώ])/g, (word) => {
    const upper = word.toUpperCase();
    if (GREEK_UPPERCASE_LEXICON[upper]) {
      return GREEK_UPPERCASE_LEXICON[upper];
    }
    return word;
  });

  // 8. Clean up quotation marks and prosody punctuation for smooth speech breath pauses
  text = text
    .replace(/[«»"]/g, ' ')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\.\.\./g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Selects the highest-quality Greek voice available on the browser/OS.
 * Prioritizes Neural/Natural voices (Athina, Nestoras, Google Ελληνικά, Melina).
 */
export function selectBestGreekVoice(): SpeechSynthesisVoice | null {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices?.() ?? [];
    if (!voices.length) return null;

    const greekVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('el') || v.name.toLowerCase().includes('greek')
    );
    if (!greekVoices.length) return null;

    const priorityKeywords = ['natural', 'neural', 'athina', 'nestoras', 'google', 'melina', 'stefanos'];
    for (const kw of priorityKeywords) {
      const match = greekVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }
    return greekVoices[0];
  } catch {
    return null;
  }
}

/**
 * Speaks a Greek sentence or instruction with full phonetic normalization and calm prosody.
 */
export function speakGreek(text: string, enabled: boolean = true, rate: number = 0.92): void {
  if (!enabled || !text) return;
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    const normalizedText = normalizeGreekForSpeech(text);
    if (!normalizedText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = 'el-GR';
    const bestVoice = selectBestGreekVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    // Calibrated Polyvagal prosody: calm rate (0.85 - 0.96) and warm pitch (1.02)
    utterance.rate = Math.max(0.8, Math.min(1.05, rate));
    utterance.pitch = 1.02;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Silent fallback — visual pictograms are always shown alongside speech
  }
}

/**
 * Speaks a single Greek syllable during syllable-clapping games so it is uttered
 * as an open syllable (e.g. «μπά», «λά», «κό», «τά») and NEVER spelled out as letters.
 */
export function speakGreekSyllable(
  rawSyllable: string,
  enabled: boolean = true,
  rate: number = 0.9
): void {
  if (!enabled || !rawSyllable) return;
  const cleanUpper = rawSyllable.trim().toUpperCase();
  const phoneticSyllable =
    SINGLE_SYLLABLE_PHONETIC_MAP[cleanUpper] ?? ensureGreekTonos(rawSyllable.trim().toLowerCase());
  speakGreek(phoneticSyllable, enabled, rate);
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
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
