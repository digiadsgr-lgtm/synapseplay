import type { AgeBandId } from '../data/ageProtocols';

export type AdaptiveScenarioId =
  | 'SCENARIO_BALANCED_FLOW'
  | 'SCENARIO_IMPULSIVE_RAPID'
  | 'SCENARIO_INATTENTIVE_DISTRACTIBLE'
  | 'SCENARIO_FRUSTRATION_RECOVERY'
  | 'SCENARIO_KINETIC_SEEKING'
  | 'SCENARIO_LANGUAGE_SCAFFOLD'
  | 'SCENARIO_MASTERY_CHALLENGE';

export interface ChildInteractionTelemetry {
  ageBand: AgeBandId;
  completedRoundsCount: number;
  gentleNudgesInCurrentActivity: number;
  hintsUsedInCurrentActivity: number;
  absorbedImpulsiveTaps: number;
  lastResponseTimeMs: number;
  seatedModeActive: boolean;
}

export interface SilentAdaptationProfile {
  scenarioId: AdaptiveScenarioId;
  internalTitleEl: string; // Shown ONLY in Parent/Clinical Area, never to the child
  clinicalRationaleEl: string;
  distractorReductionRatio: number; // 0.0 (normal) to 0.5 (fewer distractors)
  autoHintBoost: boolean; // silently provides visual anchor if child is struggling
  speechRate: number; // 0.84 (slower for language scaffold) to 0.95
  preActionCalmDelayMs: number; // gentle settle pause for rapid impulsive responders
  enrichChallenge: boolean; // adds an extra step/attribute when child shows effortless mastery
}

export const ADAPTIVE_SCENARIO_CATALOG: Record<
  AdaptiveScenarioId,
  Omit<SilentAdaptationProfile, 'scenarioId'>
> = {
  SCENARIO_BALANCED_FLOW: {
    internalTitleEl: 'Ισορροπημένη Ροή (Balanced Executive Flow)',
    clinicalRationaleEl:
      'Το παιδί ανταποκρίνεται με σταθερό ρυθμό και ικανοποιητική συγκέντρωση. Διατηρείται η τυπική βαθμίδα της ηλικίας του.',
    distractorReductionRatio: 0,
    autoHintBoost: false,
    speechRate: 0.92,
    preActionCalmDelayMs: 0,
    enrichChallenge: false,
  },
  SCENARIO_IMPULSIVE_RAPID: {
    internalTitleEl: 'Παρορμητική Ταχεία Απόκριση (Impulsive / Rapid-Tap Modulation)',
    clinicalRationaleEl:
      'Ανιχνεύθηκαν γρήγορα/διπλά πατήματα (<400ms). Ενεργοποιείται αόρατα ήπιος ρυθμιστής ρυθμού και ενίσχυση των σημάτων αναστολής (Go/No-Go).',
    distractorReductionRatio: 0.2,
    autoHintBoost: false,
    speechRate: 0.9,
    preActionCalmDelayMs: 350,
    enrichChallenge: false,
  },
  SCENARIO_INATTENTIVE_DISTRACTIBLE: {
    internalTitleEl: 'Οπτική Αποφόρτιση & Εστίαση (Inattentive / Low-Distractor Scaffold)',
    clinicalRationaleEl:
      'Ανιχνεύθηκε καθυστέρηση απόκρισης ή διάσπαση από περισπασμούς. Μειώνεται αόρατα ο οπτικός θόρυβος κατά 35% για ξεκάθαρη εστίαση.',
    distractorReductionRatio: 0.35,
    autoHintBoost: true,
    speechRate: 0.88,
    preActionCalmDelayMs: 0,
    enrichChallenge: false,
  },
  SCENARIO_FRUSTRATION_RECOVERY: {
    internalTitleEl: 'Αόρατη Πρόληψη Ματαίωσης (Frustration Prevention & Confidence Rebuild)',
    clinicalRationaleEl:
      'Μετά από 2+ άστοχες προσπάθειες, το σύστημα απλοποιεί αόρατα τις επιλογές και φωτίζει διακριτικά το σωστό βήμα ώστε το παιδί να βιώσει άμεση επιτυχία.',
    distractorReductionRatio: 0.5,
    autoHintBoost: true,
    speechRate: 0.86,
    preActionCalmDelayMs: 0,
    enrichChallenge: false,
  },
  SCENARIO_KINETIC_SEEKING: {
    internalTitleEl: 'Αισθητηριακή & Ιδιοδεκτική Ενσωμάτωση (Proprioceptive / Kinetic Grounding)',
    clinicalRationaleEl:
      'Προσαρμογή για παιδιά που χρειάζονται συχνή σωματική γείωση (βαθιά πίεση, ρυθμική κίνηση ή καθιστή αποφόρτιση).',
    distractorReductionRatio: 0.2,
    autoHintBoost: false,
    speechRate: 0.9,
    preActionCalmDelayMs: 0,
    enrichChallenge: false,
  },
  SCENARIO_LANGUAGE_SCAFFOLD: {
    internalTitleEl: 'Λογοθεραπευτική Ενίσχυση Κατανόησης (Speech & Receptive Language Scaffold)',
    clinicalRationaleEl:
      'Πιο αργή, καθαρή εκφώνηση (0.84x) και αυξημένη έμφαση στα οπτικά εικονογράμματα για παιδιά προσχολικής ηλικίας ή με γλωσσικές δυσκολίες.',
    distractorReductionRatio: 0.3,
    autoHintBoost: true,
    speechRate: 0.84,
    preActionCalmDelayMs: 0,
    enrichChallenge: false,
  },
  SCENARIO_MASTERY_CHALLENGE: {
    internalTitleEl: 'Εμπλουτισμός Mastery (High-Readiness Executive Challenge)',
    clinicalRationaleEl:
      'Το παιδί ολοκληρώνει τα βήματα άνετα χωρίς λάθη ή βοήθειες. Αυξάνεται αόρατα η γνωστική πρόκληση για διατήρηση του ενδιαφέροντος.',
    distractorReductionRatio: 0,
    autoHintBoost: false,
    speechRate: 0.95,
    preActionCalmDelayMs: 0,
    enrichChallenge: true,
  },
};

