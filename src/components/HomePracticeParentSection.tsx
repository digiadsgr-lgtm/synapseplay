import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getActivityById } from '../data/activitiesCatalog';
import { getTodayDateKey } from '../db/database';
import type { ParentCheckIn, PracticePlan } from '../types/homePractice';
import { isSelfChildCode } from '../utils/childCode';
import { clearIncoming, peekIncoming } from '../utils/incomingLinks';
import {
  CHECKIN_QUESTIONS,
  CHECKIN_SCALE,
  checkInAverage,
  daysUntilNextCheckIn,
  isCheckInDue,
  sortedCheckIns,
} from '../utils/parentCheckIn';
import { parsePlanToken } from '../utils/practicePlan';
import { buildIcs, defaultDaysFor, deliverIcs, WEEKDAYS, type WeekdayCode } from '../utils/reminders';

const PlanSummary: React.FC<{ plan: PracticePlan }> = ({ plan }) => (
  <div className="text-sm text-charcoal space-y-1">
    <p>
      <strong>{plan.minutesPerDay} λεπτά</strong> τη μέρα, <strong>{plan.daysPerWeek} μέρες</strong> την εβδομάδα
      {plan.therapistLabel ? <> · από {plan.therapistLabel}</> : null}
    </p>
    <p className="flex flex-wrap gap-1.5">
      {plan.activityIds.map((id) => {
        const a = getActivityById(id);
        return a ? (
          <span key={id} className="px-2 py-0.5 rounded-lg bg-sand-light border border-sand-dark text-xs font-bold">
            {a.pictogram} {a.titleEl}
          </span>
        ) : null;
      })}
    </p>
    {plan.note && <p className="text-charcoal-muted">💬 «{plan.note}»</p>}
  </div>
);

