"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, BarChart3, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatTimeAgo, formatTimeRemaining } from "@/lib/utils";

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

type FilterOption = "all" | "live" | "ended";

export default function ExplorePage() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");

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

  const filteredPolls = useMemo(() => {
    let result = polls;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.question.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (filter === "live") {
      result = result.filter((p) => isActive(p));
    } else if (filter === "ended") {
      result = result.filter((p) => !isActive(p));
    }

    return result;
  }, [polls, searchQuery, filter]);

  const handlePollClick = (poll: Poll) => {
    if (isActive(poll)) {
      router.push(`/poll/${poll.id}`);
    } else {
      router.push(`/poll/${poll.id}/results`);
    }
  };

  const filterOptions: { key: FilterOption; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "ended", label: "Ended" },
  ];

  return (
    <>
      <Header title="Explore" />
      <PageContainer>
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter chips */}
        <div className="mb-5 flex gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.key
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:bg-primary-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-text-secondary">Loading polls...</p>
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-3 h-10 w-10 text-text-muted" />
            <h2 className="mb-1 text-base font-semibold text-text">
              No polls found
            </h2>
            <p className="text-sm text-text-secondary">
              {searchQuery
                ? "Try a different search term"
                : "No polls match the selected filter"}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-text-muted">
              {filteredPolls.length} poll{filteredPolls.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-3">
              {filteredPolls.map((poll) => {
                const active = isActive(poll);
                return (
                  <Card key={poll.id} onClick={() => handlePollClick(poll)}>
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
