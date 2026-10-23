import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ActivityDefinition,
  AgeBandId,
  HintLevel,
  RunnerPhase,
  SilentAdaptationProfile,
} from '../types/domain';
import { useApp } from '../context/AppContext';
import { playCalmTone, speakGreek } from '../utils/soundAndSpeech';
import { useActivityRunnerMachine } from '../hooks/useActivityRunnerMachine';
import { evaluateInvisibleScenario } from '../utils/adaptiveScenarioEngine';
import { computeClinicalStaircaseSnapshot } from '../utils/clinicalAdhdEngine';

export interface ActivityRunnerRenderProps {
  phase: RunnerPhase;
  currentRound: number;
  totalRounds: number;
  hintLevel: HintLevel;
  seatedMode: boolean;
  ageBand: AgeBandId;
  adaptiveProfile: SilentAdaptationProfile;
  sessionSeed?: number;
  setSeatedMode: (val: boolean) => void;
  advanceRound: (impulsiveTapsInRound?: number) => void;
  triggerGentleFeedback: (messageEl: string) => void;
  requestHint: () => void;
}

export interface SharedActivityRunnerProps {
  activity: ActivityDefinition;
  initialPhase?: Exclude<RunnerPhase, 'PAUSED'>;
  children: (props: ActivityRunnerRenderProps) => React.ReactNode;
}

