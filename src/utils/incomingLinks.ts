import { PLAN_PATH, PLAN_PREFIX, PROGRESS_LINK_PREFIX, RECEIVE_PATH } from './linkConstants';

/**
 * Σύνδεσμοι που ανοίγουν την εφαρμογή με δεδομένα στο #fragment:
 *   /plan#c1.…     πρόγραμμα από τον θεραπευτή (για τον γονιό)
 *   /receive#p1.…  κρυπτογραφημένη πρόοδος από τον γονιό (για τον θεραπευτή)
 * Το fragment φυλάγεται στη συνεδρία της καρτέλας και ΣΒΗΝΕΤΑΙ αμέσως από τη διεύθυνση,
 * ΠΡΙΝ φορτώσουν στατιστικά, ώστε να μη μείνει στο ιστορικό ή σε αναφορές.
 */

export type IncomingKind = 'plan' | 'progress';

const KEYS: Record<IncomingKind, string> = {
  plan: 'synapseplay_incoming_plan',
  progress: 'synapseplay_incoming_progress',
};

export function captureIncomingLink(loc: Location = window.location): IncomingKind | null {
  try {
    const hash = decodeURIComponent((loc.hash || '').replace(/^#/, ''));
    let kind: IncomingKind | null = null;
    if (loc.pathname === PLAN_PATH && hash.startsWith(PLAN_PREFIX)) kind = 'plan';
    if (loc.pathname === RECEIVE_PATH && hash.startsWith(PROGRESS_LINK_PREFIX)) kind = 'progress';
    if (loc.hash) window.history.replaceState(window.history.state, '', loc.pathname);
    if (!kind) return null;
    window.sessionStorage.setItem(KEYS[kind], hash);
    return kind;
  } catch {
    return null;
  }
}

export function peekIncoming(kind: IncomingKind): string | null {
  try {
    return window.sessionStorage.getItem(KEYS[kind]);
  } catch {
    return null;
  }
}

export function clearIncoming(kind: IncomingKind): void {
  try {
    window.sessionStorage.removeItem(KEYS[kind]);
  } catch {
    // αγνοούμε
  }
}
