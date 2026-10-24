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
