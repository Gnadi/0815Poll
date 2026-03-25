import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'

// Firebase and all auth-dependent code is deferred inside PrivateSection
const PrivateSection = lazy(() => import('./PrivateSection'))

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" />
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            {/* Landing page: no Firebase, no auth — renders immediately */}
            <Route path="/" element={<LandingPage />} />
            {/* All other routes: lazy-load Firebase + auth stack on demand */}
            <Route
              path="/*"
              element={
                <Suspense fallback={<Spinner />}>
                  <PrivateSection />
                </Suspense>
              }
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
