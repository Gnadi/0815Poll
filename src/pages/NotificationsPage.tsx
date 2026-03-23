import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, VoteIcon } from 'lucide-react'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import { useNotifications } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } =
    useNotifications()
  const navigate = useNavigate()

  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = async (notifId: string, pollId: string, read: boolean) => {
    if (!read) await markRead(notifId)
    navigate(`/poll/${pollId}`)
  }

  if (!user) {
    return (
      <Layout title="Notifications">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to see your notifications.</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 rounded-2xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Notifications"
      headerRight={
        unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        ) : undefined
      }
    >
      <div className="lg:max-w-2xl lg:mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              You'll be notified here when someone invites you to vote.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleClick(notif.id, notif.pollId, notif.read)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !notif.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    notif.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-100 dark:bg-primary-900/40'
                  }`}
                >
                  <VoteIcon
                    className={`h-4 w-4 ${notif.read ? 'text-gray-400 dark:text-gray-500' : 'text-primary-600 dark:text-primary-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      notif.read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-white'
                    }`}
                  >
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">"{notif.body}"</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                  </p>
                </div>
                {!notif.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
