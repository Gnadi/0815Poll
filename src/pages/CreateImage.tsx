import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Lock, ImageIcon } from 'lucide-react'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Layout from '../components/Layout'
import Toggle from '../components/Toggle'
import Spinner from '../components/Spinner'
import ContactSelector from '../components/ContactSelector'
import { usePoll } from '../contexts/PollContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { nanoid } from '../lib/nanoid'
import { uploadPollImage } from '../lib/storage'
import type { Contact } from '../types'

const DURATION_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

interface ImageOption {
  id: string
  file: File | null
  previewUrl: string
  caption: string
}

export default function CreateImage() {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [imageOptions, setImageOptions] = useState<ImageOption[]>([
    { id: nanoid(), file: null, previewUrl: '', caption: '' },
    { id: nanoid(), file: null, previewUrl: '', caption: '' },
  ])
  const [anonymous, setAnonymous] = useState(true)
  const [isPrivate, setIsPrivate] = useState(true)
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

  const addOption = () => {
    if (imageOptions.length < 6) {
      setImageOptions([...imageOptions, { id: nanoid(), file: null, previewUrl: '', caption: '' }])
    }
  }

  const removeOption = (id: string) => {
    if (imageOptions.length <= 2) return
    setImageOptions(imageOptions.filter((o) => o.id !== id))
  }

  const handleFileChange = (id: string, file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('Only JPEG, PNG, and WEBP images are allowed.', 'error')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('Image must be under 5 MB.', 'error')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setImageOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, file, previewUrl } : o))
    )
  }

  const updateCaption = (id: string, caption: string) => {
    setImageOptions((prev) => prev.map((o) => (o.id === id ? { ...o, caption } : o)))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!question.trim()) errs.question = 'Question is required.'
    const filled = imageOptions.filter((o) => o.file !== null)
    if (filled.length < 2) errs.options = 'At least 2 images are required.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const filled = imageOptions.filter((o) => o.file !== null)

      // Step 1: Create poll document (images will be patched in after upload)
      const pollId = await createPoll({
        type: 'image',
        question: question.trim(),
        description: description.trim(),
        options: filled.map((o) => ({
          id: o.id,
          text: o.caption.trim(),
          votes: 0,
          imageUrl: '',
        })),
        isPrivate,
        settings: { anonymous, duration, allowMultipleChoices },
        createdBy: user?.uid || null,
        invitedContactEmails: invitedContacts.map((c) => c.email),
      })

      // Step 2: Upload images to Firebase Storage in parallel
      const uploaded = await Promise.all(
        filled.map(async (o) => ({
          id: o.id,
          text: o.caption.trim(),
          votes: 0,
          imageUrl: await uploadPollImage(o.file!, pollId, o.id),
        }))
      )

      // Step 3: Patch poll document with storage download URLs
      await updateDoc(doc(db, 'polls', pollId), { options: uploaded })

      showToast('Poll created!', 'success')
      navigate(`/poll/${pollId}`, { state: { contacts: invitedContacts } })
    } catch (err) {
      console.error('Image poll creation failed:', err)
      showToast('Failed to create poll. Check your Cloudinary configuration.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Create Image Poll" showBack>
      <div className="lg:max-w-2xl lg:mx-auto">
        <div className="hidden lg:block mb-6">
          <p className="text-gray-500 dark:text-gray-400">Upload photos as options and let your audience vote for their favorite.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Poll Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="e.g. Which photo do you like best?"
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

          {/* Image Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-800 dark:text-gray-100">Image Options</label>
              <span className="text-xs text-gray-400 dark:text-gray-500">Min. 2, max. 6 images</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {imageOptions.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                >
                  {imageOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/60 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[opt.id]?.click()}
                    className="w-full aspect-square flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {opt.previewUrl ? (
                      <img
                        src={opt.previewUrl}
                        alt={`Option ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <span className="text-xs font-medium">Tap to upload</span>
                        <span className="text-xs opacity-60">JPEG, PNG, WEBP · 5 MB max</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={(el) => { fileInputRefs.current[opt.id] = el }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileChange(opt.id, file)
                    }}
                  />

                  <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                    <input
                      type="text"
                      value={opt.caption}
                      onChange={(e) => updateCaption(opt.id, e.target.value)}
                      placeholder="Caption (optional)"
                      maxLength={80}
                      className="w-full text-xs outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            {errors.options && <p className="mt-1 text-xs text-red-500">{errors.options}</p>}
            {imageOptions.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-800 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Image
              </button>
            )}
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
                  description="Voters can select more than one image"
                />
              </div>
              <div className="px-4 py-4 flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <div className="flex-1">
                  <Toggle
                    checked={isPrivate}
                    onChange={setIsPrivate}
                    label="Private Poll"
                    description="Only people with the link can join"
                  />
                </div>
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
