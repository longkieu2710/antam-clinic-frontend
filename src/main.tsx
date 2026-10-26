import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { BaseProvider } from './components/common'
import './index.css'
import { SiteProvider } from './site/SiteProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BaseProvider>
      <QueryClientProvider client={queryClient}>
        <SiteProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SiteProvider>
      </QueryClientProvider>
    </BaseProvider>
  </StrictMode>,
)
