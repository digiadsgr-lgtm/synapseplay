import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportChildProgress } from '../db/database';
import { downloadTextFile, safeFilePart } from '../utils/reportExport';

/**
 * Γονιός → θεραπευτής: αρχείο προόδου για κάθε παιδί που έχει κωδικό παιδιού.
 * Ο γονιός αποφασίζει πότε και σε ποιον το στέλνει (email/μήνυμα). Τίποτα δεν ανεβαίνει σε server.
 */
export const ShareProgressWithTherapist: React.FC = () => {
  const { childProfiles, sessionLogs } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const linked = childProfiles.filter((p) => p.childCode);

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

  return (
    <section
      data-testid="share-progress-section"
      className="bg-white border-2 border-slate rounded-3xl p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-extrabold text-charcoal">📤 Πρόοδος για τον θεραπευτή</h2>
        <p className="text-sm text-charcoal-muted">
          Ο θεραπευτής βλέπει τι παίζει το παιδί στο σπίτι όταν του στείλετε εσείς το αρχείο
          προόδου (π.χ. με email). Περιέχει μόνο το όνομα προφίλ, την ηλικιακή ομάδα και τις
          καταγραφές των δραστηριοτήτων.
        </p>
      </div>

      {linked.length === 0 ? (
        <p data-testid="share-progress-no-code" className="text-sm font-bold text-charcoal">
          Κανένα προφίλ δεν έχει ακόμη κωδικό παιδιού. Ο κωδικός γράφεται στη «Διαχείριση
          Συνδρομής».
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linked.map((p) => {
            const count = sessionLogs.filter((l) => l.childProfileId === p.id).length;
            return (
              <button
                key={p.id}
                type="button"
                data-testid={`share-progress-btn-${p.id}`}
                onClick={() => void handleExport(p.id)}
                className="touch-target px-4 py-2 rounded-xl bg-sage-surface border-2 border-sage text-sm font-extrabold"
              >
                {p.avatarEmoji} {p.nickname} · {p.childCode} · {count} καταγραφές
              </button>
            );
          })}
        </div>
      )}

      {message && (
        <p role="status" data-testid="share-progress-message" className="text-sm font-bold text-charcoal">
          {message}
        </p>
      )}
    </section>
  );
};

export default ShareProgressWithTherapist;
