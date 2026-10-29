import type { AgeBandId } from '../types/domain';


/**
 * Περιεχόμενο λογοθεραπευτικών ασκήσεων (21–23).
 * ΣΗΜΕΙΩΣΗ: προς έλεγχο από λογοθεραπευτή της πιλοτικής ομάδας πριν την παραγωγή.
 * Οι γλωσσοδέτες είναι δικοί μας ή παραδοσιακοί (λαϊκή παράδοση).
 */

export const YOUNG: ReadonlySet<AgeBandId> = new Set<AgeBandId>(['4-5', '5-6']);

/* ------------------------- 21. Γυμναστική της Γλώσσας ------------------------- */

export interface OralMotorExercise {
  id: string;
  emoji: string;
  nameEl: string;
  /** Οδηγία για το παιδί (εκφωνείται). */
  promptEl: string;
  /** Επαναλήψεις για 4–6 / 6–12. */
  reps: [number, number];
  /** «κράτα» σε δευτερόλεπτα (αν η άσκηση είναι στάση). */
  holdSeconds?: number;
  /** Λέξη που λέει η εφαρμογή σε κάθε επανάληψη. */
  beatEl: string;
}

export const ORAL_MOTOR_EXERCISES: OralMotorExercise[] = [
  { id: 'om-up-down', emoji: '👅', nameEl: 'Πάνω – κάτω', promptEl: 'Βγάλε τη γλωσσίτσα. Πάνω προς τη μύτη, κάτω προς το πηγούνι!', reps: [4, 6], beatEl: 'Πάνω… κάτω' },
  { id: 'om-clock', emoji: '🕰️', nameEl: 'Το ρολόι', promptEl: 'Η γλώσσα είναι ρολόι: άγγιξε τη μία γωνία του στόματος, μετά την άλλη. Τικ… τακ!', reps: [5, 8], beatEl: 'Τικ… τακ' },
  { id: 'om-horse', emoji: '🐴', nameEl: 'Το αλογάκι', promptEl: 'Κάνε το αλογάκι: χτύπα τη γλώσσα στον ουρανό του στόματος. Κλοπ, κλοπ!', reps: [5, 8], beatEl: 'Κλοπ' },
  { id: 'om-icecream', emoji: '🍦', nameEl: 'Το παγωτό', promptEl: 'Έχεις παγωτό στα χείλη! Γλείψε το πάνω χείλος από τη μία άκρη ως την άλλη.', reps: [4, 6], beatEl: 'Γλείφω' },
  { id: 'om-brush', emoji: '🪥', nameEl: 'Βουρτσίζω με τη γλώσσα', promptEl: 'Η γλώσσα βουρτσίζει τα δόντια: γύρω γύρω, από μέσα, με το στόμα κλειστό.', reps: [3, 5], beatEl: 'Γύρω γύρω' },
  { id: 'om-balloon', emoji: '🎈', nameEl: 'Το μπαλόνι', promptEl: 'Φούσκωσε τα μάγουλα σαν μπαλόνι, κράτα, και ξεφούσκωσε αργά.', reps: [3, 4], holdSeconds: 3, beatEl: 'Φουσκώνω' },
  { id: 'om-kiss-smile', emoji: '😘', nameEl: 'Φιλάκι – χαμόγελο', promptEl: 'Κάνε φιλάκι, μετά πλατύ χαμόγελο. Ου… ι!', reps: [5, 8], beatEl: 'Ου… ι' },
  { id: 'om-motor', emoji: '🛵', nameEl: 'Το μηχανάκι', promptEl: 'Κάνε το μηχανάκι με τα χείλη: μπρρρ! Όσο κρατάει η ανάσα σου.', reps: [3, 4], holdSeconds: 3, beatEl: 'Μπρρρ' },
  { id: 'om-paint', emoji: '🖌️', nameEl: 'Η γλώσσα πινέλο', promptEl: 'Η γλώσσα είναι πινέλο: βάψε τον ουρανό του στόματος, από μπροστά προς τα πίσω.', reps: [4, 6], beatEl: 'Βάφω' },
  { id: 'om-stick', emoji: '🧲', nameEl: 'Κολλημένη γλώσσα', promptEl: 'Κόλλησε όλη τη γλώσσα στον ουρανό του στόματος και άνοιξε λίγο το στόμα. Κράτα!', reps: [3, 5], holdSeconds: 3, beatEl: 'Κράτα' },
];

