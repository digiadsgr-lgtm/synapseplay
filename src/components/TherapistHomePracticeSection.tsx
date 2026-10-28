import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIVITIES, CATEGORIES } from '../data/activitiesCatalog';
import type { ActivityId } from '../types/domain';
import type { PlanMinutes, PracticePlan } from '../types/homePractice';
import { isSelfChildCode } from '../utils/childCode';
import type { ChildMicroProfile } from '../utils/childProfileLearningEngine';
import { clearIncoming, peekIncoming } from '../utils/incomingLinks';
import { checkInAverage, checkInChange, CHECKIN_QUESTIONS, sortedCheckIns } from '../utils/parentCheckIn';
import { PLAN_LABEL_MAX, PLAN_MAX_GAMES, PLAN_MINUTES, PLAN_NOTE_MAX, planLink } from '../utils/practicePlan';
import { decryptProgress } from '../utils/secureProgress';
import { QrCode } from './QrCode';

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('el-GR') : '—');

/** Τι έγινε στο σπίτι (από την τελευταία πρόοδο που έστειλε ο γονιός). */
const HomeSummary: React.FC<{ profile: ChildMicroProfile; homeLogs: number }> = ({ profile, homeLogs }) => {
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const missions = (profile.homeMissions ?? []).filter((m) => m.dateKey >= monthAgo);
  const done = missions.filter((m) => m.status === 'done').length;
  const checks = sortedCheckIns(profile.parentCheckIns);
  const change = checkInChange(profile.parentCheckIns);
  return (
    <div data-testid={`therapist-home-summary-${profile.id}`} className="text-xs text-charcoal space-y-1">
      <p>
        📥 Τελευταία πρόοδος: <strong>{fmtDate(profile.progressSentAt)}</strong> · {homeLogs} καταγραφές από το σπίτι ·
        🏠 αποστολές 30 ημερών: <strong>{done}</strong> έγιναν από {missions.length}
      </p>
      {checks.length > 0 && (
        <p>
          📝 Ερωτηματολόγιο γονιού: {checks.map((c) => `${fmtDate(c.dateKey)} → ${checkInAverage(c)}/5`).join(' · ')}
          {change && (
            <span className="text-charcoal-muted">
              {' '}
              (αλλαγή από την αρχή:{' '}
              {CHECKIN_QUESTIONS.map((q, i) => `${q.shortEl} ${change[i] > 0 ? '+' : ''}${change[i]}`).join(', ')})
            </span>
          )}
        </p>
      )}
    </div>
  );
};

