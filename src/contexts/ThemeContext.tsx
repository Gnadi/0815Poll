import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthContext } from './AuthContextDef'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // ignore
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user ?? null
  const userProfile = authCtx?.userProfile ?? null
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const themeRef = useRef<Theme>(theme)
  themeRef.current = theme

  const resolvedTheme = resolveTheme(theme)

  // Apply theme to document whenever it changes
  useEffect(() => {
    applyTheme(resolveTheme(theme))
  }, [theme])

  // Listen to system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(resolveTheme('system'))
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  // Sync with Firestore when user logs in
  const prevUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const currentUserId = userProfile?.id ?? null
    if (currentUserId === prevUserIdRef.current) return
    prevUserIdRef.current = currentUserId

    if (!currentUserId) return // logged out — keep current theme

    if (userProfile?.theme) {
      // Firestore theme takes precedence on login
      setThemeState(userProfile.theme)
      try { localStorage.setItem(STORAGE_KEY, userProfile.theme) } catch { /* ignore */ }
    } else {
      // Push local theme to Firestore for this user (load firestore lazily)
      const t = themeRef.current
      import('../lib/firestore').then(({ updateUserProfile }) => {
        updateUserProfile(currentUserId, { theme: t }).catch(() => {})
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    try { localStorage.setItem(STORAGE_KEY, newTheme) } catch { /* ignore */ }
    if (user?.uid) {
      // Load firestore lazily — only needed for logged-in users
      const uid = user.uid
      import('../lib/firestore').then(({ updateUserProfile }) => {
        updateUserProfile(uid, { theme: newTheme }).catch(() => {})
      })
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