/* ---------------------------- 22. Καθαρή Προφορά ---------------------------- */

export interface WordItem {
  word: string;
  emoji: string;
}

export interface TargetSound {
  id: string;
  /** Όπως φαίνεται στο κουμπί. */
  letter: string;
  /** Πώς το λέει η φωνή μόνο του (επιμήκης ήχος όπου γίνεται). */
  isolatedEl: string;
  /** Βοήθεια για το «πού μπαίνει η γλώσσα». */
  tipEl: string;
  syllables: string[];
  initial: WordItem[];
  medial: WordItem[];
  phraseEl: string;
  /** Συριστικό (για την ένδειξη «σφύριγμα» στο μικρόφωνο). */
  sibilant?: boolean;
}

export const TARGET_SOUNDS: TargetSound[] = [
  {
    id: 's', letter: 'Σ', isolatedEl: 'σσσσσ', sibilant: true,
    tipEl: 'Δόντια κοντά, γλώσσα πίσω από τα κάτω δόντια, σαν φιδάκι που σφυρίζει.',
    syllables: ['σα', 'σε', 'σι', 'σο', 'σου'],
    initial: [{ word: 'σοκολάτα', emoji: '🍫' }, { word: 'σαλιγκάρι', emoji: '🐌' }, { word: 'σύννεφο', emoji: '☁️' }],
    medial: [{ word: 'θάλασσα', emoji: '🌊' }, { word: 'μουσική', emoji: '🎵' }, { word: 'φασόλι', emoji: '🫘' }],
    phraseEl: 'Ο σκύλος παίζει στη θάλασσα.',
  },
  {
    id: 'r', letter: 'Ρ', isolatedEl: 'ρρρρ',
    tipEl: 'Η άκρη της γλώσσας χτυπά γρήγορα πίσω από τα πάνω δόντια, σαν μηχανάκι.',
    syllables: ['ρα', 'ρε', 'ρι', 'ρο', 'ρου'],
    initial: [{ word: 'ρούχα', emoji: '👕' }, { word: 'ρόδα', emoji: '🛞' }, { word: 'ρινόκερος', emoji: '🦏' }],
    medial: [{ word: 'καρότο', emoji: '🥕' }, { word: 'ψάρι', emoji: '🐟' }, { word: 'φεγγάρι', emoji: '🌙' }],
    phraseEl: 'Το ψάρι τρώει ένα καρότο.',
  },
  {
    id: 'l', letter: 'Λ', isolatedEl: 'λλλλ',
    tipEl: 'Η άκρη της γλώσσας ακουμπά πίσω από τα πάνω δόντια και ο αέρας βγαίνει από τα πλάγια.',
    syllables: ['λα', 'λε', 'λι', 'λο', 'λου'],
    initial: [{ word: 'λεμόνι', emoji: '🍋' }, { word: 'λουλούδι', emoji: '🌸' }, { word: 'λύκος', emoji: '🐺' }],
    medial: [{ word: 'μήλο', emoji: '🍎' }, { word: 'γάλα', emoji: '🥛' }, { word: 'μπάλα', emoji: '⚽' }],
    phraseEl: 'Η Λίνα πίνει γάλα με μέλι.',
  },
  {
    id: 'th', letter: 'Θ', isolatedEl: 'θθθθ',
    tipEl: 'Η γλώσσα βγαίνει λίγο ανάμεσα στα δόντια και φυσάς απαλά.',
    syllables: ['θα', 'θε', 'θι', 'θο', 'θου'],
    initial: [{ word: 'θάλασσα', emoji: '🌊' }, { word: 'θησαυρός', emoji: '💎' }, { word: 'θρανίο', emoji: '🪑' }],
    medial: [{ word: 'μαθητής', emoji: '🧑‍🎓' }, { word: 'άνθος', emoji: '🌼' }, { word: 'καθρέφτης', emoji: '🪞' }],
    phraseEl: 'Ο μαθητής βρήκε θησαυρό στη θάλασσα.',
  },
  {
    id: 'k', letter: 'Κ', isolatedEl: 'κα κα κα',
    tipEl: 'Το πίσω μέρος της γλώσσας ανεβαίνει και ακουμπά ψηλά πίσω στο στόμα.',
    syllables: ['κα', 'κε', 'κι', 'κο', 'κου'],
    initial: [{ word: 'κότα', emoji: '🐔' }, { word: 'κουνέλι', emoji: '🐰' }, { word: 'καρέκλα', emoji: '🪑' }],
    medial: [{ word: 'μακαρόνια', emoji: '🍝' }, { word: 'βάρκα', emoji: '🚣' }, { word: 'σοκολάτα', emoji: '🍫' }],
    phraseEl: 'Η κότα κάθεται στην καρέκλα.',
  },
  {
    id: 'g', letter: 'Γ', isolatedEl: 'γγγγ',
    tipEl: 'Το πίσω μέρος της γλώσσας πλησιάζει ψηλά πίσω και ο αέρας περνά σιγά.',
    syllables: ['γα', 'γε', 'γι', 'γο', 'γου'],
    initial: [{ word: 'γάτα', emoji: '🐱' }, { word: 'γάλα', emoji: '🥛' }, { word: 'γουρούνι', emoji: '🐷' }],
    medial: [{ word: 'τηγάνι', emoji: '🍳' }, { word: 'πάγος', emoji: '🧊' }, { word: 'αγόρι', emoji: '👦' }],
    phraseEl: 'Η γάτα πίνει γάλα.',
  },
  {
    id: 'z', letter: 'Ζ', isolatedEl: 'ζζζζ', sibilant: true,
    tipEl: 'Όπως το Σ, αλλά με φωνή: σαν μέλισσα που βουίζει.',
    syllables: ['ζα', 'ζε', 'ζι', 'ζο', 'ζου'],
    initial: [{ word: 'ζέβρα', emoji: '🦓' }, { word: 'ζακέτα', emoji: '🧥' }, { word: 'ζάρι', emoji: '🎲' }],
    medial: [{ word: 'τραπέζι', emoji: '🍽️' }, { word: 'κουζίνα', emoji: '🍳' }, { word: 'βάζο', emoji: '🏺' }],
    phraseEl: 'Η ζέβρα φοράει ζακέτα.',
  },
  {
    id: 'x', letter: 'Χ', isolatedEl: 'χχχχ',
    tipEl: 'Ο αέρας περνά τρίβοντας ψηλά πίσω στο στόμα, σαν να ζεσταίνεις τα χέρια σου.',
    syllables: ['χα', 'χε', 'χι', 'χο', 'χου'],
    initial: [{ word: 'χελώνα', emoji: '🐢' }, { word: 'χέρι', emoji: '✋' }, { word: 'χιόνι', emoji: '❄️' }],
    medial: [{ word: 'βροχή', emoji: '🌧️' }, { word: 'αχλάδι', emoji: '🍐' }, { word: 'ταχυδρόμος', emoji: '📮' }],
    phraseEl: 'Η χελώνα βλέπει το χιόνι.',
  },
  {
    id: 'ts', letter: 'Τσ', isolatedEl: 'τσ τσ τσ', sibilant: true,
    tipEl: 'Η γλώσσα ακουμπά πίσω από τα δόντια και μετά αφήνει τον αέρα να σφυρίξει: τσ!',
    syllables: ['τσα', 'τσε', 'τσι', 'τσο', 'τσου'],
    initial: [{ word: 'τσάντα', emoji: '👜' }, { word: 'τσουλήθρα', emoji: '🛝' }, { word: 'τσίχλα', emoji: '🍬' }],
    medial: [{ word: 'παπούτσι', emoji: '👟' }, { word: 'κουτσό', emoji: '🦶' }, { word: 'πασχαλίτσα', emoji: '🐞' }],
    phraseEl: 'Βάζω το τσάι στην τσάντα.',
  },
  {
    id: 'd', letter: 'Δ', isolatedEl: 'δδδδ',
    tipEl: 'Η γλώσσα ακουμπά απαλά τα πάνω δόντια, με φωνή.',
    syllables: ['δα', 'δε', 'δι', 'δο', 'δου'],
    initial: [{ word: 'δέντρο', emoji: '🌳' }, { word: 'δελφίνι', emoji: '🐬' }, { word: 'δάχτυλο', emoji: '☝️' }],
    medial: [{ word: 'κουδούνι', emoji: '🔔' }, { word: 'παιδί', emoji: '🧒' }, { word: 'κλειδί', emoji: '🔑' }],
    phraseEl: 'Το δελφίνι χτυπά το κουδούνι.',
  },
];

