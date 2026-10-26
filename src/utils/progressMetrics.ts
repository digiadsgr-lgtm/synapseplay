import type { ActivitySessionLog } from '../types/domain';
import { SELF_REPORT_ACTIVITY_IDS, computeAccuracy } from './childProfileLearningEngine';

export interface RecentAccuracySummary {
  /** Accuracy over the last N measured activities, 0–100, or null if no data. */
  accuracyPct: number | null;
  measuredCount: number;
  selfReportCount: number;
  totalErrors: number;
}

function isSelfReport(log: ActivitySessionLog): boolean {
  return log.measurement === 'self-report' || SELF_REPORT_ACTIVITY_IDS.has(log.activityId);
}

/**
 * Honest progress metric for parents: share of correct responses
 * (correct rounds / (correct rounds + wrong responses)) over the last N measured activities.
 * Logs created before errors were recorded (errorsCount undefined) are ignored.
 */
export function summarizeRecentAccuracy(
  logs: ActivitySessionLog[],
  childProfileId: string,
  lastN: number = 10
): RecentAccuracySummary {
  const own = logs.filter((l) => !l.childProfileId || l.childProfileId === childProfileId);
  const selfReportCount = own.filter(isSelfReport).length;
  const measured = own
    .filter((l) => !isSelfReport(l) && typeof l.errorsCount === 'number')
    .slice(0, lastN);

  let correct = 0;
  let errors = 0;
  for (const l of measured) {
    correct += l.completedRounds;
    errors += l.errorsCount ?? 0;
  }
  const acc = computeAccuracy(correct, errors);
  return {
    accuracyPct: acc === null ? null : Math.round(acc * 100),
    measuredCount: measured.length,
    selfReportCount,
    totalErrors: errors,
  };
}

export function formatLogAccuracy(log: ActivitySessionLog): string {
  if (isSelfReport(log)) return 'αυτοαναφορά';
  if (typeof log.errorsCount !== 'number') return '—';
  const acc = computeAccuracy(log.completedRounds, log.errorsCount);
  return acc === null ? '—' : `${Math.round(acc * 100)}%`;
}
