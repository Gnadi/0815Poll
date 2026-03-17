import { NextResponse } from 'next/server';
import { db } from '@/db';
import { polls, pollOptions, votes } from '@/db/schema';
import { generateId } from '@/lib/utils';
import { eq, and, count } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const { optionId, voterId } = await request.json();

    if (!optionId || !voterId) {
      return NextResponse.json(
        { error: 'optionId and voterId are required' },
        { status: 400 }
      );
    }

    // Check poll exists
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, pollId));

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll is still active
    const now = new Date();
    const endsAt = new Date(poll.endsAt);
    if (poll.status === 'ended' || now > endsAt) {
      if (poll.status === 'active') {
        await db.update(polls).set({ status: 'ended' }).where(eq(polls.id, pollId));
      }
      return NextResponse.json({ error: 'Poll has ended' }, { status: 400 });
    }

    // Check if voter has already voted on this poll
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.pollId, pollId), eq(votes.voterId, voterId)));

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this poll' }, { status: 409 });
    }

    // Insert the vote
    await db.insert(votes).values({
      id: generateId(),
      pollId,
      optionId,
      voterId,
      createdAt: now.toISOString(),
    });

    // Return updated vote counts for all options
    const updatedOptions = await db
      .select({
        id: pollOptions.id,
        pollId: pollOptions.pollId,
        label: pollOptions.label,
        description: pollOptions.description,
        metadata: pollOptions.metadata,
        sortOrder: pollOptions.sortOrder,
        voteCount: count(votes.id),
      })
      .from(pollOptions)
      .leftJoin(votes, eq(votes.optionId, pollOptions.id))
      .where(eq(pollOptions.pollId, pollId))
      .groupBy(pollOptions.id)
      .orderBy(pollOptions.sortOrder);

    const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt.voteCount, 0);

    const optionsWithPercentage = updatedOptions.map((opt) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      options: optionsWithPercentage,
      totalVotes,
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }
}
