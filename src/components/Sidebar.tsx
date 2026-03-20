import { NavLink } from 'react-router-dom'
import { BarChart2, Compass, PlusCircle, User, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: BarChart2, label: 'Dashboard', exact: true },
  { to: '/explore', icon: Compass, label: 'Explore', exact: false },
  { to: '/create', icon: PlusCircle, label: 'Create', exact: false },
  { to: '/profile', icon: User, label: 'Profile', exact: false },
]

export default function Sidebar() {
  const { user, userProfile } = useAuth()
  const displayName = userProfile?.displayName || user?.displayName || 'Guest'
  const email = userProfile?.email || user?.email || ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-gray-200 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">0815Poll</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={displayName} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500">
              <span className="text-sm font-bold text-white">{initial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
          </div>
          <button type="button" aria-label="Settings" className="text-gray-400 hover:text-gray-600">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