/** Επεξεργασία «συνταγής» για ένα παιδί → σύνδεσμος + QR για τον γονιό. */
const PlanEditor: React.FC<{ profile: ChildMicroProfile; onClose: () => void }> = ({ profile, onClose }) => {
  const { settings, updateSettings, ensureTherapistInboxKey, setPracticePlan } = useApp();
  const prev = profile.practicePlan;
  const [games, setGames] = useState<ActivityId[]>(prev?.activityIds ?? []);
  const [minutes, setMinutes] = useState<PlanMinutes>(prev?.minutesPerDay ?? 10);
  const [days, setDays] = useState<number>(prev?.daysPerWeek ?? 4);
  const [note, setNote] = useState<string>(prev?.note ?? '');
  const [label, setLabel] = useState<string>(settings.therapistLabel ?? '');
  const [link, setLink] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (id: ActivityId) =>
    setGames((g) => (g.includes(id) ? g.filter((x) => x !== id) : g.length >= PLAN_MAX_GAMES ? g : [...g, id]));

  const handleCreate = async () => {
    if (games.length === 0 || !profile.childCode) return;
    const key = await ensureTherapistInboxKey();
    const cleanLabel = label.trim().slice(0, PLAN_LABEL_MAX);
    if (cleanLabel !== (settings.therapistLabel ?? '')) await updateSettings({ therapistLabel: cleanLabel });
    const plan: PracticePlan = {
      childCode: profile.childCode,
      activityIds: games,
      minutesPerDay: minutes,
      daysPerWeek: days,
      note: note.trim().slice(0, PLAN_NOTE_MAX) || undefined,
      therapistLabel: cleanLabel || undefined,
      issuedAt: new Date().toISOString(),
      therapistKey: { x: key.publicJwk.x!, y: key.publicJwk.y!, kid: key.kid },
    };
    // Κρατάμε το πρόγραμμα και εδώ: φαίνεται στη συνεδρία και θυμίζει τι δόθηκε
    await setPracticePlan(profile.id, plan);
    setLink(await planLink(plan, window.location.origin));
    setMsg(null);
  };

  const parentText = (url: string) =>
    `Το πρόγραμμα εξάσκησης για το σπίτι: ${minutes} λεπτά, ${days} φορές την εβδομάδα. Ανοίξτε τον σύνδεσμο στη συσκευή που παίζει το παιδί:\n${url}`;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(parentText(link));
      setMsg('📋 Το μήνυμα με τον σύνδεσμο αντιγράφηκε.');
    } catch {
      setMsg(link);
    }
  };

  const handleShare = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: 'Πρόγραμμα SynapsePlay', text: parentText(link) });
    } catch {
      void handleCopy();
    }
  };

  return (
    <div data-testid={`plan-editor-${profile.id}`} className="p-4 rounded-2xl bg-white border-2 border-sage space-y-3">
      <p className="text-sm font-extrabold text-charcoal">
        📋 Πρόγραμμα εβδομάδας για «{profile.nickname}» ({profile.childCode})
      </p>
      <div className="space-y-2">
        {CATEGORIES.map((cat) => (
          <fieldset key={cat.id} className="space-y-1">
            <legend className="text-xs font-extrabold text-charcoal-muted">
              {cat.pictogram} {cat.titleEl}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITIES.filter((a) => a.categoryId === cat.id).map((a) => {
                const on = games.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    data-testid={`plan-game-${a.id}`}
                    onClick={() => toggle(a.id)}
                    className={`px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold ${
                      on ? 'bg-sage text-white border-sage-dark' : 'bg-sand-light border-sand-dark text-charcoal'
                    }`}
                  >
                    {a.pictogram} {a.code}. {a.titleEl}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <p className="text-xs text-charcoal-muted">
          Επιλεγμένα: {games.length} (έως {PLAN_MAX_GAMES}).
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs font-bold text-charcoal flex flex-col gap-1">
          Λεπτά τη μέρα
          <select
            value={minutes}
            data-testid="plan-minutes-select"
            onChange={(e) => setMinutes(Number(e.target.value) as PlanMinutes)}
            className="px-2 py-2 rounded-xl border-2 border-sand-dark bg-white text-sm"
          >
            {PLAN_MINUTES.map((m) => (
              <option key={m} value={m}>
                {m} λεπτά
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-charcoal flex flex-col gap-1">
          Μέρες την εβδομάδα
          <select
            value={days}
            data-testid="plan-days-select"
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-2 py-2 rounded-xl border-2 border-sand-dark bg-white text-sm"
          >
            {[2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d} μέρες
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-charcoal flex flex-col gap-1 flex-1 min-w-[180px]">
          Όνομα θεραπευτή / κέντρου (το βλέπει ο γονιός)
          <input
            type="text"
            value={label}
            maxLength={PLAN_LABEL_MAX}
            data-testid="plan-label-input"
            onChange={(e) => setLabel(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-sand-dark bg-white text-sm"
          />
        </label>
      </div>
      <label className="text-xs font-bold text-charcoal flex flex-col gap-1">
        Σύντομη οδηγία για τον γονιό (χωρίς ιατρικά ή προσωπικά στοιχεία)
        <textarea
          value={note}
          maxLength={PLAN_NOTE_MAX}
          rows={2}
          data-testid="plan-note-input"
          onChange={(e) => setNote(e.target.value)}
          className="px-3 py-2 rounded-xl border-2 border-sand-dark bg-white text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={games.length === 0}
          data-testid="plan-create-btn"
          onClick={() => void handleCreate()}
          className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold disabled:opacity-50"
        >
          ✨ Δημιουργία QR για τον γονιό
        </button>
        <button
          type="button"
          onClick={onClose}
          className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-sm font-extrabold"
        >
          Κλείσιμο
        </button>
      </div>
      {link && (
        <div data-testid="plan-result" className="flex flex-col sm:flex-row gap-4 items-start">
          <QrCode text={link} label={`QR προγράμματος για ${profile.nickname}`} />
          <div className="space-y-2 text-sm text-charcoal">
            <p>
              Ο γονιός σκανάρει το QR με την κάμερα της συσκευής που παίζει το παιδί (ή του στέλνετε τον σύνδεσμο).
              Το πρόγραμμα εμφανίζεται στην αρχική οθόνη του παιδιού.
            </p>
            <p className="text-xs text-charcoal-muted">
              🔒 Ο σύνδεσμος περιέχει τον κωδικό παιδιού, τα παιχνίδια και το δημόσιο κλειδί αυτής της συσκευής, ώστε η
              πρόοδος που θα σας στέλνει ο γονιός να ανοίγει μόνο εδώ. Δεν περιέχει όνομα παιδιού.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="plan-copy-btn"
                onClick={() => void handleCopy()}
                className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-slate text-xs font-extrabold"
              >
                📋 Αντιγραφή μηνύματος
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  data-testid="plan-share-btn"
                  onClick={() => void handleShare()}
                  className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-slate text-xs font-extrabold"
                >
                  📤 Κοινοποίηση
                </button>
              )}
            </div>
            {msg && (
              <p role="status" className="text-xs font-bold break-all" data-testid="plan-message">
                {msg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Θεραπευτής: «συνταγή εξάσκησης» με QR (2) και πρόοδος από το σπίτι χωρίς cloud (11).
 */
export const TherapistHomePracticeSection: React.FC = () => {
  const { childProfiles, sessionLogs, licenseState, settings, importDecodedProgress } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [paste, setPaste] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const linked = useMemo(
    () => childProfiles.filter((p) => p.childCode && !isSelfChildCode(p.childCode)),
    [childProfiles]
  );

  const importLink = async (input: string) => {
    if (!settings.therapistInboxKey) {
      setMessage(
        '⚠️ Αυτή η συσκευή δεν έχει ακόμη κλειδί προόδου. Φτιάξτε πρώτα ένα πρόγραμμα (QR) για τον γονιό από αυτή τη συσκευή.'
      );
      return;
    }
    setBusy(true);
    try {
      const decoded = await decryptProgress(input, settings.therapistInboxKey);
      const res = await importDecodedProgress(decoded);
      setMessage(
        `✅ ${res.created ? 'Νέο προφίλ' : 'Ενημερώθηκε'} «${res.nickname}» (${decoded.childCode}): ${res.added} νέες καταγραφές, ${res.missions} αποστολές που έγιναν, ${res.checkIns} ερωτηματολόγια.`
      );
      setPaste('');
    } catch (err) {
      setMessage(`⚠️ ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  // Σύνδεσμος /receive που άνοιξε σε αυτή τη συσκευή
  useEffect(() => {
    const token = peekIncoming('progress');
    if (!token || !licenseState.canUseProTools) return;
    clearIncoming('progress');
    void importLink(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseState.canUseProTools]);

  if (!licenseState.canUseProTools) return null;

  return (
    <section
      id="therapist-home-practice"
      data-testid="therapist-home-practice-section"
      className="bg-white border-2 border-slate rounded-3xl p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-extrabold text-charcoal">📋 Πρόγραμμα για το σπίτι & πρόοδος από γονείς</h2>
        <p className="text-sm text-charcoal-muted">
          Δώστε στον γονιό ένα πρόγραμμα εβδομάδας με QR. Ο γονιός σας στέλνει την πρόοδο με ένα πάτημα (Viber, WhatsApp,
          email) και ανοίγει μόνο σε αυτή τη συσκευή. Χωρίς cloud, χωρίς λογαριασμούς, χωρίς κόστος.
        </p>
      </div>

      {linked.length === 0 ? (
        <p className="text-sm font-bold text-charcoal" data-testid="therapist-home-no-codes">
          Δώστε πρώτα κωδικό παιδιού (🔑) στα προφίλ, στην ενότητα «Προφίλ, Αναφορές & Μεταφορά Δεδομένων».
        </p>
      ) : (
        <div className="space-y-3">
          {linked.map((p) => {
            const homeLogs = sessionLogs.filter((l) => l.childProfileId === p.id && l.source === 'home').length;
            return (
              <div key={p.id} className="p-3 rounded-2xl bg-sand-light border border-sand-dark space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-charcoal">
                    {p.avatarEmoji} {p.nickname} · {p.childCode}
                    {p.practicePlan && (
                      <span className="ml-2 text-xs font-bold text-sage-dark">
                        πρόγραμμα: {p.practicePlan.activityIds.length} παιχνίδια, {p.practicePlan.minutesPerDay}′ ×{' '}
                        {p.practicePlan.daysPerWeek}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    data-testid={`therapist-plan-btn-${p.id}`}
                    onClick={() => setEditing(editing === p.id ? null : p.id)}
                    className="touch-target px-3 py-2 rounded-xl bg-sage-surface border-2 border-sage text-xs font-extrabold"
                  >
                    📋 {p.practicePlan ? 'Αλλαγή προγράμματος' : 'Πρόγραμμα εβδομάδας'}
                  </button>
                </div>
                <HomeSummary profile={p} homeLogs={homeLogs} />
                {editing === p.id && <PlanEditor profile={p} onClose={() => setEditing(null)} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-sand-dark space-y-2">
        <label className="text-sm font-extrabold text-charcoal flex flex-col gap-1">
          📥 Πρόοδος από γονιό: επικολλήστε τον σύνδεσμο που σας έστειλε
          <span className="text-xs font-normal text-charcoal-muted">
            Αν πατήσετε τον σύνδεσμο σε αυτή τη συσκευή, εισάγεται αυτόματα.
          </span>
          <textarea
            value={paste}
            rows={2}
            data-testid="therapist-paste-progress-input"
            onChange={(e) => setPaste(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-sand-dark bg-white text-xs font-mono"
            placeholder="https://www.synapseplay.gr/receive#p1…"
          />
        </label>
        <button
          type="button"
          disabled={!paste.trim() || busy}
          data-testid="therapist-import-progress-link-btn"
          onClick={() => void importLink(paste)}
          className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-sage-dark text-sm font-extrabold disabled:opacity-50"
        >
          📥 Εισαγωγή προόδου
        </button>
        {settings.therapistInboxKey && (
          <p className="text-xs text-charcoal-muted" data-testid="therapist-inbox-key-id">
            🔑 Κλειδί συσκευής: {settings.therapistInboxKey.kid} (από {fmtDate(settings.therapistInboxKey.createdAt)}). Αν
            αλλάξετε συσκευή ή σβήσετε τα δεδομένα, δώστε στους γονείς νέο QR.
          </p>
        )}
      </div>

      {message && (
        <p role="status" data-testid="therapist-home-message" className="text-sm font-bold text-charcoal">
          {message}
        </p>
      )}
    </section>
  );
};

export default TherapistHomePracticeSection;
