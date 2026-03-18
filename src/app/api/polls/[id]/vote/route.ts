import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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

    const pollRef = firestore.collection('polls').doc(pollId);
    const pollSnap = await pollRef.get();

    if (!pollSnap.exists) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const poll = pollSnap.data()!;

    // Check if poll is still active
    const now = new Date();
    const endsAt = new Date(poll.endsAt);
    if (poll.status === 'ended' || now > endsAt) {
      if (poll.status === 'active') {
        await pollRef.update({ status: 'ended' });
      }
      return NextResponse.json({ error: 'Poll has ended' }, { status: 400 });
    }

    // Check if voter has already voted (use voterId as doc ID for uniqueness)
    const existingVoteSnap = await pollRef
      .collection('votes')
      .where('voterId', '==', voterId)
      .limit(1)
      .get();

    if (!existingVoteSnap.empty) {
      return NextResponse.json({ error: 'You have already voted on this poll' }, { status: 409 });
    }

    // Insert the vote
    await pollRef.collection('votes').doc(generateId()).set({
      optionId,
      voterId,
      createdAt: now.toISOString(),
    });

    // Return updated vote counts
    const [optionsSnap, votesSnap] = await Promise.all([
      pollRef.collection('options').orderBy('sortOrder').get(),
      pollRef.collection('votes').get(),
    ]);

    const voteCounts: Record<string, number> = {};
    votesSnap.docs.forEach((doc) => {
      const vote = doc.data();
      voteCounts[vote.optionId] = (voteCounts[vote.optionId] || 0) + 1;
    });

    const totalVotes = votesSnap.size;

    const options = optionsSnap.docs.map((doc) => {
      const data = doc.data();
      const voteCount = voteCounts[doc.id] || 0;
      return {
        id: doc.id,
        pollId,
        label: data.label,
        description: data.description,
        metadata: data.metadata,
        sortOrder: data.sortOrder,
        voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      options,
      totalVotes,
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }
}
