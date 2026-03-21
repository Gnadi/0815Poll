import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PollProvider } from './contexts/PollContext'
import { ToastProvider } from './components/Toast'
import { NotificationProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/ErrorBoundary'

import Auth from './pages/Auth'
import Home from './pages/Home'
import Explore from './pages/Explore'
import CreatePollType from './pages/CreatePollType'
import CreateStandard from './pages/CreateStandard'
import CreateSchedule from './pages/CreateSchedule'
import CreateLocation from './pages/CreateLocation'
import CreateCustom from './pages/CreateCustom'
import CreateRanking from './pages/CreateRanking'
import CreatePriority from './pages/CreatePriority'
import PollVote from './pages/PollVote'
import PollResults from './pages/PollResults'
import Profile from './pages/Profile'
import Contacts from './pages/Contacts'
import NotificationsPage from './pages/NotificationsPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
          <PollProvider>
            <ToastProvider>
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
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </PollProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
