import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
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

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Desktop sidebar - always visible on desktop */}
      <Sidebar />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="min-h-screen flex flex-col lg:ml-64">
        <div className="mx-auto w-full max-w-md lg:max-w-5xl min-h-screen flex flex-col">
          {title !== undefined && (
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:px-8 lg:py-4 lg:bg-app-bg lg:border-b-0">
              <div className="w-10 lg:w-auto">
                {showBack && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors lg:h-9 lg:w-9"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}
              </div>
              <h1 className="text-base font-bold text-gray-900 lg:text-xl lg:hidden">{title}</h1>
              <div className="w-10 flex justify-end lg:w-auto">{headerRight}</div>
            </header>
          )}
          {/* Desktop page title */}
          {title !== undefined && (
            <div className="hidden lg:block px-8 pt-2 pb-0">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
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
