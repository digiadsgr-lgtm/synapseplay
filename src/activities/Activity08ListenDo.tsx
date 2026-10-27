import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { speakGreek, playCalmTone } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { reduceToTwoChoices, rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface ListenRound {
  instructionEl: string;
  pictogramCue: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isTarget: boolean }>;
}

const LISTEN_ROUNDS: ListenRound[] = [
  {
    instructionEl: 'Άκου μέχρι το τέλος: Ποιο αντικείμενο ανοίγουμε όταν πέφτει βροχή; Πάτησε την ομπρέλα!',
    pictogramCue: '🌧️ ⏳ ➡️ ☂️',
    options: [
      { id: 'l1-1', emoji: '🕶️', labelEl: 'Γυαλιά Ηλίου', isTarget: false },
      { id: 'l1-2', emoji: '☂️', labelEl: 'Ανοιχτή Ομπρέλα', isTarget: true },
      { id: 'l1-3', emoji: '🩴', labelEl: 'Σαγιονάρες', isTarget: false },
    ],
  },
  {
    instructionEl: 'Περίμενε το πράσινο σήμα: Με ποιο αντικείμενο ξεκλειδώνουμε την πόρτα; Πάτησε το κλειδί!',
    pictogramCue: '🚪 ⏳ ➡️ 🔑',
    options: [
      { id: 'l2-1', emoji: '🔑', labelEl: 'Χρυσό Κλειδί', isTarget: true },
      { id: 'l2-2', emoji: '🥄', labelEl: 'Κουτάλι', isTarget: false },
      { id: 'l2-3', emoji: '✏️', labelEl: 'Μολύβι', isTarget: false },
    ],
  },
  {
    instructionEl: 'Κράτα τα χέρια ήρεμα: Τι ανάβουμε στο σκοτάδι για να βλέπουμε μπροστά μας; Πάτησε τον φακό!',
    pictogramCue: '🌑 ⏳ ➡️ 🔦',
    options: [
      { id: 'l3-1', emoji: '📚', labelEl: 'Βιβλίο', isTarget: false },
      { id: 'l3-2', emoji: '🧣', labelEl: 'Κασκόλ', isTarget: false },
      { id: 'l3-3', emoji: '🔦', labelEl: 'Φωτεινός Φακός', isTarget: true },
    ],
  },
  {
    instructionEl: 'Άκου προσεκτικά: Τι φοράμε στα χέρια μας όταν κάνει πολύ κρύο; Πάτησε τα γάντια!',
    pictogramCue: '❄️ ⏳ ➡️ 🧤',
    options: [
      { id: 'l4-1', emoji: '🧤', labelEl: 'Ζεστά Γάντια', isTarget: true },
      { id: 'l4-2', emoji: '🩱', labelEl: 'Μαγιό', isTarget: false },
      { id: 'l4-3', emoji: '👒', labelEl: 'Ψάθινο Καπέλο', isTarget: false },
    ],
  },
  {
    instructionEl: 'Μη βιαστείς να πατήσεις: Με τι πλένουμε τα δόντια μας πρωί και βράδυ; Πάτησε την οδοντόβουρτσα!',
    pictogramCue: '🦷 ⏳ ➡️ 🪥',
    options: [
      { id: 'l5-1', emoji: '🪮', labelEl: 'Χτένα', isTarget: false },
      { id: 'l5-2', emoji: '🪥', labelEl: 'Οδοντόβουρτσα', isTarget: true },
      { id: 'l5-3', emoji: '🧽', labelEl: 'Σφουγγάρι', isTarget: false },
    ],
  },
  {
    instructionEl: 'Άκου όλη την πρόταση: Ποιο κόκκινο όχημα σβήνει τις φωτιές; Πάτησε το πυροσβεστικό!',
    pictogramCue: '🚒 ⏳ ➡️ 💦',
    options: [
      { id: 'l6-1', emoji: '🚜', labelEl: 'Τρακτέρ', isTarget: false },
      { id: 'l6-2', emoji: '🚲', labelEl: 'Ποδήλατο', isTarget: false },
      { id: 'l6-3', emoji: '🚒', labelEl: 'Πυροσβεστικό Όχημα', isTarget: true },
    ],
  },
  {
    instructionEl: 'Άκου πρώτα μέχρι το τέλος: Πού βάζουμε τα τετράδιά μας για το σχολείο; Πάτησε τη σχολική τσάντα!',
    pictogramCue: '🏫 ⏳ ➡️ 🎒',
    options: [
      { id: 'l7-1', emoji: '🎒', labelEl: 'Σχολική Τσάντα', isTarget: true },
      { id: 'l7-2', emoji: '🗑️', labelEl: 'Καλάθι', isTarget: false },
      { id: 'l7-3', emoji: '🪣', labelEl: 'Κουβάς', isTarget: false },
    ],
  },
  {
    instructionEl: 'Κράτα τα δάχτυλά σου ήρεμα: Με τι τρώμε τη ζεστή μας σούπα; Πάτησε το κουτάλι!',
    pictogramCue: '🥣 ⏳ ➡️ 🥄',
    options: [
      { id: 'l8-1', emoji: '🥢', labelEl: 'Ξυλάκια', isTarget: false },
      { id: 'l8-2', emoji: '🥄', labelEl: 'Ασημένιο Κουτάλι', isTarget: true },
      { id: 'l8-3', emoji: '🥤', labelEl: 'Καλαμάκι', isTarget: false },
    ],
  },
  {
    instructionEl: 'Περίμενε να ανάψει το πράσινο σήμα: Τι φοράμε στο κεφάλι μας στον δυνατό ήλιο; Πάτησε το καπέλο!',
    pictogramCue: '☀️ ⏳ ➡️ 🧢',
    options: [
      { id: 'l9-1', emoji: '🧦', labelEl: 'Κάλτσες', isTarget: false },
      { id: 'l9-2', emoji: '👟', labelEl: 'Αθλητικά Παπούτσια', isTarget: false },
      { id: 'l9-3', emoji: '🧢', labelEl: 'Καπέλο Ηλίου', isTarget: true },
    ],
  },
  {
    instructionEl: 'Άκου με προσοχή: Με τι πλένουμε τα χέρια μας για να καθαρίσουν; Πάτησε το σαπούνι!',
    pictogramCue: '🚰 ⏳ ➡️ 🧼',
    options: [
      { id: 'l10-1', emoji: '🧼', labelEl: 'Μπάρα Σαπουνιού', isTarget: true },
      { id: 'l10-2', emoji: '🪨', labelEl: 'Πέτρα', isTarget: false },
      { id: 'l10-3', emoji: '🧱', labelEl: 'Τούβλο', isTarget: false },
    ],
  },
  {
    instructionEl: 'Πάρε μια ήρεμη ανάσα: Τι χτυπάει το πρωί για να ξυπνήσουμε στην ώρα μας; Πάτησε το ξυπνητήρι!',
    pictogramCue: '🌅 ⏳ ➡️ ⏰',
    options: [
      { id: 'l11-1', emoji: '📷', labelEl: 'Φωτογραφική Μηχανή', isTarget: false },
      { id: 'l11-2', emoji: '⏰', labelEl: 'Ξυπνητήρι', isTarget: true },
      { id: 'l11-3', emoji: '📻', labelEl: 'Ραδιόφωνο', isTarget: false },
    ],
  },
  {
    instructionEl: 'Άκου ήρεμα μέχρι την τελευταία λέξη: Πού ξαπλώνουμε το βράδυ για να κοιμηθούμε; Πάτησε το κρεβάτι!',
    pictogramCue: '🌙 ⏳ ➡️ 🛏️',
    options: [
      { id: 'l12-1', emoji: '🪑', labelEl: 'Καρέκλα', isTarget: false },
      { id: 'l12-2', emoji: '🪜', labelEl: 'Σκάλα', isTarget: false },
      { id: 'l12-3', emoji: '🛏️', labelEl: 'Κρεβάτι', isTarget: true },
    ],
  },
];

