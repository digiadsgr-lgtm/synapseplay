import type { ClinicalFeedbackEntry } from '../types/domain';

// Obfuscated char-code sequence so no plaintext email address appears in the UI
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
 * Sends feedback via the hardened /api/feedback endpoint first (enforcing rate limits,
 * origin checks, and length caps), and falls back to direct browser FormSubmit AJAX relay
 * if the serverless IP is blocked by FormSubmit's anti-datacenter filter.
 */
export async function sendFeedbackSilentlyToOwner(
  entry: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>,
  fullReportText?: string
): Promise<FeedbackRelayResult> {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
    return { delivered: true, channel: 'serverless-api' };
  }

  const subject = `SynapsePlay Αξιολόγηση — ${entry.reviewerRoleLabelEl} (${entry.targetScopeLabelEl})`.slice(0, 180);

  // 1. Try hardened Vercel Serverless Function (/api/feedback)
  try {
    const apiResp = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, fullReportText }),
    });

    // Respect server-side rate limiting or validation rejection
    if (apiResp.status === 429 || apiResp.status === 400 || apiResp.status === 403) {
      return { delivered: false, channel: 'local-only' };
    }

    if (apiResp.ok) {
      const data = (await apiResp.json()) as { ok?: boolean; method?: string };
      if (data.ok) {
        return { delivered: true, channel: 'serverless-api' };
      }
    }
  } catch {
    // Proceed to direct browser FormSubmit AJAX relay fallback
  }

  // 2. Fallback: Direct browser FormSubmit AJAX relay (ensures browser Origin/Referer headers are accepted by FormSubmit)
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
        Παρατήρηση_Πρόταση: (fullReportText || entry.commentEl).slice(0, 10000),
      }),
    });
    if (directResp.ok) {
      return { delivered: true, channel: 'direct-relay' };
    }
  } catch {
    // Offline: entry is already saved in local IndexedDB
  }

  return { delivered: false, channel: 'local-only' };
}
