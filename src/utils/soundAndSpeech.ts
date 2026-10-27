/**
 * Greek Speech & Prosody Engine + calm audio cues
 *
 * - Turns ALL-CAPS words, syllable chains («ΧΕ-ΛΩ-ΝΑ»), phoneme notation (/Ρ/) and symbols into
 *   natural Greek for the Web Speech API (no letter-by-letter spelling, no emoji names).
 * - Speech queue with priorities: instructions no longer cut the praise or the word the child
 *   just completed, and every call returns a Promise so games start timers only after the
 *   child has heard the instruction.
 * - One shared AudioContext for all tones.
 */

/**
 * Dictionary of uppercase/unaccented Greek words used across activities -> properly accented lowercase.
 * Ensures zero letter-by-letter acronym spelling by Greek TTS engines.
 * NOTE: short function words (ΤΑ, ΤΟ, ΜΕ, ΝΑ …) must NOT be listed with a stress mark.
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
  ΡΟΔΟ: 'ρόδο',
  ΠΕΤΡΑ: 'πέτρα',
  ΦΕΤΡΑ: 'φέτρα',
  ΚΑΣΤΡΟ: 'κάστρο',
  ΑΣΤΡΟ: 'άστρο',
  ΤΡΕΝΟ: 'τρένο',
  ΦΡΕΝΟ: 'φρένο',
  ΨΑΡΙ: 'ψάρι',
  ΦΑΡΙ: 'φάρι',
  ΛΕΜΟΝΙ: 'λεμόνι',
  ΜΠΑΛΟΝΙ: 'μπαλόνι',
  ΤΡΕΝΑΚΙ: 'τρενάκι',
  ΤΡΙΦΥΛΛΙ: 'τριφύλλι',
  ΚΙΘΑΡΑ: 'κιθάρα',
  ΤΥΜΠΑΝΟ: 'τύμπανο',
  ΠΕΤΑΛΟΥΔΑ: 'πεταλούδα',
  ΒΙΒΛΙΟΘΗΚΗ: 'βιβλιοθήκη',
  ΑΥΤΟΡΡΥΘΜΙΣΗ: 'αυτορρύθμιση',
  ΔΕΝΤΡΟ: 'δέντρο',
  ΣΠΙΤΙ: 'σπίτι',
  ΒΑΖΟ: 'βάζο',
  ΦΥΛΛΟ: 'φύλλο',
  ΡΟΔΑ: 'ρόδα',
  ΚΥΜΑ: 'κύμα',
  ΠΥΞΙΔΑ: 'πυξίδα',
  ΣΤΑΦΥΛΙ: 'σταφύλι',
  ΔΕΛΦΙΝΙ: 'δελφίνι',
  ΦΡΑΟΥΛΑ: 'φράουλα',
  ΚΟΥΤΑΛΙ: 'κουτάλι',
  ΠΛΑΝΗΤΗΣ: 'πλανήτης',
  ΗΛΙΟΛΟΥΣΤΟΣ: 'ηλιόλουστος',
  ΠΑΡΑΤΗΡΗΤΙΚΟΣ: 'παρατηρητικός',
  ΣΥΝΕΡΓΑΣΙΑ: 'συνεργασία',
  ΕΝΣΥΝΑΙΣΘΗΣΗ: 'ενσυναίσθηση',
  ΤΗΛΕΣΚΟΠΙΟ: 'τηλεσκόπιο',
  ΜΕΘΟΔΙΚΟΤΗΤΑ: 'μεθοδικότητα',
  ΔΕΠΥ: 'Δέπυ',

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
  ΠΟΙΟΣ: 'ποιος',
  ΠΟΥ: 'πού',
  ΤΙ: 'τι',
  ΚΑΝΕΙ: 'κάνει',

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
  ΑΚΙΝΗΤΟ: 'ακίνητο',
  ΑΓΑΛΜΑ: 'άγαλμα',
  ΣΤΟΠ: 'στοπ',
  ΠΑΤΑ: 'πάτα',
  ΠΑΤΗΣΕΙΣ: 'πατήσεις',
  ΕΜΦΑΝΙΣΤΗΚΕ: 'εμφανίστηκε',
  ΧΡΥΣΟ: 'χρυσό',
  ΟΛΕΣ: 'όλες',
  ΞΑΝΑ: 'ξανά',
  ΜΗΝ: 'μην',
  ΜΟΝΟ: 'μόνο',
  ΠΡΩΤΑ: 'πρώτα',
  ΤΩΡΑ: 'τώρα',
  ΝΑΙ: 'ναι',
  ΟΧΙ: 'όχι',
  ΕΝΕΡΓΗ: 'ενεργή',
  ΑΝΕΝΕΡΓΗ: 'ανενεργή',
  ΕΝΕΡΓΟΙ: 'ενεργοί',
  ΑΝΕΝΕΡΓΟΙ: 'ανενεργοί',

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
  ΜΟΝΟΚΕΡΟΣ: 'μονόκερος',
  ΔΡΑΚΟΣ: 'δράκος',

  // Rhythm & Music-Kinetic terms
  ΠΑΥΣΗ: 'παύση',

  // Words found in ALL-CAPS in game instructions (audit 10/2026)
  ΑΝΤΙΘΕΤΟ: 'αντίθετο',
  ΑΦΟΥ: 'αφού',
  ΕΚΤΟΣ: 'εκτός',
  ΑΝ: 'αν',
  ΜΕΣΗ: 'μέση',
  ΞΥΛΟ: 'ξύλο',
  ΧΩΡΙΣ: 'χωρίς',
  ΦΩΣ: 'φως',
  ΠΩΣ: 'πώς',
  ΠΑΤΗΣΕ: 'πάτησε',
  ΠΕΡΙΜΕΝΕ: 'περίμενε',
  ΑΚΟΥ: 'άκου',
};

/**
 * Multi-syllable visual strings mapped to natural spoken Greek words.
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
 * Phoneme slash notation (/Χ/, /Ρ/, …) → the SOUND of the letter (not its name):
 * a child is taught «ρρρ», not «ρο», and «σσσ», not «σίγμα».
 */
