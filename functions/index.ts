/**
 * Firebase Cloud Functions — FCM Push Dispatcher
 *
 * This function triggers when a document is written to the `push_queue` collection.
 * It reads the FCM tokens, sends a push notification to each, then deletes the queue doc.
 *
 * Deployment:
 *   npm install -g firebase-tools
 *   firebase login
 *   firebase init functions   (select TypeScript, existing project)
 *   firebase deploy --only functions
 *
 * Firebase Spark (free) plan limits:
 *   2,000,000 invocations/month  — sufficient for any indie app
 *   400,000 GB-seconds compute
 *   FCM itself is always free, unlimited messages
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp()

export const dispatchPushNotifications = onDocumentCreated(
  'push_queue/{docId}',
  async (event) => {
    const data = event.data?.data()
    if (!data) return

    const { tokens, title, body, pollId } = data as {
      tokens: string[]
      title: string
      body: string
      pollId: string
    }

    if (!tokens || tokens.length === 0) {
      await event.data?.ref.delete()
      return
    }

    const messaging = getMessaging()

    // Send in batches of 500 (FCM limit per multicast call)
    const chunkSize = 500
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize)
      try {
        await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          data: { pollId },
          webpush: {
            notification: {
              title,
              body,
              icon: '/favicon.ico',
              click_action: `/poll/${pollId}`,
            },
          },
        })
      } catch (err) {
        console.error('[FCM] sendEachForMulticast failed:', err)
      }
    }

    // Clean up the queue document
    await event.data?.ref.delete()
  }
)
