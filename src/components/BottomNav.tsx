import { NavLink } from 'react-router-dom'
import { BarChart2, Compass, Plus, Users, User } from 'lucide-react'

const navItems = [
  { to: '/home', icon: BarChart2, label: 'Polls', exact: true },
  { to: '/explore', icon: Compass, label: 'Explore', exact: false },
]

const navItemsRight = [
  { to: '/contacts', icon: Users, label: 'Contacts', exact: false },
  { to: '/profile', icon: User, label: 'Profile', exact: false },
]

export default function BottomNav() {
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

        {/* Create button */}
        <NavLink
          to="/create"
          className="flex flex-col items-center gap-0.5 px-3 py-1"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 transition-colors">
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Create</span>
        </NavLink>

        {navItemsRight.map(({ to, icon: Icon, label, exact }) => (
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
      </div>
    </nav>
  )
}
