import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the build works on any static host or sub-folder.
// `vite build --mode native` skips the service worker. A service worker fights the
// WebView inside the Android and iOS shells.
export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787'
    },
    watch: {
      // The Android project writes local.properties while Gradle runs. Watching it
      // makes the dev server crash with EBUSY on Windows. The database file is the same.
      ignored: ['**/android/**', '**/ios/**', '**/server/data/**']
    }
  },
  plugins: [
    react(),
    mode !== 'native' && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Stride',
        short_name: 'Stride',
        description: 'Structured, supervised activities for young people, with guardians and mentors on board.',
        theme_color: '#F6F3ED',
        background_color: '#F6F3ED',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache the app shell and the club photos so it opens with no data.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg}']
      }
    })
  ].filter(Boolean)
}));
