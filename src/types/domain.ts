import type { AgeBandId } from '../data/ageProtocols';
import type { AdaptiveScenarioId, SilentAdaptationProfile } from '../utils/adaptiveScenarioEngine';
import type {
  ChildMicroProfile,
  ChildAdaptiveLearningModel,
  DomainMasteryScores,
  ClinicalDomainKey,
} from '../utils/childProfileLearningEngine';

export type {
  AgeBandId,
  AdaptiveScenarioId,
  SilentAdaptationProfile,
  ChildMicroProfile,
  ChildAdaptiveLearningModel,
  DomainMasteryScores,
  ClinicalDomainKey,
};

export type CategoryId =
  | 'detective-eyes'
  | 'think-plan'
  | 'pause-choose'
  | 'move-build';

export type ActivityId =
  | '01-visual-search'
  | '02-spot-difference'
  | '03-visual-memory'
  | '04-sequence-memory'
  | '05-order-steps'
  | '06-switch-rule'
  | '07-move-freeze'
  | '08-listen-do'
  | '09-wait-signal'
  | '10-copy-animal'
  | '11-real-world-mission'
  | '12-build-pattern'
  | '13-speech-articulation'
  | '14-narrative-builder'
  | '15-auditory-discrimination'
  | '16-ergo-fine-motor'
  | '17-sensory-proprioception'
  | '18-adl-praxis'
  | '19-emotional-theater'
  | '20-music-kinetic-rhythm';

export type HintLevel = 0 | 1 | 2;

export type RunnerPhase =
  | 'INTRO'
  | 'ACTIVE_ROUND'
  | 'PAUSED'
  | 'ROUND_FEEDBACK'
  | 'COMPLETED';

export interface RunnerState {
  phase: RunnerPhase;
  previousPhase: Exclude<RunnerPhase, 'PAUSED'>;
  currentRound: number;
  totalRounds: number;
  hintLevel: HintLevel;
  totalHintsUsed: number;
  gentleNudgesCount: number;
  impulsiveTapsAbsorbed: number;
  seatedMode: boolean;
  feedbackMessageEl: string | null;
}

export type RunnerAction =
  | { type: 'START_ACTIVITY' }
  | { type: 'PAUSE_ACTIVITY' }
  | { type: 'RESUME_ACTIVITY' }
  | { type: 'REQUEST_HINT' }
  | { type: 'RECORD_GENTLE_NUDGE'; messageEl: string }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'RECORD_ABSORBED_TAP'; count?: number }
  | { type: 'COMPLETE_ROUND'; impulsiveTapsInRound?: number }
  | { type: 'TOGGLE_SEATED_MODE'; value?: boolean }
  | { type: 'RESTART_ACTIVITY'; totalRounds?: number; seatedModeDefault?: boolean };

export interface PictogramCue {
  emoji: string;
  labelEl: string;
}

export interface ActivityDefinition {
  id: ActivityId;
  code: string;
  categoryId: CategoryId;
  titleEl: string;
  titleEn: string;
  subtitleEl: string;
  voicePromptEl: string;
  executiveDomain: string;
  specialistDisciplines: string[];
  recommendedAges: AgeBandId[];
  ageAdaptationsEl: Record<AgeBandId, string>;
  pictogram: string;
  cues: PictogramCue[];
  parentGuidanceEl: string;
  supportsSeatedMode?: boolean;
  totalRounds: number;
}

export interface CategoryDefinition {
  id: CategoryId;
  groupCode: 'A' | 'B' | 'C' | 'D';
  titleEl: string;
  titleEn: string;
  subtitleEl: string;
  voicePromptEl: string;
  pictogram: string;
  accentColorClass: string;
  badgeBgClass: string;
}

export interface ActivitySessionLog {
  id?: number;
  timestamp: string;
  dateKey: string; // YYYY-MM-DD
  activityId: ActivityId;
  activityTitleEl: string;
  categoryId: CategoryId;
  durationSeconds: number;
  completedRounds: number;
  totalRounds: number;
  hintsUsed: number;
  impulsiveTapsAbsorbed: number;
  seatedModeUsed: boolean;
  ageBand?: AgeBandId;
  adaptiveScenarioId?: AdaptiveScenarioId;
  childProfileId?: string;
  childNickname?: string;
}

export interface AppSettings {
  id: string; // always 'default'
  activeChildProfileId?: string; // default 'child-default'
  ageBand: AgeBandId; // default '6-8'
  sessionLimitMinutes: number; // default 20
  warningWindowMinutes: number; // default 2
  soundEnabled: boolean;
  voiceEnabled: boolean;
  reducedMotion: boolean;
  seatedModeDefault: boolean;
}

export interface DailyUsageRecord {
  dateKey: string; // YYYY-MM-DD
  elapsedSeconds: number;
}

export type ReviewerRole =
  | 'parent'
  | 'occupational-therapist'
  | 'speech-therapist'
  | 'child-psychologist'
  | 'child-psychiatrist'
  | 'physiatrist'
  | 'social-worker'
  | 'adhd-center-director';

export type ObservationCategory =
  | 'clinical-suggestion'
  | 'bug-ux'
  | 'age-calibration'
  | 'new-game-idea'
  | 'positive-review';

export interface ClinicalFeedbackEntry {
  id?: number;
  timestamp: string;
  dateKey: string;
  reviewerRole: ReviewerRole;
  reviewerRoleLabelEl: string;
  reviewerNameOrCenter: string;
  targetScope: string; // 'general' | 'voice-engine' | 'age-adaptation' | ActivityId
  targetScopeLabelEl: string;
  ageBandTested: AgeBandId;
  ratingStars: 1 | 2 | 3 | 4 | 5;
  usabilityScore: 1 | 2 | 3 | 4 | 5;
  clinicalAppropriatenessScore: 1 | 2 | 3 | 4 | 5;
  observationCategory: ObservationCategory;
  commentEl: string;
}
