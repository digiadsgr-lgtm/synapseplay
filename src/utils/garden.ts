/**
 * Ήρεμος κόσμος που μεγαλώνει (βελτίωση 3).
 * Κάθε παιχνίδι που τελειώνει = 1 βήμα ανάπτυξης· κάθε αποστολή στο σπίτι = 2 βήματα και ένα «επισκέπτη».
 * ΧΩΡΙΣ νομίσματα, κατάστημα ή ποινές: ο κήπος ποτέ δεν μικραίνει, οι χαμένες μέρες δεν μετράνε.
 */

export const STEPS_PER_PLANT = 6;
export const MAX_VISIBLE_PLOTS = 12;

const GROWTH = ['🌱', '🌱', '🌿', '🌿', '🪴', '🪴'] as const;
const BLOOMS = ['🌻', '🌷', '🌳', '🍓', '🌼', '🍅', '🌲', '🌺', '🍋', '🌵', '🥕', '🌹'] as const;
const VISITORS = ['🦋', '🐝', '🐞', '🐦', '🐌', '🐿️'] as const;

export interface GardenPlot {
  index: number;
  emoji: string;
  grown: boolean;
}

export interface GardenState {
  steps: number;
  grownPlants: number;
  plots: GardenPlot[];
  visitors: string[];
  /** Βήματα που λείπουν ώστε να ανθίσει το φυτό που μεγαλώνει τώρα. */
  stepsToNextBloom: number;
  /** Το φυτό που μεγαλώνει τώρα (emoji τρέχοντος σταδίου). */
  growingEmoji: string;
  nextBloomEmoji: string;
}

export function computeGarden(gamesCompleted: number, missionsDone: number): GardenState {
  const games = Math.max(0, Math.floor(gamesCompleted));
  const missions = Math.max(0, Math.floor(missionsDone));
  const steps = games + 2 * missions;
  const grownPlants = Math.floor(steps / STEPS_PER_PLANT);
  const partial = steps % STEPS_PER_PLANT;

  const plots: GardenPlot[] = [];
  const firstVisible = Math.max(0, grownPlants + 1 - MAX_VISIBLE_PLOTS);
  for (let i = firstVisible; i < grownPlants; i++) {
    plots.push({ index: i, emoji: BLOOMS[i % BLOOMS.length], grown: true });
  }
  const growingEmoji = partial === 0 ? '🟫' : GROWTH[partial];
  plots.push({ index: grownPlants, emoji: growingEmoji, grown: false });

  const visitors: string[] = [];
  for (let i = 0; i < Math.min(missions, VISITORS.length); i++) visitors.push(VISITORS[i]);

  return {
    steps,
    grownPlants,
    plots,
    visitors,
    stepsToNextBloom: STEPS_PER_PLANT - partial,
    growingEmoji,
    nextBloomEmoji: BLOOMS[grownPlants % BLOOMS.length],
  };
}

/** Πρόταση για το παιδί, χωρίς πίεση. */
export function gardenEncouragementEl(g: GardenState): string {
  if (g.steps === 0) return 'Ο κήπος σου περιμένει τον πρώτο σπόρο. Κάθε παιχνίδι φυτεύει κάτι!';
  const games = g.stepsToNextBloom === 1 ? '1 παιχνίδι' : `${g.stepsToNextBloom} παιχνίδια`;
  return `Ακόμα ${games} (ή μια αποστολή στο σπίτι) και ανθίζει ${g.nextBloomEmoji}.`;
}
