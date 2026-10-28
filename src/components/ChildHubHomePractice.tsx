import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getActivityById } from '../data/activitiesCatalog';
import { ParentGateModal } from './ParentGateModal';
import { computeGarden, gardenEncouragementEl } from '../utils/garden';
import { pendingMissions } from '../utils/homeMissions';
import { planWeekProgress } from '../utils/practicePlan';
import { currentSeason, gameOfTheWeek } from '../utils/seasons';
import { speakGreek } from '../utils/soundAndSpeech';

/** Αποστολές που περιμένουν επιβεβαίωση γονιού (με «πύλη γονιού»). */
export const HubPendingMissions: React.FC = () => {
  const { activeProfile, resolveHomeMission } = useApp();
  const pending = pendingMissions(activeProfile.homeMissions);
  const [gateFor, setGateFor] = useState<string | null>(null);
  const [unlockedFor, setUnlockedFor] = useState<string | null>(null);
  if (pending.length === 0) return null;
  return (
    <div data-testid="hub-pending-missions" className="space-y-2">
      {pending.map((m) => (
        <div
          key={m.id}
          data-testid={`hub-pending-mission-${m.id}`}
          className="p-3 rounded-2xl bg-terracotta-surface border-2 border-terracotta flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl" aria-hidden="true">{m.emoji}</span>
            <div>
              <p className="text-xs font-extrabold text-terracotta-dark">🏠 Αποστολή στο σπίτι</p>
              <p className="text-sm font-bold text-charcoal">{m.textEl}</p>
            </div>
          </div>
          {unlockedFor === m.id ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid={`hub-mission-done-btn-${m.id}`}
                onClick={() => {
                  void resolveHomeMission(activeProfile.id, m.id, 'done');
                  setUnlockedFor(null);
                }}
                className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
              >
                ✅ Το έκανε
              </button>
              <button
                type="button"
                data-testid={`hub-mission-not-today-btn-${m.id}`}
                onClick={() => {
                  void resolveHomeMission(activeProfile.id, m.id, 'not-today');
                  setUnlockedFor(null);
                }}
                className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-sand-dark text-sm font-bold"
              >
                🌙 Όχι σήμερα
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid={`hub-mission-parent-confirm-btn-${m.id}`}
              onClick={() => setGateFor(m.id)}
              className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-terracotta text-sm font-extrabold shrink-0"
            >
              👨‍👩‍👧 Επιβεβαίωση γονιού
            </button>
          )}
        </div>
      ))}
      {gateFor && (
        <ParentGateModal
          onSuccess={() => {
            setUnlockedFor(gateFor);
            setGateFor(null);
          }}
          onCancel={() => setGateFor(null)}
        />
      )}
    </div>
  );
};

