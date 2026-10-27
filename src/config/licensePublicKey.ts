// PUBLIC key used to verify licence codes offline.
// Replace by running ONCE:  node scripts/generate-license-keys.mjs
// (it overwrites this file and prints the private key for Vercel → LICENSE_SIGNING_KEY).
// While this is null, signed licence codes cannot be verified — fine as long as
// VITE_ENABLE_MONETIZATION is not 'true' (free beta: everything unlocked).
export const LICENSE_PUBLIC_KEY_JWK: JsonWebKey | null = null;
