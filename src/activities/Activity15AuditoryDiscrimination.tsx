import React, { useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { rotateOptionsForSession, selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface AuditoryConceptRound {
  conceptBadgeEl: string;
  spokenInstructionEl: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const AUDITORY_ROUNDS: AuditoryConceptRound[] = [
  {
    conceptBadgeEl: 'Χωρική Έννοια: Μέσα στο κουτί',
    spokenInstructionEl: 'Διάλεξε την εικόνα όπου το δώρο είναι μέσα στο κουτί!',
    options: [
      { id: 'au1-1', emoji: '📦🎁📦', labelEl: 'Μέσα στο κουτί', isCorrect: true },
      { id: 'au1-2', emoji: '🎁⬆️📦', labelEl: 'Πάνω από το κουτί', isCorrect: false },
      { id: 'au1-3', emoji: '📦➡️🎁', labelEl: 'Δίπλα στο κουτί', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση Ελάχιστων Ζευγών: «Κότα» vs «Πόρτα»',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη «κότα». Ποια εικόνα δείχνει την κότα και όχι την πόρτα;',
    options: [
      { id: 'au2-1', emoji: '🚪', labelEl: 'Πόρτα', isCorrect: false },
      { id: 'au2-2', emoji: '🐔', labelEl: 'Κότα', isCorrect: true },
      { id: 'au2-3', emoji: '🎂', labelEl: 'Τούρτα', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Χωροχρονική Σχέση: Ανάμεσα στα δύο δέντρα',
    spokenInstructionEl: 'Βρες την εικόνα όπου το σπιτάκι βρίσκεται ανάμεσα στα δύο δέντρα!',
    options: [
      { id: 'au3-1', emoji: '🌳🏠🌳', labelEl: 'Ανάμεσα στα δύο δέντρα', isCorrect: true },
      { id: 'au3-2', emoji: '🌳🌳🏠', labelEl: 'Μετά από τα δέντρα', isCorrect: false },
      { id: 'au3-3', emoji: '🏠🌳🌳', labelEl: 'Πριν από τα δέντρα', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση: «Ρόδα» vs «Ρόδο»',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη «ρόδα». Ποια εικόνα δείχνει τη στρογγυλή ρόδα και όχι το ρόδο;',
    options: [
      { id: 'au4-1', emoji: '🦶', labelEl: 'Πόδι', isCorrect: false },
      { id: 'au4-2', emoji: '🛞', labelEl: 'Ρόδα', isCorrect: true },
      { id: 'au4-3', emoji: '🌹', labelEl: 'Ρόδο', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση: «Τρένο» vs «Φρένο»',
    spokenInstructionEl: 'Άκου καθαρά τη λέξη «τρένο». Ποια εικόνα δείχνει το τρένο στις ράγες;',
    options: [
      { id: 'au5-1', emoji: '🚂', labelEl: 'Τρένο', isCorrect: true },
      { id: 'au5-2', emoji: '🛑', labelEl: 'Φρένο', isCorrect: false },
      { id: 'au5-3', emoji: '⛺', labelEl: 'Σκηνή', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση: «Κάστρο» vs «Άστρο»',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη «άστρο». Ποια εικόνα δείχνει το λαμπερό άστρο στον ουρανό;',
    options: [
      { id: 'au6-1', emoji: '🏰', labelEl: 'Κάστρο', isCorrect: false },
      { id: 'au6-2', emoji: '🌟', labelEl: 'Άστρο', isCorrect: true },
      { id: 'au6-3', emoji: '🌻', labelEl: 'Λουλούδι', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση Ελάχιστων Ζευγών: «Σκάλα» vs «Μπάλα»',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη «σκάλα». Ποια εικόνα δείχνει τη σκάλα και όχι την μπάλα;',
    options: [
      { id: 'au7-1', emoji: '🪜', labelEl: 'Σκάλα', isCorrect: true },
      { id: 'au7-2', emoji: '⚽', labelEl: 'Μπάλα', isCorrect: false },
      { id: 'au7-3', emoji: '🥛', labelEl: 'Γάλα', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Χωρική Έννοια: Κάτω από την ομπρέλα',
    spokenInstructionEl: 'Διάλεξε την εικόνα όπου το γατάκι κάθεται κάτω από την ομπρέλα!',
    options: [
      { id: 'au8-1', emoji: '☂️⬇️🐱', labelEl: 'Κάτω από την ομπρέλα', isCorrect: true },
      { id: 'au8-2', emoji: '🐱⬆️☂️', labelEl: 'Πάνω από την ομπρέλα', isCorrect: false },
      { id: 'au8-3', emoji: '☂️➡️🐱', labelEl: 'Δίπλα στην ομπρέλα', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση: «Φύλλο» vs «Μήλο»',
    spokenInstructionEl: 'Άκου καθαρά τη λέξη «φύλλο». Ποια εικόνα δείχνει το πράσινο φύλλο του δέντρου;',
    options: [
      { id: 'au9-1', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
      { id: 'au9-2', emoji: '🍃', labelEl: 'Φύλλο', isCorrect: true },
      { id: 'au9-3', emoji: '🪵', labelEl: 'Ξύλο', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Χρονική Ακολουθία: Πρώτα το Μήλο, μετά η Μπανάνα',
    spokenInstructionEl: 'Βρες την εικόνα που δείχνει πρώτα το κόκκινο μήλο και μετά την κίτρινη μπανάνα!',
    options: [
      { id: 'au10-1', emoji: '🍎 ➡️ 🍌', labelEl: 'Πρώτα Μήλο, μετά Μπανάνα', isCorrect: true },
      { id: 'au10-2', emoji: '🍌 ➡️ 🍎', labelEl: 'Πρώτα Μπανάνα, μετά Μήλο', isCorrect: false },
      { id: 'au10-3', emoji: '🍐 ➡️ 🍓', labelEl: 'Αχλάδι και Φράουλα', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση: «Ψάρι» vs «Ζάρι»',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη «ψάρι». Ποια εικόνα δείχνει το ψάρι της θάλασσας και όχι το ζάρι;',
    options: [
      { id: 'au11-1', emoji: '🎲', labelEl: 'Ζάρι', isCorrect: false },
      { id: 'au11-2', emoji: '🐟', labelEl: 'Ψάρι', isCorrect: true },
      { id: 'au11-3', emoji: '🌾', labelEl: 'Στάρι', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Χωρική Έννοια: Μπροστά από το σπιτάκι',
    spokenInstructionEl: 'Διάλεξε την εικόνα όπου το ποδήλατο βρίσκεται ακριβώς μπροστά από το σπιτάκι!',
    options: [
      { id: 'au12-1', emoji: '🚲🏠', labelEl: 'Μπροστά από το σπιτάκι', isCorrect: true },
      { id: 'au12-2', emoji: '🏠🚲🌲', labelEl: 'Ανάμεσα στο σπιτάκι και στο δέντρο', isCorrect: false },
      { id: 'au12-3', emoji: '🌲🚲🌲', labelEl: 'Ανάμεσα στα δέντρα', isCorrect: false },
    ],
  },
];

const SENIOR_AUDITORY_ROUNDS: typeof AUDITORY_ROUNDS = [
  {
    conceptBadgeEl: 'Χρονική Αναστροφή (8-12 ετών): «Πριν... αλλά Αφού...»',
    spokenInstructionEl: 'Άκου προσεκτικά τη χρονική σειρά: ΠΡΙΝ ξεκινήσεις το πείραμα με το μικροσκόπιο, αλλά ΑΦΟΥ φορέσεις την εργαστηριακή ποδιά, τι πρέπει να ελέγξεις πρώτο από τα δύο;',
    options: [
      { id: 'sau1-1', emoji: '🥼', labelEl: 'Πρώτα φοράω την εργαστηριακή ποδιά', isCorrect: true },
      { id: 'sau1-2', emoji: '🔬', labelEl: 'Πρώτα κοιτάζω στο μικροσκόπιο', isCorrect: false },
      { id: 'sau1-3', emoji: '📓', labelEl: 'Κλείνω το τετράδιο εργαστηρίου', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση Παρομοίων Λέξεων (Παρώνυμα)',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη: «Εξάρτημα» (όχι «Εξάρτηση»). Ποια κάρτα δείχνει το μηχανικό εξάρτημα;',
    options: [
      { id: 'sau2-1', emoji: '⚙️', labelEl: 'Εξάρτημα (Γρανάζι / κομμάτι μηχανισμού)', isCorrect: true },
      { id: 'sau2-2', emoji: '🔗', labelEl: 'Εξάρτηση (Δεσμός / σύνδεση)', isCorrect: false },
      { id: 'sau2-3', emoji: '🎒', labelEl: 'Εξόρμηση (Εκδρομή στη φύση)', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Σύνθετος Χωρικός Προσανατολισμός',
    spokenInstructionEl: 'Επίλεξε τη διάταξη όπου η πυξίδα βρίσκεται ΑΡΙΣΤΕΡΑ από το τηλεσκόπιο αλλά ΔΕΞΙΑ από τον χάρτη!',
    options: [
      { id: 'sau3-1', emoji: '🗺️ 🧭 🔭', labelEl: 'Χάρτης ➔ Πυξίδα ➔ Τηλεσκόπιο', isCorrect: true },
      { id: 'sau3-2', emoji: '🧭 🗺️ 🔭', labelEl: 'Πυξίδα ➔ Χάρτης ➔ Τηλεσκόπιο', isCorrect: false },
      { id: 'sau3-3', emoji: '🔭 🧭 🗺️', labelEl: 'Τηλεσκόπιο ➔ Πυξίδα ➔ Χάρτης', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Ακουστική Διάκριση Παρομοίων Λέξεων (Παρώνυμα)',
    spokenInstructionEl: 'Άκου προσεκτικά τη λέξη: «Πυξίδα» (όχι «Πυρίτιδα» ούτε «Πινακίδα»). Ποια κάρτα ταιριάζει;',
    options: [
      { id: 'sau4-1', emoji: '🧭', labelEl: 'Πυξίδα (Όργανο προσανατολισμού)', isCorrect: true },
      { id: 'sau4-2', emoji: '🪧', labelEl: 'Πινακίδα (Επιγραφή δρόμου)', isCorrect: false },
      { id: 'sau4-3', emoji: '🏛️', labelEl: 'Πυραμίδα (Γεωμετρικό μνημείο)', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Λογική Συνθήκη Ακρόασης («Εκτός αν...»)',
    spokenInstructionEl: 'Άκου όλη την πρόταση: Παίρνουμε το ποδήλατο για προπόνηση, ΕΚΤΟΣ ΑΝ βρέχει δυνατά, οπότε παίρνουμε ομπρέλα. Σήμερα βρέχει δυνατά — τι επιλέγουμε;',
    options: [
      { id: 'sau5-1', emoji: '☂️', labelEl: 'Ομπρέλα (Επειδή σήμερα βρέχει δυνατά)', isCorrect: true },
      { id: 'sau5-2', emoji: '🚲', labelEl: 'Ποδήλατο', isCorrect: false },
      { id: 'sau5-3', emoji: '🕶️', labelEl: 'Γυαλιά Ηλίου', isCorrect: false },
    ],
  },
  {
    conceptBadgeEl: 'Χρονική Ακολουθία 3 Στοιχείων',
    spokenInstructionEl: 'Άκου τη σειρά: Αφού μελετήσεις τη Γεωγραφία, αλλά πριν λύσεις τη Φυσική, διάβασε Ιστορία. Ποιο μάθημα είναι στη ΜΕΣΗ (2ο);',
    options: [
      { id: 'sau6-1', emoji: '🏛️', labelEl: 'Ιστορία (2ο στη σειρά: Γεωγραφία ➔ Ιστορία ➔ Φυσική)', isCorrect: true },
      { id: 'sau6-2', emoji: '🌍', labelEl: 'Γεωγραφία (1ο στη σειρά)', isCorrect: false },
      { id: 'sau6-3', emoji: '⚡', labelEl: 'Φυσική (3ο στη σειρά)', isCorrect: false },
    ],
  },
];

export const Activity15AuditoryDiscrimination: React.FC<ActivityRunnerRenderProps> = ({
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
  const auditoryPool = isSeniorAge ? SENIOR_AUDITORY_ROUNDS : AUDITORY_ROUNDS;
  const activeRounds = useMemo(
    () => selectSessionRounds(auditoryPool, totalRounds, sessionSeed),
    [auditoryPool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];

  // Automatically speak the auditory discrimination instruction at the start of every round!
  useEffect(() => {
    speakGreek(round.spokenInstructionEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [currentRound, sessionSeed, round.spokenInstructionEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const visibleOptions = useMemo(() => {
    const baseOpts =
      hintLevel === 2 || ageBand === '4-5' || adaptiveProfile.distractorReductionRatio >= 0.5
        ? round.options.filter((o, i) => o.isCorrect || i === 0)
        : round.options;
    return rotateOptionsForSession(baseOpts, sessionSeed, currentRound);
  }, [round.options, hintLevel, ageBand, adaptiveProfile.distractorReductionRatio, sessionSeed, currentRound]);

  const handleSelect = (isCorrect: boolean, labelEl: string) => {
    runDebounced(() => {
      if (isCorrect) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Επέλεξες «${labelEl}». Άκου ξανά την εντολή: ${round.spokenInstructionEl}`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-15-auditory-discrimination">
      <div className="p-6 rounded-3xl bg-slate-surface border-4 border-slate space-y-3">
        <span className="inline-block px-4 py-1 rounded-full bg-white text-xs font-extrabold text-slate-dark border border-slate">
          🔊 {round.conceptBadgeEl}
        </span>
        <p className="text-xl font-extrabold text-charcoal">{round.spokenInstructionEl}</p>
        <button
          type="button"
          data-testid="auditory-replay-btn"
          onClick={() => speakGreek(round.spokenInstructionEl, true, adaptiveProfile.speechRate)}
          className="touch-target px-5 py-2.5 rounded-2xl bg-white border-2 border-slate font-extrabold text-charcoal inline-flex items-center gap-2 hover:bg-sand"
        >
          <span aria-hidden="true">👂</span>
          <span>Άκου Ξανά Καθαρά</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight =
            (hintLevel >= 1 || adaptiveProfile.autoHintBoost || settings.ageBand === '4-5') &&
            opt.isCorrect &&
            hintLevel >= 1;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCorrect ? 'auditory-discrimination-target' : `auditory-opt-${opt.id}`}
              onClick={() => handleSelect(opt.isCorrect, opt.labelEl)}
              className={`touch-target min-h-[120px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-4xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-base font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
