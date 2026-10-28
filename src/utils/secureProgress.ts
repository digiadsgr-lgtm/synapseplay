import { ACTIVITIES } from '../data/activitiesCatalog';
import type { ActivityId, ActivitySessionLog, AgeBandId } from '../types/domain';
import type { HomeMissionRecord, ParentCheckIn } from '../types/homePractice';
import type { ChildMicroProfile } from './childProfileLearningEngine';
import { parseChildCode } from './childCode';
import { b64urlToBytes, bytesToB64url, extractToken, packJson, unpackJson } from './linkCodec';

/**
 * Αποστολή προόδου γονιός → θεραπευτής ΧΩΡΙΣ cloud (βελτίωση 11).
 *
 *  1. Η συσκευή του θεραπευτή φτιάχνει μία φορά ζεύγος κλειδιών ECDH P-256.
 *     Το ιδιωτικό κλειδί μένει ΜΟΝΟ εκεί (IndexedDB). Το δημόσιο μπαίνει στο QR του προγράμματος.
 *  2. Ο γονιός πατά «Αποστολή»: η πρόοδος συμπιέζεται και κρυπτογραφείται (ECDH εφήμερο κλειδί
 *     + HKDF-SHA-256 + AES-256-GCM) με το δημόσιο κλειδί του θεραπευτή.
 *  3. Το αποτέλεσμα μπαίνει στο #fragment ενός συνδέσμου (δεν φτάνει ποτέ σε server) και ο γονιός
 *     το στέλνει με Viber / WhatsApp / email. Μόνο η συσκευή του θεραπευτή μπορεί να το ανοίξει.
 *
 * Κόστος: μηδέν. Server: κανένας. Αν ο σύνδεσμος πέσει σε λάθος χέρια, είναι μη αναγνώσιμος.
 */

import { PROGRESS_LINK_PREFIX, RECEIVE_PATH } from './linkConstants';
export { PROGRESS_LINK_PREFIX, RECEIVE_PATH };
/** Πάνω από αυτό το μέγεθος, στέλνεται ως αρχείο αντί για σύνδεσμος. */
export const MAX_LINK_TOKEN_CHARS = 30000;
const INFO = new Uint8Array(new TextEncoder().encode('synapseplay-progress-v1'));
const HISTORY_DAYS = 120;
const MAX_LOGS = 800;

export interface TherapistInboxKey {
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
  kid: string;
  createdAt: string;
}

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error('Η συσκευή δεν υποστηρίζει ασφαλή κρυπτογράφηση (χρειάζεται https).');
  return s;
}

export async function keyIdFor(x: string, y: string): Promise<string> {
  const digest = await subtle().digest('SHA-256', new TextEncoder().encode(`${x}.${y}`));
  return bytesToB64url(new Uint8Array(digest)).slice(0, 8);
}

export async function generateTherapistInboxKey(): Promise<TherapistInboxKey> {
  const pair = (await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  const publicJwk = await subtle().exportKey('jwk', pair.publicKey);
  const privateJwk = await subtle().exportKey('jwk', pair.privateKey);
  return {
    publicJwk: { kty: publicJwk.kty, crv: publicJwk.crv, x: publicJwk.x, y: publicJwk.y },
    privateJwk,
    kid: await keyIdFor(publicJwk.x!, publicJwk.y!),
    createdAt: new Date().toISOString(),
  };
}

async function aesKeyFrom(shared: ArrayBuffer, salt: Uint8Array<ArrayBuffer>, usage: KeyUsage): Promise<CryptoKey> {
  const hk = await subtle().importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: INFO },
    hk,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  );
}

/* ---------------------------- περιεχόμενο ---------------------------- */

const AGE_BANDS: AgeBandId[] = ['4-5', '5-6', '6-8', '8-10', '10-12'];
const ACT_BY_NUM = new Map(ACTIVITIES.map((a) => [parseInt(a.id, 10), a]));

/** Συμπαγής καταγραφή: [ts, dateKey, #παιχνιδιού, δευτ., γύροι, σύνολο, βοήθειες, παρορμ., λάθη, διάμεσος ms, μέτρηση, καθιστό, ηλικία, σενάριο] */
type CompactLog = [string, string, number, number, number, number, number, number, number, number, number, number, number, string];
type CompactMission = [string, string, string, string, string, string];
type CompactCheckIn = [string, string, number[]];

export interface ProgressPayload {
  v: 1;
  c: string; // κωδικός παιδιού
  n: string; // όνομα προφίλ
  e: string; // avatar
  g: number; // ηλικιακή ομάδα (δείκτης)
  s: string; // πότε στάλθηκε
  l: CompactLog[];
  h: CompactMission[];
  q: CompactCheckIn[];
}

