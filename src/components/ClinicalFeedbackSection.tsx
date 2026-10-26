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
  { value: 'parent', labelEl: '≡ƒæ¿ΓÇì≡ƒæ⌐ΓÇì≡ƒæº ╬ô╬┐╬╜╬¡╬▒╧é / ╬Ü╬╖╬┤╬╡╬╝╧î╬╜╬▒╧é' },
  { value: 'occupational-therapist', labelEl: '≡ƒæÉ ╬ò╧ü╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬«╧é (OT)' },
  { value: 'speech-therapist', labelEl: '≡ƒùú∩╕Å ╬¢╬┐╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬«╧é (SLT)' },
  { value: 'child-psychologist', labelEl: '≡ƒºá ╬á╬▒╬╣╬┤╬┐╧ê╧à╧ç╬┐╬╗╧î╬│╬┐╧é / ╬ò╬╣╬┤╬╣╬║╧î╧é ╬á╬▒╬╣╬┤╬▒╬│╧ë╬│╧î╧é' },
  { value: 'child-psychiatrist', labelEl: '≡ƒ⌐║ ╬á╬▒╬╣╬┤╬┐╧ê╧à╧ç╬»╬▒╧ä╧ü╬┐╧é' },
  { value: 'physiatrist', labelEl: '≡ƒÅâ ╬ª╧à╧â╬»╬▒╧ä╧ü╬┐╧é' },
  { value: 'social-worker', labelEl: '≡ƒñ¥ ╬Ü╬┐╬╣╬╜╧ë╬╜╬╣╬║╧î╧é ╬¢╬╡╬╣╧ä╬┐╧à╧ü╬│╧î╧é' },
  { value: 'adhd-center-director', labelEl: '≡ƒÅÑ ╬Ñ╧Ç╬╡╧ì╬╕╧à╬╜╬┐╧é ╬Ü╬¡╬╜╧ä╧ü╬┐╧à ╬ö╬ò╬á╬Ñ / ╬ÿ╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬╖╧ü╬»╬┐╧à' },
];

const CATEGORY_OPTIONS: Array<{ value: ObservationCategory; labelEl: string }> = [
  { value: 'clinical-suggestion', labelEl: '≡ƒ⌐║ ╬Ü╬╗╬╣╬╜╬╣╬║╬« ╬á╧ü╧î╧ä╬▒╧â╬╖ ╬Æ╬╡╬╗╧ä╬»╧ë╧â╬╖╧é' },
  { value: 'bug-ux', labelEl: '≡ƒ¢á∩╕Å ╬¢╬╡╬╣╧ä╬┐╧à╧ü╬│╬╣╬║╬« ╬á╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖ / UX ╬á╬▒╬╣╧ç╬╜╬╣╬┤╬╣╬┐╧ì' },
  { value: 'age-calibration', labelEl: '≡ƒÄ» ╬Ü╬╗╬╣╬╝╬¼╬║╧ë╧â╬╖ ╬ù╬╗╬╣╬║╬»╬▒╧é & ╬ö╧à╧â╬║╬┐╬╗╬»╬▒╧é' },
  { value: 'new-game-idea', labelEl: '≡ƒÆí ╬Ö╬┤╬¡╬▒ ╬│╬╣╬▒ ╬¥╬¡╬▒ ╬ÿ╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬╣╬║╬« ╬å╧â╬║╬╖╧â╬╖' },
  { value: 'positive-review', labelEl: '≡ƒîƒ ╬ÿ╬╡╧ä╬╣╬║╬« ╬æ╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖ & ╬æ╬╜╧ä╬▒╧Ç╧î╬║╧ü╬╣╧â╬╖ ╬á╬▒╬╣╬┤╬╣╬┐╧ì' },
];

