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
  getTodayDateKey,
  wipeAllLocalData,
  importBackup,
  importChildProgress,
  type SynapsePlayBackup,
  type SynapsePlayProgressFile,
} from '../db/database';
import { centerCodeFromLicenseRef, parseChildCode, randomCenterCode } from '../utils/childCode';
import {
  createDefaultChildProfile,
  createInitialLearningModel,
  trainChildProfileOnActivityCompletion,
} from '../utils/childProfileLearningEngine';
import {
  ENABLE_PAYWALL,
  checkProfileCreationPermission,
  resolveEffectiveLicenseState,
  validateAndParseLicenseKey,
  type EffectiveLicenseState,
  type LicenseKeyValidationResult,
  type ProfileCreationPermission,
} from '../utils/licensingEngine';
import {
  isSignedLicenseToken,
  verifyLicenseToken,
  type VerifiedLicense,
} from '../utils/licenseToken';
import { getAgeBandProtocol } from '../data/ageProtocols';
import type {
  HomeMissionRecord,
  HomeMissionStatus,
  ParentCheckIn,
  PracticePlan,
} from '../types/homePractice';
import type { HomeMissionTemplate } from '../utils/homeMissions';
import { mergeById } from '../utils/parentCheckIn';
import type { DecodedProgress, TherapistInboxKey } from '../utils/secureProgress';
import { PROGRESS_FORMAT, PROGRESS_VERSION } from '../db/database';

