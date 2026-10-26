import type { ClinicalFeedbackEntry } from '../types/domain';

export interface FeedbackRelayResult {
  delivered: boolean;
  channel: 'serverless-api' | 'local-only';
}

/**
 * Sends feedback ONLY via the server-side /api/feedback function.
 * No direct third-party relay from the browser → no email address in the bundle.
 */
export async function sendFeedbackSilentlyToOwner(
  entry: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>,
  fullReportText?: string
): Promise<FeedbackRelayResult> {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
    return { delivered: true, channel: 'serverless-api' };
  }

  try {
    const apiResp = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, fullReportText }),
    });
    if (apiResp.ok) {
      const data = (await apiResp.json()) as { ok?: boolean };
      if (data.ok) return { delivered: true, channel: 'serverless-api' };
    }
  } catch {
    // Offline: entry is already saved in local IndexedDB
  }

  return { delivered: false, channel: 'local-only' };
}
