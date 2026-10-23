export type AgeBandId = '4-5' | '5-6' | '6-8' | '8-10' | '10-12';

export interface AgeBandProtocol {
  id: AgeBandId;
  labelEl: string;
  stageEl: string;
  recommendedTotalMinutes: number;
  digitalMinutes: number;
  physicalMinutes: number;
  smoothLandingMinutes: number;
  interactionStyleEl: string;
  clinicalGoalEl: string;
  digitalFocusEl: string;
  physicalBridgeEl: string;
  specialistProtocolEl: string;
}

export const DEVICE_STRATEGY_SUMMARY = {
  titleEl: 'Στρατηγική Συσκευής: Tablet 10–11" σε Οριζόντια Σταθερή Βάση (Kiosk Mode / Guided Access)',
  whyNotMobileEl:
    'Τα κινητά έχουν μικρή επιφάνεια αφής που αυξάνει τα παρορμητικά clicks (rapid tapping) και συνδέονται με ντοπαμινικό zombie scrolling.',
  whyNotPcEl:
    'Το ποντίκι και το πληκτρολόγιο απαιτούν σύνθετο οπτικοκινητικό συντονισμό που προκαλεί γνωστική υπερφόρτωση (cognitive overload) στις ηλικίες 4–8 ετών.',
  ergonomicsEl:
    'Σταθερή απόσταση 35–40 εκ. από τα μάτια, χρήση και των δύο χεριών, μεγάλοι στόχοι αφής (>= 64px) και κλείδωμα σε μία εφαρμογή (Guided Access).',
};

