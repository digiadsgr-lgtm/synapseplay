import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { reduceToTwoChoices } from '../utils/clinicalAdhdEngine';

const renderRoute = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('Review fixes (27/10)', () => {
  it('reduceToTwoChoices always leaves one correct + one wrong option', () => {
    const opts = [
      { id: 'a', ok: true },
      { id: 'b', ok: false },
      { id: 'c', ok: false },
    ];
    // Correct answer FIRST used to leave a single option (no choice at all)
    expect(reduceToTwoChoices(opts, (o) => o.ok).map((o) => o.id)).toEqual(['a', 'b']);
    const opts2 = [
      { id: 'x', ok: false },
      { id: 'y', ok: false },
      { id: 'z', ok: true },
    ];
    expect(reduceToTwoChoices(opts2, (o) => o.ok).map((o) => o.id)).toEqual(['x', 'z']);
    // Degenerate input is returned unchanged
    expect(reduceToTwoChoices([{ id: 'q', ok: true }], (o) => o.ok)).toHaveLength(1);
  });

  it('4-5 years: Emotional Theater offers a real choice (2 options)', async () => {
    renderRoute('/app');
    fireEvent.click(screen.getByTestId('hub-quick-age-btn-4-5'));
    await waitFor(() => {
      expect(screen.getByTestId('hub-quick-age-btn-4-5')).toHaveAttribute('aria-pressed', 'true');
    });
    const { unmount } = renderRoute('/activity/19-emotional-theater');
    const stage = screen.getByTestId('activity-19-emotional-theater');
    const choiceButtons = stage.querySelectorAll('button');
    expect(choiceButtons.length).toBeGreaterThanOrEqual(2);
    unmount();
  });

  it('"Διάλειμμα" pauses the game underneath and resumes it afterwards', () => {
    renderRoute('/activity/09-wait-signal');
    const runner = screen.getByTestId('shared-activity-runner');
    expect(runner).toHaveAttribute('data-runner-phase', 'ACTIVE_ROUND');
    fireEvent.click(screen.getByTestId('break-pause-btn'));
    expect(runner).toHaveAttribute('data-runner-phase', 'PAUSED');
    fireEvent.click(screen.getByTestId('resume-from-break-btn'));
    expect(runner).toHaveAttribute('data-runner-phase', 'ACTIVE_ROUND');
  });

  it('child hub shows the games first and keeps parent material in the parent zone', () => {
    renderRoute('/app');
    const welcome = screen.getByRole('heading', { level: 1 });
    const parentZone = screen.getByTestId('hub-parent-zone');
    // The greeting comes BEFORE the parent zone in document order
    expect(welcome.compareDocumentPosition(parentZone) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(parentZone).toContainElement(screen.getByTestId('beginner-onboarding-strip'));
    expect(parentZone).toContainElement(screen.getByTestId('category-everyday-benefit-pause-choose'));
    // No "difficulty" descriptions inside the child's category cards
    expect(screen.getByTestId('category-cards-grid')).not.toHaveTextContent('Στην πράξη');
  });
});
