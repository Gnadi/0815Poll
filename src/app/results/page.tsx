"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Clock, Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatTimeAgo, formatTimeRemaining, getVoterId } from "@/lib/utils";

interface PollOption {
  id: string;
  label: string;
  voteCount: number;
  percentage: number;
}

interface PollWithResults {
  id: string;
  type: string;
  question: string;
  description: string | null;
  status: string;
  createdAt: string;
  endsAt: string;
  totalVotes: number;
  topOption: PollOption | null;
}

interface PollListItem {
  id: string;
  type: string;
  question: string;
  description: string | null;
  status: string;
  createdAt: string;
  endsAt: string;
  creatorId: string | null;
  totalVotes: number;
}

const typeLabels: Record<string, string> = {
  standard: "Standard",
  schedule: "Schedule",
  location: "Location",
  custom: "Custom",
};

export default function ResultsPage() {
  const router = useRouter();
  const [pollsWithResults, setPollsWithResults] = useState<PollWithResults[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch("/api/polls");
        if (!res.ok) return;
        const allPolls: PollListItem[] = await res.json();

        const voterId = getVoterId();

        // Fetch details for each poll to get options and check if user voted
        const detailedPolls = await Promise.all(
          allPolls.map(async (poll) => {
            try {
              const detailRes = await fetch(
                `/api/polls/${poll.id}?voterId=${voterId}`
              );
              if (!detailRes.ok) return null;
              const data = await detailRes.json();

              const isEnded =
                data.poll.status === "ended" ||
                new Date(data.poll.endsAt) <= new Date();
              const hasVoted = !!data.userVotedOptionId;

              // Only show polls user voted on or that have ended
              if (!isEnded && !hasVoted) return null;

              // Find the top option
              const sortedOptions = [...data.options].sort(
                (a: PollOption, b: PollOption) => b.voteCount - a.voteCount
              );

              return {
                id: data.poll.id,
                type: data.poll.type,
                question: data.poll.question,
                description: data.poll.description,
                status: data.poll.status,
                createdAt: data.poll.createdAt,
                endsAt: data.poll.endsAt,
                totalVotes: data.totalVotes,
                topOption: sortedOptions[0] || null,
              } as PollWithResults;
            } catch {
              return null;
            }
          })
        );

        setPollsWithResults(
          detailedPolls.filter((p): p is PollWithResults => p !== null)
        );
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  const isActive = (poll: PollWithResults) => {
    if (poll.status === "ended") return false;
    return new Date(poll.endsAt) > new Date();
  };

  return (
    <>
      <Header title="Results" />
      <PageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-text-secondary">
              Loading results...
            </p>
          </div>
        ) : pollsWithResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text">
              No results yet
            </h2>
            <p className="text-sm text-text-secondary">
              Vote on polls to see results here
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-text-muted">
              {pollsWithResults.length} poll
              {pollsWithResults.length !== 1 ? "s" : ""} with results
            </p>
            <div className="flex flex-col gap-3">
              {pollsWithResults.map((poll) => {
                const active = isActive(poll);
                return (
                  <Card
                    key={poll.id}
                    onClick={() => router.push(`/poll/${poll.id}/results`)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="default">
                            {typeLabels[poll.type] || poll.type}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                active ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                            <span
                              className={
                                active
                                  ? "font-medium text-emerald-600"
                                  : "text-text-muted"
                              }
                            >
                              {active ? "Live" : "Ended"}
                            </span>
                          </span>
                        </div>
                        <h3 className="mb-1.5 truncate text-sm font-semibold text-text">
                          {poll.question}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3.5 w-3.5" />
                            {poll.totalVotes} vote
                            {poll.totalVotes !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {active
                              ? `Ends in ${formatTimeRemaining(poll.endsAt)}`
                              : `Ended ${formatTimeAgo(poll.endsAt)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mini result preview */}
                    {poll.topOption && (
                      <div className="rounded-xl bg-background p-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="truncate text-xs font-medium text-text">
                            {poll.topOption.label}
                          </span>
                          <span className="ml-2 shrink-0 text-xs font-semibold text-primary">
                            {poll.topOption.percentage}%
                          </span>
                        </div>
                        <ProgressBar
                          percentage={poll.topOption.percentage}
                          size="sm"
                          animated={active}
                        />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
