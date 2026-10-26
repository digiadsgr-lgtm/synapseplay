import Dexie, { type Table } from 'dexie';
import type {
  ActivitySessionLog,
  AppSettings,
  ChildMicroProfile,
  ClinicalFeedbackEntry,
  DailyUsageRecord,
} from '../types/domain';
import { createDefaultChildProfile } from '../utils/childProfileLearningEngine';

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  activeChildProfileId: 'child-default',
  ageBand: '6-8',
  sessionLimitMinutes: 20,
  warningWindowMinutes: 2,
  soundEnabled: true,
  voiceEnabled: true,
  reducedMotion: false,
  seatedModeDefault: false,
  licenseTier: 'dev-unlocked',
  licenseKey: '',
};

export class SynapsePlayDatabase extends Dexie {
  sessionLogs!: Table<ActivitySessionLog, number>;
  settings!: Table<AppSettings, string>;
  dailyUsage!: Table<DailyUsageRecord, string>;
  childProfiles!: Table<ChildMicroProfile, string>;
  feedbackEntries!: Table<ClinicalFeedbackEntry, number>;

  constructor() {
    super('SynapsePlayLocalDB');
    this.version(1).stores({
      sessionLogs: '++id, timestamp, dateKey, activityId, categoryId',
      settings: 'id',
      dailyUsage: 'dateKey',
    });
    this.version(2).stores({
      sessionLogs: '++id, timestamp, dateKey, activityId, categoryId, childProfileId',
      settings: 'id',
      dailyUsage: 'dateKey',
      childProfiles: 'id, createdAt',
    });
    this.version(3).stores({
      sessionLogs: '++id, timestamp, dateKey, activityId, categoryId, childProfileId',
      settings: 'id',
      dailyUsage: 'dateKey',
      childProfiles: 'id, createdAt',
      feedbackEntries: '++id, timestamp, dateKey, reviewerRole, targetScope',
    });
  }
}

export const db = new SynapsePlayDatabase();

// Fallback in-memory state when IndexedDB is unavailable (e.g. unit test environment without fake-indexeddb)
let memorySettings: AppSettings = { ...DEFAULT_SETTINGS };
let memoryLogs: ActivitySessionLog[] = [];
let memoryUsage: Record<string, number> = {};
let memoryProfiles: ChildMicroProfile[] = [createDefaultChildProfile('6-8')];
let memoryFeedbackEntries: ClinicalFeedbackEntry[] = [];

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const existing = await db.settings.get('default');
    if (existing) {
      memorySettings = { ...DEFAULT_SETTINGS, ...existing };
      return memorySettings;
    }
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch {
    return memorySettings;
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const updated: AppSettings = { ...memorySettings, ...partial, id: 'default' };
  memorySettings = updated;
  try {
    await db.settings.put(updated);
  } catch {
    // Fallback to memorySettings
  }
  return updated;
}

export async function loadChildProfiles(): Promise<ChildMicroProfile[]> {
  try {
    const list = await db.childProfiles.toArray();
    if (list.length > 0) {
      memoryProfiles = list;
      return list;
    }
    const def = createDefaultChildProfile(memorySettings.ageBand);
    memoryProfiles = [def];
    await db.childProfiles.put(def);
    return [def];
  } catch {
    if (memoryProfiles.length === 0) {
      memoryProfiles = [createDefaultChildProfile(memorySettings.ageBand)];
    }
    return [...memoryProfiles];
  }
}

export async function saveChildProfile(profile: ChildMicroProfile): Promise<ChildMicroProfile[]> {
  const idx = memoryProfiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    memoryProfiles = [
      ...memoryProfiles.slice(0, idx),
      profile,
      ...memoryProfiles.slice(idx + 1),
    ];
  } else {
    memoryProfiles = [...memoryProfiles, profile];
  }
  try {
    await db.childProfiles.put(profile);
  } catch {
    // Fallback handled via memoryProfiles
  }
  return [...memoryProfiles];
}

