"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { MoreHorizontal, Check, Circle, Users, Clock, Info } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { getVoterId, formatTimeRemaining, cn } from "@/lib/utils";

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

export default function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchPoll = useCallback(async () => {
    try {
      const voterId = getVoterId();
      const res = await fetch(`/api/polls/${id}?voterId=${voterId}`);
      if (!res.ok) throw new Error("Failed to fetch poll");
      const data: PollData = await res.json();
      setPollData(data);
      setError(null);
    } catch {
      setError("Failed to load poll");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/polls/${id}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          options: { id: string; label: string; sortOrder: number; voteCount: number; percentage: number }[];
          totalVotes: number;
        };
        setPollData((prev) => {
          if (!prev) return prev;
          // Merge SSE option data with existing full option data
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

  const handleVote = async (optionId: string) => {
    const voterId = getVoterId();
    setVotingOptionId(optionId);
    try {
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, voterId }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to vote");
      }
      // Re-fetch to get full updated data including userVotedOptionId
      await fetchPoll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setVotingOptionId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Cast Your Vote" showBack />
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
        <Header title="Cast Your Vote" showBack />
        <PageContainer>
          <div className="text-center py-20 text-text-secondary">{error}</div>
        </PageContainer>
      </>
    );
  }

  if (!pollData) return null;

  const { poll, options, totalVotes, userVotedOptionId } = pollData;
  const isActive = poll.status === "active";
  const hasVoted = !!userVotedOptionId;

  return (
    <>
      <Header
        title="Cast Your Vote"
        showBack
        rightAction={
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-surface"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        }
      />
      <PageContainer>
        {/* Status badge */}
        <div className="mb-4">
          {isActive ? (
            <Badge variant="success">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE NOW
            </Badge>
          ) : (
            <Badge variant="default">ENDED</Badge>
          )}
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-text mb-2">{poll.question}</h2>

        {/* Description */}
        {poll.description && (
          <p className="text-text-secondary text-sm mb-6">{poll.description}</p>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Vote options */}
        <div className="space-y-3 mb-6">
          {options.map((option) => {
            const isVotedOption = userVotedOptionId === option.id;
            const isVoting = votingOptionId === option.id;

            return (
              <Card
                key={option.id}
                className={cn(
                  "!p-4 transition-all",
                  isVotedOption && "ring-2 ring-primary ring-offset-1"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox circle */}
                  <div className="flex-shrink-0">
                    {isVotedOption ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300" />
                    )}
                  </div>

                  {/* Option content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          isVotedOption ? "text-primary" : "text-text"
                        )}
                      >
                        {option.label}
                      </span>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasVoted && (
                          <span className="text-sm font-semibold text-text">
                            {option.percentage}%
                          </span>
                        )}
                        {isVotedOption && (
                          <Badge variant="default">VOTED</Badge>
                        )}
                        {!isVotedOption && isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVote(option.id)}
                            loading={isVoting}
                            disabled={hasVoted || !!votingOptionId}
                          >
                            Vote
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar (shown after voting) */}
                    {hasVoted && (
                      <div className="mt-2">
                        <ProgressBar
                          percentage={option.percentage}
                          size="sm"
                          color={isVotedOption ? "bg-primary" : "bg-gray-300"}
                          animated={isActive}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Poll Statistics */}
        <Card className="!bg-primary-50 !shadow-none">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-text mb-1">
                Poll Statistics
              </h4>
              <p className="text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {totalVotes} {totalVotes === 1 ? "person has" : "people have"} voted.
                </span>
                {" "}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {isActive
                    ? `This poll ends in ${formatTimeRemaining(poll.endsAt)}.`
                    : "This poll has ended."}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </PageContainer>
    </>
  );
}