/** Το πρόγραμμα της εβδομάδας από τον θεραπευτή, αλλιώς το «παιχνίδι της εβδομάδας». */
export const HubWeeklyPractice: React.FC = () => {
  const { activeProfile, sessionLogs } = useApp();
  const navigate = useNavigate();
  const plan = activeProfile.practicePlan;
  const progress = useMemo(
    () => (plan ? planWeekProgress(plan, sessionLogs, activeProfile.id) : null),
    [plan, sessionLogs, activeProfile.id]
  );

  if (!plan || !progress) {
    const game = gameOfTheWeek();
    return (
      <div
        data-testid="hub-game-of-week"
        className="p-4 rounded-2xl bg-white border-2 border-slate flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{game.pictogram}</span>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-surface text-[11px] font-extrabold text-slate-dark border border-slate">
              ⭐ Παιχνίδι της εβδομάδας
            </span>
            <p className="text-base font-extrabold text-charcoal mt-0.5">{game.titleEl}</p>
            <p className="text-xs text-charcoal-muted">Αλλάζει κάθε Δευτέρα.</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="hub-play-game-of-week-btn"
          onClick={() => navigate(`/activity/${game.id}`)}
          className="touch-target px-5 py-2.5 rounded-2xl bg-slate text-white font-extrabold text-sm shrink-0"
        >
          ▶️ Παίξε
        </button>
      </div>
    );
  }

  const next = getActivityById(progress.nextActivityId);
  const minutesLeft = Math.max(0, progress.minutesTarget - progress.minutesToday);
  return (
    <div data-testid="hub-weekly-plan" className="p-4 rounded-2xl bg-white border-2 border-sage space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-charcoal">
          📋 Το πρόγραμμα της εβδομάδας
          {plan.therapistLabel ? <span className="text-charcoal-muted"> · από {plan.therapistLabel}</span> : null}
        </p>
        <p
          className="text-xs font-extrabold text-sage-dark"
          data-testid="hub-weekly-plan-days"
          aria-label={`${progress.daysDone} από ${progress.daysTarget} μέρες αυτή την εβδομάδα`}
        >
          {Array.from({ length: progress.daysTarget }, (_, i) => (i < progress.daysDone ? '🌼' : '⚪')).join(' ')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {plan.activityIds.map((id) => {
          const a = getActivityById(id);
          if (!a) return null;
          const plays = progress.playsThisWeek[id] ?? 0;
          return (
            <button
              key={id}
              type="button"
              data-testid={`hub-plan-game-${id}`}
              onClick={() => navigate(`/activity/${id}`)}
              className={`touch-target px-3 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-1.5 ${
                id === progress.nextActivityId ? 'bg-sage-surface border-sage-dark' : 'bg-sand-light border-sand-dark'
              }`}
            >
              <span aria-hidden="true">{a.pictogram}</span>
              <span>{a.titleEl}</span>
              {plays > 0 && <span className="text-xs text-sage-dark">✓{plays > 1 ? `×${plays}` : ''}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-charcoal-muted" data-testid="hub-weekly-plan-minutes">
          {minutesLeft > 0
            ? `Σήμερα: ${progress.minutesToday} από ${progress.minutesTarget} λεπτά.`
            : `Σήμερα: ολοκληρώθηκαν τα ${progress.minutesTarget} λεπτά! Μπορείτε να κλείσετε την οθόνη. 🌙`}
        </p>
        {next && minutesLeft > 0 && (
          <button
            type="button"
            data-testid="hub-plan-play-next-btn"
            onClick={() => navigate(`/activity/${next.id}`)}
            className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
          >
            ▶️ Επόμενο: {next.titleEl}
          </button>
        )}
      </div>
    </div>
  );
};

/** Ο κήπος του παιδιού: μεγαλώνει με κάθε παιχνίδι και αποστολή, ποτέ δεν μικραίνει. */
export const HubGardenCard: React.FC = () => {
  const { activeProfile, sessionLogs, settings } = useApp();
  const season = currentSeason();
  const garden = useMemo(() => {
    const games = sessionLogs.filter((l) => l.childProfileId === activeProfile.id).length;
    const missions = (activeProfile.homeMissions ?? []).filter((m) => m.status === 'done').length;
    return computeGarden(games, missions);
  }, [sessionLogs, activeProfile.id, activeProfile.homeMissions]);
  const encouragement = gardenEncouragementEl(garden);

  return (
    <section
      aria-labelledby="hub-garden-heading"
      data-testid="hub-garden-card"
      className="bg-sage-surface border-2 border-sage rounded-3xl p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="hub-garden-heading" className="text-lg font-extrabold text-charcoal">
          {season.emoji} Ο κήπος μου
          <span className="ml-2 text-xs font-bold text-sage-dark" data-testid="hub-garden-season">
            {season.titleEl}
          </span>
        </h2>
        <button
          type="button"
          data-testid="hub-garden-listen-btn"
          aria-label="Άκου για τον κήπο σου"
          onClick={() =>
            void speakGreek(`${season.greetingEl} ${encouragement}`, settings.voiceEnabled, activeProfile.learnedModel.optimalSpeechRate)
          }
          className="touch-target px-3 py-1.5 rounded-xl bg-white border-2 border-sage text-sm font-bold"
        >
          🔊
        </button>
      </div>
      <div
        className="flex flex-wrap items-end gap-1.5 p-3 rounded-2xl bg-white/70 border border-sage min-h-[64px]"
        data-testid="hub-garden-plots"
        aria-label={`Ο κήπος έχει ${garden.grownPlants} λουλούδια και φυτά`}
      >
        {garden.plots.map((p) => (
          <span key={p.index} className={p.grown ? 'text-3xl' : 'text-2xl opacity-80'} aria-hidden="true">
            {p.emoji}
          </span>
        ))}
        {garden.visitors.length > 0 && (
          <span className="ml-auto text-2xl" aria-hidden="true">
            {garden.visitors.join('')}
          </span>
        )}
        <span className="text-xl opacity-70" aria-hidden="true">
          {season.decor.join('')}
        </span>
      </div>
      <p className="text-sm font-bold text-charcoal" data-testid="hub-garden-encouragement">
        {season.greetingEl} {encouragement}
      </p>
    </section>
  );
};
