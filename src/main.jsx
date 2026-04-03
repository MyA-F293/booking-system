import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/Toast'
import { SettingsProvider } from './contexts/SettingsContext'
import { WeekProvider } from './contexts/WeekContext'
import { BookingModeProvider } from './contexts/BookingModeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { registerServiceWorker } from './utils/pwaHelpers'

// Debug logging
console.log('🚀 App Starting...', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  reactVersion: React.version
});

console.log('🔵 main.jsx: About to render React tree...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <SettingsProvider>
            <WeekProvider>
              <BookingModeProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </BookingModeProvider>
            </WeekProvider>
          </SettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

console.log('🔵 main.jsx: React tree rendered');