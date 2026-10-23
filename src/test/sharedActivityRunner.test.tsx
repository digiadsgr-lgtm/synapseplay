import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  activityRunnerReducer,
  createInitialRunnerState,
} from '../hooks/useActivityRunnerMachine';
import { SharedActivityRunner } from '../components/SharedActivityRunner';
import { AppProvider } from '../context/AppContext';
import type { ActivityDefinition } from '../types/domain';
import { wipeAllLocalData } from '../db/database';

const MOCK_ACTIVITY: ActivityDefinition = {
  id: '01-visual-search',
  code: '01',
  categoryId: 'detective-eyes',
  titleEl: 'Οπτική Αναζήτηση',
  titleEn: 'Visual Search',
  subtitleEl: 'Βρες το αντικείμενο-στόχο',
  voicePromptEl: 'Κοίτα το αντικείμενο-στόχο επάνω και πάτησε το ίδιο!',
  executiveDomain: 'Επιλεκτική Προσοχή',
  specialistDisciplines: ['Εργοθεραπεία', 'Παιδοψυχολογία'],
  recommendedAges: ['4-5', '5-6', '6-8', '8-10', '10-12'],
  ageAdaptationsEl: {
    '4-5': '3 αντικείμενα',
    '5-6': '4 αντικείμενα',
    '6-8': '6 αντικείμενα',
    '8-10': '8 αντικείμενα',
    '10-12': 'Σύνθετη αναζήτηση',
  },
  pictogram: '🎯',
  cues: [
    { emoji: '👀', labelEl: 'Κοίτα τον στόχο' },
    { emoji: '👆', labelEl: 'Πάτησε το σωστό' },
  ],
  parentGuidanceEl: 'Ενισχύει την επιλεκτική προσοχή.',
  supportsSeatedMode: true,
  totalRounds: 3,
};

