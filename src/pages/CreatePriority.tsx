import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import Layout from '../components/Layout'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import ContactSelector from '../components/ContactSelector'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { nanoid } from '../lib/nanoid'
import type { Contact } from '../types'

const DURATION_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

const VOTING_POWER_OPTIONS = [3, 5, 10]

export default function CreatePriority() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', '', ''])
  const [votingPower, setVotingPower] = useState(5)
  const [anonymous, setAnonymous] = useState(true)
  const [duration, setDuration] = useState(24)
  const [invitedContacts, setInvitedContacts] = useState<Contact[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ''])
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== idx))
  }

  const updateOption = (idx: number, value: string) => {
    setOptions(options.map((o, i) => (i === idx ? value : o)))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    const filledOptions = options.filter((o) => o.trim())
    if (filledOptions.length < 2) errs.options = 'At least 2 options are required.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const id = await createPoll({
        type: 'priority',
        question: question.trim(),
        description: description.trim(),
        options: options.filter((o) => o.trim()).map((text) => ({
          id: nanoid(),
          text: text.trim(),
          votes: 0,
          priorityPoints: 0,
        })),
        settings: { anonymous, duration, votingPower },
        createdBy: user?.uid || null,
        invitedContactEmails: invitedContacts.map((c) => c.email),
      })
      showToast('Poll created!', 'success')
      navigate(`/poll/${id}`, { state: { contacts: invitedContacts } })
    } catch {
      showToast('Failed to create poll. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Create Priority Poll" showBack>
      <div className="lg:max-w-5xl lg:mx-auto">
        <div className="hidden lg:block mb-6">
          <p className="text-gray-500 dark:text-gray-400">Each voter distributes points across options. Results form a weighted ranking.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            {/* Left column: question + options */}
            <div className="lg:col-span-3 space-y-6">
              {/* Explanation banner (mobile only) */}
              <div className="lg:hidden mb-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-3">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">How it works</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Every voter gets a fixed number of points to distribute freely across options. The option with the most accumulated points wins.
                </p>
              </div>

              {/* Question */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder='e.g. "Which features should we build next quarter?"'
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
                />
                {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add more context for your voters..."
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-800 dark:text-gray-100">Options</label>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Min. 2 options</span>
                </div>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.options && <p className="mt-1 text-xs text-red-500">{errors.options}</p>}
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                )}
              </div>

              {/* Mobile: settings + submit */}
              <div className="lg:hidden space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Settings</label>
                  <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    <div className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 block">Voting Power per Person</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Points each voter can distribute.</p>
                      <div className="flex gap-2">
                        {VOTING_POWER_OPTIONS.map((pts) => (
                          <button key={pts} type="button" onClick={() => setVotingPower(pts)}
                            className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors border ${votingPower === pts ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                            {pts} pts
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="px-4 py-4"><Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous Results" description="Hide voter identities" /></div>
                    <div className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3 block">Poll Duration</span>
                      <div className="flex flex-wrap gap-2">
                        {DURATION_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setDuration(opt.value)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${duration === opt.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Invite Contacts <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
                  <ContactSelector selected={invitedContacts} onChange={setInvitedContacts} />
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-blue-500 py-4 text-base font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                  {submitting ? <Spinner size="sm" /> : 'Create Priority Poll'}
                </button>
              </div>
            </div>

            {/* Right column: explanation + settings + submit (desktop only) */}
            <div className="hidden lg:block lg:col-span-2 space-y-6">
              {/* How it works */}
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">How it works</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                  Every voter gets a fixed number of points to distribute freely across options — e.g., put 3 on your top pick and 2 on a second. The option with the most accumulated points wins.
                </p>
              </div>

              {/* Settings */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Settings</label>
                <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 block">Voting Power per Person</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Points each voter can distribute across options.</p>
                    <div className="flex gap-2">
                      {VOTING_POWER_OPTIONS.map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setVotingPower(pts)}
                          className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors border ${
                            votingPower === pts
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                        >
                          {pts} pts
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 py-4 flex items-center gap-3">
                    <div className="flex-1">
                      <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous Results" description="Hide voter identities" />
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3 block">Poll Duration</span>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDuration(opt.value)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${
                            duration === opt.value
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invite contacts */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Invite Contacts <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
                <ContactSelector selected={invitedContacts} onChange={setInvitedContacts} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-blue-500 py-4 text-base font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Spinner size="sm" /> : 'Create Priority Poll'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
