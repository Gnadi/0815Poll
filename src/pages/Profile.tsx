import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Check, X, BarChart2 } from 'lucide-react'
import Layout from '../components/Layout'
import PollCard from '../components/PollCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getUserPolls, updateUserProfile, getUserVoteCount } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import type { Poll } from '../types'

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <span className="text-4xl">👤</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sign in to your account</h3>
          <p className="text-sm text-gray-500 mb-6">Track your polls, vote history, and more.</p>
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
            className="mt-3 text-sm text-gray-500 underline"
          >
            Continue without account
          </button>
        </div>
      </Layout>
    )
  }

  const displayName = userProfile?.displayName || user.displayName || 'User'
  const email = userProfile?.email || user.email || ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <Layout title="Profile">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center py-6 mb-6">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover mb-3"
          />
        ) : (
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 shadow-md">
            <span className="text-3xl font-bold text-white">{initial}</span>
          </div>
        )}

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-primary-400"
              autoFocus
            />
            <button type="button" onClick={saveName} className="text-green-500 hover:text-green-600">
              <Check className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setEditingName(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <button
              type="button"
              onClick={() => { setNewName(displayName); setEditingName(true) }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-0.5">{email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-primary-500">{myPolls.length}</p>
          <p className="text-xs text-gray-500 mt-1">Polls Created</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-primary-500">{voteCount}</p>
          <p className="text-xs text-gray-500 mt-1">Votes Cast</p>
        </div>
      </div>

      {/* My Polls */}
      <section className="mb-8">
        <h3 className="text-base font-bold text-gray-900 mb-3">My Polls</h3>
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
          <div className="space-y-3">
            {myPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
          </div>
        )}
      </section>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </Layout>
  )
}
