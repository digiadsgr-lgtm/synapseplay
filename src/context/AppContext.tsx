import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ActivitySessionLog, AppSettings } from '../types/domain';
import {
  DEFAULT_SETTINGS,
  getSessionLogs,
  getTodayUsageSeconds,
  loadSettings,
  recordSessionLog,
  saveSettings,
  setTodayUsageSeconds,
  wipeAllLocalData,
} from '../db/database';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  elapsedSeconds: number;
  remainingRatio: number; // 1.0 (full) down to 0.0 (depleted)
  isWarningWindow: boolean; // true when <= warningWindowMinutes left and > 0
  isSessionDepleted: boolean; // true when elapsedSeconds >= sessionLimitMinutes * 60
  isBreakActive: boolean;
  setBreakActive: (active: boolean) => void;
  isParentUnlocked: boolean;
  setParentUnlocked: (unlocked: boolean) => void;
  sessionLogs: ActivitySessionLog[];
  logCompletedActivity: (
    log: Omit<ActivitySessionLog, 'id' | 'timestamp' | 'dateKey'>
  ) => Promise<void>;
  wipeAllData: () => Promise<void>;
  extendSessionForParent: (extraMinutes: number) => Promise<void>;
  simulateTimeStateForDemo: (state: 'normal' | 'warning' | 'depleted') => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isBreakActive, setBreakActive] = useState<boolean>(false);
  const [isParentUnlocked, setParentUnlocked] = useState<boolean>(false);
  const [sessionLogs, setSessionLogs] = useState<ActivitySessionLog[]>([]);
  const [warningAnnounced, setWarningAnnounced] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const [loadedSettings, loadedUsage, loadedLogs] = await Promise.all([
        loadSettings(),
        getTodayUsageSeconds(),
        getSessionLogs(),
      ]);
      if (!mounted) return;
      setSettings(loadedSettings);
      setElapsedSeconds(loadedUsage);
      setSessionLogs(loadedLogs);
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Apply reduced-motion class to document.documentElement
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (settings.reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    }
  }, [settings.reducedMotion]);

  const totalLimitSeconds = Math.max(60, settings.sessionLimitMinutes * 60);
  const remainingSeconds = Math.max(0, totalLimitSeconds - elapsedSeconds);
  const remainingRatio = Math.min(1, Math.max(0, remainingSeconds / totalLimitSeconds));
  const warningThresholdSeconds = settings.warningWindowMinutes * 60;
  const isWarningWindow =
    remainingSeconds > 0 && remainingSeconds <= warningThresholdSeconds;
  const isSessionDepleted = remainingSeconds <= 0;

  // Tick session timer every 1 second unless paused/break or already depleted
  useEffect(() => {
    if (isBreakActive || isSessionDepleted) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        void setTodayUsageSeconds(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isBreakActive, isSessionDepleted]);

  // Trigger gentle 2-minute advance calm reminder once
  useEffect(() => {
    if (isWarningWindow && !warningAnnounced) {
      setWarningAnnounced(true);
      playCalmTone('soft-step', settings.soundEnabled);
      speakGreek(
        'Το τάμπλετ θα ξεκουραστεί σύντομα. Έχουμε λίγα λεπτά ακόμα για να ολοκληρώσουμε ήρεμα.',
        settings.voiceEnabled
      );
    }
  }, [isWarningWindow, warningAnnounced, settings.soundEnabled, settings.voiceEnabled]);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    const updated = await saveSettings(partial);
    setSettings(updated);
  }, []);

  const logCompletedActivity = useCallback(
    async (log: Omit<ActivitySessionLog, 'id' | 'timestamp' | 'dateKey'>) => {
      await recordSessionLog(log);
      const refreshed = await getSessionLogs();
      setSessionLogs(refreshed);
    },
    []
  );

  const wipeAllData = useCallback(async () => {
    await wipeAllLocalData();
    setSettings(DEFAULT_SETTINGS);
    setElapsedSeconds(0);
    setSessionLogs([]);
    setWarningAnnounced(false);
  }, []);

  const extendSessionForParent = useCallback(
    async (extraMinutes: number) => {
      const reducedElapsed = Math.max(0, elapsedSeconds - extraMinutes * 60);
      setElapsedSeconds(reducedElapsed);
      setWarningAnnounced(false);
      await setTodayUsageSeconds(reducedElapsed);
    },
    [elapsedSeconds]
  );

  const simulateTimeStateForDemo = useCallback(
    (state: 'normal' | 'warning' | 'depleted') => {
      const limitSec = settings.sessionLimitMinutes * 60;
      const warnSec = settings.warningWindowMinutes * 60;
      if (state === 'normal') {
        setElapsedSeconds(0);
        setWarningAnnounced(false);
        void setTodayUsageSeconds(0);
      } else if (state === 'warning') {
        const target = Math.max(0, limitSec - warnSec + 5);
        setElapsedSeconds(target);
        void setTodayUsageSeconds(target);
      } else if (state === 'depleted') {
        setElapsedSeconds(limitSec);
        void setTodayUsageSeconds(limitSec);
      }
    },
    [settings.sessionLimitMinutes, settings.warningWindowMinutes]
  );

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        elapsedSeconds,
        remainingRatio,
        isWarningWindow,
        isSessionDepleted,
        isBreakActive,
        setBreakActive,
        isParentUnlocked,
        setParentUnlocked,
        sessionLogs,
        logCompletedActivity,
        wipeAllData,
        extendSessionForParent,
        simulateTimeStateForDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