/** Ερωτηματολόγιο 5 ερωτήσεων ανά 4 εβδομάδες (βελτίωση 7). */
const CheckInBlock: React.FC = () => {
  const { activeProfile, addParentCheckIn } = useApp();
  const today = getTodayDateKey();
  const due = isCheckInDue(activeProfile.parentCheckIns, today);
  const history = sortedCheckIns(activeProfile.parentCheckIns);
  const [open, setOpen] = useState<boolean>(false);
  const [answers, setAnswers] = useState<number[]>([0, 0, 0, 0, 0]);
  const [saved, setSaved] = useState<boolean>(false);
  const complete = answers.every((a) => a >= 1);

  return (
    <div data-testid="parent-checkin-block" className="p-4 rounded-2xl bg-sand-light border-2 border-sand-dark space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-charcoal">
          📝 Πώς πάει στο σπίτι; (5 ερωτήσεις, κάθε 4 εβδομάδες) — {activeProfile.avatarEmoji} {activeProfile.nickname}
        </p>
        {!open && (
          <button
            type="button"
            data-testid="parent-checkin-open-btn"
            onClick={() => {
              setOpen(true);
              setSaved(false);
            }}
            className={`touch-target px-3 py-2 rounded-xl text-xs font-extrabold ${
              due ? 'bg-terracotta-dark text-white' : 'bg-white border-2 border-slate'
            }`}
          >
            {due ? '✍️ Είναι η ώρα: 1 λεπτό' : `Επόμενο σε ${daysUntilNextCheckIn(activeProfile.parentCheckIns, today)} μέρες · συμπλήρωση τώρα`}
          </button>
        )}
      </div>
      <p className="text-xs text-charcoal-muted">
        Σκεφτείτε τις τελευταίες 2 εβδομάδες. Δεν είναι τεστ ούτε διάγνωση· δείχνει την τάση σε εσάς και, αν στείλετε την
        πρόοδο, στον θεραπευτή.
      </p>
      {saved && (
        <p role="status" data-testid="parent-checkin-saved" className="text-sm font-bold text-sage-dark">
          ✅ Αποθηκεύτηκε. Ευχαριστούμε!
        </p>
      )}
      {open && (
        <form
          data-testid="parent-checkin-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!complete) return;
            void addParentCheckIn(activeProfile.id, answers as ParentCheckIn['answers']).then(() => {
              setOpen(false);
              setSaved(true);
              setAnswers([0, 0, 0, 0, 0]);
            });
          }}
          className="space-y-3"
        >
          {CHECKIN_QUESTIONS.map((q, i) => (
            <fieldset key={q.id} className="space-y-1">
              <legend className="text-sm font-bold text-charcoal">
                {i + 1}. {q.textEl}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {CHECKIN_SCALE.map((s) => (
                  <label
                    key={s.value}
                    className={`cursor-pointer px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold ${
                      answers[i] === s.value ? 'bg-slate text-white border-slate-dark' : 'bg-white border-sand-dark'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`checkin-${q.id}`}
                      value={s.value}
                      checked={answers[i] === s.value}
                      data-testid={`checkin-${q.id}-${s.value}`}
                      onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? s.value : x)))}
                      className="sr-only"
                    />
                    {s.labelEl}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!complete}
              data-testid="parent-checkin-submit-btn"
              className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold disabled:opacity-50"
            >
              Αποθήκευση
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-sm font-extrabold"
            >
              Ακύρωση
            </button>
          </div>
        </form>
      )}
      {history.length > 0 && (
        <div data-testid="parent-checkin-history" className="flex flex-wrap items-end gap-2">
          {history.slice(-8).map((c) => {
            const avg = checkInAverage(c);
            return (
              <div key={c.id} className="flex flex-col items-center gap-1 text-[11px] font-bold text-charcoal">
                <div className="w-8 bg-white border border-sand-dark rounded-md flex items-end h-16" aria-hidden="true">
                  <div className="w-full bg-sage rounded-md" style={{ height: `${(avg / 5) * 100}%` }} />
                </div>
                <span>{avg}</span>
                <span className="text-charcoal-muted">{c.dateKey.slice(5).split('-').reverse().join('/')}</span>
              </div>
            );
          })}
          <p className="text-xs text-charcoal-muted ml-2">Μέσος όρος 1–5 (μεγαλύτερο = πιο εύκολα).</p>
        </div>
      )}
    </div>
  );
};

/** Υπενθυμίσεις στο ημερολόγιο του κινητού (βελτίωση 6). */
const RemindersBlock: React.FC = () => {
  const { activeProfile } = useApp();
  const plan = activeProfile.practicePlan;
  const linked = !!activeProfile.childCode && !isSelfChildCode(activeProfile.childCode);
  const [time, setTime] = useState<string>('18:00');
  const [days, setDays] = useState<WeekdayCode[]>(() => defaultDaysFor(plan?.daysPerWeek ?? 4));
  const [weeklySend, setWeeklySend] = useState<boolean>(linked);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setDays(defaultDaysFor(plan?.daysPerWeek ?? 4));
  }, [plan?.daysPerWeek]);

  const handleAdd = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.synapseplay.gr';
    const minutes = plan?.minutesPerDay ?? 10;
    const ics = buildIcs([
      {
        uid: `play-${activeProfile.id}`,
        title: `SynapsePlay: ${minutes}′ εξάσκηση με ${activeProfile.nickname}`,
        description: plan
          ? 'Το πρόγραμμα της εβδομάδας από τον θεραπευτή. Παίξτε μαζί και κλείστε με την αποστολή στο σπίτι.'
          : 'Λίγα λεπτά εξάσκηση μαζί. Κλείστε με την αποστολή στο σπίτι.',
        url: `${origin}/app`,
        time,
        days,
        durationMinutes: minutes,
      },
      ...(weeklySend
        ? [
            {
              uid: `send-${activeProfile.id}`,
              title: `SynapsePlay: στείλτε την πρόοδο του/της ${activeProfile.nickname} στον θεραπευτή`,
              description: 'Περιοχή Γονέων → «Πρόοδος για τον θεραπευτή» → Αποστολή. 1 λεπτό.',
              url: `${origin}/parent`,
              time: '19:00',
              days: ['SU'] as WeekdayCode[],
              durationMinutes: 5,
            },
          ]
        : []),
    ]);
    const how = await deliverIcs('synapseplay-ypenthymiseis.ics', ics);
    setMsg(
      how === 'shared'
        ? '📅 Επιλέξτε «Ημερολόγιο» για να μπουν οι υπενθυμίσεις.'
        : '📅 Το αρχείο κατέβηκε. Ανοίξτε το για να μπουν οι υπενθυμίσεις στο ημερολόγιό σας.'
    );
  };

  return (
    <div data-testid="parent-reminders-block" className="p-4 rounded-2xl bg-sand-light border-2 border-sand-dark space-y-3">
      <p className="text-sm font-extrabold text-charcoal">⏰ Υπενθυμίσεις στο ημερολόγιο του κινητού</p>
      <p className="text-xs text-charcoal-muted">
        Η ειδοποίηση έρχεται από το ημερολόγιό σας (Google, Apple, Outlook). Η εφαρμογή δεν στέλνει τίποτα και δεν χρειάζεται
        λογαριασμό. Αλλάζουν ή σβήνονται από το ημερολόγιο.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-bold text-charcoal flex items-center gap-2">
          Ώρα
          <input
            type="time"
            value={time}
            data-testid="reminder-time-input"
            onChange={(e) => setTime(e.target.value || '18:00')}
            className="px-2 py-1.5 rounded-xl border-2 border-sand-dark bg-white text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Μέρες">
          {WEEKDAYS.map((d) => {
            const on = days.includes(d.code);
            return (
              <button
                key={d.code}
                type="button"
                aria-pressed={on}
                data-testid={`reminder-day-${d.code}`}
                onClick={() => setDays((x) => (on ? x.filter((c) => c !== d.code) : [...x, d.code]))}
                className={`w-9 h-9 rounded-xl border-2 text-xs font-extrabold ${
                  on ? 'bg-slate text-white border-slate-dark' : 'bg-white border-sand-dark'
                }`}
              >
                {d.labelEl}
              </button>
            );
          })}
        </div>
      </div>
      {linked && (
        <label className="text-xs font-bold text-charcoal flex items-center gap-2">
          <input
            type="checkbox"
            checked={weeklySend}
            data-testid="reminder-weekly-send-checkbox"
            onChange={(e) => setWeeklySend(e.target.checked)}
          />
          Και κάθε Κυριακή 19:00: «Στείλτε την πρόοδο στον θεραπευτή»
        </label>
      )}
      <button
        type="button"
        disabled={days.length === 0}
        data-testid="reminder-add-btn"
        onClick={() => void handleAdd()}
        className="touch-target px-4 py-2 rounded-xl bg-slate text-white text-sm font-extrabold disabled:opacity-50"
      >
        📅 Προσθήκη στο ημερολόγιο
      </button>
      {msg && (
        <p role="status" data-testid="reminder-message" className="text-xs font-bold text-charcoal">
          {msg}
        </p>
      )}
    </div>
  );
};

/**
 * Περιοχή Γονέων → «Εξάσκηση στο σπίτι»: πρόγραμμα θεραπευτή, υπενθυμίσεις, αποστολές, ερωτηματολόγιο.
 */
export const HomePracticeParentSection: React.FC = () => {
  const { childProfiles, activeProfile, setPracticePlan } = useApp();
  const [incoming, setIncoming] = useState<PracticePlan | null>(null);
  const [targetId, setTargetId] = useState<string>(activeProfile.id);
  const [paste, setPaste] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  const openPlan = async (input: string) => {
    try {
      const plan = await parsePlanToken(input);
      const match = childProfiles.find((p) => p.childCode === plan.childCode);
      setTargetId(match?.id ?? activeProfile.id);
      setIncoming(plan);
      setMessage(null);
    } catch (err) {
      setMessage(`⚠️ ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    const token = peekIncoming('plan');
    if (!token) return;
    clearIncoming('plan');
    void openPlan(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const target = childProfiles.find((p) => p.id === targetId);
  const codeMismatch =
    incoming && target?.childCode && !isSelfChildCode(target.childCode) && target.childCode !== incoming.childCode;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recentMissions = useMemo(
    () => (activeProfile.homeMissions ?? []).filter((m) => m.dateKey >= weekAgo),
    [activeProfile.homeMissions, weekAgo]
  );

  return (
    <section
      id="home-practice"
      data-testid="home-practice-parent-section"
      className="bg-white border-2 border-sage rounded-3xl p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-extrabold text-charcoal">🏠 Εξάσκηση στο σπίτι</h2>
        <p className="text-sm text-charcoal-muted">
          Το πρόγραμμα του θεραπευτή, υπενθυμίσεις, οι αποστολές εκτός οθόνης και ένα σύντομο ερωτηματολόγιο κάθε μήνα.
          Όλα μένουν σε αυτή τη συσκευή.
        </p>
      </div>

      {incoming && (
        <div role="alert" data-testid="incoming-plan-confirm" className="p-4 rounded-2xl bg-sage-surface border-2 border-sage space-y-3">
          <p className="text-sm font-extrabold text-charcoal">📋 Νέο πρόγραμμα από τον θεραπευτή (κωδικός {incoming.childCode})</p>
          <PlanSummary plan={incoming} />
          {childProfiles.length > 1 && (
            <label className="text-xs font-bold text-charcoal flex items-center gap-2">
              Για το παιδί:
              <select
                value={targetId}
                data-testid="incoming-plan-profile-select"
                onChange={(e) => setTargetId(e.target.value)}
                className="px-2 py-1.5 rounded-xl border-2 border-sand-dark bg-white text-sm"
              >
                {childProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatarEmoji} {p.nickname}
                    {p.childCode ? ` (${p.childCode})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          {codeMismatch && (
            <p className="text-xs font-bold text-terracotta-dark" data-testid="incoming-plan-code-mismatch">
              ⚠️ Το προφίλ έχει άλλον κωδικό παιδιού ({target?.childCode}). Βεβαιωθείτε ότι διαλέξατε το σωστό παιδί.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="incoming-plan-accept-btn"
              onClick={() => {
                void setPracticePlan(targetId, incoming).then(() => {
                  setMessage(`✅ Το πρόγραμμα μπήκε στην αρχική οθόνη του/της «${target?.nickname ?? ''}».`);
                  setIncoming(null);
                });
              }}
              className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
            >
              ✅ Αποδοχή
            </button>
            <button
              type="button"
              onClick={() => setIncoming(null)}
              className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-sm font-extrabold"
            >
              Όχι τώρα
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {childProfiles.map((p) =>
          p.practicePlan ? (
            <div
              key={p.id}
              data-testid={`parent-plan-${p.id}`}
              className="p-3 rounded-2xl bg-sand-light border border-sand-dark flex flex-col sm:flex-row sm:items-start gap-2"
            >
              <div className="flex-1">
                <p className="text-sm font-extrabold text-charcoal">
                  {p.avatarEmoji} {p.nickname} · πρόγραμμα από {new Date(p.practicePlan.issuedAt).toLocaleDateString('el-GR')}
                </p>
                <PlanSummary plan={p.practicePlan} />
              </div>
              <button
                type="button"
                data-testid={`parent-plan-remove-${p.id}`}
                onClick={() => void setPracticePlan(p.id, null)}
                className="touch-target px-3 py-1.5 rounded-xl bg-white border-2 border-sand-dark text-xs font-bold self-start"
              >
                Αφαίρεση
              </button>
            </div>
          ) : null
        )}
        <label className="text-xs font-bold text-charcoal flex flex-col gap-1">
          Ο θεραπευτής σάς έστειλε σύνδεσμο προγράμματος; Αν δεν άνοιξε μόνος του (π.χ. εφαρμογή στην αρχική οθόνη iPhone),
          επικολλήστε τον εδώ:
          <div className="flex gap-2">
            <input
              type="text"
              value={paste}
              data-testid="parent-paste-plan-input"
              onChange={(e) => setPaste(e.target.value)}
              placeholder="https://www.synapseplay.gr/plan#c1…"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-sand-dark bg-white text-xs font-mono"
            />
            <button
              type="button"
              disabled={!paste.trim()}
              data-testid="parent-open-plan-btn"
              onClick={() => {
                void openPlan(paste);
                setPaste('');
              }}
              className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-sage-dark text-xs font-extrabold disabled:opacity-50"
            >
              Άνοιγμα
            </button>
          </div>
        </label>
      </div>

      {message && (
        <p role="status" data-testid="home-practice-message" className="text-sm font-bold text-charcoal">
          {message}
        </p>
      )}

      <div data-testid="parent-missions-summary" className="text-sm text-charcoal">
        🏠 Αποστολές της εβδομάδας για {activeProfile.nickname}:{' '}
        <strong>{recentMissions.filter((m) => m.status === 'done').length}</strong> έγιναν
        {recentMissions.some((m) => m.status === 'accepted') && (
          <span className="text-charcoal-muted">
            {' '}
            · {recentMissions.filter((m) => m.status === 'accepted').length} περιμένουν την επιβεβαίωσή σας στην αρχική
            οθόνη του παιδιού
          </span>
        )}
        .
      </div>

      <RemindersBlock key={`rem-${activeProfile.id}`} />
      <CheckInBlock key={`ci-${activeProfile.id}`} />
    </section>
  );
};

export default HomePracticeParentSection;
