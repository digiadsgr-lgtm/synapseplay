import type { ActivityDefinition, ActivityId, AgeBandId } from '../types/domain';

export type ClinicalDomainKey =
  | 'visualAttention'
  | 'workingMemory'
  | 'inhibitoryControl'
  | 'speechLanguage'
  | 'motorPraxis'
  | 'emotionalRegulation';

export interface DomainMasteryScores {
  visualAttention: number; // 0.0 - 1.0
  workingMemory: number; // 0.0 - 1.0
  inhibitoryControl: number; // 0.0 - 1.0
  speechLanguage: number; // 0.0 - 1.0
  motorPraxis: number; // 0.0 - 1.0
  emotionalRegulation: number; // 0.0 - 1.0
}

export interface ChildAdaptiveLearningModel {
  totalSessionsCompleted: number;
  impulsivityIndex: number; // 0.0 (calm) to 1.0 (high rapid tapping)
  scaffoldingNeedIndex: number; // 0.0 (independent) to 1.0 (needs proactive visual cues)
  optimalSpeechRate: number; // 0.84 to 0.96
  preferredStrategyId: 'time' | 'example' | 'retry' | null;
  domainMastery: DomainMasteryScores;
  activityPlayCounts: Record<string, number>;
  adaptationSummaryEl: string;
  lastUpdatedTimestamp: string;
}

export interface ChildMicroProfile {
  id: string;
  nickname: string;
  avatarEmoji: string;
  ageBand: AgeBandId;
  createdAt: string;
  learnedModel: ChildAdaptiveLearningModel;
}

export const DOMAIN_LABELS_EL: Record<ClinicalDomainKey, { labelEl: string; emoji: string }> = {
  visualAttention: { labelEl: 'Οπτική Εστίαση & Παρατήρηση', emoji: '🔍' },
  workingMemory: { labelEl: 'Εργαζόμενη Μνήμη & Ακολουθία', emoji: '🧠' },
  inhibitoryControl: { labelEl: 'Αναστολή Παρόρμησης (Go/No-Go)', emoji: '🛑' },
  speechLanguage: { labelEl: 'Λόγος, Φωνολογία & Ακρόαση', emoji: '🗣️' },
  motorPraxis: { labelEl: 'Εργοθεραπεία, Κίνηση & Πράξη', emoji: '👐' },
  emotionalRegulation: { labelEl: 'Συναισθηματική & Ρυθμική Αυτορρύθμιση', emoji: '🎭' },
};

export interface TherapeuticAvatarPreset {
  emoji: string;
  defaultNameEl: string;
  category: 'animal' | 'fantasy';
  primaryDomain: ClinicalDomainKey;
  superpowerTitleEl: string;
  coachingTipEl: string;
  clinicalRoleEl: string;
}

