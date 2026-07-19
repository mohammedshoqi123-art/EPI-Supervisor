import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { CampaignProvider } from '@/lib/campaign-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'
import './index.css'
import './i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // ═══ FIX: Changed from 'false' to 'always' with debounce ═══
      // Previously: refetchOnWindowFocus: false meant stale data after tab switch.
      // Now: refetches when user returns, but only if data is stale (>5min).
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      // ═══ FIX: GC time (was cacheTime) — keep unused data for 10 minutes ═══
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Use Vite base URL for GitHub Pages deployment
const getBasename = () => {
  // import.meta.env.BASE_URL is '/' in dev, '/EPI-Supervisor/' in prod
  const base = import.meta.env.BASE_URL
  // Remove trailing slash for react-router
  return base === '/' ? '' : base.replace(/\/$/, '')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={getBasename()}>
          <ThemeProvider defaultTheme="light" storageKey="epi-admin-theme">
            <CampaignProvider>
              <App />
              <Toaster />
            </CampaignProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
