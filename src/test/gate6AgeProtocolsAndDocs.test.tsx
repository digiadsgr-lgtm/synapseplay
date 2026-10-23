import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AGE_BAND_PROTOCOLS, DEVICE_STRATEGY_SUMMARY } from '../data/ageProtocols';
import { loadSettings, wipeAllLocalData } from '../db/database';

describe('Gate 6 — Age-Graded Protocols (4-12 Years), Tablet 10-11" Kiosk Strategy & Metacognitive Prompt', () => {
  beforeEach(async () => {
    await wipeAllLocalData();
  });

  it('defines all 5 Age-Graded Protocols (4-5, 5-6, 6-8, 8-10, 10-12) with exact session splits totaling recommended minutes', () => {
    expect(AGE_BAND_PROTOCOLS).toHaveLength(5);
    for (const proto of AGE_BAND_PROTOCOLS) {
      expect(
        proto.digitalMinutes + proto.physicalMinutes + proto.smoothLandingMinutes
      ).toBe(proto.recommendedTotalMinutes);
    }
    expect(DEVICE_STRATEGY_SUMMARY.titleEl).toContain('Tablet 10–11"');
  });

  it('allows parents/therapists to select an Age Band in Parent Dashboard and automatically applies its Session Split', async () => {
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <App />
      </MemoryRouter>
    );

    // Unlock Parent Arithmetic Gate (7 + 8 = 15)
    fireEvent.click(screen.getByTestId('parent-gate-option-15'));
    await waitFor(() => {
      expect(screen.getByTestId('parent-dashboard-page')).toBeInTheDocument();
    });

    // Verify Device Strategy section (Tablet 10-11" Kiosk Mode vs Mobile vs PC) is displayed
    expect(screen.getByTestId('device-strategy-section')).toHaveTextContent(
      'Tablet 10–11"'
    );

    // Select Age Band 8-10 (18m total: 10' Digital + 5' Physical + 3' Smooth Landing)
    fireEvent.click(screen.getByTestId('age-band-btn-8-10'));
    await waitFor(async () => {
      const saved = await loadSettings();
      expect(saved.ageBand).toBe('8-10');
      expect(saved.sessionLimitMinutes).toBe(18);
      expect(saved.warningWindowMinutes).toBe(3);
    });

    expect(screen.getByTestId('active-age-protocol-summary')).toHaveTextContent(
      "Split 10' Ψηφιακό + 5' Φυσική Δράση + 3' Smooth Landing"
    );
  });

  it('displays the Metacognitive Self-Observation Prompt («Τι σε βοήθησε περισσότερο σήμερα;») upon activity completion', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={['/activity/01-visual-search']}>
        <App />
      </MemoryRouter>
    );

    // Complete all 3 rounds of Activity 01
    for (let r = 1; r <= 3; r++) {
      fireEvent.click(screen.getByTestId('search-item-target'));
      vi.advanceTimersByTime(450);
    }

    expect(screen.getByTestId('activity-complete-screen')).toBeInTheDocument();
    expect(screen.getByTestId('metacognitive-reflection-box')).toBeInTheDocument();

    const optTime = screen.getByTestId('metacognitive-opt-time');
    fireEvent.click(optTime);
    expect(optTime).toHaveAttribute('aria-pressed', 'true');

    vi.useRealTimers();
  });
});
