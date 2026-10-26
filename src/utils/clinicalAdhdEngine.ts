import type {
  AgeBandId,
  AdaptiveScenarioId,
  HintLevel,
  SilentAdaptationProfile,
} from '../types/domain';

export interface AgeAndPerformanceDifficultyProfile {
  tierLevel: 1 | 2 | 3 | 4 | 5;
  ageTierLabelEl: string;
  performanceStateLabelEl: string;
  isSimplified: boolean; // true for 4-5, hintLevel >= 2, or distractorReductionRatio >= 0.5
  isGuided: boolean; // true for 4-5, 5-6, hintLevel >= 1, or autoHintBoost
  isAdvancedMastery: boolean; // true for 8-10/10-12 or enrichChallenge
  cptIntervalMs: number; // Wait Signal (09) automatic stream cadence
  memoryObservationMs: number; // Visual Memory (03) automatic card hide countdown
  freezeHoldMs: number; // Move & Freeze (07) automatic statue hold window
  rhythmPulseIntervalMs: number; // Copy Animal (10) & Proprioception (17) automatic metronome
}

/**
 * Computes age-specific and real-time performance-adapted difficulty parameters
 * across all 20 activities (4-5, 5-6, 6-8, 8-10, 10-12 years + live staircase).
 */
export function getAgeAndPerformanceDifficulty(
  ageBand: AgeBandId,
  adaptiveProfile: SilentAdaptationProfile,
  hintLevel: HintLevel = 0
): AgeAndPerformanceDifficultyProfile {
  const baseTierMap: Record<AgeBandId, 1 | 2 | 3 | 4 | 5> = {
    '4-5': 1,
    '5-6': 2,
    '6-8': 3,
    '8-10': 4,
    '10-12': 5,
  };

  const baseTier = baseTierMap[ageBand] ?? 3;
  const isScaffoldingActive =
    hintLevel >= 1 ||
    adaptiveProfile.autoHintBoost ||
    adaptiveProfile.distractorReductionRatio >= 0.3;
  const isMasteryBoost =
    hintLevel === 0 && !isScaffoldingActive && adaptiveProfile.enrichChallenge;

  const effectiveTier = Math.max(
    1,
    Math.min(5, baseTier + (isMasteryBoost ? 1 : isScaffoldingActive ? -1 : 0))
  ) as 1 | 2 | 3 | 4 | 5;

  const ageTierLabels: Record<AgeBandId, string> = {
    '4-5': 'Βαθμίδα 1 (4–5 ετών: Αισθητηριοκινητική Απλοποίηση & Μεγάλοι Στόχοι)',
    '5-6': 'Βαθμίδα 2 (5–6 ετών: Προ-Ακαδημαϊκή Εστίαση & Οπτική Καθοδήγηση)',
    '6-8': 'Βαθμίδα 3 (6–8 ετών: Βασική Εκτελεστική Λειτουργία & Αυτοέλεγχος)',
    '8-10': 'Βαθμίδα 4 (8–10 ετών: Γνωστική Ευελιξία & Αυξημένη Μνήμη)',
    '10-12': 'Βαθμίδα 5 (10–12 ετών: Σύνθετη Αυτορρύθμιση & Μεταγνώση)',
  };

  let performanceStateLabelEl = '⚖️ Ισορροπημένη Ροή (Ζώνη Βέλτιστης Πρόκλησης)';
  if (hintLevel >= 2 || adaptiveProfile.distractorReductionRatio >= 0.5) {
    performanceStateLabelEl =
      '🛡️ Ενισχυμένη Υποστήριξη Ενεργή (Μείωση Περισπασμών & Απλοποίηση Βημάτων)';
  } else if (isScaffoldingActive) {
    performanceStateLabelEl =
      '💡 Καθοδηγούμενη Προσαρμογή Ενεργή (Οπτική Επισήμανση & Ήρεμος Ρυθμός)';
  } else if (isMasteryBoost) {
    performanceStateLabelEl =
      '🚀 Προσαρμογή Mastery Ενεργή (+1 Επίπεδο Πρόκλησης λόγω Άριστης Επίδοσης)';
  }

  const isSimplified =
    ageBand === '4-5' || hintLevel >= 2 || adaptiveProfile.distractorReductionRatio >= 0.5;
  const isGuided =
    ageBand === '4-5' ||
    ageBand === '5-6' ||
    hintLevel >= 1 ||
    adaptiveProfile.autoHintBoost;
  const isAdvancedMastery =
    !isSimplified &&
    !isScaffoldingActive &&
    (ageBand === '8-10' || ageBand === '10-12' || adaptiveProfile.enrichChallenge);

  const cptMap: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 2600,
    2: 2400,
    3: 2100,
    4: 1800,
    5: 1550,
  };

  const memoryMap: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 4500,
    2: 4000,
    3: 3400,
    4: 2800,
    5: 2300,
  };

  const freezeMap: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 2600,
    2: 2800,
    3: 3000,
    4: 3300,
    5: 3600,
  };

  return {
    tierLevel: effectiveTier,
    ageTierLabelEl: ageTierLabels[ageBand],
    performanceStateLabelEl,
    isSimplified,
    isGuided,
    isAdvancedMastery,
    cptIntervalMs: cptMap[effectiveTier],
    memoryObservationMs: memoryMap[effectiveTier],
    freezeHoldMs: freezeMap[effectiveTier],
    rhythmPulseIntervalMs: effectiveTier <= 2 ? 2000 : 1700,
  };
}

