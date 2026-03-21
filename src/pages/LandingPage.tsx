import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-gray-900">0815poll</span>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5">Login</Link>
            <Link to="/auth" className="rounded-lg bg-[#0d1b2a] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#162640] transition-colors">Signup</Link>
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
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl lg:text-[3.25rem]">
              Create and share<br />every kind of poll
            </h1>
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-md">
              From classic rapid-fire questions to location-based voting and custom sandbox builds.
              The ultimate platform for precision data and spontaneous energy.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link
                to="/auth"
                className="rounded-lg bg-[#0d1b2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162640] transition-colors"
              >
                Get Started for Free
              </Link>
              <Link
                to="/explore"
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                See Examples
              </Link>
            </div>
          </div>

          {/* Browser mockup */}
          <div className="hidden md:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 rounded bg-gray-200 h-5 max-w-[200px]" />
                <div className="ml-auto rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-bold text-white">Poll live!</div>
              </div>
              {/* Mock poll UI */}
              <div className="p-5 bg-[#1a3a30]">
                <div className="mb-4 h-2 w-24 rounded bg-emerald-400/40" />
                <div className="mb-3 h-4 w-3/4 rounded bg-white/20" />
                <div className="h-16 rounded-xl bg-white/10 mb-4" />
                <div className="space-y-2">
                  {['Option A', 'Option B', 'Option C'].map((opt, i) => (
                    <div key={opt} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                      <div className="h-3 rounded bg-white/30" style={{ width: `${[60, 30, 10][i]}%` }} />
                      <span className="text-xs text-white/60">{[60, 30, 10][i]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">Engineered for every use case</h2>
            <p className="mt-3 text-gray-500 text-base">Choose your canvas. Capture the pulse.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Classic Polls */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Classic Polls</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Simple, fast, and effective. The standard for quick decision making and rapid feedback loops.</p>
            </div>

            {/* Location Polls */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Location Polls</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Map-based voting for events, local initiatives, or global trends. See where the world stands.</p>
            </div>

            {/* Date Polls */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Date Polls</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Scheduling made easy. Find the perfect time for meetings, parties, or launches without the back-and-forth.</p>
            </div>

            {/* Sandbox Editor */}
            <div className="rounded-2xl bg-[#0d1b2a] p-6 text-white">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">Sandbox Editor</h3>
              <p className="text-sm text-white/60 leading-relaxed">Build your own from scratch. Infinite possibilities with a powerful drag-and-drop toolkit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Sandbox */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl leading-tight">
                  The Infinite<br />Sandbox
                </h2>
                <p className="mt-4 text-gray-500 leading-relaxed">
                  Don't settle for templates. Our editor lets you snap components together—images,
                  rich text, nested logic—to create a polling experience that is uniquely yours.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Drag-and-Drop Canvas</p>
                      <p className="text-sm text-gray-500">Organize your data exactly how you want it.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Granular Customization</p>
                      <p className="text-sm text-gray-500">Control colors, logic, and visibility rules.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor mockup */}
              <div className="bg-gray-50 border-l border-gray-200 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-gray-100">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-3 text-[10px] font-mono font-semibold text-gray-400 tracking-wider">EDITING MODE · CUSTOM SANDBOX</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-gray-300 text-lg">+</span> Add New Question Block
                    </div>
                    {[
                      { icon: '▦', label: 'Visual Selection', color: 'text-indigo-500' },
                      { icon: '◉', label: 'Geofence Filter', color: 'text-teal-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-base ${item.color}`}>{item.icon}</span>
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-0.5 w-4 bg-gray-300 rounded" />
                          <div className="h-0.5 w-4 bg-gray-300 rounded" />
                        </div>
                      </div>
                    ))}
                    <button className="w-full rounded-lg bg-[#c8ff45] py-2.5 text-sm font-bold text-gray-900 hover:bg-[#d4ff55] transition-colors">
                      Preview Component
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-8">Trusted by modern teams globally</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {['Vortex.io', 'NEXUS', 'PulseData', 'LUMINA', 'ORBIT'].map((name) => (
              <span key={name} className="text-base font-bold text-gray-300 hover:text-gray-400 transition-colors cursor-default">{name}</span>
            ))}
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
                className="w-full sm:w-auto rounded-lg bg-[#c8ff45] px-6 py-3 text-sm font-bold text-gray-900 hover:bg-[#d4ff55] transition-colors whitespace-nowrap"
              >
                Start Now
              </Link>
            </div>
            <p className="mt-3 text-xs text-white/30">No credit card required. Free 14-day trial for premium features.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-gray-900">0815poll</span>
            <p className="text-xs text-gray-400 mt-0.5">© 2024 0815poll. Precision Play in Every Vote.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Contact', 'API Documentation', 'Help Center'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{item}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
