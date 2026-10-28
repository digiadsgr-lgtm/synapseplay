import type { ParentCheckIn } from '../types/homePractice';

/**
 * Μέτρηση αποτελέσματος (βελτίωση 7): 5 σύντομες ερωτήσεις στον γονιό κάθε 4 εβδομάδες.
 * Δικές μας ερωτήσεις για καθημερινές συμπεριφορές — ΔΕΝ είναι κλίμακα αξιολόγησης ούτε διάγνωση.
 * Δείχνουν τάση στον γονιό και (αν το στείλει) στον θεραπευτή.
 */

export const CHECKIN_INTERVAL_DAYS = 28;

export const CHECKIN_QUESTIONS: { id: string; textEl: string; shortEl: string }[] = [
  { id: 'start', textEl: 'Ξεκινούσε μια δουλειά που του/της ζητούσατε χωρίς πολλές υπενθυμίσεις;', shortEl: 'Ξεκίνημα' },
  { id: 'finish', textEl: 'Ολοκλήρωνε μια σύντομη δουλειά (π.χ. ντύσιμο, τακτοποίηση) ως το τέλος;', shortEl: 'Ολοκλήρωση' },
  { id: 'wait', textEl: 'Περίμενε τη σειρά του/της (στο παιχνίδι, στην κουβέντα);', shortEl: 'Αναμονή' },
  { id: 'calm', textEl: 'Ηρεμούσε σε λογικό χρόνο μετά από αναστάτωση;', shortEl: 'Ηρέμηση' },
  { id: 'switch', textEl: 'Περνούσε ήρεμα από το ένα στο άλλο (κλείσιμο οθόνης, φαγητό, ύπνος);', shortEl: 'Μεταβάσεις' },
];

export const CHECKIN_SCALE: { value: number; labelEl: string }[] = [
  { value: 1, labelEl: 'Σχεδόν ποτέ' },
  { value: 2, labelEl: 'Σπάνια' },
  { value: 3, labelEl: 'Μερικές φορές' },
  { value: 4, labelEl: 'Συχνά' },
  { value: 5, labelEl: 'Σχεδόν πάντα' },
];

function daysBetween(aKey: string, bKey: string): number {
  return Math.round((Date.parse(`${bKey}T00:00:00Z`) - Date.parse(`${aKey}T00:00:00Z`)) / 86400000);
}

export function sortedCheckIns(list: ParentCheckIn[] | undefined): ParentCheckIn[] {
  return [...(list ?? [])].sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));
}

/** Χρειάζεται νέο ερωτηματολόγιο; (πρώτη φορά, ή πέρασαν 28 μέρες από το τελευταίο) */
export function isCheckInDue(list: ParentCheckIn[] | undefined, todayKey: string): boolean {
  const s = sortedCheckIns(list);
  if (s.length === 0) return true;
  return daysBetween(s[s.length - 1].dateKey, todayKey) >= CHECKIN_INTERVAL_DAYS;
}

export function daysUntilNextCheckIn(list: ParentCheckIn[] | undefined, todayKey: string): number {
  const s = sortedCheckIns(list);
  if (s.length === 0) return 0;
  return Math.max(0, CHECKIN_INTERVAL_DAYS - daysBetween(s[s.length - 1].dateKey, todayKey));
}

export function checkInAverage(c: ParentCheckIn): number {
  return Math.round((c.answers.reduce((s, x) => s + x, 0) / c.answers.length) * 10) / 10;
}

/** Αλλαγή από το πρώτο στο τελευταίο ερωτηματολόγιο ανά ερώτηση (θετικό = καλύτερα). */
export function checkInChange(list: ParentCheckIn[] | undefined): number[] | null {
  const s = sortedCheckIns(list);
  if (s.length < 2) return null;
  const first = s[0].answers;
  const last = s[s.length - 1].answers;
  return last.map((v, i) => v - first[i]);
}

/** Συγχώνευση (θεραπευτής): ίδιο id = ίδιο ερωτηματολόγιο. */
export function mergeById<T extends { id: string }>(current: T[] | undefined, incoming: T[], max: number): T[] {
  const map = new Map<string, T>();
  for (const x of current ?? []) map.set(x.id, x);
  for (const x of incoming) map.set(x.id, x);
  return [...map.values()].slice(-max);
}
