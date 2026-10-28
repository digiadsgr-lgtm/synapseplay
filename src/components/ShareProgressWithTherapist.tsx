import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportChildProgress } from '../db/database';
import { downloadTextFile, safeFilePart } from '../utils/reportExport';
import { isSelfChildCode } from '../utils/childCode';
import {
  buildProgressPayload,
  encryptProgress,
  MAX_LINK_TOKEN_CHARS,
  progressLink,
} from '../utils/secureProgress';

const DAY = 86400000;

/**
 * Γονιός → θεραπευτής.
 *  - Με πρόγραμμα από QR: «🔒 Αποστολή» = κρυπτογραφημένος σύνδεσμος που ανοίγει ΜΟΝΟ στη συσκευή του θεραπευτή
 *    (Viber / WhatsApp / email). Χωρίς server, χωρίς λογαριασμούς.
 *  - Εναλλακτικά: αρχείο προόδου (JSON), όπως πριν.
 */
export const ShareProgressWithTherapist: React.FC = () => {
  const { childProfiles, sessionLogs, markProgressSent } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const linked = childProfiles.filter((p) => p.childCode && !isSelfChildCode(p.childCode));

  const handleExport = async (profileId: string) => {
    const profile = childProfiles.find((p) => p.id === profileId);
    if (!profile) return;
    const file = await exportChildProgress(profile);
    if (!file) return;
    downloadTextFile(
      `synapseplay-proodos-${safeFilePart(profile.nickname)}-${file.childCode}-${today}.json`,
      JSON.stringify(file, null, 2),
      'application/json'
    );
    setMessage(
      `📤 Το αρχείο προόδου για «${profile.nickname}» αποθηκεύτηκε (${file.sessionLogs.length} καταγραφές). Στείλτε το μόνο στον θεραπευτή του παιδιού.`
    );
  };

  const handleSecureSend = async (profileId: string) => {
    const profile = childProfiles.find((p) => p.id === profileId);
    const key = profile?.practicePlan?.therapistKey;
    if (!profile || !key) return;
    setFallbackLink(null);
    try {
      const token = await encryptProgress(buildProgressPayload(profile, sessionLogs), key);
      const who = profile.practicePlan?.therapistLabel ?? 'τον θεραπευτή';
      if (token.length > MAX_LINK_TOKEN_CHARS) {
        downloadTextFile(
          `synapseplay-proodos-${profile.childCode}-${today}.txt`,
          progressLink(token, window.location.origin),
          'text/plain;charset=utf-8'
        );
        await markProgressSent(profile.id);
        setMessage(
          `🔒 Η πρόοδος είναι μεγάλη για σύνδεσμο, οπότε αποθηκεύτηκε κρυπτογραφημένο αρχείο. Στείλτε το στον/στην ${who} (π.χ. email).`
        );
        return;
      }
      const url = progressLink(token, window.location.origin);
      const text = `Πρόοδος SynapsePlay για ${profile.nickname} (κρυπτογραφημένη, ανοίγει μόνο στη συσκευή του θεραπευτή):`;
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          await navigator.share({ title: 'Πρόοδος SynapsePlay', text, url });
          await markProgressSent(profile.id);
          setMessage(`✅ Στάλθηκε. Ο/Η ${who} θα δει την πρόοδο μόλις ανοίξει τον σύνδεσμο.`);
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }
      setFallbackLink(url);
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setMessage(`📋 Ο κρυπτογραφημένος σύνδεσμος αντιγράφηκε. Επικολλήστε τον σε μήνυμα ή email προς ${who}.`);
      } catch {
        setMessage(`Αντιγράψτε τον παρακάτω σύνδεσμο και στείλτε τον στον/στην ${who}.`);
      }
      await markProgressSent(profile.id);
    } catch (err) {
      setMessage(`⚠️ ${(err as Error).message}`);
    }
  };

  return (
    <section
      id="share-progress"
      data-testid="share-progress-section"
      className="bg-white border-2 border-slate rounded-3xl p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-extrabold text-charcoal">📤 Πρόοδος για τον θεραπευτή</h2>
        <p className="text-sm text-charcoal-muted">
          Ο θεραπευτής βλέπει τι παίζει το παιδί στο σπίτι, τις αποστολές και το ερωτηματολόγιο όταν του στείλετε εσείς
          την πρόοδο. Περιέχει μόνο το όνομα προφίλ, την ηλικιακή ομάδα και τις καταγραφές.
        </p>
        <p className="text-xs text-charcoal-muted mt-1">
          🔒 Αν έχετε σκανάρει το QR του προγράμματος, η πρόοδος στέλνεται <strong>κρυπτογραφημένη</strong>: ανοίγει μόνο
          στη συσκευή του θεραπευτή, ακόμη κι αν ο σύνδεσμος βρεθεί αλλού. Δεν περνά από κανέναν server μας.
        </p>
      </div>

      {linked.length === 0 ? (
        <p data-testid="share-progress-no-code" className="text-sm font-bold text-charcoal">
          Κανένα προφίλ δεν έχει ακόμη κωδικό παιδιού. Ο κωδικός γράφεται στη «Διαχείριση
          Συνδρομής».
        </p>
      ) : (
        <div className="space-y-2">
          {linked.map((p) => {
            const count = sessionLogs.filter((l) => l.childProfileId === p.id).length;
            const key = p.practicePlan?.therapistKey;
            const lastSent = p.progressSentAt ? Date.parse(p.progressSentAt) : 0;
            const overdue = !!key && Date.now() - lastSent > 7 * DAY;
            return (
              <div
                key={p.id}
                data-testid={`share-progress-row-${p.id}`}
                className="p-3 rounded-2xl bg-sand-light border border-sand-dark flex flex-col md:flex-row md:items-center gap-2"
              >
                <p className="text-sm font-extrabold text-charcoal flex-1">
                  {p.avatarEmoji} {p.nickname} · {p.childCode} · {count} καταγραφές
                  <span className="block text-xs font-bold text-charcoal-muted">
                    Τελευταία αποστολή: {lastSent ? new Date(lastSent).toLocaleDateString('el-GR') : 'ποτέ'}
                    {overdue && (
                      <span className="text-terracotta-dark" data-testid={`share-progress-overdue-${p.id}`}>
                        {' '}
                        · ώρα για νέα αποστολή
                      </span>
                    )}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {key && (
                    <button
                      type="button"
                      data-testid={`share-progress-secure-btn-${p.id}`}
                      onClick={() => void handleSecureSend(p.id)}
                      className="touch-target px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
                    >
                      🔒 Αποστολή στον/στην {p.practicePlan?.therapistLabel ?? 'θεραπευτή'}
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid={`share-progress-btn-${p.id}`}
                    onClick={() => void handleExport(p.id)}
                    className="touch-target px-4 py-2 rounded-xl bg-sage-surface border-2 border-sage text-sm font-extrabold"
                  >
                    {key ? '📄 Ως αρχείο' : `📤 Αρχείο προόδου`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message && (
        <p role="status" data-testid="share-progress-message" className="text-sm font-bold text-charcoal">
          {message}
        </p>
      )}
      {fallbackLink && (
        <textarea
          readOnly
          rows={3}
          value={fallbackLink}
          data-testid="share-progress-link-text"
          onFocus={(e) => e.currentTarget.select()}
          className="w-full px-3 py-2 rounded-xl border-2 border-sand-dark bg-white text-xs font-mono"
        />
      )}
    </section>
  );
};

export default ShareProgressWithTherapist;
