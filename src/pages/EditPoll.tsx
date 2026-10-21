import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X, Lock, RotateCcw, AlertTriangle, Code2, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import Layout from '../components/Layout'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import CodeEditor from '../components/CodeEditor'
import { DEFAULT_TIMES } from '../components/TimeSlotPicker'
import { getPoll, updatePoll, removeAllVotes, removeVotesForOptions } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import MapPicker from '../components/MapPicker'
import { uploadPollImage } from '../lib/storage'
import { nanoid } from '../lib/nanoid'
import { ALL_DAY, formatSlotTime } from '../types'
import type { LocationOption, Poll, PollOption, TimeSlot } from '../types'

const inputCls =
  'w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-hidden focus:border-primary-400 disabled:opacity-60'

const DT_FORMAT = "yyyy-MM-dd'T'HH:mm"

const NEW_CUSTOM_DOC =
  '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div style="text-align:center;padding:1.5rem;font-family:sans-serif"><h4>New option</h4></div></body></html>'

// Ranking and priority polls store points per voter, so individual options can't be unlocked separately.
const isPointsType = (p: Poll) => p.type === 'ranking' || p.type === 'priority'

const slotVotes = (s: TimeSlot, time: string) => s.votes?.[time] ?? 0

export default function EditPoll() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [anonymous, setAnonymous] = useState(true)
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false)
  const [endsAt, setEndsAt] = useState('')
  const [options, setOptions] = useState<PollOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [files, setFiles] = useState<Record<string, File>>({})
  const [votingPower, setVotingPower] = useState(5)
  const [pointsReset, setPointsReset] = useState(false)
  const [codeOpen, setCodeOpen] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getPoll(id)
      .then((p) => {
        setPoll(p)
        if (!p) return
        setQuestion(p.question)
        setDescription(p.description ?? '')
        setIsPrivate(p.isPrivate ?? false)
        setAnonymous(p.settings.anonymous)
        setAllowMultipleChoices(!!p.settings.allowMultipleChoices)
        setVotingPower(p.settings.votingPower ?? 5)
        setEndsAt(p.endsAt?.toDate ? format(p.endsAt.toDate(), DT_FORMAT) : '')
        setOptions(p.options ?? [])
        setLocations(p.locations ?? [])
        setSlots((p.timeSlots ?? []).map((s) => ({ ...s, times: [...s.times], votes: { ...(s.votes ?? {}) } })))
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading || authLoading) {
    return (
      <Layout title="Edit Poll" showBack>
        <div className="flex justify-center py-20"><Spinner /></div>
      </Layout>
    )
  }

  if (!poll || !user || user.uid !== poll.createdBy) {
    return (
      <Layout title="Edit Poll" showBack>
        <p className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
          {poll ? 'Only the creator can edit this poll.' : 'Poll not found.'}
        </p>
      </Layout>
    )
  }

  const pointsType = isPointsType(poll)
  const pollWideLock = (pointsType || poll.type === 'schedule') && poll.totalVotes > 0 && !pointsReset
  const optionLocked = (o: PollOption) => (pointsType ? pollWideLock : o.votes > 0)
  const locationLocked = (l: LocationOption) => l.votes > 0
  const slotTimeLocked = (s: TimeSlot, t: string) => slotVotes(s, t) > 0
  const canAddRemoveOptions = poll.type !== 'location' && poll.type !== 'schedule' && (!pointsType || !pollWideLock)

  const confirmReset = (what: string) =>
    window.confirm(
      `Reset votes for ${what}?\n\nThe existing votes will be removed from the results. People who already voted will NOT be able to vote again. This is applied when you save and cannot be undone.`
    )

  const resetOption = (optId: string) => {
    if (!confirmReset('this option')) return
    setOptions(options.map((o) => (o.id === optId ? { ...o, votes: 0 } : o)))
  }
  const resetLocation = (locId: string) => {
    if (!confirmReset('this location')) return
    setLocations(locations.map((l) => (l.id === locId ? { ...l, votes: 0 } : l)))
  }
  const resetAllPollVotes = () => {
    if (!confirmReset('ALL options of this poll')) return
    setPointsReset(true)
    setOptions(options.map((o) => ({ ...o, votes: 0, bordaPoints: 0, priorityPoints: 0 })))
    setSlots(slots.map((s) => ({ ...s, votes: {} })))
  }

  const updateOption = (optId: string, patch: Partial<PollOption>) =>
    setOptions(options.map((o) => (o.id === optId ? { ...o, ...patch } : o)))

  const removeLocation = (locId: string) => {
    const loc = locations.find((l) => l.id === locId)
    if (loc && locationLocked(loc)) { showToast('Reset the votes of this location first.', 'error'); return }
    setLocations(locations.filter((l) => l.id !== locId))
  }

  const addTime = (date: string, time: string) =>
    setSlots(slots.map((s) => (s.date === date && !s.times.includes(time)
      ? { ...s, times: [...s.times.filter((t) => t !== ALL_DAY), time].sort() }
      : s)))

  const removeTime = (date: string, time: string) =>
    setSlots(slots.map((s) => {
      if (s.date !== date) return s
      const times = s.times.filter((t) => t !== time)
      const votes = { ...(s.votes ?? {}) }
      delete votes[time]
      return { ...s, times: times.length ? times : [ALL_DAY], votes }
    }))

  const addDate = () => {
    if (!newDate || slots.some((s) => s.date === newDate)) return
    setSlots([...slots, { date: newDate, times: [ALL_DAY], votes: {} }].sort((a, b) => a.date.localeCompare(b.date)))
    setNewDate('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) { setError('Question is required.'); return }
    if (options.length > 0) {
      if (options.length < 2) { setError('At least 2 options are required.'); return }
      if (poll.type !== 'image' && options.some((o) => !o.text.trim())) { setError('Options cannot be empty.'); return }
      if (poll.type === 'custom' && options.some((o) => !o.customContent?.trim())) { setError('Custom options need HTML content.'); return }
    }
    if (poll.timeSlots && slots.length === 0) { setError('At least one date is required.'); return }
    const end = new Date(endsAt)
    if (!endsAt || isNaN(end.getTime())) { setError('Please choose a valid end date.'); return }

    setError('')
    setSaving(true)
    try {
      // Options/locations whose votes were reset: delete the vote documents so people can vote again.
      let totalVotes = poll.totalVotes
      let finalOptions = options
      let finalLocations = locations
      if (pointsReset) {
        await removeAllVotes(poll.id)
        totalVotes = 0
      } else {
        const resetIds = [...(poll.options ?? []), ...(poll.locations ?? [])]
          .filter((b) => b.votes > 0 && [...options, ...locations].some((x) => x.id === b.id && x.votes === 0))
          .map((b) => b.id)
        if (resetIds.length > 0) {
          const { deleted, otherOptionDecrements } = await removeVotesForOptions(poll.id, resetIds)
          totalVotes = Math.max(0, totalVotes - deleted)
          const dec = <T extends { id: string; votes: number }>(list: T[]) =>
            list.map((x) => (otherOptionDecrements[x.id] ? { ...x, votes: Math.max(0, x.votes - otherOptionDecrements[x.id]) } : x))
          finalOptions = dec(options)
          finalLocations = dec(locations)
        }
      }
      if (poll.type === 'image') {
        finalOptions = await Promise.all(
          finalOptions.map(async (o) =>
            files[o.id] ? { ...o, imageUrl: await uploadPollImage(files[o.id], poll.id, o.id) } : o
          )
        )
        if (finalOptions.some((o) => !o.imageUrl)) { setError('Every image option needs an image.'); setSaving(false); return }
      }
      await updatePoll(poll.id, {
        question: question.trim(),
        description: description.trim(),
        isPrivate,
        settings: {
          ...poll.settings,
          anonymous,
          ...(poll.type === 'standard' ? { allowMultipleChoices } : {}),
          ...(poll.type === 'priority' ? { votingPower: Math.max(1, votingPower || 5) } : {}),
        },
        endsAt: end,
        totalVotes,
        ...(poll.options ? { options: finalOptions.map((o) => ({ ...o, text: o.text.trim() })) } : {}),
        ...(poll.locations
          ? { locations: finalLocations.map((l) => ({ ...l, name: l.name.trim(), address: l.address.trim() })) }
          : {}),
        ...(poll.timeSlots ? { timeSlots: slots } : {}),
      })
      showToast('Poll updated!', 'success')
      navigate(`/poll/${poll.id}`, { replace: true })
    } catch {
      showToast('Failed to update poll. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const LockNote = ({ onReset, label }: { onReset: () => void; label: string }) => (
    <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="flex-1">Locked: people have already voted. Reset the votes to change it.</span>
      <button type="button" onClick={onReset} className="inline-flex items-center gap-1 font-semibold underline shrink-0">
        <RotateCcw className="h-3 w-3" /> {label}
      </button>
    </div>
  )

  return (
    <Layout title="Edit Poll" showBack>
      <div className="lg:max-w-2xl lg:mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>

          {options.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Options</label>
              {pointsType && pollWideLock && <div className="mb-2"><LockNote onReset={resetAllPollVotes} label="Reset all votes" /></div>}
              <div className="space-y-3">
                {options.map((opt, idx) => {
                  const locked = optionLocked(opt)
                  return (
                    <div key={opt.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.text}
                          disabled={locked}
                          onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                          placeholder={`Option ${idx + 1}`}
                          className={inputCls}
                        />
                        {poll.type === 'custom' && (
                          <button
                            type="button"
                            aria-label="Edit HTML"
                            disabled={locked}
                            onClick={() => setCodeOpen(codeOpen === opt.id ? null : opt.id)}
                            className="text-gray-500 hover:text-primary-500 disabled:opacity-40"
                          >
                            <Code2 className="h-5 w-5" />
                          </button>
                        )}
                        {poll.type === 'image' && !locked && (
                          <label className="cursor-pointer text-gray-500 hover:text-primary-500" aria-label="Replace image">
                            <ImageIcon className="h-5 w-5" />
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) setFiles({ ...files, [opt.id]: f })
                              }}
                            />
                          </label>
                        )}
                        {locked && <Lock className="h-4 w-4 text-gray-400 shrink-0" />}
                        {canAddRemoveOptions && !locked && options.length > 2 && (
                          <button type="button" aria-label="Remove option" onClick={() => setOptions(options.filter((o) => o.id !== opt.id))} className="text-gray-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {poll.type === 'image' && (files[opt.id] || opt.imageUrl) && (
                        <img
                          src={files[opt.id] ? URL.createObjectURL(files[opt.id]) : opt.imageUrl}
                          alt={opt.text}
                          className="h-24 w-24 rounded-xl object-cover"
                        />
                      )}
                      {locked && !pointsType && <LockNote onReset={() => resetOption(opt.id)} label="Reset votes" />}
                      {poll.type === 'custom' && codeOpen === opt.id && !locked && (
                        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#1e1e2e] h-64">
                          <CodeEditor
                            value={opt.customContent ?? ''}
                            onChange={(v) => updateOption(opt.id, { customContent: v })}
                            language="html"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {canAddRemoveOptions && options.length < 10 && (
                <button
                  type="button"
                  onClick={() =>
                    setOptions([
                      ...options,
                      { id: nanoid(), text: '', votes: 0, ...(poll.type === 'image' ? { imageUrl: '' } : {}), ...(poll.type === 'custom' ? { customContent: NEW_CUSTOM_DOC } : {}) },
                    ])
                  }
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-800 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400"
                >
                  <Plus className="h-4 w-4" /> Add Option
                </button>
              )}
            </div>
          )}

          {(poll.type === 'location') && (
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Locations</label>
              <div className="space-y-3">
                {locations.map((loc) => {
                  const locked = locationLocked(loc)
                  return (
                    <div key={loc.id} className="space-y-1">
                      <input
                        type="text"
                        value={loc.name}
                        disabled={locked}
                        onChange={(e) => setLocations(locations.map((l) => (l.id === loc.id ? { ...l, name: e.target.value } : l)))}
                        className={inputCls}
                      />
                      <input
                        type="text"
                        value={loc.address}
                        disabled={locked}
                        onChange={(e) => setLocations(locations.map((l) => (l.id === loc.id ? { ...l, address: e.target.value } : l)))}
                        className={inputCls}
                      />
                      {locked && <LockNote onReset={() => resetLocation(loc.id)} label="Reset votes" />}
                    </div>
                  )
                })}
              </div>
              <div className="mt-3">
                <MapPicker
                  locations={locations}
                  onAddLocation={(loc) => setLocations([...locations, { ...loc, id: nanoid(), votes: 0 }])}
                  onRemoveLocation={removeLocation}
                />
              </div>
            </div>
          )}

          {poll.timeSlots && (
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Dates & Times</label>
              {pollWideLock && <div className="mb-2"><LockNote onReset={resetAllPollVotes} label="Reset all votes" /></div>}
              <div className="space-y-3">
                {slots.map((s) => {
                  const dateLocked = s.times.some((t) => slotTimeLocked(s, t))
                  return (
                    <div key={s.date} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{s.date}</span>
                        {!dateLocked && slots.length > 1 && (
                          <button type="button" aria-label="Remove date" onClick={() => setSlots(slots.filter((x) => x.date !== s.date))} className="text-gray-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {s.times.map((t) => {
                          const locked = slotTimeLocked(s, t)
                          return (
                            <span key={t} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300">
                              {locked && <Lock className="h-3 w-3 text-gray-400" />}
                              {formatSlotTime(t)}
                              {!locked && (
                                <button type="button" aria-label={`Remove ${t}`} onClick={() => removeTime(s.date, t)} className="text-gray-400 hover:text-red-500">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          )
                        })}
                      </div>
                      <select
                        value=""
                        onChange={(e) => e.target.value && addTime(s.date, e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">+ Add time</option>
                        {DEFAULT_TIMES.filter((t) => !s.times.includes(t)).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputCls} />
                <button type="button" onClick={addDate} disabled={!newDate} className="shrink-0 rounded-2xl bg-primary-500 px-4 text-sm font-semibold text-white disabled:opacity-50">
                  Add date
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Settings</label>
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              <div className="px-4 py-4">
                <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous Results" description="Hide voter identities" />
              </div>
              {poll.type === 'standard' && (
                <div className="px-4 py-4">
                  <Toggle checked={allowMultipleChoices} onChange={setAllowMultipleChoices} label="Multiple Choice" description="Voters can select more than one option" />
                </div>
              )}
              {poll.type === 'priority' && (
                <div className="px-4 py-4">
                  <label className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2 block">Points per voter</label>
                  <input type="number" min={1} max={100} value={votingPower} disabled={pollWideLock} onChange={(e) => setVotingPower(Number(e.target.value))} className={inputCls} />
                </div>
              )}
              <div className="px-4 py-4 flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <div className="flex-1">
                  <Toggle checked={isPrivate} onChange={setIsPrivate} label="Private Poll" description="Only people with the link can join" />
                </div>
              </div>
              <div className="px-4 py-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2 block">Ends at</label>
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
                {poll.status === 'ended' && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Choosing a future date re-opens this poll.</p>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
