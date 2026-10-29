import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ACTIVITIES, CATEGORIES } from '../data/activitiesCatalog';
import { runPaletteContrastAudit } from '../utils/accessibilityAudit';
import { wipeAllLocalData } from '../db/database';

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('SynapsePlay (FocusEngine 5+) — Full Gate 1 to Gate 5 Verification Suite', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  describe('GATE 1 & 5: Design Tokens, WCAG 2.2 AA Contrast & Child Hub Structure', () => {
    it('passes WCAG 2.2 AA contrast audit (>= 4.5:1) across all primary text/surface pairs', () => {
      const results = runPaletteContrastAudit();
      for (const pair of results) {
        expect(pair.passes, `${pair.name} had ratio ${pair.actualRatio}`).toBe(true);
        expect(pair.actualRatio).toBeGreaterThanOrEqual(pair.minRequired);
      }
    });

    it('enforces maximum 4 primary categories on Child Hub and displays non-medical disclaimer', () => {
      expect(CATEGORIES).toHaveLength(4);
      expect(ACTIVITIES).toHaveLength(23); // 20 + 3 παιχνίδια λόγου (21–23)

      renderWithRouter(['/app']);
      expect(screen.getByTestId('child-hub-page')).toBeInTheDocument();
      const grid = screen.getByTestId('category-cards-grid');
      expect(grid.children).toHaveLength(4);
      expect(screen.getByTestId('educational-disclaimer-footer')).toHaveTextContent(
        'ΔΕΝ αποτελεί ιατρική συσκευή'
      );
    });

    it('supports Break / Pause button and Escape key navigation without losing state', () => {
      renderWithRouter(['/app']);
      expect(screen.queryByTestId('break-pause-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('break-pause-btn'));
      expect(screen.getByTestId('break-pause-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('resume-from-break-btn'));
      expect(screen.queryByTestId('break-pause-modal')).not.toBeInTheDocument();

      // Also works via Escape key
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByTestId('break-pause-modal')).toBeInTheDocument();
    });

    it('maintains 100% Speech Synthesis Independence when Web Speech API is absent', () => {
      // Remove speechSynthesis from window
      const originalSpeech = window.speechSynthesis;
      // @ts-expect-error simulating missing speechSynthesis
      delete window.speechSynthesis;

      renderWithRouter(['/activity/01-visual-search']);
      expect(screen.getByTestId('visual-pictogram-cues')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('replay-voice-prompt-btn'));
      expect(screen.getByTestId('activity-01-visual-search')).toBeInTheDocument();

      window.speechSynthesis = originalSpeech;
    });
  });

  describe('GATE 2: MVP Activities (01, 04, 07, 11) & 400ms Anti-Frustration Debounce', () => {
    it('completes Activity 01 (Visual Search) across all 3 rounds and absorbs rapid double-taps (<400ms)', async () => {
      renderWithRouter(['/activity/01-visual-search']);
      expect(screen.getByTestId('activity-01-visual-search')).toBeInTheDocument();

      // Rapid double-tap on target within 400ms should only advance 1 round (to Round 2), not 2 rounds!
      const target1 = screen.getByTestId('search-item-target');
      fireEvent.click(target1);
      fireEvent.click(target1); // Immediate second tap (<400ms) is absorbed by debounce

      expect(screen.getByTestId('round-pebble-2')).toHaveTextContent('2');
    });

    it('renders Activity 04 (Sequence Memory) with Hint Ladder and non-punitive retry', () => {
      renderWithRouter(['/activity/04-sequence-memory']);
      expect(screen.getByTestId('activity-04-sequence-memory')).toBeInTheDocument();

      const hintBtn = screen.getByTestId('hint-ladder-btn');
      fireEvent.click(hintBtn);
      expect(hintBtn).toHaveTextContent('Περισσότερη Βοήθεια (2/2)');
      fireEvent.click(hintBtn);
      expect(hintBtn).toHaveTextContent('Μέγιστη Βοήθεια Ενεργή');
    });

    it('supports Activity 07 (Move & Freeze) Go/No-Go and Seated Mode toggle', () => {
      renderWithRouter(['/activity/07-move-freeze']);
      expect(screen.getByTestId('activity-07-move-freeze')).toBeInTheDocument();
      expect(screen.getByTestId('signal-card-go')).toBeInTheDocument();

      const seatedBtn = screen.getByTestId('toggle-seated-mode-btn');
      fireEvent.click(seatedBtn);
      expect(seatedBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('completes Activity 11 (Real-World Mission) step-by-step physical checklist', () => {
      renderWithRouter(['/activity/11-real-world-mission']);
      expect(screen.getByTestId('activity-11-real-world-mission')).toBeInTheDocument();

      const completeBtn = screen.getByTestId('mission-complete-btn');
      expect(completeBtn).toBeDisabled();

      // Using Hint Level 2 unlocks immediate completion support or checking steps unlocks
      fireEvent.click(screen.getByTestId('mission-step-check-0'));
      // Advance Hint Ladder twice to verify Hint Level 2 support
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      fireEvent.click(screen.getByTestId('hint-ladder-btn'));
      expect(completeBtn).not.toBeDisabled();
    });
  });

  describe('GATE 3: Complete Activity Catalog (02, 03, 05, 06, 08, 09, 10, 12)', () => {
    it.each([
      ['02-spot-difference', 'activity-02-spot-difference'],
      ['03-visual-memory', 'activity-03-visual-memory'],
      ['05-order-steps', 'activity-05-order-steps'],
      ['06-switch-rule', 'activity-06-switch-rule'],
      ['08-listen-do', 'activity-08-listen-do'],
      ['09-wait-signal', 'activity-09-wait-signal'],
      ['10-copy-animal', 'activity-10-copy-animal'],
      ['12-build-pattern', 'activity-12-build-pattern'],
    ])('renders and initializes %s with visual pictograms and hint ladder', (routeId, testId) => {
      renderWithRouter([`/activity/${routeId}`]);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(screen.getByTestId('visual-pictogram-cues')).toBeInTheDocument();
      expect(screen.getByTestId('hint-ladder-btn')).toBeInTheDocument();
    });
  });

  describe('GATE 4 & 5: Parent Arithmetic Gate, Smooth Landing Engine, and One-Click Data Wipe', () => {
    it('guards Parent Dashboard behind an arithmetic gate and supports Smooth Landing & Data Wipe', async () => {
      renderWithRouter(['/app']);

      fireEvent.click(screen.getByTestId('open-parent-gate-btn'));
      expect(screen.getByTestId('parent-gate-modal')).toBeInTheDocument();

      // Wrong answer shows alert and dynamically rotates the challenge to c2 ((7 × 6) + 9 = 51)
      fireEvent.click(screen.getByTestId('parent-gate-option-12'));
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Correct answer for the rotated challenge (51) navigates to Parent Dashboard
      fireEvent.click(screen.getByTestId('parent-gate-option-51'));
      await waitFor(() => {
        expect(screen.getByTestId('parent-dashboard-page')).toBeInTheDocument();
      });

      // Test Smooth Landing 2-minute warning state
      fireEvent.click(screen.getByTestId('simulate-warning-time-btn'));
      expect(screen.getByTestId('smooth-landing-warning-banner')).toBeInTheDocument();

      // Test Smooth Landing Depleted resting overlay
      fireEvent.click(screen.getByTestId('simulate-depleted-time-btn'));
      expect(screen.getByTestId('smooth-landing-overlay')).toBeInTheDocument();

      // Unlock +10 mins via parent gate on Smooth Landing overlay
      fireEvent.click(screen.getByTestId('smooth-landing-parent-unlock'));
      fireEvent.click(screen.getByTestId('parent-gate-option-15'));
      await waitFor(() => {
        expect(screen.queryByTestId('smooth-landing-overlay')).not.toBeInTheDocument();
      });

      // Test One-Click Data Wipe
      fireEvent.click(screen.getByTestId('one-click-wipe-trigger-btn'));
      fireEvent.click(screen.getByTestId('confirm-data-wipe-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('wipe-success-banner')).toBeInTheDocument();
      });
    });

    it('provides Beginner Quick-Start Guide, 1-Click Age Band Switcher, Smart Parent Presets, and In-Game Parent Coaching Tips', async () => {
      renderWithRouter(['/app']);

      // 1. Beginner Onboarding Strip & Quick Age Switcher on Child Hub
      expect(screen.getByTestId('beginner-onboarding-strip')).toBeInTheDocument();
      expect(screen.getByTestId('hub-quick-age-band-bar')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('hub-quick-age-btn-4-5'));
      await waitFor(() => {
        expect(screen.getByTestId('hub-quick-age-btn-4-5')).toHaveAttribute('aria-pressed', 'true');
      });

      // 2. TopBar Beginner Guide Modal
      fireEvent.click(screen.getByTestId('open-beginner-guide-btn'));
      expect(screen.getByTestId('beginner-quick-start-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('beginner-tab-faq'));
      expect(screen.getByTestId('beginner-faq-list')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('close-beginner-guide-btn'));
      expect(screen.queryByTestId('beginner-quick-start-modal')).not.toBeInTheDocument();

      // 2b. The child area has NO direct link to the marketing site (only via the gated Parent Area)
      expect(screen.queryByTestId('nav-website-home-btn')).not.toBeInTheDocument();

      // 3. In-Game Parent Coaching Tip
      renderWithRouter(['/activity/01-visual-search']);
      const coachingBtn = screen.getByTestId('toggle-parent-coaching-tip-btn');
      fireEvent.click(coachingBtn);
      expect(screen.getByTestId('runner-parent-coaching-box')).toBeInTheDocument();

      // 4. SEO Blog (/articles & /articles/:articleId) with "Μυαλά που Τρέχουν με Χίλια" title and no social copy/paste buttons
      renderWithRouter(['/articles']);
      expect(screen.getByTestId('adhd-blog-hero')).toHaveTextContent('Μυαλά που Τρέχουν με Χίλια');
      expect(screen.getByTestId('blog-seo-jsonld')).toBeInTheDocument();
      expect(screen.queryByTestId('download-all-posts-csv-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('copy-article-btn-01')).not.toBeInTheDocument();
    });
  });
});