export type ArticulationStep = 'isolated' | 'syllables' | 'initial' | 'medial' | 'phrase';

export interface ArticulationRound {
  step: ArticulationStep;
  stepLabelEl: string;
  /** Τι λέει η φωνή ως πρότυπο. */
  modelEl: string;
  /** Τι βλέπει το παιδί (μεγάλα γράμματα). */
  displayEl: string;
  emoji?: string;
  /** Αναμενόμενες συλλαβές (για την ένδειξη του μικροφώνου). */
  expectedSyllables: number;
}

/** Μετρά συλλαβές στα ελληνικά (φωνήεντα/δίψηφα φωνήεντα) — για την ένδειξη, όχι για βαθμό. */
export function countGreekSyllables(text: string): number {
  let n = 0;
  for (const raw of text.toLowerCase().split(/[^α-ωάέήίόύώϊϋΐΰς]+/).filter(Boolean)) {
    // Δίφθογγοι: το 1ο γράμμα άτονο (τσάι = 2 συλλαβές, παιδί = 2)
    let w = raw.replace(/(ο[υύ]|α[ιί]|ε[ιί]|ο[ιί]|υ[ιί]|α[υύ]|ε[υύ])/g, 'A');
    // Συνίζηση: άτονο ι πριν από φωνήεν (χιόνι = 2, θρανίο = 3)
    w = w.replace(/ι(?=[αεηουωάέήόύώA])/g, '');
    n += (w.match(/[αεηιουωάέήίόύώϊϋΐΰA]/g) ?? []).length;
  }
  return n;
}

