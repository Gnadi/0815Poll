"use client";

type ProgressBarSize = "sm" | "md";

interface ProgressBarProps {
  percentage: number;
  color?: string;
  size?: ProgressBarSize;
  animated?: boolean;
  className?: string;
}

const sizeStyles: Record<ProgressBarSize, string> = {
  sm: "h-1.5",
  md: "h-3",
};

export default function ProgressBar({
  percentage,
  color = "bg-primary",
  size = "md",
  animated = false,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full rounded-full bg-primary-50 overflow-hidden ${sizeStyles[size]} ${className}`}
    >
      <div
        className={`
          h-full rounded-full ${color}
          transition-all duration-500 ease-out
          ${animated ? "animate-pulse" : ""}
        `}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
