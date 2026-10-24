import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SmoothLandingRing, SmoothLandingWarningBanner } from './SmoothLandingRing';
import { ParentGateModal } from './ParentGateModal';
import { BeginnerQuickStartModal } from './BeginnerQuickStartModal';
import { SynapsePlayLogoMark } from './SynapsePlayLogoMark';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreakActive, setParentUnlocked } = useApp();
  const [showParentGate, setShowParentGate] = useState(false);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(false);

  const isParentRoute = location.pathname.startsWith('/parent');
  const isChildHubRoute = location.pathname === '/app';

  const handleReturnToChild = () => {
    setParentUnlocked(false);
    if (isChildHubRoute) {
      navigate('/');
    } else {
      navigate('/app');
    }
  };

  const handleGoToWebsiteHome = () => {
    setParentUnlocked(false);
    navigate('/');
  };

  return (
    <header className="w-full bg-sand-light border-b-2 border-sand-dark sticky top-0 z-30">
      <SmoothLandingWarningBanner />
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Logo & Website Home Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReturnToChild}
            data-testid="nav-home-btn"
            aria-label={isChildHubRoute ? 'Επιστροφή στην Αρχική Σελίδα' : 'Αρχική Οθόνη Παιδιού'}
            title={isChildHubRoute ? 'Επιστροφή στην Αρχική Σελίδα (synapseplay.gr)' : 'Επιστροφή στα Παιχνίδια (/app)'}
            className="touch-target px-3.5 py-2 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold flex items-center gap-2 hover:bg-sage hover:text-white transition-colors"
          >
            <SynapsePlayLogoMark sizeClassName="w-9 h-9 rounded-xl" />
            <span className="text-base md:text-lg">SynapsePlay</span>
          </button>

          <button
            type="button"
            onClick={handleGoToWebsiteHome}
            data-testid="nav-website-home-btn"
            aria-label="Επιστροφή στην Αρχική Σελίδα Ιστότοπου"
            title="Επιστροφή στην Αρχική Σελίδα (Παρουσίαση)"
            className="touch-target px-3.5 py-2 rounded-2xl bg-white border-2 border-charcoal/25 text-charcoal font-extrabold text-xs md:text-sm flex items-center gap-1.5 hover:bg-sand-dark transition-colors"
          >
            <span aria-hidden="true">🏠</span>
            <span>Αρχική Σελίδα</span>
          </button>
        </div>

        {/* Center: Smooth Landing Ring */}
        <SmoothLandingRing />

        {/* Right: Beginner Help, Child Break/Pause & Accidental-Access Gated Parent Area */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBeginnerGuide(true)}
            data-testid="open-beginner-guide-btn"
            aria-label="Οδηγός Χρήσης για Αρχάριους"
            title="Πώς λειτουργεί η εφαρμογή σε 3 απλά βήματα"
            className="touch-target px-3.5 py-2 rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold flex items-center gap-1.5 hover:bg-sage hover:text-white transition-colors"
          >
            <span className="text-lg" aria-hidden="true">🧭</span>
            <span className="text-xs md:text-sm">Πώς Λειτουργεί</span>
          </button>

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

      {showBeginnerGuide && (
        <BeginnerQuickStartModal onClose={() => setShowBeginnerGuide(false)} />
      )}
    </header>
  );
};
