import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
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
              <p className="text-xs font-bold text-gray-900">Ffff</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Ended 29 minutes ago</p>
            </div>
            {/* Top location card */}
            <div className="mx-3 mb-2 rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: BLUE }}>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/70 tracking-widest uppercase">Top Location</span>
                <span className="text-sm font-bold text-white leading-tight">Arlit</span>
                <span className="text-[9px] text-white/70">Agadez Region, Niger</span>
              </div>
              <div className="ml-auto">
                <svg className="h-6 w-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v12l-4-2-4 2V4M6 20h12" />
                </svg>
              </div>
            </div>
            {/* Map placeholder */}
            <div className="mx-3 mb-2 rounded-xl overflow-hidden relative" style={{ height: 120 }}>
              {/* Tile grid to simulate a map */}
              <div className="absolute inset-0" style={{ backgroundColor: '#e8eedc' }}>
                {/* Map grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <line x1="0" y1="25" x2="200" y2="25" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="0" y1="50" x2="200" y2="50" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="0" y1="75" x2="200" y2="75" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="100" y1="0" x2="100" y2="100" stroke="#aab" strokeWidth="0.5"/>
                  <line x1="150" y1="0" x2="150" y2="100" stroke="#aab" strokeWidth="0.5"/>
                  {/* Road lines */}
                  <path d="M20 30 Q60 20 80 50 Q100 75 140 60 Q170 50 190 55" stroke="#c8c8a0" strokeWidth="1.5" fill="none"/>
                  <path d="M0 60 Q40 55 70 65 Q110 75 150 50 Q170 40 200 45" stroke="#c8c8a0" strokeWidth="1" fill="none"/>
                </svg>
                {/* Map pin */}
                <div className="absolute" style={{ top: '35%', left: '55%', transform: 'translate(-50%,-50%)' }}>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md" style={{ backgroundColor: BLUE }}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                {/* Second smaller pin */}
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
                    <span className="text-[10px] font-semibold text-gray-700">Arlit</span>
                    <span className="text-[10px] text-gray-500">100%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: BLUE }} />
                  </div>
                  <p className="text-[8px] text-gray-400 mt-0.5">1 vote</p>
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

