import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { speakGreek } from '../utils/soundAndSpeech';
import { ParentGateModal } from './ParentGateModal';

export const SmoothLandingRing: React.FC = () => {
  const { remainingRatio, isWarningWindow, isSessionDepleted } = useApp();

  // SVG circle parameters
  const size = 56;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - remainingRatio);

  // Calming color transition: Soft Sage -> Accent Terracotta (warning) -> Slate Blue (resting)
  const strokeColor = isSessionDepleted
    ? '#4A6B82'
    : isWarningWindow
    ? '#D97757'
    : '#7A9A7B';

  const statusLabel = isSessionDepleted
    ? 'Ώρα για ξεκούραση'
    : isWarningWindow
    ? 'Το τάμπλετ θα ξεκουραστεί σύντομα'
    : 'Ήρεμος ρυθμός συνεδρίας';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-sand-light border-2 border-sand-dark"
      aria-label={`Οπτικός δείκτης ενέργειας συνεδρίας: ${statusLabel}`}
      title={statusLabel}
      data-testid="smooth-landing-ring"
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#DDD2BA"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xl select-none" aria-hidden="true">
          {isSessionDepleted ? '🌙' : isWarningWindow ? '🌅' : '🌿'}
        </span>
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-xs font-bold text-charcoal leading-tight">Ενέργεια</span>
        <span className="text-xs text-charcoal-muted leading-tight">
          {isWarningWindow ? 'Σύντομα ξεκούραση' : 'Ήρεμη ροή'}
        </span>
      </div>
    </div>
  );
};

export const SmoothLandingWarningBanner: React.FC = () => {
  const { isWarningWindow, isSessionDepleted, settings } = useApp();

  if (!isWarningWindow || isSessionDepleted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="smooth-landing-warning-banner"
      className="w-full bg-terracotta-surface border-b-2 border-terracotta px-4 py-3 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">🌅</span>
        <div>
          <p className="font-bold text-charcoal text-base md:text-lg">
            Τελευταία αποστολή για σήμερα! Το τάμπλετ θα ξεκουραστεί σύντομα!
          </p>
          <p className="text-sm text-charcoal-muted">
            Ολοκληρώνουμε φυσικά το τρέχον βήμα μας (Smooth Landing) και ετοιμαζόμαστε για παιχνίδι
            εκτός οθόνης.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          speakGreek(
            'Το τάμπλετ θα ξεκουραστεί σύντομα! Ολοκληρώνουμε ήρεμα τη δραστηριότητά μας.',
            settings.voiceEnabled
          )
        }
        className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-terracotta text-charcoal font-bold flex items-center gap-2 hover:bg-sand"
        aria-label="Άκουσε την υπενθύμιση ξεκούρασης"
      >
        <span aria-hidden="true">🔊</span>
        <span>Άκου</span>
      </button>
    </div>
  );
};

const OFFLINE_ACTIVITIES = [
  {
    emoji: '🥤',
    titleEl: 'Πιες ένα ποτήρι δροσερό νερό',
    descEl: 'Πήγαινε στην κουζίνα και πιες αργά ένα ποτήρι νερό.',
  },
  {
    emoji: '🖍️',
    titleEl: 'Ζωγράφισε σε χαρτί',
    descEl: 'Πάρε μαρκαδόρους και ζωγράφισε το αγαπημένο σου ζωάκι από τη σημερινή αποστολή.',
  },
  {
    emoji: '🧱',
    titleEl: 'Χτίσε με τουβλάκια',
    descEl: 'Φτιάξε έναν πύργο με τα αληθινά σου τουβλάκια στο δωμάτιο.',
  },
];

export const SmoothLandingDepletedOverlay: React.FC = () => {
  const { isSessionDepleted, extendSessionForParent, settings } = useApp();
  const [showParentGate, setShowParentGate] = useState(false);

  if (!isSessionDepleted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smooth-landing-title"
      data-testid="smooth-landing-overlay"
      className="fixed inset-0 z-50 bg-sand flex flex-col items-center justify-center p-6 overflow-y-auto"
    >
      <div className="max-w-2xl w-full bg-sand-light border-4 border-slate rounded-3xl p-8 shadow-lg text-center space-y-6">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-slate-surface border-4 border-slate text-6xl">
          🐨💤
        </div>

        <h1 id="smooth-landing-title" className="text-3xl font-extrabold text-charcoal">
          Η μασκότ μας ξεκουράζεται τώρα!
        </h1>

        <p className="text-lg text-charcoal-muted max-w-xl mx-auto">
          Κάναμε υπέροχη εξάσκηση σήμερα. Το τάμπλετ πάει για ύπνο, και τώρα είναι ώρα για μια
          όμορφη δραστηριότητα στον πραγματικό κόσμο:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {OFFLINE_ACTIVITIES.map((item) => (
            <div
              key={item.titleEl}
              className="p-4 rounded-2xl bg-sage-surface border-2 border-sage flex flex-col gap-2"
            >
              <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
              <h2 className="font-bold text-charcoal text-base">{item.titleEl}</h2>
              <p className="text-sm text-charcoal-muted">{item.descEl}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() =>
              speakGreek(
                'Η μασκότ μας ξεκουράζεται τώρα! Διάλεξε μια δραστηριότητα στο δωμάτιό σου, όπως να πιεις νερό ή να ζωγραφίσεις.',
                settings.voiceEnabled
              )
            }
            className="touch-target px-6 py-3 rounded-2xl bg-sage text-white font-bold text-lg flex items-center gap-2 hover:bg-sage-dark"
          >
            <span aria-hidden="true">🔊</span>
            <span>Άκου την πρόταση</span>
          </button>

          <button
            type="button"
            onClick={() => setShowParentGate(true)}
            data-testid="smooth-landing-parent-unlock"
            className="touch-target px-6 py-3 rounded-2xl bg-white border-2 border-slate text-charcoal font-bold text-base flex items-center gap-2 hover:bg-slate-surface"
          >
            <span aria-hidden="true">🔒</span>
            <span>Γονείς (+10 λεπτά)</span>
          </button>
        </div>
      </div>

      {showParentGate && (
        <ParentGateModal
          onSuccess={() => {
            setShowParentGate(false);
            void extendSessionForParent(10);
          }}
          onCancel={() => setShowParentGate(false)}
        />
      )}
    </div>
  );
};
