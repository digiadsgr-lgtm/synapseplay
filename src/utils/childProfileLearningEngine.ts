import type { ActivityDefinition, ActivityId, AgeBandId } from '../types/domain';

export type ClinicalDomainKey =
  | 'visualAttention'
  | 'workingMemory'
  | 'inhibitoryControl'
  | 'speechLanguage'
  | 'motorPraxis'
  | 'emotionalRegulation';

export interface DomainMasteryScores {
  visualAttention: number; // 0.0 - 1.0
  workingMemory: number; // 0.0 - 1.0
  inhibitoryControl: number; // 0.0 - 1.0
  speechLanguage: number; // 0.0 - 1.0
  motorPraxis: number; // 0.0 - 1.0
  emotionalRegulation: number; // 0.0 - 1.0
}

export interface ChildAdaptiveLearningModel {
  totalSessionsCompleted: number;
  impulsivityIndex: number; // 0.0 (calm) to 1.0 (high rapid tapping)
  scaffoldingNeedIndex: number; // 0.0 (independent) to 1.0 (needs proactive visual cues)
  optimalSpeechRate: number; // 0.84 to 0.96
  preferredStrategyId: 'time' | 'example' | 'retry' | null;
  domainMastery: DomainMasteryScores;
  activityPlayCounts: Record<string, number>;
  adaptationSummaryEl: string;
  lastUpdatedTimestamp: string;
}

export interface ChildMicroProfile {
  id: string;
  nickname: string;
  avatarEmoji: string;
  ageBand: AgeBandId;
  createdAt: string;
  learnedModel: ChildAdaptiveLearningModel;
}

export const DOMAIN_LABELS_EL: Record<ClinicalDomainKey, { labelEl: string; emoji: string }> = {
  visualAttention: { labelEl: 'Οπτική Εστίαση & Παρατήρηση', emoji: '🔍' },
  workingMemory: { labelEl: 'Εργαζόμενη Μνήμη & Ακολουθία', emoji: '🧠' },
  inhibitoryControl: { labelEl: 'Αναστολή Παρόρμησης (Go/No-Go)', emoji: '🛑' },
  speechLanguage: { labelEl: 'Λόγος, Φωνολογία & Ακρόαση', emoji: '🗣️' },
  motorPraxis: { labelEl: 'Εργοθεραπεία, Κίνηση & Πράξη', emoji: '👐' },
  emotionalRegulation: { labelEl: 'Συναισθηματική & Ρυθμική Αυτορρύθμιση', emoji: '🎭' },
};

export const AVATAR_PRESETS: Array<{ emoji: string; defaultNameEl: string }> = [
  { emoji: '🐨', defaultNameEl: 'Ήρεμο Κοάλα' },
  { emoji: '🐢', defaultNameEl: 'Σοφή Χελώνα' },
  { emoji: '🦉', defaultNameEl: 'Μικρή Κουκουβάγια' },
  { emoji: '🐬', defaultNameEl: 'Χαρούμενο Δελφίνι' },
  { emoji: '🦊', defaultNameEl: 'Έξυπνη Αλεπού' },
  { emoji: '🦋', defaultNameEl: 'Πολύχρωμη Πεταλούδα' },
  { emoji: '🦁', defaultNameEl: 'Θαρραλέο Λιονταράκι' },
  { emoji: '🚀', defaultNameEl: 'Μικρός Αστροναύτης' },
];

/**
 * Maps each of the 20 activities to its primary clinical learning domain(s).
 */
export const ACTIVITY_DOMAIN_MAP: Record<ActivityId, ClinicalDomainKey[]> = {
  '01-visual-search': ['visualAttention'],
  '02-spot-difference': ['visualAttention'],
  '03-visual-memory': ['workingMemory', 'visualAttention'],
  '04-sequence-memory': ['workingMemory'],
  '05-order-steps': ['workingMemory', 'motorPraxis'],
  '06-switch-rule': ['inhibitoryControl', 'workingMemory'],
  '07-move-freeze': ['inhibitoryControl', 'emotionalRegulation'],
  '08-listen-do': ['inhibitoryControl', 'speechLanguage'],
  '09-wait-signal': ['inhibitoryControl'],
  '10-copy-animal': ['motorPraxis', 'emotionalRegulation'],
  '11-real-world-mission': ['motorPraxis', 'workingMemory'],
  '12-build-pattern': ['motorPraxis', 'visualAttention'],
  '13-speech-articulation': ['speechLanguage'],
  '14-narrative-builder': ['speechLanguage', 'workingMemory'],
  '15-auditory-discrimination': ['speechLanguage', 'visualAttention'],
  '16-ergo-fine-motor': ['motorPraxis', 'visualAttention'],
  '17-sensory-proprioception': ['emotionalRegulation', 'motorPraxis'],
  '18-adl-praxis': ['motorPraxis'],
  '19-emotional-theater': ['emotionalRegulation', 'inhibitoryControl'],
  '20-music-kinetic-rhythm': ['emotionalRegulation', 'inhibitoryControl'],
};

