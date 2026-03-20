import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  createPoll as firestoreCreatePoll,
  getPolls,
  castVote as firestoreCastVote,
  castScheduleVote as firestoreCastScheduleVote,
  castRankingVote as firestoreCastRankingVote,
} from '../lib/firestore'
import type { Poll, CreatePollPayload } from '../types'

const VOTED_KEY = 'voted_polls' // localStorage key for unauthenticated vote tracking

function getLocalVotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || '{}')
  } catch {
    return {}
  }
}

function setLocalVote(pollId: string, optionId: string) {
  const votes = getLocalVotes()
  votes[pollId] = optionId
  localStorage.setItem(VOTED_KEY, JSON.stringify(votes))
}

interface PollContextValue {
  polls: Poll[]
  loading: boolean
  fetchPolls: () => Promise<void>
  createPoll: (payload: CreatePollPayload) => Promise<string>
  getLocalVote: (pollId: string) => string | null
  castVote: (pollId: string, userId: string | null, optionId: string) => Promise<void>
  castScheduleVote: (pollId: string, userId: string | null, slots: string[]) => Promise<void>
  castRankingVote: (pollId: string, userId: string | null, ranking: string[]) => Promise<void>
}

const PollContext = createContext<PollContextValue | null>(null)

export function PollProvider({ children }: { children: ReactNode }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPolls = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPolls(30)
      setPolls(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const createPoll = useCallback(async (payload: CreatePollPayload): Promise<string> => {
    const id = await firestoreCreatePoll(payload)
    await fetchPolls()
    return id
  }, [fetchPolls])

  const getLocalVote = useCallback((pollId: string): string | null => {
    return getLocalVotes()[pollId] || null
  }, [])

  const castVote = useCallback(async (
    pollId: string,
    userId: string | null,
    optionId: string
  ) => {
    await firestoreCastVote(pollId, userId, optionId)
    setLocalVote(pollId, optionId)
  }, [])

  const castScheduleVote = useCallback(async (
    pollId: string,
    userId: string | null,
    slots: string[]
  ) => {
    await firestoreCastScheduleVote(pollId, userId, slots)
    setLocalVote(pollId, slots[0] || 'voted')
  }, [])

  const castRankingVote = useCallback(async (
    pollId: string,
    userId: string | null,
    ranking: string[]
  ) => {
    await firestoreCastRankingVote(pollId, userId, ranking)
    setLocalVote(pollId, 'ranked')
  }, [])

  return (
    <PollContext.Provider value={{
      polls,
      loading,
      fetchPolls,
      createPoll,
      getLocalVote,
      castVote,
      castScheduleVote,
      castRankingVote,
    }}>
      {children}
    </PollContext.Provider>
  )
}

export function usePoll() {
  const ctx = useContext(PollContext)
  if (!ctx) throw new Error('usePoll must be used within PollProvider')
  return ctx
}
