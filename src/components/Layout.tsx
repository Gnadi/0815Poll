import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BottomNav from './BottomNav'
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
      <div className="mx-auto max-w-md min-h-screen flex flex-col">
        {title !== undefined && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
            <div className="w-10">
              {showBack && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
              )}
            </div>
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
            <div className="w-10 flex justify-end">{headerRight}</div>
          </header>
        )}
        <main className={`flex-1 ${noPadding ? '' : 'px-4 py-4'} ${hideNav ? '' : 'pb-24'}`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  )
}
