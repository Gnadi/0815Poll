import { db, ensureDb } from '@/db';
import { pollOptions, votes } from '@/db/schema';

export const dynamic = 'force-dynamic';
import { eq, count } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  await ensureDb();

  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const getVoteCounts = async () => {
        const options = await db
          .select({
            id: pollOptions.id,
            label: pollOptions.label,
            sortOrder: pollOptions.sortOrder,
            voteCount: count(votes.id),
          })
          .from(pollOptions)
          .leftJoin(votes, eq(votes.optionId, pollOptions.id))
          .where(eq(pollOptions.pollId, pollId))
          .groupBy(pollOptions.id)
          .orderBy(pollOptions.sortOrder);

        const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

        return {
          options: options.map((opt) => ({
            ...opt,
            percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
          })),
          totalVotes,
        };
      };

      // Send initial data
      let lastSnapshot = JSON.stringify(await getVoteCounts());
      sendEvent(JSON.parse(lastSnapshot));

      // Poll for changes every 2 seconds
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const current = await getVoteCounts();
          const currentSnapshot = JSON.stringify(current);

          if (currentSnapshot !== lastSnapshot) {
            lastSnapshot = currentSnapshot;
            sendEvent(current);
          }
        } catch {
          closed = true;
          clearInterval(interval);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      }, 2000);

      // Clean up when the connection is aborted
      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
