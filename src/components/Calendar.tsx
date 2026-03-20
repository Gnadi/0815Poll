import { useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarProps {
  selectedDates: string[]
  onToggleDate: (dateStr: string) => void
  minDate?: Date
}

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export default function Calendar({ selectedDates, onToggleDate, minDate }: CalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(new Date())
  const today = startOfDay(new Date())
  const min = minDate ? startOfDay(minDate) : today

  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {format(displayMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isCurrentMonth = isSameMonth(day, displayMonth)
          const isPast = isBefore(day, min)
          const isSelected = selectedDates.includes(dateStr)
          const isToday = isSameDay(day, today)

          return (
            <button
              key={dateStr}
              type="button"
              aria-label={format(day, 'EEEE, MMMM d, yyyy')}
              disabled={isPast || !isCurrentMonth}
              onClick={() => !isPast && isCurrentMonth && onToggleDate(dateStr)}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                !isCurrentMonth
                  ? 'invisible'
                  : isPast
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'bg-primary-500 text-white font-semibold'
                  : isToday
                  ? 'border-2 border-primary-300 text-primary-600 font-medium hover:bg-primary-50'
                  : 'text-gray-700 hover:bg-primary-50'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
