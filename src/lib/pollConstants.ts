export interface DurationOption {
  label: string
  value: number // hours
}

export const DURATION_OPTIONS: DurationOption[] = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

export const LONG_DURATION_OPTIONS: DurationOption[] = DURATION_OPTIONS.filter(
  (d) => d.value >= 24
)

export const SCHEDULE_DURATION_OPTIONS: DurationOption[] = [
  ...LONG_DURATION_OPTIONS,
  { label: '14 days', value: 336 },
]
