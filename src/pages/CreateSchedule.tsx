import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Layout from '../components/Layout'
import Calendar from '../components/Calendar'
import TimeSlotPicker, { DEFAULT_TIMES } from '../components/TimeSlotPicker'
import Spinner from '../components/Spinner'
import ContactSelector from '../components/ContactSelector'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { ChevronLeft, ChevronRight, Plus, Trash2, Info } from 'lucide-react'
import type { Contact } from '../types'

const DURATION_OPTIONS = [
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
  { label: '14 days', value: 336 },
]

interface SlotMap {
  [date: string]: string[]
}

export default function CreateSchedule() {
  const [step, setStep] = useState(1)
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(168)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [slotMap, setSlotMap] = useState<SlotMap>({})
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [invitedContacts, setInvitedContacts] = useState<Contact[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
    )
    if (!activeDate) setActiveDate(date)
  }

  const toggleTime = (date: string, time: string) => {
    setSlotMap((prev) => {
      const times = prev[date] || []
      return {
        ...prev,
        [date]: times.includes(time) ? times.filter((t) => t !== time) : [...times, time],
      }
    })
  }

  const applyToAll = (times: string[]) => {
    const newMap: SlotMap = {}
    selectedDates.forEach((d) => { newMap[d] = times })
    setSlotMap(newMap)
  }

  const removeSlot = (date: string, time: string) => {
    setSlotMap((prev) => ({
      ...prev,
      [date]: (prev[date] || []).filter((t) => t !== time),
    }))
  }

  const totalSlots = selectedDates.reduce((acc, d) => acc + (slotMap[d]?.length || 0), 0)

  // Flat list of selected slots for the right-column display
  const selectedSlots = selectedDates.flatMap((d) =>
    (slotMap[d] || []).map((time) => ({ date: d, time }))
  )

  const validateStep1 = (): Record<string, string> => {
    if (!question.trim()) return { question: 'Question is required.' }
    return {}
  }

  const validateStep2 = (): Record<string, string> => {
    if (selectedDates.length === 0) return { dates: 'Select at least one date.' }
    return {}
  }

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1()
      if (Object.keys(errs).length > 0) { setErrors(errs); return }
      setErrors({})
      setStep(2)
    } else if (step === 2) {
      const errs = validateStep2()
      if (Object.keys(errs).length > 0) { setErrors(errs); return }
      setErrors({})
      if (!activeDate && selectedDates.length > 0) setActiveDate(selectedDates[0])
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (totalSlots === 0) {
      showToast('Please select at least one time slot.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const timeSlots = selectedDates
        .filter((d) => (slotMap[d]?.length || 0) > 0)
        .map((date) => ({
          date,
          times: slotMap[date].sort(),
          votes: {},
        }))

      const id = await createPoll({
        type: 'schedule',
        question: question.trim(),
        description: description.trim(),
        timeSlots,
        settings: { anonymous: true, duration },
        createdBy: user?.uid || null,
        invitedContactEmails: invitedContacts.map((c) => c.email),
      })
      showToast('Poll created!', 'success')
      navigate(`/poll/${id}`, { state: { contacts: invitedContacts } })
    } catch {
      showToast('Failed to create poll. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDesktopSubmit = async () => {
    if (!question.trim()) {
      setErrors({ question: 'Event title is required.' })
      return
    }
    if (selectedDates.length === 0) {
      setErrors({ dates: 'Select at least one date.' })
      return
    }
    if (totalSlots === 0) {
      showToast('Please select at least one time slot.', 'error')
      return
    }
    setErrors({})
    await handleSubmit()
  }

  return (
    <Layout title="Create Scheduling Poll" showBack hideNav>
      {/* ── MOBILE: step-based flow ── */}
      <div className="lg:hidden">
        <div className="lg:max-w-2xl lg:mx-auto">
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Step {step} of 3</span>
              <span className="text-xs text-gray-400">
                {step === 1 ? 'Basic Info' : step === 2 ? 'Date Selection' : 'Time Slots'}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Event Title</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="When should we meet?"
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                />
                {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add context for your group..."
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                        duration === opt.value
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Select Dates</h3>
                <p className="text-sm text-gray-500 mb-4">Choose multiple dates for your meeting</p>
                <Calendar selectedDates={selectedDates} onToggleDate={toggleDate} />
              </div>
              {errors.dates && <p className="text-xs text-red-500">{errors.dates}</p>}
              {selectedDates.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Selected dates:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map((d) => (
                      <span key={d} className="rounded-lg bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700">
                        {format(new Date(d + 'T00:00:00'), 'MMM d')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Time Slots */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Select Time Slots</h3>
                <p className="text-sm text-gray-500 mb-4">Pick available times for each date</p>
              </div>

              {/* Date tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedDates.map((d) => {
                  const isActive = activeDate === d
                  const hasSlots = (slotMap[d]?.length || 0) > 0
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setActiveDate(d)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-center transition-colors border ${
                        isActive
                          ? 'bg-primary-500 text-white border-primary-500'
                          : hasSlots
                          ? 'bg-primary-50 text-primary-700 border-primary-200'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">
                        {format(new Date(d + 'T00:00:00'), 'EEE').toUpperCase()}
                      </div>
                      <div className="text-sm font-bold">
                        {format(new Date(d + 'T00:00:00'), 'd')}
                      </div>
                      <div className="text-xs">
                        {format(new Date(d + 'T00:00:00'), 'MMM').toUpperCase()}
                      </div>
                    </button>
                  )
                })}
              </div>

              {activeDate && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {format(new Date(activeDate + 'T00:00:00'), 'EEEE, MMMM d')}
                    </p>
                    <button
                      type="button"
                      onClick={() => applyToAll(slotMap[activeDate] || [])}
                      className="text-xs text-primary-600 font-medium"
                    >
                      Apply to all dates
                    </button>
                  </div>
                  <TimeSlotPicker
                    availableTimes={DEFAULT_TIMES}
                    selectedTimes={slotMap[activeDate] || []}
                    onToggle={(time) => toggleTime(activeDate, time)}
                  />
                </div>
              )}

              {/* Summary */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Selection Summary</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selectedDates.length} dates, {totalSlots} time slots
                  </span>
                  <div className="flex gap-1">
                    {selectedDates.map((d) => (
                      <span key={d} className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        (slotMap[d]?.length || 0) > 0 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {format(new Date(d + 'T00:00:00'), 'd')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-4 py-3">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Participants will be able to vote for their preferred time slots. Once everyone has voted, you can finalize the meeting.
                </p>
              </div>

              {/* Invite contacts */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Invite Contacts <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
                <ContactSelector selected={invitedContacts} onChange={setInvitedContacts} />
              </div>
            </div>
          )}

          {/* Mobile navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3.5 text-sm font-bold text-white hover:bg-primary-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || totalSlots === 0}
                className="flex flex-1 items-center justify-center rounded-2xl bg-primary-500 py-3.5 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {submitting ? <Spinner size="sm" /> : 'Create Poll'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP: two-column layout ── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">
        {/* Left column: title + calendar */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Event Title</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Q4 Strategy Sync or Team Happy Hour"
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400"
            />
            {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Select Dates</label>
            </div>
            {errors.dates && <p className="mb-2 text-xs text-red-500">{errors.dates}</p>}
            <Calendar selectedDates={selectedDates} onToggleDate={toggleDate} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                    duration === opt.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Invite Contacts <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
            <ContactSelector selected={invitedContacts} onChange={setInvitedContacts} />
          </div>
        </div>

        {/* Right column: time slots */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Suggested Time Slots</h3>

            {/* Selected slots list */}
            {selectedSlots.length > 0 ? (
              <div className="space-y-2 mb-3">
                {selectedSlots.map(({ date, time }) => {
                  const [startH, startM] = time.split(':').map(Number)
                  const endH = startH + 1
                  const fmt = (h: number, m: number) => {
                    const period = h >= 12 ? 'PM' : 'AM'
                    const h12 = h % 12 || 12
                    return `${h12}:${String(m).padStart(2, '0')} ${period}`
                  }
                  return (
                    <div key={`${date}-${time}`} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 min-w-[44px]">
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                          {format(new Date(date + 'T00:00:00'), 'MMM')}
                        </span>
                        <span className="text-lg font-bold text-primary-700 dark:text-primary-300 leading-none">
                          {format(new Date(date + 'T00:00:00'), 'd')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          {fmt(startH, startM)} – {fmt(endH, startM)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(date + 'T00:00:00'), 'EEEE')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(date, time)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Remove slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3 italic">
                Select dates on the calendar, then pick times below.
              </p>
            )}

            {/* Add time slot — show date tabs + picker when dates are selected */}
            {selectedDates.length > 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  <Plus className="h-4 w-4" />
                  Add Another Time Slot
                </div>

                {/* Date tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedDates.map((d) => {
                    const isActive = activeDate === d
                    const hasSlots = (slotMap[d]?.length || 0) > 0
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setActiveDate(d)}
                        className={`shrink-0 rounded-xl px-3 py-2 text-center transition-colors border ${
                          isActive
                            ? 'bg-primary-500 text-white border-primary-500'
                            : hasSlots
                            ? 'bg-primary-50 text-primary-700 border-primary-200'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">
                          {format(new Date(d + 'T00:00:00'), 'EEE').toUpperCase()}
                        </div>
                        <div className="text-sm font-bold">
                          {format(new Date(d + 'T00:00:00'), 'd')}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {activeDate && (
                  <TimeSlotPicker
                    availableTimes={DEFAULT_TIMES}
                    selectedTimes={slotMap[activeDate] || []}
                    onToggle={(time) => toggleTime(activeDate, time)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="flex gap-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-4 py-3">
            <Info className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Participants will be able to vote for their preferred time slots. Once everyone has voted, you can finalize the meeting.
            </p>
          </div>

          {/* Create Poll button */}
          <button
            type="button"
            onClick={handleDesktopSubmit}
            disabled={submitting}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Spinner size="sm" /> : (
              <>
                Create Poll
                <span>🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  )
}
