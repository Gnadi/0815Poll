import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid(12);
}

export function getVoterId(): string {
  if (typeof window === 'undefined') return '';
  let voterId = localStorage.getItem('voter_id');
  if (!voterId) {
    voterId = nanoid(16);
    localStorage.setItem('voter_id', voterId);
  }
  return voterId;
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export function formatTimeRemaining(endsAt: string): string {
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return 'Ended';

  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
