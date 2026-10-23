import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SmoothLandingRing, SmoothLandingWarningBanner } from './SmoothLandingRing';
import { ParentGateModal } from './ParentGateModal';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreakActive, setParentUnlocked } = useApp();
  const [showParentGate, setShowParentGate] = useState(false);

  const isParentRoute = location.pathname.startsWith('/parent');

  const handleReturnToChild = () => {
    setParentUnlocked(false);
    navigate('/');
  };

  return (
    <header className="w-full bg-sand-light border-b-2 border-sand-dark sticky top-0 z-30">
      <SmoothLandingWarningBanner />
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Home & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReturnToChild}
            data-testid="nav-home-btn"
            aria-label="Αρχική Οθόνη Παιδιού"
            className="touch-target px-4 py-2 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold flex items-center gap-2 hover:bg-sage hover:text-white transition-colors"
          >
            <span className="text-2xl" aria-hidden="true">🌱</span>
            <span className="text-base md:text-lg">SynapsePlay</span>
          </button>
        </div>

        {/* Center: Smooth Landing Ring */}
        <SmoothLandingRing />

        {/* Right: Child Break/Pause & Accidental-Access Gated Parent Area */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBreakActive(true)}
            data-testid="break-pause-btn"
            aria-label="Διάλειμμα και Παύση"
            className="touch-target px-4 py-2 rounded-2xl bg-slate-surface border-2 border-slate text-charcoal font-bold flex items-center gap-2 hover:bg-slate hover:text-white transition-colors"
          >
            <span className="text-xl" aria-hidden="true">⏸️</span>
            <span className="text-sm md:text-base">Διάλειμμα</span>
          </button>

          {isParentRoute ? (
            <button
              type="button"
              onClick={handleReturnToChild}
              data-testid="topbar-back-to-child-btn"
              className="touch-target px-4 py-2 rounded-2xl bg-sage-dark text-white font-bold flex items-center gap-2"
            >
              <span aria-hidden="true">🧒</span>
              <span>Πίσω στο Παιδί</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowParentGate(true)}
              data-testid="open-parent-gate-btn"
              aria-label="Πίνακας Γονέων"
              className="touch-target px-4 py-2 rounded-2xl bg-white border-2 border-charcoal/30 text-charcoal font-bold flex items-center gap-1.5 hover:bg-sand-dark"
            >
              <span className="text-lg" aria-hidden="true">🔒</span>
              <span className="text-sm md:text-base">Γονείς</span>
            </button>
          )}
        </div>
      </div>

      {showParentGate && (
        <ParentGateModal
          onSuccess={() => {
            setShowParentGate(false);
            setParentUnlocked(true);
            navigate('/parent');
          }}
          onCancel={() => setShowParentGate(false)}
        />
      )}
    </header>
  );
};