export const AVATAR_PRESETS: TherapeuticAvatarPreset[] = [
  // Beloved Animals
  {
    emoji: '🐨',
    defaultNameEl: 'Ήρεμο Κοάλα',
    category: 'animal',
    primaryDomain: 'emotionalRegulation',
    superpowerTitleEl: 'Αγκαλιά Γείωσης & Βαθιάς Ηρεμίας',
    coachingTipEl: 'Παίρνω μια ζεστή ανάσα σαν το Κοάλα και κρατάω το σώμα μου ήρεμο και σταθερό!',
    clinicalRoleEl:
      'Ενισχύει την ιδιοδεκτική γείωση και τη μείωση υπερδιέγερσης. Ιδανικό για παιδιά με κινητική ανησυχία.',
  },
  {
    emoji: '🐢',
    defaultNameEl: 'Σοφή Χελώνα',
    category: 'animal',
    primaryDomain: 'inhibitoryControl',
    superpowerTitleEl: 'Ασπίδα Παύσης & Σκέψης Πριν από την Πράξη',
    coachingTipEl: 'Σταματάω για 1 δευτερόλεπτο σαν τη Σοφή Χελώνα, κοιτάζω καλά και μετά πατάω!',
    clinicalRoleEl:
      'Κλασικό κλινικό πρότυπο αναστολής παρόρμησης (Schneider & Robin "Turtle Technique" CBT). Βοηθά στη μείωση βιαστικών λαθών.',
  },
  {
    emoji: '🦉',
    defaultNameEl: 'Μικρή Κουκουβάγια',
    category: 'animal',
    primaryDomain: 'visualAttention',
    superpowerTitleEl: 'Μάτια Ντετέκτιβ & Καθαρή Ακρόαση',
    coachingTipEl: 'Ανοίγω τα μάτια και τα αυτιά της Κουκουβάγιας για να βρω τη σωστή λεπτομέρεια!',
    clinicalRoleEl:
      'Ενισχύει την επιλεκτική οπτική σάρωση και την ακουστική προσοχή σε παιδιά με ΔΕΠΥ Απρόσεκτου Τύπου.',
  },
  {
    emoji: '🐬',
    defaultNameEl: 'Χαρούμενο Δελφίνι',
    category: 'animal',
    primaryDomain: 'speechLanguage',
    superpowerTitleEl: 'Ρυθμικό Κύμα Λόγου & Επικοινωνίας',
    coachingTipEl: 'Ακολουθώ τον ρυθμό του Δελφινιού και ενώνω καθαρά τις συλλαβές και τις λέξεις!',
    clinicalRoleEl:
      'Υποστηρίζει τον φωνολογικό ρυθμό, την ακουστική μνήμη και την ομαλή ροή λόγου.',
  },
  {
    emoji: '🦊',
    defaultNameEl: 'Έξυπνη Αλεπού',
    category: 'animal',
    primaryDomain: 'workingMemory',
    superpowerTitleEl: 'Ευέλικτη Σκέψη & Αλλαγή Κανόνα',
    coachingTipEl: 'Όταν αλλάζει ο κανόνας, η Έξυπνη Αλεπού προσαρμόζεται αμέσως με χαμόγελο!',
    clinicalRoleEl:
      'Ενισχύει τη γνωστική ευελιξία (Set-Shifting) και την εργαζόμενη μνήμη στις μεταβάσεις κανόνων.',
  },
  {
    emoji: '🦋',
    defaultNameEl: 'Πολύχρωμη Πεταλούδα',
    category: 'animal',
    primaryDomain: 'motorPraxis',
    superpowerTitleEl: 'Απαλό Άγγιγμα & Λεπτή Κινητικότητα',
    coachingTipEl: 'Ακουμπάω την οθόνη απαλά και με ακρίβεια, όπως τα φτερά της Πεταλούδας!',
    clinicalRoleEl:
      'Καλλιεργεί τον οπτικοκινητικό συντονισμό και τον έλεγχο πίεσης δακτύλων (Εργοθεραπεία).',
  },
  {
    emoji: '🦁',
    defaultNameEl: 'Θαρραλέο Λιονταράκι',
    category: 'animal',
    primaryDomain: 'emotionalRegulation',
    superpowerTitleEl: 'Ήρεμη Δύναμη & Αυτοπεποίθηση',
    coachingTipEl: 'Ακόμα κι αν κάτι φαίνεται δύσκολο, το Θαρραλέο Λιονταράκι δοκιμάζει ξανά ήρεμα!',
    clinicalRoleEl:
      'Ενισχύει την ανοχή στη ματαίωση και τη συναισθηματική ανθεκτικότητα (Resilience).',
  },
  {
    emoji: '🐶',
    defaultNameEl: 'Πιστό Κουταβάκι',
    category: 'animal',
    primaryDomain: 'motorPraxis',
    superpowerTitleEl: 'Οργάνωση Ρουτίνας & Συνεργασία',
    coachingTipEl: 'Βάζω τα βήματα στη σειρά, ένα-ένα, όπως το Πιστό Κουταβάκι στις αποστολές!',
    clinicalRoleEl:
      'Υποστηρίζει την οργάνωση καθημερινών ρουτινών (ADL Praxis) και την ολοκλήρωση βημάτων.',
  },
  {
    emoji: '🐰',
    defaultNameEl: 'Γρήγορο Κουνελάκι Ρυθμού',
    category: 'animal',
    primaryDomain: 'inhibitoryControl',
    superpowerTitleEl: 'Ρυθμικά Άλματα & Φρένο Ακριβείας',
    coachingTipEl: 'Κινούμαι στον ρυθμό και πατάω φρένο ακριβώς στο κόκκινο σήμα!',
    clinicalRoleEl:
      'Βοηθά το παιδί να μετατρέπει την υπερκινητικότητα σε ελεγχόμενη ρυθμική κίνηση με αναστολή (Go/No-Go).',
  },
  {
    emoji: '🐼',
    defaultNameEl: 'Γαλήνιο Πάντα',
    category: 'animal',
    primaryDomain: 'emotionalRegulation',
    superpowerTitleEl: 'Ισορροπία Μπαμπού & Εσωτερική Γαλήνη',
    coachingTipEl: 'Κρατάω την ισορροπία μου σαν το Γαλήνιο Πάντα και αναπνέω αργά!',
    clinicalRoleEl:
      'Υποστηρίζει τη στασική σταθερότητα, τη συναισθηματική αυτορρύθμιση και την ήρεμη εστίαση.',
  },

  // Fantasy & Heroic Characters (Unicorns, Dragons, Fairies, Wizards, Superheroes, Space)
  {
    emoji: '🦄',
    defaultNameEl: 'Φωτεινός Μονόκερος',
    category: 'fantasy',
    primaryDomain: 'visualAttention',
    superpowerTitleEl: 'Μαγική Ακτίνα Εστίασης & Παρατήρησης',
    coachingTipEl: 'Το φωτεινό κέρατο του Μονόκερου δείχνει μία-μία τις κρυμμένες λεπτομέρειες!',
    clinicalRoleEl:
      'Μετατρέπει τη διάσπαση προσοχής σε κατευθυνόμενη «ακτίνα εστίασης» (Spotlight Attention). Ιδιαίτερα αγαπητό προφίλ κινητοποίησης.',
  },
  {
    emoji: '🐉',
    defaultNameEl: 'Ήρεμος Δράκος της Ανάσας',
    category: 'fantasy',
    primaryDomain: 'inhibitoryControl',
    superpowerTitleEl: 'Αργή Εκπνοή & Έλεγχος Παρόρμησης',
    coachingTipEl: 'Ο Ήρεμος Δράκος βγάζει αργά τον αέρα από το στόμα και περιμένει το πράσινο σήμα!',
    clinicalRoleEl:
      'Συνδέει την αναπνευστική αυτορρύθμιση (Dragon Breath CBT) με τον έλεγχο της παρορμητικότητας και του θυμού.',
  },
  {
    emoji: '🧚',
    defaultNameEl: 'Νεράιδα της Αρμονίας',
    category: 'fantasy',
    primaryDomain: 'emotionalRegulation',
    superpowerTitleEl: 'Μαγική Σκόνη Ρυθμού & Ενσυναίσθησης',
    coachingTipEl: 'Με το ραβδάκι της Αρμονίας βρίσκω πάντα την πιο ήρεμη και φιλική λύση!',
    clinicalRoleEl:
      'Ενισχύει την κοινωνική αντίληψη, τη θεατρική ενσυναίσθηση και τη μουσικοκινητική αρμονία.',
  },
  {
    emoji: '🧙‍♂️',
    defaultNameEl: 'Σοφός Μάγος της Μνήμης',
    category: 'fantasy',
    primaryDomain: 'workingMemory',
    superpowerTitleEl: 'Κρύσταλλος Απομνημόνευσης & Σχεδιασμού',
    coachingTipEl: 'Κρατάω τις εικόνες στο μυαλό μου σαν μυστικό ξόρκι μνήμης!',
    clinicalRoleEl:
      'Ενδυναμώνει την οπτικοχωρική και ακουστική εργαζόμενη μνήμη (Baddeley Working Memory) μέσω νοερής επανάληψης.',
  },
  {
    emoji: '🦸‍♀️',
    defaultNameEl: 'Σούπερ Ηρωίδα της Προσοχής',
    category: 'fantasy',
    primaryDomain: 'visualAttention',
    superpowerTitleEl: 'Ασπίδα Συγκέντρωσης χωρίς Περισπασμούς',
    coachingTipEl: 'Ενεργοποιώ την Ασπίδα Προσοχής και ολοκληρώνω τον στόχο μου βήμα-βήμα!',
    clinicalRoleEl:
      'Ενισχύει την αυτοαποτελεσματικότητα (Self-Efficacy) και την προστασία από εξωτερικούς περισπασμούς.',
  },
  {
    emoji: '🚀',
    defaultNameEl: 'Μικρός Αστροναύτης',
    category: 'fantasy',
    primaryDomain: 'workingMemory',
    superpowerTitleEl: 'Πυξίδα Αποστολών & Οργάνωσης',
    coachingTipEl: 'Ελέγχω τα όργανα του διαστημοπλοίου: 1, 2, 3 — όλα στη σωστή σειρά!',
    clinicalRoleEl:
      'Προάγει τον εκτελεστικό σχεδιασμό (Executive Planning) και τον έλεγχο λίστας βημάτων (Checklist Mastery).',
  },
];

