import { useState, useMemo } from 'react'
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

const DEFAULT_HTML = `<div class="poll-container">
    <h3>What's your favorite framework?</h3>

    <div class="options">
        <div class="option active">
            <img src="react.svg" alt="React"
/>

            <span>React</span>
        </div>
        <div class="option">
            <img src="vue.svg" alt="Vue" />
            <span>Vue.js</span>
        </div>
    </div>

    <button class="vote-btn">Cast Vote</button>
</div>`

const DEFAULT_CSS = `body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 16px;
    background: #f6f6f8;
}

.poll-container {
    max-width: 400px;
    margin: 0 auto;
}

h3 {
    color: #1a1a2e;
    font-size: 1.25rem;
    margin-bottom: 1rem;
}

.options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
}

.option:hover,
.option.active {
    border-color: #5d5fef;
    background: #eef0fd;
}

.option img {
    width: 32px;
    height: 32px;
}

.vote-btn {
    width: 100%;
    padding: 0.875rem;
    background: #5d5fef;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
}

.vote-btn:hover {
    background: #4b4dcc;
}`

const DEFAULT_JS = `// Add interactivity to your poll
document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.option').forEach(o => {
            o.classList.remove('active');
        });
        option.classList.add('active');
    });
});

document.querySelector('.vote-btn')?.addEventListener('click', () => {
    const selected = document.querySelector('.option.active span');
    if (selected) {
        alert('You voted for: ' + selected.textContent);
    }
});`

type TabId = 'html' | 'css' | 'js'

const TABS: { id: TabId; label: string; icon: typeof FileCode; prefix: string }[] = [
  { id: 'html', label: 'index.html', icon: FileCode, prefix: 'html' },
  { id: 'css', label: 'styles.css', icon: FileText, prefix: 'css' },
  { id: 'js', label: 'script.js', icon: FileJson, prefix: 'js' },
]

const SNIPPETS = [
  {
    icon: Image, label: 'Image Choice', description: 'Visual poll options',
    html: `\n<div class="option">\n    <img src="placeholder.svg" alt="Option" />\n    <span>New Option</span>\n</div>`,
  },
  {
    icon: Star, label: 'Star Rating', description: '1-5 scale feedback',
    html: `\n<div class="stars">\n    <span class="star" data-value="1">&#9733;</span>\n    <span class="star" data-value="2">&#9733;</span>\n    <span class="star" data-value="3">&#9733;</span>\n    <span class="star" data-value="4">&#9733;</span>\n    <span class="star" data-value="5">&#9733;</span>\n</div>`,
  },
  {
    icon: SlidersHorizontal, label: 'Range Slider', description: 'Numeric range input',
    html: `\n<div class="range-group">\n    <label>Rating: <span id="range-val">5</span>/10</label>\n    <input type="range" min="1" max="10" value="5"\n        oninput="document.getElementById('range-val').textContent=this.value" />\n</div>`,
  },
  {
    icon: ListOrdered, label: 'Ranking', description: 'Prioritize options',
    html: `\n<ol class="ranking">\n    <li draggable="true">First choice</li>\n    <li draggable="true">Second choice</li>\n    <li draggable="true">Third choice</li>\n</ol>`,
  },
]

export default function CreateCustom() {
  const [question, setQuestion] = useState('')
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML)
  const [cssCode, setCssCode] = useState(DEFAULT_CSS)
  const [jsCode, setJsCode] = useState(DEFAULT_JS)
  const [activeTab, setActiveTab] = useState<TabId>('html')
  const [anonymous, setAnonymous] = useState(true)
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

  const codeMap: Record<TabId, { value: string; set: (v: string) => void }> = {
    html: { value: htmlCode, set: setHtmlCode },
    css: { value: cssCode, set: setCssCode },
    js: { value: jsCode, set: setJsCode },
  }

  // Build the combined content for preview and storage
  const combinedContent = useMemo(() =>
    `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${cssCode}</style>
</head>
<body>
${htmlCode}
<script>${jsCode}<\/script>
</body>
</html>`,
    [htmlCode, cssCode, jsCode]
  )

  const previewSrcDoc = useMemo(() => combinedContent, [combinedContent])

  const handleSnippetInsert = (snippetHtml: string) => {
    setHtmlCode((prev) => prev + snippetHtml)
    setActiveTab('html')
    showToast('Snippet inserted into HTML', 'success')
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    if (!htmlCode.trim()) errs.content = 'HTML content is required.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const id = await createPoll({
        type: 'custom',
        question: question.trim(),
        description: '',
        customContent: combinedContent,
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
                {tab.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#1e1e2e] h-64">
            <CodeEditor
              value={codeMap[activeTab].value}
              onChange={codeMap[activeTab].set}
              language={activeTab}
            />
          </div>
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
        </div>

        {/* Mobile preview */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Preview</label>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white h-64">
            <iframe
              key={previewKey}
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
              <div>
                <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous" description="Hide who viewed this poll" />
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
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Editor area */}
            <div className="flex-1 bg-[#1e1e2e] overflow-auto">
              <CodeEditor
                value={codeMap[activeTab].value}
                onChange={codeMap[activeTab].set}
                language={activeTab}
              />
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
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <div className={`mx-auto h-full ${previewMode === 'mobile' ? 'max-w-[320px]' : ''}`}>
                <iframe
                  key={previewKey}
                  srcDoc={previewSrcDoc}
                  title="Live Preview"
                  sandbox="allow-scripts"
                  className="w-full h-full border-0 rounded-xl bg-white shadow-sm"
                  style={{ minHeight: '500px' }}
                />
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
