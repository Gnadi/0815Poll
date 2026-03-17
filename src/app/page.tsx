"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, BarChart3, Clock, Vote } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatTimeAgo, formatTimeRemaining, getVoterId } from "@/lib/utils";

interface Poll {
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

export default function HomePage() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolls() {
      try {
        const res = await fetch("/api/polls");
        if (res.ok) {
          const data = await res.json();
          setPolls(data);
        }
      } catch (err) {
        console.error("Failed to fetch polls:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPolls();
  }, []);

  const isActive = (poll: Poll) => {
    if (poll.status === "ended") return false;
    return new Date(poll.endsAt) > new Date();
  };

  const handlePollClick = (poll: Poll) => {
    if (isActive(poll)) {
      router.push(`/poll/${poll.id}`);
    } else {
      router.push(`/poll/${poll.id}/results`);
    }
  };

  return (
    <>
      <Header
        title="0815Poll"
        rightAction={
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-surface"
            aria-label="Search polls"
          >
            <Search className="h-5 w-5" />
          </button>
        }
      />
      <PageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-text-secondary">Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
              <Vote className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text">No polls yet</h2>
            <p className="mb-6 text-sm text-text-secondary">
              Create your first poll!
            </p>
            <Button onClick={() => router.push("/create")}>
              <Plus className="h-4 w-4" />
              Create Poll
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text">Your Polls</h2>
              <span className="text-xs text-text-muted">{polls.length} polls</span>
            </div>
            <div className="flex flex-col gap-3">
              {polls.map((poll) => {
                const active = isActive(poll);
                return (
                  <Card
                    key={poll.id}
                    onClick={() => handlePollClick(poll)}
                  >
                    <div className="flex items-start justify-between gap-3">
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
                            {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
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
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </PageContainer>

      {/* Floating create button */}
      {!loading && polls.length > 0 && (
        <button
          type="button"
          onClick={() => router.push("/create")}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
          aria-label="Create new poll"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