export interface ClinicalTrialReference {
  id: string;
  authorsAndYear: string;
  journalOrSource: string;
  clinicalFocusEl: string;
  engineImplementationEl: string;
  specialtiesInvolvedEl: string[];
}

/**
 * Evidence-Based Clinical Studies & Randomized Controlled Trials (RCTs)
 * underpinning the SynapsePlay FocusEngine 5+ Architecture.
 */
export const CLINICAL_STUDIES_AND_TRIALS: ClinicalTrialReference[] = [
  {
    id: 'barkley-ef-1997',
    authorsAndYear: 'Barkley, R. A. (1997, 2015)',
    journalOrSource: 'Psychological Bulletin / Guilford Press (Executive Functions Model)',
    clinicalFocusEl: 'Υβριδικό Μοντέλο Εκτελεστικών Λειτουργιών & Αναστολής Συμπεριφοράς στη ΔΕΠΥ',
    engineImplementationEl:
      'Ενσωματώνει τους 4 πυλώνες του Barkley: (1) Αναστολή Παρόρμησης (Go/No-Go & 400ms Anti-Frustration Debounce), (2) Μη-Λεκτική & Λεκτική Εργαζόμενη Μνήμη, (3) Αυτορρύθμιση Συναισθήματος/Εγρήγορσης (Smooth Landing) και (4) Ανασύνθεση/Πράξη.',
    specialtiesInvolvedEl: ['Παιδοψυχίατροι', 'Παιδοψυχολόγοι', 'Εργοθεραπευτές'],
  },
  {
    id: 'kollins-stars-adhd-2020',
    authorsAndYear: 'Kollins, S. H. et al. (2020) — STARS-ADHD RCT (AKL-T01)',
    journalOrSource: 'The Lancet Digital Health (Multicenter Randomized Controlled Trial)',
    clinicalFocusEl: 'Δυναμικός Αλγόριθμος Κλιμάκωσης (Adaptive Staircase) στη Ζώνη Βέλτιστης Πρόκλησης (75%–85%)',
    engineImplementationEl:
      'Η Αόρατη Μηχανή Σεναρίων προσαρμόζει σε πραγματικό χρόνο τους περισπασμούς, την ταχύτητα και τα επίπεδα υποστήριξης (scaffolding) ώστε το παιδί να μην εγκαταλείπει από ανία ή ματαίωση.',
    specialtiesInvolvedEl: ['Παιδοψυχίατροι', 'Παιδοψυχολόγοι'],
  },
  {
    id: 'sonuga-barke-triple-2010',
    authorsAndYear: 'Sonuga-Barke, E., Bitsakou, P., & Thompson, M. (2010)',
    journalOrSource: 'Journal of the American Academy of Child & Adolescent Psychiatry (JAACAP)',
    clinicalFocusEl: 'Μοντέλο Τριπλού Μονοπατιού ΔΕΠΥ (Εκτελεστικός Έλεγχος, Αποστροφή Αναμονής, Χρονική Επεξεργασία)',
    engineImplementationEl:
      'Αντιμετωπίζει την Αποστροφή Αναμονής (Delay Aversion) με άμεση μη-τιμωρητική ανατροφοδότηση και τη δυσκολία Χρονικής Επεξεργασίας μέσω Μουσικοκινητικού Συγχρονισμού (Orff/Dalcroze).',
    specialtiesInvolvedEl: ['Παιδοψυχίατροι', 'Μουσικοκινητική Αγωγή', 'Λογοθεραπευτές'],
  },
  {
    id: 'klingberg-wm-rct-2005',
    authorsAndYear: 'Klingberg, T. et al. (2005)',
    journalOrSource: 'JAACAP (Multicenter RCT of Computerized Working Memory Training)',
    clinicalFocusEl: 'Κλινική Ενδυνάμωση Οπτικοχωρικής & Ακουστικής-Διαδοχικής Εργαζόμενης Μνήμης',
    engineImplementationEl:
      'Κλιμακούμενη χωρητικότητα μνημονικών στοιχείων ανά ηλικιακή ζώνη (2 έως 6 στοιχεία) με πολυαισθητηριακή (οπτική + ακουστική) κωδικοποίηση.',
    specialtiesInvolvedEl: ['Παιδοψυχολόγοι', 'Λογοθεραπευτές', 'Εργοθεραπευτές'],
  },
  {
    id: 'schaaf-asi-porges-2014',
    authorsAndYear: 'Schaaf, R. C. et al. (2014) ASI® RCT & Porges, S. W. (2011) Polyvagal Theory',
    journalOrSource: 'Journal of Autism and Developmental Disorders / Norton (Polyvagal Theory)',
    clinicalFocusEl: 'Αισθητηριακή Ολοκλήρωση (Ayres SI), Ιδιοδεκτική Βαθιά Πίεση & Ακουστική Πνευμονογαστρική Ρύθμιση',
    engineImplementationEl:
      'Συνδυάζει ασκήσεις «Βαριάς Μυϊκής Εργασίας» (Heavy Work / Ισομετρική Πίεση) με προσωδιακή φωνητική εκφώνηση (0.86–0.94x) και αρμονικές συχνότητες 440Hz/554Hz.',
    specialtiesInvolvedEl: ['Εργοθεραπευτές', 'Φυσίατροι', 'Θεατρική Αγωγή'],
  },
  {
    id: 'meichenbaum-cbt-2020',
    authorsAndYear: 'Meichenbaum & Goodman (1971) / Antshel & Barkley (2020)',
    journalOrSource: 'Child and Adolescent Psychiatric Clinics of North America',
    clinicalFocusEl: 'Εκπαίδευση Εσωτερικού Λόγου Αυτοκαθοδήγησης (Verbal Self-Instructional Training) & Οικογενειακή Γενίκευση',
    engineImplementationEl:
      'Ενσωματώνει σύντομα λεκτικά πρότυπα αυτοκαθοδήγησης («Σταματώ – Παρατηρώ – Αναπνέω – Διαλέγω») και γέφυρες γενίκευσης στον πραγματικό χώρο του σπιτιού.',
    specialtiesInvolvedEl: ['Παιδοψυχολόγοι', 'Κοινωνικοί Λειτουργοί', 'Λογοθεραπευτές'],
  },
];

