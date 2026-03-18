import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;

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
        const pollRef = firestore.collection('polls').doc(pollId);

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
            label: data.label,
            sortOrder: data.sortOrder,
            voteCount,
            percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
          };
        });

        return { options, totalVotes };
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