export function getAvatarCompanionMetadata(emoji: string): TherapeuticAvatarPreset {
  return (
    AVATAR_PRESETS.find((p) => p.emoji === emoji) ??
    AVATAR_PRESETS.find((p) => p.emoji === '🦄') ??
    AVATAR_PRESETS[0]
  );
}

const GENITIVE_STOP_WORDS = new Set([
  'της',
  'του',
  'των',
  'με',
  'σε',
  'από',
  'για',
  'στο',
  'στον',
  'στη',
  'στην',
]);

const NEUTER_OS_WORDS = new Set(['δάσος', 'άνθος', 'βέλος', 'άστρος', 'φως', 'μέρος', 'έδαφος']);

const COMMON_NOUNS_AND_ADJECTIVES_IN_E = new Set([
  'δράκος',
  'μάγος',
  'φίλος',
  'λύκος',
  'ήλιος',
  'καπετάνιος',
  'άγγελος',
  'μάριος',
  'μονόκερος',
  'ήρεμος',
  'έξυπνος',
  'γρήγορος',
  'γαλήνιος',
  'θαρραλέος',
  'γενναίος',
  'χαρούμενος',
  'πολύχρωμος',
]);

const PAROXYTONE_NAMES_IN_O = new Set([
  'γιώργος',
  'νίκος',
  'πέτρος',
  'παύλος',
  'σπύρος',
  'σταύρος',
  'χρήστος',
  'χρίστος',
  'φοίβος',
  'μάρκος',
  'μίλτος',
  'τάσος',
  'πάνος',
  'θάνος',
  'μάνος',
  'βάσος',
  'λάμπρος',
  'δήμος',
  'σίμος',
  'ντίνος',
  'τίμος',
  'στράτος',
  'μήτσος',
  'κίτσος',
  'αλέκος',
  'στέλιος',
  'κυριάκος',
]);

