import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import MapPicker from '../components/MapPicker'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { nanoid } from '../lib/nanoid'
import type { LocationOption } from '../types'

const DURATION_OPTIONS = [
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

export default function CreateLocation() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [duration, setDuration] = useState(24)
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const addLocation = (loc: Omit<LocationOption, 'id' | 'votes'>) => {
    setLocations((prev) => [...prev, { ...loc, id: nanoid(), votes: 0 }])
  }

  const removeLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    if (locations.length < 2) errs.locations = 'Add at least 2 locations.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const id = await createPoll({
        type: 'location',
        question: question.trim(),
        description: description.trim(),
        locations,
        settings: { anonymous: true, duration, allowMultipleChoices },
        createdBy: user?.uid || null,
      })
      showToast('Location poll created!', 'success')
      navigate(`/poll/${id}`)
    } catch {
      showToast('Failed to create poll. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Create Location Poll" showBack>
      <div className="lg:max-w-4xl lg:mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left column - form fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Poll Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  placeholder="Where should we meet?"
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                />
                {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add context..."
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Poll Settings</label>
                <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 mb-4">
                  <div className="px-4 py-4">
                    <Toggle
                      checked={allowMultipleChoices}
                      onChange={setAllowMultipleChoices}
                      label="Multiple Choice"
                      description="Voters can select more than one location"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Poll Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                        duration === opt.value
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected locations list - desktop */}
              {locations.length > 0 && (
                <div className="hidden lg:block">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Selected Locations ({locations.length})</label>
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
                          <span className="text-amber-600 text-sm">📍</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{loc.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{loc.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column - map */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Locations
                <span className="ml-2 text-xs font-normal text-gray-400">Min. 2 locations</span>
              </label>
              <MapPicker locations={locations} onAddLocation={addLocation} onRemoveLocation={removeLocation} />
              {errors.locations && <p className="mt-1 text-xs text-red-500">{errors.locations}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50 lg:max-w-md lg:mx-auto lg:block"
          >
            {submitting ? <Spinner size="sm" /> : 'Create Poll'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
