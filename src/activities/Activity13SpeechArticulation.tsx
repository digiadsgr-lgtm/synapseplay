import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek, speakGreekSyllable } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';
import { selectSessionRounds } from '../utils/clinicalAdhdEngine';

interface SpeechRound {
  wordEl: string;
  spokenWordEl: string;
  syllables: string[];
  promptQuestionEl: string;
  targetEmoji: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const AGE_SPEECH_ROUNDS: Record<string, SpeechRound[]> = {
  '4-5': [
    {
      wordEl: 'Μπά-λα',
      spokenWordEl: 'μπάλα',
      syllables: ['μπά', 'λα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «μπάλα» και βρες την μπάλα!',
      targetEmoji: '⚽',
      options: [
        { id: 'sp4-1', emoji: '⚽', labelEl: 'Μπάλα (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-2', emoji: '🚂', labelEl: 'Τρένο', isCorrect: false },
        { id: 'sp4-3', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Γά-τα',
      spokenWordEl: 'γάτα',
      syllables: ['γά', 'τα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «γάτα» και βρες τη γάτα!',
      targetEmoji: '🐱',
      options: [
        { id: 'sp4-4', emoji: '🐶', labelEl: 'Σκύλος', isCorrect: false },
        { id: 'sp4-5', emoji: '🐱', labelEl: 'Γάτα (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-6', emoji: '🐸', labelEl: 'Βάτραχος', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πα-πί',
      spokenWordEl: 'παπί',
      syllables: ['πα', 'πί'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «παπί» και βρες το παπί!',
      targetEmoji: '🦆',
      options: [
        { id: 'sp4-7', emoji: '🦆', labelEl: 'Παπί (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-8', emoji: '🐮', labelEl: 'Αγελάδα', isCorrect: false },
        { id: 'sp4-9', emoji: '🐴', labelEl: 'Άλογο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κό-τα',
      spokenWordEl: 'κότα',
      syllables: ['κό', 'τα'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «κότα» και βρες την κότα!',
      targetEmoji: '🐔',
      options: [
        { id: 'sp4-10', emoji: '🐔', labelEl: 'Κότα (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-11', emoji: '🐟', labelEl: 'Ψάρι', isCorrect: false },
        { id: 'sp4-12', emoji: '🐢', labelEl: 'Χελώνα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Μή-λο',
      spokenWordEl: 'μήλο',
      syllables: ['μή', 'λο'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «μήλο» και βρες το κόκκινο μήλο!',
      targetEmoji: '🍎',
      options: [
        { id: 'sp4-13', emoji: '🍌', labelEl: 'Μπανάνα', isCorrect: false },
        { id: 'sp4-14', emoji: '🍎', labelEl: 'Μήλο (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-15', emoji: '🍓', labelEl: 'Φράουλα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Ψά-ρι',
      spokenWordEl: 'ψάρι',
      syllables: ['ψά', 'ρι'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια για τη λέξη «ψάρι» και βρες το ψαράκι!',
      targetEmoji: '🐟',
      options: [
        { id: 'sp4-16', emoji: '🐟', labelEl: 'Ψάρι (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-17', emoji: '🦁', labelEl: 'Λιοντάρι', isCorrect: false },
        { id: 'sp4-18', emoji: '🐘', labelEl: 'Ελέφαντας', isCorrect: false },
      ],
    },
  ],
  '6-8': [
    {
      wordEl: 'Χε-λώ-να',
      spokenWordEl: 'χελώνα',
      syllables: ['χε', 'λώ', 'να'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «χελώνα» και βρες ποια λέξη αρχίζει επίσης με την ίδια φωνούλα!',
      targetEmoji: '🐢',
      options: [
        { id: 'sp6-1', emoji: '🐙', labelEl: 'Χταπόδι (Αρχίζει με Χ)', isCorrect: true },
        { id: 'sp6-2', emoji: '⛵', labelEl: 'Καράβι (Αρχίζει με Κ)', isCorrect: false },
        { id: 'sp6-3', emoji: '🌻', labelEl: 'Ηλίανθος (Αρχίζει με Η)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κα-ρά-βι',
      spokenWordEl: 'καράβι',
      syllables: ['κα', 'ρά', 'βι'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «καράβι» και βρες τι ομοιοκαταληκτεί με το «καράβι»!',
      targetEmoji: '⛵',
      options: [
        { id: 'sp6-4', emoji: '🌳', labelEl: 'Δέντρο', isCorrect: false },
        { id: 'sp6-5', emoji: '🦌', labelEl: 'Ελάφι (Καράβι - Ελάφι)', isCorrect: true },
        { id: 'sp6-6', emoji: '📘', labelEl: 'Βιβλίο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Θά-λα-σσα',
      spokenWordEl: 'θάλασσα',
      syllables: ['θά', 'λα', 'σσα'],
      promptQuestionEl: 'Πες καθαρά «θάλασσα» και βρες τη λέξη που έχει επίσης 3 συλλαβές!',
      targetEmoji: '🌊',
      options: [
        { id: 'sp6-7', emoji: '☀️', labelEl: 'Ήλιος (2 συλλαβές)', isCorrect: false },
        { id: 'sp6-8', emoji: '🦋', labelEl: 'Μέλισσα (3 συλλαβές)', isCorrect: true },
        { id: 'sp6-9', emoji: '🏠', labelEl: 'Σπίτι (2 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Λε-μό-νι',
      spokenWordEl: 'λεμόνι',
      syllables: ['λε', 'μό', 'νι'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «λεμόνι» και βρες τι ομοιοκαταληκτεί με το «λεμόνι»!',
      targetEmoji: '🍋',
      options: [
        { id: 'sp6-10', emoji: '🎈', labelEl: 'Μπαλόνι (Λεμόνι - Μπαλόνι)', isCorrect: true },
        { id: 'sp6-11', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
        { id: 'sp6-12', emoji: '🚲', labelEl: 'Ποδήλατο', isCorrect: false },
      ],
    },
    {
      wordEl: 'Τρε-νά-κι',
      spokenWordEl: 'τρενάκι',
      syllables: ['τρε', 'νά', 'κι'],
      promptQuestionEl: 'Πες καθαρά το σύμπλεγμα στην αρχή της λέξης «τρενάκι» και βρες ποια λέξη αρχίζει επίσης με «τρ»!',
      targetEmoji: '🚂',
      options: [
        { id: 'sp6-13', emoji: '🍀', labelEl: 'Τριφύλλι (Αρχίζει με Τρ)', isCorrect: true },
        { id: 'sp6-14', emoji: '⛵', labelEl: 'Καράβι', isCorrect: false },
        { id: 'sp6-15', emoji: '🌙', labelEl: 'Φεγγάρι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Κι-θά-ρα',
      spokenWordEl: 'κιθάρα',
      syllables: ['κι', 'θά', 'ρα'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές στη λέξη «κιθάρα» και βρες το άλλο μουσικό όργανο με 3 συλλαβές!',
      targetEmoji: '🎸',
      options: [
        { id: 'sp6-16', emoji: '🥁', labelEl: 'Τύμπανο (3 συλλαβές)', isCorrect: true },
        { id: 'sp6-17', emoji: '🔔', labelEl: 'Κουδούνι', isCorrect: false },
        { id: 'sp6-18', emoji: '🏠', labelEl: 'Σπίτι (2 συλλαβές)', isCorrect: false },
      ],
    },
  ],
  '10-12': [
    {
      wordEl: 'Πο-δή-λα-το',
      spokenWordEl: 'ποδήλατο',
      syllables: ['πο', 'δή', 'λα', 'το'],
      promptQuestionEl: 'Κατάτμησε τις 4 συλλαβές στη λέξη «ποδήλατο» και επίλεξε την πολυσύλλαβη σύνθετη λέξη (4 συλλαβές):',
      targetEmoji: '🚲',
      options: [
        { id: 'sp10-1', emoji: '🔭', labelEl: 'Αστροναύτης (4 συλλαβές)', isCorrect: true },
        { id: 'sp10-2', emoji: '🎒', labelEl: 'Τσάντα (2 συλλαβές)', isCorrect: false },
        { id: 'sp10-3', emoji: '✏️', labelEl: 'Μολύβι (3 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Ε-λέ-φα-ντας',
      spokenWordEl: 'ελέφαντας',
      syllables: ['ε', 'λέ', 'φα', 'ντας'],
      promptQuestionEl: 'Ένωσε τις συλλαβές και βρες το ακριβές συνώνυμο της λέξης «ήρεμος»:',
      targetEmoji: '🐘',
      options: [
        { id: 'sp10-4', emoji: '⚡', labelEl: 'Βιαστικός', isCorrect: false },
        { id: 'sp10-5', emoji: '🌿', labelEl: 'Γαλήνιος (Συνώνυμο)', isCorrect: true },
        { id: 'sp10-6', emoji: '🔊', labelEl: 'Θορυβώδης', isCorrect: false },
      ],
    },
    {
      wordEl: 'Συ-γκέ-ντρω-ση',
      spokenWordEl: 'συγκέντρωση',
      syllables: ['συ', 'γκέ', 'ντρω', 'ση'],
      promptQuestionEl: 'Πες καθαρά τη λέξη «συγκέντρωση» και βρες το συγγενικό ρήμα:',
      targetEmoji: '🎯',
      options: [
        { id: 'sp10-7', emoji: '🎯', labelEl: 'Εστιάζω και Συγκεντρώνομαι', isCorrect: true },
        { id: 'sp10-8', emoji: '🏃', labelEl: 'Απομακρύνομαι', isCorrect: false },
        { id: 'sp10-9', emoji: '😴', labelEl: 'Αποκοιμιέμαι', isCorrect: false },
      ],
    },
    {
      wordEl: 'Πε-τα-λού-δα',
      spokenWordEl: 'πεταλούδα',
      syllables: ['πε', 'τα', 'λού', 'δα'],
      promptQuestionEl: 'Κατάτμησε τις 4 συλλαβές και βρες το αντίθετο της λέξης «βιασύνη»:',
      targetEmoji: '🦋',
      options: [
        { id: 'sp10-10', emoji: '🧘', labelEl: 'Υπομονή και Ψυχραιμία', isCorrect: true },
        { id: 'sp10-11', emoji: '🌪️', labelEl: 'Αναστάτωση', isCorrect: false },
        { id: 'sp10-12', emoji: '🏎️', labelEl: 'Ταχύτητα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Βι-βλι-ο-θή-κη',
      spokenWordEl: 'βιβλιοθήκη',
      syllables: ['βι', 'βλι', 'ο', 'θή', 'κη'],
      promptQuestionEl: 'Ένωσε τις 5 συλλαβές της σύνθετης λέξης «βιβλιοθήκη» και βρες από ποιες λέξεις προέρχεται:',
      targetEmoji: '📚',
      options: [
        { id: 'sp10-13', emoji: '📖', labelEl: 'Βιβλίο + Θήκη', isCorrect: true },
        { id: 'sp10-14', emoji: '✏️', labelEl: 'Μολύβι + Χαρτί', isCorrect: false },
        { id: 'sp10-15', emoji: '🎒', labelEl: 'Σχολείο + Τσάντα', isCorrect: false },
      ],
    },
    {
      wordEl: 'Αυ-το-ρρύ-θμι-ση',
      spokenWordEl: 'αυτορρύθμιση',
      syllables: ['αυ', 'το', 'ρρύ', 'θμι', 'ση'],
      promptQuestionEl: 'Πες καθαρά τη λέξη «αυτορρύθμιση» και επίλεξε τι σημαίνει στην πράξη:',
      targetEmoji: '🧭',
      options: [
        { id: 'sp10-16', emoji: '🧭', labelEl: 'Κυβερνώ ήρεμα τις κινήσεις και τη σκέψη μου', isCorrect: true },
        { id: 'sp10-17', emoji: '🎲', labelEl: 'Πατάω στην τύχη χωρίς να κοιτάζω', isCorrect: false },
        { id: 'sp10-18', emoji: '🛑', labelEl: 'Σταματάω να προσπαθώ', isCorrect: false },
      ],
    },
  ],
};

export const Activity13SpeechArticulation: React.FC<ActivityRunnerRenderProps> = ({
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

  const tierKey =
    ageBand === '4-5' || ageBand === '5-6'
      ? '4-5'
      : ageBand === '10-12' || (ageBand === '8-10' && adaptiveProfile.enrichChallenge)
      ? '10-12'
      : '6-8';

  const pool = AGE_SPEECH_ROUNDS[tierKey];
  const activeRounds = useMemo(
    () => selectSessionRounds(pool, totalRounds, sessionSeed),
    [pool, totalRounds, sessionSeed]
  );
  const round = activeRounds[(currentRound - 1) % activeRounds.length];

  const [clappedCount, setClappedCount] = useState<number>(0);

  useEffect(() => {
    setClappedCount(hintLevel === 2 ? round.syllables.length : 0);
  }, [currentRound, hintLevel, round.syllables.length, sessionSeed]);

  const allClapped = clappedCount >= round.syllables.length;

  const handleClapSyllable = () => {
    runDebounced(() => {
      if (clappedCount < round.syllables.length) {
        const syl = round.syllables[clappedCount];
        playCalmTone('pulse', settings.soundEnabled);
        // Uses dedicated syllable phonetic synthesis so single syllables are NEVER spelled out as letters
        speakGreekSyllable(syl, settings.voiceEnabled, adaptiveProfile.speechRate);
        setClappedCount((c) => {
          const next = c + 1;
          if (next === round.syllables.length) {
            window.setTimeout(() => {
              speakGreek(round.spokenWordEl, settings.voiceEnabled, adaptiveProfile.speechRate);
            }, 380);
          }
          return next;
        });
      }
    });
  };

  const visibleOptions =
    hintLevel === 2 || adaptiveProfile.distractorReductionRatio >= 0.5
      ? round.options.filter((o, i) => o.isCorrect || i === 0)
      : round.options;

  const handleSelectOption = (isCorrect: boolean, labelEl: string) => {
    runDebounced(() => {
      if (!allClapped && hintLevel < 1) {
        triggerGentleFeedback(
          `Πρώτα χτύπα παλαμάκια για όλες τις συλλαβές της λέξης «${round.spokenWordEl}»!`
        );
        return;
      }
      if (isCorrect) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Άκου ξανά καθαρά: ψάχνουμε το φωνολογικό ταίρι για τη λέξη «${round.spokenWordEl}», όχι «${labelEl}».`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-13-speech-articulation">
      {/* Syllabic Rhythm & Articulation Stage */}
      <div className="p-6 rounded-3xl bg-sage-surface border-4 border-sage space-y-4">
        <div className="text-5xl" aria-hidden="true">{round.targetEmoji}</div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h2 className="text-2xl font-extrabold text-charcoal">{round.wordEl}</h2>
          <button
            type="button"
            data-testid="speech-word-listen-btn"
            onClick={() => speakGreek(round.spokenWordEl, true, adaptiveProfile.speechRate)}
            className="px-3 py-1.5 rounded-xl bg-white border-2 border-sage text-xs font-extrabold text-charcoal hover:bg-sage hover:text-white"
          >
            🔊 Άκου τη λέξη «{round.spokenWordEl}»
          </button>
        </div>
        <p className="text-base font-bold text-charcoal">{round.promptQuestionEl}</p>

        {/* Interactive Syllable Clapping Boxes */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {round.syllables.map((syl, idx) => {
            const isClapped = idx < clappedCount;
            return (
              <div
                key={`${syl}-${idx}`}
                data-testid={`syllable-box-${idx}`}
                className={`px-5 py-3 rounded-2xl border-3 font-extrabold text-xl transition-all ${
                  isClapped
                    ? 'bg-sage-dark text-white border-charcoal scale-105'
                    : 'bg-white text-charcoal border-sand-dark'
                }`}
              >
                {syl}
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            data-testid="speech-clap-syllable-btn"
            disabled={allClapped}
            onClick={handleClapSyllable}
            className="touch-target px-6 py-3 rounded-2xl bg-slate text-white font-extrabold text-lg inline-flex items-center gap-2 hover:bg-slate-dark disabled:opacity-60"
          >
            <span aria-hidden="true">👏</span>
            <span>
              {allClapped
                ? `Μπράβο! (${round.syllables.length}/${round.syllables.length} Συλλαβές)`
                : `Χτύπα Συλλαβή (${clappedCount}/${round.syllables.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Phonological Target Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {visibleOptions.map((opt) => {
          const highlight = (hintLevel >= 1 || adaptiveProfile.autoHintBoost) && opt.isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.isCorrect ? 'speech-articulation-target' : `speech-opt-${opt.id}`}
              onClick={() => handleSelectOption(opt.isCorrect, opt.labelEl)}
              className={`touch-target min-h-[116px] p-5 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 ${
                highlight
                  ? 'bg-sage-surface border-sage-dark ring-4 ring-sage/40'
                  : 'bg-white border-sand-dark hover:border-slate'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">{opt.emoji}</span>
              <span className="text-base font-extrabold text-charcoal">{opt.labelEl}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
