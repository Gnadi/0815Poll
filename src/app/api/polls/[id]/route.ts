import { NextResponse } from 'next/server';
import { db } from '@/db';
import { polls, pollOptions, votes } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const voterId = searchParams.get('voterId');

    // Fetch the poll
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, id));

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll has ended and update status if needed
    const now = new Date();
    const endsAt = new Date(poll.endsAt);
    if (poll.status === 'active' && now > endsAt) {
      await db
        .update(polls)
        .set({ status: 'ended' })
        .where(eq(polls.id, id));
      poll.status = 'ended';
    }

    // Fetch options with vote counts
    const optionsWithVotes = await db
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
      .where(eq(pollOptions.pollId, id))
      .groupBy(pollOptions.id)
      .orderBy(pollOptions.sortOrder);

    // Calculate total votes and percentages
    const totalVotes = optionsWithVotes.reduce((sum, opt) => sum + opt.voteCount, 0);

    const optionsWithPercentage = optionsWithVotes.map((opt) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
    }));

    // Check if voter has already voted
    let userVotedOptionId: string | null = null;
    if (voterId) {
      const [existingVote] = await db
        .select({ optionId: votes.optionId })
        .from(votes)
        .where(and(eq(votes.pollId, id), eq(votes.voterId, voterId)));

      if (existingVote) {
        userVotedOptionId = existingVote.optionId;
      }
    }

    return NextResponse.json({
      poll,
      options: optionsWithPercentage,
      totalVotes,
      userVotedOptionId,
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}
