import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Upload } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import Layout from '../components/Layout'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import ContactSelector from '../components/ContactSelector'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { nanoid } from '../lib/nanoid'
import type { Contact } from '../types'

const DURATION_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

interface PhotoSlot {
  id: string
  file: File | null
  previewUrl: string
  caption: string
}

function createEmptySlot(): PhotoSlot {
  return { id: nanoid(), file: null, previewUrl: '', caption: '' }
}

export default function CreateImage() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<PhotoSlot[]>([createEmptySlot(), createEmptySlot()])
  const [anonymous, setAnonymous] = useState(true)
  const [duration, setDuration] = useState(24)
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false)
  const [invitedContacts, setInvitedContacts] = useState<Contact[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const { createPoll } = usePoll()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const addSlot = () => {
    if (photos.length < 10) setPhotos([...photos, createEmptySlot()])
  }

  const removeSlot = (id: string) => {
    if (photos.length <= 2) return
    setPhotos(photos.filter((p) => p.id !== id))
  }

  const updateCaption = (id: string, caption: string) => {
    setPhotos(photos.map((p) => (p.id === id ? { ...p, caption } : p)))
  }

  const handleFileChange = (id: string, file: File | null) => {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPhotos(photos.map((p) => (p.id === id ? { ...p, file, previewUrl } : p)))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    const filled = photos.filter((p) => p.file)
    if (filled.length < 2) errs.photos = 'At least 2 photos are required.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const filledPhotos = photos.filter((p) => p.file)

      // Upload all images to Firebase Storage in parallel
      const uploadedOptions = await Promise.all(
        filledPhotos.map(async (p) => {
          const storageRef = ref(storage, `poll-images/${nanoid(16)}`)
          await uploadBytes(storageRef, p.file!)
          const imageUrl = await getDownloadURL(storageRef)
          return {
            id: p.id,
            text: p.caption.trim() || `Option`,
            votes: 0,
            imageUrl,
          }
        })
      )

      const id = await createPoll({
        type: 'image',
        question: question.trim(),
        description: description.trim(),
        options: uploadedOptions,
        settings: { anonymous, duration, allowMultipleChoices },
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

  return (
    <Layout title="Create Poll" showBack>
      <div className="lg:max-w-2xl lg:mx-auto">
        <div className="hidden lg:block mb-6">
          <p className="text-gray-500 dark:text-gray-400">Upload photos and let your audience vote for their favorite.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Which photo do you prefer?"
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
            />
            {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add more context for your voters..."
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm outline-none focus:border-primary-400 resize-none"
            />
          </div>

          {/* Photo options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-800 dark:text-gray-100">Photo Options</label>
              <span className="text-xs text-gray-400 dark:text-gray-500">Min. 2 photos</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((slot) => (
                <div key={slot.id} className="relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                  {/* Remove button */}
                  {photos.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Photo preview / upload area */}
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slot.id]?.click()}
                    className="w-full h-32 flex flex-col items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative"
                  >
                    {slot.previewUrl ? (
                      <img
                        src={slot.previewUrl}
                        alt="preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">Upload photo</span>
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[slot.id] = el }}
                    onChange={(e) => handleFileChange(slot.id, e.target.files?.[0] ?? null)}
                  />

                  {/* Caption input */}
                  <div className="border-t border-gray-100 dark:border-gray-700 px-2 py-2">
                    <input
                      type="text"
                      value={slot.caption}
                      onChange={(e) => updateCaption(slot.id, e.target.value)}
                      placeholder="Caption (optional)"
                      className="w-full text-xs outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add photo button */}
              {photos.length < 10 && (
                <button
                  type="button"
                  onClick={addSlot}
                  className="rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-800 h-44 flex flex-col items-center justify-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add Photo
                </button>
              )}
            </div>
            {errors.photos && <p className="mt-2 text-xs text-red-500">{errors.photos}</p>}
          </div>

          {/* Settings */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Settings</label>
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              <div className="px-4 py-4">
                <Toggle
                  checked={anonymous}
                  onChange={setAnonymous}
                  label="Anonymous Results"
                  description="Hide voter identities"
                />
              </div>
              <div className="px-4 py-4">
                <Toggle
                  checked={allowMultipleChoices}
                  onChange={setAllowMultipleChoices}
                  label="Multiple Choice"
                  description="Voters can select more than one photo"
                />
              </div>
              <div className="px-4 py-4">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3 block">Poll Duration</span>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors border ${
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
          </div>

          {/* Invite contacts */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Invite Contacts <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></label>
            <ContactSelector selected={invitedContacts} onChange={setInvitedContacts} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Spinner size="sm" /> : 'Create Poll'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