/** Η «σκάλα» για έναν ήχο: 5 βήματα (οι μικροί σταματούν στις λέξεις). */
export function articulationLadder(sound: TargetSound, ageBand: AgeBandId, seed = 0): ArticulationRound[] {
  const pick = <T,>(arr: T[]) => arr[Math.abs(seed) % arr.length];
  const ini = pick(sound.initial);
  const med = pick(sound.medial);
  const ini2 = sound.initial[(Math.abs(seed) + 1) % sound.initial.length];
  const syl = sound.syllables.slice(0, YOUNG.has(ageBand) ? 3 : 5).join(', ');
  const rounds: ArticulationRound[] = [
    { step: 'isolated', stepLabelEl: 'Ο ήχος μόνος του', modelEl: sound.isolatedEl, displayEl: sound.letter, expectedSyllables: 1 },
    { step: 'syllables', stepLabelEl: 'Συλλαβές', modelEl: syl, displayEl: syl, expectedSyllables: syl.split(',').length },
    { step: 'initial', stepLabelEl: 'Στην αρχή της λέξης', modelEl: ini.word, displayEl: ini.word, emoji: ini.emoji, expectedSyllables: countGreekSyllables(ini.word) },
    { step: 'medial', stepLabelEl: 'Στη μέση της λέξης', modelEl: med.word, displayEl: med.word, emoji: med.emoji, expectedSyllables: countGreekSyllables(med.word) },
  ];
  rounds.push(
    YOUNG.has(ageBand)
      ? { step: 'initial', stepLabelEl: 'Ακόμα μία λέξη', modelEl: ini2.word, displayEl: ini2.word, emoji: ini2.emoji, expectedSyllables: countGreekSyllables(ini2.word) }
      : { step: 'phrase', stepLabelEl: 'Σε πρόταση', modelEl: sound.phraseEl, displayEl: sound.phraseEl, expectedSyllables: countGreekSyllables(sound.phraseEl) }
  );
  return rounds;
}

/* ---------------------------- 23. Θέατρο της Φωνής ---------------------------- */

export type DictionKind = 'vowels' | 'twister' | 'emotion' | 'volume' | 'rhythm';

export interface DictionRound {
  kind: DictionKind;
  emoji: string;
  titleEl: string;
  promptEl: string;
  /** Το κείμενο που λέει το παιδί. */
  lineEl: string;
  /** Αργά → γρήγορα, ή συναισθήματα, ή επίπεδα έντασης: τα «βήματα» του γύρου. */
  stepsEl: string[];
  /** Για ένταση: ζώνη-στόχος ανά βήμα. */
  volumeTargets?: ('quiet' | 'normal' | 'stage')[];
}

