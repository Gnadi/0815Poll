"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function Header({
  title,
  showBack = false,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="relative mx-auto flex h-14 max-w-lg items-center justify-center px-4 lg:max-w-2xl">
        {/* Left slot */}
        <div className="absolute left-4">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-surface"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Title */}
        <h1 className="truncate text-lg font-semibold text-text">{title}</h1>

        {/* Right slot */}
        <div className="absolute right-4">{rightAction}</div>
      </div>
    </header>
  );
}