export function formatFeedbackReportText(entries: ClinicalFeedbackEntry[]): string {
  if (entries.length === 0) {
    return '╬ö╬╡╬╜ ╧à╧Ç╬¼╧ü╧ç╬┐╧à╬╜ ╬▒╬║╧î╬╝╬╖ ╬║╬▒╧ä╬▒╬│╬╡╬│╧ü╬▒╬╝╬╝╬¡╬╜╬╡╧é ╧Ç╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╬╣╧é.';
  }
  const header = [
    '==========================================================',
    'SYNAPSEPLAY (FocusEngine 5+) ΓÇö ╬æ╬¥╬æ╬ª╬ƒ╬í╬æ ╬æ╬₧╬Ö╬ƒ╬¢╬ƒ╬ô╬ù╬ú╬ù╬ú & ╬á╬æ╬í╬æ╬ñ╬ù╬í╬ù╬ú╬ò╬⌐╬¥',
    `╬ú╧ì╬╜╬┐╬╗╬┐ ╬á╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╧ë╬╜: ${entries.length} | ╬ù╬╝╬╡╧ü╬┐╬╝╬╖╬╜╬»╬▒ ╬ò╬╛╬▒╬│╧ë╬│╬«╧é: ${new Date().toLocaleDateString('el-GR')}`,
    '==========================================================',
    '',
  ].join('\n');

  const body = entries
    .map((e, idx) => {
      return [
        `#${idx + 1} [${e.dateKey}] ΓÇö ${e.reviewerRoleLabelEl}${
          e.reviewerNameOrCenter ? ` (${e.reviewerNameOrCenter})` : ''
        }`,
        `ΓÇó ╬æ╧å╬┐╧ü╬¼: ${e.targetScopeLabelEl} | ╬ù╬╗╬╣╬║╬»╬▒ ╬ö╬┐╬║╬╣╬╝╬«╧é: ${e.ageBandTested} ╬╡╧ä╧Ä╬╜`,
        `ΓÇó ╬Æ╬▒╬╕╬╝╬┐╬╗╬┐╬│╬»╬▒: ${e.ratingStars}/5 Γ¡É (╬ò╧à╧ç╧ü╬╖╧â╧ä╬»╬▒ ╬á╬▒╬╣╬┤╬╣╬┐╧ì: ${e.usabilityScore}/5 | ╬Ü╬╗╬╣╬╜╬╣╬║╬« ╬Ü╬▒╧ä╬▒╬╗╬╗╬╖╬╗╧î╧ä╬╖╧ä╬▒: ${e.clinicalAppropriatenessScore}/5)`,
        `ΓÇó ╬á╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖ / ╬á╧ü╧î╧ä╬▒╧â╬╖: ${e.commentEl}`,
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
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [isSendingCloud, setIsSendingCloud] = useState<boolean>(false);

  const scopeOptions = [
    { value: 'general', labelEl: '≡ƒîÉ ╬ô╬╡╬╜╬╣╬║╬« ╬¢╬╡╬╣╧ä╬┐╧à╧ü╬│╬»╬▒ & ╬á╬╡╧ü╬╣╬▓╬¼╬╗╬╗╬┐╬╜ ╬ò╧å╬▒╧ü╬╝╬┐╬│╬«╧é' },
    { value: 'voice-engine', labelEl: '≡ƒöè ╬ª╧ë╬╜╬╖╧ä╬╣╬║╬« ╬ò╬║╧å╧Ä╬╜╬╖╧â╬╖ & ╬ò╬╗╬╗╬╖╬╜╬╣╬║╬« ╬á╧ü╬┐╧â╧ë╬┤╬»╬▒' },
    { value: 'age-adaptation', labelEl: '≡ƒÄ» ╬á╧ü╬┐╧â╬▒╧ü╬╝╬┐╬│╬« ╬ù╬╗╬╣╬║╬»╬▒╧é & ╬ö╧à╬╜╬▒╬╝╬╣╬║╬« ╬ö╧à╧â╬║╬┐╬╗╬»╬▒' },
    ...ACTIVITIES.map((a) => ({
      value: a.id,
      labelEl: `${a.code}. ${a.titleEl} (${a.executiveDomain})`,
    })),
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = commentEl.trim();
    if (!trimmed) {
      setSubmittedNotice('ΓÜá∩╕Å ╬á╬▒╧ü╬▒╬║╬▒╬╗╧Ä ╬│╧ü╬¼╧ê╧ä╬╡ ╧ä╬╖╬╜ ╧Ç╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖ ╬« ╧ä╬╖╬╜ ╧Ç╧ü╧î╧ä╬▒╧â╬« ╧â╬▒╧é ╧Ç╧ü╬╣╬╜ ╬▒╧Ç╧î ╧ä╬╖╬╜ ╧à╧Ç╬┐╬▓╬┐╬╗╬«.');
      return;
    }

    const roleMeta = ROLE_OPTIONS.find((r) => r.value === reviewerRole) ?? ROLE_OPTIONS[0];
    const scopeMeta = scopeOptions.find((s) => s.value === targetScope) ?? scopeOptions[0];

    const payload = {
      reviewerRole,
      reviewerRoleLabelEl: roleMeta.labelEl,
      reviewerNameOrCenter: reviewerNameOrCenter.trim() || '╬æ╬╜╧Ä╬╜╧à╬╝╬┐╧é ╬æ╬╛╬╣╬┐╬╗╬┐╬│╬╖╧ä╬«╧é',
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
    setSubmittedNotice('ΓÅ│ ╬Ü╬▒╧ä╬▒╬│╧ü╬¼╧å╬╖╬║╬╡ ╬║╬▒╬╣ ╬▒╧Ç╬┐╧â╧ä╬¡╬╗╬╗╬╡╧ä╬▒╬╣ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬▒ ╧â╧ä╬╖╬╜ ╬┐╬╝╬¼╬┤╬▒ ╬▒╬╜╬¼╧Ç╧ä╧à╬╛╬╖╧é...');

    const relayResult = await sendFeedbackSilentlyToOwner(payload);
    setIsSendingCloud(false);

    if (relayResult.delivered) {
      setSubmittedNotice(
        'Γ£à ╬ù ╧Ç╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬« ╧â╬▒╧é ╬║╬▒╧ä╬▒╬│╧ü╬¼╧å╬╖╬║╬╡ ╬║╬▒╬╣ ╬╡╧â╧ä╬¼╬╗╬╖ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬▒ ╧â╧ä╬╖╬╜ ╬┐╬╝╬¼╬┤╬▒ ╬▒╬╜╬¼╧Ç╧ä╧à╬╛╬╖╧é ╧ä╬┐╧à SynapsePlay! ╬ú╬▒╧é ╬╡╧à╧ç╬▒╧ü╬╣╧â╧ä╬┐╧ì╬╝╬╡!'
      );
    } else {
      setSubmittedNotice(
        'Γ£à ╬ù ╧Ç╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖ ╬▒╧Ç╬┐╬╕╬╖╬║╬╡╧ì╧ä╬╖╬║╬╡ ╧â╧ä╬╖ ╧â╧à╧â╬║╬╡╧à╬«! ╬£╧î╬╗╬╣╧é ╧â╧à╬╜╬┤╬╡╬╕╬╡╬»╧ä╬╡ ╧â╧ä╬┐ ╬┤╬╣╬▒╬┤╬»╬║╧ä╧à╬┐, ╧Ç╬▒╧ä╬«╧â╧ä╬╡ ┬½╬æ╧Ç╬┐╧â╧ä╬┐╬╗╬« ╬ú╧à╬│╬║╬╡╬╜╧ä╧ü╧ë╧ä╬╣╬║╬«╧é ╬æ╬╜╬▒╧å╬┐╧ü╬¼╧é┬╗.'
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
        `Γ£à ╬î╬╗╬╡╧é ╬┐╬╣ ╧Ç╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╬╣╧é (${feedbackEntries.length}) ╬╡╧â╧ä╬¼╬╗╬╖╧â╬▒╬╜ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬▒ ╧â╧ä╬╖╬╜ ╬┐╬╝╬¼╬┤╬▒ ╬▒╬╜╬¼╧Ç╧ä╧à╬╛╬╖╧é!`
      );
    } else {
      setSubmittedNotice(
        'ΓÜá∩╕Å ╬ö╬╡╬╜ ╬«╧ä╬▒╬╜ ╬┤╧à╬╜╬▒╧ä╬« ╬╖ ╬¼╬╝╬╡╧â╬╖ ╬┤╬╣╬║╧ä╧à╬▒╬║╬« ╬▒╧Ç╬┐╧â╧ä╬┐╬╗╬« ╬▒╧à╧ä╬« ╧ä╬╖ ╧â╧ä╬╣╬│╬╝╬«. ╬£╧Ç╬┐╧ü╬╡╬»╧ä╬╡ ╬╜╬▒ ╧Ç╬▒╧ä╬«╧â╬╡╧ä╬╡ ┬½╬¢╬«╧ê╬╖ ╬æ╧ü╧ç╬╡╬»╬┐╧à ╬æ╬╜╬▒╧å╬┐╧ü╬¼╧é┬╗ ╬« ┬½╬æ╬╜╧ä╬╣╬│╧ü╬▒╧å╬«┬╗.'
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
      a.download = `SynapsePlay_╬æ╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖_╬Ü╬¡╬╜╧ä╧ü╬┐╧à_╬ö╬ò╬á╬Ñ_${new Date().toISOString().slice(0, 10)}.txt`;
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
            ≡ƒÆ¼ ╬Ü╬╗╬╣╬╜╬╣╬║╬« ╬ö╬┐╬║╬╣╬╝╬« ╬Ü╬¡╬╜╧ä╧ü╧ë╬╜ ╬ö╬ò╬á╬Ñ & ╬æ╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖ ╬ô╬┐╬╜╬¡╧ë╬╜
          </span>
          <h2 className="text-2xl font-extrabold text-charcoal">
            ≡ƒô¥ ╬á╧ü╬┐╧ä╬¼╧â╬╡╬╣╧é, ╬æ╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖ & ╬á╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╬╣╧é ╬Æ╬╡╬╗╧ä╬»╧ë╧â╬╖╧é ({feedbackEntries.length})
          </h2>
          <p className="text-sm text-charcoal-muted max-w-3xl">
            ╬ò╬╣╬┤╬╣╬║╧î╧é ╧ç╧Ä╧ü╬┐╧é ╬│╬╣╬▒ <strong>╬ÿ╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬¡╧é ╬Ü╬¡╬╜╧ä╧ü╧ë╬╜ ╬ö╬ò╬á╬Ñ</strong> (╬ò╧ü╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬¡╧é,
            ╬¢╬┐╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧à╧ä╬¡╧é, ╬á╬▒╬╣╬┤╬┐╧ê╧à╧ç╬┐╬╗╧î╬│╬┐╧à╧é, ╬ò╬╣╬┤╬╣╬║╬┐╧ì╧é ╬á╬▒╬╣╬┤╬▒╬│╧ë╬│╬┐╧ì╧é) ╬║╬▒╬╣ <strong>╬ô╬┐╬╜╬╡╬»╧é</strong>.
            ╬Ü╬▒╧ä╬▒╬│╧ü╬¼╧ê╧ä╬╡ ╬┐╧Ç╬┐╬╣╬▒╬┤╬«╧Ç╬┐╧ä╬╡ ╧Ç╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖ ╬▒╧Ç╧î ╧ä╬╖ ╬┤╬┐╬║╬╣╬╝╬« ╧ä╧ë╬╜ ╧Ç╬▒╬╣╧ç╬╜╬╣╬┤╬╣╧Ä╬╜ ╬╝╬╡ ╧ä╬▒ ╧Ç╬▒╬╣╬┤╬╣╬¼ ΓÇö ╬║╬¼╬╕╬╡
            ╧à╧Ç╬┐╬▓╬┐╬╗╬« ╬▒╧Ç╬┐╧â╧ä╬¡╬╗╬╗╬╡╧ä╬▒╬╣ ╬▒╧à╧ä╧î╬╝╬▒╧ä╬▒ ╧â╧ä╬╖╬╜ ╬┐╬╝╬¼╬┤╬▒ ╬▒╬╜╬¼╧Ç╧ä╧à╬╛╬╖╧é.
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
              <span aria-hidden="true">≡ƒôñ</span>
              <span>
                {isSendingCloud
                  ? '╬æ╧Ç╬┐╧â╧ä╬┐╬╗╬«...'
                  : '╬æ╧Ç╬┐╧â╧ä╬┐╬╗╬« ╬ú╧à╬│╬║╬╡╬╜╧ä╧ü╧ë╧ä╬╣╬║╬«╧é ╬æ╬╜╬▒╧å╬┐╧ü╬¼╧é ╧â╧ä╬╖╬╜ ╬ƒ╬╝╬¼╬┤╬▒'}
              </span>
            </button>

            <button
              type="button"
              data-testid="copy-feedback-report-btn"
              onClick={() => void handleCopyReport()}
              className="touch-target px-4 py-2.5 rounded-2xl bg-sand-light border-2 border-slate text-charcoal font-extrabold text-xs flex items-center gap-1.5 hover:bg-sand"
            >
              <span aria-hidden="true">≡ƒôï</span>
              <span>
                {copiedNotice ? 'Γ£ô ╬æ╬╜╧ä╬╣╬│╧ü╬¼╧å╬╖╬║╬╡ ╧â╧ä╬┐ ╬á╧ü╧î╧ç╬╡╬╣╧ü╬┐!' : '╬æ╬╜╧ä╬╣╬│╧ü╬▒╧å╬« ╬æ╬╜╬▒╧å╬┐╧ü╬¼╧é'}
              </span>
            </button>

            <button
              type="button"
              data-testid="download-feedback-report-btn"
              onClick={handleDownloadReport}
              className="touch-target px-4 py-2.5 rounded-2xl bg-slate text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-dark"
            >
              <span aria-hidden="true">≡ƒôÑ</span>
              <span>╬¢╬«╧ê╬╖ ╬æ╧ü╧ç╬╡╬»╬┐╧à (.txt)</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reviewer Role */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-role-select"
              className="block text-xs font-extrabold text-charcoal"
            >
              1. ╬Ö╬┤╬╣╧î╧ä╬╖╧ä╬▒ / ╬ò╬╣╬┤╬╣╬║╧î╧ä╬╖╧ä╬▒ ╬æ╬╛╬╣╬┐╬╗╬┐╬│╬╖╧ä╬«:
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
              2. ╬î╬╜╬┐╬╝╬▒ ╬« ╬Ü╬¡╬╜╧ä╧ü╬┐ ╬ö╬ò╬á╬Ñ (╬á╧ü╬┐╬▒╬╣╧ü╬╡╧ä╬╣╬║╧î):
            </label>
            <input
              id="feedback-center-input"
              data-testid="feedback-center-input"
              type="text"
              maxLength={80}
              value={reviewerNameOrCenter}
              onChange={(e) => setReviewerNameOrCenter(e.target.value)}
              placeholder="╧Ç.╧ç. ╬Ü╬¡╬╜╧ä╧ü╬┐ ╬ò╬╣╬┤╬╣╬║╧Ä╬╜ ╬ÿ╬╡╧ü╬▒╧Ç╬╡╬╣╧Ä╬╜ / ╬ò╧ü╬│╬┐╬╕╬╡╧ü╬▒╧Ç╬╡╧ì╧ä╧ü╬╣╬▒ ╬£╬▒╧ü╬»╬▒"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate text-sm font-bold text-charcoal"
            />
          </div>

          {/* Target Activity or System Scope */}
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-scope-select"
              className="block text-xs font-extrabold text-charcoal"
            >
              3. ╬æ╧å╬┐╧ü╬¼ ╬ö╧ü╬▒╧â╧ä╬╖╧ü╬╣╧î╧ä╬╖╧ä╬▒ ╬« ╬ò╬╜╧î╧ä╬╖╧ä╬▒:
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
              4. ╬ò╬»╬┤╬┐╧é ╬á╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖╧é:
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
              5. ╬ù╬╗╬╣╬║╬╣╬▒╬║╬« ╬ƒ╬╝╬¼╬┤╬▒ ╬ö╬┐╬║╬╣╬╝╬«╧é:
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
                  {b.id} ╬╡╧ä╧Ä╬╜
                </button>
              ))}
            </div>
          </div>

          {/* 3-Metric Rating (Stars, Child Usability, Clinical Appropriateness) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-charcoal">
              6. ╬Æ╬▒╬╕╬╝╬┐╬╗╬┐╬│╬»╬▒ ╬æ╬╛╬╣╬┐╬╗╧î╬│╬╖╧â╬╖╧é (1ΓÇô5 Γ¡É):
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
                  {star}Γ¡É
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
            7. ╬á╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╬╣╧é, ╬á╧ü╬┐╧ä╬¼╧â╬╡╬╣╧é ╬Æ╬╡╬╗╧ä╬»╧ë╧â╬╖╧é ╬« ╬ú╧à╬╝╧Ç╬╡╧ü╬╣╧å╬┐╧ü╬¼ ╬á╬▒╬╣╬┤╬╣╬┐╧ì ╬║╬▒╧ä╬¼ ╧ä╬╖ ╬ú╧à╬╜╬╡╬┤╧ü╬»╬▒:
          </label>
          <textarea
            id="feedback-comment-textarea"
            data-testid="feedback-comment-textarea"
            rows={3}
            value={commentEl}
            onChange={(e) => setCommentEl(e.target.value)}
            placeholder="╬ô╧ü╬¼╧ê╧ä╬╡ ╬▒╬╜╬▒╬╗╧à╧ä╬╣╬║╬¼ ╧ä╬╣ ╧Ç╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬▒╧ä╬╡ (╧Ç.╧ç. ┬½╬ú╧ä╬┐ ╧Ç╬▒╬╣╧ç╬╜╬»╬┤╬╣ 09 ╬╝╬╡ ╧Ç╬▒╬╣╬┤╬» 6 ╬╡╧ä╧Ä╬╜ ╬╕╬▒ ╬╕╬¡╬╗╬▒╬╝╬╡...┬╗, ┬½╬ù ╧å╧ë╬╜╬« ╧â╧ä╬╖ ╬╗╬¡╬╛╬╖...┬╗, ┬½╬á╧ü╬┐╧ä╬╡╬»╬╜╬┐╧à╬╝╬╡ ╬╜╬▒ ╧Ç╧ü╬┐╧â╧ä╬╡╬╕╬╡╬»...┬╗)"
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
              ≡ƒÆí ╬Ü╬¼╬╕╬╡ ╧Ç╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖ ╬▒╧Ç╬┐╬╕╬╖╬║╬╡╧ì╬╡╧ä╬▒╬╣ ╧ä╬┐╧Ç╬╣╬║╬¼ ╬║╬▒╬╣ ╬╝╧Ç╬┐╧ü╬╡╬» ╬╜╬▒ ╬╡╬╛╬▒╧ç╬╕╬╡╬»/╬▒╧Ç╬┐╧â╧ä╬▒╬╗╬╡╬» ╧â╧à╬│╬║╬╡╬╜╧ä╧ü╧ë╧ä╬╣╬║╬¼ ╬╝╬╡
              1 ╬║╬╗╬╣╬║.
            </p>
          )}

          <button
            type="button"
            data-testid="submit-feedback-btn"
            disabled={isSendingCloud}
            onClick={() => void handleSubmit()}
            className="touch-target px-6 py-3 rounded-2xl bg-sage-dark text-white font-extrabold text-sm flex items-center gap-2 hover:bg-sage disabled:opacity-60"
          >
            <span aria-hidden="true">≡ƒô¿</span>
            <span>
              {isSendingCloud
                ? '╬æ╧Ç╬┐╧â╧ä╬┐╬╗╬« ╬á╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖╧é...'
                : '╬Ü╬▒╧ä╬▒╧ç╧Ä╧ü╬╖╧â╬╖ & ╬æ╧à╧ä╧î╬╝╬▒╧ä╬╖ ╬æ╧Ç╬┐╧â╧ä╬┐╬╗╬« ╬á╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖╧é'}
            </span>
          </button>
        </div>
      </form>

      {/* Saved Observations List */}
      {feedbackEntries.length > 0 && (
        <div className="space-y-3" data-testid="feedback-entries-list">
          <h3 className="text-sm font-extrabold text-charcoal">
            ≡ƒôï ╬Ü╬▒╧ä╬▒╬│╬╡╬│╧ü╬▒╬╝╬╝╬¡╬╜╬╡╧é ╬á╬▒╧ü╬▒╧ä╬╖╧ü╬«╧â╬╡╬╣╧é ╬ÿ╬╡╧ü╬▒╧Ç╬╡╧à╧ä╧Ä╬╜ & ╬ô╬┐╬╜╬¡╧ë╬╜ ({feedbackEntries.length}):
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
                      ╬ù╬╗╬╣╬║╬»╬▒ {entry.ageBandTested} ΓÇó {entry.ratingStars}/5 Γ¡É
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
                    title="╬ö╬╣╬▒╬│╧ü╬▒╧å╬« ╧Ç╬▒╧ü╬▒╧ä╬«╧ü╬╖╧â╬╖╧é"
                  >
                    ≡ƒùæ∩╕Å ╬ö╬╣╬▒╬│╧ü╬▒╧å╬«
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
