import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BarChart2 } from 'lucide-react'
import Layout from '../components/Layout'
import PollCard from '../components/PollCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getPolls, getActivePolls, getUserPolls } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import type { Poll } from '../types'

export default function Home() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const [myPolls, setMyPolls] = useState<Poll[]>([])
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [recentPolls, setRecentPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [active, recent] = await Promise.all([
        getActivePolls(10),
        getPolls(20),
      ])
      setActivePolls(active)
      setRecentPolls(recent)

      if (user) {
        const mine = await getUserPolls(user.uid)
        setMyPolls(mine)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const handler = () => fetchData()
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const greeting = user
    ? `Hello, ${userProfile?.displayName || user.displayName || 'there'}! 👋`
    : 'Welcome to 0815Poll 👋'

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{greeting}</h2>
          <p className="text-sm text-gray-500">Find and create polls</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/create')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-md hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Polls (authenticated users only) */}
          {user && (
            <section>
              <h3 className="text-base font-bold text-gray-900 mb-3">My Polls</h3>
              {myPolls.length === 0 ? (
                <EmptyState
                  icon={BarChart2}
                  title="No polls yet"
                  description="Create your first poll and share it with others."
                  action={{ label: 'Create a Poll', href: '/create' }}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {myPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
                </div>
              )}
            </section>
          )}

          {/* Active Polls */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3">
              {user ? 'Community Polls' : 'Active Polls'}
            </h3>
            {activePolls.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="No active polls"
                description="Be the first to create a poll!"
                action={{ label: 'Create Poll', href: '/create' }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {activePolls
                  .filter((p) => !user || p.createdBy !== user.uid)
                  .slice(0, 6)
                  .map((poll) => <PollCard key={poll.id} poll={poll} />)}
              </div>
            )}
          </section>

          {/* Recent Polls */}
          {recentPolls.some((p) => p.status === 'ended') && (
            <section>
              <h3 className="text-base font-bold text-gray-900 mb-3">Recent Results</h3>
              <div className="grid grid-cols-1 gap-3">
                {recentPolls
                  .filter((p) => p.status === 'ended')
                  .slice(0, 4)
                  .map((poll) => <PollCard key={poll.id} poll={poll} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </Layout>
  )
}