const PHONEME_SLASH_MAP: Record<string, string> = {
  Χ: 'χχχ',
  Ρ: 'ρρρ',
  Σ: 'σσσ',
  Λ: 'λλλ',
  Κ: 'κα',
  Π: 'πα',
  Τ: 'τα',
  Θ: 'θθθ',
  Φ: 'φφφ',
  Β: 'βββ',
  Δ: 'δδδ',
  Γ: 'γγγ',
  Μ: 'μμμ',
  Ν: 'ννν',
  Ζ: 'ζζζ',
  Ξ: 'ξ',
  Ψ: 'ψ',
  ΓΚ: 'γκα',
  ΜΠ: 'μπα',
  ΝΤ: 'ντα',
  ΤΡ: 'τρα',
  ΣΤ: 'στα',
  ΝΤΡ: 'ντρα',
};

const GREEK_LETTER = 'Α-Ωα-ωΆ-Ώά-ώϊϋΐΰ';
const UNACCENTED_TO_ACCENTED: Record<string, string> = {
  α: 'ά',
  ε: 'έ',
  η: 'ή',
  ι: 'ί',
  ο: 'ό',
  υ: 'ύ',
  ω: 'ώ',
};
/** Vowel nuclei; for digraphs the accent is written on the 2nd letter (ού, αί, εί, οί, υί, αύ, εύ). */
const NUCLEUS_REGEX = /ου|αι|ει|οι|υι|αυ|ευ|[αεηιουω]/g;

/**
 * Adds a stress mark to an unaccented lowercase Greek word so TTS never spells it out.
 * Greek default: stress on the penultimate syllable; monosyllables stay unaccented
 * (το, τα, με, να, και … must NOT become «τόο», «μέε», «νάα»).
 */
