export type SpecialistDisciplineId =
  | 'ergotherapy'
  | 'physiatry'
  | 'speech-therapy'
  | 'child-psychology'
  | 'child-psychiatry'
  | 'social-work'
  | 'music-kinetic'
  | 'theatrical-education';

export interface InterdisciplinaryProtocol {
  id: SpecialistDisciplineId;
  titleEl: string;
  titleEn: string;
  emoji: string;
  coreClinicalObjectiveEl: string;
  methodologyEl: string;
  platformImplementationEl: string;
  linkedActivityCodes: string[];
}

export const INTERDISCIPLINARY_PROTOCOLS: InterdisciplinaryProtocol[] = [
  {
    id: 'ergotherapy',
    titleEl: 'Εργοθεραπεία (Occupational Therapy — OT)',
    titleEn: 'Occupational Therapy & Sensory Integration',
    emoji: '👐',
    coreClinicalObjectiveEl:
      'Αισθητηριακή ολοκλήρωση (Ayres), αμφίπλευρος συντονισμός, λεπτή κινητικότητα, γραφοκινητική ετοιμότητα, κινητικός σχεδιασμός (πράξη) και αυτονομία καθημερινής ζωής (ADL).',
    methodologyEl:
      'Χρήση ιδιοδεκτικών διαλειμμάτων («βαριάς εργασίας»), οπτικοκινητικής ιχνηλάτησης αριστερά-προς-δεξιά και γεφύρωσης οθόνης με φυσικά αντικείμενα (κουτάλι, μολύβι, τουβλάκια, κουμπιά).',
    platformImplementationEl:
      'Δραστηριότητες 02, 11, 12, 16 (12 γραφοκινητικές διαδρομές & λεπτή σύλληψη), 17 (12 ασκήσεις ιδιοδεκτικότητας) και 18 (12 σενάρια καθημερινής πράξης & αυτονομίας).',
    linkedActivityCodes: ['02', '11', '12', '16', '17', '18'],
  },
  {
    id: 'physiatry',
    titleEl: 'Φυσιατρική & Παιδιατρική Αποκατάσταση (Physiatry / PM&R)',
    titleEn: 'Pediatric Physiatry & Postural Biomechanics',
    emoji: '🧘',
    coreClinicalObjectiveEl:
      'Στασικός έλεγχος κορμού, εργονομική ευθυγράμμιση αυχένα-ώμων, πρόληψη μυοσκελετικής κόπωσης και ιδιοδεκτική φόρτιση αρθρώσεων.',
    methodologyEl:
      'Τοποθέτηση Τάμπλετ (Tablet 10–11") σε σταθερή βάση γραφείου σε απόσταση 35–40 εκ., ισότιμη Καθιστή Εκδοχή (Seated Mode) με σταθερή λεκάνη και πέλματα στο δάπεδο, και ήπιες διατάσεις.',
    platformImplementationEl:
      'Δραστηριότητες 07 (12 φάσεις Go/No-Go), 10 (12 στάσεις ισορροπίας ζώων) και 17 (12 ασκήσεις στασικού ελέγχου, ισομετρικών πιέσεων & αποφόρτισης αυχένα/ώμων) + Εργονομικός Οδηγός Kiosk.',
    linkedActivityCodes: ['07', '10', '17'],
  },
  {
    id: 'speech-therapy',
    titleEl: 'Λογοθεραπεία (Speech & Language Therapy — SLT)',
    titleEn: 'Speech, Phonological & Pragmatic Language Therapy',
    emoji: '🗣️',
    coreClinicalObjectiveEl:
      'Φωνολογική επίγνωση, συλλαβική κατάτμηση, ακουστική διάκριση ελάχιστων ζευγών, αντιληπτική/εκφραστική σύνταξη και πραγματολογική αφήγηση.',
    methodologyEl:
      'Κλιμάκωση από εντολές 2–3 λέξεων με 100% οπτικά εικονογράμματα (4–5 ετών) έως σύνθετη δομή αφήγησης (Ποιος-Πού-Τι-Γιατί) και φωνολογική σύνθεση (8–12 ετών).',
    platformImplementationEl:
      'Δραστηριότητες 08 (12 ακουστικές εντολές), 13 (36 φωνολογικές λέξεις σε 3 ηλικιακές βαθμίδες), 14 (12 ιστορίες Colourful Semantics) και 15 (12 ελάχιστα ζεύγη & χωροχρονικές έννοιες).',
    linkedActivityCodes: ['08', '13', '14', '15'],
  },
  {
    id: 'child-psychology',
    titleEl: 'Παιδοψυχολογία (Child Psychology — CBT & Self-Regulation)',
    titleEn: 'Child Psychology & Cognitive-Behavioral Scaffolding',
    emoji: '🧠',
    coreClinicalObjectiveEl:
      'Ανοχή στη ματαίωση, ανάπτυξη εσωτερικού αυτοκαθοδηγούμενου λόγου (internal monologue), γνωστική ευελιξία και μεταγνωστική αυτοπαρατήρηση.',
    methodologyEl:
      'Μη-τιμωρητική ανατροφοδότηση (0% απώλεια προόδου σε λάθος), κλιμακωτή βοήθεια 3 επιπέδων (Hint Ladder) και ερώτηση αυτοπαρατήρησης στο τέλος κάθε αποστολής.',
    platformImplementationEl:
      'Δραστηριότητες 03 (15 σετ οπτικής μνήμης), 04 (15 ακολουθίες), 06 (12 εναλλαγές κανόνων), 19 (12 σκηνές θεάτρου συναισθημάτων & αυτορρύθμισης) + Αόρατη Μηχανή Προσαρμογής.',
    linkedActivityCodes: ['03', '04', '06', '19'],
  },
  {
    id: 'child-psychiatry',
    titleEl: 'Παιδοψυχιατρική (Child & Adolescent Psychiatry)',
    titleEn: 'Neurodevelopmental Regulation & Dopamine Hygiene',
    emoji: '🩺',
    coreClinicalObjectiveEl:
      'Ρύθμιση επιπέδων διέγερσης (arousal modulation), προστασία από ντοπαμινική υπερδιέγερση (variable-ratio reward loops) και ομαλή νευροβιολογική αποφόρτιση.',
    methodologyEl:
      'Αυστηρή απουσία έντονων neon χρωμάτων, σειρήνων και αγχωτικών χρονομέτρων. Εφαρμογή του πρωτοκόλλου Smooth Landing (Module 13) με μείωση μπλε φωτός 2 λεπτά πριν από τη λήξη.',
    platformImplementationEl:
      'Δραστηριότητες 01 (15 πλέγματα οπτικής σάρωσης), 07, 09 (12 ροές συνεχούς προσοχής CPT) + Module 13 Smooth Landing & Anti-Frustration 400ms Debounce.',
    linkedActivityCodes: ['01', '07', '09'],
  },
  {
    id: 'social-work',
    titleEl: 'Κοινωνική Εργασία & Οικογενειακή Συστημική (Social Work)',
    titleEn: 'Ecological Home-School Bridge & Family Routines',
    emoji: '🏡',
    coreClinicalObjectiveEl:
      'Ενδυνάμωση οικογένειας, μεταφορά δεξιοτήτων στις καθημερινές ρουτίνες σπιτιού/σχολείου και μηδενικός κοινωνικοοικονομικός αποκλεισμός.',
    methodologyEl:
      'Αποστολές που χρησιμοποιούν απλά αντικείμενα κάθε σπιτιού (κουτάλι, ποτήρι, μαξιλάρι), δομή συνεδρίας Split (Ψηφιακό + Φυσικός Χώρος) και οδηγίες συν-ρύθμισης για γονείς.',
    platformImplementationEl:
      'Δραστηριότητες 05 (15 καθημερινές ρουτίνες), 11 (12 αποστολές στον χώρο), 18 (12 σενάρια αυτονομίας) και 19 (12 κοινωνικές ιστορίες επίλυσης συγκρούσεων).',
    linkedActivityCodes: ['05', '11', '18', '19'],
  },
  {
    id: 'music-kinetic',
    titleEl: 'Μουσικοκινητική Αγωγή (Dalcroze / Orff Music & Movement)',
    titleEn: 'Rhythmic Entrainment & Auditory-Motor Synchronization',
    emoji: '🎵',
    coreClinicalObjectiveEl:
      'Συγχρονισμός ακοής-κίνησης, έλεγχος ταχύτητας (Tempo: Adagio vs Allegro), αναστολή κίνησης σε μουσική παύση και πολυρυθμικός συντονισμός σώματος (Body Percussion).',
    methodologyEl:
      'Χρήση ήρεμων συχνοτήτων μαρίμπας (Web Audio API), ρυθμικών παλμών (παλαμάκια, άγγιγμα γονάτων) και εναλλαγής ρυθμού με οπτικά σύμβολα.',
    platformImplementationEl:
      'Δραστηριότητες 07 (Κίνηση & Πάγωμα), 13 (Ρυθμός Συλλαβών) και 20 (12 ρυθμικά μέτρα Dalcroze/Orff & μουσικές παύσεις).',
    linkedActivityCodes: ['07', '13', '20'],
  },
  {
    id: 'theatrical-education',
    titleEl: 'Θεατρική Αγωγή & Δραματοποίηση (Theatrical Education)',
    titleEn: 'Embodied Role-Play, Emotional Mirroring & Statue Freeze',
    emoji: '🎭',
    coreClinicalObjectiveEl:
      'Σωματική έκφραση, ενσυναίσθηση (Theory of Mind), αναγνώριση προσωπείου/συναισθήματος και πρόβα κοινωνικών ρόλων μέσω θεατρικού παιχνιδιού.',
    methodologyEl:
      'Παιχνίδια «Αγάλματα» (Statue Freeze), μίμηση κίνησης/συναισθήματος ζώων και ηρώων, και διαδραστικές κοινωνικές σκηνές ρόλων.',
    platformImplementationEl:
      'Δραστηριότητες 10 (12 στάσεις μίμησης ζώων), 14 (12 δραματοποιημένες ιστορίες) και 19 (12 σκηνές θεάτρου συναισθημάτων & ρόλων).',
    linkedActivityCodes: ['10', '14', '19'],
  },
];