export async function removeChildProfile(profileId: string): Promise<ChildMicroProfile[]> {
  if (memoryProfiles.length <= 1) {
    return [...memoryProfiles];
  }
  memoryProfiles = memoryProfiles.filter((p) => p.id !== profileId);
  try {
    await db.childProfiles.delete(profileId);
  } catch {
    // Fallback handled
  }
  return [...memoryProfiles];
}

export async function recordSessionLog(
  log: Omit<ActivitySessionLog, 'id' | 'timestamp' | 'dateKey'>
): Promise<ActivitySessionLog> {
  const entry: ActivitySessionLog = {
    ...log,
    timestamp: new Date().toISOString(),
    dateKey: getTodayDateKey(),
  };
  try {
    const id = await db.sessionLogs.add(entry);
    const saved = { ...entry, id };
    memoryLogs.unshift(saved);
    return saved;
  } catch {
    const saved = { ...entry, id: memoryLogs.length + 1 };
    memoryLogs.unshift(saved);
    return saved;
  }
}

export async function getSessionLogs(): Promise<ActivitySessionLog[]> {
  try {
    const list = await db.sessionLogs.orderBy('timestamp').reverse().toArray();
    return list;
  } catch {
    return [...memoryLogs];
  }
}

export async function recordFeedbackEntry(
  entryData: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>
): Promise<ClinicalFeedbackEntry> {
  const entry: ClinicalFeedbackEntry = {
    ...entryData,
    timestamp: new Date().toISOString(),
    dateKey: getTodayDateKey(),
  };
  const fallbackId = Date.now() + Math.floor(Math.random() * 1000);
  const optimistic = { ...entry, id: fallbackId };
  memoryFeedbackEntries = [optimistic, ...memoryFeedbackEntries];
  try {
    const id = await db.feedbackEntries.add(entry);
    const saved = { ...entry, id };
    memoryFeedbackEntries = memoryFeedbackEntries.map((item) =>
      item.id === fallbackId ? saved : item
    );
    return saved;
  } catch {
    return optimistic;
  }
}

export async function getFeedbackEntries(): Promise<ClinicalFeedbackEntry[]> {
  try {
    const list = await db.feedbackEntries.orderBy('timestamp').reverse().toArray();
    if (list.length > 0) {
      memoryFeedbackEntries = list;
      return list;
    }
    return [...memoryFeedbackEntries];
  } catch {
    return [...memoryFeedbackEntries];
  }
}

export async function deleteFeedbackEntry(id: number): Promise<ClinicalFeedbackEntry[]> {
  memoryFeedbackEntries = memoryFeedbackEntries.filter((f) => f.id !== id);
  try {
    await db.feedbackEntries.delete(id);
  } catch {
    // Fallback already updated
  }
  return [...memoryFeedbackEntries];
}

export async function getTodayUsageSeconds(): Promise<number> {
  const key = getTodayDateKey();
  try {
    const rec = await db.dailyUsage.get(key);
    return rec ? rec.elapsedSeconds : (memoryUsage[key] ?? 0);
  } catch {
    return memoryUsage[key] ?? 0;
  }
}

export async function setTodayUsageSeconds(seconds: number): Promise<void> {
  const key = getTodayDateKey();
  const safeSeconds = Math.max(0, Math.round(seconds));
  memoryUsage[key] = safeSeconds;
  try {
    await db.dailyUsage.put({ dateKey: key, elapsedSeconds: safeSeconds });
  } catch {
    // Fallback handled via memoryUsage
  }
}

export async function wipeAllLocalData(): Promise<void> {
  memorySettings = { ...DEFAULT_SETTINGS };
  memoryLogs = [];
  memoryUsage = {};
  memoryProfiles = [createDefaultChildProfile('6-8')];
  memoryFeedbackEntries = [];
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  } catch {
    // Ignore storage errors
  }
  try {
    await db.transaction(
      'rw',
      [db.sessionLogs, db.settings, db.dailyUsage, db.childProfiles, db.feedbackEntries],
      async () => {
        await db.sessionLogs.clear();
        await db.settings.clear();
        await db.dailyUsage.clear();
        await db.childProfiles.clear();
        await db.feedbackEntries.clear();
        await db.settings.put(DEFAULT_SETTINGS);
        await db.childProfiles.put(createDefaultChildProfile('6-8'));
      }
    );
  } catch {
    // Fallback already reset
  }
}

