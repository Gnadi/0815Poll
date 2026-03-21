import { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import Layout from '../components/Layout'
import PollCard from '../components/PollCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getPollsPage } from '../lib/firestore'
import type { Poll, PollType, PollStatus } from '../types'
import type { QueryDocumentSnapshot } from 'firebase/firestore'

type FilterType = 'all' | PollType
type FilterStatus = 'all' | PollStatus

export default function Explore() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const loadPolls = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true)
      setLastDoc(null)
    } else {
      setLoadingMore(true)
    }
    try {
      const { polls: newPolls, lastDoc: newLastDoc } = await getPollsPage(20, reset ? undefined : lastDoc ?? undefined)
      setPolls(reset ? newPolls : (prev) => [...prev, ...newPolls])
      setLastDoc(newLastDoc)
      setHasMore(newPolls.length === 20)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [lastDoc])

  useEffect(() => {
    loadPolls(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = polls.filter((p) => {
    if (search && !p.question.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const typeFilters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Standard', value: 'standard' },
    { label: 'Schedule', value: 'schedule' },
    { label: 'Location', value: 'location' },
    { label: 'Custom', value: 'custom' },
  ]

  const statusFilters: { label: string; value: FilterStatus }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Ended', value: 'ended' },
  ]

  return (
    <Layout title="Explore">
      {/* Search and filters */}
      <div className="lg:flex lg:items-center lg:gap-4 lg:mb-6">
        {/* Search */}
        <div className="relative mb-4 lg:mb-0 lg:flex-1 lg:max-w-md">
          <label htmlFor="explore-search" className="sr-only">Search polls</label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <input
            id="explore-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search polls..."
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pl-10 pr-4 py-3 text-sm outline-none focus:border-primary-400"
          />
        </div>

        <div className="lg:flex lg:items-center lg:gap-3">
          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide lg:pb-0 lg:mb-0">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                  typeFilter === f.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex gap-2 mb-4 lg:mb-0">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                  statusFilter === f.value
                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-gray-800 dark:border-gray-200'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No polls found"
          description={search ? `No polls match "${search}"` : 'No polls available yet.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((poll) => <PollCard key={poll.id} poll={poll} />)}
          </div>

          {hasMore && !search && typeFilter === 'all' && statusFilter === 'all' && (
            <button
              type="button"
              onClick={() => loadPolls(false)}
              disabled={loadingMore}
              className="mt-4 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 lg:max-w-xs lg:mx-auto"
            >
              {loadingMore ? <Spinner size="sm" /> : 'Load More'}
            </button>
          )}
        </>
      )}
    </Layout>
  )
}
