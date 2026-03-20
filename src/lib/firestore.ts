import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  Timestamp,
  increment,
  type Unsubscribe,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Poll, Vote, User, CreatePollPayload, PollStatus, ScheduleVote, RankingVote } from '../types'

// ─── Polls ───────────────────────────────────────────────────────────────────

export async function createPoll(payload: CreatePollPayload): Promise<string> {
  const now = Timestamp.now()
  const endsAt = new Timestamp(
    now.seconds + payload.settings.duration * 3600,
    now.nanoseconds
  )
  const ref = await addDoc(collection(db, 'polls'), {
    ...payload,
    createdAt: now,
    endsAt,
    status: 'active',
    totalVotes: 0,
  })
  return ref.id
}

function docToPoll(d: QueryDocumentSnapshot): Poll {
  return { id: d.id, ...d.data() } as Poll
}

export async function getPoll(pollId: string): Promise<Poll | null> {
  const snap = await getDoc(doc(db, 'polls', pollId))
  return snap.exists() ? docToPoll(snap as QueryDocumentSnapshot) : null
}

export async function getPolls(limitCount = 20): Promise<Poll[]> {
  const q = query(
    collection(db, 'polls'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(docToPoll)
}

export async function getPollsPage(
  limitCount = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ polls: Poll[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(db, 'polls'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  if (lastDoc) {
    q = query(
      collection(db, 'polls'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(limitCount)
    )
  }
  const snap = await getDocs(q)
  return {
    polls: snap.docs.map(docToPoll),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  }
}

export async function getActivePolls(limitCount = 10): Promise<Poll[]> {
  const q = query(
    collection(db, 'polls'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(docToPoll)
}

export async function getUserPolls(userId: string): Promise<Poll[]> {
  const q = query(
    collection(db, 'polls'),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(docToPoll)
}

export function subscribeToPoll(
  pollId: string,
  callback: (poll: Poll | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'polls', pollId), (snap) => {
    callback(snap.exists() ? docToPoll(snap as QueryDocumentSnapshot) : null)
  })
}

export async function updatePollStatus(pollId: string, status: PollStatus): Promise<void> {
  await updateDoc(doc(db, 'polls', pollId), { status })
}

// ─── Votes ───────────────────────────────────────────────────────────────────

export async function castVote(
  pollId: string,
  userId: string | null,
  optionId: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const pollRef = doc(db, 'polls', pollId)
    const pollSnap = await tx.get(pollRef)
    if (!pollSnap.exists()) throw new Error('Poll not found')
    const poll = { id: pollSnap.id, ...pollSnap.data() } as Poll

    if ((poll.type === 'standard' || poll.type === 'custom') && poll.options) {
      const idx = poll.options.findIndex((o) => o.id === optionId)
      if (idx === -1) throw new Error('Option not found')
      const updatedOptions = poll.options.map((o, i) =>
        i === idx ? { ...o, votes: o.votes + 1 } : o
      )
      tx.update(pollRef, { options: updatedOptions, totalVotes: increment(1) })
    } else if (poll.type === 'location' && poll.locations) {
      const idx = poll.locations.findIndex((l) => l.id === optionId)
      if (idx === -1) throw new Error('Location not found')
      const updatedLocations = poll.locations.map((l, i) =>
        i === idx ? { ...l, votes: l.votes + 1 } : l
      )
      tx.update(pollRef, { locations: updatedLocations, totalVotes: increment(1) })
    } else {
      tx.update(pollRef, { totalVotes: increment(1) })
    }
  })

  await addDoc(collection(db, 'votes'), {
    pollId,
    userId,
    optionId,
    createdAt: Timestamp.now(),
  })
}

export async function castScheduleVote(
  pollId: string,
  userId: string | null,
  selectedSlots: string[]
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const pollRef = doc(db, 'polls', pollId)
    const pollSnap = await tx.get(pollRef)
    if (!pollSnap.exists()) throw new Error('Poll not found')
    const poll = { id: pollSnap.id, ...pollSnap.data() } as Poll

    if (poll.timeSlots) {
      const updatedSlots = poll.timeSlots.map((slot) => {
        const slotVotes = { ...(slot.votes || {}) }
        slot.times.forEach((time) => {
          const key = `${slot.date}|${time}`
          if (selectedSlots.includes(key)) {
            slotVotes[time] = (slotVotes[time] || 0) + 1
          }
        })
        return { ...slot, votes: slotVotes }
      })
      tx.update(pollRef, { timeSlots: updatedSlots, totalVotes: increment(1) })
    }
  })

  await addDoc(collection(db, 'schedule_votes'), {
    pollId,
    userId,
    selectedSlots,
    createdAt: Timestamp.now(),
  })
}

export async function getUserVote(
  pollId: string,
  userId: string
): Promise<Vote | null> {
  const q = query(
    collection(db, 'votes'),
    where('pollId', '==', pollId),
    where('userId', '==', userId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Vote
}

export async function getUserScheduleVote(
  pollId: string,
  userId: string
): Promise<ScheduleVote | null> {
  const q = query(
    collection(db, 'schedule_votes'),
    where('pollId', '==', pollId),
    where('userId', '==', userId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ScheduleVote
}

export async function castRankingVote(
  pollId: string,
  userId: string | null,
  ranking: string[]
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const pollRef = doc(db, 'polls', pollId)
    const pollSnap = await tx.get(pollRef)
    if (!pollSnap.exists()) throw new Error('Poll not found')
    const poll = { id: pollSnap.id, ...pollSnap.data() } as Poll

    if (poll.options) {
      const n = poll.options.length
      const updatedOptions = poll.options.map((opt) => {
        const rankIndex = ranking.indexOf(opt.id)
        const points = rankIndex === -1 ? 0 : n - 1 - rankIndex
        return { ...opt, bordaPoints: (opt.bordaPoints || 0) + points }
      })
      tx.update(pollRef, { options: updatedOptions, totalVotes: increment(1) })
    }
  })

  await addDoc(collection(db, 'ranking_votes'), {
    pollId,
    userId,
    ranking,
    createdAt: Timestamp.now(),
  })
}

export async function getUserRankingVote(
  pollId: string,
  userId: string
): Promise<RankingVote | null> {
  const q = query(
    collection(db, 'ranking_votes'),
    where('pollId', '==', pollId),
    where('userId', '==', userId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as RankingVote
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createUserProfile(
  userId: string,
  data: Omit<User, 'id'>
): Promise<void> {
  await setDoc(doc(db, 'users', userId), data, { merge: true })
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null
}

export async function updateUserProfile(
  userId: string,
  data: Partial<User>
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), data)
}

export async function getUserVoteCount(userId: string): Promise<number> {
  const q = query(collection(db, 'votes'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.size
}
