import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { wipeAllLocalData } from '../db/database';

function renderApp(initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
}

describe('Gate 2 (MVP Milestone) — Child Hub Navigation & Activities 01, 04, 07, 11', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  it('navigates from Child Hub through Category View into MVP Activity 01 and back', () => {
    renderApp('/app');
    expect(screen.getByTestId('child-hub-page')).toBeInTheDocument();

    // Open Group A: Detective Eyes
    fireEvent.click(screen.getByTestId('open-category-detective-eyes'));
    expect(screen.getByTestId('category-page-detective-eyes')).toBeInTheDocument();

    // Launch Activity 01: Visual Search
    fireEvent.click(screen.getByTestId('launch-activity-01-visual-search'));
    expect(screen.getByTestId('activity-01-visual-search')).toBeInTheDocument();

    // Navigate back to Category
    fireEvent.click(screen.getByTestId('back-to-category-btn'));
    expect(screen.getByTestId('category-page-detective-eyes')).toBeInTheDocument();

    // Navigate back to Child Hub
    fireEvent.click(screen.getByTestId('back-to-hub-btn'));
    expect(screen.getByTestId('child-hub-page')).toBeInTheDocument();
  });

  it('Activity 01 (Visual Search): supports Hint Ladder (distractor reduction), non-punitive retry, keyboard shortcuts, and full completion', () => {
    vi.useFakeTimers();
    renderApp('/activity/01-visual-search');

    // Round 1 has 6 items initially
    const grid = screen.getByTestId('visual-search-grid');
    expect(grid.children).toHaveLength(6);

    // Selecting a distractor triggers gentle non-punitive feedback without resetting or locking
    fireEvent.click(screen.getByTestId('search-item-1-1'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('Βατραχάκι');

    // Hint Level 1 -> Level 2 reduces distractors to 3 total items (2 distractors + 1 target)
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));
    expect(grid.children).toHaveLength(3);

    // Advance past 400ms debounce and select target for Round 1 -> Round 2
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('search-item-target'));
    expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');

    // Round 2 -> Round 3 via keyboard number key '4' (target is at index 3 in Round 2)
    vi.advanceTimersByTime(450);
    fireEvent.keyDown(window, { key: '4' });
    expect(screen.getByTestId('round-pebble-3')).toHaveTextContent('3');

    // Round 3 -> Completed
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('search-item-target'));
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('Activity 04 (Sequence Memory): supports non-punitive retry, hint ladder slot reveal, and full 3-round sequence completion', () => {
    vi.useFakeTimers();
    renderApp('/activity/04-sequence-memory');

    // Wait for initial demonstration to finish
    vi.advanceTimersByTime(1500);

    // Pressing wrong symbol ('wave' instead of 'sun') triggers non-punitive feedback and stays on Round 1
    fireEvent.click(screen.getByTestId('sequence-tile-wave'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('Δεν πειράζει');
    expect(screen.getByTestId('round-pebble-1')).toHaveTextContent('1');

    // Complete Round 1 sequence: ['sun', 'leaf']
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('sequence-tile-sun'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('sequence-tile-leaf'));
    expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');

    // Complete Round 2 sequence: ['leaf', 'wave', 'sun']
    vi.advanceTimersByTime(2000);
    fireEvent.click(screen.getByTestId('sequence-tile-leaf'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('sequence-tile-wave'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('sequence-tile-sun'));
    expect(screen.getByTestId('round-pebble-3')).toHaveTextContent('3');

    // Complete Round 3 sequence: ['wave', 'star', 'leaf']
    vi.advanceTimersByTime(2000);
    fireEvent.click(screen.getByTestId('sequence-tile-wave'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('sequence-tile-star'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('sequence-tile-leaf'));

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Activity 07 (Move & Freeze): handles Go/No-Go inhibition, Seated Mode alternative, Hint Level 2 isolation, and full completion', () => {
    vi.useFakeTimers();
    renderApp('/activity/07-move-freeze');

    // Round 1 is GO phase: toggling Seated Mode updates instruction text
    expect(screen.getByTestId('signal-card-go')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-seated-mode-btn'));
    expect(screen.getByTestId('move-freeze-instruction')).toHaveTextContent('Καθιστή');

    // Two rhythmic taps complete Round 1 -> Round 2 (FREEZE phase)
    fireEvent.click(screen.getByTestId('move-freeze-go-btn'));
    expect(screen.getByTestId('move-freeze-tap-counter')).toHaveTextContent('1 / 2');
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('move-freeze-go-btn'));

    // Round 2 is FREEZE phase
    expect(screen.getByTestId('signal-card-freeze')).toBeInTheDocument();

    // Impulsively tapping GO during FREEZE triggers calm feedback without locking screen
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('move-freeze-go-btn'));
    expect(screen.getByTestId('gentle-feedback-banner')).toHaveTextContent('ΣΤΟΠ');

    // Hint Level 2 hides the distractor GO button during FREEZE phase
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));
    expect(screen.queryByTestId('move-freeze-go-btn')).not.toBeInTheDocument();

    // Confirming Freeze advances to Round 3 (GO phase)
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('move-freeze-stop-btn'));
    expect(screen.getByTestId('signal-card-go')).toBeInTheDocument();

    // Complete Round 3 -> Completed
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('move-freeze-go-btn'));
    vi.advanceTimersByTime(450);
    fireEvent.click(screen.getByTestId('move-freeze-go-btn'));
    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('Activity 11 (Real-World Mission): completes all 3 physical home missions step-by-step', () => {
    vi.useFakeTimers();
    renderApp('/activity/11-real-world-mission');

    for (let round = 1; round <= 3; round++) {
      const completeBtn = screen.getByTestId('mission-complete-btn');
      expect(completeBtn).toBeDisabled();

      fireEvent.click(screen.getByTestId('mission-step-check-0'));
      vi.advanceTimersByTime(450);
      fireEvent.click(screen.getByTestId('mission-step-check-1'));
      expect(completeBtn).not.toBeDisabled();

      vi.advanceTimersByTime(450);
      fireEvent.click(completeBtn);
      vi.advanceTimersByTime(450);
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
