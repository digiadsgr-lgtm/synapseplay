import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getTodayDateKey } from '../db/database';
import { isSelfChildCode } from '../utils/childCode';
import { pendingMissions } from '../utils/homeMissions';
import { isCheckInDue } from '../utils/parentCheckIn';
import { planWeekProgress } from '../utils/practicePlan';

const DAY = 86400000;

/**
 * «Σήμερα»: 2–4 γραμμές με ό,τι χρειάζεται προσοχή τώρα, για το ενεργό παιδί.
 * Ο γονιός δεν ψάχνει· βλέπει τι να κάνει και πατά.
 */
export const ParentTodaySummary: React.FC<{ onGo: (anchor: string) => void }> = ({ onGo }) => {
  const { activeProfile, sessionLogs } = useApp();
  const today = getTodayDateKey();
  const plan = activeProfile.practicePlan;
  const linked = !!activeProfile.childCode && !isSelfChildCode(activeProfile.childCode);
  const pending = pendingMissions(activeProfile.homeMissions).length;
  const due = isCheckInDue(activeProfile.parentCheckIns, today);
  const sentAt = activeProfile.progressSentAt ? Date.parse(activeProfile.progressSentAt) : 0;
  const sendDue = linked && !!plan?.therapistKey && Date.now() - sentAt > 7 * DAY;
  const week = plan ? planWeekProgress(plan, sessionLogs, activeProfile.id) : null;

  const items: { key: string; icon: string; textEl: string; action?: React.ReactNode }[] = [];

  if (week) {
    items.push({
      key: 'plan',
      icon: '📋',
      textEl: `Πρόγραμμα: ${week.daysDone} από ${week.daysTarget} μέρες αυτή την εβδομάδα · σήμερα ${week.minutesToday} από ${week.minutesTarget} λεπτά.`,
      action: (
        <Link to="/app" className="text-xs font-extrabold underline text-sage-dark" data-testid="today-go-play">
          Στην οθόνη του παιδιού →
        </Link>
      ),
    });
  } else if (linked) {
    items.push({
      key: 'no-plan',
      icon: '📋',
      textEl: 'Δεν έχετε ακόμη πρόγραμμα εβδομάδας. Ζητήστε από τον θεραπευτή το QR.',
    });
  }
  if (pending > 0) {
    items.push({
      key: 'missions',
      icon: '🏠',
      textEl: `${pending === 1 ? 'Μία αποστολή περιμένει' : `${pending} αποστολές περιμένουν`} την επιβεβαίωσή σας.`,
      action: (
        <Link to="/app" className="text-xs font-extrabold underline text-sage-dark" data-testid="today-go-missions">
          Επιβεβαίωση →
        </Link>
      ),
    });
  }
  if (sendDue) {
    items.push({
      key: 'send',
      icon: '🔒',
      textEl: 'Πέρασε μια εβδομάδα: στείλτε την πρόοδο στον θεραπευτή.',
      action: (
        <button type="button" onClick={() => onGo('share-progress')} className="text-xs font-extrabold underline text-sage-dark">
          Αποστολή →
        </button>
      ),
    });
  }
  if (due) {
    items.push({
      key: 'checkin',
      icon: '📝',
      textEl: 'Ερωτηματολόγιο του μήνα: 5 ερωτήσεις, 1 λεπτό.',
      action: (
        <button type="button" onClick={() => onGo('parent-checkin-block')} className="text-xs font-extrabold underline text-sage-dark">
          Συμπλήρωση →
        </button>
      ),
    });
  }

  return (
    <section
      data-testid="parent-today-summary"
      aria-label="Τι χρειάζεται σήμερα"
      className="bg-white border-2 border-sage rounded-3xl p-5 space-y-2"
    >
      <h2 className="text-lg font-extrabold text-charcoal">
        {activeProfile.avatarEmoji} Σήμερα για {activeProfile.nickname}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-charcoal" data-testid="today-all-good">
          ✅ Όλα εντάξει. Τίποτα δεν περιμένει από εσάς σήμερα.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.key} data-testid={`today-item-${i.key}`} className="flex flex-wrap items-baseline gap-2 text-sm text-charcoal">
              <span aria-hidden="true">{i.icon}</span>
              <span className="flex-1 min-w-[200px]">{i.textEl}</span>
              {i.action}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ParentTodaySummary;
