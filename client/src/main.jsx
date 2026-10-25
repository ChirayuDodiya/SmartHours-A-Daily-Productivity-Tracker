import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyTheme, getInitialTheme } from './utils/theme'

// Initialize theme safely so strict privacy/incognito modes never prevent root mounting
try {
  applyTheme(getInitialTheme())
} catch {
  // Graceful fallback
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