export const AGE_BAND_PROTOCOLS: AgeBandProtocol[] = [
  {
    id: '4-5',
    labelEl: '4–5 ετών',
    stageEl: 'Προ-νηπιακό Στάδιο',
    recommendedTotalMinutes: 10,
    digitalMinutes: 3,
    physicalMinutes: 5,
    smoothLandingMinutes: 2,
    interactionStyleEl: 'Μεγάλα εικονογράμματα, φωνητική οδηγία 2–3 λέξεων, μηδενική απαίτηση ανάγνωσης',
    clinicalGoalEl:
      'Αισθητηριακή γείωση, εστίαση σε 1 απλό ερέθισμα, εκπαίδευση στο «Σταμάτα-Ξεκίνα» (Go/No-Go) και βασική ιδιοδεκτικότητα.',
    digitalFocusEl:
      'Οπτικό Κυνήγι 3 αντικειμένων σε καθαρό φόντο & Το Αρκουδάκι που Χορεύει και Παγώνει.',
    physicalBridgeEl:
      'Αποστολή Αφής: «Βρες 1 μαλακό μαξιλάρι και κάθισε πάνω του σαν βατραχάκι».',
    specialistProtocolEl:
      'Λογοθεραπευτικό Πρωτόκολλο: Εντολές αυστηρά 2–3 λέξεων («Δες το παπάκι») με πλήρη εικονογράμματα.',
  },
  {
    id: '5-6',
    labelEl: '5–6 ετών',
    stageEl: 'Νηπιαγωγείο / Πρώιμη Παιδική Ηλικία',
    recommendedTotalMinutes: 12,
    digitalMinutes: 5,
    physicalMinutes: 5,
    smoothLandingMinutes: 2,
    interactionStyleEl: 'Touch-only, 1 κύρια ενέργεια ανά οθόνη, σάρωση από αριστερά προς τα δεξιά',
    clinicalGoalEl:
      'Επέκταση της μνήμης εργασίας σε 2 στοιχεία και προ-αναγνωστική οπτική σάρωση.',
    digitalFocusEl:
      'Βρες τις 2 Μεγάλες Διαφορές (μεγάλο hitbox) & Τα 2 Μαγικά Κουτιά (οπτική μνήμη).',
    physicalBridgeEl:
      'Αποστολή 2 Βημάτων: «Πάρε 1 μολύβι και βάλ’ το μέσα στο ποτήρι».',
    specialistProtocolEl:
      'Εργοθεραπευτικό Πρωτόκολλο: Αμφίπλευρος συντονισμός χεριών (το ένα στηρίζει, το άλλο ενεργεί).',
  },
  {
    id: '6-8',
    labelEl: '6–8 ετών',
    stageEl: 'Πρώτες Τάξεις Δημοτικού',
    recommendedTotalMinutes: 15,
    digitalMinutes: 8,
    physicalMinutes: 5,
    smoothLandingMinutes: 2,
    interactionStyleEl: 'Εικονογραφήσεις + λέξεις-κλειδιά, διαχείριση κανόνων και ρουτινών',
    clinicalGoalEl:
      'Γνωστική ευελιξία (αλλαγή κανόνα Χρώμα -> Σχήμα), σειροθέτηση καθημερινών ρουτινών και αυτοσυγκράτηση.',
    digitalFocusEl:
      'Ταξινόμηση Χρώμα -> Σχήμα & Οργάνωση Πρωινής Ρουτίνας (3 κάρτες).',
    physicalBridgeEl:
      'Χτίσιμο Μοτίβου με φυσικά τουβλάκια LEGO στο γραφείο.',
    specialistProtocolEl:
      'Πρωτόκολλο Αυτορρύθμισης: Μηδενικός αρνητικός ήχος· ήρεμη προτροπή «Ας κοιτάξουμε πρώτα το χρώμα μαζί».',
  },
  {
    id: '8-10',
    labelEl: '8–10 ετών',
    stageEl: 'Μέσες Τάξεις Δημοτικού',
    recommendedTotalMinutes: 18,
    digitalMinutes: 10,
    physicalMinutes: 5,
    smoothLandingMinutes: 3,
    interactionStyleEl: 'Πολυεπίπεδοι στόχοι, επιλογή στρατηγικής βοήθειας (Hint Ladder)',
    clinicalGoalEl:
      'Αντίσταση σε περισπασμούς (distractors), σειριακή μνήμη 4 στοιχείων και ενίσχυση εσωτερικού μονολόγου.',
    digitalFocusEl:
      'Sequence Master (4 σύμβολα χωρίς ποινή) & Περίμενε το Σήμα-Κλειδί (2 χαρακτηριστικά).',
    physicalBridgeEl:
      'Οργάνωση Γραφείου: «Βάλε 3 μαρκαδόρους στη μολυβοθήκη και κλείσε το τετράδιο».',
    specialistProtocolEl:
      'Ενίσχυση ολοκλήρωσης σχολικών μικρο-καθηκόντων χωρίς εξωτερική πίεση.',
  },
  {
    id: '10-12',
    labelEl: '10–12 ετών',
    stageEl: 'Προ-εφηβεία / Τελικές Τάξεις Δημοτικού',
    recommendedTotalMinutes: 20,
    digitalMinutes: 14,
    physicalMinutes: 4,
    smoothLandingMinutes: 2,
    interactionStyleEl: 'Αυξημένη αυτονομία, σχεδιασμός πολλαπλών βημάτων & μεταγνωστική αναστοχαστική ερώτηση',
    clinicalGoalEl:
      'Μεταγνωστική επίγνωση («Πώς σκέφτομαι;»), στρατηγικός σχεδιασμός και αναγνώριση σημείων κόπωσης.',
    digitalFocusEl:
      'Σύνθετος Σχεδιασμός & Αυτοπαρατήρηση («Τι σε βοήθησε περισσότερο;»).',
    physicalBridgeEl:
      'Προετοιμασία Επόμενης Ημέρας: Οργάνωση 4 αντικειμένων για το σχολείο.',
    specialistProtocolEl:
      'Μεταγνώση: Επιλογή προσωπικής στρατηγικής στο τέλος κάθε αποστολής.',
  },
];

export function getAgeBandProtocol(id: AgeBandId): AgeBandProtocol {
  return AGE_BAND_PROTOCOLS.find((p) => p.id === id) ?? AGE_BAND_PROTOCOLS[2];
}
