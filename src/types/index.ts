export type PollType = 'standard' | 'schedule' | 'location' | 'custom';
export type PollStatus = 'active' | 'ended';

export interface Poll {
  id: string;
  type: PollType;
  question: string;
  description: string | null;
  anonymous: boolean;
  duration: number;
  createdAt: string;
  endsAt: string;
  status: PollStatus;
  creatorId: string | null;
}

export interface PollOption {
  id: string;
  pollId: string;
  label: string;
  description: string | null;
  metadata: string | null;
  sortOrder: number;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  voterId: string;
  createdAt: string;
}

export interface PollWithOptions extends Poll {
  options: (PollOption & { voteCount: number; percentage: number })[];
  totalVotes: number;
  userVotedOptionId: string | null;
}

export interface ScheduleMetadata {
  date: string;
  time: string;
}

export interface LocationMetadata {
  address: string;
  lat?: number;
  lng?: number;
}