export function accentGreekWord(word: string): string {
  if (/[άέήίόύώΐΰ]/.test(word)) return word;
  let nuclei = [...word.matchAll(NUCLEUS_REGEX)];
  // synizesis at word end: πόδια, χέρια, παιχνίδια → «ια» is ONE syllable after a consonant
  const last = nuclei[nuclei.length - 1];
  const prev = nuclei[nuclei.length - 2];
  if (
    last &&
    prev &&
    prev[0] === 'ι' &&
    (prev.index ?? 0) + 1 === last.index &&
    /^(α|ο|ε|ου|ω)$/.test(last[0]) &&
    (prev.index ?? 0) > 0 &&
    !/[αεηιουω]/.test(word[(prev.index ?? 0) - 1]) &&
    (last.index ?? 0) + last[0].length >= word.length - 1
  ) {
    nuclei = nuclei.slice(0, -1);
  }
  if (nuclei.length < 2) return word;
  const target = nuclei[nuclei.length - 2];
  const at = (target.index ?? 0) + target[0].length - 1;
  const ch = word[at];
  return word.slice(0, at) + (UNACCENTED_TO_ACCENTED[ch] ?? ch) + word.slice(at + 1);
}

/** A single syllable spoken as a short open syllable («ντρο» → «ντρό»), never as letter names. */
export function syllableForSpeech(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s || /[άέήίόύώΐΰ]/.test(s)) return s;
  const nuclei = [...s.matchAll(NUCLEUS_REGEX)];
  const target = nuclei[nuclei.length - 1];
  if (!target) return s;
  const at = (target.index ?? 0) + target[0].length - 1;
  return s.slice(0, at) + (UNACCENTED_TO_ACCENTED[s[at]] ?? s[at]) + s.slice(at + 1);
}

function stripTonosUpper(word: string): string {
  return word
    .replace(/Ά/g, 'Α')
    .replace(/Έ/g, 'Ε')
    .replace(/Ή/g, 'Η')
    .replace(/Ί/g, 'Ι')
    .replace(/Ό/g, 'Ο')
    .replace(/Ύ/g, 'Υ')
    .replace(/Ώ/g, 'Ω');
}

const ORDINALS: Record<string, string> = {
  '1ο': 'πρώτο',
  '2ο': 'δεύτερο',
  '3ο': 'τρίτο',
  '4ο': 'τέταρτο',
  '1η': 'πρώτη',
  '2η': 'δεύτερη',
  '3η': 'τρίτη',
};

/**
 * Normalizes any Greek UI string into natural, fluent text for Web Speech API synthesis.
 */
