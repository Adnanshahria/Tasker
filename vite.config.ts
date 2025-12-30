import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Use '/Tasker/' for GitHub Pages, '/' for Vercel and local dev
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  return {
    base: isGitHubPages ? '/Tasker/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      // Force single instance of React (fixes "Invalid hook call" errors)
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'recharts', 'framer-motion'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react', '@dnd-kit/core', '@dnd-kit/sortable'],
            charts: ['recharts'],
            supabase: ['@supabase/supabase-js'],
            utils: ['date-fns', 'tone']
          }
        }
      }
    }
  };
});

