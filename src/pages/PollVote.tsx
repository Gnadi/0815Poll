import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { BarChart2, Users, Clock, Share2, ChevronDown, ChevronUp, MessageCircle, Bell } from 'lucide-react'
import Layout from '../components/Layout'
import VoteOption from '../components/VoteOption'
import RankingList from '../components/RankingList'
import PriorityVoteInput from '../components/PriorityVoteInput'
import Spinner from '../components/Spinner'
import LocationViewMap from '../components/LocationViewMap'
import PollQRCode from '../components/PollQRCode'
import ContactSelector from '../components/ContactSelector'
import NotifyMethodPicker from '../components/NotifyMethodPicker'
import { subscribeToPoll, updatePollStatus, getUserVote, getUserScheduleVote, getUserRankingVote, getUserPriorityVote, writeNotificationsForEmails, enqueuePushNotification, getUserByEmail } from '../lib/firestore'
import { buildWhatsAppShareLink, copyToClipboard, buildSmsLink } from '../lib/share'
import { sendPollInvites, isEmailJsConfigured } from '../lib/emailjs'
import { filterFCMTokens } from '../lib/fcm'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import type { Poll, Contact } from '../types'

export default function PollVote() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { castVote, castMultipleVote, castScheduleVote, castRankingVote, castPriorityVote, getLocalVote } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [rankedOptions, setRankedOptions] = useState<string[]>([])
  const [priorityDistribution, setPriorityDistribution] = useState<Record<string, number>>({})
  const [voted, setVoted] = useState(false)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const [votedOptionIds, setVotedOptionIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)

  // Notify panel state (shown after poll creation)
  const [notifyContacts, setNotifyContacts] = useState<Contact[]>((location.state as { contacts?: Contact[] })?.contacts ?? [])
  const [notifyByEmail, setNotifyByEmail] = useState(true)
  const [notifyBySms, setNotifyBySms] = useState(false)
  const [notified, setNotified] = useState(false)
  const [notifying, setNotifying] = useState(false)

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
    } else if (user && poll.type === 'priority') {
      const vote = await getUserPriorityVote(poll.id, user.uid)
      if (vote) {
        setVoted(true)
        setPriorityDistribution(vote.distribution)
      }
    } else if (user) {
      const vote = await getUserVote(poll.id, user.uid)
      if (vote) {
        setVoted(true)
        if (vote.optionIds && vote.optionIds.length > 0) {
          setVotedOptionIds(vote.optionIds)
        } else if (vote.optionId) {
          setVotedOptionId(vote.optionId)
        }
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
      // Initialize priority distribution with zeros if not yet set
      if (p.type === 'priority' && p.options && Object.keys(priorityDistribution).length === 0) {
        const init: Record<string, number> = {}
        p.options.forEach((o) => { init[o.id] = 0 })
        setPriorityDistribution(init)
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
    } else if (poll.type === 'priority') {
      const totalAllocated = Object.values(priorityDistribution).reduce((s, v) => s + v, 0)
      if (totalAllocated === 0) { showToast('Distribute at least 1 point before submitting.', 'error'); return }
    } else {
      const isMultiple = !!poll.settings?.allowMultipleChoices
      if (isMultiple) {
        if (selectedOptions.length === 0) { showToast('Please select at least one option.', 'error'); return }
      } else {
        if (!selectedOption) { showToast('Please select an option.', 'error'); return }
      }
    }

    const isMultiple = !!poll.settings?.allowMultipleChoices

    setSubmitting(true)
    try {
      if (poll.type === 'schedule') {
        await castScheduleVote(poll.id, user?.uid || null, selectedSlots)
      } else if (poll.type === 'ranking') {
        await castRankingVote(poll.id, user?.uid || null, rankedOptions)
      } else if (poll.type === 'priority') {
        await castPriorityVote(poll.id, user?.uid || null, priorityDistribution)
      } else if (isMultiple) {
        await castMultipleVote(poll.id, user?.uid || null, selectedOptions)
        setVotedOptionIds(selectedOptions)
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

  const handleNotify = async () => {
    if (!poll || notifyContacts.length === 0) return
    setNotifying(true)
    try {
      if (notifyByEmail && isEmailJsConfigured()) {
        const expiresAt = poll.endsAt?.toDate?.() ?? new Date()
        const { sent, failed } = await sendPollInvites(notifyContacts, poll.question, poll.id, user?.displayName || 'Someone', expiresAt)
        if (failed > 0) {
          showToast(`${sent} invite${sent !== 1 ? 's' : ''} sent, ${failed} failed.`, 'info')
        } else {
          showToast(`${sent} invite${sent !== 1 ? 's' : ''} sent!`, 'success')
        }
      } else if (notifyByEmail && !isEmailJsConfigured()) {
        showToast('Email invites require EmailJS setup.', 'info')
      }
      if (notifyBySms) {
        const phones = notifyContacts.filter((c) => c.phone).map((c) => c.phone!)
        if (phones.length > 0) window.location.href = buildSmsLink(phones, poll.question, poll.id)
      }
      const emails = notifyContacts.map((c) => c.email)
      writeNotificationsForEmails(emails, poll.id, poll.question, user?.displayName || 'Someone')
      const users = await Promise.all(emails.map((e) => getUserByEmail(e)))
      const tokens = filterFCMTokens(users.filter(Boolean) as { fcmToken?: string }[])
      if (tokens.length > 0) {
        enqueuePushNotification(tokens, `${user?.displayName || 'Someone'} invited you to vote`, poll.question, poll.id)
      }
      if (!notifyBySms) showToast('Notifications sent!', 'success')
    } catch {
      showToast('Failed to send notifications.', 'error')
    } finally {
      setNotifying(false)
      setNotified(true)
    }
  }

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
        <button type="button" onClick={share} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      }
    >
      <div className="lg:max-w-2xl lg:mx-auto">
        {/* LIVE badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            LIVE NOW
          </span>
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 lg:text-3xl">{poll.question}</h2>
        {poll.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 lg:text-base">{poll.description}</p>
        )}

        {/* Standard poll options */}
        {poll.type === 'standard' && poll.options && (
          <div className="space-y-3 mb-6">
            {poll.settings?.allowMultipleChoices && !voted && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You can select multiple options.</p>
            )}
            {poll.options.map((opt) => {
              const isMultiple = !!poll.settings?.allowMultipleChoices
              const isSelected = isMultiple
                ? selectedOptions.includes(opt.id)
                : selectedOption === opt.id
              const isVoted = isMultiple
                ? votedOptionIds.includes(opt.id)
                : votedOptionId === opt.id
              return (
                <VoteOption
                  key={opt.id}
                  id={opt.id}
                  label={opt.text}
                  percentage={voted ? getPercentage(opt.votes) : undefined}
                  selected={isSelected || isVoted}
                  voted={voted}
                  multiple={isMultiple}
                  onSelect={() => {
                    if (voted) return
                    if (isMultiple) {
                      setSelectedOptions((prev) =>
                        prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                      )
                    } else {
                      setSelectedOption(opt.id)
                    }
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Location poll options */}
        {poll.type === 'location' && poll.locations && (
          <>
            <LocationViewMap locations={poll.locations} />
            <div className="space-y-3 mb-6">
              {poll.settings?.allowMultipleChoices && !voted && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You can select multiple locations.</p>
              )}
              {poll.locations.map((loc, index) => {
                const isMultiple = !!poll.settings?.allowMultipleChoices
                const isSelected = isMultiple
                  ? selectedOptions.includes(loc.id)
                  : selectedOption === loc.id
                const isVoted = isMultiple
                  ? votedOptionIds.includes(loc.id)
                  : votedOptionId === loc.id
                return (
                  <VoteOption
                    key={loc.id}
                    id={loc.id}
                    label={`${index + 1}. ${loc.name}`}
                    percentage={voted ? getPercentage(loc.votes) : undefined}
                    selected={isSelected || isVoted}
                    voted={voted}
                    multiple={isMultiple}
                    onSelect={() => {
                      if (voted) return
                      if (isMultiple) {
                        setSelectedOptions((prev) =>
                          prev.includes(loc.id) ? prev.filter((id) => id !== loc.id) : [...prev, loc.id]
                        )
                      } else {
                        setSelectedOption(loc.id)
                      }
                    }}
                  />
                )
              })}
            </div>
          </>
        )}

        {/* Schedule poll */}
        {poll.type === 'schedule' && poll.timeSlots && (
          <div className="space-y-4 mb-6">
            {poll.timeSlots.map((slot) => (
              <div key={slot.date} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
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
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-600 cursor-default'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
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

        {/* Priority poll */}
        {poll.type === 'priority' && poll.options && (
          <div className="mb-6">
            {!voted && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                You have <strong>{poll.settings.votingPower ?? 5} points</strong> to distribute. Add more points to options you care about most.
              </p>
            )}
            <PriorityVoteInput
              options={poll.options}
              distribution={priorityDistribution}
              votingPower={poll.settings.votingPower ?? 5}
              onChange={setPriorityDistribution}
              disabled={voted}
            />
          </div>
        )}

        {/* Custom poll options (selectable cards rendered in iframes) */}
        {poll.type === 'custom' && poll.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {poll.settings?.allowMultipleChoices && !voted && (
              <p className="col-span-full text-xs text-gray-500 dark:text-gray-400 mb-1">You can select multiple options.</p>
            )}
            {poll.options.map((opt) => {
              const isMultiple = !!poll.settings?.allowMultipleChoices
              const isSelected = isMultiple
                ? selectedOptions.includes(opt.id)
                : selectedOption === opt.id
              const isVoted = isMultiple
                ? votedOptionIds.includes(opt.id)
                : votedOptionId === opt.id
              const isActive = isSelected || isVoted
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (voted) return
                    if (isMultiple) {
                      setSelectedOptions((prev) =>
                        prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                      )
                    } else {
                      setSelectedOption(opt.id)
                    }
                  }}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all text-left ${
                    isActive
                      ? 'border-primary-500 ring-2 ring-primary-200 shadow-md'
                      : voted
                      ? 'border-gray-100 dark:border-gray-700 opacity-60 cursor-default'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-sm'
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
                  <div className={`px-4 py-3 border-t ${isActive ? 'border-primary-200 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {opt.text}
                      </span>
                      {/* Radio or checkbox indicator */}
                      {isMultiple ? (
                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          isActive ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                        }`}>
                          {isActive && (
                            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 12 12">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isActive ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                        }`}>
                          {isActive && (
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <circle cx="6" cy="6" r="3" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {voted && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>{getPercentage(opt.votes)}%</span>
                          <span>{opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
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
        <div className="mb-6 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-5 w-5 text-primary-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Poll Statistics</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
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
              (poll.type === 'schedule' && selectedSlots.length === 0) ||
              (poll.type === 'priority' && Object.values(priorityDistribution).every((v) => v === 0)) ||
              (poll.type !== 'schedule' && poll.type !== 'ranking' && poll.type !== 'priority' &&
                (poll.settings?.allowMultipleChoices ? selectedOptions.length === 0 : !selectedOption))
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

        {/* Notify Contacts Panel — shown to creator after poll creation */}
        {!notified && user?.uid === poll.createdBy && (
          <div className="mt-4 rounded-2xl border border-primary-100 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-primary-100 dark:border-primary-800">
              <Bell className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notify your contacts</span>
            </div>
            <div className="px-4 pt-3 pb-4 space-y-3">
              <ContactSelector selected={notifyContacts} onChange={setNotifyContacts} />
              <NotifyMethodPicker
                contacts={notifyContacts}
                byEmail={notifyByEmail}
                bySms={notifyBySms}
                onEmailChange={setNotifyByEmail}
                onSmsChange={setNotifyBySms}
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleNotify}
                  disabled={notifying || notifyContacts.length === 0}
                  className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-40 transition-colors"
                >
                  {notifying ? <Spinner size="sm" /> : 'Send Notifications'}
                </button>
                <button
                  type="button"
                  onClick={() => setNotified(true)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Panel */}
        <div className="mt-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSharePanel((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Share this poll
            </span>
            {showSharePanel ? <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
          </button>
          {showSharePanel && poll && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100 dark:border-gray-700">
              {/* Copy link */}
              <button
                type="button"
                onClick={share}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Copy / Share Link
              </button>
              {/* WhatsApp */}
              <a
                href={buildWhatsAppShareLink(poll.question, poll.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Share via WhatsApp
              </a>
              {/* QR Code */}
              <PollQRCode pollId={poll.id} size={140} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
