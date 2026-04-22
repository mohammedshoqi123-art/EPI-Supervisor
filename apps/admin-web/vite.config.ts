import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Validate required environment variables in production build
  if (mode === 'production') {
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
    const missing = required.filter(key => !env[key])
    if (missing.length > 0) {
      console.warn(`\n⚠️  Missing environment variables: ${missing.join(', ')}`)
      console.warn('   The app will build but Supabase features will not work.')
      console.warn('   Set these in your .env file or CI environment.\n')
    }
  }

  return {
    plugins: [react()],
    base: '/EPI-Supervisor/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Better chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-toast',
              '@radix-ui/react-avatar',
              '@radix-ui/react-progress',
              '@radix-ui/react-switch',
              '@radix-ui/react-label',
              '@radix-ui/react-separator',
              '@radix-ui/react-scroll-area',
            ],
            'chart-vendor': ['recharts'],
            'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query', '@tanstack/react-table'],
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 800,
    },
  }
})
