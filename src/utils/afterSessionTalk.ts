import type { ActivityId } from '../types/domain';
import {
  ACTIVITY_DOMAIN_MAP,
  INHIBITION_ACTIVITY_IDS,
  type ClinicalDomainKey,
} from './childProfileLearningEngine';

/**
 * «Τι να πείτε μετά» (βελτίωση 4): μία φράση επαίνου για την ΠΡΟΣΠΑΘΕΙΑ και μία ερώτηση,
 * για τον γονιό, με βάση το τι έγινε στο παιχνίδι. Χωρίς βαθμούς και χωρίς «είσαι έξυπνος».
 */

export interface AfterSessionInput {
  activityId: ActivityId;
  hintsUsed: number;
  errorsCount: number;
  impulsiveTapsAbsorbed: number;
  durationSeconds: number;
  totalRounds: number;
}

export interface AfterSessionTalk {
  praiseEl: string;
  questionEl: string;
  tipEl: string;
}

const QUESTIONS: Record<ClinicalDomainKey, string> = {
  visualAttention: 'Τι σε βοήθησε να βρίσκεις αυτό που έψαχνες;',
  workingMemory: 'Πώς τα θυμόσουν; Τα έλεγες από μέσα σου;',
  inhibitoryControl: 'Τι έκανες για να περιμένεις τη σωστή στιγμή;',
  speechLanguage: 'Ποια λέξη ή ποιος ήχος σου άρεσε περισσότερο;',
  motorPraxis: 'Ποια κίνηση ήταν η πιο δύσκολη; Θα μου τη δείξεις;',
  emotionalRegulation: 'Πώς νιώθει το σώμα σου τώρα; Πιο ήρεμο;',
};

const TIPS = [
  'Επαινέστε την προσπάθεια, όχι το «είσαι έξυπνος».',
  'Ακούστε την απάντηση ως το τέλος, χωρίς διορθώσεις.',
  'Μία φράση αρκεί· μετά κλείστε την οθόνη μαζί.',
];

export function buildAfterSessionTalk(input: AfterSessionInput, variant: number = 0): AfterSessionTalk {
  const domain = (ACTIVITY_DOMAIN_MAP[input.activityId] ?? ['emotionalRegulation'])[0];
  let praiseEl: string;
  if (INHIBITION_ACTIVITY_IDS.has(input.activityId) && input.impulsiveTapsAbsorbed >= 3) {
    praiseEl = 'Είδα ότι προσπαθούσες να περιμένεις πριν πατήσεις. Αυτό είναι δύσκολο, και το έκανες!';
  } else if (input.errorsCount >= 3) {
    praiseEl = 'Δυσκολεύτηκες σε κάποια σημεία, αλλά δεν τα παράτησες. Αυτό είναι επιμονή!';
  } else if (input.hintsUsed > 0) {
    praiseEl = 'Ζήτησες βοήθεια όταν τη χρειάστηκες και συνέχισες ως το τέλος. Μπράβο!';
  } else if (input.errorsCount === 0) {
    praiseEl = 'Πρόσεξες κάθε βήμα με ηρεμία, από την αρχή ως το τέλος.';
  } else {
    praiseEl = 'Τελείωσες όλο το παιχνίδι με τον δικό σου ρυθμό.';
  }
  return {
    praiseEl,
    questionEl: QUESTIONS[domain],
    tipEl: TIPS[Math.abs(variant) % TIPS.length],
  };
}
