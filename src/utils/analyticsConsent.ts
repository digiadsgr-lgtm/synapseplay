import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

const GTM_CONTAINER_ID = 'GTM-54S94WKX';
const GTM_SCRIPT_ID = 'synapseplay-gtm-script';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

let gtmLoaded = false;

/**
 * Loads Google Tag Manager AND Vercel Analytics / Speed Insights ONLY after
 * the user explicitly opts in to analytics in the GDPR banner.
 * Safe to call multiple times (idempotent).
 */
export function loadGtmAfterConsent(): void {
  if (gtmLoaded) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Avoid running in automated test environments unless explicitly testing DOM injection
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    gtmLoaded = true;
    return;
  }

  if (document.getElementById(GTM_SCRIPT_ID)) {
    gtmLoaded = true;
    return;
  }

  gtmLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_CONTAINER_ID)}`;

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  try {
    inject();
    injectSpeedInsights();
  } catch {
    // Ignore analytics injection errors in restricted environments
  }
}

export function hasAnalyticsConsent(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { analytics?: unknown; mode?: unknown };
    return parsed.analytics === true || parsed.mode === 'necessary-and-analytics';
  } catch {
    return false;
  }
}
