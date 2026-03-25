import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, BarChart2, GripVertical, Calendar, MapPin, Sliders, Target, ImageIcon, Github, Code2, Eye, Layers, ExternalLink } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/Spinner'

const BLUE = '#1a56db'
const BLUE_HOVER = '#1648c0'

function PhoneMockup() {
  return (
    <div className="hidden md:flex justify-center">
      {/* Phone frame */}
      <div className="relative w-56" style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.18))' }}>
        <div className="rounded-[2.5rem] bg-gray-900 p-2 border-4 border-gray-800">
          {/* Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10" />
          {/* Screen */}
          <div className="rounded-[2rem] bg-white overflow-hidden" style={{ minHeight: 420 }}>
            {/* Status bar */}
            <div className="bg-white px-4 pt-6 pb-1 flex justify-between items-center">
              <span className="text-[9px] font-semibold text-gray-400 tracking-wider">FINAL RESULTS</span>
              <span className="text-[9px] text-gray-400">31 Total votes</span>
            </div>
            {/* Poll title */}
            <div className="px-4 pb-2">
              <p className="text-xs font-bold text-gray-900">Best lunch spot?</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Ended 29 minutes ago</p>
            </div>
            {/* Top location card */}
            <div className="mx-3 mb-2 rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: BLUE }}>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/70 tracking-widest uppercase">Top Location</span>
                <span className="text-sm font-bold text-white leading-tight">Central Park</span>
                <span className="text-[9px] text-white/70">New York, USA</span>
              </div>
              <div className="ml-auto">
                <svg className="h-6 w-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v12l-4-2-4 2V4M6 20h12" />
                </svg>
              </div>
            </div>
            {/* Map placeholder */}
            <div className="mx-3 mb-2 rounded-xl overflow-hidden relative" style={{ height: 120 }}>
              <div className="absolute inset-0" style={{ backgroundColor: '#e8eedc' }}>
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <line x1="0" y1="25" x2="200" y2="25" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="0" y1="50" x2="200" y2="50" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="0" y1="75" x2="200" y2="75" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="100" y1="0" x2="100" y2="100" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="150" y1="0" x2="150" y2="100" stroke="#aab" strokeWidth="0.5"/>
                  <path d="M20 30 Q60 20 80 50 Q100 75 140 60 Q170 50 190 55" stroke="#c8c8a0" strokeWidth="1.5" fill="none"/>
                  <path d="M0 60 Q40 55 70 65 Q110 75 150 50 Q170 40 200 45" stroke="#c8c8a0" strokeWidth="1" fill="none"/>
                </svg>
                <div className="absolute" style={{ top: '35%', left: '55%', transform: 'translate(-50%,-50%)' }}>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md" style={{ backgroundColor: BLUE }}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="absolute" style={{ top: '60%', left: '30%', transform: 'translate(-50%,-50%)' }}>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow" style={{ backgroundColor: BLUE + 'aa' }}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            {/* Voting Distribution */}
            <div className="px-4 pb-4">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Voting Distribution</p>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-semibold text-gray-700">Central Park</span>
                    <span className="text-[10px] text-gray-500">68%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '68%', backgroundColor: BLUE }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-semibold text-gray-700">Times Square</span>
                    <span className="text-[10px] text-gray-500">32%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '32%', backgroundColor: BLUE + '88' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom nav */}
            <div className="border-t border-gray-100 px-4 py-2 flex justify-around">
              {['Polls', 'Create', 'Profile'].map(label => (
                <span key={label} className="text-[9px] text-gray-400 font-medium">{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomEditorMockup() {
  const tabs = ['option.html', 'styles.css', 'script.js']
  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl overflow-hidden shadow-xl" style={{ backgroundColor: '#1e2030' }}>
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ backgroundColor: '#161827', borderColor: '#2a2d45' }}>
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
          {/* Tabs */}
          <div className="ml-3 flex items-center gap-1">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className="px-2.5 py-0.5 rounded text-[10px] font-mono"
                style={
                  i === 0
                    ? { backgroundColor: '#1e2030', color: '#e2e8f0' }
                    : { color: '#6b7280' }
                }
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
        {/* Code content */}
        <div className="px-5 py-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
          <p><span className="text-blue-400">{'<'}</span><span className="text-red-400">div</span> <span className="text-yellow-300">class</span><span className="text-gray-400">=</span><span className="text-green-400">"option-card"</span><span className="text-blue-400">{'>'}</span></p>
          <p className="ml-4"><span className="text-blue-400">{'<'}</span><span className="text-red-400">div</span> <span className="text-yellow-300">class</span><span className="text-gray-400">=</span><span className="text-green-400">"option-icon"</span><span className="text-blue-400">{'>'}</span><span className="text-gray-300">🎨</span><span className="text-blue-400">{'</'}</span><span className="text-red-400">div</span><span className="text-blue-400">{'>'}</span></p>
          <p className="ml-4"><span className="text-blue-400">{'<'}</span><span className="text-red-400">h4</span><span className="text-blue-400">{'>'}</span><span className="text-gray-300">Option Title</span><span className="text-blue-400">{'</'}</span><span className="text-red-400">h4</span><span className="text-blue-400">{'>'}</span></p>
          <p className="ml-4"><span className="text-blue-400">{'<'}</span><span className="text-red-400">p</span><span className="text-blue-400">{'>'}</span><span className="text-gray-300">Describe this option here</span><span className="text-blue-400">{'</'}</span><span className="text-red-400">p</span><span className="text-blue-400">{'>'}</span></p>
          <p className="mt-2 ml-4"><span className="text-blue-400">{'<'}</span><span className="text-red-400">button</span> <span className="text-yellow-300">class</span><span className="text-gray-400">=</span><span className="text-green-400">"vote-btn"</span><span className="text-blue-400">{'>'}</span></p>
          <p className="ml-8"><span className="text-gray-300">Vote for this</span></p>
          <p className="ml-4"><span className="text-blue-400">{'</'}</span><span className="text-red-400">button</span><span className="text-blue-400">{'>'}</span></p>
          <p><span className="text-blue-400">{'</'}</span><span className="text-red-400">div</span><span className="text-blue-400">{'>'}</span></p>
        </div>
        {/* Footer bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ backgroundColor: '#161827', borderColor: '#2a2d45' }}>
          <span className="text-[10px] font-mono font-semibold tracking-widest" style={{ color: '#6b7280' }}>LIVE PREVIEW</span>
          <button
            className="rounded-md px-3 py-1 text-[11px] font-bold text-white"
            style={{ backgroundColor: BLUE }}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  )
}

const POLL_TYPES = [
  {
    label: 'Classic Polls',
    description: 'Simple, fast multiple-choice questions. The standard for quick decisions and rapid feedback loops.',
    icon: BarChart2,
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'Ranking Polls',
    description: 'Drag-and-drop ranking with Borda Count scoring. Perfect when order matters, not just the winner.',
    icon: GripVertical,
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    label: 'Schedule Polls',
    description: 'Find the perfect time for meetings, events, or launches without the endless back-and-forth.',
    icon: Calendar,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Location Polls',
    description: 'Map-based voting for events, local initiatives, or global trends. See where the world stands.',
    icon: MapPin,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Custom Polls',
    description: 'Write your own HTML, CSS & JS for each option. Full creative control — no limits.',
    icon: Sliders,
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    label: 'Priority Polls',
    description: 'Point-distribution voting. Voters allocate a budget of points to show how much each option matters.',
    icon: Target,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Image Polls',
    description: 'Photo-based voting for designs, products, or any visual choice. Let the images speak.',
    icon: ImageIcon,
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
]

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true })
  }, [user, loading, navigate])

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Spinner /></div>
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-gray-900 dark:text-white">PollFlex</span>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#poll-types" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Poll Types</a>
              <a href="#custom-editor" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Custom Editor</a>
              <a href="#open-source" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Open Source</a>
              <a
                href="https://github.com/gnadi/0815poll"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-gray-300" />
              ) : (
                <Moon className="h-4 w-4 text-gray-600" />
              )}
            </button>
            <Link to="/auth" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 transition-colors">Log In</Link>
            <Link
              to="/auth"
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: BLUE }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Live Opinion Engine</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-1">
                <Github className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">100% Free &amp; Open Source</span>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl lg:text-[3.25rem]">
              Every kind of poll.<br />
              <span style={{ color: BLUE }}>Completely free.</span>
            </h1>
            <p className="mt-5 text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
              7 poll types — from classic multiple choice to map-based voting, ranking, scheduling, and fully custom HTML/CSS/JS builds. Free forever, open source always.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link
                to="/auth"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: BLUE }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
              >
                Start Creating — It's Free
              </Link>
              <Link
                to="/explore"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Browse Examples
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">No credit card. No account required to browse. Always free.</p>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* Poll Types */}
      <section id="poll-types" className="bg-gray-50 dark:bg-gray-800/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">7 Poll Types</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">The right format for every question</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">Don't force your question into the wrong format. PollFlex has a dedicated poll type for every situation — all included, all free.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {POLL_TYPES.map(({ label, description, icon: Icon, bg, iconColor }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition-shadow"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Editor */}
      <section id="custom-editor" className="bg-gray-50 dark:bg-gray-800/50 py-20 border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-3 py-1 mb-5 self-start">
                  <Sliders className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Custom Poll Editor</span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl leading-tight">
                  Your poll,<br />your rules.
                </h2>
                <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">
                  Write real HTML, CSS, and JavaScript for each answer option. Fully customize how every choice looks and behaves — no restrictions, no templates required.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    {
                      icon: Code2,
                      title: 'HTML, CSS & JS per option',
                      body: 'Write custom markup and styles for every single answer option individually.',
                    },
                    {
                      icon: Eye,
                      title: 'Live preview',
                      body: 'See your changes render instantly in the built-in preview panel as you type.',
                    },
                    {
                      icon: Layers,
                      title: 'Code snippets library',
                      body: 'Jump-start with image cards, stat cards, emoji cards, list cards and more.',
                    },
                    {
                      icon: Sliders,
                      title: 'Zero limits',
                      body: 'Colors, fonts, animations, layout — if a browser can render it, you can build it.',
                    },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CustomEditorMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Free & Open Source */}
      <section id="open-source" className="py-20 px-6 bg-[#0d1b2a]">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mb-6">
                <Github className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl leading-tight">
                Free forever.<br />Open source always.
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed">
                PollFlex is completely free — no hidden fees, no premium tiers, no paywalls. The entire codebase is open source. Inspect it, fork it, self-host it, or contribute back.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://github.com/gnadi/0815poll"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </a>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: BLUE }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Right — trust cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                {
                  title: '100% Free',
                  body: 'No credit card. No trial. No paywall. Free to use forever with all features included.',
                  icon: '🆓',
                },
                {
                  title: 'Open Source',
                  body: 'MIT licensed. Full codebase on GitHub. Inspect every line, self-host, or fork it.',
                  icon: '🔓',
                },
                {
                  title: '7 Poll Types',
                  body: 'Classic, ranking, schedule, location, custom, priority, and image polls — all free.',
                  icon: '🗳️',
                },
              ].map(({ title, body, icon }) => (
                <div key={title} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="text-2xl mb-3">{icon}</div>
                  <p className="font-bold text-white text-sm mb-1.5">{title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">Start creating polls today</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-base">
            No account setup friction. No payment. Just create.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth"
              className="w-full sm:w-auto rounded-lg px-8 py-3 text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: BLUE }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
            >
              Create Your First Poll
            </Link>
            <a
              href="https://github.com/gnadi/0815poll"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-8 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">Always free. Always open. No credit card ever needed.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">PollFlex</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">© 2026 Designed &amp; Made by Johannes Gnadlinger</p>
            </div>
            <a
              href="https://github.com/gnadi/0815poll"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="GitHub repository"
            >
              <Github className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </a>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Support'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{item}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
