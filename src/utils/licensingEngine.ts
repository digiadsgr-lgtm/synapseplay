import type { AppSettings, LicenseTier } from '../types/domain';
import {
  ENABLE_PAYWALL as CONFIG_ENABLE_PAYWALL,
  STRIPE_CHECKOUT_URLS as CONFIG_STRIPE_CHECKOUT_URLS,
} from '../config/monetization.config';

/**
 * Global configuration flag for SynapsePlay monetization & licensing.
 * CURRENT STATE: DEVELOPMENT / TESTING (100% FREE & UNLOCKED)
 * Set `ENABLE_PAYWALL = true` in `src/config/monetization.config.ts` for production release.
 */
export const ENABLE_PAYWALL = CONFIG_ENABLE_PAYWALL;

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
export const STRIPE_CHECKOUT_URLS = CONFIG_STRIPE_CHECKOUT_URLS;

export const TRIAL_DAYS = 14;
export const TRIAL_STATUS_LABEL_EL = 'Δωρεάν Δοκιμή 14 Ημερών (Όλα Ανοιχτά)';
export const EXPIRED_STATUS_LABEL_EL = 'Η Δοκιμαστική Περίοδος Ολοκληρώθηκε';

/** Minimal shape of a verified licence (see utils/licenseToken.ts). */
export interface ActiveLicenseInput {
  plan: 'family' | 'extra' | 'b2b';
  exp: number; // unix seconds
  n?: number;
}

export interface EffectiveLicenseState {
  effectiveTier: LicenseTier;
  statusLabelEl: string;
  maxProfiles: number | null; // null = unlimited
  isPaywallEnforced: boolean;
  isFamilyPlanActive: boolean;
  isB2BPlanActive: boolean;
  isDevUnlocked: boolean;
  showTherapistQuickSwitcher: boolean;
  /** Free 14-day trial running (payments enabled, no paid licence). */
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  /** Trial over and no valid licence → games are locked (data is kept). */
  isAccessLocked: boolean;
  /** PDF/CSV reports, backup/restore: B2B (and trial / free beta). */
  canUseProTools: boolean;
  /** Latest expiry of the active paid licence (unix s), if any. */
  licenseExpiresAt: number | null;
}

export interface LicenseResolveContext {
  /** Licences whose signature was verified on this device. */
  verifiedLicenses?: ActiveLicenseInput[];
  nowMs?: number;
}

const BASE_STATE = {
  isTrialActive: false,
  trialDaysLeft: null,
  isAccessLocked: false,
  licenseExpiresAt: null,
} as const;

/**
 * Resolves what this device may use.
 *
 * Payments OFF (free beta, VITE_ENABLE_MONETIZATION !== 'true'): unchanged behaviour —
 *   everything unlocked; the local test codes (FAMILY-…, B2B-…) only simulate limits.
 * Payments ON:
 *   valid B2B licence      → unlimited profiles, therapist switcher, pro tools
 *   valid Family licence   → 2 profiles (+1 per valid "extra child" licence), no pro tools
 *   no licence, ≤14 days   → free trial: everything open
 *   no licence, >14 days   → games locked (profiles/history kept, Parent Area works)
 */
