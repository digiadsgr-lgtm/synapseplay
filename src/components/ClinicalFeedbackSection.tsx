import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIVITIES } from '../data/activitiesCatalog';
import { AGE_BAND_PROTOCOLS, type AgeBandId } from '../data/ageProtocols';
import type {
  ClinicalFeedbackEntry,
  ObservationCategory,
  ReviewerRole,
} from '../types/domain';
import { sendFeedbackSilentlyToOwner } from '../utils/feedbackCloudRelay';

const ROLE_OPTIONS: Array<{ value: ReviewerRole; labelEl: string }> = [
  { value: 'parent', labelEl: '👨‍👩‍👧 Γονέας / Κηδεμόνας' },
  { value: 'occupational-therapist', labelEl: '👐 Εργοθεραπευτής (OT)' },
  { value: 'speech-therapist', labelEl: '🗣️ Λογοθεραπευτής (SLT)' },
  { value: 'child-psychologist', labelEl: '🧠 Παιδοψυχολόγος / Ειδικός Παιδαγωγός' },
  { value: 'child-psychiatrist', labelEl: '🩺 Παιδοψυχίατρος' },
  { value: 'physiatrist', labelEl: '🏃 Φυσίατρος' },
  { value: 'social-worker', labelEl: '🤝 Κοινωνικός Λειτουργός' },
  { value: 'adhd-center-director', labelEl: '🏥 Υπεύθυνος Κέντρου ΔΕΠΥ / Θεραπευτηρίου' },
];

const CATEGORY_OPTIONS: Array<{ value: ObservationCategory; labelEl: string }> = [
  { value: 'clinical-suggestion', labelEl: '🩺 Κλινική Πρόταση Βελτίωσης' },
  { value: 'bug-ux', labelEl: '🛠️ Λειτουργική Παρατήρηση / UX Παιχνιδιού' },
  { value: 'age-calibration', labelEl: '🎯 Κλιμάκωση Ηλικίας & Δυσκολίας' },
  { value: 'new-game-idea', labelEl: '💡 Ιδέα για Νέα Θεραπευτική Άσκηση' },
  { value: 'positive-review', labelEl: '🌟 Θετική Αξιολόγηση & Ανταπόκριση Παιδιού' },
];

export function formatFeedbackReportText(entries: ClinicalFeedbackEntry[]): string {
  if (entries.length === 0) {
    return 'Δεν υπάρχουν ακόμη καταγεγραμμένες παρατηρήσεις.';
  }
  const header = [
    '==========================================================',
    'SYNAPSEPLAY (FocusEngine 5+) — ΑΝΑΦΟΡΑ ΑΞΙΟΛΟΓΗΣΗΣ & ΠΑΡΑΤΗΡΗΣΕΩΝ',
    `Σύνολο Παρατηρήσεων: ${entries.length} | Ημερομηνία Εξαγωγής: ${new Date().toLocaleDateString('el-GR')}`,
    '==========================================================',
    '',
  ].join('\n');

  const body = entries
    .map((e, idx) => {
      return [
        `#${idx + 1} [${e.dateKey}] — ${e.reviewerRoleLabelEl}${
          e.reviewerNameOrCenter ? ` (${e.reviewerNameOrCenter})` : ''
        }`,
        `• Αφορά: ${e.targetScopeLabelEl} | Ηλικία Δοκιμής: ${e.ageBandTested} ετών`,
        `• Βαθμολογία: ${e.ratingStars}/5 ⭐ (Ευχρηστία Παιδιού: ${e.usabilityScore}/5 | Κλινική Καταλληλότητα: ${e.clinicalAppropriatenessScore}/5)`,
        `• Παρατήρηση / Πρόταση: ${e.commentEl}`,
        '----------------------------------------------------------',
      ].join('\n');
    })
    .join('\n');

  return `${header}${body}`;
}

