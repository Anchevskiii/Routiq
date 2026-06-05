import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { App } from '@/app/App'
import { ThemeProvider } from '@/hooks/useTheme'
import './index.css'
import './styles/planner.css'

// Intercept console warnings and errors to filter out third-party/external platform noises
const originalWarn = console.warn
const originalError = console.error

console.warn = (...args: unknown[]) => {
  const message = args.map(String).join(' ')
  if (message.includes('google.maps.places.Autocomplete') || message.includes('PlaceAutocompleteElement')) {
    return
  }
  if (message.includes('React Router Future Flag Warning')) {
    return
  }
  originalWarn.apply(console, args)
}

console.error = (...args: unknown[]) => {
  const message = args.map(String).join(' ')
  if (message.includes('gen_204') || message.includes('csp_test') || message.includes('ERR_BLOCKED_BY_CLIENT')) {
    return
  }
  originalError.apply(console, args)
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