export function resolveEffectiveLicenseState(
  settings?: Pick<AppSettings, 'licenseTier' | 'licenseKey' | 'trialStartedAt'>,
  enablePaywallFlag: boolean = ENABLE_PAYWALL,
  ctx: LicenseResolveContext = {}
): EffectiveLicenseState {
  if (enablePaywallFlag) {
    const nowSec = (ctx.nowMs ?? Date.now()) / 1000;
    const active = (ctx.verifiedLicenses ?? []).filter((l) => l.exp > nowSec);
    const latest = (plan: ActiveLicenseInput['plan']) =>
      active.filter((l) => l.plan === plan).reduce<number | null>((m, l) => (m === null || l.exp > m ? l.exp : m), null);

    const b2bExp = latest('b2b');
    if (b2bExp !== null) {
      return {
        ...BASE_STATE,
        effectiveTier: 'b2b',
        statusLabelEl: B2B_PLAN_STATUS_LABEL_EL,
        maxProfiles: null,
        isPaywallEnforced: true,
        isFamilyPlanActive: false,
        isB2BPlanActive: true,
        isDevUnlocked: false,
        showTherapistQuickSwitcher: true,
        canUseProTools: true,
        licenseExpiresAt: b2bExp,
      };
    }

    const familyExp = latest('family');
    if (familyExp !== null) {
      const extra = active.filter((l) => l.plan === 'extra').reduce((sum, l) => sum + (l.n ?? 1), 0);
      const maxProfiles = FAMILY_PLAN_MAX_PROFILES + extra;
      return {
        ...BASE_STATE,
        effectiveTier: 'family',
        statusLabelEl:
          extra > 0
            ? `Οικογενειακό Πλάνο (Έως ${maxProfiles} Προφίλ Παιδιών)`
            : FAMILY_PLAN_STATUS_LABEL_EL,
        maxProfiles,
        isPaywallEnforced: true,
        isFamilyPlanActive: true,
        isB2BPlanActive: false,
        isDevUnlocked: false,
        showTherapistQuickSwitcher: false,
        canUseProTools: false,
        licenseExpiresAt: familyExp,
      };
    }

    const startedMs = settings?.trialStartedAt ? Date.parse(settings.trialStartedAt) : NaN;
    const nowMs = ctx.nowMs ?? Date.now();
    const trialEndMs = (Number.isNaN(startedMs) ? nowMs : startedMs) + TRIAL_DAYS * 24 * 3600 * 1000;
    if (nowMs < trialEndMs) {
      return {
        ...BASE_STATE,
        effectiveTier: 'trial',
        statusLabelEl: TRIAL_STATUS_LABEL_EL,
        maxProfiles: null,
        isPaywallEnforced: true,
        isFamilyPlanActive: false,
        isB2BPlanActive: false,
        isDevUnlocked: false,
        showTherapistQuickSwitcher: true,
        canUseProTools: true,
        isTrialActive: true,
        trialDaysLeft: Math.max(1, Math.ceil((trialEndMs - nowMs) / (24 * 3600 * 1000))),
      };
    }

    return {
      ...BASE_STATE,
      effectiveTier: 'expired',
      statusLabelEl: EXPIRED_STATUS_LABEL_EL,
      maxProfiles: 1,
      isPaywallEnforced: true,
      isFamilyPlanActive: false,
      isB2BPlanActive: false,
      isDevUnlocked: false,
      showTherapistQuickSwitcher: false,
      canUseProTools: false,
      isAccessLocked: true,
      trialDaysLeft: 0,
    };
  }

  // ---------------- Payments OFF (free beta) — unchanged behaviour ----------------
  const configuredTier = settings?.licenseTier ?? 'dev-unlocked';

  if (configuredTier === 'family') {
    return {
      ...BASE_STATE,
      effectiveTier: 'family',
      statusLabelEl: FAMILY_PLAN_STATUS_LABEL_EL,
      maxProfiles: FAMILY_PLAN_MAX_PROFILES,
      isPaywallEnforced: true,
      isFamilyPlanActive: true,
      isB2BPlanActive: false,
      isDevUnlocked: false,
      showTherapistQuickSwitcher: false,
      canUseProTools: false,
    };
  }

  if (configuredTier === 'b2b') {
    return {
      ...BASE_STATE,
      effectiveTier: 'b2b',
      statusLabelEl: B2B_PLAN_STATUS_LABEL_EL,
      maxProfiles: null,
      isPaywallEnforced: true,
      isFamilyPlanActive: false,
      isB2BPlanActive: true,
      isDevUnlocked: false,
      showTherapistQuickSwitcher: true,
      canUseProTools: true,
    };
  }

  return {
    ...BASE_STATE,
    effectiveTier: 'dev-unlocked',
    statusLabelEl: DEV_UNLOCKED_STATUS_LABEL_EL,
    maxProfiles: null,
    isPaywallEnforced: false,
    isFamilyPlanActive: false,
    isB2BPlanActive: false,
    isDevUnlocked: true,
    showTherapistQuickSwitcher: false,
    canUseProTools: true,
  };
}

export interface ProfileCreationPermission {
  allowed: boolean;
  maxProfiles: number | null;
  noticeEl: string | null;
  upgradeCheckoutUrl: string;
  extraProfileCheckoutUrl: string;
}

/**
 * Checks whether a new child profile can be created under the active license state.
 * Enforces the 2-profile limit ONLY when Family mode is active/simulated.
 */
export function checkProfileCreationPermission(
  currentProfileCount: number,
  settings?: Pick<AppSettings, 'licenseTier' | 'licenseKey' | 'trialStartedAt'>,
  enablePaywallFlag: boolean = ENABLE_PAYWALL,
  ctx: LicenseResolveContext = {}
): ProfileCreationPermission {
  const state = resolveEffectiveLicenseState(settings, enablePaywallFlag, ctx);

  if (state.maxProfiles !== null && currentProfileCount >= state.maxProfiles) {
    return {
      allowed: false,
      maxProfiles: state.maxProfiles,
      noticeEl: FAMILY_PLAN_LIMIT_NOTICE_EL,
      upgradeCheckoutUrl: STRIPE_CHECKOUT_URLS.extraChildProfile,
      extraProfileCheckoutUrl: STRIPE_CHECKOUT_URLS.extraChildProfile,
    };
  }

  return {
    allowed: true,
    maxProfiles: state.maxProfiles,
    noticeEl: null,
    upgradeCheckoutUrl: STRIPE_CHECKOUT_URLS.extraChildProfile,
    extraProfileCheckoutUrl: STRIPE_CHECKOUT_URLS.extraChildProfile,
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
export function validateAndParseLicenseKey(
  rawKey: string,
  enablePaywallFlag: boolean = ENABLE_PAYWALL
): LicenseKeyValidationResult {
  const clean = rawKey.trim().toUpperCase();

  // With payments ON only signed codes (SP1.…, verified in AppContext) are accepted.
  // The demo prefixes below (FAMILY-…, B2B-…, DEV) work ONLY during the free beta.
  if (enablePaywallFlag) {
    return {
      valid: false,
      tier: null,
      normalizedKey: '',
      messageEl:
        'Μη έγκυρος κωδικός. Χρησιμοποιήστε τον κωδικό (SP1.…) ή τον σύνδεσμο ενεργοποίησης από το email της συνδρομής σας.',
    };
  }

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