/**
 * Evaluates live telemetry invisibly and returns the best-fitting adaptation profile.
 */
export function evaluateInvisibleScenario(
  telemetry: ChildInteractionTelemetry
): SilentAdaptationProfile {
  // 1. Frustration recovery takes highest priority so the child never feels discouraged
  if (telemetry.gentleNudgesInCurrentActivity >= 2) {
    return {
      scenarioId: 'SCENARIO_FRUSTRATION_RECOVERY',
      ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_FRUSTRATION_RECOVERY,
    };
  }

  // 2. Rapid impulsive tapping modulation
  if (
    telemetry.absorbedImpulsiveTaps >= 2 ||
    (telemetry.lastResponseTimeMs > 0 && telemetry.lastResponseTimeMs < 750)
  ) {
    return {
      scenarioId: 'SCENARIO_IMPULSIVE_RAPID',
      ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_IMPULSIVE_RAPID,
    };
  }

  // 3. Language scaffold for 4-5 band or when multiple hints are requested early
  if (telemetry.ageBand === '4-5' || telemetry.hintsUsedInCurrentActivity >= 2) {
    return {
      scenarioId: 'SCENARIO_LANGUAGE_SCAFFOLD',
      ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_LANGUAGE_SCAFFOLD,
    };
  }

  // 4. Inattentive / long response latency (> 8 seconds)
  if (telemetry.lastResponseTimeMs > 8000 || telemetry.gentleNudgesInCurrentActivity === 1) {
    return {
      scenarioId: 'SCENARIO_INATTENTIVE_DISTRACTIBLE',
      ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_INATTENTIVE_DISTRACTIBLE,
    };
  }

  // 5. Mastery challenge when completing rounds smoothly with 0 nudges and 0 hints
  if (
    telemetry.completedRoundsCount >= 1 &&
    telemetry.gentleNudgesInCurrentActivity === 0 &&
    telemetry.hintsUsedInCurrentActivity === 0 &&
    telemetry.absorbedImpulsiveTaps === 0
  ) {
    return {
      scenarioId: 'SCENARIO_MASTERY_CHALLENGE',
      ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_MASTERY_CHALLENGE,
    };
  }

  // 6. Kinetic / proprioceptive mode when seated mode or movement focus is active
  if (telemetry.seatedModeActive) {
    return {
      scenarioId: 'SCENARIO_KINETIC_SEEKING',
      ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_KINETIC_SEEKING,
    };
  }

  return {
    scenarioId: 'SCENARIO_BALANCED_FLOW',
    ...ADAPTIVE_SCENARIO_CATALOG.SCENARIO_BALANCED_FLOW,
  };
}
