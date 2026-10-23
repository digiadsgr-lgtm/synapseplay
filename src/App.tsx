import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { BreakPauseModal } from './components/BreakPauseModal';
import { SmoothLandingDepletedOverlay } from './components/SmoothLandingRing';
import { ChildHubPage } from './pages/ChildHubPage';
import { CategoryPage } from './pages/CategoryPage';
import { ActivityPage } from './pages/ActivityPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';

const AppShell: React.FC = () => {
  const { isBreakActive, setBreakActive } = useApp();

  // Global Escape key listener to toggle Break/Pause cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBreakActive(!isBreakActive);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBreakActive, setBreakActive]);

  return (
    <div className="min-h-screen flex flex-col bg-sand text-charcoal">
      <TopBar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<ChildHubPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/activity/:activityId" element={<ActivityPage />} />
          <Route path="/parent" element={<ParentDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BreakPauseModal />
      <SmoothLandingDepletedOverlay />
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
