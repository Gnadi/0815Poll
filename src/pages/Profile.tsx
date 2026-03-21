import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Check, X, BarChart2, Moon, Sun } from 'lucide-react'
import Layout from '../components/Layout'
import PollCard from '../components/PollCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getUserPolls, updateUserProfile, getUserVoteCount } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { useTheme } from '../contexts/ThemeContext'
import type { Poll } from '../types'

function AppearanceSection() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mb-6">
      <button
        type="button"
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {isDark
            ? <Moon className="h-5 w-5 text-primary-400" />
            : <Sun className="h-5 w-5 text-primary-500" />
          }
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{isDark ? 'Dark mode' : 'Light mode'}</p>
          </div>
        </div>
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </button>
    </div>
  )
}

export default function Profile() {
  const { user, userProfile, signOut } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [myPolls, setMyPolls] = useState<Poll[]>([])
  const [voteCount, setVoteCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      getUserPolls(user.uid),
      getUserVoteCount(user.uid),
    ]).then(([polls, votes]) => {
      setMyPolls(polls)
      setVoteCount(votes)
      setLoading(false)
    })
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    showToast('Signed out', 'info')
    navigate('/')
  }

  const saveName = async () => {
    if (!user || !newName.trim()) return
    try {
      await updateUserProfile(user.uid, { displayName: newName.trim() })
      showToast('Name updated!', 'success')
      setEditingName(false)
    } catch {
      showToast('Failed to update name', 'error')
    }
  }

  // Not logged in
  if (!user) {
    return (
      <Layout title="Profile">
        <div className="flex flex-col items-center justify-center py-16 text-center lg:py-24">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <span className="text-4xl">👤</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Sign in to your account</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Track your polls, vote history, and more.</p>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="rounded-2xl bg-primary-500 px-8 py-3 text-sm font-bold text-white hover:bg-primary-600"
          >
            Sign In / Register
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-3 text-sm text-gray-500 dark:text-gray-400 underline"
          >
            Continue without account
          </button>
          <div className="mt-8 w-full max-w-xs">
            <AppearanceSection />
          </div>
        </div>
      </Layout>
    )
  }

  const displayName = userProfile?.displayName || user.displayName || 'User'
  const email = userProfile?.email || user.email || ''
  const initial = displayName.charAt(0).toUpperCase()

  const activePolls = myPolls.filter((p) => p.status === 'active')
  const endedPolls = myPolls.filter((p) => p.status === 'ended')

  return (
    <Layout title="Profile">
      <div className="lg:max-w-4xl lg:mx-auto">
        {/* Profile header - desktop uses horizontal layout */}
        <div className="flex flex-col items-center py-6 mb-6 lg:flex-row lg:items-start lg:gap-6 lg:py-0 lg:mb-8">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover mb-3 lg:mb-0 lg:h-24 lg:w-24"
            />
          ) : (
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 shadow-md lg:mb-0 lg:h-24 lg:w-24">
              <span className="text-3xl font-bold text-white lg:text-4xl">{initial}</span>
            </div>
          )}

          <div className="text-center lg:text-left lg:flex-1">
            {editingName ? (
              <div className="flex items-center gap-2 justify-center lg:justify-start mt-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm outline-none focus:border-primary-400"
                  autoFocus
                />
                <button type="button" aria-label="Save name" onClick={saveName} className="text-green-500 hover:text-green-600">
                  <Check className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Cancel editing" onClick={() => setEditingName(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 lg:text-2xl">{displayName}</h2>
                <button
                  type="button"
                  aria-label="Edit display name"
                  onClick={() => { setNewName(displayName); setEditingName(true) }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{email}</p>
          </div>

          {/* Desktop sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden lg:flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 text-center">
            <p className="text-3xl font-black text-primary-500">{myPolls.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Polls</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 text-center">
            <p className="text-3xl font-black text-primary-500">{voteCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Votes</p>
          </div>
          <div className="hidden lg:block rounded-2xl bg-white border border-gray-100 p-4 text-center">
            <p className="text-3xl font-black text-primary-500">{activePolls.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Polls</p>
          </div>
        </div>

        {/* Active Polls */}
        {activePolls.length > 0 && (
          <section className="mb-8">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3 lg:text-lg">Active Polls</h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {activePolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
            </div>
          </section>
        )}

        {/* All Polls */}
        <section className="mb-8">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3 lg:text-lg">My Polls</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : myPolls.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No polls yet"
              description="Create your first poll!"
              action={{ label: 'Create Poll', href: '/create' }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {myPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
            </div>
          )}
        </section>

        {/* Appearance */}
        <AppearanceSection />

        {/* Mobile sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 py-3.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors lg:hidden"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </Layout>
  )
}
