import type { ActivityId, AgeBandId } from '../types/domain';
import type { HomeMissionRecord } from '../types/homePractice';
import { ACTIVITY_DOMAIN_MAP, type ClinicalDomainKey } from './childProfileLearningEngine';
import { currentSeason, type SeasonId } from './seasons';

/**
 * «Αποστολή στο σπίτι» (βελτίωση 1): μια δουλειά ~2 λεπτών ΕΚΤΟΣ οθόνης, μετά το παιχνίδι.
 * Το παιδί τη δέχεται· ο γονιός επιβεβαιώνει ότι έγινε. Χωρίς ποινές, χωρίς πόντους.
 */

export interface HomeMissionTemplate {
  id: string;
  emoji: string;
  /** Για 4–6 ετών. */
  youngEl: string;
  /** Για 6–12 (αν λείπει, ισχύει το youngEl). */
  olderEl?: string;
}

export const MISSIONS_BY_DOMAIN: Record<ClinicalDomainKey, HomeMissionTemplate[]> = {
  visualAttention: [
    { id: 'va-1', emoji: '🔎', youngEl: 'Βρες στο σπίτι 3 πράγματα που είναι κόκκινα και δείξ’ τα στον γονιό σου.', olderEl: 'Βρες στο σπίτι 5 πράγματα που είναι στρογγυλά και πες τα στον γονιό σου.' },
    { id: 'va-2', emoji: '🪟', youngEl: 'Κοίτα από το παράθυρο και πες 3 πράγματα που βλέπεις.', olderEl: 'Κοίτα από το παράθυρο για 1 λεπτό και πες 5 πράγματα που κινούνται.' },
    { id: 'va-3', emoji: '🧦', youngEl: 'Βρες ένα ζευγάρι ίδιες κάλτσες και βάλ’ τες μαζί.', olderEl: 'Ταίριαξε όλες τις κάλτσες από το καλάθι με τα καθαρά ρούχα.' },
    { id: 'va-4', emoji: '🍽️', youngEl: 'Πριν το φαγητό, μέτρησε πόσα πιρούνια χρειάζονται για όλους.', olderEl: 'Στρώσε το τραπέζι: ένα πιάτο, ένα πιρούνι και ένα ποτήρι για τον καθένα.' },
  ],
  workingMemory: [
    { id: 'wm-1', emoji: '🎒', youngEl: 'Ο γονιός σου λέει 2 πράγματα να φέρεις. Φέρ’ τα και τα δύο, χωρίς να ξαναρωτήσεις!', olderEl: 'Ο γονιός σου λέει 4 πράγματα να φέρεις. Φέρ’ τα όλα, χωρίς να ξαναρωτήσεις!' },
    { id: 'wm-2', emoji: '🛒', youngEl: 'Παίξτε «Πήγα στη λαϊκή κι αγόρασα…»: ο καθένας προσθέτει ένα φρούτο.' },
    { id: 'wm-3', emoji: '🌅', youngEl: 'Πες στον γονιό σου τι έκανες σήμερα: πρώτα, μετά, στο τέλος.', olderEl: 'Πες στον γονιό σου με τη σειρά 4 πράγματα που έκανες σήμερα.' },
    { id: 'wm-4', emoji: '👕', youngEl: 'Διάλεξε με τον γονιό σου τα ρούχα για αύριο: μπλούζα, παντελόνι, κάλτσες.', olderEl: 'Ετοίμασε χωρίς βοήθεια τα ρούχα για αύριο και δείξ’ τα στον γονιό σου.' },
  ],
  inhibitoryControl: [
    { id: 'ic-1', emoji: '🗿', youngEl: 'Παίξτε «Αγαλματάκια»: όταν σταματά το τραγούδι, παγώνεις!' },
    { id: 'ic-2', emoji: '👑', youngEl: 'Παίξτε «Ο αρχηγός λέει»: κάνε την κίνηση μόνο όταν ακούσεις «Ο αρχηγός λέει».' },
    { id: 'ic-3', emoji: '🤫', youngEl: 'Στο τραπέζι, περίμενε να τελειώσει ο άλλος πριν μιλήσεις. Ο γονιός σου θα το προσέξει!' },
    { id: 'ic-4', emoji: '🚦', youngEl: 'Παίξτε «Πράσινο – Κόκκινο»: περπατάς στο «πράσινο», σταματάς στο «κόκκινο».' },
  ],
  speechLanguage: [
    { id: 'sl-1', emoji: '📖', youngEl: 'Πες στον γονιό σου μια μικρή ιστορία για το αγαπημένο σου παιχνίδι.', olderEl: 'Πες στον γονιό σου μια ιστορία με αρχή, μέση και τέλος.' },
    { id: 'sl-2', emoji: '🔤', youngEl: 'Βρες στο σπίτι 2 πράγματα που αρχίζουν από «Μ».', olderEl: 'Βρες στο σπίτι 4 πράγματα που αρχίζουν από «Κ».' },
    { id: 'sl-3', emoji: '🎵', youngEl: 'Πείτε μαζί ένα τραγούδι και χτυπήστε παλαμάκια σε κάθε συλλαβή.' },
    { id: 'sl-4', emoji: '❓', youngEl: 'Ρώτα τον γονιό σου τι έπαιζε όταν ήταν παιδί και άκου την απάντηση ως το τέλος.' },
  ],
  motorPraxis: [
    { id: 'mp-1', emoji: '🧺', youngEl: 'Βοήθησε να διπλώσετε 3 πετσέτες ή μπλουζάκια.', olderEl: 'Δίπλωσε 5 ρούχα και βάλ’ τα στη θέση τους.' },
    { id: 'mp-2', emoji: '🥛', youngEl: 'Βάλε νερό στο ποτήρι σου χωρίς βοήθεια, προσεκτικά, χωρίς να χυθεί.' },
    { id: 'mp-3', emoji: '🧱', youngEl: 'Φτιάξε έναν πύργο με 5 πράγματα από το σπίτι (βιβλία, τουβλάκια, κουτιά).' },
    { id: 'mp-4', emoji: '👟', youngEl: 'Βάλε τα παπούτσια σου στη θέση τους, ζευγαράκι.', olderEl: 'Τακτοποίησε όλα τα παπούτσια στην είσοδο, ζευγαράκια.' },
  ],
  emotionalRegulation: [
    { id: 'er-1', emoji: '🎈', youngEl: 'Κάνε 5 «ανάσες μπαλόνι» με τον γονιό σου: φούσκωσε την κοιλιά, ξεφούσκωσε αργά.' },
    { id: 'er-2', emoji: '😊', youngEl: 'Πες στον γονιό σου ένα πράγμα που σου έφερε χαρά σήμερα.' },
    { id: 'er-3', emoji: '🎭', youngEl: 'Δείξε με το πρόσωπό σου 3 συναισθήματα και ο γονιός σου μαντεύει.' },
    { id: 'er-4', emoji: '🐢', youngEl: 'Περπάτα σαν χελωνίτσα από το ένα δωμάτιο στο άλλο, όσο πιο αργά μπορείς.' },
  ],
};

