import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { Poll, PollOption, LocationOption, TimeSlot } from '../types'
import { percent, summarisePoll } from './pollSummary'

const ts = { seconds: 0, nanoseconds: 0 } as unknown as Timestamp

function makePoll(overrides: Partial<Poll>): Poll {
  return {
    id: 'p1',
    type: 'standard',
    question: 'Q',
    description: '',
    settings: { anonymous: false, duration: 24 },
    createdBy: 'u1',
    createdAt: ts,
    endsAt: ts,
    status: 'active',
    totalVotes: 0,
    ...overrides,
  }
}

function opt(id: string, votes: number, extras: Partial<PollOption> = {}): PollOption {
  return { id, text: id, votes, ...extras }
}

describe('percent', () => {
  it('returns 0 when total is 0 or negative', () => {
    expect(percent(0, 0)).toBe(0)
    expect(percent(3, 0)).toBe(0)
    expect(percent(1, -1)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(percent(1, 3)).toBe(33)
    expect(percent(2, 3)).toBe(67)
    expect(percent(1, 2)).toBe(50)
    expect(percent(5, 5)).toBe(100)
  })
})

describe('summarisePoll — standard', () => {
  it('returns empty winner when totalVotes is 0', () => {
    const poll = makePoll({
      type: 'standard',
      options: [opt('a', 0), opt('b', 0)],
      totalVotes: 0,
    })
    const s = summarisePoll(poll)
    expect(s.kind).toBe('standard')
    if (s.kind === 'standard') {
      expect(s.winner).toBeNull()
      expect(s.winnerPct).toBe(0)
    }
  })

  it('sorts by votes and computes percentages', () => {
    const poll = makePoll({
      type: 'standard',
      options: [opt('a', 3), opt('b', 7)],
      totalVotes: 10,
    })
    const s = summarisePoll(poll)
    if (s.kind !== 'standard') throw new Error('expected standard')
    expect(s.winner?.id).toBe('b')
    expect(s.winnerPct).toBe(70)
    expect(s.runnerUp?.id).toBe('a')
    expect(s.runnerUpPct).toBe(30)
  })

  it('handles zero options', () => {
    const poll = makePoll({ type: 'standard', options: [], totalVotes: 0 })
    const s = summarisePoll(poll)
    if (s.kind !== 'standard') throw new Error('expected standard')
    expect(s.winner).toBeNull()
    expect(s.runnerUp).toBeNull()
    expect(s.sorted).toEqual([])
  })

  it('treats ties by keeping sorted order stable', () => {
    const poll = makePoll({
      type: 'standard',
      options: [opt('a', 5), opt('b', 5)],
      totalVotes: 10,
    })
    const s = summarisePoll(poll)
    if (s.kind !== 'standard') throw new Error('expected standard')
    expect(s.winner?.votes).toBe(5)
    expect(s.runnerUp?.votes).toBe(5)
    expect(s.winnerPct).toBe(50)
  })
})

describe('summarisePoll — ranking', () => {
  it('picks winner by Borda points and computes gap', () => {
    const poll = makePoll({
      type: 'ranking',
      options: [
        opt('a', 0, { bordaPoints: 5 }),
        opt('b', 0, { bordaPoints: 12 }),
        opt('c', 0, { bordaPoints: 8 }),
      ],
      totalVotes: 4,
    })
    const s = summarisePoll(poll)
    if (s.kind !== 'ranking') throw new Error('expected ranking')
    expect(s.winner?.id).toBe('b')
    expect(s.runnerUp?.id).toBe('c')
    expect(s.gap).toBe(4)
    expect(s.totalBordaPoints).toBe(25)
  })
})

describe('summarisePoll — priority', () => {
  it('picks winner by priority points', () => {
    const poll = makePoll({
      type: 'priority',
      options: [
        opt('a', 0, { priorityPoints: 3 }),
        opt('b', 0, { priorityPoints: 10 }),
      ],
      totalVotes: 2,
    })
    const s = summarisePoll(poll)
    if (s.kind !== 'priority') throw new Error('expected priority')
    expect(s.winner?.id).toBe('b')
    expect(s.gap).toBe(7)
    expect(s.totalPriorityPoints).toBe(13)
  })
})

describe('summarisePoll — location', () => {
  it('sorts locations by votes', () => {
    const locations: LocationOption[] = [
      { id: 'l1', name: 'A', address: '', lat: 0, lng: 0, votes: 2 },
      { id: 'l2', name: 'B', address: '', lat: 0, lng: 0, votes: 7 },
    ]
    const poll = makePoll({ type: 'location', locations, totalVotes: 9 })
    const s = summarisePoll(poll)
    if (s.kind !== 'location') throw new Error('expected location')
    expect(s.winner?.id).toBe('l2')
    expect(s.sorted.map((l) => l.id)).toEqual(['l2', 'l1'])
  })
})

describe('summarisePoll — schedule', () => {
  it('picks the time slot with the most votes', () => {
    const timeSlots: TimeSlot[] = [
      { date: '2024-10-05', times: ['09:00', '11:00'], votes: { '09:00': 1, '11:00': 4 } },
      { date: '2024-10-06', times: ['10:00'], votes: { '10:00': 3 } },
    ]
    const poll = makePoll({ type: 'schedule', timeSlots, totalVotes: 8 })
    const s = summarisePoll(poll)
    if (s.kind !== 'schedule') throw new Error('expected schedule')
    expect(s.topSlot).toEqual({ date: '2024-10-05', time: '11:00', votes: 4 })
  })

  it('returns null top slot when there are no slots', () => {
    const poll = makePoll({ type: 'schedule', timeSlots: [], totalVotes: 0 })
    const s = summarisePoll(poll)
    if (s.kind !== 'schedule') throw new Error('expected schedule')
    expect(s.topSlot).toBeNull()
  })
})
