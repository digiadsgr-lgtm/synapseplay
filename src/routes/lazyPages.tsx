import { lazy } from 'react';

/**
 * Production route pages: each page is a separate JS chunk, loaded on demand.
 * (Vitest aliases '@route-pages' to ./eagerPages.tsx so tests stay synchronous.)
 */
export const LandingPage = lazy(() =>
  import('../features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
export const ChildHubPage = lazy(() =>
  import('../pages/ChildHubPage').then((m) => ({ default: m.ChildHubPage }))
);
export const CategoryPage = lazy(() =>
  import('../pages/CategoryPage').then((m) => ({ default: m.CategoryPage }))
);
export const ActivityPage = lazy(() =>
  import('../pages/ActivityPage').then((m) => ({ default: m.ActivityPage }))
);
export const ParentDashboardPage = lazy(() =>
  import('../pages/ParentDashboardPage').then((m) => ({ default: m.ParentDashboardPage }))
);
export const LegalCompliancePage = lazy(() =>
  import('../pages/LegalCompliancePage').then((m) => ({ default: m.LegalCompliancePage }))
);
export const ParentArticlesPage = lazy(() =>
  import('../pages/ParentArticlesPage').then((m) => ({ default: m.ParentArticlesPage }))
);
