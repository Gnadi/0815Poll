import { CheckCircle2 } from 'lucide-react'
import ProgressBar from './ProgressBar'

interface ResultBarProps {
  label: string
  votes: number
  totalVotes: number
  isWinner?: boolean
  isVoted?: boolean
}

export default function ResultBar({ label, votes, totalVotes, isWinner, isVoted }: ResultBarProps) {
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

  return (
    <div className={`rounded-xl p-4 ${isWinner ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
          {isVoted && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
        </div>
        <span className={`text-sm font-bold ${isWinner ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {pct}%
        </span>
      </div>
      <ProgressBar value={pct} />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{votes} votes</p>
    </div>
  )
}
