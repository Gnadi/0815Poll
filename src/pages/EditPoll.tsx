import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X, Lock } from 'lucide-react'
import { format } from 'date-fns'
import Layout from '../components/Layout'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import { getPoll, updatePoll } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { nanoid } from '../lib/nanoid'
import type { LocationOption, Poll, PollOption } from '../types'

const inputCls =
  'w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400'

const DT_FORMAT = "yyyy-MM-dd'T'HH:mm"

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
        setEndsAt(p.endsAt?.toDate ? format(p.endsAt.toDate(), DT_FORMAT) : '')
        setOptions(p.options ?? [])
        setLocations(p.locations ?? [])
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

  // Options may only be added/removed while nobody has voted yet; texts can always be fixed.
  const structureLocked = poll.totalVotes > 0
  const canEditOptionList = poll.type === 'standard' && !structureLocked
  const hasEditableOptions = options.length > 0 && poll.type !== 'custom'

  const updateOptionText = (optId: string, text: string) =>
    setOptions(options.map((o) => (o.id === optId ? { ...o, text } : o)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) { setError('Question is required.'); return }
    if (hasEditableOptions && options.some((o) => !o.text.trim()) && poll.type !== 'image') {
      setError('Options cannot be empty.'); return
    }
    if (hasEditableOptions && options.length < 2) { setError('At least 2 options are required.'); return }
    const end = new Date(endsAt)
    if (!endsAt || isNaN(end.getTime())) { setError('Please choose a valid end date.'); return }

    setError('')
    setSaving(true)
    try {
      await updatePoll(poll.id, {
        question: question.trim(),
        description: description.trim(),
        isPrivate,
        settings: {
          ...poll.settings,
          anonymous,
          ...(poll.type === 'standard' ? { allowMultipleChoices } : {}),
        },
        endsAt: end,
        ...(poll.options ? { options: options.map((o) => ({ ...o, text: o.text.trim() })) } : {}),
        ...(poll.locations
          ? { locations: locations.map((l) => ({ ...l, name: l.name.trim(), address: l.address.trim() })) }
          : {}),
      })
      showToast('Poll updated!', 'success')
      navigate(`/poll/${poll.id}`, { replace: true })
    } catch {
      showToast('Failed to update poll. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

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

          {hasEditableOptions && (
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Options</label>
              {poll.type !== 'standard' || structureLocked ? (
                <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
                  {structureLocked ? 'Votes already exist: you can fix wording, but not add or remove options.' : ''}
                </p>
              ) : null}
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOptionText(opt.id, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className={inputCls}
                    />
                    {canEditOptionList && options.length > 2 && (
                      <button type="button" aria-label="Remove option" onClick={() => setOptions(options.filter((o) => o.id !== opt.id))} className="text-gray-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canEditOptionList && options.length < 10 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, { id: nanoid(), text: '', votes: 0 }])}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-800 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400"
                >
                  <Plus className="h-4 w-4" /> Add Option
                </button>
              )}
            </div>
          )}

          {locations.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Locations</label>
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="space-y-1">
                    <input
                      type="text"
                      value={loc.name}
                      onChange={(e) => setLocations(locations.map((l) => (l.id === loc.id ? { ...l, name: e.target.value } : l)))}
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={loc.address}
                      onChange={(e) => setLocations(locations.map((l) => (l.id === loc.id ? { ...l, address: e.target.value } : l)))}
                      className={inputCls}
                    />
                  </div>
                ))}
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