function inflectSingleWordToGreekVocative(word: string): string {
  const clean = word.trim();
  if (!clean) return clean;
  const lower = clean.toLowerCase();

  // Do not inflect neuter words in -ος or genitive words in -ού (e.g. Ρυθμού)
  if (NEUTER_OS_WORDS.has(lower) || lower.endsWith('ού')) {
    return clean;
  }

  // Feminine archaic names in -ις -> -η (e.g. Άρτεμις -> Άρτεμη)
  if (lower === 'άρτεμις') {
    return clean.slice(0, -2) + 'η';
  }

  // 1. Masculine words in -ας, -άς, -ης, -ής, -ες, -ές, -ους, -ούς, -ύς, -υς -> drop final -ς
  if (/(ας|άς|ης|ής|ες|ές|ους|ούς|ύς|υς)$/i.test(clean)) {
    return clean.slice(0, -1);
  }

  // 2. Masculine oxytone words in -ός -> -έ (e.g. Μικρός -> Μικρέ, Φωτεινός -> Φωτεινέ, Σοφός -> Σοφέ)
  if (/ός$/i.test(clean)) {
    const isUpper = clean === clean.toUpperCase();
    return clean.slice(0, -2) + (isUpper ? 'Έ' : 'έ');
  }

  // 3. Masculine unstressed words in -ος
  if (/ος$/i.test(clean)) {
    const isUpper = clean === clean.toUpperCase();
    // Explicit common nouns & adjectives taking -ε (Δράκος -> Δράκε, Μάγος -> Μάγε, Μονόκερος -> Μονόκερε)
    if (COMMON_NOUNS_AND_ADJECTIVES_IN_E.has(lower)) {
      return clean.slice(0, -2) + (isUpper ? 'Ε' : 'ε');
    }
    // Explicit paroxytone proper names or diminutives in -άκος / -ούκος / -ίτσος taking -ο (Γιώργος -> Γιώργο, Νίκος -> Νίκο)
    if (PAROXYTONE_NAMES_IN_O.has(lower) || /(άκος|ούκος|ίτσος)$/i.test(clean)) {
      return clean.slice(0, -2) + (isUpper ? 'Ο' : 'ο');
    }
    // Count Greek vowel clusters (syllables) to distinguish disyllabic paroxytone names (-ο) from polysyllabic names/adjectives (-ε)
    const syllables =
      clean.match(/(αυ|ευ|ου|αι|ει|οι|υι|[αεηιουωάέήίόύώϊϋΐΰ])/gi)?.length ?? 1;
    if (syllables <= 2) {
      return clean.slice(0, -2) + (isUpper ? 'Ο' : 'ο');
    }
    return clean.slice(0, -2) + (isUpper ? 'Ε' : 'ε');
  }

  return clean;
}

