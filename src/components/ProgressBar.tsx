interface ProgressBarProps {
  value: number // 0-100
  className?: string
}

export default function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-primary-100 ${className}`}>
      <div
        className="h-full rounded-full bg-primary-500 transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