describe('Gate 1 — SharedActivityRunner State Machine & Domain Unit Tests', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  describe('Pure State Machine Reducer (activityRunnerReducer)', () => {
    it('transitions cleanly from INTRO to ACTIVE_ROUND on START_ACTIVITY', () => {
      const initial = createInitialRunnerState({
        totalRounds: 3,
        initialPhase: 'INTRO',
      });
      expect(initial.phase).toBe('INTRO');
      expect(initial.currentRound).toBe(1);

      const started = activityRunnerReducer(initial, { type: 'START_ACTIVITY' });
      expect(started.phase).toBe('ACTIVE_ROUND');
      expect(started.currentRound).toBe(1);
    });

    it('preserves previousPhase when pausing and resuming (ACTIVE_ROUND <-> PAUSED and ROUND_FEEDBACK <-> PAUSED)', () => {
      const initial = createInitialRunnerState({ totalRounds: 3 });
      const paused = activityRunnerReducer(initial, { type: 'PAUSE_ACTIVITY' });
      expect(paused.phase).toBe('PAUSED');
      expect(paused.previousPhase).toBe('ACTIVE_ROUND');

      const resumed = activityRunnerReducer(paused, { type: 'RESUME_ACTIVITY' });
      expect(resumed.phase).toBe('ACTIVE_ROUND');

      // Pause from ROUND_FEEDBACK restores ROUND_FEEDBACK on resume
      const feedbackState = activityRunnerReducer(resumed, {
        type: 'RECORD_GENTLE_NUDGE',
        messageEl: 'Δοκίμασε ξανά ήρεμα!',
      });
      expect(feedbackState.phase).toBe('ROUND_FEEDBACK');
      expect(feedbackState.gentleNudgesCount).toBe(1);

      const pausedFromFeedback = activityRunnerReducer(feedbackState, {
        type: 'PAUSE_ACTIVITY',
      });
      expect(pausedFromFeedback.phase).toBe('PAUSED');
      expect(pausedFromFeedback.previousPhase).toBe('ROUND_FEEDBACK');

      const resumedToFeedback = activityRunnerReducer(pausedFromFeedback, {
        type: 'RESUME_ACTIVITY',
      });
      expect(resumedToFeedback.phase).toBe('ROUND_FEEDBACK');
      expect(resumedToFeedback.feedbackMessageEl).toBe('Δοκίμασε ξανά ήρεμα!');
    });

    it('climbs the 3-level Unified Hint Ladder (0 -> 1 -> 2) and caps at 2', () => {
      let state = createInitialRunnerState({ totalRounds: 3 });
      expect(state.hintLevel).toBe(0);
      expect(state.totalHintsUsed).toBe(0);

      state = activityRunnerReducer(state, { type: 'REQUEST_HINT' });
      expect(state.hintLevel).toBe(1);
      expect(state.totalHintsUsed).toBe(1);

      state = activityRunnerReducer(state, { type: 'REQUEST_HINT' });
      expect(state.hintLevel).toBe(2);
      expect(state.totalHintsUsed).toBe(2);

      // Additional hint request at level 2 is a safe no-op
      state = activityRunnerReducer(state, { type: 'REQUEST_HINT' });
      expect(state.hintLevel).toBe(2);
      expect(state.totalHintsUsed).toBe(2);
    });

    it('advances rounds, resets per-round hintLevel to 0, accumulates absorbed taps, and transitions to COMPLETED', () => {
      let state = createInitialRunnerState({ totalRounds: 3 });
      state = activityRunnerReducer(state, { type: 'REQUEST_HINT' });
      expect(state.hintLevel).toBe(1);

      // Complete Round 1 -> Round 2
      state = activityRunnerReducer(state, {
        type: 'COMPLETE_ROUND',
        impulsiveTapsInRound: 2,
      });
      expect(state.phase).toBe('ACTIVE_ROUND');
      expect(state.currentRound).toBe(2);
      expect(state.hintLevel).toBe(0);
      expect(state.totalHintsUsed).toBe(1);
      expect(state.impulsiveTapsAbsorbed).toBe(2);

      // Complete Round 2 -> Round 3
      state = activityRunnerReducer(state, {
        type: 'COMPLETE_ROUND',
        impulsiveTapsInRound: 1,
      });
      expect(state.phase).toBe('ACTIVE_ROUND');
      expect(state.currentRound).toBe(3);
      expect(state.impulsiveTapsAbsorbed).toBe(3);

      // Complete Round 3 -> COMPLETED
      state = activityRunnerReducer(state, {
        type: 'COMPLETE_ROUND',
        impulsiveTapsInRound: 0,
      });
      expect(state.phase).toBe('COMPLETED');
      expect(state.currentRound).toBe(3);
      expect(state.impulsiveTapsAbsorbed).toBe(3);
    });

    it('toggles seatedMode and restarts cleanly to Round 1 ACTIVE_ROUND', () => {
      let state = createInitialRunnerState({ totalRounds: 2, seatedModeDefault: false });
      state = activityRunnerReducer(state, { type: 'TOGGLE_SEATED_MODE' });
      expect(state.seatedMode).toBe(true);

      state = activityRunnerReducer(state, { type: 'COMPLETE_ROUND' });
      state = activityRunnerReducer(state, { type: 'COMPLETE_ROUND' });
      expect(state.phase).toBe('COMPLETED');

      const restarted = activityRunnerReducer(state, { type: 'RESTART_ACTIVITY' });
      expect(restarted.phase).toBe('ACTIVE_ROUND');
      expect(restarted.currentRound).toBe(1);
      expect(restarted.hintLevel).toBe(0);
      expect(restarted.totalHintsUsed).toBe(0);
      expect(restarted.seatedMode).toBe(true);
    });
  });

  describe('SharedActivityRunner Component Integration & UI Transitions', () => {
    it('drives full UI lifecycle: INTRO -> ACTIVE_ROUND -> PAUSED -> ROUND_FEEDBACK -> COMPLETED -> RESTART', () => {
      render(
        <MemoryRouter>
          <AppProvider>
            <SharedActivityRunner activity={MOCK_ACTIVITY} initialPhase="INTRO">
              {({
                phase,
                currentRound,
                hintLevel,
                advanceRound,
                triggerGentleFeedback,
              }) => (
                <div data-testid="custom-child-stage">
                  <span data-testid="stage-phase">{phase}</span>
                  <span data-testid="stage-round">{currentRound}</span>
                  <span data-testid="stage-hint">{hintLevel}</span>
                  <button
                    type="button"
                    data-testid="trigger-nudge-btn"
                    onClick={() => triggerGentleFeedback('Ήρεμη προσπάθεια!')}
                  >
                    Nudge
                  </button>
                  <button
                    type="button"
                    data-testid="complete-round-btn"
                    onClick={() => advanceRound(1)}
                  >
                    Advance
                  </button>
                </div>
              )}
            </SharedActivityRunner>
          </AppProvider>
        </MemoryRouter>
      );

      // 1. Starts in INTRO phase
      expect(screen.getByTestId('runner-intro-screen')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('runner-start-activity-btn'));

      // 2. Transitions to ACTIVE_ROUND
      expect(screen.getByTestId('custom-child-stage')).toBeInTheDocument();
      expect(screen.getByTestId('stage-phase')).toHaveTextContent('ACTIVE_ROUND');
      expect(screen.getByTestId('stage-round')).toHaveTextContent('1');

      // 3. Pause and Resume
      fireEvent.click(screen.getByTestId('runner-pause-toggle-btn'));
      expect(screen.getByTestId('runner-paused-screen')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('runner-resume-btn'));
      expect(screen.getByTestId('custom-child-stage')).toBeInTheDocument();

      // 4. Trigger Gentle Nudge (ROUND_FEEDBACK)
      fireEvent.click(screen.getByTestId('trigger-nudge-btn'));
      expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent(
        'Ήρεμη προσπάθεια!'
      );
      expect(screen.getByTestId('stage-phase')).toHaveTextContent('ROUND_FEEDBACK');

      // 5. Complete all 3 rounds -> COMPLETED
      fireEvent.click(screen.getByTestId('complete-round-btn'));
      expect(screen.getByTestId('stage-round')).toHaveTextContent('2');
      fireEvent.click(screen.getByTestId('complete-round-btn'));
      expect(screen.getByTestId('stage-round')).toHaveTextContent('3');
      fireEvent.click(screen.getByTestId('complete-round-btn'));

      expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();

      // 6. Restart returns to Round 1 ACTIVE_ROUND
      fireEvent.click(screen.getByTestId('play-again-btn'));
      expect(screen.getByTestId('stage-round')).toHaveTextContent('1');
      expect(screen.getByTestId('stage-phase')).toHaveTextContent('ACTIVE_ROUND');
    });
  });
});
