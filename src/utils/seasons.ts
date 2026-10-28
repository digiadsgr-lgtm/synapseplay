import { ACTIVITIES } from '../data/activitiesCatalog';
import type { ActivityDefinition } from '../types/domain';

/**
 * Εποχικό περιεχόμενο (βελτίωση 9): θέμα ανά εποχή/γιορτή και «παιχνίδι της εβδομάδας».
 * Υπολογίζεται τοπικά από την ημερομηνία — χωρίς server.
 */

export type SeasonId =
  | 'easter'
  | 'carnival'
  | 'holidays'
  | 'school'
  | 'autumn'
  | 'winter'
  | 'spring'
  | 'summer';

export interface SeasonTheme {
  id: SeasonId;
  emoji: string;
  titleEl: string;
  /** Μία φράση για το παιδί στην αρχική οθόνη. */
  greetingEl: string;
  /** Στολίδια για τον κήπο. */
  decor: string[];
}

export const SEASON_THEMES: Record<SeasonId, SeasonTheme> = {
  easter: {
    id: 'easter',
    emoji: '🐣',
    titleEl: 'Πασχαλινές μέρες',
    greetingEl: 'Ο κήπος σου γέμισε λουλούδια για το Πάσχα!',
    decor: ['🌷', '🐣', '🕯️'],
  },
  carnival: {
    id: 'carnival',
    emoji: '🎭',
    titleEl: 'Απόκριες',
    greetingEl: 'Απόκριες! Ποια μάσκα θα φορούσε ο συνοδοιπόρος σου;',
    decor: ['🎭', '🎉', '🎈'],
  },
  holidays: {
    id: 'holidays',
    emoji: '🎄',
    titleEl: 'Γιορτές',
    greetingEl: 'Καλές γιορτές! Ο κήπος σου στολίστηκε.',
    decor: ['🎄', '⭐', '🎁'],
  },
  school: {
    id: 'school',
    emoji: '🎒',
    titleEl: 'Πίσω στο σχολείο',
    greetingEl: 'Νέα σχολική χρονιά, νέα λουλούδια στον κήπο σου!',
    decor: ['🎒', '✏️', '📚'],
  },
  autumn: {
    id: 'autumn',
    emoji: '🍂',
    titleEl: 'Φθινόπωρο',
    greetingEl: 'Φθινόπωρο! Τα φύλλα πέφτουν, ο κήπος σου μεγαλώνει.',
    decor: ['🍂', '🌰', '🍄'],
  },
  winter: {
    id: 'winter',
    emoji: '❄️',
    titleEl: 'Χειμώνας',
    greetingEl: 'Χειμώνας! Ο κήπος σου ξεκουράζεται, αλλά συνεχίζει να μεγαλώνει.',
    decor: ['❄️', '⛄', '🧣'],
  },
  spring: {
    id: 'spring',
    emoji: '🌸',
    titleEl: 'Άνοιξη',
    greetingEl: 'Άνοιξη! Όλα ανθίζουν, κι ο κήπος σου μαζί.',
    decor: ['🌸', '🦋', '🐝'],
  },
  summer: {
    id: 'summer',
    emoji: '☀️',
    titleEl: 'Καλοκαίρι',
    greetingEl: 'Καλό καλοκαίρι! Λίγο παιχνίδι, πολύ ήλιος.',
    decor: ['☀️', '🐚', '🍉'],
  },
};

/** Ορθόδοξο Πάσχα (Γρηγοριανό ημερολόγιο), για τα έτη 1900–2099. */
export function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // Ιουλιανό
  const day = ((d + e + 114) % 31) + 1;
  const julian = new Date(year, month - 1, day);
  julian.setDate(julian.getDate() + 13);
  return julian;
}

const DAY = 24 * 60 * 60 * 1000;

function dayIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

export function currentSeason(now: Date = new Date()): SeasonTheme {
  const today = dayIndex(now);
  const easter = dayIndex(orthodoxEaster(now.getFullYear()));
  if (today >= easter - 7 && today <= easter + 7) return SEASON_THEMES.easter;
  // Από την Τσικνοπέμπτη ως την Καθαρά Δευτέρα
  if (today >= easter - 59 && today <= easter - 48) return SEASON_THEMES.carnival;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if ((m === 12 && d >= 10) || (m === 1 && d <= 7)) return SEASON_THEMES.holidays;
  if (m === 9 || (m === 10 && d <= 15)) return SEASON_THEMES.school;
  if (m === 10 || m === 11 || m === 12) return SEASON_THEMES.autumn;
  if (m === 1 || m === 2) return SEASON_THEMES.winter;
  if (m >= 3 && m <= 5) return SEASON_THEMES.spring;
  return SEASON_THEMES.summer;
}

/** Αριθμός εβδομάδας ISO-8601. */
export function isoWeek(now: Date = new Date()): { year: number; week: number } {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * «Παιχνίδι της εβδομάδας»: αλλάζει κάθε Δευτέρα, ίδιο για όλους.
 * Βήμα 7 (πρώτος αριθμός ως προς το 20) → περνά από όλα τα παιχνίδια πριν επαναληφθεί.
 */
export function gameOfTheWeek(
  now: Date = new Date(),
  catalog: ActivityDefinition[] = ACTIVITIES
): ActivityDefinition {
  const { year, week } = isoWeek(now);
  const n = catalog.length;
  const idx = (((year * 53 + week) * 7) % n + n) % n;
  return catalog[idx];
}