export function buildProgressPayload(
  profile: ChildMicroProfile,
  logs: ActivitySessionLog[],
  now: Date = new Date()
): ProgressPayload {
  if (!profile.childCode) throw new Error('Το προφίλ δεν έχει κωδικό παιδιού.');
  const since = new Date(now.getTime() - HISTORY_DAYS * 24 * 3600 * 1000).toISOString();
  const mine = logs
    .filter((l) => l.childProfileId === profile.id && l.timestamp >= since)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, MAX_LOGS);
  return {
    v: 1,
    c: profile.childCode,
    n: profile.nickname.slice(0, 40),
    e: profile.avatarEmoji,
    g: Math.max(0, AGE_BANDS.indexOf(profile.ageBand)),
    s: now.toISOString(),
    l: mine.map((l) => [
      l.timestamp,
      l.dateKey,
      parseInt(l.activityId, 10),
      Math.round(l.durationSeconds || 0),
      l.completedRounds,
      l.totalRounds,
      l.hintsUsed || 0,
      l.impulsiveTapsAbsorbed || 0,
      l.errorsCount ?? -1,
      l.medianRoundMs ?? -1,
      l.measurement === 'self-report' ? 2 : l.measurement === 'measured' ? 1 : 0,
      l.seatedModeUsed ? 1 : 0,
      l.ageBand ? AGE_BANDS.indexOf(l.ageBand) : -1,
      l.adaptiveScenarioId ?? '',
    ]),
    h: (profile.homeMissions ?? [])
      .filter((m) => m.offeredAt >= since)
      .map((m) => [m.id, m.missionId, m.emoji, m.textEl.slice(0, 200), m.dateKey, m.status]),
    q: (profile.parentCheckIns ?? []).map((c) => [c.id, c.dateKey, [...c.answers]]),
  };
}

export interface DecodedProgress {
  childCode: string;
  nickname: string;
  avatarEmoji: string;
  ageBand: AgeBandId;
  sentAt: string;
  sessionLogs: ActivitySessionLog[];
  homeMissions: HomeMissionRecord[];
  parentCheckIns: ParentCheckIn[];
}

const str = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Ελέγχει το (μη αξιόπιστο) περιεχόμενο μετά την αποκρυπτογράφηση. */
export function decodeProgressPayload(raw: unknown): DecodedProgress {
  const p = raw as ProgressPayload;
  const bad = () => new Error('Η πρόοδος είναι κατεστραμμένη.');
  if (!p || p.v !== 1 || !str(p.c, 20) || !parseChildCode(p.c) || !str(p.n, 60) || !str(p.e, 16)) throw bad();
  if (!Array.isArray(p.l) || p.l.length > 5000 || !Array.isArray(p.h) || !Array.isArray(p.q)) throw bad();
  const sessionLogs: ActivitySessionLog[] = p.l.map((r) => {
    if (!Array.isArray(r) || r.length !== 14) throw bad();
    const [ts, dk, an, dur, cr, tr, hi, imp, err, med, meas, seat, age, scen] = r;
    const act = ACT_BY_NUM.get(an);
    if (!act || !str(ts, 40) || !str(dk, 10) || ![dur, cr, tr, hi, imp, err, med].every(num) || !str(scen, 60)) {
      throw bad();
    }
    const log: ActivitySessionLog = {
      timestamp: ts,
      dateKey: dk,
      activityId: act.id as ActivityId,
      activityTitleEl: act.titleEl,
      categoryId: act.categoryId,
      durationSeconds: dur,
      completedRounds: cr,
      totalRounds: tr,
      hintsUsed: hi,
      impulsiveTapsAbsorbed: imp,
      seatedModeUsed: seat === 1,
      source: 'home',
    };
    if (err >= 0) log.errorsCount = err;
    if (med >= 0) log.medianRoundMs = med;
    if (meas === 1) log.measurement = 'measured';
    if (meas === 2) log.measurement = 'self-report';
    if (num(age) && AGE_BANDS[age]) log.ageBand = AGE_BANDS[age];
    if (scen) log.adaptiveScenarioId = scen as ActivitySessionLog['adaptiveScenarioId'];
    return log;
  });
  const homeMissions: HomeMissionRecord[] = p.h.map((r) => {
    if (!Array.isArray(r) || r.length !== 6 || !r.every((x) => str(x, 200))) throw bad();
    const [id, missionId, emoji, textEl, dateKey, status] = r;
    if (!['accepted', 'done', 'not-today'].includes(status)) throw bad();
    return {
      id,
      missionId,
      emoji,
      textEl,
      dateKey,
      offeredAt: `${dateKey}T12:00:00.000Z`,
      status: status as HomeMissionRecord['status'],
    };
  });
  const parentCheckIns: ParentCheckIn[] = p.q.map((r) => {
    if (!Array.isArray(r) || r.length !== 3 || !str(r[0], 60) || !str(r[1], 10) || !Array.isArray(r[2])) throw bad();
    const a = r[2];
    if (a.length !== 5 || !a.every((x) => Number.isInteger(x) && x >= 1 && x <= 5)) throw bad();
    return { id: r[0], dateKey: r[1], answers: a as ParentCheckIn['answers'] };
  });
  return {
    childCode: parseChildCode(p.c)!.code,
    nickname: p.n,
    avatarEmoji: p.e,
    ageBand: AGE_BANDS[p.g] ?? '6-8',
    sentAt: str(p.s, 40) ? p.s : new Date().toISOString(),
    sessionLogs,
    homeMissions,
    parentCheckIns,
  };
}

