import { Timestamp } from 'firebase/firestore'

export type PollType = 'standard' | 'schedule' | 'location' | 'custom' | 'ranking' | 'priority'
export type PollStatus = 'active' | 'ended'

export interface PollOption {
  id: string
  text: string
  votes: number
  bordaPoints?: number // Accumulated Borda Count points for ranking polls
  priorityPoints?: number // Accumulated priority points for priority polls
  customContent?: string // Full HTML document for custom poll options
}

export interface TimeSlot {
  date: string // ISO date string e.g. "2024-10-05"
  times: string[] // e.g. ["09:00", "11:00"]
  votes: Record<string, number> // time -> vote count
}

export interface LocationOption {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  votes: number
}

export interface PollSettings {
  anonymous: boolean
  duration: number // hours
  votingPower?: number // Points each voter has in priority polls (default 5)
  allowMultipleChoices?: boolean // Allow voters to select more than one option
}

export interface Poll {
  id: string
  type: PollType
  question: string
  description: string
  // Standard poll
  options?: PollOption[]
  // Schedule poll
  timeSlots?: TimeSlot[]
  // Location poll
  locations?: LocationOption[]
  // Custom poll
  customContent?: string
  settings: PollSettings
  createdBy: string | null
  createdAt: Timestamp
  endsAt: Timestamp
  status: PollStatus
  totalVotes: number
}

export interface Vote {
  id: string
  pollId: string
  userId: string | null
  optionId?: string // Single-choice votes (legacy)
  optionIds?: string[] // Multiple-choice votes
  createdAt: Timestamp
}

export interface ScheduleVote {
  id: string
  pollId: string
  userId: string | null
  selectedSlots: string[] // "date|time" keys
  createdAt: Timestamp
}

export interface RankingVote {
  id: string
  pollId: string
  userId: string | null
  ranking: string[] // option IDs in user's preferred order (index 0 = top choice)
  createdAt: Timestamp
}

export interface PriorityVote {
  id: string
  pollId: string
  userId: string | null
  distribution: Record<string, number> // optionId -> points allocated
  createdAt: Timestamp
}

export interface User {
  id: string
  displayName: string
  email: string
  photoURL?: string
  createdAt: Timestamp
}

export type CreatePollPayload = Omit<Poll, 'id' | 'createdAt' | 'endsAt' | 'status' | 'totalVotes'>
