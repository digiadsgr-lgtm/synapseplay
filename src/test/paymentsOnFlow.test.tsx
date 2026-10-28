import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { generateChildCode } from '../utils/childCode';
import { MemoryRouter } from 'react-router-dom';

// Simulate production with payments ON (VITE_ENABLE_MONETIZATION=true) for this file only
vi.mock('../config/monetization.config', async (orig) => {
  const real = (await orig()) as typeof import('../config/monetization.config');
  const cfg = { ...real.MONETIZATION_CONFIG, isMonetizationEnabled: true };
  return { ...real, MONETIZATION_CONFIG: cfg, ENABLE_PAYWALL: true, default: cfg };
});

import App from '../App';
import { saveSettings } from '../db/database';

const renderRoute = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('Payments ON (production simulation)', () => {
  it('new device → trial starts automatically and games are open', async () => {
    renderRoute('/activity/01-visual-search');
    await waitFor(() => {
      expect(screen.getByTestId('shared-activity-runner')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('access-locked-screen')).not.toBeInTheDocument();
  });

  it('trial over and no licence → calm lock screen instead of the game', async () => {
    await saveSettings({
      trialStartedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      licenseTokens: [],
    });
    renderRoute('/activity/01-visual-search');
    await waitFor(() => {
      expect(screen.getByTestId('access-locked-screen')).toBeInTheDocument();
    });
    expect(screen.getByTestId('access-locked-parent-btn')).toBeInTheDocument();
  });

  it('Stripe buttons are live and demo plan buttons are hidden', async () => {
    renderRoute('/parent');
    const gate = await screen.findByTestId('parent-gate-question');
    const expr = (gate.textContent || '')
      .replace('Πόσο κάνει', '')
      .replace(';', '')
      .replace('×', '*')
      .replace('−', '-');
    // eslint-disable-next-line no-new-func
    const answer = Function(`return (${expr})`)();
    screen.getByTestId(`parent-gate-option-${answer}`).click();
    await waitFor(() => {
      expect(screen.getByTestId('subscription-management-section')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stripe-b2b-checkout-link')).toHaveAttribute(
      'href',
      expect.stringContaining('https://buy.stripe.com/')
    );
    expect(screen.queryByTestId('simulate-b2b-plan-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('subscription-trial-info')).toBeInTheDocument();

    // Οικογενειακό: ΧΩΡΙΣ κωδικό παιδιού δεν ανοίγει η πληρωμή, ούτε υπάρχει μηνιαίο
    expect(screen.queryByTestId('stripe-family-monthly-checkout-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('stripe-family-checkout-link')).toHaveAttribute('data-checkout-disabled', 'true');
    expect(screen.getByTestId('stripe-extra-profile-checkout-link')).toHaveAttribute('data-checkout-disabled', 'true');

    const input = screen.getByTestId('child-code-input');
    fireEvent.change(input, { target: { value: 'K7QM-4HXA-0' } });
    fireEvent.blur(input);
    expect(screen.getByTestId('child-code-status')).toHaveTextContent('0, 1, O ή I');
    expect(screen.getByTestId('stripe-family-checkout-link')).toHaveAttribute('data-checkout-disabled', 'true');

    const code = generateChildCode('K7QM');
    fireEvent.change(input, { target: { value: code.toLowerCase() } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByTestId('stripe-family-checkout-link')).toHaveAttribute(
        'href',
        expect.stringContaining(`client_reference_id=${code}`)
      );
    });
    expect(screen.getByTestId('stripe-extra-profile-checkout-link')).toHaveAttribute(
      'href',
      expect.stringContaining(`client_reference_id=${code}`)
    );
    // ο κωδικός μένει στο προφίλ → εμφανίζεται το κουμπί «Πρόοδος για τον θεραπευτή»
    await waitFor(() => {
      expect(screen.getByTestId('share-progress-section')).toHaveTextContent(code);
    });
  });
});
