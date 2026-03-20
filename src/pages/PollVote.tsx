import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { BarChart2, Users, Clock, Share2 } from 'lucide-react'
import Layout from '../components/Layout'
import VoteOption from '../components/VoteOption'
import RankingList from '../components/RankingList'
import Spinner from '../components/Spinner'
import LocationViewMap from '../components/LocationViewMap'
import { subscribeToPoll, updatePollStatus, getUserVote, getUserScheduleVote, getUserRankingVote, getUserMultiChoiceVote } from '../lib/firestore'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import type { Poll } from '../types'

export default function PollVote() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { castVote, castScheduleVote, castRankingVote, castMultiChoiceVote, getLocalVote } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [rankedOptions, setRankedOptions] = useState<string[]>([])
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([])
  const [voted, setVoted] = useState(false)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Check if already voted
  const checkVoted = useCallback(async (poll: Poll) => {
    // Check local storage first (works for both authed and unauthed)
    const localVote = getLocalVote(poll.id)
    if (localVote) {
      setVoted(true)
      setVotedOptionId(localVote)
      return
    }
    // Check Firestore for logged-in users
    if (user && poll.type === 'schedule') {
      const vote = await getUserScheduleVote(poll.id, user.uid)
      if (vote) {
        setVoted(true)
        setSelectedSlots(vote.selectedSlots)
      }
    } else if (user && poll.type === 'ranking') {
      const vote = await getUserRankingVote(poll.id, user.uid)
      if (vote) {
        setVoted(true)
        setRankedOptions(vote.ranking)
      }
    } else if (user && poll.type === 'multi_choice') {
      const vote = await getUserMultiChoiceVote(poll.id, user.uid)
      if (vote) {
        setVoted(true)
        setSelectedMultiOptions(vote.selectedOptionIds)
      }
    } else if (user) {
      const vote = await getUserVote(poll.id, user.uid)
      if (vote) {
        setVoted(true)
        setVotedOptionId(vote.optionId)
      }
    }
  }, [user, getLocalVote])

  useEffect(() => {
    if (!id) return
    const unsub = subscribeToPoll(id, async (p) => {
      if (!p) { setLoading(false); return }

      // Auto-expire check
      if (p.status === 'active' && p.endsAt && isPast(p.endsAt.toDate())) {
        await updatePollStatus(p.id, 'ended')
        navigate(`/poll/${p.id}/results`, { replace: true })
        return
      }
      if (p.status === 'ended') {
        navigate(`/poll/${p.id}/results`, { replace: true })
        return
      }

      setPoll(p)
      setLoading(false)
      // Initialize ranking order from poll options if not yet set
      if (p.type === 'ranking' && p.options && rankedOptions.length === 0) {
        setRankedOptions(p.options.map((o) => o.id))
      }
      await checkVoted(p)
    })
    return unsub
  }, [id, navigate, checkVoted])

  const handleVote = async () => {
    if (!poll || submitting || voted) return
    if (poll.type === 'schedule') {
      if (selectedSlots.length === 0) { showToast('Select at least one time slot.', 'error'); return }
    } else if (poll.type === 'ranking') {
      if (rankedOptions.length === 0) { showToast('Rank the options before submitting.', 'error'); return }
    } else if (poll.type === 'multi_choice') {
      if (selectedMultiOptions.length === 0) { showToast('Select at least one option.', 'error'); return }
    } else {
      if (!selectedOption) { showToast('Please select an option.', 'error'); return }
    }

    setSubmitting(true)
    try {
      if (poll.type === 'schedule') {
        await castScheduleVote(poll.id, user?.uid || null, selectedSlots)
      } else if (poll.type === 'ranking') {
        await castRankingVote(poll.id, user?.uid || null, rankedOptions)
      } else if (poll.type === 'multi_choice') {
        await castMultiChoiceVote(poll.id, user?.uid || null, selectedMultiOptions)
      } else {
        await castVote(poll.id, user?.uid || null, selectedOption!)
        setVotedOptionId(selectedOption)
      }
      setVoted(true)
      showToast('Vote cast!', 'success')
    } catch (err) {
      showToast('Failed to cast vote. Please try again.', 'error')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

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
      <Layout title="Poll Not Found" showBack>
        <div className="text-center py-16">
          <p className="text-gray-500">This poll doesn't exist or has been removed.</p>
        </div>
      </Layout>
    )
  }

  const endsAt = poll.endsAt?.toDate?.()
  const timeRemaining = endsAt ? formatDistanceToNow(endsAt, { addSuffix: true }) : ''

  // Calculate percentages for standard/location polls
  const getPercentage = (votes: number) =>
    poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0

  return (
    <Layout
      title="Cast Your Vote"
      showBack
      headerRight={
        <button type="button" onClick={share} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
          <Share2 className="h-4 w-4 text-gray-600" />
        </button>
      }
    >
      <div className="lg:max-w-2xl lg:mx-auto">
        {/* LIVE badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            LIVE NOW
          </span>
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3 lg:text-3xl">{poll.question}</h2>
        {poll.description && (
          <p className="text-sm text-gray-500 mb-6 lg:text-base">{poll.description}</p>
        )}

        {/* Standard poll options */}
        {poll.type === 'standard' && poll.options && (
          <div className="space-y-3 mb-6">
            {poll.options.map((opt) => (
              <VoteOption
                key={opt.id}
                id={opt.id}
                label={opt.text}
                percentage={voted ? getPercentage(opt.votes) : undefined}
                selected={selectedOption === opt.id || votedOptionId === opt.id}
                voted={voted}
                onSelect={() => !voted && setSelectedOption(opt.id)}
              />
            ))}
          </div>
        )}

        {/* Location poll options */}
        {poll.type === 'location' && poll.locations && (
          <>
            <LocationViewMap locations={poll.locations} />
            <div className="space-y-3 mb-6">
              {poll.locations.map((loc, index) => (
                <VoteOption
                  key={loc.id}
                  id={loc.id}
                  label={`${index + 1}. ${loc.name}`}
                  percentage={voted ? getPercentage(loc.votes) : undefined}
                  selected={selectedOption === loc.id || votedOptionId === loc.id}
                  voted={voted}
                  onSelect={() => !voted && setSelectedOption(loc.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Schedule poll */}
        {poll.type === 'schedule' && poll.timeSlots && (
          <div className="space-y-4 mb-6">
            {poll.timeSlots.map((slot) => (
              <div key={slot.date} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {format(new Date(slot.date + 'T00:00:00'), 'EEEE, MMMM d')}
                  </p>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2 lg:grid-cols-4">
                  {slot.times.map((time) => {
                    const key = `${slot.date}|${time}`
                    const isSelected = selectedSlots.includes(key)
                    const voteCount = slot.votes?.[time] || 0
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => !voted && setSelectedSlots((prev) =>
                          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                        )}
                        className={`rounded-xl py-2.5 text-sm font-medium transition-colors border ${
                          isSelected
                            ? 'bg-primary-500 text-white border-primary-500'
                            : voted
                            ? 'bg-gray-50 text-gray-500 border-gray-100 cursor-default'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div>{time}</div>
                        {voted && <div className="text-xs opacity-75">{voteCount}✓</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ranking poll */}
        {poll.type === 'ranking' && poll.options && (
          <div className="mb-6">
            {!voted && (
              <p className="text-xs text-gray-500 mb-3">
                Drag items or use the arrows to rank options from best (top) to worst (bottom).
              </p>
            )}
            <RankingList
              options={poll.options}
              order={rankedOptions.length > 0 ? rankedOptions : poll.options.map((o) => o.id)}
              onChange={setRankedOptions}
              disabled={voted}
            />
          </div>
        )}

        {/* Multi-choice poll options */}
        {poll.type === 'multi_choice' && poll.options && (
          <div className="space-y-3 mb-6">
            <p className="text-xs text-gray-500 -mt-2">You may select more than one option.</p>
            {poll.options.map((opt) => {
              const isSelected = selectedMultiOptions.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => !voted && setSelectedMultiOptions((prev) =>
                    prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                  )}
                  className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : voted
                      ? 'border-gray-100 bg-white cursor-default'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-colors ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                    {opt.text}
                  </span>
                  {voted && (
                    <span className="text-xs text-gray-500 shrink-0">
                      {getPercentage(opt.votes)}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Custom poll options (selectable cards rendered in iframes) */}
        {poll.type === 'custom' && poll.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {poll.options.map((opt) => {
              const isSelected = selectedOption === opt.id || votedOptionId === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => !voted && setSelectedOption(opt.id)}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all text-left ${
                    isSelected
                      ? 'border-primary-500 ring-2 ring-primary-200 shadow-md'
                      : voted
                      ? 'border-gray-100 opacity-60 cursor-default'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                  }`}
                >
                  {/* Rendered custom HTML in sandboxed iframe */}
                  {opt.customContent && (
                    <iframe
                      srcDoc={opt.customContent}
                      title={opt.text}
                      sandbox="allow-scripts"
                      className="w-full border-0 pointer-events-none"
                      style={{ height: '160px' }}
                    />
                  )}
                  {/* Option label + vote info */}
                  <div className={`px-4 py-3 border-t ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                        {opt.text}
                      </span>
                      {/* Radio indicator */}
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="3" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {voted && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{getPercentage(opt.votes)}%</span>
                          <span>{opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-primary-500' : 'bg-gray-300'}`}
                            style={{ width: `${getPercentage(opt.votes)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Poll Stats */}
        <div className="mb-6 rounded-2xl bg-primary-50 border border-primary-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-5 w-5 text-primary-500" />
            <span className="text-sm font-semibold text-gray-800">Poll Statistics</span>
          </div>
          <p className="text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              {poll.totalVotes} {poll.totalVotes === 1 ? 'person has' : 'people have'} voted.
            </span>
            {endsAt && (
              <span className="ml-1 inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                This poll ends {timeRemaining}.
              </span>
            )}
          </p>
        </div>

        {/* Action buttons */}
        {!voted ? (
          <button
            type="button"
            onClick={handleVote}
            disabled={
              submitting ||
              (poll.type !== 'schedule' && poll.type !== 'ranking' && poll.type !== 'multi_choice' && !selectedOption) ||
              (poll.type === 'schedule' && selectedSlots.length === 0) ||
              (poll.type === 'multi_choice' && selectedMultiOptions.length === 0)
            }
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-40 transition-colors"
          >
            {submitting ? <Spinner size="sm" /> : 'Submit Vote'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/poll/${poll.id}/results`)}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600"
          >
            View Results
          </button>
        )}
      </div>
    </Layout>
  )
}
