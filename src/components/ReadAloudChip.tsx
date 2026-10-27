import React from 'react';
import { speakGreek } from '../utils/soundAndSpeech';

/**
 * 4-6 year olds cannot read the answer cards. This small «🔊» chip inside a card reads the
 * card aloud WITHOUT choosing it (the click does not reach the card).
 */
export const ReadAloudChip: React.FC<{ text: string; rate: number; testId?: string }> = ({ text, rate, testId }) => (
  <span
    role="button"
    tabIndex={0}
    aria-label={`Άκου: ${text}`}
    data-testid={testId}
    onClick={(e) => {
      e.stopPropagation();
      void speakGreek(text, true, rate, { kind: 'feedback' });
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        void speakGreek(text, true, rate, { kind: 'feedback' });
      }
    }}
    className="mt-1 px-3 py-1 rounded-full bg-sand border border-sand-dark text-charcoal text-sm font-extrabold"
  >
    🔊 Άκου
  </span>
);
