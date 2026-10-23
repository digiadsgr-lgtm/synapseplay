import React, { useState, useMemo } from 'react';

interface ParentGateModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Accidental-Access Barrier (Arithmetic Gate) for Parent Dashboard & Session Extension.
 * Uses deterministic or simple two-number addition/multiplication suitable for adults.
 */
export const ParentGateModal: React.FC<ParentGateModalProps> = ({ onSuccess, onCancel }) => {
  const challenge = useMemo(() => {
    const a = 7;
    const b = 8;
    return { a, b, answer: a + b, options: [12, 15, 18, 21] };
  }, []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOptionClick = (val: number) => {
    if (val === challenge.answer) {
      setErrorMsg(null);
      onSuccess();
    } else {
      setErrorMsg('Δοκιμάστε ξανά (Πρόσβαση μόνο για ενήλικες).');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
      data-testid="parent-gate-modal"
      className="fixed inset-0 z-50 bg-charcoal/70 flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-sand-light border-4 border-slate rounded-3xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 id="parent-gate-title" className="text-xl font-extrabold text-charcoal flex items-center gap-2">
            <span aria-hidden="true">🔒</span>
            <span>Πύλη Γονέων / Εκπαιδευτικών</span>
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Κλείσιμο πύλης γονέων"
            className="touch-target px-4 py-2 rounded-xl bg-sand border-2 border-charcoal/20 font-bold text-charcoal hover:bg-sand-dark"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-charcoal-muted">
          Για την αποφυγή τυχαίας εισόδου από το παιδί, επιλέξτε το σωστό αποτέλεσμα:
        </p>

        <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate text-center">
          <p className="text-2xl font-extrabold text-charcoal" data-testid="parent-gate-question">
            Πόσο κάνει {challenge.a} + {challenge.b} ;
          </p>
        </div>

        {errorMsg && (
          <p role="alert" className="text-sm font-bold text-terracotta-dark text-center">
            {errorMsg}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {challenge.options.map((opt) => (
            <button
              key={opt}
              type="button"
              data-testid={`parent-gate-option-${opt}`}
              onClick={() => handleOptionClick(opt)}
              className="touch-target py-3 px-4 rounded-2xl bg-white border-2 border-slate font-extrabold text-xl text-charcoal hover:bg-sage-surface hover:border-sage"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
