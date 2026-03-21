import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
        <Icon className="h-8 w-8 text-primary-400 dark:text-primary-300" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action && (
        <Link
          to={action.href}
          className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
