import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface NarrativePrompt {
  storyGoalEl: string;
  whoCard: { emoji: string; textEl: string };
  whereCard: { emoji: string; textEl: string };
  actionOptions: Array<{ id: string; emoji: string; textEl: string; isCorrect: boolean }>;
  fullSentenceEl: string;
}

const NARRATIVE_ROUNDS: NarrativePrompt[] = [
  {
    storyGoalEl: 'Ιστορία: Έξω αρχίζει να βρέχει δυνατά. Πώς ολοκληρώνεται λογικά η πρόταση;',
    whoCard: { emoji: '🧒', textEl: 'Ο Μικρός Ήρωας' },
    whereCard: { emoji: '🌧️', textEl: 'στην αυλή με τη βροχή' },
    actionOptions: [
      { id: 'nb1-1', emoji: '☂️', textEl: 'ανοίγει την ομπρέλα του για να μη βραχεί', isCorrect: true },
      { id: 'nb1-2', emoji: '🕶️', textEl: 'φοράει γυαλιά ηλίου στην παραλία', isCorrect: false },
      { id: 'nb1-3', emoji: '🎿', textEl: 'κάνει σκι στο χιόνι', isCorrect: false },
    ],
    fullSentenceEl: 'Ο μικρός ήρωας στην αυλή με τη βροχή ανοίγει την ομπρέλα του για να μη βραχεί!',
  },
  {
    storyGoalEl: 'Ιστορία: Το γατάκι πεινάει το πρωί. Τι κάνει;',
    whoCard: { emoji: '🐱', textEl: 'Το Γατάκι' },
    whereCard: { emoji: '🥣', textEl: 'δίπλα στο μπολ της κουζίνας' },
    actionOptions: [
      { id: 'nb2-1', emoji: '🚲', textEl: 'κάνει ποδήλατο στο πάρκο', isCorrect: false },
      { id: 'nb2-2', emoji: '🥛', textEl: 'πίνει ήρεμα το φρέσκο του γάλα', isCorrect: true },
      { id: 'nb2-3', emoji: '📚', textEl: 'διαβάζει ένα βιβλίο', isCorrect: false },
    ],
    fullSentenceEl: 'Το γατάκι δίπλα στο μπολ της κουζίνας πίνει ήρεμα το φρέσκο του γάλα!',
  },
  {
    storyGoalEl: 'Ιστορία: Η φίλη μας θέλει να ζωγραφίσει ένα δέντρο. Τι επιλέγει;',
    whoCard: { emoji: '👧', textEl: 'Η Μαθήτρια' },
    whereCard: { emoji: '🎨', textEl: 'στο τραπέζι ζωγραφικής' },
    actionOptions: [
      { id: 'nb3-1', emoji: '🖍️', textEl: 'παίρνει τον πράσινο μαρκαδόρο και το χαρτί', isCorrect: true },
      { id: 'nb3-2', emoji: '🥄', textEl: 'παίρνει το κουτάλι της σούπας', isCorrect: false },
      { id: 'nb3-3', emoji: '🛏️', textEl: 'ξαπλώνει για ύπνο', isCorrect: false },
    ],
    fullSentenceEl: 'Η μαθήτρια στο τραπέζι ζωγραφικής παίρνει τον πράσινο μαρκαδόρο και το χαρτί!',
  },
  {
    storyGoalEl: 'Ιστορία: Ο σκυλάκος λερώθηκε με χώμα στον κήπο. Τι κάνει η οικογένεια;',
    whoCard: { emoji: '🐶', textEl: 'Ο Σκυλάκος' },
    whereCard: { emoji: '🛁', textEl: 'στο μπάνιο με το ζεστό νερό' },
    actionOptions: [
      { id: 'nb4-1', emoji: '🧼', textEl: 'πλένεται με αφρό και σκουπίζεται με την πετσέτα', isCorrect: true },
      { id: 'nb4-2', emoji: '🎸', textEl: 'παίζει ηλεκτρική κιθάρα', isCorrect: false },
      { id: 'nb4-3', emoji: '🚀', textEl: 'πετάει με πύραυλο στο φεγγάρι', isCorrect: false },
    ],
    fullSentenceEl: 'Ο σκυλάκος στο μπάνιο με το ζεστό νερό πλένεται με αφρό και σκουπίζεται με την πετσέτα!',
  },
  {
    storyGoalEl: 'Ιστορία: Ο παππούς θέλει να φυτέψει ντομάτες. Τι κάνει;',
    whoCard: { emoji: '👴', textEl: 'Ο Παππούς' },
    whereCard: { emoji: '🪴', textEl: 'στον ηλιόλουστο κήπο' },
    actionOptions: [
      { id: 'nb5-1', emoji: '🚿', textEl: 'σκάβει απαλά το χώμα και ποτίζει τα σποράκια', isCorrect: true },
      { id: 'nb5-2', emoji: '⛸️', textEl: 'κάνει πατινάζ στον πάγο', isCorrect: false },
      { id: 'nb5-3', emoji: '📺', textEl: 'ανάβει την τηλεόραση στο σαλόνι', isCorrect: false },
    ],
    fullSentenceEl: 'Ο παππούς στον ηλιόλουστο κήπο σκάβει απαλά το χώμα και ποτίζει τα σποράκια!',
  },
  {
    storyGoalEl: 'Ιστορία: Το βράδυ βγήκαν τα αστέρια στον ουρανό. Τι κάνει το παιδί;',
    whoCard: { emoji: '🧒', textEl: 'Το Παιδί' },
    whereCard: { emoji: '🛏️', textEl: 'στο ήσυχο υπνοδωμάτιο' },
    actionOptions: [
      { id: 'nb6-1', emoji: '📖', textEl: 'ακούει ένα παραμύθι και κλείνει ήρεμα τα μάτια', isCorrect: true },
      { id: 'nb6-2', emoji: '⚽', textEl: 'παίζει ποδόσφαιρο στον δρόμο', isCorrect: false },
      { id: 'nb6-3', emoji: '🥁', textEl: 'χτυπάει δυνατά τα τύμπανα', isCorrect: false },
    ],
    fullSentenceEl: 'Το παιδί στο ήσυχο υπνοδωμάτιο ακούει ένα παραμύθι και κλείνει ήρεμα τα μάτια!',
  },
  {
    storyGoalEl: 'Ιστορία: Το πουλάκι θέλει να φτιάξει μια ζεστή φωλιά. Τι κάνει;',
    whoCard: { emoji: '🐦', textEl: 'Το Μικρό Πουλάκι' },
    whereCard: { emoji: '🌳', textEl: 'ψηλά στο κλαδί του δέντρου' },
    actionOptions: [
      { id: 'nb7-1', emoji: '🌿', textEl: 'μαζεύει μικρά κλαδάκια και χτίζει τη φωλιά του', isCorrect: true },
      { id: 'nb7-2', emoji: '🚗', textEl: 'οδηγεί αυτοκίνητο στον αυτοκινητόδρομο', isCorrect: false },
      { id: 'nb7-3', emoji: '🤿', textEl: 'βουτάει με μάσκα στον βυθό', isCorrect: false },
    ],
    fullSentenceEl: 'Το μικρό πουλάκι ψηλά στο κλαδί του δέντρου μαζεύει μικρά κλαδάκια και χτίζει τη φωλιά του!',
  },
  {
    storyGoalEl: 'Ιστορία: Η οικογένεια ετοιμάζει υγιεινή σαλάτα για το μεσημέρι. Τι κάνει;',
    whoCard: { emoji: '👨‍👩‍👧', textEl: 'Η Οικογένεια' },
    whereCard: { emoji: '🥗', textEl: 'στον πάγκο της κουζίνας' },
    actionOptions: [
      { id: 'nb8-1', emoji: '🍅', textEl: 'πλένει τις ντομάτες και τα αγγουράκια με νερό', isCorrect: true },
      { id: 'nb8-2', emoji: '🪁', textEl: 'πετάει χαρταετό στον αέρα', isCorrect: false },
      { id: 'nb8-3', emoji: '👟', textEl: 'βάζει παπούτσια μέσα στην κατσαρόλα', isCorrect: false },
    ],
    fullSentenceEl: 'Η οικογένεια στον πάγκο της κουζίνας πλένει τις ντομάτες και τα αγγουράκια με νερό!',
  },
  {
    storyGoalEl: 'Ιστορία: Χτύπησε το κουδούνι μετά το διάλειμμα στο σχολείο. Τι κάνουν οι μαθητές;',
    whoCard: { emoji: '🧒👧', textEl: 'Οι Μαθητές' },
    whereCard: { emoji: '🏫', textEl: 'έξω από την αίθουσα του σχολείου' },
    actionOptions: [
      { id: 'nb9-1', emoji: '🚶', textEl: 'μπαίνουν ήρεμα στην τάξη και κάθονται στα θρανία τους', isCorrect: true },
      { id: 'nb9-2', emoji: '🏊', textEl: 'κολυμπούν στη θάλασσα', isCorrect: false },
      { id: 'nb9-3', emoji: '⛺', textEl: 'στήνουν σκηνή στο βουνό', isCorrect: false },
    ],
    fullSentenceEl: 'Οι μαθητές έξω από την αίθουσα του σχολείου μπαίνουν ήρεμα στην τάξη και κάθονται στα θρανία τους!',
  },
  {
    storyGoalEl: 'Ιστορία: Η μικρή μέλισσα πετάει την άνοιξη στο λιβάδι. Τι ψάχνει;',
    whoCard: { emoji: '🐝', textEl: 'Η Εργατική Μέλισσα' },
    whereCard: { emoji: '🌻', textEl: 'πάνω στα ανθισμένα λουλούδια' },
    actionOptions: [
      { id: 'nb10-1', emoji: '🍯', textEl: 'μαζεύει γύρη για να φτιάξει γλυκό μέλι', isCorrect: true },
      { id: 'nb10-2', emoji: '❄️', textEl: 'φτιάχνει χιονάνθρωπο με κασκόλ', isCorrect: false },
      { id: 'nb10-3', emoji: '📚', textEl: 'δανείζεται βιβλία από τη βιβλιοθήκη', isCorrect: false },
    ],
    fullSentenceEl: 'Η εργατική μέλισσα πάνω στα ανθισμένα λουλούδια μαζεύει γύρη για να φτιάξει γλυκό μέλι!',
  },
  {
    storyGoalEl: 'Ιστορία: Έπεσε λίγο νερό πάνω στο τραπέζι. Τι κάνει το παιδί με ψυχραιμία;',
    whoCard: { emoji: '🧒', textEl: 'Το Ψύχραιμο Παιδί' },
    whereCard: { emoji: '🪑', textEl: 'στο τραπέζι της τραπεζαρίας' },
    actionOptions: [
      { id: 'nb11-1', emoji: '🧽', textEl: 'παίρνει ένα πανάκι και σκουπίζει προσεκτικά το νερό', isCorrect: true },
      { id: 'nb11-2', emoji: '🎈', textEl: 'φουσκώνει δέκα μπαλόνια', isCorrect: false },
      { id: 'nb11-3', emoji: '🎺', textEl: 'παίζει τρομπέτα στο μπαλκόνι', isCorrect: false },
    ],
    fullSentenceEl: 'Το ψύχραιμο παιδί στο τραπέζι της τραπεζαρίας παίρνει ένα πανάκι και σκουπίζει προσεκτικά το νερό!',
  },
  {
    storyGoalEl: 'Ιστορία: Ο καπετάνιος βλέπει ότι πλησιάζει η νύχτα στη θάλασσα. Τι κάνει;',
    whoCard: { emoji: '⛵', textEl: 'Ο Καπετάνιος' },
    whereCard: { emoji: '🌊', textEl: 'κοντά στο ήρεμο λιμάνι' },
    actionOptions: [
      { id: 'nb12-1', emoji: '⚓', textEl: 'κατεβάζει τα πανιά και δένει με ασφάλεια το καραβάκι', isCorrect: true },
      { id: 'nb12-2', emoji: '🌳', textEl: 'σκαρφαλώνει σε μια ψηλή βελανιδιά', isCorrect: false },
      { id: 'nb12-3', emoji: '🚲', textEl: 'κάνει ποδήλατο στην πλατεία', isCorrect: false },
    ],
    fullSentenceEl: 'Ο καπετάνιος κοντά στο ήρεμο λιμάνι κατεβάζει τα πανιά και δένει με ασφάλεια το καραβάκι!',
  },
];

