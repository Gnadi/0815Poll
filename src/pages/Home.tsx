import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, Sun, Moon, Plus } from 'lucide-react'
import Layout from '../components/Layout'
import PollCard from '../components/PollCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getPolls, getActivePolls, getUserPolls } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import type { Poll } from '../types'

export default function Home() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
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
    } catch (err) {
      console.error('Failed to load polls:', err)
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
    ? `Hello, ${userProfile?.displayName || user.displayName || 'there'}!`
    : 'Welcome to FlexPoll'

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white lg:text-2xl">{greeting}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 lg:text-base">Find and create polls</p>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 transition-colors"
              aria-label="Create poll"
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 text-gray-300" />
            ) : (
              <Moon className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {user && (
        <button
          type="button"
          onClick={() => navigate('/create')}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Poll
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Polls (authenticated users only) */}
          {user && (
            <section>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">My Polls</h3>
              {myPolls.length === 0 ? (
                <EmptyState
                  icon={BarChart2}
                  title="No polls yet"
                  description="Create your first poll and share it with others."
                  action={{ label: 'Create a Poll', href: '/create' }}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {myPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
                </div>
              )}
            </section>
          )}

          {/* Active Polls */}
          <section>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">
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
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
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
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">Recent Results</h3>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
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
