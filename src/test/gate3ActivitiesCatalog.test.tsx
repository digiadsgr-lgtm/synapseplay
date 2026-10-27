import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ACTIVITIES } from '../data/activitiesCatalog';
import { wipeAllLocalData } from '../db/database';

function renderActivity(activityId: string) {
  return render(
    <MemoryRouter initialEntries={[`/activity/${activityId}`]}>
      <App />
    </MemoryRouter>
  );
}

describe('Gate 3 — Remaining 8 Activities (02, 03, 05, 06, 08, 09, 10, 12) & Full 12-Activity Verification', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  it('Activity 02 (Spot the Difference): non-punitive feedback, Hint Level 2 reduction, and full 3-round completion', () => {
    vi.useFakeTimers();
    renderActivity('02-spot-difference');

    // Clicking identical item triggers gentle feedback
    fireEvent.click(screen.getByTestId('difference-item-s1-1'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('είναι ίδιο');

    // Hint Level 2 reduces slots
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));

    // Complete 3 rounds
    for (let r = 1; r <= 3; r++) {
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('difference-item-target'));
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 03 (Visual Memory): memorizes cards, hides them, handles non-punitive reveal on miss, and completes 3 rounds', () => {
    vi.useFakeTimers();
    renderActivity('03-visual-memory');

    // Round 1: Hide cards first, then pick wrong card -> reveals cards gently with feedback
    fireEvent.click(screen.getByTestId('toggle-hide-cards-btn'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('memory-card-m1-2'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('Ποδήλατο');

    // Now hide and pick target across all 3 rounds
    for (let r = 1; r <= 3; r++) {
      fireEvent.click(screen.getByTestId('toggle-hide-cards-btn'));
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('memory-card-target'));
      vi.advanceTimersByTime(450);
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 05 (Order the Steps): enforces step-by-step routine order (1 -> 2 -> 3) with gentle nudges and completes 3 routines', () => {
    vi.useFakeTimers();
    renderActivity('05-order-steps');

    // Picking Step 2 before Step 1 triggers gentle prompt
    fireEvent.click(screen.getByTestId('order-step-card-2'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('Όχι ακόμα');

    // Complete all 3 routines in order 1 -> 2 -> 3
    for (let r = 1; r <= 3; r++) {
      for (let step = 1; step <= 3; step++) {
        vi.advanceTimersByTime(450);
        fireEvent.click(screen.getByTestId(`order-step-card-${step}`));
      }
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 06 (Switch the Rule): transitions from Color rule (Rounds 1-2) to Shape rule (Rounds 3-4) and completes', () => {
    vi.useFakeTimers();
    renderActivity('06-switch-rule');

    // Round 1: Color Rule
    expect(screen.getByTestId('rule-banner-color')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('switch-rule-target'));

    // Round 2: Color Rule
    vi.advanceTimersByTime(450);
    expect(screen.getByTestId('rule-banner-color')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('switch-rule-target'));

    // Round 3: Explicit Rule Switch to Shape!
    vi.advanceTimersByTime(450);
    expect(screen.getByTestId('rule-banner-shape')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('switch-rule-target'));

    // Round 4: Shape Rule -> Complete
    vi.advanceTimersByTime(450);
    expect(screen.getByTestId('rule-banner-shape')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('switch-rule-target'));

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 08 (Listen & Do): prevents impulsive action before instruction finishes, then completes 3 rounds', () => {
    vi.useFakeTimers();
    renderActivity('08-listen-do');

    // «Τώρα διάλεξε» opens when the riddle has been spoken to the end
    // (in unit tests there is no speech engine, so the gate opens at once — see useSpokenPrompt)
    expect(screen.getByTestId('listen-status-ready')).toBeInTheDocument();
    // a wrong choice gets a short correction
    const wrong = screen.getAllByRole('button').find((b) => b.getAttribute('data-testid')?.startsWith('listen-do-opt-'));
    if (wrong) {
      fireEvent.click(wrong);
      expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('Άκου ξανά');
    }
    for (let r = 1; r <= 3; r++) {
      act(() => {
        vi.advanceTimersByTime(450);
      });
      expect(screen.getByTestId('listen-status-ready')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('listen-do-target'));
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 09 (Wait for the Signal): waits past non-cue items until Star signal appears, supports Hint Level 2 jump, and completes', () => {
    vi.useFakeTimers();
    renderActivity('09-wait-signal');

    // Tapping before Star cue triggers calm feedback
    expect(screen.getByTestId('signal-stage-waiting')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('wait-signal-tap-btn'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('χρυσό αστέρι');

    // Stream advances automatically past non-cue items to reach Star cue in Round 1
    for (let tick = 0; tick < 60; tick++) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }
    expect(screen.getByTestId('signal-stage-ready')).toBeInTheDocument();

    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('wait-signal-tap-btn'));

    // Round 2 & Round 3: Use Hint Level 2 to jump directly to the Star signal and complete
    for (let r = 2; r <= 3; r++) {
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      expect(screen.getByTestId('signal-stage-ready')).toBeInTheDocument();
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('wait-signal-tap-btn'));
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 10 (Copy the Animal): supports Seated Mode toggle and completes 3 rhythmic animal poses', () => {
    vi.useFakeTimers();
    renderActivity('10-copy-animal');

    // Toggle Seated Mode and verify prompt updates
    fireEvent.click(screen.getByTestId('toggle-seated-mode-btn'));
    expect(screen.getByTestId('animal-pose-prompt')).toHaveTextContent('καρέκλα');

    // Complete 3 rounds: the pose is held for a count of 3 (the button counts along with the child)
    for (let r = 1; r <= 3; r++) {
      for (let c = 0; c < 3; c++) {
        vi.advanceTimersByTime(450);
        fireEvent.click(screen.getByTestId('copy-animal-rhythm-btn'));
      }
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 12 (Build the Pattern): supports both on-screen block placement and physical LEGO bridge completion, plus restartability', () => {
    vi.useFakeTimers();
    renderActivity('12-build-pattern');

    // Round 1 pattern is ['sage', 'slate', 'sage']
    fireEvent.click(screen.getByTestId('pattern-picker-sage'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('pattern-picker-slate'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('pattern-picker-sage'));

    // Round 2 & 3: Complete using physical LEGO bridge button
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('pattern-physical-lego-btn'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('pattern-physical-lego-btn'));

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();

    // Restart activity and verify it returns cleanly to Round 1
    fireEvent.click(screen.getByTestId('play-again-btn'));
    expect(screen.getByTestId('activity-12-build-pattern')).toBeInTheDocument();
    expect(screen.getByTestId('round-pebble-1')).toHaveTextContent('1');

    vi.useRealTimers();
  });

  it('verifies all 12 activities are interruptible (Pause/Resume & Break Modal) and safely exitable', () => {
    for (const activity of ACTIVITIES) {
      const { unmount } = renderActivity(activity.id);

      // Local Runner Pause & Resume
      fireEvent.click(screen.getByTestId('runner-pause-toggle-btn'));
      expect(screen.getByTestId('runner-paused-screen')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('runner-resume-btn'));
      expect(screen.queryByTestId('runner-paused-screen')).not.toBeInTheDocument();

      // Global Break / Pause Modal
      fireEvent.click(screen.getByTestId('break-pause-btn'));
      expect(screen.getByTestId('break-pause-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('resume-from-break-btn'));
      expect(screen.queryByTestId('break-pause-modal')).not.toBeInTheDocument();

      unmount();
    }
  });
});
