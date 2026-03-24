import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { Trophy, Share2, Users, Clock, Lightbulb, ArrowLeft, MessageCircle } from 'lucide-react'
import ResultBar from '../components/ResultBar'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import LocationViewMap from '../components/LocationViewMap'
import PollQRCode from '../components/PollQRCode'
import { subscribeToPoll } from '../lib/firestore'
import { buildWhatsAppShareLink, copyToClipboard } from '../lib/share'
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
      const ok = await copyToClipboard(url)
      if (ok) showToast('Link copied!', 'success')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg dark:bg-dark-bg">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg dark:bg-dark-bg">
        <div className="text-center px-6">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Poll not found.</p>
          <button onClick={() => navigate('/home')} className="text-primary-600 dark:text-primary-400 font-medium">Go Home</button>
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

  // Ranking poll: winner by Borda Count
  let rankingWinner = null
  let totalBordaPoints = 0
  if (poll.type === 'ranking' && poll.options && poll.totalVotes > 0) {
    totalBordaPoints = poll.options.reduce((sum, o) => sum + (o.bordaPoints || 0), 0)
    const sorted = [...poll.options].sort((a, b) => (b.bordaPoints || 0) - (a.bordaPoints || 0))
    rankingWinner = sorted[0]
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

  // Priority poll: winner by highest priorityPoints
  let priorityWinner = null
  let totalPriorityPoints = 0
  if (poll.type === 'priority' && poll.options && poll.totalVotes > 0) {
    totalPriorityPoints = poll.options.reduce((sum, o) => sum + (o.priorityPoints || 0), 0)
    const sorted = [...poll.options].sort((a, b) => (b.priorityPoints || 0) - (a.priorityPoints || 0))
    priorityWinner = sorted[0]
  }

  // Image poll: winner by vote count (same as standard)
  let imageWinner = null
  let imageWinnerPct = 0
  let imageRunnerUpPct = 0
  if (poll.type === 'image' && poll.options && poll.totalVotes > 0) {
    const sorted = [...poll.options].sort((a, b) => b.votes - a.votes)
    imageWinner = sorted[0]
    imageWinnerPct = Math.round((imageWinner.votes / poll.totalVotes) * 100)
    imageRunnerUpPct = sorted[1] ? Math.round((sorted[1].votes / poll.totalVotes) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-app-bg dark:bg-dark-bg">
      {/* Desktop sidebar */}
      <Sidebar />

      <div className="lg:ml-64">
        <div className="mx-auto max-w-md lg:max-w-5xl">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 lg:bg-app-bg dark:lg:bg-dark-bg lg:border-b-0 lg:px-8 lg:py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-base font-bold text-gray-900 dark:text-white lg:hidden">Poll Results</h1>
            <button
              type="button"
              onClick={share}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </header>

          <div className="px-4 py-4 pb-24 lg:px-8 lg:pb-8 space-y-5">
            {/* Desktop title */}
            <h1 className="hidden lg:block text-2xl font-bold text-gray-900 dark:text-white">Poll Results</h1>

            {/* Status badge */}
            <div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                isEnded ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              }`}>
                {isEnded ? 'Final Results' : 'Live Results'}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl">{poll.question}</h2>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 lg:text-sm">
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
                {/* Winner card — Ranking poll */}
                {poll.type === 'ranking' && rankingWinner && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-primary-500 p-5 text-white relative overflow-hidden lg:p-6">
                    <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Top Ranked Option</p>
                    <h3 className="text-2xl font-bold mb-2">{rankingWinner.text}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black">{rankingWinner.bordaPoints || 0} pts</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                        Borda Count
                      </span>
                    </div>
                  </div>
                )}

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

                {/* Winner card — Priority poll */}
                {poll.type === 'priority' && priorityWinner && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-blue-500 p-5 text-white relative overflow-hidden lg:p-6">
                    <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100 mb-1">Top Priority</p>
                    <h3 className="text-2xl font-bold mb-2">{priorityWinner.text}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black">{priorityWinner.priorityPoints || 0} pts</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                        {totalPriorityPoints > 0 ? Math.round(((priorityWinner.priorityPoints || 0) / totalPriorityPoints) * 100) : 0}% of all points
                      </span>
                    </div>
                  </div>
                )}

                {/* Voting distribution */}
                {poll.type === 'standard' && poll.options && poll.options.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white lg:text-lg">Voting Distribution</h3>
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
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">Voting Distribution</h3>
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
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">Availability Overview</h3>
                    <div className="space-y-4">
                      {poll.timeSlots.map((slot) => {
                        const totalSlotVotes = slot.times.reduce((sum, t) => sum + (slot.votes?.[t] || 0), 0)
                        return (
                          <div key={slot.date} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
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

                {/* Ranking poll distribution */}
                {poll.type === 'ranking' && poll.options && poll.options.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white lg:text-lg">Borda Score Ranking</h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{poll.totalVotes} {poll.totalVotes === 1 ? 'voter' : 'voters'}</span>
                    </div>
                    <div className="space-y-2">
                      {[...poll.options]
                        .sort((a, b) => (b.bordaPoints || 0) - (a.bordaPoints || 0))
                        .map((opt, idx) => (
                          <ResultBar
                            key={opt.id}
                            label={opt.text}
                            votes={opt.bordaPoints || 0}
                            totalVotes={totalBordaPoints || 1}
                            isWinner={idx === 0 && (opt.bordaPoints || 0) > 0}
                            isVoted={false}
                          />
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                      Scores calculated via Borda Count — higher rank = more points per voter
                    </p>
                  </div>
                )}

                {/* Priority poll distribution */}
                {poll.type === 'priority' && poll.options && poll.options.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white lg:text-lg">Priority Ranking</h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{poll.totalVotes} {poll.totalVotes === 1 ? 'voter' : 'voters'} · {totalPriorityPoints} pts total</span>
                    </div>
                    <div className="space-y-2">
                      {[...poll.options]
                        .sort((a, b) => (b.priorityPoints || 0) - (a.priorityPoints || 0))
                        .map((opt, idx) => (
                          <ResultBar
                            key={opt.id}
                            label={opt.text}
                            votes={opt.priorityPoints || 0}
                            totalVotes={totalPriorityPoints || 1}
                            isWinner={idx === 0 && (opt.priorityPoints || 0) > 0}
                            isVoted={false}
                          />
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                      Each voter had {poll.settings.votingPower ?? 5} points to distribute freely
                    </p>
                  </div>
                )}

                {/* Winner card — Image poll */}
                {poll.type === 'image' && imageWinner && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-primary-500 overflow-hidden relative">
                    {imageWinner.imageUrl && (
                      <img
                        src={imageWinner.imageUrl}
                        alt={imageWinner.text || 'Winning image'}
                        className="w-full object-cover"
                        style={{ maxHeight: '220px' }}
                      />
                    )}
                    <div className="p-5 lg:p-6">
                      <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Winning Image</p>
                      {imageWinner.text && (
                        <h3 className="text-xl font-bold text-white mb-2">{imageWinner.text}</h3>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-white">{imageWinnerPct}%</span>
                        {imageRunnerUpPct > 0 && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                            +{imageWinnerPct - imageRunnerUpPct}% vs runner-up
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Image poll distribution */}
                {poll.type === 'image' && poll.options && poll.options.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">Voting Distribution</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[...poll.options]
                        .sort((a, b) => b.votes - a.votes)
                        .map((opt, idx) => {
                          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0
                          const isWinner = idx === 0 && opt.votes > 0
                          const isVoted = votedOptionId === opt.id
                          return (
                            <div
                              key={opt.id}
                              className={`rounded-2xl border-2 overflow-hidden ${isWinner ? 'border-primary-500' : 'border-gray-100 dark:border-gray-700'}`}
                            >
                              <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {opt.imageUrl ? (
                                  <img
                                    src={opt.imageUrl}
                                    alt={opt.text || `Option ${opt.id}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className={`px-3 py-2.5 border-t ${isWinner ? 'border-primary-200 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                {opt.text && (
                                  <p className={`text-xs font-semibold truncate mb-1 ${isWinner ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                    {opt.text}
                                  </p>
                                )}
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  <span className={`font-bold ${isWinner ? 'text-primary-600 dark:text-primary-400' : ''}`}>{pct}%</span>
                                  <span>{opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isWinner ? 'bg-primary-500' : isVoted ? 'bg-primary-300' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
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
                    <div className="rounded-2xl bg-primary-500 relative overflow-hidden">
                      {winner.customContent && (
                        <iframe
                          srcDoc={winner.customContent}
                          title={winner.text}
                          sandbox="allow-scripts"
                          className="w-full border-0 pointer-events-none"
                          style={{ height: '200px' }}
                        />
                      )}
                      <div className="p-5 lg:p-6">
                        <Trophy className="absolute right-4 top-4 h-16 w-16 text-white/20" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-200 mb-1">Winning Option</p>
                        <h3 className="text-2xl font-bold text-white mb-2">{winner.text}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-black text-white">{wPct}%</span>
                          {ruPct > 0 && (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                              +{wPct - ruPct}% vs runner-up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Custom poll distribution */}
                {poll.type === 'custom' && poll.options && poll.options.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 lg:text-lg">Voting Distribution</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[...poll.options]
                        .sort((a, b) => b.votes - a.votes)
                        .map((opt, idx) => {
                          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0
                          const isWinner = idx === 0 && opt.votes > 0
                          const isVoted = votedOptionId === opt.id
                          return (
                            <div
                              key={opt.id}
                              className={`rounded-2xl border-2 overflow-hidden ${isWinner ? 'border-primary-500' : 'border-gray-100 dark:border-gray-700'}`}
                            >
                              {opt.customContent && (
                                <iframe
                                  srcDoc={opt.customContent}
                                  title={opt.text}
                                  sandbox="allow-scripts"
                                  className="w-full border-0 pointer-events-none"
                                  style={{ height: '160px' }}
                                />
                              )}
                              <div className={`px-4 py-3 border-t ${isWinner ? 'border-primary-200 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-semibold ${isWinner ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                    {opt.text}
                                  </span>
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{pct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isWinner ? 'bg-primary-500' : isVoted ? 'bg-primary-300' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Side column - stats and insights */}
              <div className="space-y-5 mt-5 lg:mt-0">
                {/* Quick Insight — Ranking poll */}
                {poll.type === 'ranking' && rankingWinner && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Quick Insight</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>{rankingWinner.text}</strong> leads with {rankingWinner.bordaPoints || 0} Borda points
                      across {poll.totalVotes} {poll.totalVotes === 1 ? 'voter' : 'voters'}.
                      {poll.options && poll.options.length > 1 && (() => {
                        const sorted = [...poll.options].sort((a, b) => (b.bordaPoints || 0) - (a.bordaPoints || 0))
                        const gap = (sorted[0].bordaPoints || 0) - (sorted[1] ? (sorted[1].bordaPoints || 0) : 0)
                        return gap > 0 ? ` ${gap} pts ahead of the runner-up.` : ''
                      })()}
                    </p>
                  </div>
                )}

                {/* Quick Insight — Priority poll */}
                {poll.type === 'priority' && priorityWinner && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Quick Insight</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>{priorityWinner.text}</strong> received {priorityWinner.priorityPoints || 0} of {totalPriorityPoints} total points
                      from {poll.totalVotes} {poll.totalVotes === 1 ? 'voter' : 'voters'}.
                      {poll.options && poll.options.length > 1 && (() => {
                        const sorted = [...poll.options].sort((a, b) => (b.priorityPoints || 0) - (a.priorityPoints || 0))
                        const gap = (sorted[0].priorityPoints || 0) - (sorted[1] ? (sorted[1].priorityPoints || 0) : 0)
                        return gap > 0 ? ` ${gap} pts ahead of the runner-up.` : ''
                      })()}
                    </p>
                  </div>
                )}

                {/* Quick Insight */}
                {poll.type === 'standard' && winnerOption && poll.totalVotes > 0 && (
                  <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Quick Insight</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>{winnerOption.text}</strong> leads with {winnerPct}%
                      {poll.options && poll.options.length > 1 ? `, ${winnerPct - runnerUpPct}% ahead of the runner-up` : ''}
                      . Total of {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} cast
                      {createdAt ? ` since ${format(createdAt, 'MMM d')}` : ''}.
                    </p>
                  </div>
                )}

                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-black text-primary-500">{poll.totalVotes}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Votes</p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-black text-primary-500">
                      {(poll.type === 'standard' || poll.type === 'custom' || poll.type === 'ranking' || poll.type === 'priority' || poll.type === 'image') && poll.options ? poll.options.length :
                       poll.type === 'location' && poll.locations ? poll.locations.length :
                       poll.type === 'schedule' && poll.timeSlots ? poll.timeSlots.length : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {poll.type === 'schedule' ? 'Dates' : 'Options'}
                    </p>
                  </div>
                </div>

                {/* CTA if still active */}
                {poll.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/poll/${poll.id}`)}
                    className="w-full rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 py-3.5 text-sm font-semibold text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                  >
                    Cast Your Vote
                  </button>
                )}

                {/* Share section */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Share Results</p>
                  <button
                    type="button"
                    onClick={share}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Copy / Share Link
                  </button>
                  <a
                    href={buildWhatsAppShareLink(poll.question, poll.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Share via WhatsApp
                  </a>
                  <PollQRCode pollId={poll.id} size={140} />
                </div>
              </div>
            </div>
          </div>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