export const SEASONAL_MISSIONS: Record<SeasonId, HomeMissionTemplate> = {
  school: { id: 'se-school', emoji: '🎒', youngEl: 'Ετοίμασε με τον γονιό σου την τσάντα για αύριο: τι χρειάζεσαι;' },
  autumn: { id: 'se-autumn', emoji: '🍂', youngEl: 'Βρες 3 πράγματα με χρώματα του φθινοπώρου: καφέ, πορτοκαλί, κίτρινο.' },
  holidays: { id: 'se-holidays', emoji: '🎄', youngEl: 'Φτιάξε μια ζωγραφιά-κάρτα για κάποιον που αγαπάς.' },
  winter: { id: 'se-winter', emoji: '⛄', youngEl: 'Ζωγράφισε έναν χιονάνθρωπο και δείξ’ τον στον γονιό σου.' },
  carnival: { id: 'se-carnival', emoji: '🎭', youngEl: 'Φτιάξε μια μάσκα από χαρτί και παίξε έναν ρόλο για 1 λεπτό.' },
  easter: { id: 'se-easter', emoji: '🐣', youngEl: 'Βοήθησε στις πασχαλινές ετοιμασίες: στο βάψιμο των αυγών ή στο στρώσιμο του τραπεζιού.' },
  spring: { id: 'se-spring', emoji: '🌸', youngEl: 'Βρες ένα λουλούδι ή κάτι πράσινο και περιέγραψέ το στον γονιό σου.' },
  summer: { id: 'se-summer', emoji: '☀️', youngEl: 'Γέμισε χωρίς βοήθεια ένα μπουκάλι νερό για τη βόλτα σας.' },
};

const YOUNG_BANDS: ReadonlySet<AgeBandId> = new Set<AgeBandId>(['4-5', '5-6']);

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function missionText(t: HomeMissionTemplate, ageBand: AgeBandId): string {
  return YOUNG_BANDS.has(ageBand) || !t.olderEl ? t.youngEl : t.olderEl;
}

/**
 * Διαλέγει αποστολή που ταιριάζει στο παιχνίδι που μόλις τελείωσε.
 * Αποφεύγει όσες έγιναν τις τελευταίες 7 μέρες. Ντετερμινιστικό ανά ημέρα.
 */
export function pickHomeMission(params: {
  activityId: ActivityId;
  ageBand: AgeBandId;
  dateKey: string;
  history?: HomeMissionRecord[];
  now?: Date;
}): HomeMissionTemplate {
  const { activityId, dateKey, history = [], now = new Date() } = params;
  const domain = (ACTIVITY_DOMAIN_MAP[activityId] ?? ['emotionalRegulation'])[0];
  const season = currentSeason(now);
  const pool = [...MISSIONS_BY_DOMAIN[domain]];
  const h = hash(`${dateKey}|${activityId}`);
  // Μία στις τρεις φορές, η αποστολή της εποχής
  if (h % 3 === 0) pool.unshift(SEASONAL_MISSIONS[season.id]);
  const weekAgo = now.getTime() - 7 * 24 * 3600 * 1000;
  const recent = new Set(
    history.filter((m) => Date.parse(m.offeredAt) >= weekAgo).map((m) => m.missionId)
  );
  const fresh = pool.filter((m) => !recent.has(m.id));
  const list = fresh.length > 0 ? fresh : pool;
  return h % 3 === 0 && list[0].id.startsWith('se-') ? list[0] : list[h % list.length];
}

/** Μία αποστολή τη μέρα: true αν δεν έχει ήδη γίνει δεκτή/ολοκληρωθεί σήμερα. */
export function canOfferMissionToday(history: HomeMissionRecord[] | undefined, dateKey: string): boolean {
  return !(history ?? []).some((m) => m.dateKey === dateKey && m.status !== 'not-today');
}

/** Αποστολές που περιμένουν επιβεβαίωση γονιού (σήμερα ή χθες). */
export function pendingMissions(history: HomeMissionRecord[] | undefined, now: Date = new Date()): HomeMissionRecord[] {
  const limit = now.getTime() - 2 * 24 * 3600 * 1000;
  return (history ?? []).filter((m) => m.status === 'accepted' && Date.parse(m.offeredAt) >= limit);
}

