import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckoutLink } from './CheckoutLink';
import { MONETIZATION_CONFIG } from '../config/monetization.config';
import type { AgeBandId } from '../data/ageProtocols';
import {
  exportBackup,
  parseBackup,
  parseChildProgress,
  type SynapsePlayBackup,
} from '../db/database';
import { generateChildCode, isSelfChildCode } from '../utils/childCode';
import {
  buildChildReportHtml,
  downloadTextFile,
  openPrintableReport,
  safeFilePart,
  sessionLogsToCsv,
} from '../utils/reportExport';

const AGE_OPTIONS: AgeBandId[] = ['4-5', '5-6', '6-8', '8-10', '10-12'];

/**
 * Parent / therapist tools: per-child profile editing, CSV & printable (PDF) reports,
 * and backup / restore for moving data between devices (until cloud sync exists).
 */
export const ProfessionalToolsSection: React.FC = () => {
  const {
    childProfiles,
    sessionLogs,
    updateChildProfileDetails,
    restoreBackup,
    licenseState,
    importProgressFile,
    ensureCenterCode,
    settings,
  } = useApp();
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [pendingBackup, setPendingBackup] = useState<SynapsePlayBackup | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const handleExportCsv = (childProfileId?: string, nickname?: string) => {
    const csv = sessionLogsToCsv(sessionLogs, childProfiles, childProfileId);
    const suffix = childProfileId ? safeFilePart(nickname ?? '') : 'ola-ta-paidia';
    downloadTextFile(`synapseplay-${suffix}-${today}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const handleReport = (profileId: string) => {
    const profile = childProfiles.find((p) => p.id === profileId);
    if (!profile) return;
    openPrintableReport(buildChildReportHtml(profile, sessionLogs));
  };

  const handleBackup = async () => {
    const backup = await exportBackup();
    downloadTextFile(
      `synapseplay-backup-${today}.json`,
      JSON.stringify(backup, null, 2),
      'application/json'
    );
    setMessage('💾 Το αντίγραφο ασφαλείας αποθηκεύτηκε. Περιέχει δεδομένα παιδιών — φυλάξτε το με ασφάλεια.');
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('⚠️ Το αρχείο είναι πολύ μεγάλο για αντίγραφο ασφαλείας.');
      return;
    }
    try {
      const parsed = parseBackup(await file.text());
      setPendingBackup(parsed);
      setMessage(null);
    } catch (err) {
      setPendingBackup(null);
      setMessage(`⚠️ ${(err as Error).message}`);
    }
  };

  const handleNewChildCode = async (profileId: string) => {
    const center = await ensureCenterCode();
    const code = generateChildCode(center);
    await updateChildProfileDetails(profileId, { childCode: code });
    setMessage(`🔑 Νέος κωδικός παιδιού: ${code}. Δώστε τον στον γονιό με το έτοιμο μήνυμα.`);
  };

  const parentMessageFor = (nickname: string, code: string) =>
    [
      `Καλησπέρα! Για την εξάσκηση στο σπίτι προτείνω το SynapsePlay (https://www.synapseplay.gr).`,
      `Κωδικός παιδιού για «${nickname}»: ${code}`,
      `Τον γράφετε στην «Περιοχή Γονέων → Διαχείριση Συνδρομής» όταν ενεργοποιείτε το οικογενειακό πλάνο.`,
      `Θα σας δώσω και QR με το πρόγραμμα της εβδομάδας. Μία φορά την εβδομάδα πατήστε «Περιοχή Γονέων → Πρόοδος για τον θεραπευτή → 🔒 Αποστολή», για να βλέπω την πρόοδο στο σπίτι.`,
    ].join('\n');

  const handleCopyParentMessage = async (nickname: string, code: string) => {
    const text = parentMessageFor(nickname, code);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('📋 Το μήνυμα για τον γονιό αντιγράφηκε.');
    } catch {
      setMessage(text);
    }
  };

  const handleProgressFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('⚠️ Το αρχείο είναι πολύ μεγάλο για αρχείο προόδου.');
      return;
    }
    try {
      const parsed = parseChildProgress(await file.text());
      const res = await importProgressFile(parsed);
      setMessage(
        `✅ ${res.created ? 'Δημιουργήθηκε νέο προφίλ' : 'Ενημερώθηκε το προφίλ'} «${res.nickname}» (${parsed.childCode}): ${res.added} νέες καταγραφές από το σπίτι.`
      );
    } catch (err) {
      setMessage(`⚠️ ${(err as Error).message}`);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;
    await restoreBackup(pendingBackup);
    setMessage(
      `✅ Επαναφέρθηκαν ${pendingBackup.childProfiles.length} προφίλ και ${pendingBackup.sessionLogs.length} καταγραφές.`
    );
    setPendingBackup(null);
  };

  // Reports / CSV / backup are part of the Therapist (B2B) licence (also open in trial & free beta)
  if (!licenseState.canUseProTools) {
    return (
      <section
        data-testid="professional-tools-locked"
        className="bg-white border-2 border-slate rounded-3xl p-6 space-y-3"
      >
        <h2 className="text-xl font-extrabold text-charcoal">🗂️ Αναφορές, CSV & Μεταφορά Δεδομένων</h2>
        <p className="text-sm text-charcoal-muted">
          Η αναφορά για εκτύπωση/PDF, η εξαγωγή CSV και το αντίγραφο ασφαλείας για μεταφορά σε άλλη
          συσκευή περιλαμβάνονται στην <strong>Άδεια Θεραπευτή (B2B)</strong>.
        </p>
        <CheckoutLink
          href={MONETIZATION_CONFIG.checkoutUrls.therapistAnnual}
          data-testid="pro-tools-upgrade-link"
          className="touch-target inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage-dark text-white text-sm font-extrabold"
        >
          🏥 Άδεια Θεραπευτή (B2B)
        </CheckoutLink>
      </section>
    );
  }

  return (
    <section
      data-testid="professional-tools-section"
      className="bg-white border-2 border-slate rounded-3xl p-6 space-y-5"
    >
      <div>
        <h2 className="text-xl font-extrabold text-charcoal">🗂️ Προφίλ, Αναφορές & Μεταφορά Δεδομένων</h2>
        <p className="text-sm text-charcoal-muted">
          Επεξεργασία προφίλ, εξαγωγή αναφορών (PDF / CSV) και αντίγραφο ασφαλείας για μεταφορά σε
          άλλη συσκευή. Όλα γίνονται τοπικά — τίποτα δεν ανεβαίνει στο διαδίκτυο.
        </p>
        <p className="text-sm text-charcoal-muted mt-1">
          <strong>Κωδικός παιδιού:</strong> ο γονιός τον χρειάζεται για να ενεργοποιήσει το
          οικογενειακό πλάνο. Όταν σας στέλνει το αρχείο προόδου, το «📥 Πρόοδος από γονιό» το
          προσθέτει στο σωστό προφίλ.
          {settings.centerCode && (
            <span data-testid="pro-tools-center-code">
              {' '}
              Κωδικός κέντρου: <strong>{settings.centerCode}</strong>.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {childProfiles.map((p) => {
          const draft = nameDrafts[p.id] ?? p.nickname;
          const count = sessionLogs.filter((l) => l.childProfileId === p.id).length;
          const homeCount = sessionLogs.filter(
            (l) => l.childProfileId === p.id && l.source === 'home'
          ).length;
          return (
            <div
              key={p.id}
              data-testid={`pro-tools-profile-${p.id}`}
              className="p-3 rounded-2xl bg-sand-light border border-sand-dark flex flex-col lg:flex-row lg:items-center gap-3"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-2xl" aria-hidden="true">{p.avatarEmoji}</span>
                <input
                  type="text"
                  value={draft}
                  maxLength={40}
                  aria-label={`Όνομα προφίλ ${p.nickname}`}
                  data-testid={`pro-tools-name-input-${p.id}`}
                  onChange={(e) => setNameDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  onBlur={() => {
                    if (draft.trim() && draft.trim() !== p.nickname) {
                      void updateChildProfileDetails(p.id, { nickname: draft });
                    }
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-sand-dark bg-white text-sm font-bold"
                />
                <select
                  value={p.ageBand}
                  aria-label={`Ηλικία προφίλ ${p.nickname}`}
                  data-testid={`pro-tools-age-select-${p.id}`}
                  onChange={(e) =>
                    void updateChildProfileDetails(p.id, { ageBand: e.target.value as AgeBandId })
                  }
                  className="px-2 py-2 rounded-xl border-2 border-sand-dark bg-white text-sm font-bold"
                >
                  {AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a} ετών
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-charcoal-muted">
                  {count} καταγραφές{homeCount > 0 ? ` (${homeCount} από το σπίτι)` : ''}
                </span>
                {p.childCode && !isSelfChildCode(p.childCode) ? (
                  <>
                    <span
                      data-testid={`pro-tools-child-code-${p.id}`}
                      className="px-2 py-1 rounded-lg bg-white border border-slate text-xs font-extrabold tracking-widest"
                    >
                      🔑 {p.childCode}
                    </span>
                    <button
                      type="button"
                      data-testid={`pro-tools-copy-parent-msg-${p.id}`}
                      onClick={() => void handleCopyParentMessage(p.nickname, p.childCode!)}
                      className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-slate text-xs font-extrabold"
                    >
                      📋 Μήνυμα για γονιό
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    data-testid={`pro-tools-new-code-btn-${p.id}`}
                    onClick={() => void handleNewChildCode(p.id)}
                    className="touch-target px-3 py-2 rounded-xl bg-sage-surface border-2 border-sage text-xs font-extrabold"
                  >
                    🔑 Κωδικός παιδιού
                  </button>
                )}
                <button
                  type="button"
                  data-testid={`pro-tools-report-btn-${p.id}`}
                  onClick={() => handleReport(p.id)}
                  className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-slate text-xs font-extrabold"
                >
                  📄 Αναφορά (PDF)
                </button>
                <button
                  type="button"
                  data-testid={`pro-tools-csv-btn-${p.id}`}
                  onClick={() => handleExportCsv(p.id, p.nickname)}
                  className="touch-target px-3 py-2 rounded-xl bg-white border-2 border-slate text-xs font-extrabold"
                >
                  📊 CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sand-dark">
        <button
          type="button"
          data-testid="pro-tools-csv-all-btn"
          onClick={() => handleExportCsv()}
          className="touch-target px-4 py-2 rounded-xl bg-sage-surface border-2 border-sage text-sm font-extrabold"
        >
          📊 CSV όλων των παιδιών
        </button>
        <button
          type="button"
          data-testid="pro-tools-backup-btn"
          onClick={() => void handleBackup()}
          className="touch-target px-4 py-2 rounded-xl bg-sage-surface border-2 border-sage text-sm font-extrabold"
        >
          💾 Αντίγραφο ασφαλείας
        </button>
        <button
          type="button"
          data-testid="pro-tools-restore-btn"
          onClick={() => fileInputRef.current?.click()}
          className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-sm font-extrabold"
        >
          📥 Επαναφορά από αρχείο
        </button>
        <button
          type="button"
          data-testid="pro-tools-import-progress-btn"
          onClick={() => progressInputRef.current?.click()}
          className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-sage-dark text-sm font-extrabold"
        >
          📥 Πρόοδος από γονιό
        </button>
        <input
          ref={progressInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="pro-tools-progress-file-input"
          onChange={(e) => void handleProgressFileChosen(e)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="pro-tools-restore-file-input"
          onChange={(e) => void handleFileChosen(e)}
        />
      </div>

      {pendingBackup && (
        <div
          role="alert"
          data-testid="pro-tools-restore-confirm"
          className="p-4 rounded-2xl bg-terracotta-surface border-2 border-terracotta space-y-2"
        >
          <p className="text-sm font-extrabold text-charcoal">
            Η επαναφορά θα ΑΝΤΙΚΑΤΑΣΤΗΣΕΙ όλα τα προφίλ και το ιστορικό αυτής της συσκευής με{' '}
            {pendingBackup.childProfiles.length} προφίλ και {pendingBackup.sessionLogs.length}{' '}
            καταγραφές (αντίγραφο της {pendingBackup.exportedAt.slice(0, 10)}).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="pro-tools-restore-confirm-btn"
              onClick={() => void handleConfirmRestore()}
              className="touch-target px-4 py-2 rounded-xl bg-terracotta-dark text-white text-sm font-extrabold"
            >
              Ναι, αντικατάσταση
            </button>
            <button
              type="button"
              onClick={() => setPendingBackup(null)}
              className="touch-target px-4 py-2 rounded-xl bg-white border-2 border-slate text-sm font-extrabold"
            >
              Ακύρωση
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" data-testid="pro-tools-message" className="text-sm font-bold text-charcoal">
          {message}
        </p>
      )}
    </section>
  );
};

export default ProfessionalToolsSection;
