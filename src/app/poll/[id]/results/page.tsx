"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  Trophy,
  Check,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { getVoterId, formatTimeAgo, formatTimeRemaining, cn } from "@/lib/utils";

interface PollOption {
  id: string;
  pollId: string;
  label: string;
  description: string | null;
  metadata: string | null;
  sortOrder: number;
  voteCount: number;
  percentage: number;
}

interface Poll {
  id: string;
  type: string;
  question: string;
  description: string | null;
  anonymous: boolean;
  duration: number;
  createdAt: string;
  endsAt: string;
  status: "active" | "ended";
  creatorId: string | null;
}

interface PollData {
  poll: Poll;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId: string | null;
}

export default function PollResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoll = useCallback(async () => {
    try {
      const voterId = getVoterId();
      const res = await fetch(`/api/polls/${id}?voterId=${voterId}`);
      if (!res.ok) throw new Error("Failed to fetch poll");
      const data: PollData = await res.json();
      setPollData(data);
      setError(null);
    } catch {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // SSE for live updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/polls/${id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          options: { id: string; label: string; sortOrder: number; voteCount: number; percentage: number }[];
          totalVotes: number;
        };
        setPollData((prev) => {
          if (!prev) return prev;
          const updatedOptions = prev.options.map((opt) => {
            const streamed = data.options.find((s) => s.id === opt.id);
            if (streamed) {
              return { ...opt, voteCount: streamed.voteCount, percentage: streamed.percentage };
            }
            return opt;
          });
          return { ...prev, options: updatedOptions, totalVotes: data.totalVotes };
        });
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [id]);

  const handleShare = async () => {
    const url = window.location.origin + `/poll/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: pollData?.poll.question, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Poll Results" showBack />
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error && !pollData) {
    return (
      <>
        <Header title="Poll Results" showBack />
        <PageContainer>
          <div className="text-center py-20 text-text-secondary">{error}</div>
        </PageContainer>
      </>
    );
  }

  if (!pollData) return null;

  const { poll, options, totalVotes, userVotedOptionId } = pollData;
  const isActive = poll.status === "active";

  // Sort by vote count descending to find winner and runner-up
  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0];
  const runnerUp = sorted.length > 1 ? sorted[1] : null;
  const leadMargin = runnerUp ? winner.percentage - runnerUp.percentage : winner.percentage;

  return (
    <>
      <Header
        title="Poll Results"
        showBack
        rightAction={
          <button
            type="button"
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-surface"
            aria-label="Share results"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />
      <PageContainer>
        {/* Status badge */}
        <div className="mb-4">
          {isActive ? (
            <Badge variant="success">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE RESULTS
            </Badge>
          ) : (
            <Badge variant="default">FINAL RESULTS</Badge>
          )}
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-text mb-1">{poll.question}</h2>

        {/* Subtext */}
        <p className="text-sm text-text-secondary mb-6">
          {isActive
            ? `Ends in ${formatTimeRemaining(poll.endsAt)}`
            : `Ended ${formatTimeAgo(poll.endsAt)}`}
          {" \u00B7 "}
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </p>

        {/* Winning option card */}
        {winner && totalVotes > 0 && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-accent p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-white/90" />
              <span className="text-xs font-semibold tracking-wider uppercase text-white/80">
                Winning Option
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{winner.label}</h3>
                {runnerUp && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                    +{leadMargin}% vs {runnerUp.label}
                  </span>
                )}
              </div>
              <span className="text-4xl font-extrabold">{winner.percentage}%</span>
            </div>
          </div>
        )}

        {/* Voting Distribution */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">
              Voting Distribution
            </h3>
            <button
              type="button"
              className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
              onClick={() => router.push(`/poll/${id}`)}
            >
              Detailed View
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {options.map((option) => {
              const isUserVote = userVotedOptionId === option.id;
              const isWinner = winner?.id === option.id && totalVotes > 0;

              return (
                <div key={option.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isUserVote && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isUserVote ? "text-primary" : "text-text"
                        )}
                      >
                        {option.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-text">
                      {option.percentage}%
                    </span>
                  </div>
                  <ProgressBar
                    percentage={option.percentage}
                    size="sm"
                    color={isWinner ? "bg-primary" : "bg-gray-300"}
                    animated={isActive}
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Insight card */}
        {winner && totalVotes > 0 && (
          <Card className="!bg-amber-50 !shadow-none">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-text mb-1">
                  Quick Insight
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {runnerUp
                    ? `Most voters prefer ${winner.label}. It leads by ${leadMargin}% over ${runnerUp.label}.`
                    : `${winner.label} is the clear favorite with ${winner.percentage}% of the votes.`}
                </p>
              </div>
            </div>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
