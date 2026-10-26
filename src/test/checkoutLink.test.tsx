import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutLink } from '../components/CheckoutLink';

describe('CheckoutLink', () => {
  it('is disabled (no href) while monetization is off', () => {
    render(
      <CheckoutLink href="https://buy.stripe.com/x" data-testid="c" enabled={false}>
        Πληρωμή
      </CheckoutLink>
    );
    const el = screen.getByTestId('c');
    expect(el).not.toHaveAttribute('href');
    expect(el).toHaveAttribute('data-checkout-disabled', 'true');
    expect(el).toHaveTextContent('Σύντομα');
  });

  it('renders a real external link when monetization is on', () => {
    render(
      <CheckoutLink href="https://buy.stripe.com/x" data-testid="c2" enabled>
        Πληρωμή
      </CheckoutLink>
    );
    const el = screen.getByTestId('c2');
    expect(el).toHaveAttribute('href', 'https://buy.stripe.com/x');
    expect(el).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
