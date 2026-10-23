import React from 'react';
import { useApp } from '../context/AppContext';
import { speakGreek } from '../utils/soundAndSpeech';

export const BreakPauseModal: React.FC = () => {
  const { isBreakActive, setBreakActive, settings } = useApp();

  if (!isBreakActive) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-modal-title"
      data-testid="break-pause-modal"
      className="fixed inset-0 z-50 bg-charcoal/70 flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full bg-sand-light border-4 border-sage rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sage-surface border-4 border-sage text-5xl">
          🌿
        </div>

        <h2 id="break-modal-title" className="text-2xl md:text-3xl font-extrabold text-charcoal">
          Ώρα για Ήρεμη Ανάσα
        </h2>

        <p className="text-lg text-charcoal-muted">
          Ο χρόνος έχει σταματήσει. Πάρε μια βαθιά ανάσα από τη μύτη... και βγάλε τον αέρα αργά
          από το στόμα.
        </p>

        <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-3xl" aria-hidden="true">👃</span>
            <span className="text-sm font-bold text-charcoal mt-1">1. Εισπνοή</span>
          </div>
          <span className="text-2xl text-slate font-bold" aria-hidden="true">→</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl" aria-hidden="true">😌</span>
            <span className="text-sm font-bold text-charcoal mt-1">2. Κράτησε λίγο</span>
          </div>
          <span className="text-2xl text-slate font-bold" aria-hidden="true">→</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl" aria-hidden="true">🌬️</span>
            <span className="text-sm font-bold text-charcoal mt-1">3. Εκπνοή</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() =>
              speakGreek(
                'Πάρε μια βαθιά ανάσα από τη μύτη, και βγάλε τον αέρα αργά. Όταν είσαι έτοιμος, πάτα Συνέχεια.',
                settings.voiceEnabled
              )
            }
            className="touch-target px-5 py-3 rounded-2xl bg-white border-2 border-slate text-charcoal font-bold flex items-center gap-2 hover:bg-slate-surface"
          >
            <span aria-hidden="true">🔊</span>
            <span>Άκου</span>
          </button>

          <button
            type="button"
            onClick={() => setBreakActive(false)}
            data-testid="resume-from-break-btn"
            className="touch-target px-8 py-3 rounded-2xl bg-sage-dark text-white font-extrabold text-lg flex items-center gap-2 hover:bg-sage"
          >
            <span aria-hidden="true">▶️</span>
            <span>Συνέχεια στο Παιχνίδι</span>
          </button>
        </div>
      </div>
    </div>
  );
};
