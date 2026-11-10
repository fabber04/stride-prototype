import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Serves POST /api/rpc during `npm run dev`, like the Vercel function does in production.
// Uses Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set (for example in .env.local),
// otherwise an in-memory database that resets when the dev server restarts.
function devApi(env) {
  return {
    name: 'stride-dev-api',
    async configureServer(server) {
      const { createHandler } = await import('./server/handler.js');
      const useSupabase = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY;
      const store = useSupabase
        ? (await import('./server/supabase-store.js')).createSupabaseStore(env)
        : (await import('./server/memory-store.js')).createMemoryStore();
      const handle = createHandler({ store, allowReset: !useSupabase || env.STRIDE_ALLOW_RESET === 'true' });
      server.config.logger.info(`  Stride API: /api/rpc using ${useSupabase ? 'Supabase' : 'an in-memory database'}`);
      server.middlewares.use('/api/rpc', (req, res) => {
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', async () => {
          let body = {};
          try {
            body = JSON.parse(raw || '{}');
          } catch {
            // fall through with an empty body
          }
          const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;
          const out = await handle({ method: body.method, args: body.args, token });
          res.statusCode = out.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(out.body));
        });
      });
    }
  };
}

// Relative base so the build works on any static host or sub-folder.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    devApi(loadEnv(mode, process.cwd(), '')),
    VitePWA({
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
        globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg}'],
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ],
  test: {
    environment: 'node'
  }
}));
