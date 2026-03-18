import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const voterId = searchParams.get('voterId');

    const pollRef = firestore.collection('polls').doc(id);
    const pollSnap = await pollRef.get();

    if (!pollSnap.exists) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const poll = { id: pollSnap.id, ...pollSnap.data() } as Record<string, unknown>;

    // Check if poll has ended and update status if needed
    const now = new Date();
    const endsAt = new Date(poll.endsAt as string);
    if (poll.status === 'active' && now > endsAt) {
      await pollRef.update({ status: 'ended' });
      poll.status = 'ended';
    }

    // Fetch options
    const optionsSnap = await pollRef
      .collection('options')
      .orderBy('sortOrder')
      .get();

    // Fetch all votes for this poll
    const votesSnap = await pollRef.collection('votes').get();

    // Count votes per option
    const voteCounts: Record<string, number> = {};
    let userVotedOptionId: string | null = null;

    votesSnap.docs.forEach((voteDoc) => {
      const vote = voteDoc.data();
      voteCounts[vote.optionId] = (voteCounts[vote.optionId] || 0) + 1;
      if (voterId && vote.voterId === voterId) {
        userVotedOptionId = vote.optionId;
      }
    });

    const totalVotes = votesSnap.size;

    const options = optionsSnap.docs.map((doc) => {
      const data = doc.data();
      const voteCount = voteCounts[doc.id] || 0;
      return {
        id: doc.id,
        pollId: id,
        label: data.label,
        description: data.description,
        metadata: data.metadata,
        sortOrder: data.sortOrder,
        voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
      };
    });

    return NextResponse.json({
      poll,
      options,
      totalVotes,
      userVotedOptionId,
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}
