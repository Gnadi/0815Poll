import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import RichEditor from '../components/RichEditor'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

const DURATION_OPTIONS = [
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

export default function CreateCustom() {
  const [question, setQuestion] = useState('')
  const [customContent, setCustomContent] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [duration, setDuration] = useState(24)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    if (!customContent || customContent === '<p></p>') errs.content = 'Content is required.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const id = await createPoll({
        type: 'custom',
        question: question.trim(),
        description: '',
        customContent,
        settings: { anonymous, duration },
        createdBy: user?.uid || null,
      })
      showToast('Custom poll created!', 'success')
      navigate(`/poll/${id}`)
    } catch {
      showToast('Failed to create poll. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Create Custom Poll" showBack>
      <div className="lg:max-w-3xl lg:mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            {/* Editor section - wider */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Poll Title / Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  placeholder="What's the topic of this poll?"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                />
                {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Custom Content</label>
                <p className="text-xs text-gray-500 mb-2">Use the rich text editor to build your poll format. This content will be shown to voters.</p>
                <RichEditor
                  content={customContent}
                  onChange={setCustomContent}
                  placeholder="Write your poll content here... Add instructions, options, or any custom format you like."
                />
                {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
              </div>
            </div>

            {/* Settings section - sidebar on desktop */}
            <div className="lg:col-span-2 space-y-6 mt-6 lg:mt-0">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Settings</label>
                <div className="rounded-2xl bg-white border border-gray-100 divide-y divide-gray-100">
                  <div className="px-4 py-4">
                    <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous" description="Hide who viewed this poll" />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">Duration</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDuration(opt.value)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
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
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50 lg:max-w-md lg:mx-auto lg:block"
          >
            {submitting ? <Spinner size="sm" /> : 'Create Poll'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
