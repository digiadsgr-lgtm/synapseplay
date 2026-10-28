import type { ActivityId } from './domain';

/**
 * Εξάσκηση στο σπίτι: συνταγή θεραπευτή, αποστολές εκτός οθόνης, ερωτηματολόγιο γονιού.
 * Όλα αποθηκεύονται ΜΟΝΟ στη συσκευή, μέσα στο προφίλ του παιδιού.
 */

export type PlanMinutes = 5 | 10 | 15 | 20;

/** «Συνταγή εξάσκησης» που δίνει ο θεραπευτής (QR / σύνδεσμος). */
export interface PracticePlan {
  childCode: string;
  activityIds: ActivityId[]; // 1–6 παιχνίδια
  minutesPerDay: PlanMinutes;
  daysPerWeek: number; // 2–7
  /** Σύντομη οδηγία προς τον γονιό (όχι ιατρικά/προσωπικά στοιχεία). */
  note?: string;
  /** Πώς εμφανίζεται ο θεραπευτής / το κέντρο στον γονιό. */
  therapistLabel?: string;
  issuedAt: string; // ISO
  /** Δημόσιο κλειδί του θεραπευτή για κρυπτογραφημένη αποστολή προόδου (P-256, base64url). */
  therapistKey?: { x: string; y: string; kid: string };
  /** Πότε το εισήγαγε ο γονιός. */
  receivedAt?: string;
}

export type HomeMissionStatus = 'accepted' | 'done' | 'not-today';

export interface HomeMissionRecord {
  id: string;
  missionId: string;
  emoji: string;
  textEl: string;
  activityId?: ActivityId;
  offeredAt: string; // ISO
  dateKey: string; // YYYY-MM-DD
  status: HomeMissionStatus;
  resolvedAt?: string;
}

/** 5 απαντήσεις 1–5 (1 = σχεδόν ποτέ, 5 = σχεδόν πάντα). */
export interface ParentCheckIn {
  id: string;
  dateKey: string;
  answers: [number, number, number, number, number];
}
