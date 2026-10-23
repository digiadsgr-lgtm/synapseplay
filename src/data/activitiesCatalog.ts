import type { ActivityDefinition, CategoryDefinition, CategoryId } from '../types/domain';

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'detective-eyes',
    groupCode: 'A',
    titleEl: 'Μάτια Ντετέκτιβ',
    titleEn: 'Detective Eyes',
    subtitleEl: 'Παρατήρηση & Επιλεκτική Προσοχή',
    voicePromptEl: 'Μάτια Ντετέκτιβ! Παρατηρώ προσεκτικά και βρίσκω αυτό που ψάχνω.',
    pictogram: '🔍',
    accentColorClass: 'border-slate bg-slate-surface text-charcoal',
    badgeBgClass: 'bg-slate text-white',
  },
  {
    id: 'think-plan',
    groupCode: 'B',
    titleEl: 'Σκέψου & Οργάνωσε',
    titleEn: 'Think & Plan',
    subtitleEl: 'Εργαζόμενη Μνήμη & Ευελιξία',
    voicePromptEl: 'Σκέψου και Οργάνωσε! Θυμάμαι τη σειρά και αλλάζω κανόνα με άνεση.',
    pictogram: '🧩',
    accentColorClass: 'border-sage bg-sage-surface text-charcoal',
    badgeBgClass: 'bg-sage-dark text-white',
  },
  {
    id: 'pause-choose',
    groupCode: 'C',
    titleEl: 'Σταμάτα & Διάλεξε',
    titleEn: 'Pause & Choose',
    subtitleEl: 'Αναστολή Παρόρμησης & Αυτορρύθμιση',
    voicePromptEl: 'Σταμάτα και Διάλεξε! Ακούω, περιμένω το σήμα και αποφασίζω ήρεμα.',
    pictogram: '🛑',
    accentColorClass: 'border-terracotta bg-terracotta-surface text-charcoal',
    badgeBgClass: 'bg-terracotta-dark text-white',
  },
  {
    id: 'move-build',
    groupCode: 'D',
    titleEl: 'Κινήσου & Φτιάξε',
    titleEn: 'Move & Build',
    subtitleEl: 'Κινητικός Σχεδιασμός & Πραγματικός Κόσμος',
    voicePromptEl: 'Κινήσου και Φτιάξε! Δράση στο δωμάτιο και κατασκευές με τα χέρια.',
    pictogram: '🌱',
    accentColorClass: 'border-sage-dark bg-sand-dark text-charcoal',
    badgeBgClass: 'bg-charcoal text-white',
  },
];

