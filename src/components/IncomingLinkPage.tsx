import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { captureIncomingLink, peekIncoming } from '../utils/incomingLinks';

/**
 * /plan και /receive: κρατά τα δεδομένα του συνδέσμου και πηγαίνει στην Περιοχή Γονέων,
 * όπου (μετά την «πύλη γονιού») γίνεται η αποδοχή ή η εισαγωγή.
 */
export const IncomingLinkPage: React.FC<{ kind: 'plan' | 'progress' }> = ({ kind }) => {
  const navigate = useNavigate();
  useEffect(() => {
    captureIncomingLink();
    const hasData = peekIncoming(kind) !== null;
    navigate(hasData ? `/parent?incoming=${kind}` : '/parent', { replace: true });
  }, [kind, navigate]);
  return (
    <main className="min-h-[50vh] flex items-center justify-center text-lg font-bold text-charcoal" role="status">
      {kind === 'plan' ? '📋 Άνοιγμα προγράμματος…' : '📥 Άνοιγμα προόδου…'}
    </main>
  );
};

export default IncomingLinkPage;
