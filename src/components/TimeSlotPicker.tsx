interface TimeSlotPickerProps {
  availableTimes: string[]
  selectedTimes: string[]
  onToggle: (time: string) => void
}

const DEFAULT_TIMES = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
]

export { DEFAULT_TIMES }

export default function TimeSlotPicker({ availableTimes, selectedTimes, onToggle }: TimeSlotPickerProps) {
  const times = availableTimes.length > 0 ? availableTimes : DEFAULT_TIMES

  return (
    <div className="grid grid-cols-3 gap-2">
      {times.map((time) => {
        const isSelected = selectedTimes.includes(time)
        return (
          <button
            key={time}
            type="button"
            onClick={() => onToggle(time)}
            className={`rounded-xl py-2.5 text-sm font-medium transition-colors border ${
              isSelected
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            {time}
          </button>
        )
      })}
    </div>
  )
}
