import type { ClinicalFeedbackEntry } from '../types/domain';

// Obfuscated char-code sequence so no plaintext email address ever appears in the client source or UI
const RELAY_TARGET_CODES = [
  100, 105, 103, 105, 97, 100, 115, 103, 114, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
];

function resolveHiddenRelayUrl(): string {
  const decoded = String.fromCharCode(...RELAY_TARGET_CODES);
  return `https://formsubmit.co/ajax/${decoded}`;
}

export interface FeedbackRelayResult {
  delivered: boolean;
  channel: 'serverless-api' | 'direct-relay' | 'local-only';
}

/**
 * Automatically transmits a feedback entry or batch report in the background
 * without ever exposing any email address in the UI, DOM, or mailto links.
 */
export async function sendFeedbackSilentlyToOwner(
  entry: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>,
  fullReportText?: string
): Promise<FeedbackRelayResult> {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
    return { delivered: true, channel: 'serverless-api' };
  }

  const subject = `SynapsePlay Αξιολόγηση — ${entry.reviewerRoleLabelEl} (${entry.targetScopeLabelEl})`;

  // 1. Try Vercel Serverless Function (/api/feedback)
  try {
    const apiResp = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        ...entry,
        fullReportText,
      }),
    });
    if (apiResp.ok) {
      const data = (await apiResp.json()) as { ok?: boolean; method?: string };
      if (data.ok && (data.method === 'resend' || data.method === 'formsubmit-server')) {
        return { delivered: true, channel: 'serverless-api' };
      }
    }
  } catch {
    // Proceed to direct browser AJAX relay fallback
  }

  // 2. Fallback: Direct browser AJAX relay (ensures browser Origin/Referer headers are accepted by FormSubmit)
  try {
    const directResp = await fetch(resolveHiddenRelayUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        Αξιολογητής: `${entry.reviewerRoleLabelEl} (${entry.reviewerNameOrCenter})`,
        Ενότητα_Παιχνίδι: entry.targetScopeLabelEl,
        Ηλικιακή_Ομάδα: `${entry.ageBandTested} ετών`,
        Βαθμολογία: `${entry.ratingStars}/5 ⭐ (Ευχρηστία: ${entry.usabilityScore}/5, Κλινική: ${entry.clinicalAppropriatenessScore}/5)`,
        Κατηγορία: entry.observationCategory,
        Παρατήρηση_Πρόταση: fullReportText || entry.commentEl,
      }),
    });
    if (directResp.ok) {
      return { delivered: true, channel: 'direct-relay' };
    }
  } catch {
    // Offline fallback: entry is already safely saved in local IndexedDB
  }

  return { delivered: false, channel: 'local-only' };
}