export function normalizeGreekForSpeech(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Arrows become a short pause; emojis / pictographs / variation selectors disappear
  text = text
    .replace(/\s*[➔➡→⟶⇒]️?\s*/gu, ', ')
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}️‍⃣✓☑⬜]/gu, ' ');

  // 2. English tags, abbreviations, symbols and number formats that confuse Greek TTS
  text = text
    .replace(/\(GO\)/gi, '')
    .replace(/\(STOP\)/gi, '')
    .replace(/\bGo\/No-Go\b/gi, '')
    .replace(/\bAdagio\b/gi, 'αργός ρυθμός')
    .replace(/\bModerato\b/gi, 'σταθερός ρυθμός')
    .replace(/\bAndante\b/gi, 'ήρεμος βηματισμός')
    .replace(/\bAllegro\b/gi, 'γρήγορος ρυθμός')
    .replace(/\bOrff\b/gi, 'Ορφ')
    .replace(/\bDalcroze\b/gi, 'Νταλκρόζ')
    .replace(/\bLEGO\b/gi, 'λέγκο')
    .replace(/\bvs\.?(?=\s)/gi, 'ή')
    .replace(/\s*&\s*/g, ' και ')
    .replace(/\s+\+\s+/g, ' και ')
    .replace(/π\.χ\./gi, 'για παράδειγμα')
    .replace(/κ\.λπ\./gi, 'και λοιπά')
    .replace(/κ\.ά\./gi, 'και άλλα')
    .replace(/δευτ\./gi, 'δευτερόλεπτα')
    .replace(/(\d+)\s*εκ\./g, '$1 εκατοστά')
    .replace(/(\d+)\s*[–-]\s*(\d+)\s*ετών/g, '$1 έως $2 ετών')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 από $2')
    .replace(/(?<![\d\p{L}])([1-4])(ο|η)(?!\p{L})/gu, (m) => ORDINALS[m] ?? m)
    // gendered alternatives «Καθιστός/ή», «έτοιμος/η» → first form only
    .replace(new RegExp(`([${GREEK_LETTER}]{3,})\\/(?:ή|η|ες|α|ο)(?![${GREEK_LETTER}])`, 'g'), '$1')
    .replace(new RegExp(`([${GREEK_LETTER}])\\/([${GREEK_LETTER}])`, 'g'), '$1 ή $2')
    .replace(/\s+\/\s+/g, ' ή ')
    .replace(/\(Αρχίζει με ([Α-Ωα-ω]{1,3})\)/g, (_, ph: string) => {
      const spoken = PHONEME_SLASH_MAP[ph.toUpperCase()] ?? ph;
      return `, αρχίζει με τη φωνούλα ${spoken}`;
    });

  // 3. Known hyphenated/spaced syllable words (e.g. «ΚΟ - ΤΑ» → «κότα»)
  for (const [pattern, spoken] of Object.entries(HYPHENATED_WORD_MAP)) {
    if (text.includes(pattern)) text = text.split(pattern).join(spoken);
  }

  // 4. Hyphens between whole words. Syllable chains (Χε-λώ-να, ΚΑ-ΛΑ-ΘΙ) are joined into one word;
  //    reduplications / word pairs (βήμα-βήμα, σιγά-σιγά, αριστερά-δεξιά, Καρέτα-Καρέτα) get a space.
  text = text.replace(
    new RegExp(
      `(?<![${GREEK_LETTER}])[${GREEK_LETTER}]+(?:\\s*-\\s*[${GREEK_LETTER}]+)+(?![${GREEK_LETTER}])`,
      'g'
    ),
    (chain) => {
      const parts = chain.split(/\s*-\s*/);
      const accents = (chain.match(/[άέήίόύώΐΰΆΈΉΊΌΎΏ]/g) ?? []).length;
      const isSyllableChain = parts.every((p) => p.length <= 4) && accents <= 1 && new Set(parts.map((p) => p.toLowerCase())).size === parts.length;
      if (!isSyllableChain) return parts.join(' ');
      const joinedUpper = stripTonosUpper(parts.join('').toUpperCase());
      if (GREEK_UPPERCASE_LEXICON[joinedUpper]) return GREEK_UPPERCASE_LEXICON[joinedUpper];
      return accentGreekWord(parts.join('').toLowerCase());
    }
  );
  // remaining spaced dashes «A - B» → pause
  text = text.replace(/\s+-\s+/g, ', ');

  // 5. Slash-wrapped words or phonemes (e.g. /ΚΟΤΑ/ → κότα, /Ρ/ → ρρρ)
  text = text.replace(new RegExp(`\\/([${GREEK_LETTER}]{1,10})\\/`, 'g'), (_, inner: string) => {
    const upper = stripTonosUpper(inner.toUpperCase());
    if (GREEK_UPPERCASE_LEXICON[upper]) return GREEK_UPPERCASE_LEXICON[upper];
    if (PHONEME_SLASH_MAP[upper]) return PHONEME_SLASH_MAP[upper];
    return accentGreekWord(inner.toLowerCase());
  });

  // 6. ALL-CAPS Greek words → lowercase (lexicon first, then default stress; monosyllables unaccented)
  text = text.replace(
    new RegExp(`(?<![${GREEK_LETTER}])([Α-ΩΆ-ΏΪΫ]{2,})(?![${GREEK_LETTER}])`, 'g'),
    (word) => {
      const cleanUpper = stripTonosUpper(word);
      if (GREEK_UPPERCASE_LEXICON[cleanUpper]) return GREEK_UPPERCASE_LEXICON[cleanUpper];
      return accentGreekWord(word.toLowerCase());
    }
  );

  // 7. Title-case unaccented short words found in the lexicon («Κοτα» → «κότα»)
  text = text.replace(new RegExp(`(?<![${GREEK_LETTER}])([Α-Ω][α-ω]{2,5})(?![${GREEK_LETTER}])`, 'g'), (word) => {
    return GREEK_UPPERCASE_LEXICON[word.toUpperCase()] ?? word;
  });

  // 8. Quotes, brackets and dashes → natural breath pauses; tidy spaces before punctuation
  text = text
    .replace(/[«»"“”]/g, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*\(\s*/g, ', ')
    .replace(/\s*\)\s*/g, ', ')
    .replace(/\.\.\.|…/g, ', ')
    .replace(/·/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!;:])/g, '$1')
    .replace(/,\s*([,.!;:])/g, '$1')
    .replace(/^[,\s]+/, '')
    .replace(/[,\s]+$/, '')
    .trim();

  return text;
}

