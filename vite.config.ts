import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

const fromRoot = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    // Production: code-split route pages
    alias: { '@route-pages': fromRoot('./src/routes/lazyPages.tsx') },
  },
  plugins: [
    react(),
    // Offline support for tablets in Guided Access / kiosk mode
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // keep the existing public/manifest.webmanifest
      workbox: {
        // Pre-cache the app shell and ALL route chunks so every game works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}', 'brand-kit/png/favicon-512x512.png'],
        globIgnores: ['brand-kit/**/*.svg'], // large marketing assets are not needed offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/brand-kit\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    // Tests: synchronous route pages (no Suspense waiting)
    alias: { '@route-pages': fromRoot('./src/routes/eagerPages.tsx') },
  },
});
