import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { Trophy, Share2, Users, Clock, Lightbulb, ArrowLeft } from 'lucide-react'
import ResultBar from '../components/ResultBar'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import LocationViewMap from '../components/LocationViewMap'
import { subscribeToPoll } from '../lib/firestore'
import { usePoll } from '../contexts/PollContext'
import { useToast } from '../components/Toast'
import type { Poll } from '../types'
import BottomNav from '../components/BottomNav'

export default function PollResults() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getLocalVote } = usePoll()
  const { showToast } = useToast()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = subscribeToPoll(id, (p) => {
      setPoll(p)
      setLoading(false)
    })
    return unsub
  }, [id])

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: poll?.question, url })
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!', 'success')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-center px-6">
          <p className="text-gray-500 mb-4">Poll not found.</p>
          <button onClick={() => navigate('/')} className="text-primary-600 font-medium">Go Home</button>
        </div>
      </div>
    )
  }

  const endsAt = poll.endsAt?.toDate?.()
  const createdAt = poll.createdAt?.toDate?.()
  const isEnded = poll.status === 'ended'
  const votedOptionId = getLocalVote(poll.id)

  // Compute winner for standard polls
  let winnerOption = null
  let winnerPct = 0
  let runnerUpPct = 0
  if (poll.type === 'standard' && poll.options && poll.totalVotes > 0) {
    const sorted = [...poll.options].sort((a, b) => b.votes - a.votes)
    winnerOption = sorted[0]
    winnerPct = Math.round((winnerOption.votes / poll.totalVotes) * 100)
    runnerUpPct = sorted[1] ? Math.round((sorted[1].votes / poll.totalVotes) * 100) : 0
  }

  // Schedule poll: find most popular slot
  type TopSlot = { date: string; time: string; votes: number }
  let topSlot: TopSlot | null = null
  if (poll.type === 'schedule' && poll.timeSlots) {
    poll.timeSlots.forEach((slot) => {
      slot.times.forEach((time) => {
        const v = slot.votes?.[time] || 0
        if (!topSlot || v > (topSlot as TopSlot).votes) {
          topSlot = { date: slot.date, time, votes: v }
        }
      })
    })
  }

  // Location poll winner
  let winnerLoc = null
  if (poll.type === 'location' && poll.locations && poll.totalVotes > 0) {
    winnerLoc = [...poll.locations].sort((a, b) => b.votes - a.votes)[0]
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Desktop sidebar */}
      <Sidebar />

      <div className="lg:ml-64">
        <div className="mx-auto max-w-md lg:max-w-5xl">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:bg-app-bg lg:border-b-0 lg:px-8 lg:py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-base font-bold text-gray-900 lg:hidden">Poll Results</h1>
            <button
              type="button"
              onClick={share}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </button>
          </header>

          <div className="px-4 py-4 pb-24 lg:px-8 lg:pb-8 space-y-5">
            {/* Desktop title */}
            <h1 className="hidden lg:block text-2xl font-bold text-gray-900">Poll Results</h1>

            {/* Status badge */}
            <div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                isEnded ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'
              }`}>
                {isEnded ? 'Final Results' : 'Live Results'}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl">{poll.question}</h2>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-500 lg:text-sm">
              {isEnded && endsAt ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Ended {formatDistanceToNow(endsAt, { addSuffix: true })}
                </span>
              ) : endsAt ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Ends {formatDistanceToNow(endsAt, { addSuffix: true })}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {poll.totalVotes} total votes
              </span>
            </div>

            {/* Desktop: two-column layout for results */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Main results column */}
              <div className="lg:col-span-2 space-y-5">
                {/* Winner card — Standard poll */}
                {poll.type === 'standard' && winnerOption && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-primary-500 p-5 text-white relative overflow-hidden lg:p-6">
                    <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Winning Option</p>
                    <h3 className="text-2xl font-bold mb-2">{winnerOption.text}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black">{winnerPct}%</span>
                      {runnerUpPct > 0 && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                          +{winnerPct - runnerUpPct}% vs runner-up
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Winner card — Location poll */}
                {poll.type === 'location' && winnerLoc && (
                  <div className="rounded-2xl bg-primary-500 p-5 text-white relative overflow-hidden lg:p-6">
                    <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Top Location</p>
                    <h3 className="text-2xl font-bold mb-1">{winnerLoc.name}</h3>
                    <p className="text-sm text-primary-200">{winnerLoc.address}</p>
                  </div>
                )}

                {/* Winner card — Schedule poll */}
                {poll.type === 'schedule' && topSlot && (topSlot as TopSlot).votes > 0 && (
                  <div className="rounded-2xl bg-primary-500 p-5 text-white relative overflow-hidden lg:p-6">
                    <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Best Time</p>
                    <h3 className="text-2xl font-bold">{(topSlot as TopSlot).time}</h3>
                    <p className="text-sm text-primary-200">{format(new Date((topSlot as TopSlot).date + 'T00:00:00'), 'EEEE, MMMM d')}</p>
                    <p className="text-sm mt-1">{(topSlot as TopSlot).votes} people available</p>
                  </div>
                )}

                {/* Voting distribution */}
                {poll.type === 'standard' && poll.options && poll.options.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900 lg:text-lg">Voting Distribution</h3>
                    </div>
                    <div className="space-y-2">
                      {[...poll.options]
                        .sort((a, b) => b.votes - a.votes)
                        .map((opt, idx) => (
                          <ResultBar
                            key={opt.id}
                            label={opt.text}
                            votes={opt.votes}
                            totalVotes={poll.totalVotes}
                            isWinner={idx === 0 && opt.votes > 0}
                            isVoted={votedOptionId === opt.id}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Location distribution */}
                {poll.type === 'location' && poll.locations && (
                  <div>
                    <LocationViewMap locations={poll.locations} />
                    <h3 className="text-base font-bold text-gray-900 mb-3 lg:text-lg">Voting Distribution</h3>
                    <div className="space-y-2">
                      {[...poll.locations]
                        .sort((a, b) => b.votes - a.votes)
                        .map((loc, idx) => (
                          <ResultBar
                            key={loc.id}
                            label={loc.name}
                            votes={loc.votes}
                            totalVotes={poll.totalVotes}
                            isWinner={idx === 0 && loc.votes > 0}
                            isVoted={votedOptionId === loc.id}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Schedule distribution */}
                {poll.type === 'schedule' && poll.timeSlots && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3 lg:text-lg">Availability Overview</h3>
                    <div className="space-y-4">
                      {poll.timeSlots.map((slot) => {
                        const totalSlotVotes = slot.times.reduce((sum, t) => sum + (slot.votes?.[t] || 0), 0)
                        return (
                          <div key={slot.date} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <p className="text-xs font-semibold text-gray-700">
                                {format(new Date(slot.date + 'T00:00:00'), 'EEEE, MMMM d')}
                              </p>
                            </div>
                            <div className="p-3 space-y-2">
                              {slot.times.map((time) => {
                                const votes = slot.votes?.[time] || 0
                                const ts = topSlot as TopSlot | null
                                return (
                                  <ResultBar
                                    key={time}
                                    label={time}
                                    votes={votes}
                                    totalVotes={totalSlotVotes || 1}
                                    isWinner={ts?.date === slot.date && ts?.time === time}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Custom poll winner */}
                {poll.type === 'custom' && poll.options && poll.totalVotes > 0 && (() => {
                  const sorted = [...poll.options].sort((a, b) => b.votes - a.votes)
                  const winner = sorted[0]
                  const wPct = Math.round((winner.votes / poll.totalVotes) * 100)
                  const ruPct = sorted[1] ? Math.round((sorted[1].votes / poll.totalVotes) * 100) : 0
                  return (
                    <div className="rounded-2xl bg-primary-500 p-5 text-white relative overflow-hidden lg:p-6">
                      <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Winning Option</p>
                      <h3 className="text-2xl font-bold mb-2">{winner.text}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black">{wPct}%</span>
                        {ruPct > 0 && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                            +{wPct - ruPct}% vs runner-up
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Custom poll distribution */}
                {poll.type === 'custom' && poll.options && poll.options.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3 lg:text-lg">Voting Distribution</h3>
                    <div className="space-y-2">
                      {[...poll.options]
                        .sort((a, b) => b.votes - a.votes)
                        .map((opt, idx) => (
                          <ResultBar
                            key={opt.id}
                            label={opt.text}
                            votes={opt.votes}
                            totalVotes={poll.totalVotes}
                            isWinner={idx === 0 && opt.votes > 0}
                            isVoted={votedOptionId === opt.id}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Side column - stats and insights */}
              <div className="space-y-5 mt-5 lg:mt-0">
                {/* Quick Insight */}
                {poll.type === 'standard' && winnerOption && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-800">Quick Insight</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>{winnerOption.text}</strong> leads with {winnerPct}%
                      {poll.options && poll.options.length > 1 ? `, ${winnerPct - runnerUpPct}% ahead of the runner-up` : ''}
                      . Total of {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} cast
                      {createdAt ? ` since ${format(createdAt, 'MMM d')}` : ''}.
                    </p>
                  </div>
                )}

                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-black text-primary-500">{poll.totalVotes}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Votes</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-black text-primary-500">
                      {(poll.type === 'standard' || poll.type === 'custom') && poll.options ? poll.options.length :
                       poll.type === 'location' && poll.locations ? poll.locations.length :
                       poll.type === 'schedule' && poll.timeSlots ? poll.timeSlots.length : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {poll.type === 'schedule' ? 'Dates' : 'Options'}
                    </p>
                  </div>
                </div>

                {/* CTA if still active */}
                {poll.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/poll/${poll.id}`)}
                    className="w-full rounded-2xl border border-primary-200 bg-primary-50 py-3.5 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
                  >
                    Cast Your Vote
                  </button>
                )}
              </div>
            </div>
          </div>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