let cachedGreekVoice: SpeechSynthesisVoice | null = null;
let voiceListenerRegistered = false;

function ensureVoiceChangeListener(): void {
  if (voiceListenerRegistered || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  voiceListenerRegistered = true;
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      cachedGreekVoice = null;
      selectBestGreekVoice();
    });
  } catch {
    // Ignore if addEventListener is not supported on speechSynthesis
  }
}

/**
 * Selects the highest-quality Greek voice available on the browser/OS.
 * Prioritizes Neural/Natural voices (Athina, Nestoras, Google Ελληνικά, Melina).
 */
export function selectBestGreekVoice(): SpeechSynthesisVoice | null {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    ensureVoiceChangeListener();
    if (cachedGreekVoice) return cachedGreekVoice;

    const voices = window.speechSynthesis.getVoices?.() ?? [];
    if (!voices.length) return null;

    const greekVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('el') || v.name.toLowerCase().includes('greek') || v.name.includes('Ελληνικά')
    );
    if (!greekVoices.length) return null;

    const priorityKeywords = [
      'athina online (natural)',
      'nestoras online (natural)',
      'natural',
      'neural',
      'premium',
      'enhanced',
      'athina',
      'nestoras',
      'google',
      'melina',
      'nikos',
      'stefanos',
    ];
    for (const kw of priorityKeywords) {
      const match = greekVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (match) {
        cachedGreekVoice = match;
        return match;
      }
    }
    cachedGreekVoice = greekVoices[0];
    return greekVoices[0];
  } catch {
    return null;
  }
}

export function getActiveGreekVoiceLabel(): string {
  const v = selectBestGreekVoice();
  if (!v) return 'Αυτόματη Ελληνική Φωνή Συστήματος (el-GR)';
  return `${v.name} (${v.lang})`;
}

/* ------------------------------------------------------------------------------------------
 * Speech queue
 *
 * Before: every call did speechSynthesis.cancel() → a new instruction cut the praise, the
 * metronome «Ένα» cut the exercise instruction, the next round cut the full story sentence.
 * Now:
 *  - default = interrupt (a new instruction replaces an old instruction / feedback)
 *  - protect: true → that utterance (praise, the full word/sentence the child just built)
 *    is never cut; a new instruction waits politely behind it
 *  - interrupt: false → queued
 *  - every call returns a Promise that resolves when the utterance ends (or is dropped),
 *    so games can start timers/streams only AFTER the child heard the instruction.
 * ---------------------------------------------------------------------------------------- */

export type SpeechKind = 'prompt' | 'feedback' | 'praise' | 'syllable' | 'count';

export interface SpeakOptions {
  /** Replace what is playing (default true). Protected utterances are never replaced. */
  interrupt?: boolean;
  /** Never cut this utterance (praise, the word/sentence the child just completed). */
  protect?: boolean;
  /** 'prompt' utterances are remembered for the «🔊 Άκου ξανά» button. */
  kind?: SpeechKind;
  /** Speak even if the very same instruction was just spoken (the «🔊 Άκου» button). */
  force?: boolean;
}

interface SpeechJob {
  text: string;
  rate: number;
  protect: boolean;
  kind: SpeechKind;
  resolve: () => void;
}

const IS_TEST_ENV = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
let currentJob: SpeechJob | null = null;
let pendingJobs: SpeechJob[] = [];
let safetyTimer: number | null = null;
let lastPrompt: { text: string; rate: number } | null = null;
/**
 * The same round instruction requested again (a re-render after the adaptive profile changed,
 * the settings loading…) used to restart from the beginning and cut the child's feedback.
 * Now a repeat within the same round is ignored. A praise marks a new round.
 */