const SENIOR_LISTEN_ROUNDS: ListenRound[] = [
  {
    instructionEl: 'Άκου ολόκληρη την εντολή πριν πατήσεις: ΜΗΝ πατήσεις το όχημα με τις ρόδες ούτε το ελικόπτερο· επίλεξε το επιστημονικό όργανο που παρατηρεί τους πλανήτες!',
    pictogramCue: '🚫🚗 🚫🚁 ➡️ 🔭',
    options: [
      { id: 'sl1-1', emoji: '🚗', labelEl: 'Αυτοκίνητο', isTarget: false },
      { id: 'sl1-2', emoji: '🔭', labelEl: 'Τηλεσκόπιο', isTarget: true },
      { id: 'sl1-3', emoji: '🚁', labelEl: 'Ελικόπτερο', isTarget: false },
    ],
  },
  {
    instructionEl: 'Πρόσεξε την ανατροπή στο τέλος: Αν και η κιθάρα και το τύμπανο παίζουν μουσική, εσύ επίλεξε το όργανο προσανατολισμού που δείχνει τον Βορρά!',
    pictogramCue: '🚫🎸 🚫🥁 ➡️ 🧭',
    options: [
      { id: 'sl2-1', emoji: '🎸', labelEl: 'Κιθάρα', isTarget: false },
      { id: 'sl2-2', emoji: '🥁', labelEl: 'Τύμπανο', isTarget: false },
      { id: 'sl2-3', emoji: '🧭', labelEl: 'Πυξίδα Προσανατολισμού', isTarget: true },
    ],
  },
  {
    instructionEl: 'Άκου μέχρι την τελευταία λέξη: Αγνόησε τα αντικείμενα που χρειάζονται ηλεκτρικό ρεύμα και επίλεξε το τετράδιο εργαστηρίου!',
    pictogramCue: '🚫💻 🚫📺 ➡️ 📓',
    options: [
      { id: 'sl3-1', emoji: '💻', labelEl: 'Υπολογιστής', isTarget: false },
      { id: 'sl3-2', emoji: '📓', labelEl: 'Τετράδιο Εργαστηρίου', isTarget: true },
      { id: 'sl3-3', emoji: '📺', labelEl: 'Οθόνη', isTarget: false },
    ],
  },
  {
    instructionEl: 'Κράτησε την οδηγία στη μνήμη σου: ΜΗΝ επιλέξεις το αντικείμενο που μετράει τον χρόνο, αλλά εκείνο που μετράει τη θερμοκρασία!',
    pictogramCue: '🚫⏱️ 🚫📏 ➡️ 🌡️',
    options: [
      { id: 'sl4-1', emoji: '⏱️', labelEl: 'Χρονόμετρο', isTarget: false },
      { id: 'sl4-2', emoji: '📏', labelEl: 'Χάρακας', isTarget: false },
      { id: 'sl4-3', emoji: '🌡️', labelEl: 'Θερμόμετρο', isTarget: true },
    ],
  },
  {
    instructionEl: 'Άκου προσεκτικά: Αν η Γη γυρίζει γύρω από τον Ήλιο, επίλεξε το αντικείμενο που φοράμε στο κεφάλι για ασφάλεια στο ποδήλατο!',
    pictogramCue: '🌍☀️ ➡️ 🪖',
    options: [
      { id: 'sl5-1', emoji: '🎒', labelEl: 'Σακίδιο Πλάτης', isTarget: false },
      { id: 'sl5-2', emoji: '🪖', labelEl: 'Προστατευτικό Κράνος', isTarget: true },
      { id: 'sl5-3', emoji: '👟', labelEl: 'Αθλητικό Παπούτσι', isTarget: false },
    ],
  },
  {
    instructionEl: 'Πρόσεξε: ΜΗΝ διαλέξεις το φρούτο ούτε το λουλούδι· επίλεξε το εργαστηριακό όργανο που μεγεθύνει τα κύτταρα!',
    pictogramCue: '🚫🍎 🚫🌻 ➡️ 🔬',
    options: [
      { id: 'sl6-1', emoji: '🍎', labelEl: 'Κόκκινο Μήλο', isTarget: false },
      { id: 'sl6-2', emoji: '🌻', labelEl: 'Ηλίανθος', isTarget: false },
      { id: 'sl6-3', emoji: '🔬', labelEl: 'Μικροσκόπιο', isTarget: true },
    ],
  },
];

