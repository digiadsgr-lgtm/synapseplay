import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Shown in place of a game when payments are ON, the 14-day trial is over and there is
 * no valid licence. Calm, non-punitive, child-friendly; profiles and history are kept.
 */
export const AccessLockedScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <main className="max-w-2xl mx-auto px-4 py-10" data-testid="access-locked-screen">
      <section className="bg-sand-light border-4 border-sage rounded-3xl p-8 text-center space-y-5 shadow-sm">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sage-surface border-4 border-sage text-5xl">
          🌿
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal">
          Τα παιχνίδια ξεκουράζονται για λίγο
        </h1>
        <p className="text-lg text-charcoal-muted">
          Ζήτησε από τον γονιό σου να μπει στην Περιοχή Γονέων.
        </p>
        <p className="text-sm text-charcoal-muted">
          Γονέα: η δωρεάν δοκιμή 14 ημερών ολοκληρώθηκε. Τα προφίλ και η πρόοδος του παιδιού είναι
          αποθηκευμένα — ενεργοποιήστε μια συνδρομή για να συνεχίσετε.
        </p>
        <button
          type="button"
          data-testid="access-locked-parent-btn"
          onClick={() => navigate('/parent')}
          className="touch-target px-6 py-3 rounded-2xl bg-white border-2 border-slate text-charcoal font-extrabold text-lg inline-flex items-center gap-2 hover:bg-slate-surface"
        >
          <span aria-hidden="true">🔒</span>
          <span>Περιοχή Γονέων</span>
        </button>
      </section>
    </main>
  );
};

export default AccessLockedScreen;