let lastPromptRun: { text: string; at: number; done: Promise<void> } | null = null;
const PROMPT_REPEAT_WINDOW_MS = 30000;

const CHARS_PER_SECOND = 13; // typical Greek TTS speed at rate 1.0

/** Rough speaking time of a (normalized) text, in ms. */
export function estimateSpeechMs(text: string, rate: number = 1): number {
  return Math.round(((text.length / CHARS_PER_SECOND) * 1000) / Math.max(0.5, rate));
}

/**
 * Unit tests (jsdom) have no speech engine: there the «instruction heard» gates open
 * synchronously so the game logic can be tested step by step.
 */
export function isSpeechGateInstant(): boolean {
  return IS_TEST_ENV && (typeof window === 'undefined' || !('speechSynthesis' in window));
}

/** Silent reading time when the voice is off: gates (e.g. «Άκου μέχρι το τέλος») still wait. */
function readingDelayMs(text: string): number {
  if (IS_TEST_ENV) return 0;
  return Math.max(1200, Math.min(6000, text.length * 55));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) resolve();
    else window.setTimeout(resolve, ms);
  });
}

/**
 * The adaptive profiles use 0.84–0.95. Children found that slow and monotonous;
 * real TTS sounds most natural close to 1.0, so the profile value is mapped to ~0.9–1.03.
 */
export function toNaturalRate(profileRate: number): number {
  return Math.max(0.88, Math.min(1.08, profileRate * 1.08));
}

function clearSafetyTimer() {
  if (safetyTimer !== null) {
    window.clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function finishJob(job: SpeechJob) {
  if (currentJob !== job) return;
  clearSafetyTimer();
  currentJob = null;
  job.resolve();
  startNextJob();
}

function startNextJob() {
  const job = pendingJobs.shift();
  if (!job) return;
  currentJob = job;
  try {
    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();
    const utterance = new SpeechSynthesisUtterance(job.text);
    utterance.lang = 'el-GR';
    const bestVoice = selectBestGreekVoice();
    if (bestVoice) utterance.voice = bestVoice;
    utterance.rate = job.rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = () => finishJob(job);
    utterance.onerror = () => finishJob(job);
    synth.speak(utterance);
    // Safety net: some engines never fire onend (no voice installed, tab hidden…)
    safetyTimer = window.setTimeout(() => finishJob(job), estimateSpeechMs(job.text, job.rate) * 1.6 + 2500);
  } catch {
    finishJob(job);
  }
}

/** Drops queued utterances; protected ones (praise, the completed word) survive unless `all`. */
function dropPending(all: boolean = false) {
  const dropped = all ? pendingJobs : pendingJobs.filter((j) => !j.protect);
  pendingJobs = all ? [] : pendingJobs.filter((j) => j.protect);
  dropped.forEach((j) => j.resolve());
}

function cancelCurrent() {
  const job = currentJob;
  currentJob = null;
  clearSafetyTimer();
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
  job?.resolve();
}

/**
 * Speaks a Greek sentence or instruction with phonetic normalization.
 * Resolves when the utterance has been spoken (or skipped/replaced).
 */
export function speakGreek(
  text: string,
  enabled: boolean = true,
  rate: number = 0.92,
  options: SpeakOptions = {}
): Promise<void> {
  if (!text) return Promise.resolve();
  const normalizedText = normalizeGreekForSpeech(text);
  if (!normalizedText) return Promise.resolve();
  const kind = options.kind ?? 'prompt';
  if (kind === 'praise') lastPromptRun = null;
  if (
    kind === 'prompt' &&
    !options.force &&
    lastPromptRun &&
    lastPromptRun.text === normalizedText &&
    Date.now() - lastPromptRun.at < PROMPT_REPEAT_WINDOW_MS &&
    !IS_TEST_ENV
  ) {
    const sameIsPlaying = [currentJob, ...pendingJobs].some((j) => j && j.kind === 'prompt' && j.text === normalizedText);
    const feedbackIsPlaying = Boolean(currentJob && currentJob.kind !== 'prompt');
    // never restart the instruction from the beginning, never cut the child's feedback for it
    if (sameIsPlaying || feedbackIsPlaying) return lastPromptRun.done;
  }
  if (kind === 'prompt') lastPrompt = { text, rate };

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!enabled || !supported) {
    return kind === 'prompt' ? delay(readingDelayMs(normalizedText)) : Promise.resolve();
  }

  const done = new Promise<void>((resolve) => {
    const job: SpeechJob = {
      text: normalizedText,
      rate: toNaturalRate(rate),
      protect: Boolean(options.protect),
      kind,
      resolve,
    };
    const interrupt = options.interrupt !== false;
    if (interrupt) {
      dropPending();
      if ((currentJob && currentJob.protect) || pendingJobs.length > 0) {
        pendingJobs.push(job); // wait politely behind the praise / completed word
        return;
      }
      cancelCurrent();
      pendingJobs.push(job);
      startNextJob();
      return;
    }
    pendingJobs.push(job);
    if (!currentJob) startNextJob();
  });
  if (kind === 'prompt') lastPromptRun = { text: normalizedText, at: Date.now(), done };
  return done;
}

/** Replays the last instruction (not the last feedback/praise). */
export function replayLastPrompt(enabled: boolean, fallbackText: string, rate: number = 0.92): Promise<void> {
  const target = lastPrompt ?? { text: fallbackText, rate };
  return speakGreek(target.text, enabled, target.rate, { kind: 'prompt', force: true });
}

/** Clears the remembered instruction (called when a game is left). */
export function resetLastPrompt(): void {
  lastPrompt = null;
  lastPromptRun = null;
}

/**
 * Speaks a single Greek syllable during syllable-clapping games as an open syllable
 * («μπα», «λα», «ντρο»), never spelled out as letters and never stretched («μπάα»).
 */
export function speakGreekSyllable(
  rawSyllable: string,
  enabled: boolean = true,
  rate: number = 0.9
): Promise<void> {
  if (!enabled || !rawSyllable) return Promise.resolve();
  return speakGreek(syllableForSpeech(rawSyllable), enabled, rate, { kind: 'syllable' });
}

export function stopSpeaking(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      dropPending(true);
      cancelCurrent();
    }
  } catch {
    // Ignore
  }
}

