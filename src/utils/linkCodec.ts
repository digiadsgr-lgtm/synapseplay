/**
 * Κωδικοποίηση δεδομένων για συνδέσμους: JSON → (deflate) → base64url.
 * Τα δεδομένα μπαίνουν ΜΟΝΟ στο #fragment του συνδέσμου, που ο browser δεν στέλνει ποτέ σε server.
 */

export function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error('bad base64url');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: GenericTransformStream): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

const canCompress = (): boolean =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** 1ο byte: 1 = deflate-raw, 0 = χωρίς συμπίεση (παλιοί browsers). */
export async function packJson(value: unknown): Promise<Uint8Array<ArrayBuffer>> {
  const raw = new Uint8Array(new TextEncoder().encode(JSON.stringify(value)));
  if (canCompress()) {
    try {
      const z = await pipe(raw, new CompressionStream('deflate-raw' as CompressionFormat));
      const out = new Uint8Array(z.length + 1);
      out[0] = 1;
      out.set(z, 1);
      return out;
    } catch {
      // πέφτουμε σε μη συμπιεσμένο
    }
  }
  const out = new Uint8Array(raw.length + 1);
  out[0] = 0;
  out.set(raw, 1);
  return out;
}

const MAX_UNPACKED_BYTES = 4 * 1024 * 1024;

export async function unpackJson(bytes: Uint8Array<ArrayBuffer>): Promise<unknown> {
  if (bytes.length < 2) throw new Error('empty');
  let body = bytes.subarray(1);
  if (bytes[0] === 1) {
    if (!canCompress()) throw new Error('Ο browser δεν υποστηρίζει αποσυμπίεση. Ενημερώστε τον browser.');
    body = await pipe(body, new DecompressionStream('deflate-raw' as CompressionFormat));
  } else if (bytes[0] !== 0) {
    throw new Error('unknown format');
  }
  if (body.length > MAX_UNPACKED_BYTES) throw new Error('too large');
  return JSON.parse(new TextDecoder().decode(body));
}

/** Παίρνει το «token» από πλήρη σύνδεσμο, από #fragment ή σκέτο. */
export function extractToken(input: string, prefix: string): string | null {
  const s = (input ?? '').trim();
  const at = s.indexOf(prefix);
  if (at < 0) return null;
  const token = s.slice(at).split(/[\s"'<>]/)[0];
  return token.length > prefix.length ? token : null;
}