const MAX_MISSION_HISTORY = 400;
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  licenseState: EffectiveLicenseState;
  profileCreationPermission: ProfileCreationPermission;
  activateLicenseKey: (rawKey: string) => Promise<LicenseKeyValidationResult>;
  /** After a Stripe payment: exchange the checkout session for a signed licence. */
  claimCheckoutSession: (sessionId: string) => Promise<LicenseKeyValidationResult>;
  /** Licences verified on this device (signed codes). */
  verifiedLicenses: VerifiedLicense[];
  childProfiles: ChildMicroProfile[];
  activeProfile: ChildMicroProfile;
  switchChildProfile: (profileId: string) => Promise<void>;
  createChildProfile: (params: {
    nickname: string;
    avatarEmoji: string;
    ageBand: AgeBandId;
  }) => Promise<ChildMicroProfile | null>;
  updateProfileAvatar: (profileId: string, avatarEmoji: string) => Promise<void>;
  /** Rename a child profile and/or change its age band (parent area). */
  updateChildProfileDetails: (
    profileId: string,
    changes: { nickname?: string; ageBand?: AgeBandId; childCode?: string }
  ) => Promise<void>;
  /** Replace all profiles + session logs with a validated backup file. */
  restoreBackup: (backup: SynapsePlayBackup) => Promise<void>;
  /** Θεραπευτής: προσθέτει την πρόοδο του σπιτιού (αρχείο γονιού) στο προφίλ με τον ίδιο κωδικό. */
  importProgressFile: (
    file: SynapsePlayProgressFile
  ) => Promise<{ added: number; created: boolean; nickname: string }>;
  /** Κωδικός κέντρου αυτής της συσκευής (δημιουργείται την πρώτη φορά). */
  ensureCenterCode: () => Promise<string>;
  deleteChildProfile: (profileId: string) => Promise<void>;
  /** Αποστολή στο σπίτι: το παιδί τη δέχεται στο τέλος του παιχνιδιού. */
  acceptHomeMission: (
    template: HomeMissionTemplate,
    textEl: string,
    activityId?: ActivitySessionLog['activityId']
  ) => Promise<HomeMissionRecord>;
  /** Ο γονιός επιβεβαιώνει (έγινε) ή την αφήνει (όχι σήμερα). */
  resolveHomeMission: (profileId: string, missionRecordId: string, status: HomeMissionStatus) => Promise<void>;
  /** Πρόγραμμα της εβδομάδας από τον θεραπευτή (null = αφαίρεση). */
  setPracticePlan: (profileId: string, plan: PracticePlan | null) => Promise<void>;
  addParentCheckIn: (profileId: string, answers: ParentCheckIn['answers']) => Promise<void>;
  markProgressSent: (profileId: string) => Promise<void>;
  /** Θεραπευτής: κλειδί για την κρυπτογραφημένη πρόοδο (δημιουργείται την πρώτη φορά). */
  ensureTherapistInboxKey: () => Promise<TherapistInboxKey>;
  /** Θεραπευτής: προσθέτει την κρυπτογραφημένη πρόοδο (καταγραφές, αποστολές, ερωτηματολόγια). */
  importDecodedProgress: (
    progress: DecodedProgress
  ) => Promise<{ added: number; created: boolean; nickname: string; missions: number; checkIns: number }>;
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
  /**
   * Screen time counts ONLY while the child area is on screen (set by AppShell from the route)
   * and the page is visible. Landing, blog, legal and the Parent Area do not consume it.
   */
  setScreenTimeTracking: (active: boolean) => void;
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
  const [isScreenTimeRoute, setScreenTimeTracking] = useState<boolean>(true);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [verifiedLicenses, setVerifiedLicenses] = useState<VerifiedLicense[]>([]);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  // Date the elapsed counter belongs to → reset at midnight (tablets left on overnight)
  const usageDateKeyRef = React.useRef<string>(getTodayDateKey());

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
      setSettingsLoaded(true);
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
    if (typeof document === 'undefined') return;
    const onVisibility = () => setIsPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (isBreakActive || !isScreenTimeRoute || !isPageVisible) return;

    const timer = window.setInterval(() => {
      const todayKey = getTodayDateKey();
      if (todayKey !== usageDateKeyRef.current) {
        // New day: start from zero (also lifts yesterday's "depleted" state)
        usageDateKeyRef.current = todayKey;
        setWarningAnnounced(false);
        setElapsedSeconds(0);
        void setTodayUsageSeconds(0);
        return;
      }
      if (isSessionDepleted) return;
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Persist every 5 s (not every second) to spare IndexedDB writes
        if (next % 5 === 0) void setTodayUsageSeconds(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isBreakActive, isSessionDepleted, isScreenTimeRoute, isPageVisible]);

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

  // Verify stored signed licences (offline) whenever they change
  const licenseTokensKey = (settings.licenseTokens ?? []).join('|');
  useEffect(() => {
    let alive = true;
    const tokens = settings.licenseTokens ?? [];
    void Promise.all(tokens.map((t) => verifyLicenseToken(t))).then((results) => {
      if (!alive) return;
      setVerifiedLicenses(results.flatMap((r) => (r.ok ? [r.license] : [])));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseTokensKey]);

  // Payments ON: the 14-day trial starts at the first use on this device
  useEffect(() => {
    if (ENABLE_PAYWALL && settingsLoaded && !settings.trialStartedAt) {
      void updateSettings({ trialStartedAt: new Date().toISOString() });
    }
  }, [settingsLoaded, settings.trialStartedAt, updateSettings]);

  const licenseState = useMemo(
    () => resolveEffectiveLicenseState(settings, ENABLE_PAYWALL, { verifiedLicenses }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.licenseTier, settings.licenseKey, settings.trialStartedAt, verifiedLicenses]
  );

  const profileCreationPermission = useMemo(
    () =>
      checkProfileCreationPermission(childProfiles.length, settings, ENABLE_PAYWALL, {
        verifiedLicenses,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childProfiles.length, settings.licenseTier, settings.licenseKey, settings.trialStartedAt, verifiedLicenses]
  );

  const activateLicenseKey = useCallback(
    async (rawKey: string): Promise<LicenseKeyValidationResult> => {
      // Signed licence from a Stripe payment (SP1.…)
      if (isSignedLicenseToken(rawKey)) {
        const res = await verifyLicenseToken(rawKey);
        if (!res.ok) {
          return {
            valid: false,
            tier: null,
            normalizedKey: '',
            messageEl:
              res.reason === 'no-public-key'
                ? 'Η επαλήθευση κωδικών δεν έχει ρυθμιστεί ακόμη σε αυτή την έκδοση.'
                : res.reason === 'no-crypto'
                ? 'Ο browser της συσκευής δεν υποστηρίζει ασφαλή επαλήθευση. Ενημερώστε τον browser.'
                : 'Ο κωδικός δεν είναι έγκυρος. Αντιγράψτε τον ολόκληρο από το email της συνδρομής.',
          };
        }
        const lic = res.license;
        const nowSec = Date.now() / 1000;
        if (lic.exp <= nowSec) {
          return {
            valid: false,
            tier: null,
            normalizedKey: '',
            messageEl:
              'Ο κωδικός έχει λήξει. Με κάθε ανανέωση της συνδρομής λαμβάνετε νέο κωδικό με email.',
          };
        }
        // Keep only still-valid codes (max 10), newest last, no duplicates
        const kept = (settings.licenseTokens ?? []).filter((t) => t !== lic.token);
        const stillValid = verifiedLicenses
          .filter((v) => kept.includes(v.token) && v.exp > nowSec)
          .map((v) => v.token);
        await updateSettings({ licenseTokens: [...stillValid, lic.token].slice(-10) });
        // Η άδεια φέρει τον κωδικό παιδιού της αγοράς → συνδέεται με το τρέχον προφίλ αν δεν έχει
        if (
          lic.childCode &&
          !activeProfile.childCode &&
          !childProfiles.some((p) => p.childCode === lic.childCode)
        ) {
          setChildProfiles(await saveChildProfile({ ...activeProfile, childCode: lic.childCode }));
        }
        const until = new Date(lic.exp * 1000).toLocaleDateString('el-GR');
        const label =
          lic.plan === 'b2b'
            ? 'η Άδεια Θεραπευτή (B2B)'
            : lic.plan === 'extra'
            ? `${lic.n > 1 ? `${lic.n} επιπλέον προφίλ` : '1 επιπλέον προφίλ'} παιδιού`
            : 'το Οικογενειακό Πλάνο';
        return {
          valid: true,
          tier: lic.plan === 'b2b' ? 'b2b' : 'family',
          normalizedKey: '',
          messageEl: `Ενεργοποιήθηκε ${label} — ισχύει έως ${until}.`,
        };
      }

      // Free beta only: demo prefixes (FAMILY-…, B2B-…, DEV)
      const result = validateAndParseLicenseKey(rawKey, ENABLE_PAYWALL);
      if (result.valid && result.tier) {
        await updateSettings({
          licenseTier: result.tier,
          licenseKey: result.normalizedKey,
        });
      }
      return result;
    },
    [updateSettings, settings.licenseTokens, verifiedLicenses, activeProfile, childProfiles]
  );

  const claimCheckoutSession = useCallback(
    async (sessionId: string): Promise<LicenseKeyValidationResult> => {
      try {
        const r = await fetch(`/api/license-claim?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await r.json().catch(() => ({}))) as { ok?: boolean; token?: string; reason?: string };
        if (r.ok && data.ok && data.token) {
          return await activateLicenseKey(data.token);
        }
        return {
          valid: false,
          tier: null,
          normalizedKey: '',
          messageEl:
            data.reason === 'not-paid'
              ? 'Η πληρωμή δεν έχει ολοκληρωθεί ακόμη. Δοκιμάστε ξανά σε λίγο ή χρησιμοποιήστε τον κωδικό από το email.'
              : 'Δεν ήταν δυνατή η αυτόματη ενεργοποίηση. Θα λάβετε τον κωδικό με email σε λίγα λεπτά.',
        };
      } catch {
        return {
          valid: false,
          tier: null,
          normalizedKey: '',
          messageEl: 'Χωρίς σύνδεση στο διαδίκτυο. Χρησιμοποιήστε τον κωδικό από το email όταν συνδεθείτε.',
        };
      }
    },
    [activateLicenseKey]
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

  const updateChildProfileDetails = useCallback(
    async (
      profileId: string,
      changes: { nickname?: string; ageBand?: AgeBandId; childCode?: string }
    ) => {
      const target = childProfiles.find((p) => p.id === profileId);
      if (!target) return;
      const nickname = changes.nickname?.trim().slice(0, 40);
      const childCode = changes.childCode ? parseChildCode(changes.childCode)?.code : undefined;
      const updated: ChildMicroProfile = {
        ...target,
        ...(nickname ? { nickname } : {}),
        ...(changes.ageBand ? { ageBand: changes.ageBand } : {}),
        ...(childCode ? { childCode } : {}),
      };
      setChildProfiles((prev) => prev.map((p) => (p.id === profileId ? updated : p)));
      const updatedList = await saveChildProfile(updated);
      setChildProfiles(updatedList);
      // Keep the global age band in sync when editing the ACTIVE child
      if (changes.ageBand && settings.activeChildProfileId === profileId) {
        const nextSettings = await saveSettings({ ageBand: changes.ageBand });
        setSettings(nextSettings);
      }
    },
    [childProfiles, settings.activeChildProfileId]
  );

  const restoreBackup = useCallback(async (backup: SynapsePlayBackup) => {
    const restored = await importBackup(backup);
    setChildProfiles(restored);
    const first = restored[0];
    if (first) {
      const nextSettings = await saveSettings({
        activeChildProfileId: first.id,
        ageBand: first.ageBand,
      });
      setSettings(nextSettings);
    }
    setSessionLogs(await getSessionLogs());
  }, []);

  const importProgressFile = useCallback(async (file: SynapsePlayProgressFile) => {
    const res = await importChildProgress(file);
    setChildProfiles(res.profiles);
    setSessionLogs(await getSessionLogs());
    return { added: res.added, created: res.created, nickname: res.profile.nickname };
  }, []);

  const ensureCenterCode = useCallback(async () => {
    if (settings.centerCode) return settings.centerCode;
    const b2bRef = verifiedLicenses.find((l) => l.plan === 'b2b' && l.ref)?.ref;
    const centerCode = b2bRef ? centerCodeFromLicenseRef(b2bRef) : randomCenterCode();
    await updateSettings({ centerCode });
    return centerCode;
  }, [settings.centerCode, verifiedLicenses, updateSettings]);

  // Πάντα η τελευταία λίστα προφίλ (για αλλαγές που γίνονται αμέσως μετά από εκπαίδευση προφίλ)
  const profilesRef = React.useRef<ChildMicroProfile[]>(childProfiles);
  profilesRef.current = childProfiles;

  const patchProfile = useCallback(
    async (profileId: string, change: (p: ChildMicroProfile) => ChildMicroProfile) => {
      const target = profilesRef.current.find((p) => p.id === profileId);
      if (!target) return null;
      const updated = change(target);
      profilesRef.current = profilesRef.current.map((p) => (p.id === profileId ? updated : p));
      setChildProfiles(profilesRef.current);
      setChildProfiles(await saveChildProfile(updated));
      return updated;
    },
    []
  );

  const acceptHomeMission = useCallback(
    async (template: HomeMissionTemplate, textEl: string, activityId?: ActivitySessionLog['activityId']) => {
      const profileId = activeProfile.id;
      const now = new Date();
      const record: HomeMissionRecord = {
        id: `hm-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        missionId: template.id,
        emoji: template.emoji,
        textEl,
        activityId,
        offeredAt: now.toISOString(),
        dateKey: getTodayDateKey(),
        status: 'accepted',
      };
      await patchProfile(profileId, (p) => ({
        ...p,
        homeMissions: [...(p.homeMissions ?? []), record].slice(-MAX_MISSION_HISTORY),
      }));
      return record;
    },
    [activeProfile.id, patchProfile]
  );

  const resolveHomeMission = useCallback(
    async (profileId: string, missionRecordId: string, status: HomeMissionStatus) => {
      await patchProfile(profileId, (p) => ({
        ...p,
        homeMissions: (p.homeMissions ?? []).map((m) =>
          m.id === missionRecordId ? { ...m, status, resolvedAt: new Date().toISOString() } : m
        ),
      }));
      if (status === 'done') playCalmTone('complete', settings.soundEnabled);
    },
    [patchProfile, settings.soundEnabled]
  );

  const setPracticePlan = useCallback(
    async (profileId: string, plan: PracticePlan | null) => {
      await patchProfile(profileId, (p) => {
        const next = { ...p };
        if (plan) next.practicePlan = { ...plan, receivedAt: new Date().toISOString() };
        else delete next.practicePlan;
        // Ο κωδικός του προγράμματος γίνεται ο κωδικός του παιδιού, αν δεν υπήρχε (ή ήταν «χωρίς θεραπευτή»)
        if (plan && (!p.childCode || p.childCode.startsWith('SELF-'))) next.childCode = plan.childCode;
        return next;
      });
    },
    [patchProfile]
  );

  const addParentCheckIn = useCallback(
    async (profileId: string, answers: ParentCheckIn['answers']) => {
      const entry: ParentCheckIn = {
        id: `ci-${Date.now().toString(36)}`,
        dateKey: getTodayDateKey(),
        answers,
      };
      await patchProfile(profileId, (p) => ({
        ...p,
        parentCheckIns: [...(p.parentCheckIns ?? []), entry].slice(-60),
      }));
    },
    [patchProfile]
  );

  const markProgressSent = useCallback(
    async (profileId: string) => {
      await patchProfile(profileId, (p) => ({ ...p, progressSentAt: new Date().toISOString() }));
    },
    [patchProfile]
  );

  const ensureTherapistInboxKey = useCallback(async () => {
    if (settings.therapistInboxKey) return settings.therapistInboxKey;
    const { generateTherapistInboxKey } = await import('../utils/secureProgress');
    const key = await generateTherapistInboxKey();
    await updateSettings({ therapistInboxKey: key });
    return key;
  }, [settings.therapistInboxKey, updateSettings]);

  const importDecodedProgress = useCallback(
    async (progress: DecodedProgress) => {
      const res = await importChildProgress({
        format: PROGRESS_FORMAT,
        version: PROGRESS_VERSION,
        exportedAt: progress.sentAt,
        childCode: progress.childCode,
        profile: { nickname: progress.nickname, avatarEmoji: progress.avatarEmoji, ageBand: progress.ageBand },
        sessionLogs: progress.sessionLogs,
      });
      profilesRef.current = res.profiles;
      const updated = await patchProfile(res.profile.id, (p) => ({
        ...p,
        homeMissions: mergeById(p.homeMissions, progress.homeMissions, MAX_MISSION_HISTORY),
        parentCheckIns: mergeById(p.parentCheckIns, progress.parentCheckIns, 60),
        progressSentAt: progress.sentAt,
      }));
      if (!updated) setChildProfiles(res.profiles);
      setSessionLogs(await getSessionLogs());
      return {
        added: res.added,
        created: res.created,
        nickname: res.profile.nickname,
        missions: progress.homeMissions.filter((m) => m.status === 'done').length,
        checkIns: progress.parentCheckIns.length,
      };
    },
    [patchProfile]
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
        errorsCount: log.errorsCount ?? 0,
        completedRounds: log.completedRounds,
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
        claimCheckoutSession,
        verifiedLicenses,
        childProfiles,
        activeProfile,
        switchChildProfile,
        createChildProfile,
        updateProfileAvatar,
        updateChildProfileDetails,
        restoreBackup,
        importProgressFile,
        ensureCenterCode,
        deleteChildProfile,
        acceptHomeMission,
        resolveHomeMission,
        setPracticePlan,
        addParentCheckIn,
        markProgressSent,
        ensureTherapistInboxKey,
        importDecodedProgress,
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
        setScreenTimeTracking,
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
