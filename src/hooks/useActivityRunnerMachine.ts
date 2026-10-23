import { useReducer, useCallback } from 'react';
import type { HintLevel, RunnerAction, RunnerPhase, RunnerState } from '../types/domain';

export interface CreateInitialRunnerStateOptions {
  totalRounds: number;
  seatedModeDefault?: boolean;
  initialPhase?: Exclude<RunnerPhase, 'PAUSED'>;
  initialRound?: number;
  initialHintLevel?: HintLevel;
}

export function createInitialRunnerState({
  totalRounds,
  seatedModeDefault = false,
  initialPhase = 'ACTIVE_ROUND',
  initialRound = 1,
  initialHintLevel = 0,
}: CreateInitialRunnerStateOptions): RunnerState {
  const safeTotal = Math.max(1, totalRounds);
  const safeRound = Math.min(safeTotal, Math.max(1, initialRound));
  return {
    phase: initialPhase,
    previousPhase: initialPhase,
    currentRound: safeRound,
    totalRounds: safeTotal,
    hintLevel: initialHintLevel,
    totalHintsUsed: 0,
    gentleNudgesCount: 0,
    impulsiveTapsAbsorbed: 0,
    seatedMode: seatedModeDefault,
    feedbackMessageEl: null,
  };
}

export function activityRunnerReducer(
  state: RunnerState,
  action: RunnerAction
): RunnerState {
  switch (action.type) {
    case 'START_ACTIVITY': {
      if (state.phase !== 'INTRO') return state;
      return {
        ...state,
        phase: 'ACTIVE_ROUND',
        previousPhase: 'ACTIVE_ROUND',
        feedbackMessageEl: null,
      };
    }

    case 'PAUSE_ACTIVITY': {
      if (state.phase === 'PAUSED' || state.phase === 'COMPLETED') {
        return state;
      }
      return {
        ...state,
        previousPhase: state.phase,
        phase: 'PAUSED',
      };
    }

    case 'RESUME_ACTIVITY': {
      if (state.phase !== 'PAUSED') return state;
      return {
        ...state,
        phase: state.previousPhase,
      };
    }

    case 'REQUEST_HINT': {
      if (state.phase === 'COMPLETED' || state.phase === 'PAUSED') {
        return state;
      }
      if (state.hintLevel >= 2) {
        return state;
      }
      const nextLevel: HintLevel = state.hintLevel === 0 ? 1 : 2;
      return {
        ...state,
        hintLevel: nextLevel,
        totalHintsUsed: state.totalHintsUsed + 1,
      };
    }

    case 'RECORD_GENTLE_NUDGE': {
      if (state.phase === 'COMPLETED' || state.phase === 'PAUSED') {
        return state;
      }
      return {
        ...state,
        phase: 'ROUND_FEEDBACK',
        previousPhase: 'ROUND_FEEDBACK',
        gentleNudgesCount: state.gentleNudgesCount + 1,
        feedbackMessageEl: action.messageEl,
      };
    }

    case 'CLEAR_FEEDBACK': {
      if (state.phase !== 'ROUND_FEEDBACK') return state;
      return {
        ...state,
        phase: 'ACTIVE_ROUND',
        previousPhase: 'ACTIVE_ROUND',
        feedbackMessageEl: null,
      };
    }

    case 'RECORD_ABSORBED_TAP': {
      const increment = action.count ?? 1;
      return {
        ...state,
        impulsiveTapsAbsorbed: state.impulsiveTapsAbsorbed + Math.max(0, increment),
      };
    }

    case 'COMPLETE_ROUND': {
      if (state.phase === 'COMPLETED' || state.phase === 'PAUSED') {
        return state;
      }
      const addedImpulsive = Math.max(0, action.impulsiveTapsInRound ?? 0);
      const updatedImpulsive = state.impulsiveTapsAbsorbed + addedImpulsive;

      if (state.currentRound < state.totalRounds) {
        return {
          ...state,
          phase: 'ACTIVE_ROUND',
          previousPhase: 'ACTIVE_ROUND',
          currentRound: state.currentRound + 1,
          hintLevel: 0,
          impulsiveTapsAbsorbed: updatedImpulsive,
          feedbackMessageEl: null,
        };
      }

      return {
        ...state,
        phase: 'COMPLETED',
        previousPhase: 'COMPLETED',
        impulsiveTapsAbsorbed: updatedImpulsive,
        feedbackMessageEl: null,
      };
    }

    case 'TOGGLE_SEATED_MODE': {
      const nextSeated =
        typeof action.value === 'boolean' ? action.value : !state.seatedMode;
      return {
        ...state,
        seatedMode: nextSeated,
      };
    }

    case 'RESTART_ACTIVITY': {
      return createInitialRunnerState({
        totalRounds: action.totalRounds ?? state.totalRounds,
        seatedModeDefault: action.seatedModeDefault ?? state.seatedMode,
        initialPhase: 'ACTIVE_ROUND',
      });
    }

    default:
      return state;
  }
}

export function useActivityRunnerMachine(options: CreateInitialRunnerStateOptions) {
  const [state, dispatch] = useReducer(
    activityRunnerReducer,
    options,
    createInitialRunnerState
  );

  const startActivity = useCallback(() => dispatch({ type: 'START_ACTIVITY' }), []);
  const pauseActivity = useCallback(() => dispatch({ type: 'PAUSE_ACTIVITY' }), []);
  const resumeActivity = useCallback(() => dispatch({ type: 'RESUME_ACTIVITY' }), []);
  const requestHint = useCallback(() => dispatch({ type: 'REQUEST_HINT' }), []);
  const recordGentleNudge = useCallback(
    (messageEl: string) => dispatch({ type: 'RECORD_GENTLE_NUDGE', messageEl }),
    []
  );
  const clearFeedback = useCallback(() => dispatch({ type: 'CLEAR_FEEDBACK' }), []);
  const recordAbsorbedTap = useCallback(
    (count: number = 1) => dispatch({ type: 'RECORD_ABSORBED_TAP', count }),
    []
  );
  const completeRound = useCallback(
    (impulsiveTapsInRound: number = 0) =>
      dispatch({ type: 'COMPLETE_ROUND', impulsiveTapsInRound }),
    []
  );
  const toggleSeatedMode = useCallback(
    (value?: boolean) => dispatch({ type: 'TOGGLE_SEATED_MODE', value }),
    []
  );
  const restartActivity = useCallback(
    (totalRounds?: number, seatedModeDefault?: boolean) =>
      dispatch({ type: 'RESTART_ACTIVITY', totalRounds, seatedModeDefault }),
    []
  );

  return {
    state,
    dispatch,
    startActivity,
    pauseActivity,
    resumeActivity,
    requestHint,
    recordGentleNudge,
    clearFeedback,
    recordAbsorbedTap,
    completeRound,
    toggleSeatedMode,
    restartActivity,
  };
}
