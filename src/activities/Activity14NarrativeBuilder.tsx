import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

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
  const activeRounds = useMemo(
    () => selectSessionRounds(NARRATIVE_ROUNDS, totalRounds, sessionSeed),
    [totalRounds, sessionSeed]
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

  const visibleActions =
    hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
      ? round.actionOptions.filter((o, i) => o.isCorrect || i === 0)
      : round.actionOptions;

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
