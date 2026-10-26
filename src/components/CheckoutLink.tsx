import React from 'react';
import { MONETIZATION_CONFIG } from '../config/monetization.config';

/**
 * Stripe checkout links are live ONLY when monetization is enabled
 * (VITE_ENABLE_MONETIZATION=true) — i.e. when a paid plan actually delivers something.
 * During the free beta the button is shown disabled with a "coming soon" note,
 * so nobody can pay for nothing (chargebacks / consumer-protection risk).
 */
export const CHECKOUT_ENABLED: boolean = MONETIZATION_CONFIG.isMonetizationEnabled;

type CheckoutLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  'data-testid'?: string;
  /** Override for tests / previews. Defaults to CHECKOUT_ENABLED. */
  enabled?: boolean;
};

export const CheckoutLink: React.FC<CheckoutLinkProps> = ({
  enabled = CHECKOUT_ENABLED,
  children,
  className,
  href,
  target,
  rel,
  ...rest
}) => {
  if (!enabled) {
    return (
      <span
        data-testid={rest['data-testid']}
        data-checkout-disabled="true"
        aria-disabled="true"
        title="Οι συνδρομές ανοίγουν μετά τη δωρεάν δοκιμαστική περίοδο"
        className={`${className ?? ''} opacity-60 cursor-not-allowed flex-col`}
      >
        {children}
        <span className="block text-[10px] font-bold">Σύντομα — μετά τη δωρεάν περίοδο</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target={target ?? '_blank'}
      rel={rel ?? 'noopener noreferrer'}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
};

export default CheckoutLink;