export function createInitialLearningModel(ageBand: AgeBandId = '6-8'): ChildAdaptiveLearningModel {
  const baseSpeechRate =
    ageBand === '4-5' ? 0.85 : ageBand === '5-6' ? 0.88 : ageBand === '6-8' ? 0.91 : 0.94;

  return {
    totalSessionsCompleted: 0,
    impulsivityIndex: 0.2,
    scaffoldingNeedIndex: 0.25,
    optimalSpeechRate: baseSpeechRate,
    preferredStrategyId: null,
    domainMastery: {
      visualAttention: 0.5,
      workingMemory: 0.5,
      inhibitoryControl: 0.5,
      speechLanguage: 0.5,
      motorPraxis: 0.5,
      emotionalRegulation: 0.5,
    },
    activityPlayCounts: {},
    adaptationSummaryEl:
      'Αρχική Βαθμονόμηση: Το σύστημα παρατηρεί τον ρυθμό του παιδιού και προσαρμόζει δυναμικά τα ερεθίσματα.',
    lastUpdatedTimestamp: new Date().toISOString(),
  };
}

export function createDefaultChildProfile(ageBand: AgeBandId = '6-8'): ChildMicroProfile {
  return {
    id: 'child-default',
    nickname: 'Μικρός Εξερευνητής',
    avatarEmoji: '🐨',
    ageBand,
    createdAt: new Date().toISOString(),
    learnedModel: createInitialLearningModel(ageBand),
  };
}

function clamp01(val: number): number {
  return Math.max(0.05, Math.min(0.99, Math.round(val * 100) / 100));
}

function buildAdaptationSummary(
  model: ChildAdaptiveLearningModel,
  ageBand: AgeBandId
): string {
  if (model.totalSessionsCompleted === 0) {
    return 'Αρχική Βαθμονόμηση: Το σύστημα παρατηρεί τον ρυθμό του παιδιού και προσαρμόζει δυναμικά τα ερεθίσματα.';
  }

  const parts: string[] = [];
  if (model.impulsivityIndex >= 0.45) {
    parts.push('Ενεργή ρύθμιση παρορμητικότητας (αόρατη παύση ηρεμίας & μείωση θορύβου)');
  } else if (model.scaffoldingNeedIndex <= 0.22 && model.totalSessionsCompleted >= 2) {
    parts.push('Υψηλή εκτελεστική ετοιμότητα (αυτόματος εμπλουτισμός δυσκολίας Mastery)');
  } else if (model.scaffoldingNeedIndex >= 0.48) {
    parts.push('Ενισχυμένη οπτική & φωνολογική πλαισίωση (Proactive Scaffolding)');
  } else {
    parts.push(`Ισορροπημένη ροή στη Ζώνη Βέλτιστης Πρόκλησης (${ageBand} ετών)`);
  }

  parts.push(`Ρυθμός φωνής: ${model.optimalSpeechRate.toFixed(2)}x`);
  return parts.join(' • ');
}

/**
 * Trains the child's on-device learning model after completing an activity using
 * Exponential Moving Average (EMA) reinforcement updates.
 */