/**
 * Converts a Greek name or multi-word companion title from Nominative (Ονομαστική)
 * to Vocative (Κλητική πτώση) according to Modern Greek grammar rules (Τριανταφυλλίδης).
 * Examples:
 * - "Μικρός Εξερευνητής" -> "Μικρέ Εξερευνητή"
 * - "Φωτεινός Μονόκερος" -> "Φωτεινέ Μονόκερε"
 * - "Ήρεμος Δράκος της Ανάσας" -> "Ήρεμε Δράκε της Ανάσας"
 * - "Σοφός Μάγος της Μνήμης" -> "Σοφέ Μάγε της Μνήμης"
 * - "Γιώργος" -> "Γιώργο", "Αλέξανδρος" -> "Αλέξανδρε", "Δημήτρης" -> "Δημήτρη"
 */
export function toGreekVocative(nameOrPhrase: string): string {
  const trimmed = nameOrPhrase.trim();
  if (!trimmed) return trimmed;

  const tokens = trimmed.split(/\s+/);
  const result: string[] = [];
  let reachedGenitiveTail = false;

  for (const token of tokens) {
    if (reachedGenitiveTail || GENITIVE_STOP_WORDS.has(token.toLowerCase())) {
      reachedGenitiveTail = true;
      result.push(token);
    } else {
      result.push(inflectSingleWordToGreekVocative(token));
    }
  }

  return result.join(' ');
}

export interface AvatarClinicalProgressEvaluation {
  avatar: TherapeuticAvatarPreset;
  evolutionLevel: 1 | 2 | 3 | 4;
  evolutionTitleEl: string;
  evolutionBadgeEmoji: string;
  overallMasteryPct: number;
  strongestDomainKey: ClinicalDomainKey;
  strongestDomainLabelEl: string;
  growthTargetDomainKey: ClinicalDomainKey;
  growthTargetDomainLabelEl: string;
  childEncouragementEl: string;
  clinicalAssessmentEl: string;
}

export function evaluateChildAvatarProgress(
  profile: ChildMicroProfile
): AvatarClinicalProgressEvaluation {
  const avatar = getAvatarCompanionMetadata(profile.avatarEmoji);
  const sessions = profile.learnedModel.totalSessionsCompleted;
  const masteryValues = Object.values(profile.learnedModel.domainMastery);
  const avgMastery =
    masteryValues.reduce((sum, val) => sum + val, 0) / Math.max(1, masteryValues.length);
  const overallMasteryPct = Math.round(avgMastery * 100);

  const entries = Object.entries(profile.learnedModel.domainMastery) as Array<
    [ClinicalDomainKey, number]
  >;
  const sortedDesc = [...entries].sort((a, b) => b[1] - a[1]);
  const strongestDomainKey = sortedDesc[0][0];
  const growthTargetDomainKey = sortedDesc[sortedDesc.length - 1][0];

  const strongestDomainLabelEl = DOMAIN_LABELS_EL[strongestDomainKey].labelEl;
  const growthTargetDomainLabelEl = DOMAIN_LABELS_EL[growthTargetDomainKey].labelEl;

  let evolutionLevel: 1 | 2 | 3 | 4 = 1;
  let evolutionTitleEl = 'Επίπεδο 1: Μικρός Εξερευνητής Ηρεμίας';
  let evolutionBadgeEmoji = '🌱';

  if (sessions >= 10 || (sessions >= 6 && overallMasteryPct >= 75)) {
    evolutionLevel = 4;
    evolutionTitleEl = 'Επίπεδο 4: Πρωταθλητής Συγκέντρωσης & Αυτορρύθμισης';
    evolutionBadgeEmoji = '👑';
  } else if (sessions >= 6 || (sessions >= 3 && overallMasteryPct >= 65)) {
    evolutionLevel = 3;
    evolutionTitleEl = 'Επίπεδο 3: Φύλακας της Προσοχής';
    evolutionBadgeEmoji = '🌟';
  } else if (sessions >= 2) {
    evolutionLevel = 2;
    evolutionTitleEl = 'Επίπεδο 2: Μαθητευόμενος της Εστίασης';
    evolutionBadgeEmoji = '✨';
  }

  const childEncouragementEl = `${avatar.emoji} ${avatar.superpowerTitleEl}: «${avatar.coachingTipEl}»`;

  const clinicalAssessmentEl =
    sessions === 0
      ? `Ο συνοδοιπόρος «${avatar.defaultNameEl}» (${avatar.emoji}) ενεργοποιεί τον τομέα «${DOMAIN_LABELS_EL[avatar.primaryDomain].labelEl}». ${avatar.clinicalRoleEl}`
      : `${evolutionTitleEl}. Πιο άνετα μέχρι τώρα: «${strongestDomainLabelEl}». Προτείνεται περισσότερη εξάσκηση στο: «${growthTargetDomainLabelEl}». (Εκτίμηση της εφαρμογής από ακρίβεια και βοήθειες — όχι κλινική αξιολόγηση.)`;

  return {
    avatar,
    evolutionLevel,
    evolutionTitleEl,
    evolutionBadgeEmoji,
    overallMasteryPct,
    strongestDomainKey,
    strongestDomainLabelEl,
    growthTargetDomainKey,
    growthTargetDomainLabelEl,
    childEncouragementEl,
    clinicalAssessmentEl,
  };
}

