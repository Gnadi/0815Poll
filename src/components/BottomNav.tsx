import { NavLink } from 'react-router-dom'
import { BarChart2, Compass, Users, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const navItems = [
  { to: '/home', icon: BarChart2, label: 'Polls', exact: true },
  { to: '/explore', icon: Compass, label: 'Explore', exact: false },
  { to: '/contacts', icon: Users, label: 'Contacts', exact: false },
  { to: '/profile', icon: User, label: 'Profile', exact: false },
]

export default function BottomNav() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pb-safe lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-6 w-6" strokeWidth={1.5} />
          ) : (
            <Moon className="h-6 w-6" strokeWidth={1.5} />
          )}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      </div>
    </nav>
  )
}
