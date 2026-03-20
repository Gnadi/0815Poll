import { Timestamp } from 'firebase/firestore'

export type PollType = 'standard' | 'schedule' | 'location' | 'custom'
export type PollStatus = 'active' | 'ended'

export interface PollOption {
  id: string
  text: string
  votes: number
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
  optionId: string
  createdAt: Timestamp
}

export interface ScheduleVote {
  id: string
  pollId: string
  userId: string | null
  selectedSlots: string[] // "date|time" keys
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
