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
      'Δραστηριότητες 02, 11, 12, 16 (Λεπτή Κινητικότητα & Δάχτυλα-Καλλιτέχνες), 17 (Αισθητηριακή Ισορροπία) και 18 (Πράξη & Καθημερινή Αυτονομία).',
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
      'Τοποθέτηση Tablet 10–11" σε σταθερή βάση γραφείου σε απόσταση 35–40 εκ., ισότιμη Καθιστή Εκδοχή (Seated Mode) με σταθερή λεκάνη και πέλματα στο δάπεδο, και ήπιες διατάσεις.',
    platformImplementationEl:
      'Δραστηριότητες 07, 10 και 17 (Στασικός Έλεγχος, Ισομετρικές Πιέσεις Παλαμών & Αποφόρτιση Αυχένα/Ώμων) + Εργονομικός Οδηγός Kiosk.',
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
      'Δραστηριότητες 08, 13 (Το Μικρόφωνο των Συλλαβών & Φωνολογία), 14 (Δόμηση Λόγου & Αφήγησης) και 15 (Ακουστική Διάκριση & Χωρικές Εντολές).',
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
      'Δραστηριότητες 03, 04, 06, 19 (Θέατρο Συναισθημάτων & Θερμόμετρο Αυτορρύθμισης) + Αόρατη Μηχανή Προσαρμογής Σεναρίων.',
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
      'Αυστηρή απουσία έντονων neon χρωμάτων, σειρήνων και αγχωτικών χρονομέτρων. Εφαρμογή του πρωτοκόλλου Smooth Landing (Module 13) με μείωση μπλε φωτός 2 λεπτά πριν τη λήξη.',
    platformImplementationEl:
      'Δραστηριότητες 01, 07, 09 (Go/No-Go & Καθυστέρηση Απόκρισης) + Module 13 Smooth Landing & Anti-Frustration 400ms Debounce.',
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
      'Δραστηριότητες 05 (Ρουτίνες Καθημερινότητας), 11 (Αποστολές στο Σπίτι), 18 (Αυτονομία) και 19 (Κοινωνικές Ιστορίες & Επίλυση Συγκρούσεων).',
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
      'Δραστηριότητες 07 (Κινήσου & Πάγωσε), 13 (Ρυθμός Συλλαβών) και 20 (Ο Μαέστρος του Ρυθμού & της Κίνησης).',
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
      'Δραστηριότητες 10 (Μιμήσου το Ζωάκι / Ρόλο), 14 (Δραματοποίηση Ιστορίας) και 19 (Το Θέατρο των Συναισθημάτων).',
    linkedActivityCodes: ['10', '14', '19'],
  },
];
