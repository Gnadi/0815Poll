import { CheckCircle2, Check } from 'lucide-react'
import ProgressBar from './ProgressBar'

interface VoteOptionProps {
  id: string
  label: string
  percentage?: number
  selected: boolean
  voted: boolean
  multiple?: boolean
  onSelect: () => void
}

export default function VoteOption({ id, label, percentage, selected, voted, multiple, onSelect }: VoteOptionProps) {
  return (
    <button
      type="button"
      onClick={!voted ? onSelect : undefined}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : voted
          ? 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-80 cursor-default'
          : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200'
      }`}
      aria-pressed={selected}
      id={id}
    >
      <div className="flex items-center gap-3">
        {multiple ? (
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
            selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selected && <Check className="h-4 w-4 text-white" strokeWidth={2.5} />}
          </div>
        ) : (
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selected && <CheckCircle2 className="h-4 w-4 text-white" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{label}</p>
          {voted && percentage !== undefined && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
              {percentage}%{selected && ' • VOTED'}
            </p>
          )}
        </div>
        {!voted && !selected && (
          <span className="shrink-0 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white">
            {multiple ? 'Select' : 'Vote'}
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
