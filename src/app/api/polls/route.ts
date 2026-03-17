import { NextResponse } from 'next/server';
import { db, ensureDb } from '@/db';

export const dynamic = 'force-dynamic';
import { polls, pollOptions, votes } from '@/db/schema';
import { generateId } from '@/lib/utils';
import { eq, desc, count, sql } from 'drizzle-orm';

export async function GET() {
  try {
    await ensureDb();
    const allPolls = await db
      .select({
        id: polls.id,
        type: polls.type,
        question: polls.question,
        description: polls.description,
        anonymous: polls.anonymous,
        duration: polls.duration,
        createdAt: polls.createdAt,
        endsAt: polls.endsAt,
        status: polls.status,
        creatorId: polls.creatorId,
        totalVotes: count(votes.id),
      })
      .from(polls)
      .leftJoin(votes, eq(votes.pollId, polls.id))
      .groupBy(polls.id)
      .orderBy(desc(polls.createdAt));

    return NextResponse.json(allPolls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await ensureDb();
    const { type, question, description, anonymous, duration, options, optionMetadata } = body;

    if (!type || !question || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'type, question, and at least 2 options are required' },
        { status: 400 }
      );
    }

    const pollId = generateId();
    const now = new Date();
    const durationHours = duration || 24;
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const newPoll = {
      id: pollId,
      type,
      question,
      description: description || null,
      anonymous: anonymous ?? true,
      duration: durationHours,
      createdAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'active' as const,
      creatorId: null,
    };

    await db.insert(polls).values(newPoll);

    const optionRows = options.map((label: string, index: number) => ({
      id: generateId(),
      pollId,
      label,
      description: null,
      metadata: optionMetadata?.[index] || null,
      sortOrder: index,
    }));

    await db.insert(pollOptions).values(optionRows);

    const createdOptions = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId));

    return NextResponse.json({ ...newPoll, options: createdOptions }, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}