export const ACTIVITIES: ActivityDefinition[] = [
  // GROUP A — DETECTIVE EYES
  {
    id: '01-visual-search',
    code: '01',
    categoryId: 'detective-eyes',
    titleEl: 'Οπτική Αναζήτηση',
    titleEn: 'Visual Search',
    subtitleEl: 'Βρες το αντικείμενο-στόχο ανάμεσα στα άλλα',
    voicePromptEl: 'Κοίτα το αντικείμενο-στόχο επάνω. Βρες και πάτησε το ίδιο μέσα στον πίνακα!',
    executiveDomain: 'Επιλεκτική Προσοχή & Οπτική Διάκριση',
    pictogram: '🎯',
    cues: [
      { emoji: '👀', labelEl: 'Κοίτα τον στόχο' },
      { emoji: '🔍', labelEl: 'Ψάξε ήρεμα' },
      { emoji: '👆', labelEl: 'Πάτησε το σωστό' },
    ],
    parentGuidanceEl:
      'Ενισχύει την ικανότητα φιλτραρίσματος οπτικών περισπασμών χωρίς πίεση χρόνου.',
    totalRounds: 3,
  },
  {
    id: '02-spot-difference',
    code: '02',
    categoryId: 'detective-eyes',
    titleEl: 'Βρες τη Διαφορά',
    titleEn: 'Spot the Difference',
    subtitleEl: 'Σύγκρινε τις δύο κάρτες και βρες τι άλλαξε',
    voicePromptEl: 'Κοίτα τις δύο εικόνες. Πάτησε στη δεύτερη εικόνα τα στοιχεία που είναι διαφορετικά!',
    executiveDomain: 'Συγκριτική Παρατήρηση & Εστίαση Λεπτομέρειας',
    pictogram: '🖼️',
    cues: [
      { emoji: '🖼️', labelEl: 'Δες τις 2 εικόνες' },
      { emoji: '🔄', labelEl: 'Σύγκρινε' },
      { emoji: '✨', labelEl: 'Πάτησε τη διαφορά' },
    ],
    parentGuidanceEl:
      'Μεγάλη ανοχή αφής (64x64px+) ώστε το παιδί να μην απογοητεύεται από την ακρίβεια κλικ.',
    totalRounds: 3,
  },
  {
    id: '03-visual-memory',
    code: '03',
    categoryId: 'detective-eyes',
    titleEl: 'Οπτική Μνήμη',
    titleEn: 'Visual Memory',
    subtitleEl: 'Θυμήσου πού κρύφτηκε το σύμβολο',
    voicePromptEl: 'Κοίτα καλά τις κάρτες πριν γυρίσουν. Μετά βρες πού κρύφτηκε το αντικείμενο!',
    executiveDomain: 'Χωρική Εργαζόμενη Μνήμη',
    pictogram: '🃏',
    cues: [
      { emoji: '🧠', labelEl: 'Απομνημόνευσε' },
      { emoji: '🙈', labelEl: 'Κρύβονται' },
      { emoji: '👆', labelEl: 'Βρες τη θέση' },
    ],
    parentGuidanceEl:
      'Εξασκεί τη βραχυπρόθεσμη οπτικοχωρική συγκράτηση με 3 έως 6 κάρτες.',
    totalRounds: 3,
  },

  // GROUP B — THINK & PLAN
  {
    id: '04-sequence-memory',
    code: '04',
    categoryId: 'think-plan',
    titleEl: 'Μνήμη Ακολουθίας',
    titleEn: 'Sequence Memory',
    subtitleEl: 'Πάτησε τα σύμβολα με την ίδια σειρά',
    voicePromptEl: 'Δες με ποια σειρά φωτίζονται τα σύμβολα. Μετά πάτησέ τα με την ίδια σειρά!',
    executiveDomain: 'Διαδοχική Εργαζόμενη Μνήμη',
    pictogram: '🔔',
    cues: [
      { emoji: '👀', labelEl: 'Δες τη σειρά' },
      { emoji: '⏳', labelEl: 'Περίμενε να τελειώσει' },
      { emoji: '🔢', labelEl: 'Επανάλαβε τη σειρά' },
    ],
    parentGuidanceEl:
      'Χωρίς ποινή σε λάθος: η ακολουθία παρουσιάζεται ξανά ήρεμα για ενίσχυση της αυτοπεποίθησης.',
    totalRounds: 3,
  },
  {
    id: '05-order-steps',
    code: '05',
    categoryId: 'think-plan',
    titleEl: 'Βάλε σε Σειρά',
    titleEn: 'Order the Steps',
    subtitleEl: 'Οργάνωσε τα βήματα της καθημερινής ρουτίνας',
    voicePromptEl: 'Πάτησε τις κάρτες με τη σωστή σειρά: τι κάνουμε πρώτο, δεύτερο και τρίτο;',
    executiveDomain: 'Σχεδιασμός & Οργάνωση Ρουτίνας',
    pictogram: '📋',
    cues: [
      { emoji: '1️⃣', labelEl: 'Πρώτο βήμα' },
      { emoji: '2️⃣', labelEl: 'Επόμενο βήμα' },
      { emoji: '✅', labelEl: 'Ολοκλήρωση' },
    ],
    parentGuidanceEl:
      'Συνδέει την εκτελεστική λειτουργία με καθημερινές ρουτίνες (δόντια, τσάντα, ύπνος).',
    totalRounds: 3,
  },
  {
    id: '06-switch-rule',
    code: '06',
    categoryId: 'think-plan',
    titleEl: 'Άλλαξε τον Κανόνα',
    titleEn: 'Switch the Rule',
    subtitleEl: 'Ταξινόμησε με βάση το Χρώμα ή το Σχήμα',
    voicePromptEl: 'Κοίτα τον κανόνα επάνω! Τώρα διαλέγουμε με βάση το χρώμα ή με βάση το σχήμα;',
    executiveDomain: 'Γνωστική Ευελιξία (Set-Shifting)',
    pictogram: '🔀',
    cues: [
      { emoji: '🎨', labelEl: 'Κανόνας Χρώματος' },
      { emoji: '⭐', labelEl: 'Κανόνας Σχήματος' },
      { emoji: '🔄', labelEl: 'Πρόσεξε την αλλαγή' },
    ],
    parentGuidanceEl:
      'Καλλιεργεί τη γνωστική ευελιξία με ξεκάθαρη οπτική ειδοποίηση όταν αλλάζει ο κανόνας.',
    totalRounds: 4,
  },

  // GROUP C — PAUSE & CHOOSE
  {
    id: '07-move-freeze',
    code: '07',
    categoryId: 'pause-choose',
    titleEl: 'Κινήσου & Πάγωσε',
    titleEn: 'Move & Freeze',
    subtitleEl: 'Πάτησε στον ρυθμό στο Πράσινο, σταμάτα στο ΣΤΟΠ!',
    voicePromptEl: 'Όταν βλέπεις το πράσινο φύλλο, πάτα ρυθμικά! Όταν βγει το ΣΤΟΠ, κράτα τα χέρια ακίνητα!',
    executiveDomain: 'Αναστολή Παρόρμησης (Go / No-Go)',
    pictogram: '🚦',
    cues: [
      { emoji: '🌿', labelEl: 'Πράσινο = Κίνηση/Πάτημα' },
      { emoji: '🛑', labelEl: 'ΣΤΟΠ = Παγώνω!' },
      { emoji: '🪑', labelEl: 'Και καθιστή επιλογή' },
    ],
    parentGuidanceEl:
      'Κλασική άσκηση Go/No-Go. Περιλαμβάνει καθιστή εναλλακτική (χτύπημα δακτύλων) και ήρεμη ανατροφοδότηση.',
    supportsSeatedMode: true,
    totalRounds: 3,
  },
  {
    id: '08-listen-do',
    code: '08',
    categoryId: 'pause-choose',
    titleEl: 'Άκου & Κάνε',
    titleEn: 'Listen & Do',
    subtitleEl: 'Περίμενε να ολοκληρωθεί η οδηγία πριν πατήσεις',
    voicePromptEl: 'Πρώτα άκου και δες ολόκληρη την οδηγία. Όταν ανάψει το πράσινο πλαίσιο, διάλεξε!',
    executiveDomain: 'Έλεγχος Παρόρμησης & Ακουστική/Οπτική Κατανόηση',
    pictogram: '🎧',
    cues: [
      { emoji: '👂', labelEl: 'Άκου/Δες την οδηγία' },
      { emoji: '⏳', labelEl: 'Περίμενε το σήμα' },
      { emoji: '👆', labelEl: 'Τώρα διάλεξε' },
    ],
    parentGuidanceEl:
      'Βοηθά το παιδί να μην απαντά παρορμητικά πριν ολοκληρωθεί η εκφώνηση/εμφάνιση της οδηγίας.',
    totalRounds: 3,
  },
  {
    id: '09-wait-signal',
    code: '09',
    categoryId: 'pause-choose',
    titleEl: 'Περίμενε το Σήμα',
    titleEn: 'Wait for the Signal',
    subtitleEl: 'Πάτησε μόνο όταν εμφανιστεί το ειδικό σύμβολο-κλειδί',
    voicePromptEl: 'Περίμενε ήρεμα... Πάτησε το αντικείμενο ΜΟΝΟ όταν εμφανιστεί μαζί με το χρυσό αστέρι!',
    executiveDomain: 'Επαγρύπνηση & Καθυστέρηση Απόκρισης',
    pictogram: '🌟',
    cues: [
      { emoji: '👀', labelEl: 'Παρακολούθησε' },
      { emoji: '✋', labelEl: 'Μη βιάζεσαι' },
      { emoji: '🌟', labelEl: 'Πάτα μόνο με το Αστέρι' },
    ],
    parentGuidanceEl:
      'Εξασκεί την υπομονή και την επιλεκτική ενεργοποίηση μόνο παρουσία του ειδικού σήματος.',
    totalRounds: 3,
  },

  // GROUP D — MOVE & BUILD
  {
    id: '10-copy-animal',
    code: '10',
    categoryId: 'move-build',
    titleEl: 'Μιμήσου το Ζωάκι',
    titleEn: 'Copy the Animal',
    subtitleEl: 'Ήρεμη κίνηση σώματος ή χεριών με ρυθμό',
    voicePromptEl: 'Διάλεξε όρθια ή καθιστή στάση και έλα να κάνουμε μαζί την ήρεμη κίνηση του ζώου!',
    executiveDomain: 'Κινητικός Σχεδιασμός & Ιδιοδεκτικότητα',
    pictogram: '🦩',
    cues: [
      { emoji: '🦩', labelEl: 'Δες τη στάση' },
      { emoji: '🌬️', labelEl: 'Ήρεμη αναπνοή' },
      { emoji: '🪑', labelEl: 'Διαθέσιμη καθιστή εκδοχή' },
    ],
    parentGuidanceEl:
      'Προσφέρει ισότιμη καθιστή εκδοχή για κάθε άσκηση ώστε να προσαρμόζεται σε κάθε χώρο και παιδί.',
    supportsSeatedMode: true,
    totalRounds: 3,
  },
  {
    id: '11-real-world-mission',
    code: '11',
    categoryId: 'move-build',
    titleEl: 'Αποστολή στο Σπίτι',
    titleEn: 'Real-World Mission',
    subtitleEl: 'Βήμα-βήμα αποστολή με απλά αντικείμενα του σπιτιού',
    voicePromptEl: 'Αποστολή στον πραγματικό κόσμο! Ακολούθησε τα βήματα με αντικείμενα του δωματίου σου.',
    executiveDomain: 'Μεταφορά Δεξιοτήτων στον Πραγματικό Κόσμο',
    pictogram: '🏠',
    cues: [
      { emoji: '👀', labelEl: 'Δες το βήμα' },
      { emoji: '🚶', labelEl: 'Κάνε το στο δωμάτιο' },
      { emoji: '☑️', labelEl: 'Πάτα «Το έκανα!»' },
    ],
    parentGuidanceEl:
      'Γεφυρώνει την οθόνη με τον φυσικό χώρο χωρίς να απαιτεί κάμερα ή μικρόφωνο.',
    totalRounds: 3,
  },
  {
    id: '12-build-pattern',
    code: '12',
    categoryId: 'move-build',
    titleEl: 'Φτιάξε το Μοτίβο',
    titleEn: 'Build the Pattern',
    subtitleEl: 'Αντίγραψε το σχέδιο στην οθόνη ή με τουβλάκια',
    voicePromptEl: 'Κοίτα το πρότυπο μοτίβο αριστερά. Φτιάξε το ίδιο σχέδιο στον πίνακα ή με τα τουβλάκια σου!',
    executiveDomain: 'Οπτικοκατασκευαστική Οργάνωση & Σχεδιασμός',
    pictogram: '🧱',
    cues: [
      { emoji: '📐', labelEl: 'Δες το πρότυπο' },
      { emoji: '🧱', labelEl: 'Χτίσε βήμα-βήμα' },
      { emoji: '✨', labelEl: 'Έλεγξε το σχέδιο' },
    ],
    parentGuidanceEl:
      'Μπορεί να εκτελεστεί είτε στην οθόνη είτε παράλληλα με φυσικά τουβλάκια (π.χ. LEGO).',
    totalRounds: 3,
  },
];

export function getCategoryById(id: CategoryId): CategoryDefinition | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getActivityById(id: string): ActivityDefinition | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

export function getActivitiesByCategory(categoryId: CategoryId): ActivityDefinition[] {
  return ACTIVITIES.filter((a) => a.categoryId === categoryId);
}
