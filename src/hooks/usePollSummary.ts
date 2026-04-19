import { useMemo } from 'react'
import type { Poll } from '../types'
import { summarisePoll, type PollSummary } from '../lib/pollSummary'

export function usePollSummary(poll: Poll | null): PollSummary {
  return useMemo(
    () => (poll ? summarisePoll(poll) : { kind: 'empty' }),
    [poll]
  )
}
