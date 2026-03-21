import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PollProvider } from './contexts/PollContext'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import Home from './pages/Home'

const Auth = lazy(() => import('./pages/Auth'))
const Explore = lazy(() => import('./pages/Explore'))
const CreatePollType = lazy(() => import('./pages/CreatePollType'))
const CreateStandard = lazy(() => import('./pages/CreateStandard'))
const CreateSchedule = lazy(() => import('./pages/CreateSchedule'))
const CreateLocation = lazy(() => import('./pages/CreateLocation'))
const CreateCustom = lazy(() => import('./pages/CreateCustom'))
const CreateRanking = lazy(() => import('./pages/CreateRanking'))
const CreatePriority = lazy(() => import('./pages/CreatePriority'))
const PollVote = lazy(() => import('./pages/PollVote'))
const PollResults = lazy(() => import('./pages/PollResults'))
const Profile = lazy(() => import('./pages/Profile'))

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PollProvider>
            <ToastProvider>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" /></div>}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/create" element={<CreatePollType />} />
                <Route path="/create/standard" element={<CreateStandard />} />
                <Route path="/create/schedule" element={<CreateSchedule />} />
                <Route path="/create/location" element={<CreateLocation />} />
                <Route path="/create/custom" element={<CreateCustom />} />
                <Route path="/create/ranking" element={<CreateRanking />} />
                <Route path="/create/priority" element={<CreatePriority />} />
                <Route path="/poll/:id" element={<PollVote />} />
                <Route path="/poll/:id/results" element={<PollResults />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
              <InstallPrompt />
            </ToastProvider>
          </PollProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