export const SharedActivityRunner: React.FC<SharedActivityRunnerProps> = ({
  activity,
  initialPhase = 'ACTIVE_ROUND',
  children,
}) => {
  const navigate = useNavigate();
  const { settings, logCompletedActivity } = useApp();

  const storageKey = `synapseplay_runner_${activity.id}`;
  const savedCheckpoint = (() => {
    try {
      if (initialPhase === 'INTRO' || typeof window === 'undefined' || !window.sessionStorage) {
        return null;
      }
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as { currentRound?: number; hintLevel?: HintLevel };
    } catch {
      return null;
    }
  })();

  const {
    state,
    startActivity,
    pauseActivity,
    resumeActivity,
    requestHint: dispatchHint,
    recordGentleNudge,
    completeRound,
    toggleSeatedMode,
    restartActivity: dispatchRestart,
  } = useActivityRunnerMachine({
    totalRounds: activity.totalRounds,
    seatedModeDefault: settings.seatedModeDefault,
    initialPhase,
    initialRound: savedCheckpoint?.currentRound ?? 1,
    initialHintLevel: savedCheckpoint?.hintLevel ?? 0,
  });

  const startTimeRef = useRef<number>(Date.now());
  const roundStartRef = useRef<number>(Date.now());
  const lastResponseMsRef = useRef<number>(0);
  const loggedCompletionRef = useRef<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = React.useState<string | null>(null);
  const [sessionSeed, setSessionSeed] = React.useState<number>(() => {
    try {
      if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
        return 0;
      }
      const seedKey = `synapseplay_variety_seed_${activity.id}`;
      const prev = parseInt(window.localStorage.getItem(seedKey) ?? '-1', 10);
      const next = isNaN(prev) ? 0 : prev + 1;
      window.localStorage.setItem(seedKey, String(next));
      return next;
    } catch {
      return 0;
    }
  });

  const ageBand: AgeBandId = settings.ageBand ?? '6-8';

  // Invisible Adaptive Scenario Engine (evaluates silently in real time)
  const adaptiveProfile = useMemo(
    () =>
      evaluateInvisibleScenario({
        ageBand,
        completedRoundsCount: state.currentRound - 1,
        gentleNudgesInCurrentActivity: state.gentleNudgesCount,
        hintsUsedInCurrentActivity: state.totalHintsUsed,
        absorbedImpulsiveTaps: state.impulsiveTapsAbsorbed,
        lastResponseTimeMs: lastResponseMsRef.current,
        seatedModeActive: state.seatedMode,
      }),
    [
      ageBand,
      state.currentRound,
      state.gentleNudgesCount,
      state.totalHintsUsed,
      state.impulsiveTapsAbsorbed,
      state.seatedMode,
    ]
  );

  // Real-time Clinical Staircase & Inner-Speech Self-Guidance (Barkley / Meichenbaum / Kollins RCT)
  const staircaseSnapshot = useMemo(
    () =>
      computeClinicalStaircaseSnapshot({
        ageBand,
        scenarioId: adaptiveProfile.scenarioId,
        completedRounds: state.currentRound - 1,
        gentleNudges: state.gentleNudgesCount,
        hintsUsed: state.totalHintsUsed,
        absorbedImpulsiveTaps: state.impulsiveTapsAbsorbed,
        variantNumber: (sessionSeed % 12) + 1,
      }),
    [
      ageBand,
      adaptiveProfile.scenarioId,
      state.currentRound,
      state.gentleNudgesCount,
      state.totalHintsUsed,
      state.impulsiveTapsAbsorbed,
      sessionSeed,
    ]
  );

  // Effective hint level incorporates silent frustration-prevention scaffolding when needed
  const effectiveHintLevel: HintLevel =
    state.hintLevel === 0 && adaptiveProfile.autoHintBoost && state.gentleNudgesCount >= 2
      ? 1
      : state.hintLevel;

  // Persist active round checkpoint for seamless page-refresh recovery
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      if (state.phase === 'COMPLETED') {
        window.sessionStorage.removeItem(storageKey);
      } else {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            currentRound: state.currentRound,
            hintLevel: state.hintLevel,
          })
        );
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey, state.phase, state.currentRound, state.hintLevel]);

  useEffect(() => {
    toggleSeatedMode(settings.seatedModeDefault);
  }, [settings.seatedModeDefault, toggleSeatedMode]);

  useEffect(() => {
    speakGreek(activity.voicePromptEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  }, [activity.voicePromptEl, settings.voiceEnabled, adaptiveProfile.speechRate]);

  const handleRequestHint = () => {
    if (state.hintLevel >= 2 || state.phase === 'PAUSED' || state.phase === 'COMPLETED') {
      return;
    }
    const nextLevel: HintLevel = state.hintLevel === 0 ? 1 : 2;
    dispatchHint();
    playCalmTone('soft-step', settings.soundEnabled);
    if (nextLevel === 1) {
      speakGreek(
        'Βοήθεια 1: Κοίτα το στοιχείο που ξεχωρίζει με το πλαίσιο!',
        settings.voiceEnabled,
        adaptiveProfile.speechRate
      );
    } else {
      speakGreek(
        'Βοήθεια 2: Λιγότερες επιλογές για να διαλέξεις με άνεση!',
        settings.voiceEnabled,
        adaptiveProfile.speechRate
      );
    }
  };

  const handleGentleFeedback = (messageEl: string) => {
    lastResponseMsRef.current = Date.now() - roundStartRef.current;
    recordGentleNudge(messageEl);
    playCalmTone('gentle-nudge', settings.soundEnabled);
    speakGreek(messageEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  };

  const handleAdvanceRound = (impulsiveTapsInRound: number = 0) => {
    lastResponseMsRef.current = Date.now() - roundStartRef.current;
    roundStartRef.current = Date.now();
    const isFinalRound = state.currentRound >= state.totalRounds;
    completeRound(impulsiveTapsInRound);

    if (!isFinalRound) {
      playCalmTone('chime', settings.soundEnabled);
      speakGreek('Μπράβο! Πάμε στο επόμενο βήμα.', settings.voiceEnabled, adaptiveProfile.speechRate);
    } else {
      playCalmTone('complete', settings.soundEnabled);
      speakGreek(
        `Συγχαρητήρια! Ολοκλήρωσες τη δραστηριότητα ${activity.titleEl} με ηρεμία!`,
        settings.voiceEnabled,
        adaptiveProfile.speechRate
      );
      if (!loggedCompletionRef.current) {
        loggedCompletionRef.current = true;
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startTimeRef.current) / 1000)
        );
        void logCompletedActivity({
          activityId: activity.id,
          activityTitleEl: activity.titleEl,
          categoryId: activity.categoryId,
          durationSeconds,
          completedRounds: activity.totalRounds,
          totalRounds: activity.totalRounds,
          hintsUsed: state.totalHintsUsed,
          impulsiveTapsAbsorbed: state.impulsiveTapsAbsorbed + impulsiveTapsInRound,
          seatedModeUsed: Boolean(activity.supportsSeatedMode && state.seatedMode),
          ageBand,
          adaptiveScenarioId: adaptiveProfile.scenarioId,
        });
      }
    }
  };

  const handleRestart = () => {
    startTimeRef.current = Date.now();
    roundStartRef.current = Date.now();
    loggedCompletionRef.current = false;
    setSessionSeed((prev) => prev + 1);
    dispatchRestart(activity.totalRounds, settings.seatedModeDefault);
    speakGreek(activity.voicePromptEl, settings.voiceEnabled, adaptiveProfile.speechRate);
  };

  const handleShuffleVariation = () => {
    setSessionSeed((prev) => prev + 1);
    playCalmTone('soft-step', settings.soundEnabled);
    speakGreek('Φορτώθηκε νέα παραλλαγή δραστηριότητας!', settings.voiceEnabled, adaptiveProfile.speechRate);
  };

  const isCompleted = state.phase === 'COMPLETED';
  const isPaused = state.phase === 'PAUSED';
  const isIntro = state.phase === 'INTRO';
  const ageAdaptationText = activity.ageAdaptationsEl?.[ageBand];

  return (
    <main
      className="max-w-5xl mx-auto px-4 py-6 space-y-6"
      data-testid="shared-activity-runner"
      data-runner-phase={state.phase}
      data-age-band={ageBand}
    >
      {/* Top Activity Navigation & Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-sand-light border-2 border-sand-dark rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/category/${activity.categoryId}`)}
            data-testid="back-to-category-btn"
            aria-label="Επιστροφή στην κατηγορία"
            className="touch-target px-4 py-2 rounded-2xl bg-white border-2 border-slate text-charcoal font-bold flex items-center gap-2 hover:bg-slate-surface"
          >
            <span aria-hidden="true">⬅️</span>
            <span>Πίσω</span>
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-3xl" aria-hidden="true">{activity.pictogram}</span>
              <h1 className="text-xl md:text-2xl font-extrabold text-charcoal">
                {activity.code}. {activity.titleEl}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-sage-surface border border-sage text-xs font-extrabold text-charcoal">
                Ηλικία {ageBand} ετών
              </span>
            </div>
            <p className="text-sm text-charcoal-muted">{activity.subtitleEl}</p>
            {ageAdaptationText && (
              <p className="text-xs font-bold text-slate-dark mt-0.5" data-testid="age-adaptation-subtitle">
                ✨ Προσαρμογή {ageBand}: {ageAdaptationText}
              </p>
            )}
          </div>
        </div>

        {/* Calm Pebble Progress Indicator & Local Runner Pause Toggle */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2"
            aria-label={`Βήμα ${state.currentRound} από ${state.totalRounds}`}
          >
            <span className="text-sm font-bold text-charcoal">Βήμα:</span>
            {Array.from({ length: state.totalRounds }).map((_, idx) => {
              const roundNum = idx + 1;
              const isDone = isCompleted || roundNum < state.currentRound;
              const isCurrent = !isCompleted && roundNum === state.currentRound;
              return (
                <span
                  key={roundNum}
                  data-testid={`round-pebble-${roundNum}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm border-2 transition-colors ${
                    isDone
                      ? 'bg-sage text-white border-sage-dark'
                      : isCurrent
                      ? 'bg-slate text-white border-slate-dark'
                      : 'bg-white text-charcoal-muted border-sand-dark'
                  }`}
                >
                  {isDone ? '✓' : roundNum}
                </span>
              );
            })}
          </div>

          {!isCompleted && (
            <button
              type="button"
              data-testid="runner-pause-toggle-btn"
              onClick={() => (isPaused ? resumeActivity() : pauseActivity())}
              aria-pressed={isPaused}
              className="touch-target px-4 py-2 rounded-2xl bg-white border-2 border-slate text-charcoal font-bold text-sm flex items-center gap-1.5 hover:bg-slate-surface"
            >
              <span aria-hidden="true">{isPaused ? '▶️' : '⏸️'}</span>
              <span>{isPaused ? 'Συνέχεια' : 'Παύση'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Speech Synthesis Independent Visual + Audio Instruction Strip */}
      <section
        aria-label="Οδηγίες Δραστηριότητας"
        className="bg-white border-2 border-sage rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => speakGreek(activity.voicePromptEl, true, adaptiveProfile.speechRate)}
              data-testid="replay-voice-prompt-btn"
              aria-label="Ακρόαση φωνητικής οδηγίας"
              className="touch-target px-4 py-2 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-bold flex items-center gap-2 hover:bg-sage hover:text-white shrink-0"
            >
              <span className="text-2xl" aria-hidden="true">🔊</span>
              <span>Άκου Οδηγία</span>
            </button>
            <p
              className="text-base md:text-lg font-bold text-charcoal"
              data-testid="activity-voice-prompt-text"
            >
              {activity.voicePromptEl}
            </p>
          </div>

          {/* Visual Pictogram Cues (Guarantees 100% playability without audio) */}
          <div className="flex flex-wrap items-center gap-2" data-testid="visual-pictogram-cues">
            {activity.cues.map((cue, index) => (
              <div
                key={cue.labelEl}
                className="px-3 py-1.5 rounded-xl bg-sand border border-sand-dark flex items-center gap-2 text-sm font-bold text-charcoal"
              >
                <span className="text-lg" aria-hidden="true">{cue.emoji}</span>
                <span>
                  {index + 1}. {cue.labelEl}
                </span>
              </div>
            ))}
          </div>

          {/* Inner-Speech Self-Coaching Cue (Meichenbaum CBT / Barkley Verbal Self-Regulation) */}
          <div
            data-testid="inner-speech-cue-pill"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sage-surface/70 border border-sage text-xs font-extrabold text-charcoal"
          >
            <span>{staircaseSnapshot.innerSpeechCueEl}</span>
          </div>
        </div>

        {/* Unified Hint Ladder, Variety Shuffle & Seated Mode Controls */}
        {!isCompleted && !isPaused && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShuffleVariation}
              data-testid="shuffle-variation-btn"
              title="Εναλλαγή σε νέο σετ ερωτήσεων και εικόνων"
              className="touch-target px-4 py-2 rounded-2xl bg-sand border-2 border-sand-dark text-charcoal font-bold text-sm flex items-center gap-1.5 hover:bg-slate-surface"
            >
              <span className="text-xl" aria-hidden="true">🎲</span>
              <span>Νέα Παραλλαγή (#{(sessionSeed % 12) + 1})</span>
            </button>

            {activity.supportsSeatedMode && (
              <button
                type="button"
                onClick={() => toggleSeatedMode()}
                data-testid="toggle-seated-mode-btn"
                aria-pressed={state.seatedMode}
                className={`touch-target px-4 py-2 rounded-2xl border-2 font-bold text-sm flex items-center gap-2 ${
                  state.seatedMode
                    ? 'bg-slate text-white border-slate-dark'
                    : 'bg-slate-surface text-charcoal border-slate'
                }`}
              >
                <span className="text-xl" aria-hidden="true">🪑</span>
                <span>{state.seatedMode ? 'Καθιστή Εκδοχή: ΝΑΙ' : 'Καθιστή Εκδοχή'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRequestHint}
              disabled={state.hintLevel === 2}
              data-testid="hint-ladder-btn"
              className="touch-target px-4 py-2 rounded-2xl bg-terracotta-surface border-2 border-terracotta text-charcoal font-bold text-sm flex items-center gap-2 hover:bg-terracotta hover:text-white disabled:opacity-60"
            >
              <span className="text-xl" aria-hidden="true">💡</span>
              <span>
                {state.hintLevel === 0
                  ? 'Βοήθεια (1/2)'
                  : state.hintLevel === 1
                  ? 'Περισσότερη Βοήθεια (2/2)'
                  : 'Μέγιστη Βοήθεια Ενεργή'}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Gentle Non-Punitive Feedback Banner */}
      {state.feedbackMessageEl && !isCompleted && (
        <div
          role="status"
          aria-live="polite"
          data-testid="gentle-feedback-banner"
          className="p-4 rounded-2xl bg-slate-surface border-2 border-slate text-charcoal font-bold flex items-center gap-3"
        >
          <span className="text-2xl" aria-hidden="true">🌱</span>
          <span>{state.feedbackMessageEl}</span>
        </div>
      )}

      {/* Phase-Specific Stage Rendering */}
      {isIntro ? (
        <section
          data-testid="runner-intro-screen"
          className="bg-sand-light border-4 border-sage rounded-3xl p-8 text-center space-y-6"
        >
          <div className="text-6xl" aria-hidden="true">{activity.pictogram}</div>
          <h2 className="text-2xl font-extrabold text-charcoal">{activity.titleEl}</h2>
          <p className="text-lg text-charcoal-muted">{activity.subtitleEl}</p>
          <button
            type="button"
            data-testid="runner-start-activity-btn"
            onClick={startActivity}
            className="touch-target px-8 py-4 rounded-2xl bg-sage-dark text-white font-extrabold text-xl inline-flex items-center gap-2 hover:bg-sage"
          >
            <span aria-hidden="true">▶️</span>
            <span>Ξεκίνα το Παιχνίδι</span>
          </button>
        </section>
      ) : isPaused ? (
        <section
          data-testid="runner-paused-screen"
          className="bg-sand-light border-4 border-slate rounded-3xl p-8 text-center space-y-6"
        >
          <div className="text-5xl" aria-hidden="true">⏸️🌿</div>
          <h2 className="text-2xl font-extrabold text-charcoal">Το παιχνίδι είναι σε παύση</h2>
          <p className="text-base text-charcoal-muted">
            Πάρε όσον χρόνο χρειάζεσαι. Όταν είσαι έτοιμος, πάτησε Συνέχεια!
          </p>
          <button
            type="button"
            data-testid="runner-resume-btn"
            onClick={resumeActivity}
            className="touch-target px-8 py-4 rounded-2xl bg-sage-dark text-white font-extrabold text-xl inline-flex items-center gap-2 hover:bg-sage"
          >
            <span aria-hidden="true">▶️</span>
            <span>Συνέχεια</span>
          </button>
        </section>
      ) : isCompleted ? (
        <section
          aria-labelledby="activity-complete-heading"
          data-testid="activity-complete-screen"
          className="bg-sand-light border-4 border-sage rounded-3xl p-8 text-center space-y-6 shadow-md"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sage-surface border-4 border-sage text-5xl">
            🌿✨
          </div>
          <h2 id="activity-complete-heading" className="text-2xl md:text-3xl font-extrabold text-charcoal">
            Υπέροχη Προσπάθεια!
          </h2>
          <p className="text-lg text-charcoal-muted max-w-lg mx-auto">
            Ολοκλήρωσες και τα {activity.totalRounds} βήματα στη δραστηριότητα «{activity.titleEl}» με
            ηρεμία και συγκέντρωση.
          </p>

          {/* Metacognitive Self-Observation & Regulation Prompt */}
          <div
            data-testid="metacognitive-reflection-box"
            className="p-4 rounded-2xl bg-white border-2 border-sand-dark max-w-xl mx-auto space-y-3"
          >
            <p className="text-sm font-extrabold text-charcoal">
              🧠 Αυτοπαρατήρηση: Τι σε βοήθησε περισσότερο σήμερα;
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'time', emoji: '⏳', labelEl: 'Να πάρω τον χρόνο μου' },
                { id: 'example', emoji: '👀', labelEl: 'Να δω το παράδειγμα' },
                { id: 'retry', emoji: '🔄', labelEl: 'Να δοκιμάσω ξανά' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`metacognitive-opt-${item.id}`}
                  aria-pressed={selectedStrategy === item.id}
                  onClick={() => setSelectedStrategy(item.id)}
                  className={`touch-target px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-1.5 ${
                    selectedStrategy === item.id
                      ? 'bg-sage text-white border-sage-dark'
                      : 'bg-sand-light text-charcoal border-sand-dark hover:bg-sand'
                  }`}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  <span>{item.labelEl}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleRestart}
              data-testid="play-again-btn"
              className="touch-target px-6 py-3 rounded-2xl bg-white border-2 border-sage text-charcoal font-bold text-lg flex items-center gap-2 hover:bg-sage-surface"
            >
              <span aria-hidden="true">🔄</span>
              <span>Παίξε Ξανά</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/category/${activity.categoryId}`)}
              data-testid="finish-to-category-btn"
              className="touch-target px-8 py-3 rounded-2xl bg-sage-dark text-white font-extrabold text-lg flex items-center gap-2 hover:bg-sage"
            >
              <span aria-hidden="true">🏡</span>
              <span>Διάλεξε Άλλο Παιχνίδι</span>
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-label={`Περιοχή παιχνιδιού: ${activity.titleEl}`}
          className="bg-sand-light border-2 border-sand-dark rounded-3xl p-6 shadow-sm"
        >
          {children({
            phase: state.phase,
            currentRound: state.currentRound,
            totalRounds: state.totalRounds,
            hintLevel: effectiveHintLevel,
            seatedMode: state.seatedMode,
            ageBand,
            adaptiveProfile,
            sessionSeed,
            setSeatedMode: (val: boolean) => toggleSeatedMode(val),
            advanceRound: handleAdvanceRound,
            triggerGentleFeedback: handleGentleFeedback,
            requestHint: handleRequestHint,
          })}
        </section>
      )}
    </main>
  );
};
