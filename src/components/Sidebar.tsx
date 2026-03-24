import { NavLink } from 'react-router-dom'
import { BarChart2, Compass, PlusCircle, User } from 'lucide-react'

const navItems = [
  { to: '/home', icon: BarChart2, label: 'Dashboard', exact: true },
  { to: '/explore', icon: Compass, label: 'Explore', exact: false },
  { to: '/create', icon: PlusCircle, label: 'Create', exact: false },
  { to: '/profile', icon: User, label: 'Profile', exact: false },
]

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-16 lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 items-center">
      {/* Logo icon */}
      <div className="flex items-center justify-center w-full py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-1 w-full px-2">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            title={label}
            className={({ isActive }) =>
              `flex items-center justify-center h-10 w-10 rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
