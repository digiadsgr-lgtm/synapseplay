import React, { useState, useEffect } from 'react';
import type { ActivityRunnerRenderProps } from '../components/ActivityRunner';
import { useDebouncedAction } from '../hooks/useDebouncedAction';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useApp } from '../context/AppContext';

interface SpeechRound {
  wordEl: string;
  syllables: string[];
  promptQuestionEl: string;
  targetEmoji: string;
  options: Array<{ id: string; emoji: string; labelEl: string; isCorrect: boolean }>;
}

const AGE_SPEECH_ROUNDS: Record<string, SpeechRound[]> = {
  '4-5': [
    {
      wordEl: 'ΜΠΑ-ΛΑ',
      syllables: ['ΜΠΑ', 'ΛΑ'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια («ΜΠΑ - ΛΑ») και βρες την Μπάλα!',
      targetEmoji: '⚽',
      options: [
        { id: 'sp4-1', emoji: '⚽', labelEl: 'Μπάλα (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-2', emoji: '🚂', labelEl: 'Τρένο', isCorrect: false },
        { id: 'sp4-3', emoji: '🍎', labelEl: 'Μήλο', isCorrect: false },
      ],
    },
    {
      wordEl: 'ΓΑ-ΤΑ',
      syllables: ['ΓΑ', 'ΤΑ'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια («ΓΑ - ΤΑ») και βρες τη Γάτα!',
      targetEmoji: '🐱',
      options: [
        { id: 'sp4-4', emoji: '🐶', labelEl: 'Σκύλος', isCorrect: false },
        { id: 'sp4-5', emoji: '🐱', labelEl: 'Γάτα (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-6', emoji: '🐸', labelEl: 'Βάτραχος', isCorrect: false },
      ],
    },
    {
      wordEl: 'ΠΑ-ΠΙ',
      syllables: ['ΠΑ', 'ΠΙ'],
      promptQuestionEl: 'Χτύπα 2 παλαμάκια («ΠΑ - ΠΙ») και βρες το Παπί!',
      targetEmoji: '🦆',
      options: [
        { id: 'sp4-7', emoji: '🦆', labelEl: 'Παπί (2 συλλαβές)', isCorrect: true },
        { id: 'sp4-8', emoji: '🐮', labelEl: 'Αγελάδα', isCorrect: false },
        { id: 'sp4-9', emoji: '🐴', labelEl: 'Άλογο', isCorrect: false },
      ],
    },
  ],
  '6-8': [
    {
      wordEl: 'ΧΕ-ΛΩ-ΝΑ',
      syllables: ['ΧΕ', 'ΛΩ', 'ΝΑ'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές («ΧΕ-ΛΩ-ΝΑ») και βρες ποια λέξη αρχίζει επίσης με /Χ/!',
      targetEmoji: '🐢',
      options: [
        { id: 'sp6-1', emoji: '🐙', labelEl: 'Χταπόδι (Αρχίζει με /Χ/)', isCorrect: true },
        { id: 'sp6-2', emoji: '⛵', labelEl: 'Καράβι (Αρχίζει με /Κ/)', isCorrect: false },
        { id: 'sp6-3', emoji: '🌻', labelEl: 'Ηλίανθος (Αρχίζει με /Η/)', isCorrect: false },
      ],
    },
    {
      wordEl: 'ΚΑ-ΡΑ-ΒΙ',
      syllables: ['ΚΑ', 'ΡΑ', 'ΒΙ'],
      promptQuestionEl: 'Χτύπα τις 3 συλλαβές («ΚΑ-ΡΑ-ΒΙ») — πρόσεξε το καθαρό /Ρ/ — και βρες τι ομοιοκαταληκτεί με το «Καράβι»!',
      targetEmoji: '⛵',
      options: [
        { id: 'sp6-4', emoji: '🌳', labelEl: 'Δέντρο', isCorrect: false },
        { id: 'sp6-5', emoji: '🦌', labelEl: 'Ελάφι (Καράβι - Ελάφι)', isCorrect: true },
        { id: 'sp6-6', emoji: '📘', labelEl: 'Βιβλίο', isCorrect: false },
      ],
    },
    {
      wordEl: 'ΘΑ-ΛΑ-ΣΣΑ',
      syllables: ['ΘΑ', 'ΛΑ', 'ΣΣΑ'],
      promptQuestionEl: 'Πες καθαρά «ΘΑ-ΛΑ-ΣΣΑ» (/Θ/ και /Σ/) και βρες τη λέξη που έχει 3 συλλαβές!',
      targetEmoji: '🌊',
      options: [
        { id: 'sp6-7', emoji: '☀️', labelEl: 'Ή-λιος (2)', isCorrect: false },
        { id: 'sp6-8', emoji: '🦋', labelEl: 'Μέ-λι-σσα (3 συλλαβές)', isCorrect: true },
        { id: 'sp6-9', emoji: '🏠', labelEl: 'Σπί-τι (2)', isCorrect: false },
      ],
    },
  ],
  '10-12': [
    {
      wordEl: 'ΠΟ-ΔΗ-ΛΑ-ΤΟ',
      syllables: ['ΠΟ', 'ΔΗ', 'ΛΑ', 'ΤΟ'],
      promptQuestionEl: 'Κατάτμησε τις 4 συλλαβές («ΠΟ-ΔΗ-ΛΑ-ΤΟ») και επίλεξε την πολυσύλλαβη σύνθετη λέξη (4 συλλαβές):',
      targetEmoji: '🚲',
      options: [
        { id: 'sp10-1', emoji: '🔭', labelEl: 'Τη-λε-σκό-πι-ο / Α-στρο-ναύ-της (4 συλλαβές)', isCorrect: true },
        { id: 'sp10-2', emoji: '🎒', labelEl: 'Τσά-ντα (2 συλλαβές)', isCorrect: false },
        { id: 'sp10-3', emoji: '✏️', labelEl: 'Μο-λύ-βι (3 συλλαβές)', isCorrect: false },
      ],
    },
    {
      wordEl: 'Ε-ΛΕ-ΦΑ-ΝΤΑΣ',
      syllables: ['Ε', 'ΛΕ', 'ΦΑ', 'ΝΤΑΣ'],
      promptQuestionEl: 'Ένωσε τις συλλαβές και βρες το ακριβές συνώνυμο της λέξης «ΗΡΕΜΟΣ»:',
      targetEmoji: '🐘',
      options: [
        { id: 'sp10-4', emoji: '⚡', labelEl: 'Βιαστικός', isCorrect: false },
        { id: 'sp10-5', emoji: '🌿', labelEl: 'Γαλήνιος (Συνώνυμο)', isCorrect: true },
        { id: 'sp10-6', emoji: '🔊', labelEl: 'Θορυβώδης', isCorrect: false },
      ],
    },
    {
      wordEl: 'ΣΥ-ΓΚΕ-ΝΤΡΩ-ΣΗ',
      syllables: ['ΣΥ', 'ΓΚΕ', 'ΝΤΡΩ', 'ΣΗ'],
      promptQuestionEl: 'Πες καθαρά τα συμπλέγματα συμφώνων (/ΓΚ/, /ΝΤΡ/) και βρες το συγγενικό ρήμα:',
      targetEmoji: '🎯',
      options: [
        { id: 'sp10-7', emoji: '🎯', labelEl: 'Εστιάζω / Συγκεντρώνομαι', isCorrect: true },
        { id: 'sp10-8', emoji: '🏃', labelEl: 'Απομακρύνομαι', isCorrect: false },
        { id: 'sp10-9', emoji: '😴', labelEl: 'Αποκοιμιέμαι', isCorrect: false },
      ],
    },
  ],
};

export const Activity13SpeechArticulation: React.FC<ActivityRunnerRenderProps> = ({
  currentRound,
  hintLevel,
  ageBand,
  adaptiveProfile,
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

  const rounds = AGE_SPEECH_ROUNDS[tierKey];
  const round = rounds[(currentRound - 1) % rounds.length];

  const [clappedCount, setClappedCount] = useState<number>(0);

  useEffect(() => {
    setClappedCount(hintLevel === 2 ? round.syllables.length : 0);
  }, [currentRound, hintLevel, round.syllables.length]);

  const allClapped = clappedCount >= round.syllables.length;

  const handleClapSyllable = () => {
    runDebounced(() => {
      if (clappedCount < round.syllables.length) {
        const syl = round.syllables[clappedCount];
        playCalmTone('pulse', settings.soundEnabled);
        speakGreek(syl, settings.voiceEnabled, adaptiveProfile.speechRate);
        setClappedCount((c) => c + 1);
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
          `Πρώτα χτύπα παλαμάκια για όλες τις συλλαβές της λέξης «${round.wordEl}»!`
        );
        return;
      }
      if (isCorrect) {
        advanceRound(getAbsorbedCount());
      } else {
        triggerGentleFeedback(
          `Άκου ξανά καθαρά: ψάχνουμε το φωνολογικό ταίρι για «${round.wordEl}», όχι «${labelEl}».`
        );
      }
    });
  };

  return (
    <div className="space-y-6 text-center" data-testid="activity-13-speech-articulation">
      {/* Syllabic Rhythm & Articulation Stage */}
      <div className="p-6 rounded-3xl bg-sage-surface border-4 border-sage space-y-4">
        <div className="text-5xl" aria-hidden="true">{round.targetEmoji}</div>
        <h2 className="text-2xl font-extrabold text-charcoal">{round.wordEl}</h2>
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
