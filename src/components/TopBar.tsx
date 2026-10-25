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
    <header className="w-full bg-sand-light border-b-2 border-sand-dark relative lg:sticky lg:top-0 z-30">
      <SmoothLandingWarningBanner />
      <div className="max-w-6xl mx-auto px-2.5 py-1.5 sm:px-4 sm:py-2 flex flex-wrap items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Brand Logo & Website Home Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleReturnToChild}
            data-testid="nav-home-btn"
            aria-label={isChildHubRoute ? 'Επιστροφή στην Αρχική Σελίδα' : 'Αρχική Οθόνη Παιδιού'}
            title={isChildHubRoute ? 'Επιστροφή στην Αρχική Σελίδα (synapseplay.gr)' : 'Επιστροφή στα Παιχνίδια (/app)'}
            className="touch-target px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold flex items-center gap-1.5 sm:gap-2 hover:bg-sage hover:text-white transition-colors"
          >
            <SynapsePlayLogoMark sizeClassName="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl" />
            <span className="text-sm sm:text-base md:text-lg">SynapsePlay</span>
          </button>

          <button
            type="button"
            onClick={handleGoToWebsiteHome}
            data-testid="nav-website-home-btn"
            aria-label="Επιστροφή στην Αρχική Σελίδα Ιστότοπου"
            title="Επιστροφή στην Αρχική Σελίδα (Παρουσίαση)"
            className="touch-target px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white border-2 border-charcoal/25 text-charcoal font-extrabold text-xs sm:text-sm flex items-center gap-1 hover:bg-sand-dark transition-colors"
          >
            <span aria-hidden="true">🏠</span>
            <span className="hidden sm:inline">Αρχική Σελίδα</span>
          </button>
        </div>

        {/* Center: Compact Smooth Landing Ring */}
        <SmoothLandingRing />

        {/* Right: Beginner Help, Child Break/Pause & Accidental-Access Gated Parent Area */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowBeginnerGuide(true)}
            data-testid="open-beginner-guide-btn"
            aria-label="Οδηγός Χρήσης για Αρχάριους"
            title="Πώς λειτουργεί η εφαρμογή σε 3 απλά βήματα"
            className="touch-target px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-sage-surface border-2 border-sage text-charcoal font-extrabold flex items-center gap-1 hover:bg-sage hover:text-white transition-colors"
          >
            <span className="text-base sm:text-lg" aria-hidden="true">🧭</span>
            <span className="text-[11px] sm:text-xs md:text-sm">Οδηγός</span>
          </button>

          <button
            type="button"
            onClick={() => setBreakActive(true)}
            data-testid="break-pause-btn"
            aria-label="Διάλειμμα και Παύση"
            className="touch-target px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-surface border-2 border-slate text-charcoal font-bold flex items-center gap-1 sm:gap-2 hover:bg-slate hover:text-white transition-colors"
          >
            <span className="text-base sm:text-xl" aria-hidden="true">⏸️</span>
            <span className="text-xs sm:text-sm md:text-base">Διάλειμμα</span>
          </button>

          {isParentRoute ? (
            <button
              type="button"
              onClick={handleReturnToChild}
              data-testid="topbar-back-to-child-btn"
              className="touch-target px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-sage-dark text-white font-bold text-xs sm:text-sm flex items-center gap-1.5"
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
              className="touch-target px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-white border-2 border-charcoal/30 text-charcoal font-bold flex items-center gap-1 hover:bg-sand-dark"
            >
              <span className="text-base sm:text-lg" aria-hidden="true">🔒</span>
              <span className="text-xs sm:text-sm md:text-base">Γονείς</span>
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
