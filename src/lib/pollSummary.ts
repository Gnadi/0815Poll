import type { LocationOption, Poll, PollOption } from '../types'

export function percent(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

export function sortByVotes<T extends { votes: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.votes - a.votes)
}

export function sortByBorda(options: PollOption[]): PollOption[] {
  return [...options].sort((a, b) => (b.bordaPoints || 0) - (a.bordaPoints || 0))
}

export function sortByPriority(options: PollOption[]): PollOption[] {
  return [...options].sort((a, b) => (b.priorityPoints || 0) - (a.priorityPoints || 0))
}

export type StandardSummary = {
  kind: 'standard' | 'image' | 'custom'
  winner: PollOption | null
  runnerUp: PollOption | null
  winnerPct: number
  runnerUpPct: number
  sorted: PollOption[]
}

export type RankingSummary = {
  kind: 'ranking'
  winner: PollOption | null
  runnerUp: PollOption | null
  totalBordaPoints: number
  gap: number
  sorted: PollOption[]
}

export type PrioritySummary = {
  kind: 'priority'
  winner: PollOption | null
  runnerUp: PollOption | null
  totalPriorityPoints: number
  gap: number
  sorted: PollOption[]
}

export type LocationSummary = {
  kind: 'location'
  winner: LocationOption | null
  sorted: LocationOption[]
}

export type ScheduleSummary = {
  kind: 'schedule'
  topSlot: { date: string; time: string; votes: number } | null
}

export type PollSummary =
  | StandardSummary
  | RankingSummary
  | PrioritySummary
  | LocationSummary
  | ScheduleSummary
  | { kind: 'empty' }

export function summarisePoll(poll: Poll): PollSummary {
  if (poll.type === 'standard' || poll.type === 'image' || poll.type === 'custom') {
    const opts = poll.options ?? []
    const sorted = sortByVotes(opts)
    const winner = poll.totalVotes > 0 ? (sorted[0] ?? null) : null
    const runnerUp = sorted[1] ?? null
    return {
      kind: poll.type,
      winner,
      runnerUp,
      winnerPct: winner ? percent(winner.votes, poll.totalVotes) : 0,
      runnerUpPct: runnerUp ? percent(runnerUp.votes, poll.totalVotes) : 0,
      sorted,
    }
  }

  if (poll.type === 'ranking') {
    const opts = poll.options ?? []
    const sorted = sortByBorda(opts)
    const totalBordaPoints = opts.reduce((sum, o) => sum + (o.bordaPoints || 0), 0)
    const winner = poll.totalVotes > 0 ? (sorted[0] ?? null) : null
    const runnerUp = sorted[1] ?? null
    const gap = winner && runnerUp ? (winner.bordaPoints || 0) - (runnerUp.bordaPoints || 0) : 0
    return { kind: 'ranking', winner, runnerUp, totalBordaPoints, gap, sorted }
  }

  if (poll.type === 'priority') {
    const opts = poll.options ?? []
    const sorted = sortByPriority(opts)
    const totalPriorityPoints = opts.reduce((sum, o) => sum + (o.priorityPoints || 0), 0)
    const winner = poll.totalVotes > 0 ? (sorted[0] ?? null) : null
    const runnerUp = sorted[1] ?? null
    const gap = winner && runnerUp ? (winner.priorityPoints || 0) - (runnerUp.priorityPoints || 0) : 0
    return { kind: 'priority', winner, runnerUp, totalPriorityPoints, gap, sorted }
  }

  if (poll.type === 'location') {
    const locs = poll.locations ?? []
    const sorted = sortByVotes(locs)
    const winner = poll.totalVotes > 0 ? (sorted[0] ?? null) : null
    return { kind: 'location', winner, sorted }
  }

  if (poll.type === 'schedule') {
    let topSlot: { date: string; time: string; votes: number } | null = null
    ;(poll.timeSlots ?? []).forEach((slot) => {
      slot.times.forEach((time) => {
        const votes = slot.votes?.[time] || 0
        if (!topSlot || votes > topSlot.votes) {
          topSlot = { date: slot.date, time, votes }
        }
      })
    })
    return { kind: 'schedule', topSlot }
  }

  return { kind: 'empty' }
}