function CodeEditorMockup() {
  return (
    <div className="bg-gray-100 border-l border-gray-200 p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl overflow-hidden shadow-xl" style={{ backgroundColor: '#1e2030' }}>
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ backgroundColor: '#161827', borderColor: '#2a2d45' }}>
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-3 text-[11px] font-mono text-gray-400 tracking-wide">poll-config.json</span>
        </div>
        {/* Code content */}
        <div className="px-5 py-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
          <p><span className="text-gray-500">{'{'}</span></p>
          <p className="ml-4"><span className="text-red-400">"id"</span><span className="text-gray-400">: </span><span className="text-green-400">"live-event-0815"</span><span className="text-gray-500">,</span></p>
          <p className="ml-4"><span className="text-red-400">"type"</span><span className="text-gray-400">: </span><span className="text-green-400">"sandbox"</span><span className="text-gray-500">,</span></p>
          <p className="ml-4"><span className="text-red-400">"theme"</span><span className="text-gray-400">: </span><span className="text-gray-500">{'{'}</span></p>
          <p className="ml-8"><span className="text-red-400">"primary"</span><span className="text-gray-400">: </span><span className="text-green-400">"#0052FF"</span><span className="text-gray-500">,</span></p>
          <p className="ml-8"><span className="text-red-400">"borderRadius"</span><span className="text-gray-400">: </span><span className="text-green-400">"12px"</span></p>
          <p className="ml-4"><span className="text-gray-500">{'}'}</span><span className="text-gray-500">,</span></p>
          <p className="ml-4"><span className="text-red-400">"components"</span><span className="text-gray-400">: </span><span className="text-gray-500">{'['}</span></p>
          <p className="ml-8"><span className="text-gray-500">{'{'}</span></p>
          <p className="ml-12"><span className="text-red-400">"type"</span><span className="text-gray-400">: </span><span className="text-green-400">"visual-select"</span><span className="text-gray-500">,</span></p>
          <p className="ml-12"><span className="text-red-400">"options"</span><span className="text-gray-400">: </span><span className="text-gray-500">['</span><span className="text-yellow-300">"A"</span><span className="text-gray-500">, </span><span className="text-yellow-300">"B"</span><span className="text-gray-500">, </span><span className="text-yellow-300">"C"</span><span className="text-gray-500">]</span></p>
          <p className="ml-8"><span className="text-gray-500">{'}'}</span><span className="text-gray-500">,</span></p>
          <p className="ml-8"><span className="text-gray-500">{'{'}</span></p>
          <p className="ml-12"><span className="text-red-400">"type"</span><span className="text-gray-400">: </span><span className="text-green-400">"geofence"</span><span className="text-gray-500">,</span></p>
          <p className="ml-12"><span className="text-red-400">"radius"</span><span className="text-gray-400">: </span><span className="text-blue-400">500</span></p>
          <p className="ml-8"><span className="text-gray-500">{'}'}</span></p>
          <p className="ml-4"><span className="text-gray-500">{']'}</span><span className="text-gray-500">,</span></p>
          <p className="ml-4"><span className="text-red-400">"logic"</span><span className="text-gray-400">: </span><span className="text-green-400">"on_complete =&gt; trigger_webhook"</span></p>
          <p><span className="text-gray-500">{'}'}</span></p>
        </div>
        {/* Footer bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ backgroundColor: '#161827', borderColor: '#2a2d45' }}>
          <span className="text-[10px] font-mono font-semibold tracking-widest" style={{ color: '#6b7280' }}>TERMINAL ACTIVE</span>
          <button
            className="rounded-md px-3 py-1 text-[11px] font-bold text-white"
            style={{ backgroundColor: BLUE }}
          >
            Deploy Config
          </button>
        </div>
      </div>
    </div>
  )
}

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
            <span className="text-lg font-bold text-gray-900 dark:text-white">0815poll</span>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-[#1a56db] border-b-2 border-[#1a56db] pb-0.5">Polls</a>
              <a href="#" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Templates</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</a>
              <a href="#" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">About</a>
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
            <Link to="/auth" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5">Log In</Link>
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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Live Opinion Engine</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl lg:text-[3.25rem]">
              Create and share<br />every kind of poll
            </h1>
            <p className="mt-5 text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
              From classic rapid-fire questions to location-based voting and custom sandbox builds.
              The ultimate platform for precision data and spontaneous energy.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link
                to="/auth"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: BLUE }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
              >
                Get Started for Free
              </Link>
              <Link
                to="/explore"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                See Examples
              </Link>
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 dark:bg-gray-800/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">Engineered for every use case</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-base">Choose your canvas. Capture the pulse.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Classic Polls */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <svg className="h-5 w-5" style={{ color: BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Classic Polls</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Simple, fast, and effective. The standard for quick decision making and rapid feedback loops.</p>
            </div>

            {/* Location Polls */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <svg className="h-5 w-5" style={{ color: BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Location Polls</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Map-based voting for events, local initiatives, or global trends. See where the world stands.</p>
            </div>

            {/* Date Polls */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <svg className="h-5 w-5" style={{ color: BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Date Polls</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Scheduling made easy. Find the perfect time for meetings, parties, or launches without the back-and-forth.</p>
            </div>

            {/* Sandbox Editor */}
            <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: BLUE }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">Sandbox Editor</h3>
              <p className="text-sm text-white/70 leading-relaxed">Build your own from scratch. Infinite possibilities with a powerful drag-and-drop toolkit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Sandbox */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-20 border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl leading-tight">
                  The Infinite<br />Sandbox
                </h2>
                <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">
                  Don't settle for templates. Our editor lets you snap components together—images,
                  rich text, nested logic—to create a polling experience that is uniquely yours.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <svg className="h-4 w-4" style={{ color: BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Drag-and-Drop Canvas</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Organize your data exactly how you want it.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <svg className="h-4 w-4" style={{ color: BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Granular Customization</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Control colors, logic, and visibility rules.</p>
                    </div>
                  </div>
                </div>
              </div>

              <CodeEditorMockup />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-[#0d1b2a] px-8 py-14 md:px-16 text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">Join thousands of creators</h2>
            <p className="mt-3 text-white/60 text-base max-w-md mx-auto">
              Start gathering real-time insights with the world's most flexible polling engine.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full sm:flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/40 focus:bg-white/15"
              />
              <Link
                to="/auth"
                className="w-full sm:w-auto rounded-lg px-6 py-3 text-sm font-bold text-white transition-colors whitespace-nowrap"
                style={{ backgroundColor: BLUE }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = BLUE)}
              >
                Start Now
              </Link>
            </div>
            <p className="mt-3 text-xs text-white/30">No credit card required. Free 14-day trial for premium features.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">0815poll</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">© 2026 Designed & Made by Johannes Gnadlinger</p>
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
