import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Sun, Moon } from 'lucide-react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
  hideNav?: boolean
  headerRight?: ReactNode
  noPadding?: boolean
}

export default function Layout({
  children,
  title,
  showBack,
  hideNav,
  headerRight,
  noPadding,
}: LayoutProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <div className="min-h-screen bg-app-bg dark:bg-dark-bg">
      {/* Desktop sidebar - always visible on desktop */}
      <Sidebar />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="min-h-screen flex flex-col lg:ml-64">
        <div className="mx-auto w-full max-w-md lg:max-w-5xl min-h-screen flex flex-col">
          {title !== undefined && (
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 lg:px-8 lg:py-4 lg:bg-app-bg dark:lg:bg-dark-bg lg:border-b-0">
              <div className="w-10 lg:w-auto">
                {showBack && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:h-9 lg:w-9"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
              </div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white lg:text-xl lg:hidden">{title}</h1>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => navigate('/notifications')}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}
                {headerRight && <div className="w-10 flex justify-end lg:w-auto">{headerRight}</div>}
              </div>
            </header>
          )}
          {/* Desktop page title */}
          {title !== undefined && (
            <div className="hidden lg:block px-8 pt-2 pb-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
          )}
          <main className={`flex-1 ${noPadding ? '' : 'px-4 py-4 lg:px-8 lg:py-6'} ${hideNav ? '' : 'pb-24 lg:pb-6'}`}>
            {children}
          </main>
          {!hideNav && <BottomNav />}
        </div>
      </div>
    </div>
  )
}
