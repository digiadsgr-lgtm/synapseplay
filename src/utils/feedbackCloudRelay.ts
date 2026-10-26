import { ClinicalFeedbackEntry } from '../types/domain';

export interface CloudRelayResult {
  delivered: boolean;
  provider: string;
}

/**
 * Sends feedback exclusively through the same-origin `/api/feedback` serverless
 * endpoint so that destination addresses, rate limits, and validation stay
 * strictly on the server.
 */
export async function sendFeedbackSilentlyToOwner(
  entry: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>,
  fullReportText?: string,
  honeypotWebsite?: string
): Promise<CloudRelayResult> {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
    return { delivered: true, provider: 'test-bypass' };
  }

  const payload = {
    role: entry.reviewerRoleLabelEl,
    centerOrName: entry.reviewerNameOrCenter || 'Ανώνυμος Αξιολογητής',
    scope: entry.targetScopeLabelEl,
    ageBand: `${entry.ageBandTested} ετών`,
    rating: `${entry.ratingStars}/5 ⭐ (Ευχρηστία: ${entry.usabilityScore}/5, Κλινική: ${entry.clinicalAppropriatenessScore}/5)`,
    category: entry.observationCategory,
    comment: entry.commentEl,
    fullReport: fullReportText || '',
    website: honeypotWebsite || '',
  };

  try {
    const apiRes = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (apiRes.ok) {
      const data = await apiRes.json().catch(() => ({}));
      if (data && data.ok) {
        return { delivered: true, provider: data.provider || 'vercel-api' };
      }
    }
  } catch {
    // Network error; feedback remains safely stored locally on the device
  }

  return { delivered: false, provider: 'offline-local-queued' };
}
