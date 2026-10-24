import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { BreakPauseModal } from './components/BreakPauseModal';
import { SmoothLandingDepletedOverlay } from './components/SmoothLandingRing';
import { ChildHubPage } from './pages/ChildHubPage';
import { CategoryPage } from './pages/CategoryPage';
import { ActivityPage } from './pages/ActivityPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { LegalCompliancePage } from './pages/LegalCompliancePage';
import { ParentArticlesPage } from './pages/ParentArticlesPage';
import { LandingPage } from './features/landing/LandingPage';

const AppShell: React.FC = () => {
  const { isBreakActive, setBreakActive } = useApp();
  const location = useLocation();
  const isLandingRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/legal') ||
    location.pathname.startsWith('/articles');

  // Global Escape key listener to toggle Break/Pause cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLandingRoute) {
        setBreakActive(!isBreakActive);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBreakActive, setBreakActive, isLandingRoute]);

  return (
    <div className="min-h-screen flex flex-col bg-sand text-charcoal">
      {!isLandingRoute && <TopBar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/legal" element={<LegalCompliancePage />} />
          <Route path="/articles" element={<ParentArticlesPage />} />
          <Route path="/app" element={<ChildHubPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/activity/:activityId" element={<ActivityPage />} />
          <Route path="/parent" element={<ParentDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isLandingRoute && <BreakPauseModal />}
      {!isLandingRoute && <SmoothLandingDepletedOverlay />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;