export const Activity08ListenDo: React.FC<ActivityRunnerRenderProps> = ({
  phase,
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
  const listenPool = isSeniorAge ? SENIOR_LISTEN_ROUNDS : LISTEN_ROUNDS;
  const activeRounds = useMemo(
    () => selectSessionRounds(listenPool, totalRounds, sessionSeed),
    [listenPool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];
  const [isListeningFinished, setIsListeningFinished] = useState<boolean>(false);
  const [listenProgressMs, setListenProgressMs] = useState<number>(0);

  useEffect(() => {
    setIsListeningFinished(false);
    setListenProgressMs(0);
    speakGreek(round.instructionEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [currentRound, sessionSeed, round.instructionEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  useEffect(() => {
    if (isListeningFinished || phase === 'PAUSED' || phase === 'COMPLETED') return;
    const interval = window.setInterval(() => {
      setListenProgressMs((prev) => prev + 100);
    }, 100);
    return () => window.clearInterval(interval);
  }, [isListeningFinished, phase, currentRound]);

  useEffect(() => {
    if (isListeningFinished || phase === 'PAUSED' || phase === 'COMPLETED') return;
    if (listenProgressMs >= 900) {
      setIsListeningFinished(true);
      playCalmTone('soft-step', settings.soundEnabled);
    }
  }, [isListeningFinished, phase, listenProgressMs, settings.soundEnabled]);

  const listenPct = Math.min(100, Math.round((listenProgressMs / 900) * 100));

  const visibleOptions = useMemo(() => {
    let baseOpts = round.options;
    if (hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5) {
      baseOpts = reduceToTwoChoices(round.options, (o) => o.isTarget);
    } else if (ageBand === '8-10' || ageBand === '10-12' || adaptiveProfile.enrichChallenge) {
      baseOpts = [
        ...round.options,
        { id: `l-extra-${currentRound}`, emoji: '🔔', labelEl: 'Καμπανάκι', isTarget: false },
      ];
    }
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [
    round.options,
    hintLevel,
    ageBand,
    adaptiveProfile.distractorReductionRatio,
    adaptiveProfile.enrichChallenge,
    currentRound,
    sessionSeed,
  ]);

  const handleSelect = (isTarget: boolean, labelEl: string) => {
    runDebounced(() => {
      if (!isListeningFinished) {
        triggerGentleFeedback(
          'Περίμενε μια στιγμή να ανάψει το πράσινο σήμα «Τώρα Διάλεξε!» πριν πατήσεις.'
        );
        return;
      }
      if (isTarget) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(`Διάλεξες «${labelEl}». Δες ξανά το εικονίδιο της οδηγίας επάνω!`);
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-center" data-testid="activity-08-listen-do">
      <div
        data-testid={isListeningFinished ? 'listen-status-ready' : 'listen-status-waiting'}
        className={`p-4 sm:p-5 rounded-3xl border-4 space-y-2 transition-colors ${
          isListeningFinished
            ? 'bg-sage-surface border-sage-dark'
            : 'bg-slate-surface border-slate'
        }`}
      >
        <div className="text-2xl sm:text-3xl font-extrabold" aria-hidden="true">
          {isListeningFinished ? round.pictogramCue : '👂 ⏳ ➡️ ❓'}
        </div>
        <p className="text-base sm:text-lg font-extrabold text-charcoal">
          {isListeningFinished
            ? round.instructionEl
            : 'Άκου προσεκτικά το αίνιγμα μέχρι να ολοκληρωθεί...'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-charcoal/20 text-xs sm:text-sm font-extrabold">
            <span>{isListeningFinished ? '🟢 Τώρα Διάλεξε!' : '⏳ Άκου πρώτα με ήρεμα χέρια...'}</span>
          </div>
          <button
            type="button"
            data-testid="listen-do-replay-btn"
            onClick={() => speakGreek(round.instructionEl, true, adaptiveProfile.speechRate)}
            className="px-3.5 py-1.5 rounded-full bg-white border-2 border-slate text-xs font-extrabold text-charcoal hover:bg-sand-surface"
          >
            🔊 Άκου ξανά το αίνιγμα
          </button>
        </div>

        {!isListeningFinished && (
          <div className="max-w-xs mx-auto pt-2 space-y-1">
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-slate">
              <div
                className="h-full bg-slate transition-all duration-100"
                style={{ width: `${listenPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight = isListeningFinished && hintLevel >= 1 && opt.isTarget;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isTarget ? 'listen-do-target' : `listen-do-opt-${opt.id}`}
              onClick={() => handleSelect(opt.isTarget, opt.labelEl)}
              className={`touch-target min-h-[104px] sm:min-h-[120px] p-4 sm:p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all ${
                !isListeningFinished
                  ? 'bg-sand-light border-sand-dark opacity-75'
                  : highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40 scale-105'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-4xl sm:text-5xl" aria-hidden="true">
                {isListeningFinished ? opt.emoji : '🎧'}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-charcoal">
                {isListeningFinished ? opt.labelEl : 'Άκου πρώτα...'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
