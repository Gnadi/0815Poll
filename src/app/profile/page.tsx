"use client";

import { useEffect, useState } from "react";
import { User, Github, Mail, Moon, Sun, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getVoterId } from "@/lib/utils";

interface Stats {
  pollsCreated: number;
  pollsVoted: number;
}

export default function ProfilePage() {
  const [voterId, setVoterId] = useState("");
  const [stats, setStats] = useState<Stats>({ pollsCreated: 0, pollsVoted: 0 });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const id = getVoterId();
    setVoterId(id);

    async function fetchStats() {
      try {
        const res = await fetch("/api/polls");
        if (!res.ok) return;
        const polls = await res.json();

        // Count polls created by this voter
        const created = polls.filter(
          (p: { creatorId: string | null }) => p.creatorId === id
        ).length;

        // Check each poll for votes by this voter
        let voted = 0;
        await Promise.all(
          polls.map(async (poll: { id: string }) => {
            try {
              const detailRes = await fetch(
                `/api/polls/${poll.id}?voterId=${id}`
              );
              if (detailRes.ok) {
                const data = await detailRes.json();
                if (data.userVotedOptionId) {
                  voted++;
                }
              }
            } catch {
              // ignore individual poll fetch errors
            }
          })
        );

        setStats({ pollsCreated: created, pollsVoted: voted });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <>
      <Header title="Profile" />
      <PageContainer>
        {/* User card */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text">
                Anonymous Voter
              </h2>
              <p className="mt-0.5 truncate text-xs font-mono text-text-muted">
                ID: {voterId ? voterId.slice(0, 8) : "--------"}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats section */}
        <h3 className="mb-3 text-sm font-semibold text-text">Your Activity</h3>
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Card>
            <div className="text-center">
              {loading ? (
                <div className="mx-auto mb-1 h-7 w-8 animate-pulse rounded bg-primary-50" />
              ) : (
                <p className="text-2xl font-bold text-primary">
                  {stats.pollsCreated}
                </p>
              )}
              <p className="text-xs text-text-muted">Polls Created</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              {loading ? (
                <div className="mx-auto mb-1 h-7 w-8 animate-pulse rounded bg-primary-50" />
              ) : (
                <p className="text-2xl font-bold text-primary">
                  {stats.pollsVoted}
                </p>
              )}
              <p className="text-xs text-text-muted">Polls Voted</p>
            </div>
          </Card>
        </div>

        {/* Sign in card */}
        <h3 className="mb-3 text-sm font-semibold text-text">Account</h3>
        <Card className="mb-6">
          <p className="mb-3 text-sm text-text-secondary">
            Sign in for more features
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
              disabled
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
              disabled
            >
              <Mail className="h-4 w-4" />
              Continue with Google
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-text-muted">
            Coming soon
          </p>
        </Card>

        {/* Settings section */}
        <h3 className="mb-3 text-sm font-semibold text-text">Settings</h3>
        <Card>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="h-5 w-5 text-text-secondary" />
              ) : (
                <Sun className="h-5 w-5 text-text-secondary" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-text">Theme</p>
                <p className="text-xs text-text-muted">
                  {darkMode ? "Dark mode" : "Light mode"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </Card>
      </PageContainer>
    </>
  );
}
