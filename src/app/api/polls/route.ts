import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function parseDuration(duration: unknown): number {
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    const match = duration.match(/^(\d+)h$/);
    if (match) return parseInt(match[1], 10);
    const num = parseFloat(duration);
    if (!isNaN(num)) return num;
  }
  return 24;
}

export async function GET() {
  try {
    const pollsSnap = await firestore
      .collection('polls')
      .orderBy('createdAt', 'desc')
      .get();

    const allPolls = await Promise.all(
      pollsSnap.docs.map(async (doc) => {
        const poll = { id: doc.id, ...doc.data() };
        const votesSnap = await firestore
          .collection('polls')
          .doc(doc.id)
          .collection('votes')
          .count()
          .get();
        return { ...poll, totalVotes: votesSnap.data().count };
      })
    );

    return NextResponse.json(allPolls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, question, description, anonymous, duration, options, optionMetadata } = body;

    if (!type || !question || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'type, question, and at least 2 options are required' },
        { status: 400 }
      );
    }

    const pollId = generateId();
    const now = new Date();
    const durationHours = parseDuration(duration) || 24;
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const pollData = {
      type,
      question,
      description: description || null,
      anonymous: anonymous ?? true,
      duration: durationHours,
      createdAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'active',
      creatorId: null,
    };

    const pollRef = firestore.collection('polls').doc(pollId);
    const batch = firestore.batch();

    batch.set(pollRef, pollData);

    const createdOptions: Array<Record<string, unknown>> = [];

    options.forEach((opt: string | { text: string; metadata?: Record<string, string> }, index: number) => {
      const isObject = typeof opt === 'object' && opt !== null;
      const optionId = generateId();
      const optionData = {
        label: isObject ? opt.text : opt,
        description: null,
        metadata: isObject
          ? (opt.metadata ? JSON.stringify(opt.metadata) : null)
          : (optionMetadata?.[index]
            ? (typeof optionMetadata[index] === 'string' ? optionMetadata[index] : JSON.stringify(optionMetadata[index]))
            : null),
        sortOrder: index,
      };

      batch.set(pollRef.collection('options').doc(optionId), optionData);
      createdOptions.push({ id: optionId, pollId, ...optionData });
    });

    await batch.commit();

    return NextResponse.json({ id: pollId, ...pollData, options: createdOptions }, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}