export interface PsychometricStaircaseSnapshot {
  optimalZoneLabelEl: string;
  innerSpeechCueEl: string;
  clinicalTeamNoteEl: string;
}

/**
 * Computes real-time clinical executive function telemetry based on the child's
 * current interaction metrics and active scenario.
 */
export function computeClinicalStaircaseSnapshot(params: {
  ageBand: AgeBandId;
  scenarioId: AdaptiveScenarioId;
  completedRounds: number;
  gentleNudges: number;
  hintsUsed: number;
  absorbedImpulsiveTaps: number;
  variantNumber: number;
}): PsychometricStaircaseSnapshot {
  const {
    ageBand,
    scenarioId,
    completedRounds,
    gentleNudges,
    hintsUsed,
    absorbedImpulsiveTaps,
    variantNumber,
  } = params;

  // NOTE: the former "inhibitoryControlPercent / attentionalStabilityPercent" were invented
  // formulas (floored at 55%/60%) and have been removed. Use computeAccuracy() on real data.
  void absorbedImpulsiveTaps;
  void hintsUsed;

  const innerSpeechPools: Record<AdaptiveScenarioId, string[]> = {
    SCENARIO_BALANCED_FLOW: [
      '💭 Εσωτερικός Λόγος: «Κοιτάζω ήρεμα τον στόχο και διαλέγω με σιγουριά!»',
      '💭 Εσωτερικός Λόγος: «Παρατηρώ με ηρεμία, βρίσκω το σωστό και προχωρώ!»',
      '💭 Εσωτερικός Λόγος: «Το μυαλό μου είναι συγκεντρωμένο — κάνω ένα βήμα τη φορά!»',
    ],
    SCENARIO_IMPULSIVE_RAPID: [
      '💭 Εσωτερικός Λόγος: «Σταματώ τα χέρια — Παίρνω ανάσα — Κοιτάζω — Μετά πατάω!»',
      '💭 Εσωτερικός Λόγος: «Περιμένω μία ανάσα πριν αγγίξω την οθόνη!»',
      '💭 Εσωτερικός Λόγος: «Τα μάτια μου ελέγχουν πρώτα, τα δάχτυλά μου ακολουθούν ήρεμα!»',
    ],
    SCENARIO_INATTENTIVE_DISTRACTIBLE: [
      '💭 Εσωτερικός Λόγος: «Φέρνω τα μάτια μου πίσω στο κέντρο, ένα βήμα τη φορά!»',
      '💭 Εσωτερικός Λόγος: «Αφήνω όσα δεν χρειάζομαι και κοιτάζω μόνο τον στόχο μου!»',
      '💭 Εσωτερικός Λόγος: «Ξαναβρίσκω τον ρυθμό μου ήρεμα και καθαρά!»',
    ],
    SCENARIO_FRUSTRATION_RECOVERY: [
      '💭 Εσωτερικός Λόγος: «Δεν πειράζει αν μπερδευτώ! Κάθε προσπάθεια κάνει το μυαλό μου πιο δυνατό!»',
      '💭 Εσωτερικός Λόγος: «Παίρνω μια βαθιά ανάσα — μαθαίνω χωρίς καμία βιασύνη!»',
      '💭 Εσωτερικός Λόγος: «Είμαι ασφαλής εδώ. Δοκιμάζω ξανά με τον δικό μου ρυθμό!»',
    ],
    SCENARIO_KINETIC_SEEKING: [
      '💭 Εσωτερικός Λόγος: «Πατάω σταθερά τα πόδια στο πάτωμα, ισιώνω την πλάτη και συνεχίζω!»',
      '💭 Εσωτερικός Λόγος: «Το σώμα μου με βοηθά να συγκεντρωθώ — νιώθω τη δύναμή μου!»',
      '💭 Εσωτερικός Λόγος: «Χαλαρώνω τους ώμους μου και κρατώ σταθερό ρυθμό!»',
    ],
    SCENARIO_LANGUAGE_SCAFFOLD: [
      '💭 Εσωτερικός Λόγος: «Ακούω καθαρά κάθε λέξη και τη λέω σιγά-σιγά από μέσα μου!»',
      '💭 Εσωτερικός Λόγος: «Σπάω τη λέξη σε μικρά κομμάτια και την καταλαβαίνω αμέσως!»',
      '💭 Εσωτερικός Λόγος: «Ακούω πρώτα όλη την πρόταση και μετά απαντώ!»',
    ],
    SCENARIO_MASTERY_CHALLENGE: [
      '💭 Εσωτερικός Λόγος: «Έχω εξαιρετική συγκέντρωση! Είμαι έτοιμος για τη νέα πρόκληση!»',
      '💭 Εσωτερικός Λόγος: «Σκέφτομαι σαν αληθινός εξερευνητής και βρίσκω τη λύση!»',
      '💭 Εσωτερικός Λόγος: «Η προσοχή μου είναι δυνατή — μπορώ να λύσω και τα πιο σύνθετα μοτίβα!»',
    ],
  };

  const scenarioCues = innerSpeechPools[scenarioId];
  const cueIdx = Math.max(0, variantNumber - 1 + completedRounds) % scenarioCues.length;

  return {
    optimalZoneLabelEl: `Ζώνη Βέλτιστης Πρόκλησης (ZPD ${ageBand} ετών) • Σετ #${variantNumber}`,
    innerSpeechCueEl: scenarioCues[cueIdx],
    clinicalTeamNoteEl:
      gentleNudges === 0
        ? 'Χωρίς λάθη σε αυτή τη δραστηριότητα μέχρι τώρα.'
        : `Λάθη σε αυτή τη δραστηριότητα: ${gentleNudges}.`,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Selects `count` items from an expanded clinical activity pool based on `sessionSeed`.
 * - When `sessionSeed === 0`, returns the first `count` items in exact canonical order
 *   so automated unit tests remain 100% deterministic.
 * - When `sessionSeed > 0` (on replay, «Νέα Παραλλαγή» click, or subsequent sessions),
 *   rotates through the entire pool with cycle-aware coprime strides so the child
 *   continuously experiences fresh, non-repeating combinations!
 */
export function selectSessionRounds<T>(pool: T[], count: number, sessionSeed: number = 0): T[] {
  if (pool.length <= count || sessionSeed <= 0) {
    return pool.slice(0, count);
  }
  const n = pool.length;
  const cycle = Math.floor((sessionSeed * count) / n);
  const startOffset = ((sessionSeed * count) + cycle) % n;

  // On first pass through the pool (cycle === 0, including sessionSeed === 1), step by 1
  // so contiguous round blocks (3..5, 6..8, 9..11) are visited cleanly without overlap.
  // On subsequent cycles (cycle >= 1), use a coprime stride so new cross-combinations appear!
  let stride = 1;
  if (cycle > 0) {
    const candidateStrides = [5, 7, 11, 13, 3, 2];
    for (let s = 0; s < candidateStrides.length; s++) {
      const candidate = candidateStrides[(cycle + s) % candidateStrides.length];
      if (gcd(candidate, n) === 1) {
        stride = candidate;
        break;
      }
    }
  }

  const result: T[] = [];
  const usedIndices = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx = (startOffset + i * stride) % n;
    while (usedIndices.has(idx)) {
      idx = (idx + 1) % n;
    }
    usedIndices.add(idx);
    result.push(pool[idx]);
  }
  return result;
}

/**
 * Deterministically rotates an options/cards array for `sessionSeed > 0` so that the target item
 * is not always in the same visual position across replays, while keeping `sessionSeed === 0`
 * 100% unchanged for unit tests.
 */
export function rotateOptionsForSession<T>(
  options: T[],
  sessionSeed: number = 0,
  roundIndex: number = 0
): T[] {
  if (sessionSeed <= 0 || options.length <= 1) {
    return options;
  }
  const n = options.length;
  const shift = (sessionSeed * 2 + roundIndex + 1) % n;
  if (shift === 0) {
    return [...options].reverse();
  }
  return [...options.slice(shift), ...options.slice(0, shift)];
}
