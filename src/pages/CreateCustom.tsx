import { useState, useMemo, useCallback } from 'react'
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
  FileCode,
  FileText,
  FileJson,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Pencil,
} from 'lucide-react'
import CodeEditor from '../components/CodeEditor'
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

const DEFAULT_OPTION_HTML = `<div class="option-card">
    <div class="option-icon">🎨</div>
    <h4>Option Title</h4>
    <p>Describe this option here</p>
</div>`

const DEFAULT_CSS = `.option-card {
    text-align: center;
    padding: 1.5rem;
    font-family: 'Inter', sans-serif;
}

.option-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
}

h4 {
    color: #1a1a2e;
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
}

p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
}`

const DEFAULT_JS = `// Shared JS for all options
// Use this for animations or interactivity`

type TabId = 'html' | 'css' | 'js'

interface OptionData {
  id: string
  name: string
  html: string
}

const TABS: { id: TabId; label: string; icon: typeof FileCode }[] = [
  { id: 'html', label: 'option.html', icon: FileCode },
  { id: 'css', label: 'styles.css', icon: FileText },
  { id: 'js', label: 'script.js', icon: FileJson },
]

const SNIPPETS = [
  {
    icon: Image, label: 'Image Card', description: 'Option with image',
    html: `<div class="option-card">
    <img src="https://placehold.co/120x120/e2e8f0/5d5fef?text=IMG" alt="Option" style="border-radius:0.75rem;margin-bottom:0.75rem" />
    <h4>Image Option</h4>
    <p>Click to vote for this</p>
</div>`,
  },
  {
    icon: Star, label: 'Emoji Card', description: 'Big emoji option',
    html: `<div class="option-card">
    <div style="font-size:3rem;margin-bottom:0.5rem">⭐</div>
    <h4>Star Option</h4>
    <p>A star-rated choice</p>
</div>`,
  },
  {
    icon: SlidersHorizontal, label: 'Stat Card', description: 'Option with stats',
    html: `<div class="option-card">
    <div style="font-size:2rem;font-weight:800;color:#5d5fef;margin-bottom:0.25rem">99%</div>
    <h4>Top Rated</h4>
    <p>The crowd favorite</p>
</div>`,
  },
  {
    icon: ListOrdered, label: 'List Card', description: 'Option with features',
    html: `<div class="option-card" style="text-align:left">
    <h4>🏆 Premium Plan</h4>
    <ul style="color:#6b7280;font-size:0.8125rem;padding-left:1.25rem;margin:0.5rem 0 0">
        <li>Feature one</li>
        <li>Feature two</li>
        <li>Feature three</li>
    </ul>
</div>`,
  },
]

let nextId = 1
function makeId() {
  return `opt_${Date.now()}_${nextId++}`
}

function makeDefaultOption(index: number): OptionData {
  const icons = ['🎨', '🚀', '💡', '🎯']
  const icon = icons[index % icons.length]
  return {
    id: makeId(),
    name: `Option ${index + 1}`,
    html: DEFAULT_OPTION_HTML.replace('🎨', icon).replace('Option Title', `Option ${index + 1}`),
  }
}