export const TONGUE_TWISTERS: { lineEl: string; young: boolean; source: 'παραδοσιακός' | 'SynapsePlay' }[] = [
  { lineEl: 'Σαράντα σαλιγκάρια σέρνονται στη σάλα.', young: true, source: 'SynapsePlay' },
  { lineEl: 'Ο Ρένος ο ρινόκερος ρίχνει ρύζι στο ρυάκι.', young: true, source: 'SynapsePlay' },
  { lineEl: 'Λίγα λεμόνια λαχταράει η Λίνα.', young: true, source: 'SynapsePlay' },
  { lineEl: 'Η κότα κάθεται και κακαρίζει κάτω από την καρυδιά.', young: true, source: 'SynapsePlay' },
  { lineEl: 'Ο παπάς ο παχύς έφαγε παχιά φακή.', young: false, source: 'παραδοσιακός' },
  { lineEl: 'Άσπρη πέτρα ξέξασπρη κι απ’ τον ήλιο ξεξασπρότερη.', young: false, source: 'παραδοσιακός' },
  { lineEl: 'Τρία τρένα τρέχουν τρελά στις τρεις τρίγωνες γέφυρες.', young: false, source: 'SynapsePlay' },
  { lineEl: 'Ζουζουνίζει η ζωηρή ζέβρα στη ζεστή ζούγκλα.', young: false, source: 'SynapsePlay' },
];

const EMOTION_LINES = ['Έχω ένα καινούριο μολύβι.', 'Σήμερα βρέχει πολύ.', 'Ήρθε η γιαγιά!'];

export function dictionRounds(ageBand: AgeBandId, seed = 0): DictionRound[] {
  const young = YOUNG.has(ageBand);
  const tw = TONGUE_TWISTERS.filter((t) => (young ? t.young : true));
  const twister = tw[Math.abs(seed) % tw.length].lineEl;
  const emo = EMOTION_LINES[Math.abs(seed) % EMOTION_LINES.length];
  return [
    {
      kind: 'vowels',
      emoji: '🎭',
      titleEl: 'Ζέσταμα του ηθοποιού',
      promptEl: 'Οι ηθοποιοί ζεσταίνουν το στόμα: πες τα φωνήεντα, ανοίγοντας πολύ το στόμα!',
      lineEl: 'Α – Ε – Ι – Ο – ΟΥ',
      stepsEl: ['Α… Ε… Ι… Ο… ΟΥ (αργά)', 'Α-Ε-Ι-Ο-ΟΥ (κανονικά)'],
    },
    {
      kind: 'twister',
      emoji: '🌀',
      titleEl: 'Γλωσσοδέτης',
      promptEl: 'Πες τον γλωσσοδέτη πρώτα πολύ αργά και καθαρά. Μετά λίγο πιο γρήγορα.',
      lineEl: twister,
      stepsEl: young ? ['Αργά σαν χελώνα 🐢', 'Κανονικά 🚶'] : ['Αργά σαν χελώνα 🐢', 'Κανονικά 🚶', 'Γρήγορα, αλλά καθαρά 🐇'],
    },
    {
      kind: 'emotion',
      emoji: '😊',
      titleEl: 'Μία φράση, πολλά συναισθήματα',
      promptEl: 'Πες την ίδια φράση με διαφορετικό συναίσθημα κάθε φορά.',
      lineEl: emo,
      stepsEl: young ? ['Με χαρά 😄', 'Με λύπη 😢'] : ['Με χαρά 😄', 'Με λύπη 😢', 'Με έκπληξη 😮'],
    },
    {
      kind: 'volume',
      emoji: '📢',
      titleEl: 'Ψίθυρος – κανονικά – σκηνή',
      promptEl: 'Πες τη φράση ψιθυριστά, μετά κανονικά, μετά σαν να είσαι στη σκηνή του θεάτρου. Χωρίς να φωνάζεις!',
      lineEl: 'Καλησπέρα σε όλους!',
      stepsEl: ['Ψίθυρος 🤫', 'Κανονικά 🙂', 'Φωνή σκηνής 🎭'],
      volumeTargets: ['quiet', 'normal', 'stage'],
    },
    {
      kind: 'rhythm',
      emoji: '👏',
      titleEl: 'Ο ρυθμός των συλλαβών',
      promptEl: 'Πες τη φράση και χτύπα ένα παλαμάκι σε κάθε συλλαβή.',
      lineEl: young ? 'Πα-πού-τσια και κάλ-τσες.' : 'Το πρω-ί πί-νω γά-λα με μέ-λι.',
      stepsEl: ['Με παλαμάκια 👏'],
    },
  ];
}
