import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayDateKey } from '../db/database';
import type { ActivityId } from '../types/domain';
import { buildAfterSessionTalk, type AfterSessionInput } from '../utils/afterSessionTalk';
import { computeGarden } from '../utils/garden';
import { canOfferMissionToday, missionText, pickHomeMission } from '../utils/homeMissions';
import { speakGreek } from '../utils/soundAndSpeech';

/** Παιχνίδια όπου η ίδια η δραστηριότητα είναι ήδη αποστολή στον πραγματικό κόσμο. */
const NO_MISSION_AFTER: ReadonlySet<ActivityId> = new Set<ActivityId>(['11-real-world-mission']);

/**
 * Τέλος παιχνιδιού: ο κήπος μεγάλωσε (3), μια «αποστολή στο σπίτι» εκτός οθόνης (1)
 * και «τι να πείτε τώρα» για τον γονιό (4).
 */
export const AfterActivityHome: React.FC<{ talk: AfterSessionInput }> = ({ talk }) => {
  const { activeProfile, sessionLogs, acceptHomeMission, settings } = useApp();
  const today = getTodayDateKey();
  const [accepted, setAccepted] = useState<boolean>(false);
  const [declined, setDeclined] = useState<boolean>(false);
  const [showTalk, setShowTalk] = useState<boolean>(false);

  // Η προσφορά «παγώνει» στην πρώτη εμφάνιση, ώστε να μην αλλάζει μόλις γίνει δεκτή
  const [offer] = useState(() =>
    !NO_MISSION_AFTER.has(talk.activityId) && canOfferMissionToday(activeProfile.homeMissions, today)
      ? pickHomeMission({
          activityId: talk.activityId,
          ageBand: activeProfile.ageBand,
          dateKey: today,
          history: activeProfile.homeMissions,
        })
      : null
  );

  const garden = useMemo(() => {
    const games = sessionLogs.filter((l) => l.childProfileId === activeProfile.id).length;
    const missions = (activeProfile.homeMissions ?? []).filter((m) => m.status === 'done').length;
    return computeGarden(games, missions);
  }, [sessionLogs, activeProfile.id, activeProfile.homeMissions]);

  const advice = useMemo(() => buildAfterSessionTalk(talk, garden.steps), [talk, garden.steps]);
  const text = offer ? missionText(offer, activeProfile.ageBand) : '';
  const rate = activeProfile.learnedModel.optimalSpeechRate;

  const handleAccept = async () => {
    if (!offer) return;
    await acceptHomeMission(offer, text, talk.activityId);
    setAccepted(true);
    void speakGreek(
      `Τέλεια! Η αποστολή σου: ${text} Όταν τελειώσεις, ο γονιός σου θα το επιβεβαιώσει και ο κήπος σου θα μεγαλώσει διπλά.`,
      settings.voiceEnabled,
      rate,
      { protect: true }
    );
  };

  return (
    <div className="space-y-3 max-w-xl mx-auto text-left" data-testid="after-activity-home">
      <p
        data-testid="garden-grew-note"
        className="text-center text-sm font-extrabold text-sage-dark"
      >
        🌱 Ο κήπος σου μεγάλωσε! {garden.plots.slice(-4).map((p) => p.emoji).join(' ')}
      </p>

      {offer && !declined && (
        <div
          data-testid="home-mission-offer"
          className="p-4 rounded-2xl bg-white border-2 border-terracotta space-y-3"
        >
          <p className="text-sm font-extrabold text-terracotta-dark">🏠 Αποστολή στο σπίτι (εκτός οθόνης)</p>
          <div className="flex items-start gap-3">
            <span className="text-4xl" aria-hidden="true">{offer.emoji}</span>
            <p className="text-base font-bold text-charcoal" data-testid="home-mission-text">{text}</p>
            <button
              type="button"
              aria-label="Άκου την αποστολή"
              data-testid="home-mission-listen-btn"
              onClick={() => void speakGreek(text, true, rate)}
              className="touch-target shrink-0 px-3 py-2 rounded-xl bg-sand-light border-2 border-sand-dark text-lg"
            >
              🔊
            </button>
          </div>
          {accepted ? (
            <p role="status" data-testid="home-mission-accepted" className="text-sm font-extrabold text-sage-dark">
              ✅ Τέλεια! Κλείσε την οθόνη και πήγαινε. Όταν τελειώσεις, ο γονιός σου θα το επιβεβαιώσει
              και ο κήπος σου θα μεγαλώσει διπλά 🌱🌱.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="home-mission-accept-btn"
                onClick={() => void handleAccept()}
                className="touch-target px-5 py-2.5 rounded-2xl bg-terracotta-dark text-white font-extrabold"
              >
                💪 Θα το κάνω!
              </button>
              <button
                type="button"
                data-testid="home-mission-decline-btn"
                onClick={() => setDeclined(true)}
                className="touch-target px-4 py-2.5 rounded-2xl bg-white border-2 border-sand-dark text-charcoal font-bold"
              >
                Άλλη φορά
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-3 rounded-2xl bg-slate-surface border-2 border-slate">
        <button
          type="button"
          data-testid="after-talk-toggle-btn"
          aria-expanded={showTalk}
          onClick={() => setShowTalk((v) => !v)}
          className="w-full text-left text-sm font-extrabold text-charcoal flex items-center justify-between gap-2"
        >
          <span>👨‍👩‍👧 Για τον γονιό: τι να πείτε τώρα</span>
          <span aria-hidden="true">{showTalk ? '▲' : '▼'}</span>
        </button>
        {showTalk && (
          <div data-testid="after-talk-box" className="mt-2 space-y-1.5 text-sm text-charcoal">
            <p>
              <strong>Πείτε:</strong> «{advice.praiseEl}»
            </p>
            <p>
              <strong>Ρωτήστε:</strong> «{advice.questionEl}»
            </p>
            <p className="text-charcoal-muted">💡 {advice.tipEl}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AfterActivityHome;
