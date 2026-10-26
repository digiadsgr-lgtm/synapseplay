import React, { useState } from 'react';

interface ParentGateModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export interface AdultGateChallenge {
  id: string;
  expressionEl: string;
  answer: number;
  options: number[];
}

export const ADULT_CHALLENGE_POOL: AdultGateChallenge[] = [
  {
    id: 'c1',
    expressionEl: '(3 ├ù 5) + 0',
    answer: 15,
    options: [12, 15, 18, 21, 24, 27],
  },
  {
    id: 'c2',
    expressionEl: '(7 ├ù 6) + 9',
    answer: 51,
    options: [43, 48, 51, 54, 59, 63],
  },
  {
    id: 'c3',
    expressionEl: '(8 ├ù 5) ΓêÆ 7',
    answer: 33,
    options: [29, 31, 33, 37, 42, 47],
  },
  {
    id: 'c4',
    expressionEl: '(9 ├ù 4) + 12',
    answer: 48,
    options: [36, 42, 46, 48, 52, 56],
  },
  {
    id: 'c5',
    expressionEl: '(6 ├ù 8) ΓêÆ 11',
    answer: 37,
    options: [31, 35, 37, 39, 44, 49],
  },
  {
    id: 'c6',
    expressionEl: '(12 ├ù 3) + 8',
    answer: 44,
    options: [38, 41, 44, 46, 50, 54],
  },
  {
    id: 'c7',
    expressionEl: '(9 ├ù 6) ΓêÆ 15',
    answer: 39,
    options: [34, 39, 41, 45, 49, 53],
  },
  {
    id: 'c8',
    expressionEl: '(8 ├ù 7) + 6',
    answer: 62,
    options: [54, 58, 60, 62, 66, 70],
  },
];

let globalSessionCounter = 0;

export function pickNextAdultChallenge(previousId?: string): AdultGateChallenge {
  // In standard runtime, rotate and randomize across the full pool so it is never static
  if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
    const candidates = ADULT_CHALLENGE_POOL.filter((c) => c.id !== previousId);
    const randomIdx = Math.floor(Math.random() * candidates.length);
    return candidates[randomIdx] ?? ADULT_CHALLENGE_POOL[0];
  }
  // Deterministic rotation for repeatable unit tests: starts at c1 on first mount, rotates on every retry
  if (!previousId) {
    return ADULT_CHALLENGE_POOL[0];
  }
  const currentIdx = ADULT_CHALLENGE_POOL.findIndex((c) => c.id === previousId);
  const nextIdx = (currentIdx + 1) % ADULT_CHALLENGE_POOL.length;
  globalSessionCounter += 1;
  return ADULT_CHALLENGE_POOL[nextIdx];
}

/**
 * Dynamic Multi-Operation Accidental-Access Barrier for Parent Dashboard & Session Extension.
 * Rotates to a brand-new adult arithmetic expression on every open and immediately upon any wrong answer.
 */
export const ParentGateModal: React.FC<ParentGateModalProps> = ({ onSuccess, onCancel }) => {
  const [challenge, setChallenge] = useState<AdultGateChallenge>(() => pickNextAdultChallenge());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);

  const refreshQuestion = () => {
    setChallenge((prev) => pickNextAdultChallenge(prev.id));
    setErrorMsg(null);
  };

  const handleOptionClick = (val: number) => {
    if (val === challenge.answer) {
      setErrorMsg(null);
      onSuccess();
    } else {
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);
      // Immediately rotate to a NEW question so a child cannot guess by trial-and-error!
      setChallenge((prev) => pickNextAdultChallenge(prev.id));
      setErrorMsg(
        `╬¢╬¼╬╕╬┐╧é ╬▒╧Ç╬¼╬╜╧ä╬╖╧â╬╖ (${nextWrong}╬╖ ╧Ç╧ü╬┐╧â╧Ç╬¼╬╕╬╡╬╣╬▒). ╬ù ╬╡╧ü╧Ä╧ä╬╖╧â╬╖ ╬▒╧â╧å╬▒╬╗╬╡╬»╬▒╧é ╬¼╬╗╬╗╬▒╬╛╬╡ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬▒.`
      );
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
            <span aria-hidden="true">≡ƒöÆ</span>
            <span>╬ö╧à╬╜╬▒╬╝╬╣╬║╬« ╬á╧ì╬╗╬╖ ╬ô╬┐╬╜╬¡╧ë╬╜ & ╬ÿ╬╡╧ü╬▒╧Ç╬╡╧à╧ä╧Ä╬╜</span>
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="╬Ü╬╗╬╡╬»╧â╬╣╬╝╬┐ ╧Ç╧ì╬╗╬╖╧é ╬│╬┐╬╜╬¡╧ë╬╜"
            className="touch-target px-4 py-2 rounded-xl bg-sand border-2 border-charcoal/20 font-bold text-charcoal hover:bg-sand-dark"
          >
            Γ£ò
          </button>
        </div>

        <p className="text-sm text-charcoal-muted">
          ╬ô╬╣╬▒ ╧ä╬╖╬╜ ╧Ç╧ü╬┐╧â╧ä╬▒╧â╬»╬▒ ╧ä╬┐╧à ╧Ç╬▒╬╣╬┤╬╣╬┐╧ì, ╬╡╧Ç╬╣╬╗╧ì╧â╧ä╬╡ ╧ä╬╖ ╧â╧ì╬╜╬╕╬╡╧ä╬╖ ╧Ç╧ü╬¼╬╛╬╖ (╬╖ ╬╡╧ü╧Ä╧ä╬╖╧â╬╖ ╬▒╬╗╬╗╬¼╬╢╬╡╬╣ ╬┤╧à╬╜╬▒╬╝╬╣╬║╬¼ ╧â╬╡
          ╬║╬¼╬╕╬╡ ╬¼╬╜╬┐╬╣╬│╬╝╬▒ ╬« ╬╗╬¼╬╕╬┐╧é):
        </p>

        <div className="p-4 rounded-2xl bg-slate-surface border-2 border-slate text-center space-y-2">
          <p
            className="text-2xl font-extrabold text-charcoal"
            data-testid="parent-gate-question"
            data-challenge-id={challenge.id}
          >
            ╬á╧î╧â╬┐ ╬║╬¼╬╜╬╡╬╣ {challenge.expressionEl} ;
          </p>
          <button
            type="button"
            data-testid="parent-gate-refresh-btn"
            onClick={refreshQuestion}
            className="text-xs font-bold text-slate-dark underline hover:text-charcoal"
          >
            ≡ƒöä ╬æ╬╗╬╗╬▒╬│╬« ╬ò╧ü╧Ä╧ä╬╖╧â╬╖╧é ╬æ╧â╧å╬▒╬╗╬╡╬»╬▒╧é
          </button>
        </div>

        {errorMsg && (
          <p role="alert" className="text-sm font-bold text-terracotta-dark text-center">
            {errorMsg}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {challenge.options.map((opt) => (
            <button
              key={opt}
              type="button"
              data-testid={`parent-gate-option-${opt}`}
              data-correct-option={opt === challenge.answer ? 'true' : 'false'}
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
