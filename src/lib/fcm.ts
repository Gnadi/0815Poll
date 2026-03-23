/**
 * Firebase Cloud Messaging (FCM) — Web Push Notifications
 *
 * FCM is completely free with no message limits.
 *
 * Setup required (one-time):
 * 1. Firebase Console → Project Settings → Cloud Messaging → Web Push Certificates
 *    → Generate key pair → copy the public key
 * 2. Add to .env.local:  VITE_FIREBASE_VAPID_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * 3. Deploy the Cloud Function in functions/index.ts to send messages via Admin SDK
 *
 * Flow:
 *   User grants permission → browser token stored in users/{uid}.fcmToken in Firestore
 *   Poll created → emails resolved to tokens → push_queue doc written
 *   Cloud Function triggers → FCM messages sent → push_queue doc deleted
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import app from './firebase'
import { updateUserFCMToken } from './firestore'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export function isFCMConfigured(): boolean {
  return !!VAPID_KEY
}

let messagingInstance: ReturnType<typeof getMessaging> | null = null

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }
  return messagingInstance
}

/**
 * Request notification permission, get FCM token and store in Firestore.
 * Safe to call on every login — silently skips if already granted or if not configured.
 */
export async function initFCM(userId: string): Promise<void> {
  if (!isFCMConfigured()) return
  if (!('Notification' in window)) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const messaging = getMessagingInstance()
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token) {
      await updateUserFCMToken(userId, token)
    }

    // Handle foreground messages (app tab is open)
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {}
      if (title && 'Notification' in window) {
        new Notification(title, { body: body || '' })
      }
    })
  } catch (err) {
    console.warn('[FCM] init failed:', err)
  }
}

/**
 * Collect FCM tokens for a list of user IDs (looked up from Firestore by email
 * in the calling layer). Returns only non-empty tokens.
 */
export function filterFCMTokens(
  users: Array<{ fcmToken?: string }>
): string[] {
  return users
    .map((u) => u.fcmToken)
    .filter((t): t is string => !!t)
}