const SENIOR_NARRATIVE_ROUNDS: typeof NARRATIVE_ROUNDS = [
  {
    storyGoalEl: 'Σενάριο Αιτίας-Αποτελέσματος (8-12 ετών): Η σχολική ομάδα ρομποτικής βλέπει ότι ο αισθητήρας του ρομπότ δεν ανταποκρίνεται πριν την παρουσίαση. Ποια είναι η πιο ώριμη κίνηση;',
    whoCard: { emoji: '🤖', textEl: 'Η Ομάδα Ρομποτικής' },
    whereCard: { emoji: '🔬', textEl: 'στο σχολικό εργαστήριο τεχνολογίας' },
    actionOptions: [
      { id: 'snb1-1', emoji: '🔌', textEl: 'ελέγχει μεθοδικά τα καλώδια σύνδεσης και δοκιμάζει ξανά τον κώδικα', isCorrect: true },
      { id: 'snb1-2', emoji: '💢', textEl: 'παρατάει το project και κατηγορεί τους συμμαθητές', isCorrect: false },
      { id: 'snb1-3', emoji: '🎲', textEl: 'πατάει τυχαία κουμπιά χωρίς να ελέγξει τις οδηγίες', isCorrect: false },
    ],
    fullSentenceEl: 'Η ομάδα ρομποτικής στο σχολικό εργαστήριο τεχνολογίας ελέγχει μεθοδικά τα καλώδια σύνδεσης και δοκιμάζει ξανά τον κώδικα!',
  },
  {
    storyGoalEl: 'Σενάριο Ομαδικότητας: Στον σχολικό αγώνα μπάσκετ, ένας συμπαίκτης αστοχεί σε κρίσιμη πάσα. Πώς αντιδρά ο αρχηγός της ομάδας;',
    whoCard: { emoji: '🏀', textEl: 'Ο Αρχηγός της Ομάδας' },
    whereCard: { emoji: '🏟️', textEl: 'μέσα στο γήπεδο του σχολείου' },
    actionOptions: [
      { id: 'snb2-1', emoji: '🤝', textEl: 'ενθαρρύνει τον συμπαίκτη του και οργανώνει ήρεμα την επόμενη άμυνα', isCorrect: true },
      { id: 'snb2-2', emoji: '📢', textEl: 'φωνάζει θυμωμένα στον συμπαίκτη μπροστά σε όλους', isCorrect: false },
      { id: 'snb2-3', emoji: '🚶', textEl: 'φεύγει από τον αγώνα πριν τελειώσει το ημίχρονο', isCorrect: false },
    ],
    fullSentenceEl: 'Ο αρχηγός της ομάδας μέσα στο γήπεδο του σχολείου ενθαρρύνει τον συμπαίκτη του και οργανώνει ήρεμα την επόμενη άμυνα!',
  },
  {
    storyGoalEl: 'Σενάριο Αυτορρύθμισης: Ο μαθητής έχει αύριο διαγώνισμα Ιστορίας αλλά οι φίλοι του τον καλούν για βιντεοπαιχνίδια το απόγευμα. Τι επιλέγει;',
    whoCard: { emoji: '🧑‍🎓', textEl: 'Ο Μαθητής' },
    whereCard: { emoji: '📚', textEl: 'στο γραφείο μελέτης του' },
    actionOptions: [
      { id: 'snb3-1', emoji: '⏱️', textEl: 'ολοκληρώνει πρώτα την επανάληψη με πρόγραμμα και μετά επικοινωνεί με τους φίλους του', isCorrect: true },
      { id: 'snb3-2', emoji: '🎮', textEl: 'παίζει όλο το βράδυ αφήνοντας το βιβλίο κλειστό', isCorrect: false },
      { id: 'snb3-3', emoji: '😰', textEl: 'αγχώνεται χωρίς να ανοίξει καθόλου τις σημειώσεις του', isCorrect: false },
    ],
    fullSentenceEl: 'Ο μαθητής στο γραφείο μελέτης του ολοκληρώνει πρώτα την επανάληψη με πρόγραμμα και μετά επικοινωνεί με τους φίλους του!',
  },
  {
    storyGoalEl: 'Σενάριο Έρευνας: Η μαθήτρια ετοιμάζει εργασία για την προστασία της θαλάσσιας χελώνας Καρέτα-Καρέτα. Πώς ξεκινά;',
    whoCard: { emoji: '👩‍🔬', textEl: 'Η Ερευνήτρια Μαθήτρια' },
    whereCard: { emoji: '🏛️', textEl: 'στη σχολική βιβλιοθήκη' },
    actionOptions: [
      { id: 'snb4-1', emoji: '📖', textEl: 'διασταυρώνει έγκυρες επιστημονικές πηγές και κρατά οργανωμένες σημειώσεις', isCorrect: true },
      { id: 'snb4-2', emoji: '✂️', textEl: 'αντιγράφει μια τυχαία φράση χωρίς να τη διαβάσει', isCorrect: false },
      { id: 'snb4-3', emoji: '🎨', textEl: 'ζωγραφίζει μόνο το εξώφυλλο χωρίς περιεχόμενο', isCorrect: false },
    ],
    fullSentenceEl: 'Η ερευνήτρια μαθήτρια στη σχολική βιβλιοθήκη διασταυρώνει έγκυρες επιστημονικές πηγές και κρατά οργανωμένες σημειώσεις!',
  },
];

