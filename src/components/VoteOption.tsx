import { CheckCircle2 } from 'lucide-react'
import ProgressBar from './ProgressBar'

interface VoteOptionProps {
  id: string
  label: string
  percentage?: number
  selected: boolean
  voted: boolean
  onSelect: () => void
}

export default function VoteOption({ id, label, percentage, selected, voted, onSelect }: VoteOptionProps) {
  return (
    <button
      type="button"
      onClick={!voted ? onSelect : undefined}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50'
          : voted
          ? 'border-gray-100 bg-white opacity-80 cursor-default'
          : 'border-gray-100 bg-white hover:border-primary-200'
      }`}
      aria-pressed={selected}
      id={id}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
        }`}>
          {selected && <CheckCircle2 className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm">{label}</p>
          {voted && percentage !== undefined && (
            <p className="text-xs text-primary-600 mt-0.5">
              {percentage}%{selected && ' • VOTED'}
            </p>
          )}
        </div>
        {!voted && !selected && (
          <span className="shrink-0 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white">
            Vote
          </span>
        )}
        {voted && percentage !== undefined && (
          <div className="shrink-0 w-16">
            <ProgressBar value={percentage} />
          </div>
        )}
      </div>
    </button>
  )
}