/**
 * Maps each of the 20 activities to its primary clinical learning domain(s).
 */
export const ACTIVITY_DOMAIN_MAP: Record<ActivityId, ClinicalDomainKey[]> = {
  '01-visual-search': ['visualAttention'],
  '02-spot-difference': ['visualAttention'],
  '03-visual-memory': ['workingMemory', 'visualAttention'],
  '04-sequence-memory': ['workingMemory'],
  '05-order-steps': ['workingMemory', 'motorPraxis'],
  '06-switch-rule': ['inhibitoryControl', 'workingMemory'],
  '07-move-freeze': ['inhibitoryControl', 'emotionalRegulation'],
  '08-listen-do': ['inhibitoryControl', 'speechLanguage'],
  '09-wait-signal': ['inhibitoryControl'],
  '10-copy-animal': ['motorPraxis', 'emotionalRegulation'],
  '11-real-world-mission': ['motorPraxis', 'workingMemory'],
  '12-build-pattern': ['motorPraxis', 'visualAttention'],
  '13-speech-articulation': ['speechLanguage'],
  '14-narrative-builder': ['speechLanguage', 'workingMemory'],
  '15-auditory-discrimination': ['speechLanguage', 'visualAttention'],
  '16-ergo-fine-motor': ['motorPraxis', 'visualAttention'],
  '17-sensory-proprioception': ['emotionalRegulation', 'motorPraxis'],
  '18-adl-praxis': ['motorPraxis'],
  '19-emotional-theater': ['emotionalRegulation', 'inhibitoryControl'],
  '20-music-kinetic-rhythm': ['emotionalRegulation', 'inhibitoryControl'],
};

export function createInitialLearningModel(ageBand: AgeBandId = '6-8'): ChildAdaptiveLearningModel {
  const baseSpeechRate =
    ageBand === '4-5' ? 0.85 : ageBand === '5-6' ? 0.88 : ageBand === '6-8' ? 0.91 : 0.94;

  return {
    totalSessionsCompleted: 0,
    impulsivityIndex: 0.2,
    scaffoldingNeedIndex: 0.25,
    optimalSpeechRate: baseSpeechRate,
    preferredStrategyId: null,
    domainMastery: {
      visualAttention: 0.5,
      workingMemory: 0.5,
      inhibitoryControl: 0.5,
      speechLanguage: 0.5,
      motorPraxis: 0.5,
      emotionalRegulation: 0.5,
    },
    activityPlayCounts: {},
    adaptationSummaryEl:
      'Αρχική Βαθμονόμηση: Το σύστημα παρατηρεί τον ρυθμό του παιδιού και προσαρμόζει δυναμικά τα ερεθίσματα.',
    lastUpdatedTimestamp: new Date().toISOString(),
  };
}

export function createDefaultChildProfile(ageBand: AgeBandId = '6-8'): ChildMicroProfile {
  return {
    id: 'child-default',
    nickname: 'Μικρός Εξερευνητής',
    avatarEmoji: '🐨',
    ageBand,
    createdAt: new Date().toISOString(),
    learnedModel: createInitialLearningModel(ageBand),
  };
}

