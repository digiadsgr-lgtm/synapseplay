import Dexie, { type Table } from 'dexie';
import type { ActivitySessionLog, AppSettings, DailyUsageRecord } from '../types/domain';

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  ageBand: '6-8',
  sessionLimitMinutes: 20,
  warningWindowMinutes: 2,
  soundEnabled: true,
  voiceEnabled: true,
  reducedMotion: false,
  seatedModeDefault: false,
};

export class SynapsePlayDatabase extends Dexie {
  sessionLogs!: Table<ActivitySessionLog, number>;
  settings!: Table<AppSettings, string>;
  dailyUsage!: Table<DailyUsageRecord, string>;

  constructor() {
    super('SynapsePlayLocalDB');
    this.version(1).stores({
      sessionLogs: '++id, timestamp, dateKey, activityId, categoryId',
      settings: 'id',
      dailyUsage: 'dateKey',
    });
  }
}

export const db = new SynapsePlayDatabase();

// Fallback in-memory state when IndexedDB is unavailable (e.g. unit test environment without fake-indexeddb)
let memorySettings: AppSettings = { ...DEFAULT_SETTINGS };
let memoryLogs: ActivitySessionLog[] = [];
let memoryUsage: Record<string, number> = {};

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
      memorySettings = existing;
      return existing;
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
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  } catch {
    // Ignore storage errors
  }
  try {
    await db.transaction('rw', db.sessionLogs, db.settings, db.dailyUsage, async () => {
      await db.sessionLogs.clear();
      await db.settings.clear();
      await db.dailyUsage.clear();
      await db.settings.put(DEFAULT_SETTINGS);
    });
  } catch {
    // Fallback already reset
  }
}
