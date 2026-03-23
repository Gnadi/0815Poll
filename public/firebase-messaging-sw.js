/**
 * Firebase Cloud Messaging Service Worker
 *
 * This file MUST stay in the /public directory so it is served from the root URL.
 * It handles background push notifications when the app tab is not in focus.
 *
 * NOTE: Replace the firebaseConfig values below with your actual project config.
 * They must match VITE_FIREBASE_* variables in your .env.local.
 *
 * Required one-time setup:
 * 1. Firebase Console → Project Settings → Cloud Messaging → Generate VAPID key pair
 * 2. Add VITE_FIREBASE_VAPID_KEY to .env.local
 * 3. Deploy a Cloud Function (see functions/index.ts) to send messages from push_queue
 */

importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js')

// Replace with your actual Firebase config (same as VITE_FIREBASE_* env vars)
firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG_API_KEY || '',
  authDomain: self.__FIREBASE_CONFIG_AUTH_DOMAIN || '',
  projectId: self.__FIREBASE_CONFIG_PROJECT_ID || '',
  storageBucket: self.__FIREBASE_CONFIG_STORAGE_BUCKET || '',
  messagingSenderId: self.__FIREBASE_CONFIG_MESSAGING_SENDER_ID || '',
  appId: self.__FIREBASE_CONFIG_APP_ID || '',
})

const messaging = firebase.messaging()

// Handle background messages (app not in foreground)
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  if (!title) return

  self.registration.showNotification(title, {
    body: body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
  })
})

// Handle notification click — open the poll
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const pollId = event.notification.data?.pollId
  if (pollId) {
    event.waitUntil(
      clients.openWindow(`/poll/${pollId}`)
    )
  }
})