export const ClinicalFeedbackSection: React.FC = () => {
  const { settings, feedbackEntries, submitFeedbackEntry, removeFeedbackEntry } = useApp();

  const [reviewerRole, setReviewerRole] = useState<ReviewerRole>('occupational-therapist');
  const [reviewerNameOrCenter, setReviewerNameOrCenter] = useState<string>('');
  const [targetScope, setTargetScope] = useState<string>('general');
  const [observationCategory, setObservationCategory] =
    useState<ObservationCategory>('clinical-suggestion');
  const [ageBandTested, setAgeBandTested] = useState<AgeBandId>(settings.ageBand ?? '6-8');
  const [ratingStars, setRatingStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [usabilityScore, setUsabilityScore] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [clinicalScore, setClinicalScore] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [commentEl, setCommentEl] = useState<string>('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState<string>('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [isSendingCloud, setIsSendingCloud] = useState<boolean>(false);

  const scopeOptions = [
    { value: 'general', labelEl: '🌐 Γενική Λειτουργία & Περιβάλλον Εφαρμογής' },
    { value: 'voice-engine', labelEl: '🔊 Φωνητική Εκφώνηση & Ελληνική Προσωδία' },
    { value: 'age-adaptation', labelEl: '🎯 Προσαρμογή Ηλικίας & Δυναμική Δυσκολία' },
    ...ACTIVITIES.map((a) => ({
      value: a.id,
      labelEl: `${a.code}. ${a.titleEl} (${a.executiveDomain})`,
    })),
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = commentEl.trim();
    if (!trimmed) {
      setSubmittedNotice('⚠️ Παρακαλώ γράψτε την παρατήρηση ή την πρότασή σας πριν από την υποβολή.');
      return;
    }

    const roleMeta = ROLE_OPTIONS.find((r) => r.value === reviewerRole) ?? ROLE_OPTIONS[0];
    const scopeMeta = scopeOptions.find((s) => s.value === targetScope) ?? scopeOptions[0];

    const payload = {
      reviewerRole,
      reviewerRoleLabelEl: roleMeta.labelEl,
      reviewerNameOrCenter: reviewerNameOrCenter.trim() || 'Ανώνυμος Αξιολογητής',
      targetScope,
      targetScopeLabelEl: scopeMeta.labelEl,
      ageBandTested,
      ratingStars,
      usabilityScore,
      clinicalAppropriatenessScore: clinicalScore,
      observationCategory,
      commentEl: trimmed,
    };

    await submitFeedbackEntry(payload);
    setCommentEl('');
    setIsSendingCloud(true);
    setSubmittedNotice('⏳ Καταγράφηκε και αποστέλλεται αυτόματα στην ομάδα ανάπτυξης...');

    const relayResult = await sendFeedbackSilentlyToOwner(payload, undefined, websiteHoneypot);
    setIsSendingCloud(false);

    if (relayResult.delivered) {
      setSubmittedNotice(
        '✅ Η παρατήρησή σας καταγράφηκε και εστάλη αυτόματα στην ομάδα ανάπτυξης του SynapsePlay! Σας ευχαριστούμε!'
      );
    } else {
      setSubmittedNotice(
        '✅ Η παρατήρηση αποθηκεύτηκε στη συσκευή! Μόλις συνδεθείτε στο διαδίκτυο, πατήστε «Αποστολή Συγκεντρωτικής Αναφοράς».'
      );
    }
  };

  const handleSendBatchSilently = async () => {
    if (feedbackEntries.length === 0) return;
    setIsSendingCloud(true);
    const reportText = formatFeedbackReportText(feedbackEntries);
    const latest = feedbackEntries[0];
    const res = await sendFeedbackSilentlyToOwner(latest, reportText);
    setIsSendingCloud(false);
    if (res.delivered) {
      setSubmittedNotice(
        `✅ Όλες οι παρατηρήσεις (${feedbackEntries.length}) εστάλησαν αυτόματα στην ομάδα ανάπτυξης!`
      );
    } else {
      setSubmittedNotice(
        '⚠️ Δεν ήταν δυνατή η άμεση δικτυακή αποστολή αυτή τη στιγμή. Μπορείτε να πατήσετε «Λήψη Αρχείου Αναφοράς» ή «Αντιγραφή».'
      );
    }
  };

  const handleCopyReport = async () => {
    const reportText = formatFeedbackReportText(feedbackEntries);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(reportText);
      }
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 3500);
    } catch {
      setCopiedNotice(true);
    }
  };

  const handleDownloadReport = () => {
    const reportText = formatFeedbackReportText(feedbackEntries);
    try {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SynapsePlay_Αξιολόγηση_Κέντρου_ΔΕΠΥ_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore in headless test environment
    }
  };

  return (
    <section
      data-testid="parent-feedback-evaluation-section"
      className="bg-white border-4 border-sage-dark rounded-3xl p-6 space-y-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-sand-dark pb-4">
        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-sage-surface border border-sage text-xs font-extrabold text-charcoal">
            💬 Κλινική Δοκιμή Κέντρων ΔΕΠΥ & Αξιολόγηση Γονέων
          </span>
          <h2 className="text-2xl font-extrabold text-charcoal">
            📝 Προτάσεις, Αξιολόγηση & Παρατηρήσεις Βελτίωσης ({feedbackEntries.length})
          </h2>
          <p className="text-sm text-charcoal-muted max-w-3xl">
            Ειδικός χώρος για <strong>Θεραπευτές Κέντρων ΔΕΠΥ</strong> (Εργοθεραπευτές,
            Λογοθεραπευτές, Παιδοψυχολόγους, Ειδικούς Παιδαγωγούς) και <strong>Γονείς</strong>.
            Καταγράψτε οποιαδήποτε παρατήρηση από τη δοκιμή των παιχνιδιών με τα παιδιά — κάθε
            υποβολή αποστέλλεται αυτόματα στην ομάδα ανάπτυξης.
          </p>
        </div>

        {feedbackEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="send-batch-feedback-btn"
              disabled={isSendingCloud}
              onClick={() => void handleSendBatchSilently()}
              className="touch-target px-4 py-2.5 rounded-2xl bg-sage-dark text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-sage disabled:opacity-60"
            >
              <span aria-hidden="true">📤</span>
              <span>
                {isSendingCloud
                  ? 'Αποστολή...'
                  : 'Αποστολή Συγκεντρωτικής Αναφοράς στην Ομάδα'}
              </span>
            </button>

            <button
              type="button"
              data-testid="copy-feedback-report-btn"
              onClick={() => void handleCopyReport()}
              className="touch-target px-4 py-2.5 rounded-2xl bg-sand-light border-2 border-slate text-charcoal font-extrabold text-xs flex items-center gap-1.5 hover:bg-sand"
            >
              <span aria-hidden="true">📋</span>
              <span>
                {copiedNotice ? '✓ Αντιγράφηκε στο Πρόχειρο!' : 'Αντιγραφή Αναφοράς'}
              </span>
            </button>

            <button
              type="button"
              data-testid="download-feedback-report-btn"
              onClick={handleDownloadReport}
              className="touch-target px-4 py-2.5 rounded-2xl bg-slate text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-dark"
            >
              <span aria-hidden="true">📥</span>
              <span>Λήψη Αρχείου (.txt)</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Submission Form */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        data-testid="clinical-feedback-form"
        className="p-5 rounded-3xl bg-sand-light border-2 border-sand-dark space-y-4"
      >
        {/* Anti-spam Honeypot (hidden from human users and screen readers) */}
        <div aria-hidden="true" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
          <label htmlFor="feedback-website-honeypot">Website</label>
          <input
            id="feedback-website-honeypot"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={websiteHoneypot}
            onChange={(e) => setWebsiteHoneypot(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reviewer Role */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-role-select"
              className="block text-xs font-extrabold text-charcoal"
            >
              1. Ιδιότητα / Ειδικότητα Αξιολογητή:
            </label>
            <select
              id="feedback-role-select"
              data-testid="feedback-role-select"
              value={reviewerRole}
              onChange={(e) => setReviewerRole(e.target.value as ReviewerRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.labelEl}
                </option>
              ))}
            </select>
          </div>

          {/* Name or ADHD Center */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-center-input"
              className="block text-xs font-extrabold text-charcoal"
            >
              2. Όνομα ή Κέντρο ΔΕΠΥ (Προαιρετικό):
            </label>
            <input
              id="feedback-center-input"
              data-testid="feedback-center-input"
              type="text"
              maxLength={80}
              value={reviewerNameOrCenter}
              onChange={(e) => setReviewerNameOrCenter(e.target.value)}
              placeholder="π.χ. Κέντρο Ειδικών Θεραπειών / Εργοθεραπεύτρια Μαρία"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
            />
          </div>

          {/* Target Activity or System Scope */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-scope-select"
              className="block text-xs font-extrabold text-charcoal"
            >
              3. Αφορά Δραστηριότητα ή Ενότητα:
            </label>
            <select
              id="feedback-scope-select"
              data-testid="feedback-scope-select"
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
            >
              {scopeOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.labelEl}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category of Observation */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-category-select"
              className="block text-xs font-extrabold text-charcoal"
            >
              4. Είδος Παρατήρησης:
            </label>
            <select
              id="feedback-category-select"
              data-testid="feedback-category-select"
              value={observationCategory}
              onChange={(e) => setObservationCategory(e.target.value as ObservationCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.labelEl}
                </option>
              ))}
            </select>
          </div>

          {/* Age Band Tested */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-charcoal">
              5. Ηλικιακή Ομάδα Δοκιμής:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AGE_BAND_PROTOCOLS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  data-testid={`feedback-age-${b.id}`}
                  onClick={() => setAgeBandTested(b.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-extrabold ${
                    ageBandTested === b.id
                      ? 'bg-slate text-white border-slate-dark'
                      : 'bg-white text-charcoal border-sand-dark'
                  }`}
                >
                  {b.id} ετών
                </button>
              ))}
            </div>
          </div>

          {/* 3-Metric Rating (Stars, Child Usability, Clinical Appropriateness) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-charcoal">
              6. Βαθμολογία Αξιολόγησης (1–5 ⭐):
            </label>
            <div className="flex items-center gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((star) => (
                <button
                  key={star}
                  type="button"
                  data-testid={`feedback-star-${star}`}
                  onClick={() => {
                    setRatingStars(star);
                    setUsabilityScore(star);
                    setClinicalScore(star);
                  }}
                  className={`w-10 h-10 rounded-xl border-2 font-extrabold text-sm flex items-center justify-center ${
                    ratingStars >= star
                      ? 'bg-sage text-white border-sage-dark'
                      : 'bg-white text-charcoal-muted border-sand-dark'
                  }`}
                >
                  {star}⭐
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Free-text Clinical Observation & Improvement Proposal */}
        <div className="space-y-1.5">
          <label
            htmlFor="feedback-comment-textarea"
            className="block text-xs font-extrabold text-charcoal"
          >
            7. Παρατηρήσεις, Προτάσεις Βελτίωσης ή Συμπεριφορά Παιδιού κατά τη Συνεδρία:
          </label>
          <textarea
            id="feedback-comment-textarea"
            data-testid="feedback-comment-textarea"
            rows={3}
            value={commentEl}
            onChange={(e) => setCommentEl(e.target.value)}
            placeholder="Γράψτε αναλυτικά τι παρατηρήσατε (π.χ. «Στο παιχνίδι 09 με παιδί 6 ετών θα θέλαμε...», «Η φωνή στη λέξη...», «Προτείνουμε να προστεθεί...»)"
            className="w-full p-3.5 rounded-2xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {submittedNotice ? (
            <p
              role="status"
              data-testid="feedback-submitted-notice"
              className="text-xs font-extrabold text-sage-dark"
            >
              {submittedNotice}
            </p>
          ) : (
            <p className="text-xs text-charcoal-muted">
              💡 Κάθε παρατήρηση αποθηκεύεται τοπικά και μπορεί να εξαχθεί/αποσταλεί συγκεντρωτικά με
              1 κλικ.
            </p>
          )}

          <button
            type="button"
            data-testid="submit-feedback-btn"
            disabled={isSendingCloud}
            onClick={() => void handleSubmit()}
            className="touch-target px-6 py-3 rounded-2xl bg-sage-dark text-white font-extrabold text-sm flex items-center gap-2 hover:bg-sage disabled:opacity-60"
          >
            <span aria-hidden="true">📨</span>
            <span>
              {isSendingCloud
                ? 'Αποστολή Παρατήρησης...'
                : 'Καταχώρηση & Αυτόματη Αποστολή Παρατήρησης'}
            </span>
          </button>
        </div>
      </form>

      {/* Saved Observations List */}
      {feedbackEntries.length > 0 && (
        <div className="space-y-3" data-testid="feedback-entries-list">
          <h3 className="text-sm font-extrabold text-charcoal">
            📋 Καταγεγραμμένες Παρατηρήσεις Θεραπευτών & Γονέων ({feedbackEntries.length}):
          </h3>
          <div className="space-y-3">
            {feedbackEntries.map((entry, index) => (
              <div
                key={entry.id ?? index}
                data-testid={`feedback-entry-card-${index}`}
                className="p-4 rounded-2xl bg-sand-light border-2 border-sand-dark flex flex-col md:flex-row items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-sage-surface border border-sage text-xs font-extrabold text-charcoal">
                      {entry.reviewerRoleLabelEl}
                    </span>
                    <span className="text-xs font-extrabold text-charcoal">
                      {entry.reviewerNameOrCenter}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate text-xs font-bold text-slate-dark">
                      {entry.targetScopeLabelEl}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-sand-dark text-xs font-extrabold text-charcoal">
                      Ηλικία {entry.ageBandTested} • {entry.ratingStars}/5 ⭐
                    </span>
                    <span className="text-[11px] text-charcoal-muted">{entry.dateKey}</span>
                  </div>
                  <p className="text-sm font-bold text-charcoal bg-white p-3 rounded-xl border border-sand-dark">
                    {entry.commentEl}
                  </p>
                </div>

                {entry.id !== undefined && (
                  <button
                    type="button"
                    data-testid={`delete-feedback-btn-${index}`}
                    onClick={() => void removeFeedbackEntry(entry.id!)}
                    className="px-3 py-1.5 rounded-xl bg-terracotta-surface border border-terracotta text-xs font-extrabold text-charcoal shrink-0"
                    title="Διαγραφή παρατήρησης"
                  >
                    🗑️ Διαγραφή
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
