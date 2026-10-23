import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { runPaletteContrastAudit } from '../utils/accessibilityAudit';
import { setTodayUsageSeconds, wipeAllLocalData } from '../db/database';

function renderAtRoute(route: string = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe('Gate 5 — Module 13 Smooth Landing, WCAG 2.2 AA Audit & Page-Refresh Recovery', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  it('Module 13 (Smooth Landing): transitions visual ring color and renders 2-minute warning banner & resting avatar overlay without stressful digits', async () => {
    // 1. Normal state (0s elapsed out of 20m = 1200s)
    const { unmount } = renderAtRoute('/');
    const ring = screen.getByTestId('smooth-landing-ring');
    expect(ring).toHaveTextContent('🌿');
    expect(screen.queryByTestId('smooth-landing-warning-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('smooth-landing-overlay')).not.toBeInTheDocument();
    unmount();

    // 2. 2-Minute Advance Warning Window (1090s elapsed -> 110s remaining <= 120s warning threshold)
    await setTodayUsageSeconds(1090);
    const { unmount: unmountWarn } = renderAtRoute('/');
    await waitFor(() => {
      expect(screen.getByTestId('smooth-landing-warning-banner')).toBeInTheDocument();
    });
    expect(screen.getByTestId('smooth-landing-warning-banner')).toHaveTextContent(
      'Το τάμπλετ θα ξεκουραστεί σύντομα!'
    );
    expect(screen.getByTestId('smooth-landing-ring')).toHaveTextContent('🌅');
    unmountWarn();

    // 3. Session Depleted (1200s elapsed -> 0s remaining)
    await setTodayUsageSeconds(1200);
    renderAtRoute('/');
    await waitFor(() => {
      expect(screen.getByTestId('smooth-landing-overlay')).toBeInTheDocument();
    });
    expect(screen.getByTestId('smooth-landing-overlay')).toHaveTextContent(
      'Η μασκότ μας ξεκουράζεται τώρα!'
    );

    // Parent can unlock +10 minutes via the Arithmetic Gate
    fireEvent.click(screen.getByTestId('smooth-landing-parent-unlock'));
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));
    await waitFor(() => {
      expect(screen.queryByTestId('smooth-landing-overlay')).not.toBeInTheDocument();
    });
  });

  it('WCAG 2.2 AA Audit: verifies contrast ratios >= 4.5:1, .touch-target (>=64x64px) on interactive buttons, and keyboard focus/Escape handling', () => {
    const contrastResults = runPaletteContrastAudit();
    expect(contrastResults.every((r) => r.passes)).toBe(true);

    renderAtRoute('/activity/01-visual-search');

    // Every button on the screen must carry the .touch-target class guaranteeing >=64x64px minimum dimensions
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(5);
    for (const btn of buttons) {
      expect(
        btn.classList.contains('touch-target'),
        `Button "${btn.textContent}" missing .touch-target class`
      ).toBe(true);
    }

    // Keyboard focus & Escape key triggers Break/Pause modal
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('break-pause-modal')).toBeInTheDocument();
  });

  it('recovers active round progress, hint level, and session timer state after a page refresh', async () => {
    // Set elapsed usage to 1095s (inside 2-minute Smooth Landing warning window)
    await setTodayUsageSeconds(1095);

    const { unmount } = renderAtRoute('/activity/01-visual-search');
    await waitFor(() => {
      expect(screen.getByTestId('smooth-landing-warning-banner')).toBeInTheDocument();
    });

    // Complete Round 1 -> advances to Round 2
    fireEvent.click(screen.getByTestId('search-item-target'));
    expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');

    // Activate Hint Level 1 on Round 2
    fireEvent.click(screen.getByTestId('hint-ladder-btn'));
    expect(screen.getByTestId('hint-ladder-btn')).toHaveTextContent('Περισσότερη Βοήθεια (2/2)');

    // Simulate browser page refresh by unmounting and remounting App at the same URL
    unmount();
    renderAtRoute('/activity/01-visual-search');

    await waitFor(() => {
      expect(screen.getByTestId('smooth-landing-warning-banner')).toBeInTheDocument();
    });
    // Round 2 and Hint Level 1 are seamlessly recovered!
    expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');
    expect(screen.getByTestId('hint-ladder-btn')).toHaveTextContent('Περισσότερη Βοήθεια (2/2)');
  });
});