export const Activity14NarrativeBuilder: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  totalRounds,
  hintLevel,
  ageBand,
  adaptiveProfile,
  sessionSeed = 0,
  advanceRound,
  triggerGentleFeedback,
}) => {
  const { settings } = useApp();
  const { runDebounced, getAbsorbedCount } = useDebouncedAction();
  const isSeniorAge = ageBand === '8-10' || ageBand === '10-12';
  const narrativePool = isSeniorAge ? SENIOR_NARRATIVE_ROUNDS : NARRATIVE_ROUNDS;
  const activeRounds = useMemo(
    () => selectSessionRounds(narrativePool, totalRounds, sessionSeed),
    [narrativePool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];
  const [whoConfirmed, setWhoConfirmed] = useState<boolean>(false);
  const [whereConfirmed, setWhereConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (hintLevel === 2 || ageBand === '4-5') {
      setWhoConfirmed(true);
      setWhereConfirmed(true);
    } else {
      setWhoConfirmed(false);
      setWhereConfirmed(false);
    }
    speakGreek(round.storyGoalEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [
    currentRound,
    hintLevel,
    ageBand,
    sessionSeed,
    round.storyGoalEl,
    settings.voiceEnabled,
    adaptiveProfile.speechRate,
  ]);

  const visibleActions = useMemo(() => {
    const baseOpts =
      hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
        ? round.actionOptions.filter((o, i) => o.isCorrect || i === 0)
        : round.actionOptions;
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [round.actionOptions, hintLevel, ageBand, adaptiveProfile.distractorReductionRatio, sessionSeed, currentRound]);

  const handleActionPick = (isCorrect: boolean, textEl: string) => {
    runDebounced(() => {
      if (isCorrect) {
        speakGreek(round.fullSentenceEl, settings.voiceEnabled, adaptiveProfile.speechRate);
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Σκέψου την ιστορία: ταιριάζει το «${textEl}» με το «${round.whereCard.textEl}»;`
        );
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="activity-14-narrative-builder">
      <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate text-center">
        <h2 className="text-lg md:text-xl font-extrabold text-charcoal">{round.storyGoalEl}</h2>
      </div>

      {/* Colourful Semantics Sentence Strip: 1. ΠΟΙΟΣ + 2. ΠΟΥ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          data-testid="narrative-who-card"
          onClick={() => {
            setWhoConfirmed(true);
            speakGreek(round.whoCard.textEl, settings.voiceEnabled, adaptiveProfile.speechRate);
          }}
          className={`touch-target p-5 rounded-3xl border-4 flex items-center gap-4 text-left ${
            whoConfirmed ? 'bg-sage text-white border-sage-dark' : 'bg-white border-sage text-charcoal'
          }`}
        >
          <span className="text-4xl" aria-hidden="true">{round.whoCard.emoji}</span>
          <div>
            <span className="text-xs font-extrabold uppercase">1. Ποιος; (Υποκείμενο)</span>
            <p className="text-lg font-extrabold">{round.whoCard.textEl}</p>
          </div>
        </button>

        <button
          type="button"
          data-testid="narrative-where-card"
          onClick={() => {
            setWhereConfirmed(true);
            speakGreek(round.whereCard.textEl, settings.voiceEnabled, adaptiveProfile.speechRate);
          }}
          className={`touch-target p-5 rounded-3xl border-4 flex items-center gap-4 text-left ${
            whereConfirmed
              ? 'bg-slate text-white border-slate-dark'
              : 'bg-white border-slate text-charcoal'
          }`}
        >
          <span className="text-4xl" aria-hidden="true">{round.whereCard.emoji}</span>
          <div>
            <span className="text-xs font-extrabold uppercase">2. Πού; (Τόπος / Συνθήκη)</span>
            <p className="text-lg font-extrabold">{round.whereCard.textEl}</p>
          </div>
        </button>
      </div>

      {/* 3. ΤΙ ΚΑΝΕΙ (Action Resolution) */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-charcoal text-center">
          3. Τι κάνει; (Διάλεξε τη συνέχεια που βγάζει νόημα):
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {visibleActions.map((opt) => {
            const highlight = (hintLevel >= 1 || adaptiveProfile.autoHintBoost) && opt.isCorrect;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={opt.isCorrect ? 'narrative-action-target' : `narrative-opt-${opt.id}`}
                onClick={() => handleActionPick(opt.isCorrect, opt.textEl)}
                className={`touch-target min-h-[116px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 text-center ${
                  highlight
                    ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                    : 'bg-white border-sand-dark hover:border-slate'
                }`}
              >
                <span className="text-4xl" aria-hidden="true">{opt.emoji}</span>
                <span className="text-sm font-extrabold text-charcoal">{opt.textEl}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
