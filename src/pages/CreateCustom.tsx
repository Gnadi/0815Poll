import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Image,
  Star,
  SlidersHorizontal,
  ListOrdered,
  GitBranch,
  Webhook,
  Settings,
  Rocket,
  Monitor,
  Smartphone,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import RichEditor from '../components/RichEditor'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

const DURATION_OPTIONS = [
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

const SNIPPETS = [
  { icon: Image, label: 'Image Choice', description: 'Visual poll options', template: '<h3>Choose your favorite</h3>\n<p>Option A vs Option B</p>' },
  { icon: Star, label: 'Star Rating', description: '1-5 scale feedback', template: '<h3>Rate this experience</h3>\n<p>⭐⭐⭐⭐⭐</p>' },
  { icon: SlidersHorizontal, label: 'Range Slider', description: 'Numeric range input', template: '<h3>How likely are you to recommend?</h3>\n<p>1 ——————— 10</p>' },
  { icon: ListOrdered, label: 'Ranking', description: 'Prioritize options', template: '<h3>Rank these options</h3>\n<ol><li>First choice</li><li>Second choice</li><li>Third choice</li></ol>' },
]

const ADVANCED_SNIPPETS = [
  { icon: GitBranch, label: 'Logic Jumps', description: 'Conditional flow' },
  { icon: Webhook, label: 'Webhooks', description: 'External integrations' },
]

export default function CreateCustom() {
  const [question, setQuestion] = useState('')
  const [customContent, setCustomContent] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [duration, setDuration] = useState(24)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfig, setShowConfig] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSnippetInsert = (template: string) => {
    setCustomContent((prev) => prev ? prev + template : template)
    showToast('Snippet added to editor', 'success')
  }

  const handleSubmit = async () => {
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

  /* ---- Mobile layout ---- */
  const mobileView = (
    <div className="lg:hidden min-h-screen bg-app-bg">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Create Custom Poll</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-4 pb-24 space-y-6">
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
          <RichEditor
            content={customContent}
            onChange={setCustomContent}
            placeholder="Write your poll content here..."
          />
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
        </div>

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

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {submitting ? <Spinner size="sm" /> : 'Create Poll'}
        </button>
      </div>
      <BottomNav />
    </div>
  )

  /* ---- Desktop layout ---- */
  const desktopView = (
    <div className="hidden lg:block min-h-screen bg-app-bg">
      <Sidebar />

      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top header bar */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Custom Poll Editor</h1>
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Draft saved
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Config
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              {submitting ? 'Creating...' : 'Save & Preview'}
            </button>
          </div>
        </header>

        {/* Config panel (collapsible) */}
        {showConfig && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Poll Title / Question</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What's the topic of this poll?"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-400"
                  />
                  {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Duration</label>
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
                <div>
                  <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous" description="Hide who viewed this poll" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Three-panel editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Snippets */}
          <div className="w-56 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="px-4 py-4">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Snippets</h3>
              <p className="text-xs text-gray-500 mb-4">Drag & drop ready-to-use components</p>

              <div className="space-y-2">
                {SNIPPETS.map((snippet) => {
                  const Icon = snippet.icon
                  return (
                    <button
                      key={snippet.label}
                      type="button"
                      onClick={() => handleSnippetInsert(snippet.template)}
                      className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-left hover:bg-primary-50 hover:border-primary-200 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 shrink-0">
                        <Icon className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{snippet.label}</p>
                        <p className="text-xs text-gray-500 truncate">{snippet.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-3">Advanced</p>
              <div className="space-y-2">
                {ADVANCED_SNIPPETS.map((snippet) => {
                  const Icon = snippet.icon
                  return (
                    <div
                      key={snippet.label}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-400"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{snippet.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Center panel - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Editor tabs */}
            <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4">
              <div className="flex items-center gap-1 px-3 py-2.5 border-b-2 border-primary-500 text-primary-600 text-sm font-medium">
                <span className="text-xs text-primary-400">{'</>'}</span>
                Content Editor
              </div>
            </div>

            {/* Editor area with dark theme */}
            <div className="flex-1 bg-[#1e1e2e] overflow-y-auto">
              <div className="p-0 custom-editor-dark">
                <RichEditor
                  content={customContent}
                  onChange={setCustomContent}
                  placeholder="Start building your custom poll content..."
                />
                {errors.content && <p className="mx-4 mb-4 text-xs text-red-400">{errors.content}</p>}
              </div>
            </div>
          </div>

          {/* Right panel - Live Preview */}
          <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-900">Live Preview</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-lg transition-colors ${previewMode === 'desktop' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-lg transition-colors ${previewMode === 'mobile' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCustomContent(customContent)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className={`mx-auto bg-white rounded-2xl border border-gray-200 p-5 shadow-sm ${previewMode === 'mobile' ? 'max-w-[280px]' : ''}`}>
                {/* Preview header badge */}
                {question && (
                  <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-3 uppercase tracking-wide">
                    Community Poll
                  </span>
                )}

                {/* Preview title */}
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {question || 'Your poll title will appear here'}
                </h3>

                {/* Preview content */}
                {customContent && customContent !== '<p></p>' ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: customContent }}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                        <div className="h-2 bg-gray-50 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-2/3 mb-1.5" />
                        <div className="h-2 bg-gray-50 rounded w-2/5" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-1/2 mb-1.5" />
                        <div className="h-2 bg-gray-50 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview submit button */}
                <button
                  type="button"
                  className="w-full rounded-xl bg-primary-500 py-3 text-sm font-bold text-white mt-5"
                  disabled
                >
                  Submit Response
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Preview only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  )
}