/* ------------------------- κρυπτογράφηση ------------------------- */

/** Γονιός: κρυπτογραφεί για το δημόσιο κλειδί του θεραπευτή → token «p1.<kid>.<δεδομένα>». */
export async function encryptProgress(
  payload: ProgressPayload,
  therapistKey: { x: string; y: string; kid: string }
): Promise<string> {
  const s = subtle();
  const theirs = await s.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: therapistKey.x, y: therapistKey.y, ext: true },
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const eph = (await s.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const ephRaw = new Uint8Array(await s.exportKey('raw', eph.publicKey)); // 65 bytes
  const shared = await s.deriveBits({ name: 'ECDH', public: theirs }, eph.privateKey, 256);
  const key = await aesKeyFrom(shared, ephRaw, 'encrypt');
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plain = await packJson(payload);
  const kidBytes = new Uint8Array(new TextEncoder().encode(therapistKey.kid));
  const cipher = new Uint8Array(
    await s.encrypt({ name: 'AES-GCM', iv, additionalData: kidBytes }, key, plain)
  );
  const out = new Uint8Array(ephRaw.length + iv.length + cipher.length);
  out.set(ephRaw, 0);
  out.set(iv, ephRaw.length);
  out.set(cipher, ephRaw.length + iv.length);
  return `${PROGRESS_LINK_PREFIX}${therapistKey.kid}.${bytesToB64url(out)}`;
}

export class WrongInboxError extends Error {}

/** Θεραπευτής: ανοίγει token/σύνδεσμο με το ιδιωτικό κλειδί της συσκευής του. */
export async function decryptProgress(input: string, inbox: TherapistInboxKey): Promise<DecodedProgress> {
  const token = extractToken(input, PROGRESS_LINK_PREFIX);
  if (!token) throw new Error('Δεν βρέθηκε πρόοδος στον σύνδεσμο.');
  if (token.length > 3_000_000) throw new Error('Η πρόοδος είναι πολύ μεγάλη.');
  const [, kid, data] = token.split('.');
  if (!kid || !data) throw new Error('Ο σύνδεσμος προόδου είναι κομμένος. Ζητήστε από τον γονιό να τον ξαναστείλει.');
  if (kid !== inbox.kid) {
    throw new WrongInboxError(
      'Αυτή η πρόοδος κρυπτογραφήθηκε για άλλη συσκευή θεραπευτή. Ανοίξτε τη στη συσκευή που έφτιαξε το QR του προγράμματος.'
    );
  }
  const s = subtle();
  let decoded: unknown;
  try {
    const bytes = b64urlToBytes(data);
    const ephRaw = bytes.subarray(0, 65);
    const iv = bytes.subarray(65, 77);
    const cipher = bytes.subarray(77);
    const eph = await s.importKey('raw', ephRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const mine = await s.importKey('jwk', inbox.privateJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, [
      'deriveBits',
    ]);
    const shared = await s.deriveBits({ name: 'ECDH', public: eph }, mine, 256);
    const key = await aesKeyFrom(shared, ephRaw, 'decrypt');
    const plain = new Uint8Array(
      await s.decrypt({ name: 'AES-GCM', iv, additionalData: new Uint8Array(new TextEncoder().encode(kid)) }, key, cipher)
    );
    decoded = await unpackJson(plain);
  } catch {
    throw new Error('Ο σύνδεσμος προόδου είναι κομμένος ή αλλοιωμένος. Ζητήστε από τον γονιό να τον ξαναστείλει.');
  }
  return decodeProgressPayload(decoded);
}

export function progressLink(token: string, origin: string): string {
  return `${origin}${RECEIVE_PATH}#${token}`;
}
