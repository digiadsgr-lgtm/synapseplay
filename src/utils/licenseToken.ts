import { LICENSE_PUBLIC_KEY_JWK } from '../config/licensePublicKey';

/** A licence that passed signature verification on this device. */
export interface VerifiedLicense {
  plan: 'family' | 'extra' | 'b2b';
  /** Expiry, unix seconds (end of paid period + grace). */
  exp: number;
  /** Issued at, unix seconds. */
  iat: number;
  /** Quantity (number of extra child profiles for 'extra'). */
  n: number;
  ref?: string;
  /** Κωδικός παιδιού της αγοράς (family/extra). */
  childCode?: string;
  token: string;
}

export type LicenseVerifyResult =
  | { ok: true; license: VerifiedLicense }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'no-public-key' | 'no-crypto' };

const PLANS = new Set(['family', 'extra', 'b2b']);

export function isSignedLicenseToken(value: string): boolean {
  return /^SP1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.trim());
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Verifies a licence token OFFLINE with the embedded public key (WebCrypto ECDSA P-256/SHA-256).
 * Does NOT check expiry — the licensing engine decides what an expired licence means.
 */
export async function verifyLicenseToken(
  token: string,
  publicJwk: JsonWebKey | null = LICENSE_PUBLIC_KEY_JWK
): Promise<LicenseVerifyResult> {
  const clean = token.trim();
  if (!isSignedLicenseToken(clean)) return { ok: false, reason: 'malformed' };
  if (!publicJwk) return { ok: false, reason: 'no-public-key' };
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return { ok: false, reason: 'no-crypto' };

  const [, body, sig] = clean.split('.');
  try {
    const key = await subtle.importKey(
      'jwk',
      publicJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    const valid = await subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(`SP1.${body}`)
    );
    if (!valid) return { ok: false, reason: 'bad-signature' };

    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as {
      v?: number;
      p?: string;
      e?: number;
      i?: number;
      n?: number;
      r?: string;
      c?: string;
    };
    if (payload.v !== 1 || !payload.p || !PLANS.has(payload.p) || typeof payload.e !== 'number') {
      return { ok: false, reason: 'malformed' };
    }
    return {
      ok: true,
      license: {
        plan: payload.p as VerifiedLicense['plan'],
        exp: payload.e,
        iat: typeof payload.i === 'number' ? payload.i : 0,
        n: typeof payload.n === 'number' && payload.n > 0 ? Math.floor(payload.n) : 1,
        ref: payload.r,
        childCode: typeof payload.c === 'string' ? payload.c : undefined,
        token: clean,
      },
    };
  } catch {
    return { ok: false, reason: 'bad-signature' };
  }
}
