import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { BarChart2, Calendar, MapPin, Sliders, GripVertical, Users, Target } from 'lucide-react'
import type { Poll } from '../types'

const typeConfig = {
  standard: { icon: BarChart2, label: 'Standard', color: 'bg-indigo-100 text-indigo-700' },
  schedule: { icon: Calendar, label: 'Schedule', color: 'bg-emerald-100 text-emerald-700' },
  location: { icon: MapPin, label: 'Location', color: 'bg-amber-100 text-amber-700' },
  custom: { icon: Sliders, label: 'Custom', color: 'bg-purple-100 text-purple-700' },
  ranking: { icon: GripVertical, label: 'Ranking', color: 'bg-rose-100 text-rose-700' },
  priority: { icon: Target, label: 'Priority', color: 'bg-blue-100 text-blue-700' },
}

export default function PollCard({ poll }: { poll: Poll }) {
  const navigate = useNavigate()
  const cfg = typeConfig[poll.type] ?? typeConfig.standard
  const Icon = cfg.icon
  const isActive = poll.status === 'active'
  const endsAt = poll.endsAt?.toDate?.()
  const timeLabel = endsAt
    ? isActive
      ? `Ends ${formatDistanceToNow(endsAt, { addSuffix: true })}`
      : `Ended ${formatDistanceToNow(endsAt, { addSuffix: true })}`
    : ''

  return (
    <button
      type="button"
      onClick={() => navigate(isActive ? `/poll/${poll.id}` : `/poll/${poll.id}/results`)}
      className="w-full rounded-2xl bg-white p-4 text-left shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
        {isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            ENDED
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-3">{poll.question}</h3>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {poll.totalVotes} votes
        </span>
        <span>{timeLabel}</span>
      </div>
    </button>
  )
}
