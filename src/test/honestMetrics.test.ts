import { describe, expect, it } from 'vitest';
import {
  computeAccuracy,
  createDefaultChildProfile,
  trainChildProfileOnActivityCompletion,
} from '../utils/childProfileLearningEngine';
import { evaluateInvisibleScenario } from '../utils/adaptiveScenarioEngine';
import { summarizeRecentAccuracy, formatLogAccuracy } from '../utils/progressMetrics';
import type { ActivitySessionLog } from '../types/domain';

describe('Honest metrics & adaptation', () => {
  it('mastery drops when the child makes many errors, even without hints', () => {
    const base = createDefaultChildProfile('6-8');
    const clean = trainChildProfileOnActivityCompletion(base, {
      activityId: '01-visual-search',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      durationSeconds: 30,
      errorsCount: 0,
      completedRounds: 3,
    });
    const messy = trainChildProfileOnActivityCompletion(base, {
      activityId: '01-visual-search',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      durationSeconds: 30,
      errorsCount: 9,
      completedRounds: 3,
    });
    expect(clean.learnedModel.domainMastery.visualAttention).toBeGreaterThan(0.5);
    expect(messy.learnedModel.domainMastery.visualAttention).toBeLessThan(0.5);
  });

  it('self-report activities never change domain estimates', () => {
    const base = createDefaultChildProfile('6-8');
    const after = trainChildProfileOnActivityCompletion(base, {
      activityId: '10-copy-animal',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      durationSeconds: 30,
      errorsCount: 0,
      completedRounds: 3,
    });
    expect(after.learnedModel.domainMastery).toEqual(base.learnedModel.domainMastery);
    expect(after.learnedModel.activityPlayCounts['10-copy-animal']).toBe(1);
  });

  it('double-taps alone do not raise impulsivity; Go/No-Go errors do', () => {
    const base = createDefaultChildProfile('6-8');
    const doubleTaps = trainChildProfileOnActivityCompletion(base, {
      activityId: '01-visual-search',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 8,
      durationSeconds: 30,
      errorsCount: 0,
    });
    const goNoGoErrors = trainChildProfileOnActivityCompletion(base, {
      activityId: '09-wait-signal',
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      durationSeconds: 30,
      errorsCount: 3,
    });
    expect(doubleTaps.learnedModel.impulsivityIndex).toBe(base.learnedModel.impulsivityIndex);
    expect(goNoGoErrors.learnedModel.impulsivityIndex).toBeGreaterThan(
      base.learnedModel.impulsivityIndex
    );
  });

  it('a fast CORRECT answer is mastery, not impulsivity', () => {
    const fastCorrect = evaluateInvisibleScenario({
      ageBand: '8-10',
      completedRoundsCount: 1,
      gentleNudgesInCurrentActivity: 0,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 0,
      lastResponseTimeMs: 500,
      seatedModeActive: false,
    });
    expect(fastCorrect.scenarioId).toBe('SCENARIO_MASTERY_CHALLENGE');

    const fastWrong = evaluateInvisibleScenario({
      ageBand: '8-10',
      completedRoundsCount: 1,
      gentleNudgesInCurrentActivity: 1,
      hintsUsedInCurrentActivity: 0,
      absorbedImpulsiveTaps: 0,
      lastResponseTimeMs: 500,
      seatedModeActive: false,
    });
    expect(fastWrong.scenarioId).toBe('SCENARIO_IMPULSIVE_RAPID');
  });

  it('accuracy summary uses only measured logs and can go below 55%', () => {
    expect(computeAccuracy(3, 0)).toBe(1);
    expect(computeAccuracy(0, 0)).toBeNull();
    const mk = (over: Partial<ActivitySessionLog>): ActivitySessionLog => ({
      timestamp: '2026-10-26T10:00:00Z',
      dateKey: '2026-10-26',
      activityId: '01-visual-search',
      activityTitleEl: 'x',
      categoryId: 'detective-eyes',
      durationSeconds: 30,
      completedRounds: 3,
      totalRounds: 3,
      hintsUsed: 0,
      impulsiveTapsAbsorbed: 0,
      seatedModeUsed: false,
      childProfileId: 'c1',
      ...over,
    });
    const logs = [
      mk({ errorsCount: 9 }),
      mk({ activityId: '10-copy-animal', errorsCount: 0, measurement: 'self-report' }),
      mk({}), // legacy log without errorsCount -> ignored
    ];
    const s = summarizeRecentAccuracy(logs, 'c1');
    expect(s.accuracyPct).toBe(25);
    expect(s.measuredCount).toBe(1);
    expect(s.selfReportCount).toBe(1);
    expect(formatLogAccuracy(logs[1])).toBe('αυτοαναφορά');
    expect(formatLogAccuracy(logs[2])).toBe('—');
  });
});