function clamp01(val: number): number {
  return Math.max(0.05, Math.min(0.99, Math.round(val * 100) / 100));
}

function buildAdaptationSummary(
  model: ChildAdaptiveLearningModel,
  ageBand: AgeBandId
): string {
  if (model.totalSessionsCompleted === 0) {
    return 'Αρχική Βαθμονόμηση: Το σύστημα παρατηρεί τον ρυθμό του παιδιού και προσαρμόζει δυναμικά τα ερεθίσματα.';
  }

  const parts: string[] = [];
  if (model.impulsivityIndex >= 0.45) {
    parts.push('Ενεργή ρύθμιση παρορμητικότητας (αόρατη παύση ηρεμίας & μείωση θορύβου)');
  } else if (model.scaffoldingNeedIndex <= 0.22 && model.totalSessionsCompleted >= 2) {
    parts.push('Υψηλή εκτελεστική ετοιμότητα (αυτόματος εμπλουτισμός δυσκολίας Mastery)');
  } else if (model.scaffoldingNeedIndex >= 0.48) {
    parts.push('Ενισχυμένη οπτική & φωνολογική πλαισίωση (Proactive Scaffolding)');
  } else {
    parts.push(`Ισορροπημένη ροή στη Ζώνη Βέλτιστης Πρόκλησης (${ageBand} ετών)`);
  }

  parts.push(`Ρυθμός φωνής: ${model.optimalSpeechRate.toFixed(2)}x`);
  return parts.join(' • ');
}

/**
 * Trains the child's on-device learning model after completing an activity using
 * Exponential Moving Average (EMA) reinforcement updates.
 */
/**
 * Activities whose success the app CANNOT verify (body movement, real-world tasks).
 * They count as played, but never change the domain estimates.
 */
export const SELF_REPORT_ACTIVITY_IDS: ReadonlySet<ActivityId> = new Set<ActivityId>([
  '07-move-freeze',
  '10-copy-animal',
  '11-real-world-mission',
  '17-sensory-proprioception',
]);

/** Go/No-Go activities: a wrong tap here is a real "commission error" (tap when you should wait). */
export const INHIBITION_ACTIVITY_IDS: ReadonlySet<ActivityId> = new Set<ActivityId>([
  '07-move-freeze',
  '09-wait-signal',
]);

/** Share of correct responses: correct / (correct + wrong). null when nothing was measured. */
export function computeAccuracy(completedRounds: number, errorsCount: number): number | null {
  const total = completedRounds + errorsCount;
  if (total <= 0) return null;
  return completedRounds / total;
}