export function trainChildProfileOnActivityCompletion(
  profile: ChildMicroProfile,
  event: {
    activityId: ActivityId;
    hintsUsed: number;
    impulsiveTapsAbsorbed: number;
    durationSeconds: number;
    selectedStrategy?: 'time' | 'example' | 'retry' | null;
  }
): ChildMicroProfile {
  const prev = profile.learnedModel;
  const alpha = 0.35; // Continual learning rate

  // 1. Compute session mastery signal in [0.25, 0.98]
  const rawMasterySignal =
    1.0 - event.hintsUsed * 0.18 - Math.min(4, event.impulsiveTapsAbsorbed) * 0.08;
  const sessionMasterySignal = clamp01(Math.max(0.25, rawMasterySignal));

  // 2. Update targeted domain mastery scores
  const targetDomains = ACTIVITY_DOMAIN_MAP[event.activityId] ?? ['visualAttention'];
  const updatedMastery: DomainMasteryScores = { ...prev.domainMastery };
  for (const dom of targetDomains) {
    const oldScore = updatedMastery[dom] ?? 0.5;
    updatedMastery[dom] = clamp01((1 - alpha) * oldScore + alpha * sessionMasterySignal);
  }

  // 3. Update learned impulsivity & scaffolding need indices via EMA
  const observedImpulsivity = Math.min(1.0, event.impulsiveTapsAbsorbed / 4);
  const nextImpulsivity = clamp01(
    (1 - alpha) * prev.impulsivityIndex + alpha * observedImpulsivity
  );

  const observedScaffoldingNeed = Math.min(1.0, event.hintsUsed / 2);
  const nextScaffoldingNeed = clamp01(
    (1 - alpha) * prev.scaffoldingNeedIndex + alpha * observedScaffoldingNeed
  );

  // 4. Calibrate optimal speech rate based on child's age band and scaffolding need
  const baseAgeRate =
    profile.ageBand === '4-5'
      ? 0.85
      : profile.ageBand === '5-6'
      ? 0.88
      : profile.ageBand === '6-8'
      ? 0.91
      : 0.94;
  const rateAdjustment =
    nextScaffoldingNeed >= 0.45 ? -0.04 : nextScaffoldingNeed <= 0.2 ? 0.03 : 0;
  const nextSpeechRate = Math.max(
    0.84,
    Math.min(0.97, Math.round((baseAgeRate + rateAdjustment) * 100) / 100)
  );

  // 5. Increment per-child activity play count so next replay rotates to unseen scenarios
  const nextPlayCounts: Record<string, number> = {
    ...prev.activityPlayCounts,
    [event.activityId]: (prev.activityPlayCounts[event.activityId] ?? 0) + 1,
  };

  const nextModel: ChildAdaptiveLearningModel = {
    totalSessionsCompleted: prev.totalSessionsCompleted + 1,
    impulsivityIndex: nextImpulsivity,
    scaffoldingNeedIndex: nextScaffoldingNeed,
    optimalSpeechRate: nextSpeechRate,
    preferredStrategyId: event.selectedStrategy ?? prev.preferredStrategyId,
    domainMastery: updatedMastery,
    activityPlayCounts: nextPlayCounts,
    adaptationSummaryEl: '',
    lastUpdatedTimestamp: new Date().toISOString(),
  };

  nextModel.adaptationSummaryEl = buildAdaptationSummary(nextModel, profile.ageBand);

  return {
    ...profile,
    learnedModel: nextModel,
  };
}

/**
 * Recommends the next optimal activity for the active child profile based on their
 * Zone of Proximal Development (lowest or least-recently practiced domain for their age).
 */
export function getPersonalizedActivityRecommendation(
  profile: ChildMicroProfile,
  allActivities: ActivityDefinition[]
): {
  activity: ActivityDefinition;
  domainKey: ClinicalDomainKey;
  domainLabelEl: string;
  reasonEl: string;
} {
  const ageFiltered = allActivities.filter((a) => a.recommendedAges.includes(profile.ageBand));
  const candidates = ageFiltered.length > 0 ? ageFiltered : allActivities;

  // Find the domain that will benefit most from gentle reinforcement (lowest mastery score)
  const masteryEntries = Object.entries(profile.learnedModel.domainMastery) as Array<
    [ClinicalDomainKey, number]
  >;
  masteryEntries.sort((a, b) => a[1] - b[1]);
  const focusDomain = masteryEntries[0][0];

  // Pick the least-played candidate activity in that domain (or overall least played)
  const domainCandidates = candidates.filter((act) =>
    (ACTIVITY_DOMAIN_MAP[act.id] ?? []).includes(focusDomain)
  );
  const pool = domainCandidates.length > 0 ? domainCandidates : candidates;

  const sortedByPlays = [...pool].sort((a, b) => {
    const playsA = profile.learnedModel.activityPlayCounts[a.id] ?? 0;
    const playsB = profile.learnedModel.activityPlayCounts[b.id] ?? 0;
    return playsA - playsB;
  });

  const chosen = sortedByPlays[0] ?? allActivities[0];
  const domainMeta = DOMAIN_LABELS_EL[focusDomain];

  const reasonEl =
    profile.learnedModel.totalSessionsCompleted === 0
      ? `Ιδανικό ξεκίνημα για ηλικία ${profile.ageBand} ετών στον τομέα «${domainMeta.labelEl}».`
      : `Προσαρμοσμένη πρόταση για το προφίλ «${profile.nickname}» με βάση την πρόοδό του στον τομέα «${domainMeta.labelEl}».`;

  return {
    activity: chosen,
    domainKey: focusDomain,
    domainLabelEl: domainMeta.labelEl,
    reasonEl,
  };
}
