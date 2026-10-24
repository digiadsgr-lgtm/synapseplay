import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  ActivitySessionLog,
  AgeBandId,
  AppSettings,
  ChildMicroProfile,
  ClinicalFeedbackEntry,
} from '../types/domain';
import {
  DEFAULT_SETTINGS,
  deleteFeedbackEntry,
  getFeedbackEntries,
  getSessionLogs,
  getTodayUsageSeconds,
  loadChildProfiles,
  loadSettings,
  recordFeedbackEntry,
  recordSessionLog,
  removeChildProfile,
  saveChildProfile,
  saveSettings,
  setTodayUsageSeconds,
  wipeAllLocalData,
} from '../db/database';
import {
  createDefaultChildProfile,
  createInitialLearningModel,
  trainChildProfileOnActivityCompletion,
} from '../utils/childProfileLearningEngine';
import {
  checkProfileCreationPermission,
  resolveEffectiveLicenseState,
  validateAndParseLicenseKey,
  type EffectiveLicenseState,
  type LicenseKeyValidationResult,
  type ProfileCreationPermission,
} from '../utils/licensingEngine';
import { getAgeBandProtocol } from '../data/ageProtocols';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  licenseState: EffectiveLicenseState;
  profileCreationPermission: ProfileCreationPermission;
  activateLicenseKey: (rawKey: string) => Promise<LicenseKeyValidationResult>;
  childProfiles: ChildMicroProfile[];
  activeProfile: ChildMicroProfile;
  switchChildProfile: (profileId: string) => Promise<void>;
  createChildProfile: (params: {
    nickname: string;
    avatarEmoji: string;
    ageBand: AgeBandId;
  }) => Promise<ChildMicroProfile | null>;
  updateProfileAvatar: (profileId: string, avatarEmoji: string) => Promise<void>;
  deleteChildProfile: (profileId: string) => Promise<void>;
  recordStrategyPreference: (strategyId: 'time' | 'example' | 'retry') => Promise<void>;
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
  feedbackEntries: ClinicalFeedbackEntry[];
  submitFeedbackEntry: (
    entry: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>
  ) => Promise<ClinicalFeedbackEntry>;
  removeFeedbackEntry: (id: number) => Promise<void>;
  wipeAllData: () => Promise<void>;
  extendSessionForParent: (extraMinutes: number) => Promise<void>;
  simulateTimeStateForDemo: (state: 'normal' | 'warning' | 'depleted') => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [childProfiles, setChildProfiles] = useState<ChildMicroProfile[]>(() => [
    createDefaultChildProfile(DEFAULT_SETTINGS.ageBand),
  ]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isBreakActive, setBreakActive] = useState<boolean>(false);
  const [isParentUnlocked, setParentUnlocked] = useState<boolean>(false);
  const [sessionLogs, setSessionLogs] = useState<ActivitySessionLog[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<ClinicalFeedbackEntry[]>([]);
  const [warningAnnounced, setWarningAnnounced] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const [loadedSettings, loadedUsage, loadedLogs, loadedProfiles, loadedFeedback] =
        await Promise.all([
          loadSettings(),
          getTodayUsageSeconds(),
          getSessionLogs(),
          loadChildProfiles(),
          getFeedbackEntries(),
        ]);
      if (!mounted) return;
      setSettings(loadedSettings);
      setElapsedSeconds(loadedUsage);
      setSessionLogs(loadedLogs);
      setChildProfiles(loadedProfiles);
      setFeedbackEntries(loadedFeedback);
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProfile = useMemo<ChildMicroProfile>(() => {
    const found = childProfiles.find((p) => p.id === settings.activeChildProfileId);
    const base = found ?? childProfiles[0] ?? createDefaultChildProfile(settings.ageBand);
    // Keep ageBand aligned with settings.ageBand if updated via settings
    if (base.ageBand !== settings.ageBand) {
      return { ...base, ageBand: settings.ageBand };
    }
    return base;
  }, [childProfiles, settings.activeChildProfileId, settings.ageBand]);

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

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
      const updated = await saveSettings(partial);
      setSettings(updated);
      if (partial.ageBand) {
        const updatedProfile: ChildMicroProfile = {
          ...activeProfile,
          ageBand: partial.ageBand,
        };
        const list = await saveChildProfile(updatedProfile);
        setChildProfiles(list);
      }
    },
    [activeProfile]
  );

  const licenseState = useMemo(
    () => resolveEffectiveLicenseState(settings),
    [settings.licenseTier, settings.licenseKey]
  );

  const profileCreationPermission = useMemo(
    () => checkProfileCreationPermission(childProfiles.length, settings),
    [childProfiles.length, settings.licenseTier, settings.licenseKey]
  );

  const activateLicenseKey = useCallback(
    async (rawKey: string): Promise<LicenseKeyValidationResult> => {
      const result = validateAndParseLicenseKey(rawKey);
      if (result.valid && result.tier) {
        await updateSettings({
          licenseTier: result.tier,
          licenseKey: result.normalizedKey,
        });
      }
      return result;
    },
    [updateSettings]
  );

  const switchChildProfile = useCallback(
    async (profileId: string) => {
      const target = childProfiles.find((p) => p.id === profileId);
      if (!target) return;
      const proto = getAgeBandProtocol(target.ageBand);
      const partial: Partial<AppSettings> = {
        activeChildProfileId: target.id,
        ageBand: target.ageBand,
        sessionLimitMinutes: proto.recommendedTotalMinutes,
      };
      setSettings((prev) => ({ ...prev, ...partial }));
      const nextSettings = await saveSettings(partial);
      setSettings(nextSettings);
    },
    [childProfiles]
  );

  const createChildProfile = useCallback(
    async (params: { nickname: string; avatarEmoji: string; ageBand: AgeBandId }) => {
      const perm = checkProfileCreationPermission(childProfiles.length, settings);
      if (!perm.allowed) {
        return null;
      }

      const cleanName = params.nickname.trim() || 'Μικρός Εξερευνητής';
      const newProfile: ChildMicroProfile = {
        id: `child-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nickname: cleanName,
        avatarEmoji: params.avatarEmoji || '🐨',
        ageBand: params.ageBand,
        createdAt: new Date().toISOString(),
        learnedModel: createInitialLearningModel(params.ageBand),
      };
      const proto = getAgeBandProtocol(params.ageBand);
      const partial: Partial<AppSettings> = {
        activeChildProfileId: newProfile.id,
        ageBand: params.ageBand,
        sessionLimitMinutes: proto.recommendedTotalMinutes,
      };
      setChildProfiles((prev) => [...prev, newProfile]);
      setSettings((prev) => ({ ...prev, ...partial }));

      const updatedList = await saveChildProfile(newProfile);
      setChildProfiles(updatedList);
      const nextSettings = await saveSettings(partial);
      setSettings(nextSettings);
      return newProfile;
    },
    [childProfiles.length, settings]
  );

  const updateProfileAvatar = useCallback(
    async (profileId: string, avatarEmoji: string) => {
      const target = childProfiles.find((p) => p.id === profileId);
      if (!target) return;
      const updated: ChildMicroProfile = {
        ...target,
        avatarEmoji,
      };
      setChildProfiles((prev) => prev.map((p) => (p.id === profileId ? updated : p)));
      const updatedList = await saveChildProfile(updated);
      setChildProfiles(updatedList);
    },
    [childProfiles]
  );

  const deleteChildProfile = useCallback(
    async (profileId: string) => {
      if (childProfiles.length <= 1) return;
      setChildProfiles((prev) => prev.filter((p) => p.id !== profileId));
      const updatedList = await removeChildProfile(profileId);
      setChildProfiles(updatedList);
      if (settings.activeChildProfileId === profileId) {
        const fallback = updatedList[0];
        if (fallback) {
          const partial: Partial<AppSettings> = {
            activeChildProfileId: fallback.id,
            ageBand: fallback.ageBand,
          };
          setSettings((prev) => ({ ...prev, ...partial }));
          const nextSettings = await saveSettings(partial);
          setSettings(nextSettings);
        }
      }
    },
    [childProfiles.length, settings.activeChildProfileId]
  );

  const recordStrategyPreference = useCallback(
    async (strategyId: 'time' | 'example' | 'retry') => {
      const updatedProfile: ChildMicroProfile = {
        ...activeProfile,
        learnedModel: {
          ...activeProfile.learnedModel,
          preferredStrategyId: strategyId,
          lastUpdatedTimestamp: new Date().toISOString(),
        },
      };
      setChildProfiles((prev) =>
        prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
      );
      const list = await saveChildProfile(updatedProfile);
      setChildProfiles(list);
    },
    [activeProfile]
  );

  const logCompletedActivity = useCallback(
    async (log: Omit<ActivitySessionLog, 'id' | 'timestamp' | 'dateKey'>) => {
      // 1. Train the active child profile's continual learning model on this completion
      const trainedProfile = trainChildProfileOnActivityCompletion(activeProfile, {
        activityId: log.activityId,
        hintsUsed: log.hintsUsed,
        impulsiveTapsAbsorbed: log.impulsiveTapsAbsorbed,
        durationSeconds: log.durationSeconds,
      });
      setChildProfiles((prev) =>
        prev.map((p) => (p.id === trainedProfile.id ? trainedProfile : p))
      );
      const updatedProfiles = await saveChildProfile(trainedProfile);
      setChildProfiles(updatedProfiles);

      // 2. Record the session log tagged with the child's micro-profile
      await recordSessionLog({
        ...log,
        childProfileId: trainedProfile.id,
        childNickname: trainedProfile.nickname,
      });
      const refreshed = await getSessionLogs();
      setSessionLogs(refreshed);
    },
    [activeProfile]
  );

  const submitFeedbackEntry = useCallback(
    async (entryData: Omit<ClinicalFeedbackEntry, 'id' | 'timestamp' | 'dateKey'>) => {
      const saved = await recordFeedbackEntry(entryData);
      const refreshed = await getFeedbackEntries();
      setFeedbackEntries(refreshed);
      return saved;
    },
    []
  );

  const removeFeedbackEntry = useCallback(async (id: number) => {
    setFeedbackEntries((prev) => prev.filter((f) => f.id !== id));
    const refreshed = await deleteFeedbackEntry(id);
    setFeedbackEntries(refreshed);
  }, []);

  const wipeAllData = useCallback(async () => {
    await wipeAllLocalData();
    const defaultProfile = createDefaultChildProfile(DEFAULT_SETTINGS.ageBand);
    setSettings(DEFAULT_SETTINGS);
    setChildProfiles([defaultProfile]);
    setElapsedSeconds(0);
    setSessionLogs([]);
    setFeedbackEntries([]);
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
        licenseState,
        profileCreationPermission,
        activateLicenseKey,
        childProfiles,
        activeProfile,
        switchChildProfile,
        createChildProfile,
        updateProfileAvatar,
        deleteChildProfile,
        recordStrategyPreference,
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
        feedbackEntries,
        submitFeedbackEntry,
        removeFeedbackEntry,
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
