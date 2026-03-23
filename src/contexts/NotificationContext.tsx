import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeToUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/firestore'
import type { AppNotification } from '../types'
import type { Unsubscribe } from 'firebase/firestore'

interface NotificationContextValue {
  unreadCount: number
  notifications: AppNotification[]
  loading: boolean
  markRead: (notifId: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  notifications: [],
  loading: false,
  markRead: async () => {},
  markAllRead: async () => {},
  refresh: async () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    // Real-time unread badge
    const unsub: Unsubscribe = subscribeToUnreadCount(user.uid, setUnreadCount)

    // Initial fetch of notification list
    setLoading(true)
    getNotifications(user.uid).then((items) => {
      setNotifications(items)
      setLoading(false)
    })

    return unsub
  }, [user])

  const refresh = async () => {
    if (!user) return
    setLoading(true)
    const items = await getNotifications(user.uid)
    setNotifications(items)
    setLoading(false)
  }

  const markRead = async (notifId: string) => {
    if (!user) return
    await markNotificationRead(user.uid, notifId)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    )
  }

  const markAllRead = async () => {
    if (!user) return
    await markAllNotificationsRead(user.uid)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <NotificationContext.Provider
      value={{ unreadCount, notifications, loading, markRead, markAllRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
