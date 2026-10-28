import { describe, expect, it } from 'vitest';
import { verifyLicenseToken } from '../utils/licenseToken';
import {
  TRIAL_DAYS,
  checkProfileCreationPermission,
  resolveEffectiveLicenseState,
  validateAndParseLicenseKey,
} from '../utils/licensingEngine';

const b64url = (bytes: Uint8Array | string) => {
  const bin = typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** Same format as api/_lib/license.js: SP1.<payload>.<ECDSA P-256 SHA-256 raw signature> */
async function makeKeysAndSigner() {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const sign = async (payload: object) => {
    const body = b64url(JSON.stringify(payload));
    const sig = new Uint8Array(
      await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        pair.privateKey,
        new TextEncoder().encode(`SP1.${body}`)
      )
    );
    return `SP1.${body}.${b64url(sig)}`;
  };
  return { jwk, sign };
}

const DAY = 24 * 3600;
const now = Math.floor(Date.now() / 1000);

describe('Signed licence tokens (offline verification)', () => {
  it('accepts a correctly signed code and rejects tampered / foreign ones', async () => {
    const { jwk, sign } = await makeKeysAndSigner();
    const token = await sign({ v: 1, p: 'family', e: now + 30 * DAY, i: now, n: 1 });

    const ok = await verifyLicenseToken(token, jwk);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.license.plan).toBe('family');

    // change family → b2b without re-signing
    const [, , sig] = token.split('.');
    const forged = `SP1.${b64url(JSON.stringify({ v: 1, p: 'b2b', e: now + 30 * DAY, i: now, n: 1 }))}.${sig}`;
    expect((await verifyLicenseToken(forged, jwk)).ok).toBe(false);

    // signed with another key
    const other = await makeKeysAndSigner();
    expect((await verifyLicenseToken(await other.sign({ v: 1, p: 'b2b', e: now + DAY }), jwk)).ok).toBe(false);

    expect((await verifyLicenseToken('FAMILY-2026', jwk)).ok).toBe(false);
    expect(await verifyLicenseToken(token, null)).toEqual({ ok: false, reason: 'no-public-key' });
  });
});

describe('Licensing rules with payments ON', () => {
  const nowMs = Date.now();
  const startedDaysAgo = (d: number) => new Date(nowMs - d * DAY * 1000).toISOString();

  it(`trial: everything open for ${TRIAL_DAYS} days, then games locked`, () => {
    const trial = resolveEffectiveLicenseState({ trialStartedAt: startedDaysAgo(3) }, true, { nowMs });
    expect(trial.effectiveTier).toBe('trial');
    expect(trial.isAccessLocked).toBe(false);
    expect(trial.canUseProTools).toBe(true);
    expect(trial.trialDaysLeft).toBe(11);

    const over = resolveEffectiveLicenseState({ trialStartedAt: startedDaysAgo(15) }, true, { nowMs });
    expect(over.effectiveTier).toBe('expired');
    expect(over.isAccessLocked).toBe(true);
    expect(checkProfileCreationPermission(1, { trialStartedAt: startedDaysAgo(15) }, true, { nowMs }).allowed).toBe(false);
  });

  it('family: 1 profile (+ extra-child licences), no pro tools; b2b: unlimited + tools', () => {
    const settings = { trialStartedAt: startedDaysAgo(40) };
    const family = resolveEffectiveLicenseState(settings, true, {
      nowMs,
      verifiedLicenses: [{ plan: 'family', exp: now + 10 * DAY }],
    });
    expect(family.maxProfiles).toBe(1);
    expect(family.isAccessLocked).toBe(false);
    expect(family.canUseProTools).toBe(false);

    const familyPlus = resolveEffectiveLicenseState(settings, true, {
      nowMs,
      verifiedLicenses: [
        { plan: 'family', exp: now + 10 * DAY },
        { plan: 'extra', exp: now + 10 * DAY, n: 2 },
      ],
    });
    expect(familyPlus.maxProfiles).toBe(3);

    const b2b = resolveEffectiveLicenseState(settings, true, {
      nowMs,
      verifiedLicenses: [{ plan: 'b2b', exp: now + 300 * DAY }],
    });
    expect(b2b.maxProfiles).toBeNull();
    expect(b2b.canUseProTools).toBe(true);
    expect(b2b.showTherapistQuickSwitcher).toBe(true);
  });

  it('expired licence (cancelled subscription) → back to locked after the trial', () => {
    const st = resolveEffectiveLicenseState({ trialStartedAt: startedDaysAgo(60) }, true, {
      nowMs,
      verifiedLicenses: [{ plan: 'family', exp: now - DAY }],
    });
    expect(st.isAccessLocked).toBe(true);
  });

  it('demo codes (FAMILY-…, B2B-…, DEV) do NOT work with payments ON', () => {
    expect(validateAndParseLicenseKey('B2B-CLINIC-2026', true).valid).toBe(false);
    expect(validateAndParseLicenseKey('DEV', true).valid).toBe(false);
    // …but still work in the free beta (payments OFF)
    expect(validateAndParseLicenseKey('B2B-CLINIC-2026', false).valid).toBe(true);
  });

  it('payments OFF keeps the free beta fully unlocked', () => {
    const beta = resolveEffectiveLicenseState({ licenseTier: 'dev-unlocked' }, false);
    expect(beta.isAccessLocked).toBe(false);
    expect(beta.maxProfiles).toBeNull();
    expect(beta.canUseProTools).toBe(true);
  });
});