export function trainChildProfileOnActivityCompletion(
  profile: ChildMicroProfile,
  event: {
    activityId: ActivityId;
    hintsUsed: number;
    impulsiveTapsAbsorbed: number;
    durationSeconds: number;
    /** Wrong responses (gentle nudges) during the activity. */
    errorsCount?: number;
    /** Correctly completed rounds (defaults to 3). */
    completedRounds?: number;
    selectedStrategy?: 'time' | 'example' | 'retry' | null;
  }
): ChildMicroProfile {
  const prev = profile.learnedModel;
  const alpha = 0.35; // Continual learning rate
  const errors = Math.max(0, event.errorsCount ?? 0);
  const rounds = Math.max(1, event.completedRounds ?? 3);
  const isSelfReport = SELF_REPORT_ACTIVITY_IDS.has(event.activityId);

  // 1. Session signal = accuracy, reduced by hints (support needed). Range [0.1, 1].
  //    Rapid double-taps are a touch-screen artefact and are NOT counted as errors.
  const accuracy = computeAccuracy(rounds, errors) ?? 1;
  const sessionMasterySignal = clamp01(Math.max(0.1, accuracy - event.hintsUsed * 0.1));

  // 2. Update targeted domain estimates (skipped for self-report activities)
  const targetDomains = ACTIVITY_DOMAIN_MAP[event.activityId] ?? ['visualAttention'];
  const updatedMastery: DomainMasteryScores = { ...prev.domainMastery };
  if (!isSelfReport) {
    for (const dom of targetDomains) {
      const oldScore = updatedMastery[dom] ?? 0.5;
      updatedMastery[dom] = clamp01((1 - alpha) * oldScore + alpha * sessionMasterySignal);
    }
  }

  // 3. Impulsivity = commission errors in Go/No-Go activities only (unchanged elsewhere)
  const nextImpulsivity = INHIBITION_ACTIVITY_IDS.has(event.activityId)
    ? clamp01((1 - alpha) * prev.impulsivityIndex + alpha * Math.min(1.0, errors / 3))
    : prev.impulsivityIndex;

  const observedScaffoldingNeed = Math.min(1.0, event.hintsUsed / 2);
  const nextScaffoldingNeed = clamp01(
    (1 - alpha) * prev.scaffoldingNeedIndex + alpha * observedScaffoldingNeed
  );

  // 4. Calibrate optimal speech rate based on child's age band and scaffolding need
  const baseAgeRate =
    profile.ageBand === '4-5'
      ? 0.85
      : profile.ageBand === '5-6'
      ? 0.88
      : profile.ageBand === '6-8'
      ? 0.91
      : 0.94;
  const rateAdjustment =
    nextScaffoldingNeed >= 0.45 ? -0.04 : nextScaffoldingNeed <= 0.2 ? 0.03 : 0;
  const nextSpeechRate = Math.max(
    0.84,
    Math.min(0.97, Math.round((baseAgeRate + rateAdjustment) * 100) / 100)
  );

  // 5. Increment per-child activity play count so next replay rotates to unseen scenarios
  const nextPlayCounts: Record<string, number> = {
    ...prev.activityPlayCounts,
    [event.activityId]: (prev.activityPlayCounts[event.activityId] ?? 0) + 1,
  };

  const nextModel: ChildAdaptiveLearningModel = {
    totalSessionsCompleted: prev.totalSessionsCompleted + 1,
    impulsivityIndex: nextImpulsivity,
    scaffoldingNeedIndex: nextScaffoldingNeed,
    optimalSpeechRate: nextSpeechRate,
    preferredStrategyId: event.selectedStrategy ?? prev.preferredStrategyId,
    domainMastery: updatedMastery,
    activityPlayCounts: nextPlayCounts,
    adaptationSummaryEl: '',
    lastUpdatedTimestamp: new Date().toISOString(),
  };

  nextModel.adaptationSummaryEl = buildAdaptationSummary(nextModel, profile.ageBand);

  return {
    ...profile,
    learnedModel: nextModel,
  };
}

/**
 * Recommends the next optimal activity for the active child profile based on their
 * Zone of Proximal Development (lowest or least-recently practiced domain for their age).
 */
export function getPersonalizedActivityRecommendation(
  profile: ChildMicroProfile,
  allActivities: ActivityDefinition[]
): {
  activity: ActivityDefinition;
  domainKey: ClinicalDomainKey;
  domainLabelEl: string;
  reasonEl: string;
} {
  const ageFiltered = allActivities.filter((a) => a.recommendedAges.includes(profile.ageBand));
  const candidates = ageFiltered.length > 0 ? ageFiltered : allActivities;

  // Find the domain that will benefit most from gentle reinforcement (lowest mastery score)
  const masteryEntries = Object.entries(profile.learnedModel.domainMastery) as Array<
    [ClinicalDomainKey, number]
  >;
  masteryEntries.sort((a, b) => a[1] - b[1]);
  const focusDomain = masteryEntries[0][0];

  // Pick the least-played candidate activity in that domain (or overall least played)
  const domainCandidates = candidates.filter((act) =>
    (ACTIVITY_DOMAIN_MAP[act.id] ?? []).includes(focusDomain)
  );
  const pool = domainCandidates.length > 0 ? domainCandidates : candidates;

  const sortedByPlays = [...pool].sort((a, b) => {
    const playsA = profile.learnedModel.activityPlayCounts[a.id] ?? 0;
    const playsB = profile.learnedModel.activityPlayCounts[b.id] ?? 0;
    return playsA - playsB;
  });

  const chosen = sortedByPlays[0] ?? allActivities[0];
  const domainMeta = DOMAIN_LABELS_EL[focusDomain];

  const reasonEl =
    profile.learnedModel.totalSessionsCompleted === 0
      ? `Ιδανικό ξεκίνημα για ηλικία ${profile.ageBand} ετών στον τομέα «${domainMeta.labelEl}».`
      : `Προσαρμοσμένη πρόταση για το προφίλ «${profile.nickname}» με βάση την πρόοδό του στον τομέα «${domainMeta.labelEl}».`;

  return {
    activity: chosen,
    domainKey: focusDomain,
    domainLabelEl: domainMeta.labelEl,
    reasonEl,
  };
}
