import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Edit2, Check, X, Mail, Users } from 'lucide-react'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import { getContacts, addContact, updateContact, deleteContact } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import type { Contact } from '../types'

export default function Contacts() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getContacts(user.uid).then((c) => {
      setContacts(c)
      setLoading(false)
    })
  }, [user])

  const handleAdd = async () => {
    if (!user || !newName.trim() || !newEmail.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showToast('Please enter a valid email address.', 'error')
      return
    }
    setSaving(true)
    try {
      const created = await addContact(user.uid, {
        name: newName.trim(),
        email: newEmail.trim(),
      })
      setContacts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewEmail('')
      setShowAddForm(false)
      showToast('Contact added!', 'success')
    } catch {
      showToast('Failed to add contact.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (contact: Contact) => {
    setEditingId(contact.id)
    setEditName(contact.name)
    setEditEmail(contact.email)
  }

  const saveEdit = async (contactId: string) => {
    if (!user || !editName.trim() || !editEmail.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      showToast('Please enter a valid email address.', 'error')
      return
    }
    try {
      await updateContact(user.uid, contactId, {
        name: editName.trim(),
        email: editEmail.trim(),
      })
      setContacts((prev) =>
        prev
          .map((c) => (c.id === contactId ? { ...c, name: editName.trim(), email: editEmail.trim() } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
      showToast('Contact updated!', 'success')
    } catch {
      showToast('Failed to update contact.', 'error')
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!user) return
    try {
      await deleteContact(user.uid, contactId)
      setContacts((prev) => prev.filter((c) => c.id !== contactId))
      showToast('Contact removed.', 'info')
    } catch {
      showToast('Failed to remove contact.', 'error')
    }
  }

  if (!user) {
    return (
      <Layout title="Contacts">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Sign in to manage contacts</h2>
          <p className="text-sm text-gray-500 mb-6">Save contacts and invite them to your polls with one click.</p>
          <button
            onClick={() => navigate('/auth')}
            className="rounded-2xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Contacts">
      <div className="lg:max-w-2xl lg:mx-auto space-y-4">
        {/* Intro */}
        <p className="text-sm text-gray-500">
          Save contacts here and invite them to your polls — they'll receive an email with the voting link.
        </p>

        {/* Add contact button */}
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </button>
        )}

        {/* Add contact form */}
        {showAddForm && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800">New Contact</p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-400"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !newName.trim() || !newEmail.trim()}
                className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {saving ? <Spinner size="sm" /> : 'Save Contact'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail('') }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Contact list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No contacts yet.</p>
            <p className="text-xs text-gray-300 mt-1">Add your first contact above.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 overflow-hidden">
            {contacts.map((contact) => (
              <div key={contact.id} className="px-4 py-3">
                {editingId === contact.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(contact.id)}
                        className="flex items-center gap-1 rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-sm shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{contact.name}</p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(contact)}
                        className="text-gray-400 hover:text-primary-500 transition-colors"
                        aria-label="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(contact.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pb-2">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} saved
        </p>
      </div>
    </Layout>
  )
}
