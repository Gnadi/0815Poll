import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    const snoozedUntil = localStorage.getItem('pwa-install-snoozed-until')
    return snoozedUntil ? Date.now() < parseInt(snoozedUntil, 10) : false
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    const snoozedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    localStorage.setItem('pwa-install-snoozed-until', String(snoozedUntil))
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 flex items-center gap-3 md:left-auto md:right-6 md:w-80">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Install 0815Poll</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Add to your home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 shrink-0"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
        aria-label="Dismiss install prompt"
      >
        ✕
      </button>
    </div>
  )
}
