import type { AppSettings, LicenseTier } from '../types/domain';

/**
 * Global configuration flag for SynapsePlay monetization & licensing.
 * CURRENT STATE: DEVELOPMENT / TESTING (100% FREE & UNLOCKED)
 * Set `ENABLE_PAYWALL = true` for production release to enforce plan tiers by default.
 */
export const ENABLE_PAYWALL = false;

export const FAMILY_PLAN_MAX_PROFILES = 2;

export const FAMILY_PLAN_LIMIT_NOTICE_EL =
  'Το οικογενειακό πλάνο περιλαμβάνει έως 2 προφίλ παιδιών. Για επιπλέον προφίλ απαιτείται αναβάθμιση.';

export const DEV_UNLOCKED_STATUS_LABEL_EL = 'Δοκιμαστική Έκδοση - Όλα Ξεκλείδωτα';
export const FAMILY_PLAN_STATUS_LABEL_EL = 'Οικογενειακό Πλάνο (Έως 2 Προφίλ Παιδιών)';
export const B2B_PLAN_STATUS_LABEL_EL =
  'Επαγγελματική Άδεια B2B / Θεραπευτή (Απεριόριστα Προφίλ)';

/**
 * External Stripe Hosted Checkout URLs (No embedded payment SDKs inside the app).
 */
export const STRIPE_CHECKOUT_URLS = {
  familyPlan:
    (import.meta.env?.VITE_STRIPE_FAMILY_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/synapseplay-family-plan',
  b2bTherapistPlan:
    (import.meta.env?.VITE_STRIPE_B2B_CHECKOUT_URL as string | undefined) ||
    'https://buy.stripe.com/synapseplay-b2b-therapist',
};

export interface EffectiveLicenseState {
  effectiveTier: LicenseTier;
  statusLabelEl: string;
  maxProfiles: number | null; // null = unlimited
  isPaywallEnforced: boolean;
  isFamilyPlanActive: boolean;
  isB2BPlanActive: boolean;
  isDevUnlocked: boolean;
  showTherapistQuickSwitcher: boolean;
}

/**
 * Resolves the effective licensing state based on `ENABLE_PAYWALL` and any locally activated license tier.
 */
export function resolveEffectiveLicenseState(
  settings?: Pick<AppSettings, 'licenseTier' | 'licenseKey'>,
  enablePaywallFlag: boolean = ENABLE_PAYWALL
): EffectiveLicenseState {
  const configuredTier = settings?.licenseTier ?? 'dev-unlocked';

  // Explicit Family Plan activation (via License Key or production default when ENABLE_PAYWALL = true)
  if (configuredTier === 'family' || (enablePaywallFlag && configuredTier === 'dev-unlocked')) {
    return {
      effectiveTier: 'family',
      statusLabelEl: FAMILY_PLAN_STATUS_LABEL_EL,
      maxProfiles: FAMILY_PLAN_MAX_PROFILES,
      isPaywallEnforced: true,
      isFamilyPlanActive: true,
      isB2BPlanActive: false,
      isDevUnlocked: false,
      showTherapistQuickSwitcher: false,
    };
  }

  // Explicit B2B / Therapist License activation
  if (configuredTier === 'b2b') {
    return {
      effectiveTier: 'b2b',
      statusLabelEl: B2B_PLAN_STATUS_LABEL_EL,
      maxProfiles: null,
      isPaywallEnforced: true,
      isFamilyPlanActive: false,
      isB2BPlanActive: true,
      isDevUnlocked: false,
      showTherapistQuickSwitcher: true,
    };
  }

  // Default Development / Testing Mode (ENABLE_PAYWALL = false)
  return {
    effectiveTier: 'dev-unlocked',
    statusLabelEl: DEV_UNLOCKED_STATUS_LABEL_EL,
    maxProfiles: null,
    isPaywallEnforced: false,
    isFamilyPlanActive: false,
    isB2BPlanActive: false,
    isDevUnlocked: true,
    showTherapistQuickSwitcher: false,
  };
}

export interface ProfileCreationPermission {
  allowed: boolean;
  maxProfiles: number | null;
  noticeEl: string | null;
  upgradeCheckoutUrl: string;
}

/**
 * Checks whether a new child profile can be created under the active license state.
 * Enforces the 2-profile limit ONLY when Family mode is active/simulated.
 */
export function checkProfileCreationPermission(
  currentProfileCount: number,
  settings?: Pick<AppSettings, 'licenseTier' | 'licenseKey'>,
  enablePaywallFlag: boolean = ENABLE_PAYWALL
): ProfileCreationPermission {
  const state = resolveEffectiveLicenseState(settings, enablePaywallFlag);

  if (state.maxProfiles !== null && currentProfileCount >= state.maxProfiles) {
    return {
      allowed: false,
      maxProfiles: state.maxProfiles,
      noticeEl: FAMILY_PLAN_LIMIT_NOTICE_EL,
      upgradeCheckoutUrl: STRIPE_CHECKOUT_URLS.b2bTherapistPlan,
    };
  }

  return {
    allowed: true,
    maxProfiles: state.maxProfiles,
    noticeEl: null,
    upgradeCheckoutUrl: STRIPE_CHECKOUT_URLS.b2bTherapistPlan,
  };
}

export interface LicenseKeyValidationResult {
  valid: boolean;
  tier: LicenseTier | null;
  normalizedKey: string;
  messageEl: string;
}

/**
 * Validates a local License Key ("Κωδικός Ενεργοποίησης") to activate Family, B2B, or Dev mode locally.
 */
export function validateAndParseLicenseKey(rawKey: string): LicenseKeyValidationResult {
  const clean = rawKey.trim().toUpperCase();

  if (!clean) {
    return {
      valid: false,
      tier: null,
      normalizedKey: '',
      messageEl: 'Παρακαλώ εισάγετε έναν κωδικό ενεργοποίησης.',
    };
  }

  if (
    clean.startsWith('FAMILY') ||
    clean.startsWith('FAM-') ||
    clean.startsWith('SYNAPSE-FAMILY')
  ) {
    return {
      valid: true,
      tier: 'family',
      normalizedKey: clean,
      messageEl:
        'Ενεργοποιήθηκε επιτυχώς το Οικογενειακό Πλάνο (Family Plan — έως 2 προφίλ παιδιών).',
    };
  }

  if (
    clean.startsWith('B2B') ||
    clean.startsWith('THERAPIST') ||
    clean.startsWith('CLINIC') ||
    clean.startsWith('SYNAPSE-B2B') ||
    clean.startsWith('PRO-')
  ) {
    return {
      valid: true,
      tier: 'b2b',
      normalizedKey: clean,
      messageEl:
        'Ενεργοποιήθηκε επιτυχώς η Επαγγελματική Άδεια B2B / Θεραπευτή (Απεριόριστα προφίλ & Γρήγορη Εναλλαγή Παιδιού).',
    };
  }

  if (clean === 'DEV' || clean === 'FREE' || clean === 'RESET' || clean === 'UNLOCK') {
    return {
      valid: true,
      tier: 'dev-unlocked',
      normalizedKey: '',
      messageEl: 'Επαναφορά σε Δοκιμαστική Έκδοση - Όλα Ξεκλείδωτα.',
    };
  }

  return {
    valid: false,
    tier: null,
    normalizedKey: clean,
    messageEl:
      'Μη έγκυρος κωδικός ενεργοποίησης. Χρησιμοποιήστε κωδικό FAMILY-... (Οικογενειακό) ή B2B-... (Θεραπευτές/Κέντρα).',
  };
}