/* ------------------------------------------------------------------ */
/* Backup / restore (manual transfer between devices, e.g. therapist   */
/* tablet → office PC). Until cloud sync exists, this is the only way  */
/* to move a child's history. The file contains children's data:       */
/* parents/therapists must store it securely.                          */
/* ------------------------------------------------------------------ */

export const BACKUP_FORMAT = 'synapseplay-backup';
export const BACKUP_VERSION = 1;

export interface SynapsePlayBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  childProfiles: ChildMicroProfile[];
  sessionLogs: ActivitySessionLog[];
}

export async function exportBackup(): Promise<SynapsePlayBackup> {
  const childProfiles = await loadChildProfiles();
  const sessionLogs = await getSessionLogs();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    childProfiles,
    // ids are re-assigned on import
    sessionLogs: sessionLogs.map(({ id: _id, ...rest }) => rest as ActivitySessionLog),
  };
}

/** Validates an untrusted backup file. Throws a Greek message on failure. */
export function parseBackup(raw: string): SynapsePlayBackup {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Το αρχείο δεν είναι έγκυρο αντίγραφο ασφαλείας (μη έγκυρο JSON).');
  }
  const b = data as Partial<SynapsePlayBackup>;
  if (!b || b.format !== BACKUP_FORMAT || typeof b.version !== 'number') {
    throw new Error('Το αρχείο δεν είναι αντίγραφο ασφαλείας του SynapsePlay.');
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error('Το αντίγραφο προέρχεται από νεότερη έκδοση της εφαρμογής. Ενημερώστε την εφαρμογή.');
  }
  if (!Array.isArray(b.childProfiles) || !Array.isArray(b.sessionLogs) || b.childProfiles.length === 0) {
    throw new Error('Το αντίγραφο ασφαλείας δεν περιέχει προφίλ παιδιών.');
  }
  const okProfile = (p: unknown): p is ChildMicroProfile => {
    const x = p as ChildMicroProfile;
    return (
      !!x &&
      typeof x.id === 'string' &&
      typeof x.nickname === 'string' &&
      x.nickname.length <= 60 &&
      typeof x.ageBand === 'string' &&
      typeof x.learnedModel === 'object' &&
      x.learnedModel !== null
    );
  };
  const okLog = (l: unknown): l is ActivitySessionLog => {
    const x = l as ActivitySessionLog;
    return (
      !!x &&
      typeof x.activityId === 'string' &&
      typeof x.timestamp === 'string' &&
      typeof x.dateKey === 'string' &&
      typeof x.completedRounds === 'number' &&
      typeof x.totalRounds === 'number'
    );
  };
  if (!b.childProfiles.every(okProfile) || !b.sessionLogs.every(okLog)) {
    throw new Error('Το αντίγραφο ασφαλείας είναι κατεστραμμένο ή έχει τροποποιηθεί.');
  }
  return b as SynapsePlayBackup;
}

/** REPLACES all child profiles and session logs on this device with the backup. */
export async function importBackup(backup: SynapsePlayBackup): Promise<ChildMicroProfile[]> {
  const profiles = backup.childProfiles;
  const logs = backup.sessionLogs.map(({ id: _id, ...rest }) => rest as ActivitySessionLog);
  memoryProfiles = [...profiles];
  memoryLogs = [...logs];
  try {
    await db.transaction('rw', [db.childProfiles, db.sessionLogs], async () => {
      await db.childProfiles.clear();
      await db.sessionLogs.clear();
      await db.childProfiles.bulkPut(profiles);
      await db.sessionLogs.bulkAdd(logs);
    });
  } catch {
    // In-memory fallback already updated
  }
  return [...profiles];
}
