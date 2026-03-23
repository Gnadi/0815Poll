import { Mail, MessageSquare } from 'lucide-react'
import type { Contact } from '../types'

interface Props {
  contacts: Contact[]
  byEmail: boolean
  bySms: boolean
  onEmailChange: (v: boolean) => void
  onSmsChange: (v: boolean) => void
}

export default function NotifyMethodPicker({ contacts, byEmail, bySms, onEmailChange, onSmsChange }: Props) {
  if (contacts.length === 0) return null

  const smsCount = contacts.filter((c) => c.phone).length

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notify via</p>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={byEmail}
          onChange={(e) => onEmailChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-700">
          Email
          <span className="ml-1 text-xs text-gray-400">— {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
        </span>
      </label>
      {smsCount > 0 && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bySms}
            onChange={(e) => onSmsChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <MessageSquare className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm text-gray-700">
            SMS
            <span className="ml-1 text-xs text-gray-400">— {smsCount} contact{smsCount !== 1 ? 's' : ''} have a phone number</span>
          </span>
        </label>
      )}
    </div>
  )
}
