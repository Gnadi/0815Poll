import type { PollOption } from '../types'

interface Props {
  options: PollOption[]
  distribution: Record<string, number>
  votingPower: number
  onChange: (distribution: Record<string, number>) => void
  disabled?: boolean
}

export default function PriorityVoteInput({ options, distribution, votingPower, onChange, disabled }: Props) {
  const totalAllocated = Object.values(distribution).reduce((sum, v) => sum + v, 0)
  const remaining = votingPower - totalAllocated
  const totalPoints = options.reduce((sum, o) => sum + (o.priorityPoints || 0), 0)

  const adjust = (optionId: string, delta: number) => {
    if (disabled) return
    const current = distribution[optionId] || 0
    const next = current + delta
    if (next < 0) return
    if (delta > 0 && remaining <= 0) return
    onChange({ ...distribution, [optionId]: next })
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Points remaining indicator */}
      {!disabled && (
        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold ${
          remaining === 0 ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700'
        }`}>
          <span>{remaining === 0 ? 'All points distributed!' : `${remaining} point${remaining !== 1 ? 's' : ''} remaining`}</span>
          <span className="text-xs opacity-75">{totalAllocated} / {votingPower} pts used</span>
        </div>
      )}

      {/* Options */}
      {options.map((opt) => {
        const allocated = distribution[opt.id] || 0
        const optPoints = opt.priorityPoints || 0
        const pct = totalPoints > 0 ? Math.round((optPoints / totalPoints) * 100) : 0

        return (
          <div
            key={opt.id}
            className={`rounded-2xl border bg-white overflow-hidden transition-all ${
              allocated > 0 ? 'border-blue-300 shadow-sm' : 'border-gray-200'
            }`}
          >
            <div className="px-4 py-3 flex items-center gap-3">
              {/* Option label */}
              <span className="flex-1 text-sm font-medium text-gray-800">{opt.text}</span>

              {disabled ? (
                /* After voting: show accumulated points */
                <span className="text-sm font-bold text-blue-600">{optPoints} pts</span>
              ) : (
                /* Stepper controls */
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjust(opt.id, -1)}
                    disabled={allocated === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                    aria-label="Remove point"
                  >
                    −
                  </button>
                  <span className={`w-6 text-center text-base font-bold ${allocated > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {allocated}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust(opt.id, 1)}
                    disabled={remaining === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                    aria-label="Add point"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Point bar (pre-vote: shows own allocation; post-vote: shows result) */}
            <div className="h-1.5 bg-gray-100">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: disabled
                    ? `${pct}%`
                    : `${votingPower > 0 ? Math.round((allocated / votingPower) * 100) : 0}%`,
                }}
              />
            </div>

            {/* Post-vote percentage label */}
            {disabled && totalPoints > 0 && (
              <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>{pct}% of total points</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
