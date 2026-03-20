import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import Layout from '../components/Layout'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { nanoid } from '../lib/nanoid'

const DURATION_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

export default function CreateStandard() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [anonymous, setAnonymous] = useState(true)
  const [duration, setDuration] = useState(24)
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
        type: 'standard',
        question: question.trim(),
        description: description.trim(),
        options: options.filter((o) => o.trim()).map((text) => ({
          id: nanoid(),
          text: text.trim(),
          votes: 0,
        })),
        settings: { anonymous, duration },
        createdBy: user?.uid || null,
      })
      showToast('Poll created!', 'success')
      navigate(`/poll/${id}`)
    } catch {
      showToast('Failed to create poll. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Create Poll" showBack>
      <div className="lg:max-w-2xl lg:mx-auto">
        <div className="hidden lg:block mb-6">
          <p className="text-gray-500">Gather opinions from your community in seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Poll Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="What's on your mind? e.g. Best place for Friday lunch?"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
            />
            {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Description <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add more context for your voters..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-800">Poll Options</label>
              <span className="text-xs text-gray-400">Min. 2 options</span>
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 shrink-0">
                    <div className="h-2 w-2 rounded-full" />
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
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
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Poll Settings</label>
            <div className="rounded-2xl bg-white border border-gray-100 divide-y divide-gray-100">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="flex-1">
                  <Toggle
                    checked={anonymous}
                    onChange={setAnonymous}
                    label="Anonymous Results"
                    description="Hide voter identities"
                  />
                </div>
              </div>
              <div className="px-4 py-4">
                <span className="text-sm font-medium text-gray-800 mb-3 block">Poll Duration</span>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${
                        duration === opt.value
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Spinner size="sm" /> : 'Create Poll'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
