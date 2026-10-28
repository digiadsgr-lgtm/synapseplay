import { ACTIVITIES } from '../data/activitiesCatalog';
import type { ActivityId, ActivitySessionLog } from '../types/domain';
import type { PlanMinutes, PracticePlan } from '../types/homePractice';
import { parseChildCode } from './childCode';
import { b64urlToBytes, bytesToB64url, extractToken, packJson, unpackJson } from './linkCodec';

/**
 * «Συνταγή εξάσκησης» του θεραπευτή (βελτίωση 2).
 * Ο θεραπευτής διαλέγει παιχνίδια/λεπτά/μέρες → σύνδεσμος + QR → ο γονιός το ανοίγει και
 * εμφανίζεται «Το πρόγραμμα της εβδομάδας». Ο σύνδεσμος περιέχει μόνο τον κωδικό παιδιού,
 * τα παιχνίδια και (προαιρετικά) το δημόσιο κλειδί του θεραπευτή — όχι όνομα παιδιού.
 */

import { PLAN_PATH, PLAN_PREFIX } from './linkConstants';
export { PLAN_PATH, PLAN_PREFIX };
export const PLAN_MINUTES: PlanMinutes[] = [5, 10, 15, 20];
export const PLAN_MAX_GAMES = 6;
export const PLAN_NOTE_MAX = 160;
export const PLAN_LABEL_MAX = 40;

const ID_BY_NUM = new Map<number, ActivityId>(ACTIVITIES.map((a) => [parseInt(a.id, 10), a.id]));

interface CompactPlan {
  c: string;
  a: number[];
  m: number;
  d: number;
  n?: string;
  t?: string;
  i: string;
  k?: [string, string, string];
}

export function planToToken(plan: PracticePlan): Promise<string> {
  const compact: CompactPlan = {
    c: plan.childCode,
    a: plan.activityIds.map((id) => parseInt(id, 10)),
    m: plan.minutesPerDay,
    d: plan.daysPerWeek,
    i: plan.issuedAt.slice(0, 10),
  };
  if (plan.note) compact.n = plan.note;
  if (plan.therapistLabel) compact.t = plan.therapistLabel;
  if (plan.therapistKey) compact.k = [plan.therapistKey.x, plan.therapistKey.y, plan.therapistKey.kid];
  return packJson(compact).then((b) => PLAN_PREFIX + bytesToB64url(b));
}

export async function planLink(plan: PracticePlan, origin: string): Promise<string> {
  return `${origin}${PLAN_PATH}#${await planToToken(plan)}`;
}

const isB64 = (s: unknown, len: number): s is string =>
  typeof s === 'string' && s.length === len && /^[A-Za-z0-9_-]+$/.test(s);

/** Διαβάζει (μη αξιόπιστο) σύνδεσμο/token προγράμματος. Πετάει ελληνικό μήνυμα σε σφάλμα. */
export async function parsePlanToken(input: string): Promise<PracticePlan> {
  const token = extractToken(input, PLAN_PREFIX);
  if (!token || token.length > 4000) throw new Error('Ο σύνδεσμος προγράμματος δεν είναι έγκυρος.');
  let data: CompactPlan;
  try {
    data = (await unpackJson(b64urlToBytes(token.slice(PLAN_PREFIX.length)))) as CompactPlan;
  } catch {
    throw new Error('Ο σύνδεσμος προγράμματος είναι κομμένος ή κατεστραμμένος. Ζητήστε τον ξανά.');
  }
  const code = parseChildCode(String(data?.c ?? ''));
  const ids = Array.isArray(data?.a) ? data.a.map((n) => ID_BY_NUM.get(n)) : [];
  if (
    !code ||
    ids.length === 0 ||
    ids.length > PLAN_MAX_GAMES ||
    ids.some((x) => !x) ||
    !PLAN_MINUTES.includes(data.m as PlanMinutes) ||
    !Number.isInteger(data.d) ||
    data.d < 2 ||
    data.d > 7 ||
    typeof data.i !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.i)
  ) {
    throw new Error('Ο σύνδεσμος προγράμματος είναι κατεστραμμένος. Ζητήστε τον ξανά.');
  }
  let therapistKey: PracticePlan['therapistKey'];
  if (data.k !== undefined) {
    const [x, y, kid] = data.k;
    if (!isB64(x, 43) || !isB64(y, 43) || !isB64(kid, 8)) {
      throw new Error('Ο σύνδεσμος προγράμματος είναι κατεστραμμένος. Ζητήστε τον ξανά.');
    }
    therapistKey = { x, y, kid };
  }
  const clean = (s: unknown, max: number) =>
    typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : undefined;
  return {
    childCode: code.code,
    activityIds: [...new Set(ids as ActivityId[])],
    minutesPerDay: data.m as PlanMinutes,
    daysPerWeek: data.d,
    note: clean(data.n, PLAN_NOTE_MAX),
    therapistLabel: clean(data.t, PLAN_LABEL_MAX),
    issuedAt: `${data.i}T00:00:00.000Z`,
    therapistKey,
  };
}

/** Δευτέρα της τρέχουσας εβδομάδας (τοπική ώρα), YYYY-MM-DD. */
export function weekStartKey(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (d.getDay() + 6) % 7; // Δευτέρα = 0
  d.setDate(d.getDate() - dow);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface PlanWeekProgress {
  /** Μέρες αυτής της εβδομάδας που έπαιξε τουλάχιστον ένα παιχνίδι του προγράμματος. */
  daysDone: number;
  daysTarget: number;
  /** Λεπτά σήμερα σε παιχνίδια του προγράμματος. */
  minutesToday: number;
  minutesTarget: number;
  /** Πόσες φορές έπαιξε κάθε παιχνίδι του προγράμματος αυτή την εβδομάδα. */
  playsThisWeek: Record<string, number>;
  /** Το επόμενο προτεινόμενο: όποιο παίχτηκε λιγότερο αυτή την εβδομάδα. */
  nextActivityId: ActivityId;
}

export function planWeekProgress(
  plan: PracticePlan,
  logs: ActivitySessionLog[],
  profileId: string,
  now: Date = new Date(),
  todayKey?: string
): PlanWeekProgress {
  const start = weekStartKey(now);
  const today =
    todayKey ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const inPlan = new Set<string>(plan.activityIds);
  const week = logs.filter(
    (l) => l.childProfileId === profileId && inPlan.has(l.activityId) && l.dateKey >= start && l.dateKey <= today
  );
  const days = new Set(week.map((l) => l.dateKey));
  const seconds = week.filter((l) => l.dateKey === today).reduce((s, l) => s + (l.durationSeconds || 0), 0);
  const plays: Record<string, number> = {};
  for (const id of plan.activityIds) plays[id] = 0;
  for (const l of week) plays[l.activityId] = (plays[l.activityId] ?? 0) + 1;
  const next = [...plan.activityIds].sort((a, b) => plays[a] - plays[b])[0];
  return {
    daysDone: days.size,
    daysTarget: plan.daysPerWeek,
    minutesToday: Math.round(seconds / 60),
    minutesTarget: plan.minutesPerDay,
    playsThisWeek: plays,
    nextActivityId: next,
  };
}