export default function CreateCustom() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<OptionData[]>(() => [
    makeDefaultOption(0),
    makeDefaultOption(1),
  ])
  const [activeOptionIdx, setActiveOptionIdx] = useState(0)
  const [cssCode, setCssCode] = useState(DEFAULT_CSS)
  const [jsCode, setJsCode] = useState(DEFAULT_JS)
  const [activeTab, setActiveTab] = useState<TabId>('html')
  const [anonymous, setAnonymous] = useState(true)
  const [multiChoice, setMultiChoice] = useState(false)
  const [duration, setDuration] = useState(24)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfig, setShowConfig] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [previewKey, setPreviewKey] = useState(0)

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const activeOption = options[activeOptionIdx] || options[0]

  const setActiveOptionHtml = useCallback((html: string) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === activeOptionIdx ? { ...o, html } : o))
    )
  }, [activeOptionIdx])

  const addOption = () => {
    const newOpt = makeDefaultOption(options.length)
    setOptions((prev) => [...prev, newOpt])
    setActiveOptionIdx(options.length)
    setActiveTab('html')
    showToast('Option added', 'success')
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      showToast('Need at least 2 options', 'error')
      return
    }
    setOptions((prev) => prev.filter((_, i) => i !== idx))
    if (activeOptionIdx >= idx && activeOptionIdx > 0) {
      setActiveOptionIdx(activeOptionIdx - 1)
    }
  }

  const duplicateOption = (idx: number) => {
    const src = options[idx]
    const dup: OptionData = { ...src, id: makeId(), name: `${src.name} (copy)` }
    const next = [...options]
    next.splice(idx + 1, 0, dup)
    setOptions(next)
    setActiveOptionIdx(idx + 1)
    showToast('Option duplicated', 'success')
  }

  const renameOption = (idx: number, name: string) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, name } : o))
    )
  }

  // Build full HTML document for a given option
  const buildOptionDoc = useCallback((optHtml: string) =>
    `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
body { margin: 0; }
${cssCode}
</style>
</head>
<body>
${optHtml}
<script>${jsCode}<\/script>
</body>
</html>`,
    [cssCode, jsCode]
  )

  const previewSrcDoc = useMemo(
    () => buildOptionDoc(activeOption.html),
    [buildOptionDoc, activeOption.html]
  )

  const handleSnippetInsert = (snippetHtml: string) => {
    setActiveOptionHtml(snippetHtml)
    setActiveTab('html')
    showToast('Snippet applied to current option', 'success')
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    if (options.length < 2) errs.options = 'Need at least 2 options.'
    const emptyOpt = options.find((o) => !o.html.trim())
    if (emptyOpt) errs.options = `"${emptyOpt.name}" has no HTML content.`
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const pollOptions = options.map((o) => ({
        id: o.id,
        text: o.name,
        votes: 0,
        customContent: buildOptionDoc(o.html),
      }))

      const id = await createPoll({
        type: 'custom',
        question: question.trim(),
        description: '',
        options: pollOptions,
        settings: { anonymous, multiChoice, duration },
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

  const codeValue = activeTab === 'html' ? activeOption.html : activeTab === 'css' ? cssCode : jsCode
  const codeOnChange = activeTab === 'html' ? setActiveOptionHtml : activeTab === 'css' ? setCssCode : setJsCode

  const tabLabel = activeTab === 'html' ? `${activeOption.name.toLowerCase().replace(/\s+/g, '-')}.html` : activeTab === 'css' ? 'styles.css' : 'script.js'

  /* ---- Mobile layout ---- */
  const mobileView = (
    <div className="lg:hidden min-h-screen bg-app-bg">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Custom Poll</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-4 pb-24 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Poll Title</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's the topic of this poll?"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400"
          />
          {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
        </div>

        {/* Options list */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Options ({options.length})</label>
          <div className="space-y-2 mb-3">
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                onClick={() => { setActiveOptionIdx(idx); setActiveTab('html') }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                  idx === activeOptionIdx
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => renameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveOptionIdx(idx); setActiveTab('html') }}
                  className="p-1 text-gray-400 hover:text-primary-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeOption(idx) }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4" /> Add Option
          </button>
          {errors.options && <p className="mt-1 text-xs text-red-500">{errors.options}</p>}
        </div>

        {/* Mobile tabs */}
        <div>
          <div className="flex gap-1 mb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.id === 'html' ? activeOption.name : tab.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#1e1e2e] h-64">
            <CodeEditor
              value={codeValue}
              onChange={codeOnChange}
              language={activeTab}
            />
          </div>
        </div>

        {/* Mobile preview */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Preview: {activeOption.name}</label>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white h-48">
            <iframe
              key={`${previewKey}-${activeOption.id}`}
              srcDoc={previewSrcDoc}
              title="Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0"
            />
          </div>
        </div>

        {/* Mobile settings */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Settings</label>
          <div className="rounded-2xl bg-white border border-gray-100 divide-y divide-gray-100">
            <div className="px-4 py-4">
              <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous" description="Hide who viewed this poll" />
            </div>
            <div className="px-4 py-4">
              <Toggle checked={multiChoice} onChange={setMultiChoice} label="Allow Multiple Selections" description="Voters can pick more than one option" />
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
            <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6">
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
              <div className="space-y-3">
                <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous" description="Hide who viewed this poll" />
                <Toggle checked={multiChoice} onChange={setMultiChoice} label="Allow Multiple Selections" description="Voters can pick more than one option" />
              </div>
            </div>
          </div>
        )}

        {/* Three-panel editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Options list + Snippets */}
          <div className="w-56 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Options</h3>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                  title="Add option"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 mb-6">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    onClick={() => { setActiveOptionIdx(idx); setActiveTab('html') }}
                    className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                      idx === activeOptionIdx
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => renameOption(idx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none min-w-0"
                    />
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveOptionIdx(idx); setActiveTab('html') }}
                        className="p-1 text-gray-400 hover:text-primary-600"
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); duplicateOption(idx) }}
                        className="p-1 text-gray-400 hover:text-primary-600"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeOption(idx) }}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {errors.options && <p className="mb-4 text-xs text-red-500">{errors.options}</p>}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Snippets</p>

              <div className="space-y-2">
                {SNIPPETS.map((snippet) => {
                  const Icon = snippet.icon
                  return (
                    <button
                      key={snippet.label}
                      type="button"
                      onClick={() => handleSnippetInsert(snippet.html)}
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
              <div className="space-y-1">
                {[
                  { icon: GitBranch, label: 'Logic Jumps' },
                  { icon: Webhook, label: 'Webhooks' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-400">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Center panel - Code Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* File tabs */}
            <div className="flex items-center bg-[#252536] px-2 pt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const label = tab.id === 'html' ? tabLabel : tab.label
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1e1e2e] text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Editor area */}
            <div className="flex-1 bg-[#1e1e2e] overflow-auto">
              <CodeEditor
                value={codeValue}
                onChange={codeOnChange}
                language={activeTab}
              />
            </div>
          </div>

          {/* Right panel - Live Preview */}
          <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-900">Preview: {activeOption.name}</span>
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
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Single option preview */}
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <div className={`mx-auto h-full ${previewMode === 'mobile' ? 'max-w-[320px]' : ''}`}>
                <p className="text-xs text-gray-400 mb-2 font-medium">Editing: {activeOption.name}</p>
                <iframe
                  key={`${previewKey}-${activeOption.id}`}
                  srcDoc={previewSrcDoc}
                  title="Live Preview"
                  sandbox="allow-scripts"
                  className="w-full border-0 rounded-xl bg-white shadow-sm"
                  style={{ minHeight: '200px', height: '250px' }}
                />
              </div>
            </div>

            {/* All options preview */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 overflow-y-auto" style={{ maxHeight: '250px' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All Options</p>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    onClick={() => { setActiveOptionIdx(idx); setActiveTab('html') }}
                    className={`rounded-lg border overflow-hidden cursor-pointer transition-colors ${
                      idx === activeOptionIdx ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <iframe
                      key={`${previewKey}-all-${opt.id}`}
                      srcDoc={buildOptionDoc(opt.html)}
                      title={opt.name}
                      sandbox="allow-scripts"
                      className="w-full border-0 pointer-events-none"
                      style={{ height: '80px' }}
                    />
                    <div className="px-2 py-1 bg-white border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 truncate">{opt.name}</p>
                    </div>
                  </div>
                ))}
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
