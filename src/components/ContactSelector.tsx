import { useEffect, useState } from 'react'
import { Users, Search, X, Check, UserPlus, Phone } from 'lucide-react'
import { getContacts, addContact } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import type { Contact } from '../types'

interface ContactSelectorProps {
  selected: Contact[]
  onChange: (contacts: Contact[]) => void
}

export default function ContactSelector({ selected, onChange }: ContactSelectorProps) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getContacts(user.uid).then((c) => {
      setContacts(c)
      setLoading(false)
    })
  }, [user])

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (contact: Contact) => {
    const isSelected = selected.some((s) => s.id === contact.id)
    onChange(isSelected ? selected.filter((s) => s.id !== contact.id) : [...selected, contact])
  }

  const handleAddContact = async () => {
    if (!user || !newName.trim() || !newEmail.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return
    setAdding(true)
    try {
      const created = await addContact(user.uid, {
        name: newName.trim(),
        email: newEmail.trim(),
        ...(newPhone.trim() ? { phone: newPhone.trim() } : {}),
      })
      setContacts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      onChange([...selected, created])
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setShowAddForm(false)
    } finally {
      setAdding(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
        Sign in to invite contacts to your poll.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-bold text-gray-800">Invite Contacts</span>
          {selected.length > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {selected.length} selected
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          <UserPlus className="h-3.5 w-3.5" />
          New contact
        </button>
      </div>

      {/* Inline add-contact form */}
      {showAddForm && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-3 space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400"
          />
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone number (optional, for SMS)"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddContact}
              disabled={adding || !newName.trim() || !newEmail.trim()}
              className="flex-1 rounded-xl bg-primary-500 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {adding ? 'Adding…' : 'Add & select'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {contacts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-primary-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Contact list */}
      {loading ? (
        <p className="text-center text-xs text-gray-400 py-4">Loading contacts…</p>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
          No contacts yet.
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="ml-1 text-primary-600 font-medium hover:underline"
          >
            Add your first contact
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-gray-400 py-3">No contacts match "{search}"</p>
      ) : (
        <div className="max-h-52 overflow-y-auto space-y-1 rounded-2xl border border-gray-100 bg-white p-1">
          {filtered.map((contact) => {
            const isSelected = selected.some((s) => s.id === contact.id)
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => toggle(contact)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 transition-colors ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                </div>
                {contact.phone && (
                  <Phone className="h-3.5 w-3.5 text-green-400 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}
