import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import {
  getSessionLogs,
  loadSettings,
  recordSessionLog,
  wipeAllLocalData,
} from '../db/database';

function renderRoute(initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
}

const PARENTAL_CONTROL_TEST_IDS = [
  'limit-mins-btn-10',
  'limit-mins-btn-15',
  'limit-mins-btn-20',
  'limit-mins-btn-30',
  'warning-mins-btn-2',
  'warning-mins-btn-5',
  'parent-toggle-voice',
  'parent-toggle-sound',
  'parent-toggle-reduced-motion',
  'parent-toggle-seated-default',
  'one-click-wipe-trigger-btn',
  'session-logs-table',
];

describe('Gate 4 — Parent Area, Accidental-Access Gate, IndexedDB Persistence & Child Screen Isolation', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  it('guarantees zero parental settings are exposed on any child screen (Hub, Category, or Activity)', () => {
    const childRoutes = ['/', '/app', '/category/detective-eyes', '/activity/01-visual-search'];

    for (const route of childRoutes) {
      const { unmount } = renderRoute(route);
      for (const controlId of PARENTAL_CONTROL_TEST_IDS) {
        expect(
          screen.queryByTestId(controlId),
          `Expected ${controlId} NOT to be exposed on child route ${route}`
        ).not.toBeInTheDocument();
      }
      unmount();
    }
  });

  it('blocks direct URL navigation to /parent behind the accidental-access arithmetic gate and re-locks on exit', async () => {
    renderRoute('/parent');

    // Dashboard controls are NOT visible while locked
    expect(screen.getByTestId('parent-locked-barrier')).toBeInTheDocument();
    expect(screen.queryByTestId('parent-dashboard-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('one-click-wipe-trigger-btn')).not.toBeInTheDocument();

    // Incorrect arithmetic answer keeps it locked and rotates to a new challenge (c2: (7 × 6) + 9 = 51)
    fireEvent.click(screen.getByTestId('parent-gate-option-18'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('parent-dashboard-page')).not.toBeInTheDocument();

    // Correct arithmetic answer for the rotated challenge (51) unlocks the Parent Dashboard
    fireEvent.click(screen.getByTestId('parent-gate-option-51'));
    await waitFor(() => {
      expect(screen.getByTestId('parent-dashboard-page')).toBeInTheDocument();
    });

    // Returning to Child Hub re-locks the Parent Area
    fireEvent.click(screen.getByTestId('parent-back-to-child-btn'));
    expect(screen.getByTestId('child-hub-page')).toBeInTheDocument();
  });

  it('updates session limits and sound/motion preferences and persists them in IndexedDB', async () => {
    renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('parent-dashboard-page')).toBeInTheDocument();
    });

    // Change Session Limit to 15 minutes and Warning Window to 5 minutes
    fireEvent.click(screen.getByTestId('limit-mins-btn-15'));
    fireEvent.click(screen.getByTestId('warning-mins-btn-5'));

    // Toggle Reduced Motion ON and Sound OFF
    fireEvent.click(screen.getByTestId('parent-toggle-reduced-motion'));
    fireEvent.click(screen.getByTestId('parent-toggle-sound'));

    await waitFor(async () => {
      const saved = await loadSettings();
      expect(saved.sessionLimitMinutes).toBe(15);
      expect(saved.warningWindowMinutes).toBe(5);
      expect(saved.reducedMotion).toBe(true);
      expect(saved.soundEnabled).toBe(false);
    });

    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
  });

  it('displays local activity history from IndexedDB and wipes all data on One-Click Data Wipe', async () => {
    // Seed an activity session log in IndexedDB
    await recordSessionLog({
      activityId: '01-visual-search',
      activityTitleEl: 'Οπτική Αναζήτηση',
      categoryId: 'detective-eyes',
      durationSeconds: 42,
      completedRounds: 3,
      totalRounds: 3,
      hintsUsed: 1,
      impulsiveTapsAbsorbed: 2,
      seatedModeUsed: false,
    });

    const initialLogs = await getSessionLogs();
    expect(initialLogs).toHaveLength(1);

    renderRoute('/parent');
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));

    await waitFor(() => {
      expect(screen.getByTestId('session-logs-table')).toBeInTheDocument();
    });
    expect(screen.getByTestId('session-log-row-0')).toHaveTextContent('Οπτική Αναζήτηση');
    expect(screen.getByTestId('session-log-row-0')).toHaveTextContent('42 δευτ.');

    // Execute One-Click Data Wipe
    fireEvent.click(screen.getByTestId('one-click-wipe-trigger-btn'));
    fireEvent.click(screen.getByTestId('confirm-data-wipe-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('wipe-success-banner')).toBeInTheDocument();
      expect(screen.getByTestId('empty-logs-message')).toBeInTheDocument();
    });

    const wipedLogs = await getSessionLogs();
    expect(wipedLogs).toHaveLength(0);
    const resetSettings = await loadSettings();
    expect(resetSettings.sessionLimitMinutes).toBe(20);
  });
});