const PRAISE_PHRASES = ['Μπράβο!', 'Σωστά!', 'Τέλεια!', 'Πολύ ωραία!', 'Ακριβώς!', 'Τα κατάφερες!', 'Ναι, αυτό είναι!'];
let praiseIdx = 0;
/** Short, varied praise (never the same twice in a row). */
export function nextPraisePhrase(): string {
  praiseIdx = (praiseIdx + 1 + Math.floor(Math.random() * (PRAISE_PHRASES.length - 1))) % PRAISE_PHRASES.length;
  return PRAISE_PHRASES[praiseIdx];
}

export type CalmToneType = 'chime' | 'soft-step' | 'gentle-nudge' | 'complete' | 'pulse' | 'clap' | 'knees';

/**
 * ONE shared AudioContext. Before, every tone created a new AudioContext that was never closed:
 * after a few rounds iPad Safari refuses new contexts and all sounds stop.
 */
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => undefined);
  }
  return sharedAudioCtx;
}

function playNoiseBurst(ctx: AudioContext, now: number, durationS: number, filterHz: number, gainValue: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationS));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterHz;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + durationS);
}

export function playCalmTone(type: CalmToneType, enabled: boolean = true): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'clap') {
      playNoiseBurst(ctx, now, 0.12, 1800, 0.5); // body-percussion «παλαμάκι»
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'knees') {
      // low soft «thud» = hands on knees
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'chime') {
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.18); // C#5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'soft-step') {
      osc.frequency.setValueAtTime(392, now); // G4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'gentle-nudge') {
      // Non-punitive warm low tone
      osc.frequency.setValueAtTime(293.66, now); // D4
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'pulse') {
      osc.frequency.setValueAtTime(329.63, now); // E4
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'complete') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.12);
      osc.frequency.setValueAtTime(659.25, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.56);
    }
  } catch {
    // AudioContext blocked or unsupported; continue silently
  }
}
